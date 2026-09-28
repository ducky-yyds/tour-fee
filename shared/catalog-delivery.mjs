import { mergeAirportCities } from './airport-catalog.mjs';

/** Summaries are eligible destinations, but must never be used to prune saved selections. */
export function summarizeCity(city) {
  const { attractions = [], experiences = [], localFoods = [], guide, sourceReferences, ...summary } = city;
  return { ...summary, detailStatus: 'summary',
    contentCounts: { attractions: attractions.length, experiences: experiences.filter(item => item.kind === 'experience').length,
      localFoods: localFoods.length, officialPrices: attractions.filter(item => item.price?.type === 'official').length },
    attractions: [], experiences: [], localFoods: [] };
}

export function summarizeCatalog(catalog) {
  const maintenance = catalog.experienceMaintenance;
  const audit = maintenance?.audit;
  return { ...catalog, catalogVersion: 2, cities: catalog.cities.map(summarizeCity), airportCities: [],
    experienceMaintenance: audit ? { ...maintenance, audit: { updatedAt: audit.updatedAt, totalSources: audit.totalSources, reviewCount: audit.review?.length || 0 } } : maintenance };
}

export function parseCityIds(value) {
  const ids = Array.isArray(value) ? value : String(value || '').split(',');
  if (!ids.length || ids.length > 100 || ids.some(id => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,150}$/.test(id))) {
    throw new Error('每次可加载 1–100 个有效城市编号');
  }
  return [...new Set(ids)];
}

export function selectCityDetails(catalog, value) {
  const ids = parseCityIds(value);
  const byId = new Map(mergeAirportCities(catalog.cities, catalog.airportCities, catalog.airportCityAliases).map(city => [city.id, city]));
  const missing = ids.filter(id => !byId.has(id));
  if (missing.length) throw new Error(`城市资料未找到：${missing.join('、')}。原有旅行项目未修改。`);
  return { cities: ids.map(id => ({ ...byId.get(id), detailStatus: 'loaded' })) };
}

export function applyCityDetails(catalog, details) {
  const loaded = new Map();
  const known = new Set(catalog.cities.map(city => city.id));
  const airport = new Map((catalog.airportCities || []).map(city => [city.id, city]));
  for (const city of details) {
    if (city.legacyAirportAlias && city.canonicalCityId) {
      const { canonicalCityId, legacyAirportAlias, ...canonical } = city;
      loaded.set(canonicalCityId, { ...canonical, id: canonicalCityId });
    } else if (city.coverage === 'airport-only') airport.set(city.id, city);
    else loaded.set(city.id, city);
  }
  return { ...catalog, cities: [...catalog.cities.map(city => loaded.get(city.id) || city), ...[...loaded.values()].filter(city => !known.has(city.id))], airportCities: [...airport.values()] };
}

export function planCityIds(plans = []) {
  return [...new Set(plans.filter(Boolean).flatMap(plan => [plan.originId, ...(plan.stops || []).map(stop => stop.cityId)]).filter(Boolean))];
}
