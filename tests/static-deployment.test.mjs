import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { createApiClient } from '../src/api.mjs';
import { createAirportIndex, searchAirportIndex } from '../shared/static-airports.mjs';
import { publicAssetUrl, normalizeBasePath } from '../shared/public-paths.mjs';
import { publicCatalog } from '../scripts/export-static-data.mjs';
import { calculatePlan, generateItinerary } from '../shared/planner.mjs';
import viteConfig from '../vite.config.js';

const inventory = {
  available: true, generatedAt: '2026-09-22T00:00:00Z', source: { name: 'OurAirports', url: 'https://ourairports.com/data/' },
  cities: [
    { id: 'aircity-beijing', curatedCityId: 'beijing', name: '北京', nameEn: 'Beijing', country: '中国', countryEn: 'China', countryCode: 'CN', subdivision: 'Beijing', airportCodes: ['PEK', 'PKX'] },
    { id: 'aircity-sao-paulo', name: 'São Paulo', country: '巴西', countryEn: 'Brazil', countryCode: 'BR', airportCodes: ['GRU'] },
  ],
  airports: [
    { id: 'airport-1', ident: 'ZBAA', name: 'Beijing Capital', municipality: 'Beijing', iata: 'PEK', icao: 'ZBAA', countryCode: 'CN', regionName: 'Beijing', cityId: 'aircity-beijing', lat: 40.08, lng: 116.59, scheduledService: true },
    { id: 'airport-2', ident: 'ZBAD', name: 'Beijing Daxing', municipality: 'Beijing', iata: 'PKX', icao: 'ZBAD', countryCode: 'CN', regionName: 'Beijing', cityId: 'aircity-beijing', lat: 39.5, lng: 116.4, scheduledService: true },
    { id: 'airport-3', ident: 'SBGR', name: 'São Paulo Guarulhos', municipality: 'São Paulo', iata: 'GRU', icao: 'SBGR', countryCode: 'BR', regionName: 'São Paulo', cityId: 'aircity-sao-paulo', lat: -23.4, lng: -46.4, scheduledService: true },
  ],
};
const index = createAirportIndex(inventory);
const city = { id: 'beijing', name: '北京', nameEn: 'Beijing', country: '中国', countryEn: 'China', countryCode: 'CN', currency: 'CNY', lat: 39.9, lng: 116.4, daily: { lodging: [100, 200, 400], food: [10, 20, 40], transport: [5, 10, 20], misc: [1, 2, 4] }, monthly: { rent: [1000, 2000, 4000], utilities: [100, 200, 400] }, budgetBasis: { note: 'editorial', updatedAt: '2026-09-22' }, attractions: [] };
const catalog = { cities: [city], airportCities: [], rates: { base: 'CNY', rates: { CNY: 1, USD: .15 }, status: 'fresh' } };
const plan = { originId: 'beijing', stops: [{ cityId: 'beijing', days: 2, attractionIds: [] }], departureDate: '2026-10-15', travelers: 2, rooms: 1, currency: 'CNY', mode: 'travel', tier: 1, returnTrip: true, reservePercent: 10, overrides: {} };
const manifest = { version: 1, catalog: { file: 'catalog-a.json', gzip: 'catalog-a.json.gz' }, dataStatus: { file: 'status-a.json' }, airports: { file: 'airports-a.json', gzip: 'airports-a.json.gz' } };
function fixtureClient({ compressed = true, badGzip = false } = {}) {
  const calls = [];
  const files = { 'manifest.json': manifest, 'catalog-a.json': catalog, 'status-a.json': { deployment: { mode: 'static' } }, 'airports-a.json': index };
  const fetchImpl = async path => {
    calls.push(path);
    assert.ok(path.startsWith('/tour-fee/static-data/'), path);
    const name = path.split('/').at(-1);
    if (name.endsWith('.gz')) return new Response(badGzip ? 'not gzip' : gzipSync(JSON.stringify(files[name.slice(0, -3)])));
    return new Response(JSON.stringify(files[name]), { headers: { 'content-type': 'application/json' } });
  };
  return { api: createApiClient({ staticMode: true, basePath: '/tour-fee/', fetchImpl, decompress: compressed ? globalThis.DecompressionStream : null }), calls };
}

test('public assets honor repository base without rewriting external URLs or double prefixes', () => {
  assert.equal(normalizeBasePath('/tour-fee'), '/tour-fee/');
  assert.equal(normalizeBasePath(''), '/');
  assert.equal(publicAssetUrl('/images/beijing.jpg', '/tour-fee/'), '/tour-fee/images/beijing.jpg');
  assert.equal(publicAssetUrl('maps/earth-day.jpg', '/tour-fee/'), '/tour-fee/maps/earth-day.jpg');
  assert.equal(publicAssetUrl('/tour-fee/maps/earth-day.jpg', '/tour-fee/'), '/tour-fee/maps/earth-day.jpg');
  for (const path of ['https://example.com/a.jpg', 'data:image/svg+xml,test', 'blob:https://example.com/id', '#/globe', '//example.com/a.jpg']) assert.equal(publicAssetUrl(path, '/tour-fee/'), path);
  assert.throws(() => normalizeBasePath('/../data/'));
});

