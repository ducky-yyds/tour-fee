import { mergeAirportCities } from '../shared/airport-catalog.mjs';
import { calculatePlan, generateItinerary, mergeCustomAttractions } from '../shared/planner.mjs';
import { searchAirportIndex } from '../shared/static-airports.mjs';
import { publicAssetUrl } from '../shared/public-paths.mjs';
import { parseCityIds, planCityIds, selectCityDetails } from '../shared/catalog-delivery.mjs';

export const STATIC_DATA_MODE = import.meta.env?.VITE_STATIC_DATA === 'true';
const base = import.meta.env?.BASE_URL || '/';
const mediaBase = String(import.meta.env?.VITE_MEDIA_BASE_URL || '').replace(/\/$/, '');
export const assetUrl = path => mediaBase && typeof path === 'string' && path.startsWith('/images/')
  ? `${mediaBase}/${path.slice('/images/'.length)}` : publicAssetUrl(path, base);
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

function abortable(promise, signal) {
  if (!signal) return promise;
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const aborted = () => reject(signal.reason || new DOMException('The operation was aborted', 'AbortError'));
    signal.addEventListener('abort', aborted, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', aborted));
  });
}

/** A fetch-compatible adapter; static mode never sends a trip to a remote service. */
export function createApiClient({ staticMode = STATIC_DATA_MODE, basePath = base, fetchImpl = (...args) => globalThis.fetch(...args), decompress = globalThis.DecompressionStream } = {}) {
  let manifestPromise, catalogPromise, airportPromise, legacyPromise;
  const cityPromises = new Map();
  const url = path => publicAssetUrl(path, basePath);
  const getJson = async path => {
    const response = await fetchImpl(url(path), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`静态数据加载失败（${response.status}），请刷新页面重试`);
    return response.json();
  };
  const manifest = (refresh = false) => {
    const read = () => getJson('/static-data/manifest.json').then(value => {
      if (![1, 2].includes(value.version) || !value.catalog || !value.dataStatus || !value.airports || (value.version === 2 && !value.cityDetails)) throw new Error('静态数据清单无效，请重新发布网站');
      return value;
    });
    // Status can inspect a new release without mixing its shards with the open workspace's index.
    if (refresh) return read();
    if (!manifestPromise) manifestPromise = read().catch(error => { manifestPromise = null; throw error; });
    return manifestPromise;
  };
  const loadPart = async part => {
    // Gzip sidecars avoid a multi-megabyte raw JSON download on static hosts.
    // A plain JSON copy supports browsers without DecompressionStream.
    if (part.gzip && decompress) {
      try {
        const response = await fetchImpl(url(`/static-data/${part.gzip}`), { cache: 'force-cache' });
        if (!response.ok || !response.body) throw new Error('压缩快照不可读取');
        return await new Response(response.body.pipeThrough(new decompress('gzip'))).json();
      } catch { /* CDN/content-encoding differences can safely use the JSON copy. */ }
    }
    return getJson(`/static-data/${part.file}`);
  };
  const catalog = () => catalogPromise ||= manifest().then(m => loadPart(m.catalog)).catch(error => { catalogPromise = null; throw error; });
  const airports = () => airportPromise ||= manifest().then(m => loadPart(m.airports)).catch(error => { airportPromise = null; throw error; });
  const details = async value => {
    const ids = parseCityIds(value), m = await manifest(), data = await catalog();
    if (m.version === 1) return selectCityDetails(data, ids);
    const cities = await Promise.all(ids.map(async id => {
      const canonicalId = data.airportCityAliases?.[id] || id;
      if (m.cityDetails[canonicalId]) {
        if (!cityPromises.has(canonicalId)) cityPromises.set(canonicalId, loadPart(m.cityDetails[canonicalId]).catch(error => { cityPromises.delete(canonicalId); throw error; }));
        const city = await cityPromises.get(canonicalId);
        return id === canonicalId ? city : { ...city, id, canonicalCityId: canonicalId, legacyAirportAlias: true };
      }
      if (!m.legacyAirportCities) throw new Error(`城市资料未找到：${id}`);
      legacyPromise ||= loadPart(m.legacyAirportCities).catch(error => { legacyPromise = null; throw error; });
      return selectCityDetails({ ...data, airportCities: await legacyPromise }, [id]).cities[0];
    }));
    return { cities };
  };
  return async function apiFetch(path, init = {}) {
    if (!staticMode) return fetchImpl(path, init);
    init.signal?.throwIfAborted();
    const parsed = new URL(String(path), 'https://static.invalid');
    const method = (init.method || 'GET').toUpperCase();
    if (!parsed.pathname.startsWith('/api/')) return fetchImpl(path, init);
    try {
      if (parsed.pathname === '/api/catalog' && method === 'GET') return json(await abortable(catalog(), init.signal));
      if (parsed.pathname === '/api/cities' && method === 'GET') return json(await abortable(details(parsed.searchParams.get('ids')), init.signal));
      if (parsed.pathname === '/api/data-status' && method === 'GET') {
        const m = await abortable(manifest(true), init.signal);
        return json(await abortable(loadPart(m.dataStatus), init.signal));
      }
      if (parsed.pathname === '/api/airports' && method === 'GET') {
        const index = await abortable(airports(), init.signal);
        return json(searchAirportIndex(index, { q: parsed.searchParams.get('q') ?? '', cityId: parsed.searchParams.get('cityId') ?? '', offset: parsed.searchParams.get('offset') ?? 0, limit: parsed.searchParams.get('limit') ?? 40 }));
      }
      if (parsed.pathname === '/api/plan' && method === 'POST') {
        if (typeof init.body !== 'string' || init.body.length > 128000) throw new Error('行程数据无效或过大');
        const plan = JSON.parse(init.body), data = await abortable(catalog(), init.signal);
        const loaded = await abortable(details(planCityIds([plan])), init.signal);
        const cities = mergeCustomAttractions(mergeAirportCities(loaded.cities, [], data.airportCityAliases), plan.customAttractions);
        return json({ ...calculatePlan(plan, cities, data.rates), itinerary: generateItinerary(plan, cities, data.rates) });
      }
      if (parsed.pathname === '/api/health' && method === 'GET') return json({ ok: true, mode: 'static', app: '途算' });
      return json({ error: '接口不存在' }, 404);
    } catch (error) {
      if (init.signal?.aborted || error.name === 'AbortError') throw error;
      return json({ error: error.message }, parsed.pathname === '/api/plan' || parsed.pathname === '/api/airports' ? 400 : 503);
    }
  };
}

export const apiFetch = createApiClient();

/** Detail failures are retriable and never cached as empty city records. */
export async function fetchCityDetails(ids, { request = apiFetch } = {}) {
  const unique = [...new Set(ids.filter(Boolean))], cities = [];
  for (let offset = 0; offset < unique.length; offset += 100) {
    const chunk = unique.slice(offset, offset + 100);
    const response = await request(`/api/cities?ids=${encodeURIComponent(chunk.join(','))}`);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.cities)) throw new Error(data.error || '城市详情加载失败，请重试；原有选择已保留。');
    if (data.cities.length !== chunk.length || chunk.some(id => !data.cities.some(city => city.id === id && city.detailStatus !== 'summary' && Array.isArray(city.attractions)))) throw new Error('城市详情尚未完整返回，请重试；原有选择已保留。');
    cities.push(...data.cities);
  }
  return cities;
}
