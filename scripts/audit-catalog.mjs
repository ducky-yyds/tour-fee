import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRENCIES, REGIONS } from '../shared/currencies.mjs';
import { cardImage } from '../shared/media.mjs';
import { readExperienceEntries } from '../server/experience-catalog.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = resolve(ROOT, 'public');
const read = file => JSON.parse(readFileSync(resolve(ROOT, file), 'utf8').replace(/^\uFEFF/, ''));
const cities = read('data/cities.json'), guides = read('data/city-guides.json');
const fx = read('data/fx-reference.json'), media = read('data/media.json');
const experiences = readExperienceEntries(ROOT), foods = read('data/local-foods.json');
const cityIds = new Set(cities.map(city => city.id));
const problems = [], seen = new Set();
const experienceIds = new Set(experiences.map(place => place.id));
const STAYS_FILE = 'data/experience-expansion/stays-global.json';
const stays = existsSync(resolve(ROOT, STAYS_FILE)) ? read(STAYS_FILE) : [];
if (!existsSync(resolve(ROOT, STAYS_FILE))) problems.push(`Missing stay expansion: ${STAYS_FILE}`);

const IMAGE_GROUPS = ['cities', 'attractions', 'experiences', 'foods'];
const IMAGE_SCOPES = ['exact-place', 'nearby', 'illustration', 'existing-photo', 'unrecognized'];
const PHOTO_SCOPES = new Set(['exact-place', 'nearby', 'existing-photo']);
const newScopeCounts = () => Object.fromEntries(IMAGE_SCOPES.map(scope => [scope, 0]));
const newMediaSummary = () => ({
  entities: 0, cardsWithImage: 0, localImages: 0, remoteImagesUnverified: 0,
  photographs: 0, scopeCounts: newScopeCounts(), declaredScopeCounts: newScopeCounts(),
  missingImageIds: [], missingFileIds: [], unattributedImageIds: [],
});
const mediaCoverage = Object.fromEntries(['manifest', 'runtime'].map(view => [
  view, Object.fromEntries(IMAGE_GROUPS.map(group => [group, newMediaSummary()])),
]));
const fileChecks = new Map();
const missingFiles = new Map();

function imageScope(image) {
  if (!image.scope) return 'existing-photo';
  return IMAGE_SCOPES.includes(image.scope) ? image.scope : 'unrecognized';
}

// Check the catalog's public URL without silently replacing a broken entry.
function imageLocation(url) {
  if (fileChecks.has(url)) return fileChecks.get(url);
  let result;
  if (/^https?:\/\//i.test(url)) {
    result = { available: true, remote: true };
  } else if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
    try {
      const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
      const filename = resolve(PUBLIC, `.${pathname}`);
      const local = relative(PUBLIC, filename);
      if (local.startsWith('..') || isAbsolute(local)) {
        result = { available: false, local: true, reason: 'outside-public-directory' };
      } else {
        result = { available: existsSync(filename) && statSync(filename).isFile(), local: true };
        if (!result.available) result.reason = 'missing-local-file';
      }
    } catch {
      result = { available: false, local: true, reason: 'invalid-or-unreadable-local-path' };
    }
  } else {
    result = { available: false, reason: 'unsupported-image-url' };
  }
  fileChecks.set(url, result);
  return result;
}

function recordImage(view, group, entity, image) {
  const summary = mediaCoverage[view][group];
  summary.entities += 1;
  if (!image?.url) { summary.missingImageIds.push(entity.id); return; }
  const scope = imageScope(image);
  summary.declaredScopeCounts[scope] += 1;
  if (scope === 'unrecognized') problems.push(`Unknown image scope: ${view}/${group}/${entity.id}/${image.scope}`);
  const location = imageLocation(image.url);
  if (!location.available) {
    summary.missingImageIds.push(entity.id);
    summary.missingFileIds.push(entity.id);
    const failure = missingFiles.get(image.url) || { url: image.url, reason: location.reason, usedBy: [] };
    failure.usedBy.push({ view, group, id: entity.id });
    missingFiles.set(image.url, failure);
  } else {
    summary.cardsWithImage += 1;
    summary.scopeCounts[scope] += 1;
    if (location.local) summary.localImages += 1;
    if (location.remote) summary.remoteImagesUnverified += 1;
    if (PHOTO_SCOPES.has(scope)) summary.photographs += 1;
  }
  if (!image.credit || !image.license || !image.sourceUrl) {
    summary.unattributedImageIds.push(entity.id);
    problems.push(`Unattributed image: ${view}/${group}/${entity.id}`);
  }
}