test('Pages builds preserve the local Node server build output', () => {
  assert.equal(viteConfig({ mode: 'pages' }).build.outDir, 'dist-pages');
  assert.equal(viteConfig({ mode: 'production' }).build.outDir, 'dist');
  assert.equal(viteConfig({ mode: 'pages' }).define['import.meta.env.VITE_STATIC_DATA'], '"true"');
});

test('static airport search preserves curated links, city/code matching, accents and pagination', () => {
  const first = searchAirportIndex(index, { cityId: 'beijing', limit: 1 });
  assert.equal(first.total, 2); assert.equal(first.hasMore, true); assert.equal(first.airports[0].iata, 'PEK');
  const second = searchAirportIndex(index, { cityId: 'beijing', limit: 1, offset: 1 });
  assert.equal(second.airports[0].iata, 'PKX'); assert.equal(second.hasMore, false);
  assert.deepEqual(searchAirportIndex(index, { q: 'sao paulo' }).airports, [inventory.airports[2]]);
  // Matching a city's airport code returns its airport group, just as the Node API does.
  assert.equal(searchAirportIndex(index, { q: 'PKX' }).total, 2);
  assert.equal(searchAirportIndex(index, { q: '中国' }).total, 2);
  assert.equal(searchAirportIndex(index, { cityId: 'unknown' }).total, 0);
  assert.throws(() => searchAirportIndex(index, { limit: 101 }), /limit/);
  assert.throws(() => searchAirportIndex(index, { offset: -1 }), /offset/);
  assert.throws(() => searchAirportIndex(index, { cityId: '../' }), /城市/);
  assert.throws(() => searchAirportIndex(index, { q: 'a'.repeat(151) }), /150/);
});

test('static adapter downloads gzip snapshots, caches catalog and loads airports only on demand', async () => {
  const { api, calls } = fixtureClient();
  const first = await api('/api/catalog'); assert(first instanceof Response); assert(first.ok);
  assert.deepEqual(await first.json(), catalog);
  await api('/api/catalog');
  assert.equal(calls.filter(path => path.endsWith('catalog-a.json.gz')).length, 1);
  assert.equal(calls.some(path => path.includes('airports-a')), false);
  const response = await api('/api/airports?cityId=beijing&offset=1&limit=1');
  assert.equal((await response.json()).airports[0].iata, 'PKX');
  assert.equal(calls.filter(path => path.endsWith('airports-a.json.gz')).length, 1);
  assert.equal((await api('/api/airports?limit=101')).status, 400);
});

test('plain JSON fallback works for unsupported browsers and invalid compressed content', async () => {
  for (const config of [{ compressed: false }, { badGzip: true }]) {
    const { api, calls } = fixtureClient(config);
    assert.deepEqual(await (await api('/api/catalog')).json(), catalog);
    assert(calls.some(path => path.endsWith('catalog-a.json')));
  }
});

test('static plan endpoint uses the exact shared calculation and itinerary without uploading data', async () => {
  const { api, calls } = fixtureClient();
  const response = await api('/api/plan', { method: 'POST', body: JSON.stringify(plan) });
  assert.equal(response.status, 200);
  const expected = { ...calculatePlan(plan, catalog.cities, catalog.rates), itinerary: generateItinerary(plan, catalog.cities, catalog.rates) };
  assert.deepEqual(await response.json(), JSON.parse(JSON.stringify(expected)));
  assert(calls.every(path => !path.includes('/api/')));
  assert.equal((await api('/api/plan', { method: 'POST', body: '{invalid' })).status, 400);
});

test('Node mode retains normal fetch behavior and static requests honor cancellation', async () => {
  const args = [], expected = new Response('{}');
  const fetchImpl = (...entry) => { args.push(entry); return expected; };
  const api = createApiClient({ staticMode: false, fetchImpl });
  const init = { method: 'POST', body: '{}' };
  assert.equal(await api('/api/plan', init), expected); assert.deepEqual(args, [['/api/plan', init]]);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fixtureClient().api('/api/catalog', { signal: controller.signal }), { name: 'AbortError' });
});

test('public catalog export excludes raw diagnostics and machine-owned schedule metadata', () => {
  const source = { ...catalog, sources: [{ id: 'fx', status: 'error', details: { secret: 'PRIVATE' }, message: 'C:/PRIVATE/user' }],
    airportCoverage: { airportCount: 3, maintenance: { status: 'error', lastError: 'PRIVATE', sources: [{ kind: 'airports', url: 'https://ourairports.com/data/', internal: 'PRIVATE' }] } },
    experienceMaintenance: { audit: { totalSources: 1, sources: [{ url: 'https://example.com', note: 'PRIVATE' }], review: [{ experienceId: 'example', message: 'PRIVATE' }] } },
    schedule: { windowsTask: { user: 'PRIVATE' } }, history: [{ payload: 'PRIVATE' }] };
  const exported = publicCatalog(source, '2026-09-22T00:00:00Z');
  assert.equal(exported.deployment.mode, 'static');
  assert.equal(exported.sources[0].status, 'error');
  assert.equal(exported.experienceMaintenance.audit.review.length, 1);
  assert(!JSON.stringify(exported).includes('PRIVATE'));
});
