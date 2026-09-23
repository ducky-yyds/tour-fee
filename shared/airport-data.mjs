/** OurAirports ingestion primitives. Source coordinates describe airports, not city centres. */
export const AIRPORT_SOURCE = Object.freeze({
  name: 'OurAirports',
  url: 'https://ourairports.com/data/',
  license: 'Public domain',
  licenseUrl: 'https://ourairports.com/data/',
});
export const ACTIVE_AIRPORT_TYPES = new Set(['large_airport', 'medium_airport', 'small_airport', 'seaplane_base']);
const REGIONS = { AS: '亚洲', EU: '欧洲', AF: '非洲', NA: '美洲', SA: '美洲', OC: '大洋洲', AN: '南极洲' };

/** RFC 4180 fields, including quoted newlines, escaped quotes, CRLF and a UTF-8 BOM. */
export function parseCsv(text) {
  const input = String(text).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false, closedQuote = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closedQuote = true; }
      else field += char;
    } else if (char === '"') {
      if (field || closedQuote) throw new Error('Unexpected quote in CSV field');
      quoted = true;
    } else if (char === ',') {
      row.push(field); field = ''; closedQuote = false;
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(field);
      if (row.some(value => value !== '')) rows.push(row);
      row = []; field = ''; closedQuote = false;
    } else {
      if (closedQuote) throw new Error('Unexpected characters after quoted CSV field');
      field += char;
    }
  }
  if (quoted) throw new Error('Unterminated quoted CSV field');
  if (field || row.length || closedQuote) { row.push(field); rows.push(row); }
  const headers = rows.shift();
  if (!headers?.length || new Set(headers).size !== headers.length) throw new Error('Missing or duplicate CSV headers');
  return rows.map((values, index) => {
    if (values.length !== headers.length) throw new Error(`CSV row ${index + 2}: expected ${headers.length} fields, received ${values.length}`);
    return Object.fromEntries(headers.map((header, i) => [header, values[i]]));
  });
}

export function normalizedMunicipality(value) {
  return String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

// US municipalities often share their name across several states. A source
// name alone must not turn Portland, Maine into the Oregon destination.
export function compatibleCuratedAirport(city, airport) {
  if (!city || city.countryCode !== airport.countryCode) return false;
  if (city.countryCode !== 'US') return true;
  if (city.isoRegion && airport.isoRegion && city.isoRegion !== airport.isoRegion) return false;
  if (![city.lat, city.lng, airport.lat, airport.lng].every(Number.isFinite)) return false;
  const radians = Math.PI / 180;
  const h = Math.sin((city.lat - airport.lat) * radians / 2) ** 2
    + Math.cos(city.lat * radians) * Math.cos(airport.lat * radians)
    * Math.sin((city.lng - airport.lng) * radians / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, h))) <= 120;
}

/** Resolve existing airport municipality IDs without replacing their identity.
 * Only reviewed airport links and compatible exact municipality names qualify;
 * a destination's preferred gateway alone is not a municipality relationship.
 */
export function createCuratedAirportResolver(curatedCities = [], links = [], { strictLinks = false } = {}) {
  const byId = new Map(curatedCities.map(city => [city.id, city]));
  const byName = new Map();
  for (const city of curatedCities) {
    for (const name of new Set([city.nameEn, city.name].map(normalizedMunicipality).filter(Boolean))) {
      const key = `${city.countryCode}|${name}`;
      const candidates = byName.get(key) || [];
      candidates.push(city);
      byName.set(key, candidates);
    }
  }
  const reviewed = new Map();
  for (const link of links) {
    const city = byId.get(link.cityId);
    if (!city) {
      if (strictLinks) throw new Error(`Airport link references unknown city: ${link.cityId}`);
      continue;
    }
    for (const code of link.airportCodes || []) {
      const key = `${city.countryCode}|${code}`;
      if (reviewed.has(key) && reviewed.get(key) !== city.id) throw new Error(`Conflicting curated airport link: ${key}`);
      reviewed.set(key, city.id);
    }
  }
  return airport => {
    if (!airport) return null;
    const codes = new Set([...(airport.airportCodes || []), airport.iata].filter(Boolean));
    const explicit = [...new Set([...codes].map(code => reviewed.get(`${airport.countryCode}|${code}`)).filter(Boolean))];
    if (explicit.length > 1) throw new Error(`Multiple curated cities linked to one airport municipality: ${airport.id}`);
    if (explicit.length) return explicit[0];
    const previous = byId.get(airport.curatedCityId);
    if (compatibleCuratedAirport(previous, airport)) return previous.id;
    const municipality = airport.municipality || (airport.nameKind === 'municipality' ? airport.nameEn || airport.name : '');
    if (!municipality) return null;
    const candidates = byName.get(`${airport.countryCode}|${normalizedMunicipality(municipality)}`) || [];
    const compatible = candidates.filter(city => compatibleCuratedAirport(city, airport));
    // Ambiguous same-country names stay independent, including US towns that
    // share a name but lie in a different state or beyond the distance guard.
    return compatible.length === 1 ? compatible[0].id : null;
  };
}

function hash(value) {
  let result = 2166136261;
  for (const point of String(value)) { result ^= point.codePointAt(0); result = Math.imul(result, 16777619); }
  return (result >>> 0).toString(36);
}
export function airportCityId(countryCode, isoRegion, municipality, airportIdent = '') {
  const municipalityKey = normalizedMunicipality(municipality);
  const key = [countryCode, isoRegion, municipalityKey || `airport:${airportIdent}`].join('|');
  const slug = (municipalityKey || `airport-${airportIdent}`).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 46) || 'place';
  return `aircity-${String(countryCode).toLowerCase()}-${slug}-${hash(key)}`;
}
const number = value => value !== '' && value != null && Number.isFinite(Number(value)) ? Number(value) : null;
const validCoordinate = (lat, lng) => lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
const order = airport => (airport.scheduledService ? 100 : 0) + ({ large_airport: 40, medium_airport: 30, small_airport: 20, seaplane_base: 10 }[airport.type] || 0) + (airport.iata ? 1 : 0);
function publicUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}