function auditImage(group, entity, kind) {
  const manifest = (group === 'cities' ? media.cities : media.attractions)?.[entity.id];
  // Keep these resolution paths aligned with server/catalog.mjs.
  const runtime = group === 'cities' ? manifest || entity.image : cardImage(entity, media, kind);
  recordImage('manifest', group, entity, manifest);
  recordImage('runtime', group, entity, runtime);
}

const editorialLinks = new Set(), editorialHosts = new Set();
const editorialSourceCoverage = { entitiesWithReferences: 0, entitiesWithMultipleHosts: 0 };
function registerId(entity, label) {
  if (!entity.id || seen.has(entity.id)) problems.push(`Missing or duplicate ${label} ID: ${entity.id}`);
  seen.add(entity.id);
  if (entity.sourceReferences == null) return;
  if (!Array.isArray(entity.sourceReferences)) {
    problems.push(`Invalid source references: ${entity.id}`); return;
  }
  const hosts = new Set();
  for (const reference of entity.sourceReferences) {
    try {
      const url = new URL(reference.url);
      if (!['https:', 'http:'].includes(url.protocol) || !reference.name || !reference.kind || !reference.scope
          || !/^\d{4}-\d{2}-\d{2}$/.test(reference.checkedAt || '')) throw new Error('Incomplete reference');
      const host = url.hostname.replace(/^www\./, '');
      hosts.add(host); editorialHosts.add(host); editorialLinks.add(url.href);
    } catch { problems.push(`Invalid editorial reference: ${entity.id}/${reference?.url || '(missing URL)'}`); }
  }
  if (hosts.size) editorialSourceCoverage.entitiesWithReferences += 1;
  if (hosts.size > 1) editorialSourceCoverage.entitiesWithMultipleHosts += 1;
}

for (const city of cities) {
  registerId(city, 'city');
  if (!REGIONS.includes(city.region)) problems.push(`Unsupported region: ${city.id}/${city.region}`);
  if (!CURRENCIES[city.currency] || !(fx.rates[city.currency] > 0)) problems.push(`Missing currency: ${city.id}/${city.currency}`);
  if (!guides.some(guide => guide.cityId === city.id)) problems.push(`Missing guide: ${city.id}`);
  if (city.gatewayTransfer && (typeof city.gatewayTransfer !== 'object' || !Array.isArray(city.gatewayTransfer.values) || city.gatewayTransfer.values.length !== 3 || !city.gatewayTransfer.values.every(n => Number.isFinite(n) && n >= 0) || !(fx.rates[city.gatewayTransfer.currency] > 0))) problems.push(`Invalid gateway transfer budget: ${city.id}`);
  if (city.tripDuration && (![city.tripDuration.min, city.tripDuration.days, city.tripDuration.max].every(n => Number.isInteger(n) && n > 0 && n <= 365) || city.tripDuration.min > city.tripDuration.days || city.tripDuration.days > city.tripDuration.max)) problems.push(`Invalid stay recommendation: ${city.id}`);
  if (city.planningProfile && !['leisure', 'balanced'].includes(city.planningProfile)) problems.push(`Invalid planning profile: ${city.id}`);
  if (city.islandAccess && (!city.islandGroup || !['ferry', 'air'].includes(city.islandAccess))) problems.push(`Invalid island access: ${city.id}`);
  auditImage('cities', city);
  for (const attraction of city.attractions || []) {
    registerId(attraction, 'attraction');
    if (!Number.isFinite(attraction.lat) || !Number.isFinite(attraction.lng) || Math.abs(attraction.lat) > 90 || Math.abs(attraction.lng) > 180) problems.push(`Invalid coordinates: ${attraction.id}`);
    const price = attraction.price;
    // Unknown admission is supported, but is not a free or verified quote.
    if (!price || (price.type !== 'missing' && !price.missingPrice && !(Number.isFinite(price.low) && price.low >= 0 && Number.isFinite(price.high) && price.high >= price.low))) problems.push(`Invalid price: ${attraction.id}`);
    if (price?.type === 'official' && (!price.checkedAt || !price.sourceUrl)) problems.push(`Untraceable official price: ${attraction.id}`);
    auditImage('attractions', attraction);
  }
}

