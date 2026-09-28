import { pinyin } from 'pinyin-pro';

export const CONTINENTS = ['亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲', '南极洲'];
const CONTINENT_NAMES = { AS: '亚洲', EU: '欧洲', AF: '非洲', NA: '北美洲', SA: '南美洲', OC: '大洋洲', AN: '南极洲' };
const SOUTH_AMERICA = new Set(['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'FK', 'GF', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE', 'GS']);
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
const countryEnglish = new Intl.DisplayNames(['en'], { type: 'region' });
const pinyinCache = new Map();
const searchCache = new WeakMap();
// Place-name readings are explicit; a character's general reading can be wrong here.
const PLACE_READINGS = {
  '重庆': 'chong qing', '长沙': 'chang sha', '长春': 'chang chun', '长治': 'chang zhi',
  '长乐': 'chang le', '长白山': 'chang bai shan', '厦门': 'xia men', '六安': 'lu an',
  '乐山': 'le shan', '乐清': 'yue qing', '乐亭': 'lao ting', '蚌埠': 'beng bu',
  '亳州': 'bo zhou', '儋州': 'dan zhou', '丽水': 'li shui', '丽江': 'li jiang',
  '济南': 'ji nan', '济宁': 'ji ning', '济源': 'ji yuan', '都江堰': 'du jiang yan',
  '柏林': 'bo lin', '都柏林': 'du bo lin', '秘鲁': 'bi lu', '老挝': 'lao wo',
  '宿务': 'su wu', '查尔斯顿': 'cha er si dun', '札幌': 'zha huang', '槟城': 'bin cheng',
  '京都': 'jing du', '加德满都': 'jia de man du', '马拉喀什': 'ma la ka shi', '纳什维尔': 'na shi wei er',
};

export const foldSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const compactSearch = value => foldSearch(value).replace(/[^\p{L}\p{N}]/gu, '');

export function namePinyin(value) {
  const name = String(value || '').trim();
  if (!pinyinCache.has(name)) {
    const words = PLACE_READINGS[name]?.split(' ') || pinyin(name, { toneType: 'none', type: 'array' });
    const syllables = words.map(word => compactSearch(word)).filter(Boolean);
    pinyinCache.set(name, { full: syllables.join(''), spaced: syllables.join(' '), initials: syllables.map(word => word.charAt(0)).join('') });
  }
  return pinyinCache.get(name);
}

export function getContinent(item) {
  if (CONTINENT_NAMES[item?.continent]) return CONTINENT_NAMES[item.continent];
  const region = item?.region || item?.cities?.[0]?.region;
  if (region === '美洲') return SOUTH_AMERICA.has(item.countryCode) ? '南美洲' : '北美洲';
  return CONTINENTS.includes(region) ? region : '其他地区';
}

export function destinationName(item, locale = 'zh') {
  return locale === 'en' ? item?.nameEn || item?.name || '' : item?.name || item?.nameEn || '';
}

export function destinationCountryName(city, locale = 'zh') {
  return locale === 'en' ? city?.countryEn || countryNameEn(city?.countryCode, city?.country) : city?.country || countryNameEn(city?.countryCode);
}

export function citySortName(city, locale = 'zh') {
  return locale === 'en' ? foldSearch(destinationName(city, locale)) : namePinyin(destinationName(city, locale)).full;
}

export function cityInitial(city, locale = 'zh') {
  const first = citySortName(city, locale).trim().replace(/^[^\p{L}\p{N}]+/u, '').charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
}

export function compareCities(a, b, locale = 'zh') {
  const ai = cityInitial(a, locale), bi = cityInitial(b, locale);
  return (ai === '#') - (bi === '#') || collator.compare(citySortName(a, locale), citySortName(b, locale)) || String(a.id || a.countryCode || '').localeCompare(String(b.id || b.countryCode || ''));
}

export function countryNameEn(code, fallback = '') {
  try { return countryEnglish.of(code) || fallback || code || ''; } catch { return fallback || code || ''; }
}

/** Both scripts remain searchable in either interface language. */
export function destinationSearchText(item) {
  if (!item || typeof item !== 'object') return '';
  if (searchCache.has(item)) return searchCache.get(item);
  const names = [item.name, item.country, item.subdivision, ...(item.searchAliases || [])].filter(Boolean);
  const values = [...names, item.nameEn, item.countryEn, countryNameEn(item.countryCode), item.countryCode, item.iata, ...(item.airportCodes || []), ...(item.tags || [])];
  for (const name of names) {
    const parts = namePinyin(name);
    values.push(parts.full, parts.spaced, parts.initials);
  }
  const text = foldSearch(values.filter(Boolean).join(' '));
  const result = `${text} ${values.filter(Boolean).map(compactSearch).join(' ')}`;
  searchCache.set(item, result);
  return result;
}

export function matchesDestination(item, query = '') {
  const term = foldSearch(query).trim();
  if (!term) return true;
  const text = destinationSearchText(item);
  const compact = compactSearch(term);
  return text.includes(term) || (Boolean(compact) && text.includes(compact)) || term.split(/\s+/).every(word => text.includes(word));
}

export function countryOptions(cities = [], locale = 'zh') {
  const groups = new Map();
  for (const city of cities) {
    if (!city.countryCode) continue;
    if (!groups.has(city.countryCode)) groups.set(city.countryCode, { countryCode: city.countryCode, name: city.country || city.countryCode, nameEn: city.countryEn || countryNameEn(city.countryCode), region: getContinent(city), cities: [] });
    groups.get(city.countryCode).cities.push(city);
  }
  return [...groups.values()].sort((a, b) => CONTINENTS.indexOf(a.region) - CONTINENTS.indexOf(b.region) || compareCities(a, b, locale));
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
