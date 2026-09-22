import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, readSnapshot, sourceStatuses, recentObservations } from './db.mjs';
import { DATA_SOURCES } from './sources.mjs';
import { MAINTENANCE_CONFIG } from './maintenance.mjs';
import { readExperienceEntries } from './experience-catalog.mjs';

// Reproducible reference snapshot actually retrieved from Frankfurter on this date.
// Shown explicitly as cached whenever no validated database snapshot is present.
const REFERENCE_FX = {
  base: 'CNY', rates: { CNY: 1, AED: 0.54859, AUD: 0.2098, EUR: 0.13008, GBP: 0.11158, HKD: 1.1728, IDR: 2661.68, JPY: 23.504, KRW: 206.07, SGD: 0.19065, THB: 4.9724, TRY: 7.2887, USD: 0.14938 },
  asOf: '2026-09-22', source: 'Frankfurter · 已核验参考快照', sourceUrl: 'https://frankfurter.dev/', status: 'cached', note: '使用 2026-09-22 参考快照；运行 npm run update:data 获取最新数据。参考汇率不含手续费。',
};
const jsonCache = new Map();
const readJson = (path, fallback) => {
  const absolute = resolve(ROOT, path);
  if (!existsSync(absolute)) { jsonCache.delete(absolute); return fallback; }
  const stat = statSync(absolute), key = `${stat.mtimeMs}:${stat.size}`;
  const cached = jsonCache.get(absolute);
  if (cached?.key === key) return cached.value;
  const value = JSON.parse(readFileSync(absolute, 'utf8').replace(/^\uFEFF/, ''));
  jsonCache.set(absolute, { key, value });
  return value;
};

export function getAirportInventory() {
  try {
    const cityFile = readJson('data/airport-cities.json', null);
    const airportFile = readJson('data/airports.json', null);
    const maintenance = readJson('data/airport-maintenance.json', null);
    const cities = Array.isArray(cityFile?.cities) ? cityFile.cities : [];
    const airports = Array.isArray(airportFile?.airports) ? airportFile.airports : [];
    return { cities, airports, source: cityFile?.source || airportFile?.source || null, generatedAt: cityFile?.generatedAt || airportFile?.generatedAt || null, maintenance, available: Boolean(cityFile && airportFile), error: null };
  } catch {
    return { cities: [], airports: [], source: null, generatedAt: null, maintenance: null, available: false, error: '机场资料暂时不可读取，现有精选城市仍可使用。' };
  }
}

function airportCoverage(inventory, curated = []) {
  const curatedIds = new Set(curated.map(city => city.id));
  const linked = inventory.cities.filter(city => city.curatedCityId && curatedIds.has(city.curatedCityId));
  return { status: inventory.available ? 'available' : 'unavailable', airportCount: inventory.airports.length, airportCityCount: inventory.cities.length, additionalCityCount: inventory.cities.length - linked.length, curatedLinkedCityCount: new Set(linked.map(city => city.curatedCityId)).size, countryCount: new Set(inventory.cities.map(city => city.countryCode)).size, scheduledAirportCount: inventory.airports.filter(airport => airport.scheduledService).length, scheduledCityCount: inventory.cities.filter(city => city.scheduledService).length, source: inventory.source, generatedAt: inventory.generatedAt, maintenance: inventory.maintenance, note: inventory.error || '机场资料覆盖活跃类型的机场与所属地点，不保证机场当前对公众开放、有客运服务，或所选路线存在直达航班。机场扩展城市的景点与食宿价格尚待补充。' };
}