for (const place of experiences) {
  registerId(place, 'experience');
  if (!cityIds.has(place.cityId)) problems.push(`Unknown experience city: ${place.id}`);
  if (!Array.isArray(place.priceOptions) || !place.priceOptions.length) problems.push(`Missing experience options: ${place.id}`);
  for (const option of place.priceOptions || []) {
    if (!(fx.rates[option.currency] > 0)) problems.push(`Missing experience quote currency: ${place.id}/${option.id}`);
    if (!(Number.isFinite(option.low) && option.low >= 0 && Number.isFinite(option.high) && option.high >= option.low)) problems.push(`Invalid experience price: ${place.id}/${option.id}`);
    if (option.type === 'official' && (!option.checkedAt || !option.sourceUrl)) problems.push(`Untraceable experience quote: ${place.id}/${option.id}`);
    if ((place.priceBasis === 'city-daily-lodging' || option.priceBasis === 'city-daily-lodging') && (option.type !== 'estimate' || option.checkedAt != null || option.unit !== 'room-night')) problems.push(`City lodging allowance presented as a verified quote: ${place.id}/${option.id}`);
  }
  auditImage('experiences', place, place.kind);
}
for (const stay of stays) {
  if (stay.kind !== 'hotel' || !experienceIds.has(stay.id)) problems.push(`Stay expansion is not loaded as a hotel: ${stay.id}`);
}

const foodCities = new Set();
for (const food of foods) {
  registerId(food, 'food');
  if (!food.name || !food.localName || !food.description) problems.push(`Incomplete food: ${food.id}`);
  for (const cityId of food.cityIds || []) {
    foodCities.add(cityId);
    if (!cityIds.has(cityId)) problems.push(`Unknown food city: ${food.id}/${cityId}`);
  }
  auditImage('foods', food, 'food');
}

const perCity = cities.map(city => ({
  cityId: city.id, name: city.name,
  foods: foods.filter(food => food.cityIds?.includes(city.id)).length,
  hotels: experiences.filter(place => place.cityId === city.id && place.kind === 'hotel').length,
}));
const cityMinimumCoverage = {
  minimumMaintainedCities: 169, minimumFoodsPerCity: 5, minimumHotelsPerCity: 5,
  cities: cities.length, perCity,
  belowFoodMinimum: perCity.filter(city => city.foods < 5).map(city => city.cityId),
  belowHotelMinimum: perCity.filter(city => city.hotels < 5).map(city => city.cityId),
};
cityMinimumCoverage.complete = cities.length >= 169 && !cityMinimumCoverage.belowFoodMinimum.length && !cityMinimumCoverage.belowHotelMinimum.length;
if (cities.length < 169) problems.push(`Fewer than 169 maintained cities: ${cities.length}`);
for (const city of perCity) {
  if (city.foods < 5) problems.push(`Fewer than 5 foods: ${city.cityId}/${city.foods}`);
  if (city.hotels < 5) problems.push(`Fewer than 5 hotels: ${city.cityId}/${city.hotels}`);
}

