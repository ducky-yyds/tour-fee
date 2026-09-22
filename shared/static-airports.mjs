/** Compact, lossless public airport index used only by the static deployment. */
const fold = value => String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
const searchKeys = ['name', 'municipality', 'iata', 'icao', 'ident', 'countryCode', 'regionName'];
const preparedIndexes = new WeakMap();

export function createAirportIndex(inventory) {
  const columns = [...new Set(inventory.airports.flatMap(airport => Object.keys(airport)))];
  return {
    version: 1, columns,
    rows: inventory.airports.map(airport => columns.map(key => airport[key] ?? null)),
    cityGroups: inventory.cities.map(city => [city.id, city.curatedCityId || null,
      fold([city.name, city.nameEn, city.country, city.countryEn, city.countryCode, city.subdivision, ...(city.airportCodes || [])].join(' '))]),
    source: inventory.source, generatedAt: inventory.generatedAt,
    coverage: { airportCount: inventory.airports.length, cityCount: inventory.cities.length, status: inventory.available ? 'available' : 'unavailable' },
  };
}

export function searchAirportIndex(index, { q = '', cityId = '', offset = 0, limit = 40 } = {}) {
  // Deliberately matches GET /api/airports validation and search semantics.
  if (typeof q !== 'string' || q.length > 150) throw new Error('机场搜索词最多 150 个字符');
  if (typeof cityId !== 'string' || cityId.length > 150 || (cityId && !/^[a-zA-Z0-9_-]+$/.test(cityId))) throw new Error('机场所属城市 ID 无效');
  const parsedOffset = Number(offset), parsedLimit = Number(limit);
  if (!Number.isInteger(parsedOffset) || parsedOffset < 0 || parsedOffset > 1000000) throw new Error('分页 offset 应为 0–1000000 的整数');
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) throw new Error('分页 limit 应为 1–100 的整数');
  if (index?.version !== 1 || !Array.isArray(index.rows) || !Array.isArray(index.columns) || !Array.isArray(index.cityGroups)) throw new Error('静态机场索引无效，请刷新页面重试');
  let prepared = preparedIndexes.get(index);
  if (!prepared) {
    const positions = searchKeys.map(key => index.columns.indexOf(key));
    prepared = { cityColumn: index.columns.indexOf('cityId'), search: index.rows.map(row => fold(positions.map(i => row[i]).join(' '))) };
    preparedIndexes.set(index, prepared);
  }
  const query = fold(q.trim());
  const groups = cityId ? new Set(index.cityGroups.filter(group => group[0] === cityId || group[1] === cityId).map(group => group[0])) : null;
  const matchingCities = query ? new Set(index.cityGroups.filter(group => group[2].includes(query)).map(group => group[0])) : null;
  let total = 0;
  const airports = [];
  index.rows.forEach((row, i) => {
    const groupId = row[prepared.cityColumn];
    if ((groups && !groups.has(groupId)) || (query && !matchingCities.has(groupId) && !prepared.search[i].includes(query))) return;
    if (total >= parsedOffset && airports.length < parsedLimit) airports.push(Object.fromEntries(index.columns.map((key, n) => [key, row[n]])));
    total++;
  });
  return { airports, total, offset: parsedOffset, limit: parsedLimit, hasMore: parsedOffset + parsedLimit < total,
    source: index.source, generatedAt: index.generatedAt, coverage: index.coverage,
    note: '仅查询机场资料，不表示当前有定期客运、所选日期有航班或两地可直飞。' };
}
