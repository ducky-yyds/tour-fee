import { mergeAirportCities } from '../shared/airport-catalog.mjs';
import { calculatePlan, generateItinerary, mergeCustomAttractions } from '../shared/planner.mjs';
import { searchAirportIndex } from '../shared/static-airports.mjs';
import { publicAssetUrl } from '../shared/public-paths.mjs';

export const STATIC_DATA_MODE = import.meta.env?.VITE_STATIC_DATA === 'true';
const base = import.meta.env?.BASE_URL || '/';
export const assetUrl = path => publicAssetUrl(path, base);
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
  let manifestPromise, catalogPromise, airportPromise;
  const url = path => publicAssetUrl(path, basePath);
  const getJson = async path => {
    const response = await fetchImpl(url(path), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`静态数据加载失败（${response.status}），请刷新页面重试`);
    return response.json();
  };
  const manifest = (refresh = false) => {
    if (refresh || !manifestPromise) manifestPromise = getJson('/static-data/manifest.json').then(value => {
      if (value.version !== 1 || !value.catalog || !value.dataStatus || !value.airports) throw new Error('静态数据清单无效，请重新发布网站');
      return value;
    }).catch(error => { manifestPromise = null; throw error; });
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
  return async function apiFetch(path, init = {}) {
    if (!staticMode) return fetchImpl(path, init);
    init.signal?.throwIfAborted();
    const parsed = new URL(String(path), 'https://static.invalid');
    const method = (init.method || 'GET').toUpperCase();
    if (!parsed.pathname.startsWith('/api/')) return fetchImpl(path, init);
    try {
      if (parsed.pathname === '/api/catalog' && method === 'GET') return json(await abortable(catalog(), init.signal));
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
        const cities = mergeCustomAttractions(mergeAirportCities(data.cities, data.airportCities), plan.customAttractions);
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