const attractions = cities.flatMap(city => city.attractions || []);
const entitiesByGroup = { cities, attractions, experiences, foods };
const missingPhotos = Object.fromEntries(IMAGE_GROUPS.map(group => [group, entitiesByGroup[group].filter(entity => {
  const image = (group === 'cities' ? media.cities : media.attractions)?.[entity.id];
  return !image?.url || !imageLocation(image.url).available || !PHOTO_SCOPES.has(imageScope(image));
}).map(entity => entity.id)]));
const supplemental = attractions.filter(place => place.sourceProvider === 'openstreetmap');
const experienceCoverage = {
  places: experiences.length, cities: new Set(experiences.map(place => place.cityId)).size,
  options: experiences.reduce((sum, place) => sum + (place.priceOptions?.length || 0), 0),
  categories: Object.fromEntries(['restaurant', 'hotel', 'experience'].map(kind => [kind, experiences.filter(place => place.kind === kind).length])),
  missingCities: cities.filter(city => !experiences.some(place => place.cityId === city.id)).map(city => city.id),
  stayExpansion: { file: STAYS_FILE, loaded: stays.length, cities: new Set(stays.map(stay => stay.cityId)).size, cityBudgetReferences: stays.filter(stay => stay.priceBasis === 'city-daily-lodging').length },
};
const foodCoverage = {
  foods: foods.length, cities: foodCities.size,
  photos: mediaCoverage.manifest.foods.photographs, missingPhotos: missingPhotos.foods,
  cardsWithImage: mediaCoverage.runtime.foods.cardsWithImage,
  missingCardImages: mediaCoverage.runtime.foods.missingImageIds,
  dedicatedDishIllustrations: foods.filter(food => media.attractions?.[food.id]?.scope === 'illustration' && media.attractions[food.id].illustrationSubject === food.id && imageLocation(media.attractions[food.id].url).available).length,
  genericDishIllustrationIds: foods.filter(food => media.attractions?.[food.id]?.scope === 'illustration' && media.attractions[food.id].illustrationSubject !== food.id).map(food => food.id),
  awaitingDishPhoto: foods.filter(food => !food.photoFile && !media.attractions?.[food.id]?.subjectMatched && (food.photoStatus === 'needs-food-photo' || food.articleScope === 'ingredient')).map(food => food.id),
};
const placeLibraryCoverage = {
  places: supplemental.length,
  cities: cities.filter(city => city.attractions.some(place => place.sourceProvider === 'openstreetmap')).length,
  automaticNeighborhoods: supplemental.filter(place => place.automaticPlanning === true).length,
  missingPrices: supplemental.filter(place => place.price?.type === 'missing' || place.price?.missingPrice).length,
  complete: false,
  scope: 'At most 30 selected places within 6 km of each maintained destination reference center.',
};
const imageFileCoverage = {
  checkedLocalUrls: [...fileChecks.values()].filter(value => value.local).length,
  remoteUrlsNotFetched: [...fileChecks.values()].filter(value => value.remote).length,
  missing: [...missingFiles.values()],
};
for (const missing of imageFileCoverage.missing) problems.push(`Missing or invalid catalog image: ${missing.url} (${missing.reason})`);
const report = {
  checkedAt: new Date().toISOString(), schemaVersion: 2,
  cities: cities.length, countriesAndRegions: new Set(cities.map(city => city.countryCode)).size,
  attractions: attractions.length, currencies: Object.keys(CURRENCIES).length, fxAsOf: fx.asOf,
  photos: Object.fromEntries(IMAGE_GROUPS.map(group => [group, mediaCoverage.manifest[group].photographs])),
  missingPhotos, mediaCoverage, imageFileCoverage, cityMinimumCoverage,
  experienceCoverage, foodCoverage, placeLibraryCoverage,
  editorialSourceCoverage: { ...editorialSourceCoverage, uniqueLinks: editorialLinks.size,
    hosts: [...editorialHosts].sort(),
    note: 'Stored reading references and distinct hostnames; this validates metadata only, not live availability, independent ownership or current prices.' },
  mediaCountingNotes: [
    'Counts describe entity cards, not unique downloaded files; one illustration or reference photograph can serve multiple cards.',
    'Manifest coverage only uses the entry under the entity ID. Runtime coverage uses the same cardImage resolution as the catalog, including inline images, nearby references and illustrations.',
    'exact-place, nearby and legacy existing-photo are photographs; illustration is never included in photos. Missing scope means existing-photo, not a newly verified exact-place photograph.',
    'A food marked needs-food-photo can have a visible illustration. awaitingDishPhoto is separate from missingCardImages.',
    'Local image URLs are checked against public files. Remote URLs are recorded without fetching and their current availability is unverified.',
  ],
  problems: [...new Set(problems)],
};
writeFileSync(resolve(ROOT, 'data/catalog-coverage.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.problems.length) process.exitCode = 1;
