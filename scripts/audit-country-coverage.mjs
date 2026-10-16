import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';
import { geoArea } from 'd3-geo';
import { ISO2_TO_NUMERIC } from '../shared/country-codes.mjs';
import { readExperienceEntries } from '../server/experience-catalog.mjs';
import { cardImage } from '../shared/media.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(readFileSync(resolve(root, name), 'utf8').replace(/^\uFEFF/, ''));
const cities = read('data/cities.json');
const foods = read('data/local-foods.json');
const experiences = readExperienceEntries(root);
const media = read('data/media.json');
const topology = read('public/maps/countries-110m.json');
const numericToISO = new Map(Object.entries(ISO2_TO_NUMERIC).map(([code, numeric]) => [numeric, code]));
const thresholdKm2 = 100_000;
const targets = new Map();
for (const area of feature(topology, topology.objects.countries).features) {
  const countryCode = numericToISO.get(String(area.id).padStart(3, '0'));
  const approximateAreaKm2 = Math.round(geoArea(area) * 6371.0088 ** 2);
  if (!countryCode || countryCode === 'AQ' || approximateAreaKm2 < thresholdKm2) continue;
  targets.set(countryCode, { countryCode, nameEn: area.properties?.name, approximateAreaKm2, basis: 'bundled-map-geometry' });
}
// Small-scale polygons omit water and generalize/dispute boundaries. These
// published areas prevent false exclusions near the threshold or partition line.
for (const row of [
  { countryCode: 'LR', nameEn: 'Liberia', publishedAreaKm2: 111370, sourceUrl: 'https://data.worldbank.org/indicator/AG.SRF.TOTL.K2?locations=LR', basis: 'published-surface-area' },
  { countryCode: 'KR', nameEn: 'South Korea', publishedAreaKm2: 100450, sourceUrl: 'https://data.worldbank.org/indicator/AG.SRF.TOTL.K2?locations=KR', basis: 'published-surface-area' },
  { countryCode: 'EH', nameEn: 'Western Sahara', publishedAreaKm2: 266000, sourceUrl: 'https://www.un.org/dppa/decolonization/en/nsgt/western-sahara', basis: 'published-territory-area' },
]) targets.set(row.countryCode, row);

const perCity = cities.map(city => {
  const rows = experiences.filter(item => item.cityId === city.id);
  const counts = { sights: city.attractions.length, experiences: rows.filter(item => item.kind === 'experience').length, foods: foods.filter(food => food.cityIds?.includes(city.id)).length, hotels: rows.filter(item => item.kind === 'hotel').length };
  return { cityId: city.id, name: city.name, countryCode: city.countryCode, ...counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
});
const countries = [...targets.values()].sort((a, b) => a.countryCode.localeCompare(b.countryCode)).map(row => ({
  ...row, cities: perCity.filter(city => city.countryCode === row.countryCode).map(city => city.cityId),
}));
const batchFiles = readdirSync(resolve(root, 'data/expansion')).filter(name => /^country-fill-.*-20261016\.json$/.test(name));
const newIds = new Set(batchFiles.flatMap(name => read(`data/expansion/${name}`).map(city => city.id)));
const added = perCity.filter(city => newIds.has(city.cityId));
const newEntities = [
  ...cities.filter(city => newIds.has(city.id)).flatMap(city => city.attractions.map(item => ({ item, kind: 'place' }))),
  ...experiences.filter(item => newIds.has(item.cityId)).map(item => ({ item, kind: item.kind })),
  ...foods.filter(item => item.cityIds?.some(id => newIds.has(id))).map(item => ({ item, kind: 'food' })),
];
const photographCoverage = Object.fromEntries(['place', 'experience', 'food', 'hotel'].map(kind => {
  const rows = newEntities.filter(row => row.kind === kind);
  const matched = rows.filter(({ item }) => { const image = cardImage(item, media, kind); return image?.url && image.scope !== 'illustration'; });
  return [kind, { total: rows.length, photographs: matched.length, pending: rows.length - matched.length }];
}));
const problems = countries.filter(row => !row.cities.length).map(row => `Missing country/region: ${row.countryCode}`);
for (const row of added) {
  if (row.sights + row.experiences < 10 || row.sights + row.experiences + row.foods < 15 || row.experiences < 3 || row.foods < 5 || row.hotels < 5) problems.push(`Incomplete new city: ${row.cityId}`);
  const city = cities.find(city => city.id === row.cityId);
  if (!city.sourceReferences?.length || !city.tripDuration || !city.budgetBasis?.note) problems.push(`Missing editorial basis: ${row.cityId}`);
  if (!(media.cities?.[row.cityId]?.url || city.image?.url)) problems.push(`Missing city cover: ${row.cityId}`);
  if (city.travelAdvisory && (!/^https:\/\//.test(city.travelAdvisory.url || '') || !city.travelAdvisory.note)) problems.push(`Incomplete travel advisory: ${row.cityId}`);
}
const report = {
  checkedAt: new Date().toISOString(), thresholdKm2,
  scope: 'Large ISO countries and regions, excluding Antarctica; small-scale map geometry supplemented with published Liberia, South Korea and Western Sahara areas. Geographic inventory, not a recommendation or assertion of current travel access.',
  mapSource: 'https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/',
  targetCountriesAndRegions: countries.length, coveredTargets: countries.filter(row => row.cities.length).length,
  totalCities: cities.length, totalCountriesAndRegions: new Set(cities.map(city => city.countryCode)).size,
  addedCities: added.length, addedEntries: added.reduce((n, row) => n + row.total, 0),
  photographCoverage, countries, added, problems,
};
writeFileSync(resolve(root, 'data/country-coverage-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ targets: report.targetCountriesAndRegions, covered: report.coveredTargets, cities: report.totalCities, countriesAndRegions: report.totalCountriesAndRegions, addedCities: report.addedCities, addedEntries: report.addedEntries, problems }, null, 2));
if (problems.length) process.exitCode = 1;