/** Read-only search over the airport inventory; results never imply flight availability. */
export function searchAirports({ q = '', cityId = '', offset = 0, limit = 40 } = {}) {
  if (typeof q !== 'string' || q.length > 150) throw new Error('机场搜索词最多 150 个字符');
  if (typeof cityId !== 'string' || cityId.length > 150 || (cityId && !/^[a-zA-Z0-9_-]+$/.test(cityId))) throw new Error('机场所属城市 ID 无效');
  const parsedOffset = Number(offset), parsedLimit = Number(limit);
  if (!Number.isInteger(parsedOffset) || parsedOffset < 0 || parsedOffset > 1000000) throw new Error('分页 offset 应为 0–1000000 的整数');
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) throw new Error('分页 limit 应为 1–100 的整数');
  const inventory = getAirportInventory();
  const normalize = value => String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const query = normalize(q.trim());
  const groups = cityId ? new Set(inventory.cities.filter(city => city.id === cityId || city.curatedCityId === cityId).map(city => city.id)) : null;
  const matchingCityIds = query ? new Set(inventory.cities.filter(city => normalize([city.name, city.nameEn, city.country, city.countryEn, city.countryCode, city.subdivision, ...(city.airportCodes || [])].join(' ')).includes(query)).map(city => city.id)) : null;
  const filtered = inventory.airports.filter(airport => (!groups || groups.has(airport.cityId)) && (!query || matchingCityIds.has(airport.cityId) || normalize([airport.name, airport.municipality, airport.iata, airport.icao, airport.ident, airport.countryCode, airport.regionName].join(' ')).includes(query)));
  return { airports: filtered.slice(parsedOffset, parsedOffset + parsedLimit), total: filtered.length, offset: parsedOffset, limit: parsedLimit, hasMore: parsedOffset + parsedLimit < filtered.length, source: inventory.source, generatedAt: inventory.generatedAt, coverage: { airportCount: inventory.airports.length, cityCount: inventory.cities.length, status: inventory.available ? 'available' : 'unavailable' }, note: '仅查询机场资料，不表示当前有定期客运、所选日期有航班或两地可直飞。' };
}
export const PROVIDER_STATUS = {
  flights: { status: 'not-connected', label: '机票为预算模型', detail: '未接入航空分销 API；需申请供应商凭据后才能提供即时可订价格。当前提供带路线与日期的查询链接。' },
  hotels: { status: 'not-connected', label: '住宿为规划区间', detail: '未接入酒店库存 API；按城市预算与人数房间数估算。跳转预订页核对税费、库存与取消条件。' },
  itinerary: { status: 'rule-based', label: '按已选景点生成', detail: '按停留天数分配景点，未校验实时营业、路况或实际航班到达时刻。' },
};
export function getCatalog() {
  const citiesFile = readJson('data/cities.json', []);
  const rawCities = Array.isArray(citiesFile) ? citiesFile : citiesFile.cities;
  if (!Array.isArray(rawCities) || !rawCities.length) throw new Error('城市目录尚未准备好');
  const inventory = getAirportInventory();
  const airportGroupsByCity = new Map();
  for (const group of inventory.cities) if (group.curatedCityId) {
    const groups = airportGroupsByCity.get(group.curatedCityId) || [];
    groups.push(group); airportGroupsByCity.set(group.curatedCityId, groups);
  }
  const media = readJson('data/media.json', { cities: {}, attractions: {} });
  const experiences = readExperienceEntries();
  const guides = readJson('data/city-guides.json', []);
  const audit = readJson('data/experience-audit.json', null);
  const eiffel = readSnapshot('eiffel-tower');
  const tokyoTower = readSnapshot('tokyo-tower');
  const subway = readSnapshot('tokyo-subway');
  const cities = rawCities.map(city => ({
    ...city,
    airportCodes: [...new Set([...(city.airportCodes || []), ...(airportGroupsByCity.get(city.id) || []).flatMap(group => group.airportCodes || []), ...(city.iata ? [city.iata] : [])])],
    scheduledService: (airportGroupsByCity.get(city.id) || []).some(group => group.scheduledService === true),
    airportCount: (airportGroupsByCity.get(city.id) || []).reduce((sum, group) => sum + (group.airportIds?.length || 0), 0),
    guide: Array.isArray(guides) ? guides.find(g => g.cityId === city.id) : guides[city.id],
    experiences: experiences.filter(e => e.cityId === city.id).map(e => ({ ...e,
      image: e.imageRef ? media.attractions?.[e.imageRef] : undefined,
      priceOptions: e.priceOptions.map(option => {
        const source = DATA_SOURCES.find(s => s.kind === 'official-experience' && s.experienceId === e.id);
        const snapshot = source && readSnapshot(source.id);
        const price = snapshot?.value.options?.find(p => p.optionId === option.id);
        return price ? { ...option, low: price.low, high: price.high, currency: price.currency, type: 'official', sourceUrl: source.url, checkedAt: snapshot.updatedAt, updateType: 'automated-official' } : { ...option, updateType: option.type === 'official' ? 'manually-verified' : 'estimate' };
      }),
    })),
    image: media.cities?.[city.id] || city.image,
    ...(city.id === 'tokyo' && subway ? { transportReference: { ...subway.value, sourceUrl: 'https://www.tokyometro.jp/en/ticket/travel/index.html', sourceName: 'Tokyo Metro', checkedAt: subway.updatedAt } } : {}),
    attractions: (city.attractions || []).map(attraction => {
      const result = { ...attraction, image: media.attractions?.[attraction.id] || attraction.image };
      if (eiffel && attraction.price?.sourceUrl === 'https://www.toureiffel.paris/en/rates-opening-times') result.price = { ...attraction.price, low: eiffel.value.low, high: eiffel.value.high, checkedAt: eiffel.updatedAt, type: 'official' };
      if (tokyoTower && attraction.price?.sourceUrl === 'https://ticket.tokyotower.co.jp/en/') result.price = { ...attraction.price, low: tokyoTower.value.low, high: tokyoTower.value.high, checkedAt: tokyoTower.updatedAt, type: 'official', note: `成人主展望台网上票 ${tokyoTower.value.low} JPY；Top Deck Tour 网上票 ${tokyoTower.value.high} JPY 起。不含柜台加价、Diamond Tour 或额外体验。` };
      return result;
    }),
  }));
  const snapshot = readSnapshot('frankfurter');
  const reference = readJson('data/fx-reference.json', REFERENCE_FX);
  const rates = snapshot ? { ...snapshot.value } : { ...reference, status: 'cached' };
  const missingCurrencies = Object.keys(reference.rates).filter(c => !rates.rates[c]);
  if (missingCurrencies.length) {
    rates.rates = { ...reference.rates, ...rates.rates };
    rates.asOf = [rates.asOf, reference.asOf].sort()[0];
    rates.status = 'cached';
    rates.note = `部分币种使用 ${reference.asOf} 已核验参考快照：${missingCurrencies.join('、')}；等待下次完整更新。`;
  }
  if ((Date.now() - Date.parse(`${rates.asOf}T00:00:00Z`)) / 86400000 > 4) rates.status = 'stale';
  const statuses = sourceStatuses();
  const configured = DATA_SOURCES.map(source => ({ ...source, ...statuses.find(s => s.id === source.id), status: statuses.find(s => s.id === source.id)?.status || 'never-fetched' }));
  const manualSources = readJson('data/sources.json', []);
  const sourceList = Array.isArray(manualSources) ? manualSources : (manualSources.sources || []);
  const lastUpdated = snapshot?.updatedAt || rates.asOf;
  const priceSamples = readJson('data/price-samples.json', []).map(sample => {
    const source = DATA_SOURCES.find(s => s.kind === 'official-menu' && s.url === sample.sourceUrl);
    const current = source ? readSnapshot(source.id) : null;
    const item = current?.value.items.find(i => i.id === sample.id);
    return item ? { ...sample, amount: item.amount, checkedAt: current.updatedAt, updateType: 'automated-official' } : { ...sample, updateType: 'manually-verified' };
  });
  const curatedIds = new Set(cities.map(city => city.id));
  const airportCities = inventory.cities.filter(city => !city.curatedCityId || !curatedIds.has(city.curatedCityId)).map(city => ({ id: city.id, name: city.name, ...(city.nameEn !== city.name ? { nameEn: city.nameEn } : {}), nameKind: city.nameKind, country: city.country, countryCode: city.countryCode, isoRegion: city.isoRegion, subdivision: city.subdivision, region: city.region, lat: city.lat, lng: city.lng, iata: city.iata, airportCodes: city.airportCodes, airportCount: city.airportIds?.length || 0, scheduledService: city.scheduledService, coverage: city.coverage, sourceUrl: city.sourceUrl, coordinateBasis: city.coordinateBasis }));
  return { cities, airportCities, airportCoverage: airportCoverage(inventory, cities), rates, priceSamples, experienceMaintenance: { catalogCheckedAt: '2026-09-22', placeCount: experiences.length, coveredCityCount: new Set(experiences.map(e => e.cityId)).size, categoryCounts: Object.fromEntries(['restaurant', 'hotel', 'experience'].map(kind => [kind, experiences.filter(e => e.kind === kind).length])), optionCount: experiences.reduce((n, e) => n + e.priceOptions.length, 0), audit, note: '具体地点资料来自公开官方页面；固定菜单和票价按标注日期核验。酒店及未公布套餐为规划区间，未连接实时房态或库存。' }, sources: [...configured, ...sourceList.filter(s => !configured.some(c => c.id === s.id))], lastUpdated, providerStatus: PROVIDER_STATUS };
}
export function dataStatus() {
  const catalog = getCatalog();
  const installedTask = readJson('data/schedule.json', null);
  return { airportCoverage: catalog.airportCoverage, airportCityCount: catalog.airportCities.length, experienceMaintenance: catalog.experienceMaintenance, lastUpdated: catalog.lastUpdated, rates: catalog.rates, sources: catalog.sources, providerStatus: PROVIDER_STATUS, cityCount: catalog.cities.length, priceSampleCount: catalog.priceSamples.length, attractionCount: catalog.cities.reduce((sum, c) => sum + c.attractions.length, 0), history: recentObservations(), note: '自动维护覆盖汇率、东京地铁票、东京塔/埃菲尔铁塔官方门票、东京/京都两家一兰菜单，以及巴黎游船、迪拜热气球、洛杉矶片场的指定成人方案。具体体验快照覆盖对应套餐价格，商家来源轮询检查产生人工复核清单。有效门票快照直接覆盖预算价格，菜单快照覆盖对应消费样本。东京地铁作为独立交通参考，不覆盖每日编辑预算。城市食宿区间需人工更新。网站拒绝访问或解析不确定时保留旧值并记录失败。', schedule: { builtIn: { ...MAINTENANCE_CONFIG, activeWhileServerRuns: MAINTENANCE_CONFIG.enabled, pollingMinutes: 15, lastRun: readSnapshot('updater-run')?.value || null }, windowsTask: installedTask, command: 'npm run update:data', windows: 'powershell -ExecutionPolicy Bypass -File scripts/schedule-updates.ps1 -Install', cron: '30 7 * * * cd /path/to/tusuan && node scripts/update-data.mjs >> update-data.log 2>&1' } };
}
