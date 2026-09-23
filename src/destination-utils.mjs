export const CONTINENTS = ['亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲', '南极洲'];
const CONTINENT_NAMES = { AS: '亚洲', EU: '欧洲', AF: '非洲', NA: '北美洲', SA: '南美洲', OC: '大洋洲', AN: '南极洲' };
const SOUTH_AMERICA = new Set(['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'FK', 'GF', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE', 'GS']);
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
const countryEnglish = new Intl.DisplayNames(['en'], { type: 'region' });
export const foldSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function getContinent(item) {
  if (CONTINENT_NAMES[item?.continent]) return CONTINENT_NAMES[item.continent];
  const region = item?.region || item?.cities?.[0]?.region;
  if (region === '美洲') return SOUTH_AMERICA.has(item.countryCode) ? '南美洲' : '北美洲';
  return CONTINENTS.includes(region) ? region : '其他地区';
}
export function cityInitial(city) {
  const first = foldSearch(city?.nameEn || city?.name).trim().replace(/^[^\p{L}\p{N}]+/u, '').charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
}
export function compareCities(a, b) {
  const ai = cityInitial(a), bi = cityInitial(b);
  return (ai === '#') - (bi === '#') || collator.compare(a.nameEn || a.name, b.nameEn || b.name) || String(a.id || '').localeCompare(String(b.id || ''));
}
export function countryNameEn(code, fallback = '') {
  try { return countryEnglish.of(code) || fallback || code; } catch { return fallback || code; }
}
export function countryOptions(cities = []) {
  const groups = new Map();
  for (const city of cities) {
    if (!city.countryCode) continue;
    if (!groups.has(city.countryCode)) groups.set(city.countryCode, { countryCode: city.countryCode, name: city.country || city.countryCode, nameEn: city.countryEn || countryNameEn(city.countryCode), region: getContinent(city), cities: [] });
    groups.get(city.countryCode).cities.push(city);
  }
  return [...groups.values()].sort((a, b) => CONTINENTS.indexOf(a.region) - CONTINENTS.indexOf(b.region) || collator.compare(a.nameEn, b.nameEn));
}
export function groupedInitials(items, getInitial = cityInitial) {
  const groups = new Map();
  for (const item of items) {
    const initial = getInitial(item);
    if (!groups.has(initial)) groups.set(initial, []);
    groups.get(initial).push(item);
  }
  return [...groups].sort(([a], [b]) => (a === '#') - (b === '#') || a.localeCompare(b));
}