export function buildAirportCatalog({ airportRows, countryRows, regionRows = [], curatedCities = [], links = [], checkedAt = new Date().toISOString() }) {
  const countryByCode = new Map(countryRows.map(row => [row.code, row]));
  const regionByCode = new Map(regionRows.map(row => [row.code, row]));
  const countryNames = new Intl.DisplayNames(['zh-CN'], { type: 'region' });
  const resolveCuratedCity = createCuratedAirportResolver(curatedCities, links, { strictLinks: true });
  const counts = { sourceAirports: airportRows.length, includedAirports: 0, airportCities: 0, scheduledAirports: 0, scheduledCities: 0, countries: 0, citiesWithoutMunicipality: 0, airportsWithoutValidCoordinates: 0, curatedLinkedCities: 0, types: {}, excludedTypes: {} };
  const airports = [], grouped = new Map(), airportIds = new Set(), identities = new Map();
  for (const row of airportRows) {
    counts.types[row.type] = (counts.types[row.type] || 0) + 1;
    if (!ACTIVE_AIRPORT_TYPES.has(row.type)) { counts.excludedTypes[row.type] = (counts.excludedTypes[row.type] || 0) + 1; continue; }
    if (!/^\d+$/.test(row.id) || !row.ident || !row.name || !countryByCode.has(row.iso_country)) throw new Error(`Invalid active airport identity: ${row.id}`);
    const id = `airport-${row.id}`;
    if (airportIds.has(id)) throw new Error(`Duplicate airport identity: ${id}`);
    airportIds.add(id);
    const lat = number(row.latitude_deg), lng = number(row.longitude_deg);
    const municipality = row.municipality?.trim() || '';
    const airport = {
      id, ident: row.ident, name: row.name, municipality, countryCode: row.iso_country, isoRegion: row.iso_region,
      regionName: regionByCode.get(row.iso_region)?.name || row.iso_region,
      type: row.type, lat: validCoordinate(lat, lng) ? lat : null, lng: validCoordinate(lat, lng) ? lng : null,
      elevationFeet: number(row.elevation_ft), iata: row.iata_code || null, icao: row.icao_code || null,
      scheduledService: row.scheduled_service === 'yes', homeUrl: publicUrl(row.home_link),
      sourceUrl: `https://ourairports.com/airports/${encodeURIComponent(row.ident)}/`, sourceCheckedAt: checkedAt,
      wikipediaUrl: publicUrl(row.wikipedia_link), cityId: null,
    };
    airports.push(airport);
    if (!validCoordinate(lat, lng)) { counts.airportsWithoutValidCoordinates++; continue; }
    const cityId = airportCityId(row.iso_country, row.iso_region, municipality, row.id);
    const identity = `${row.iso_country}|${row.iso_region}|${normalizedMunicipality(municipality) || row.id}`;
    if (identities.has(cityId) && identities.get(cityId) !== identity) throw new Error(`Airport city identity collision: ${cityId}`);
    identities.set(cityId, identity);
    airport.cityId = cityId;
    if (!grouped.has(cityId)) grouped.set(cityId, []);
    grouped.get(cityId).push(airport);
  }
  const cities = [...grouped].map(([id, members]) => {
    members.sort((a, b) => order(b) - order(a) || a.id.localeCompare(b.id));
    const primary = members[0], country = countryByCode.get(primary.countryCode);
    let countryName;
    try { countryName = countryNames.of(primary.countryCode); } catch { countryName = country.name; }
    if (countryName === primary.countryCode) countryName = country.name;
    const city = {
      id, name: primary.municipality || primary.name, nameEn: primary.municipality || primary.name,
      nameKind: primary.municipality ? 'municipality' : 'airport', country: countryName || country.name,
      countryEn: country.name, countryCode: primary.countryCode, isoRegion: primary.isoRegion,
      subdivision: primary.regionName, region: REGIONS[country.continent] || '其他地区', continent: country.continent,
      lat: primary.lat, lng: primary.lng, iata: primary.iata, airportIds: members.map(airport => airport.id),
      airportCodes: [...new Set(members.map(airport => airport.iata).filter(Boolean))],
      scheduledService: members.some(airport => airport.scheduledService), coverage: 'airport-only',
      sourceUrl: primary.sourceUrl, sourceCheckedAt: checkedAt, coordinateBasis: 'airport', curatedCityId: null,
    };
    city.curatedCityId = resolveCuratedCity(city);
    if (!primary.municipality) counts.citiesWithoutMunicipality++;
    if (city.curatedCityId) counts.curatedLinkedCities++;
    return city;
  }).sort((a, b) => a.countryCode.localeCompare(b.countryCode) || a.nameEn.localeCompare(b.nameEn) || a.id.localeCompare(b.id));
  airports.sort((a, b) => a.id.localeCompare(b.id));
  Object.assign(counts, {
    includedAirports: airports.length, airportCities: cities.length,
    scheduledAirports: airports.filter(airport => airport.scheduledService).length,
    scheduledCities: cities.filter(city => city.scheduledService).length,
    countries: new Set(cities.map(city => city.countryCode)).size,
  });
  const metadata = { version: 1, generatedAt: checkedAt, source: { ...AIRPORT_SOURCE, checkedAt } };
  return { airports: { ...metadata, airports }, cities: { ...metadata, cities }, counts };
}
