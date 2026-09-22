import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseCsv, airportCityId, buildAirportCatalog } from '../shared/airport-data.mjs';
import { updateAirports, acquireAirportLock } from '../scripts/update-airports.mjs';

const countries = [{ code: 'US', name: 'United States', continent: 'NA' }, { code: 'CN', name: 'China', continent: 'AS' }, { code: 'MV', name: 'Maldives', continent: 'AS' }];
const row = (id, overrides = {}) => ({ id: String(id), ident: `TEST${id}`, type: 'small_airport', name: `Airport ${id}`, latitude_deg: '40', longitude_deg: '-70', elevation_ft: '10', continent: 'NA', iso_country: 'US', iso_region: 'US-MA', municipality: 'Springfield', scheduled_service: 'no', iata_code: '', icao_code: '', home_link: '', wikipedia_link: '', ...overrides });
const build = airportRows => buildAirportCatalog({ airportRows, countryRows: countries, checkedAt: '2026-09-22T00:00:00.000Z' });

test('CSV preserves quoted commas/newlines/escaped quotes and North America code', () => {
  assert.deepEqual(parseCsv('\uFEFFcode,name,continent\r\nUS,"Airport, \\"test\\"",NA\r\n'.replaceAll('\\"', '""')), [{ code: 'US', name: 'Airport, "test"', continent: 'NA' }]);
  assert.deepEqual(parseCsv('id,name\n1,"Line one\nLine two"\n'), [{ id: '1', name: 'Line one\nLine two' }]);
  assert.throws(() => parseCsv('a,b\n1,"unfinished'), /Unterminated/);
  assert.throws(() => parseCsv('a,b\n1,2,3'), /expected 2/);
});

test('inventory explicitly excludes closed airports, heliports and balloonports', () => {
  const catalog = build([row(1), row(2, { type: 'closed' }), row(3, { type: 'heliport' }), row(4, { type: 'balloonport' }), row(5, { type: 'seaplane_base' })]);
  assert.equal(catalog.airports.airports.length, 2);
  assert.deepEqual(catalog.counts.excludedTypes, { closed: 1, heliport: 1, balloonport: 1 });
  assert.equal(catalog.cities.cities[0].region, '美洲');
});

test('city grouping distinguishes same-name municipalities in different states, preserving stable IDs', () => {
  const entries = [row(1), row(2, { iso_region: 'US-IL' }), row(3, { municipality: 'SPRINGFIELD', type: 'large_airport', scheduled_service: 'yes', iata_code: 'SPI' })];
  const initial = build(entries), shuffled = build([...entries].reverse());
  assert.equal(initial.cities.cities.length, 2);
  assert.deepEqual(initial.cities.cities, shuffled.cities.cities);
  assert.equal(initial.cities.cities.find(city => city.isoRegion === 'US-MA').airportIds.length, 2);
  assert.equal(airportCityId('FR', 'FR-IDF', 'Évry'), airportCityId('FR', 'FR-IDF', 'EVRY'));
  assert.notEqual(airportCityId('US', 'US-MA', 'Springfield'), airportCityId('US', 'US-IL', 'Springfield'));
});

test('missing municipalities remain distinct airport destinations; invalid coordinates never create map points', () => {
  const catalog = build([row(1, { municipality: '' }), row(2, { municipality: '' }), row(3, { latitude_deg: '' }), row(4, { latitude_deg: '91' })]);
  assert.equal(catalog.airports.airports.length, 4);
  assert.equal(catalog.cities.cities.length, 2);
  assert.ok(catalog.cities.cities.every(city => city.nameKind === 'airport' && city.coordinateBasis === 'airport'));
  assert.equal(catalog.counts.airportsWithoutValidCoordinates, 2);
  assert.equal(catalog.airports.airports.find(airport => airport.id === 'airport-3').cityId, null);
  assert.equal(build([row(1, { municipality: '', ident: 'RENAMED' })]).cities.cities[0].id, catalog.cities.cities.find(city => city.airportIds.includes('airport-1')).id);
});

test('same gateway IATA never merges island destinations; explicit metropolitan airports link safely', () => {
  const airportRows = [row(1, { municipality: 'Malé', iso_country: 'MV', iso_region: 'MV-MLE', iata_code: 'MLE', scheduled_service: 'yes' }), row(2, { municipality: 'Beijing', iso_country: 'CN', iso_region: 'CN-11', iata_code: 'PEK' }), row(3, { municipality: 'Daxing', iso_country: 'CN', iso_region: 'CN-11', iata_code: 'PKX' })];
  const curatedCities = [{ id: 'male', nameEn: 'Malé', countryCode: 'MV', iata: 'MLE' }, { id: 'maafushi', nameEn: 'Maafushi', countryCode: 'MV', iata: 'MLE' }, { id: 'beijing', nameEn: 'Beijing', countryCode: 'CN', iata: 'PEK' }];
  const catalog = buildAirportCatalog({ airportRows, countryRows: countries, curatedCities, links: [{ cityId: 'beijing', airportCodes: ['PEK', 'PKX'] }] });
  assert.equal(catalog.cities.cities.find(city => city.iata === 'MLE').curatedCityId, 'male');
  assert.equal(catalog.cities.cities.filter(city => city.curatedCityId === 'beijing').length, 2);
  assert.ok(!catalog.cities.cities.some(city => city.curatedCityId === 'maafushi'));
  assert.ok(catalog.cities.cities.every(city => !('daily' in city) && !('image' in city) && !('attractions' in city)));
});

test('failed source refresh retains both previous snapshots and success metadata', async t => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tusuan-airports-'));
  t.after(() => fs.rm(dataDir, { recursive: true, force: true }));
  const previous = { 'airports.json': '{"oldAirports":true}\n', 'airport-cities.json': '{"oldCities":true}\n' };
  for (const [name, text] of Object.entries(previous)) await fs.writeFile(path.join(dataDir, name), text);
  await fs.writeFile(path.join(dataDir, 'airport-maintenance.json'), JSON.stringify({ lastSuccessAt: '2026-09-01T00:00:00.000Z', counts: { includedAirports: 123 } }));
  const result = await updateAirports({ dataDir, fetchText: async () => { throw new Error('Network unavailable'); }, now: () => new Date('2026-09-22T00:00:00.000Z') });
  assert.equal(result.status, 'error');
  for (const [name, text] of Object.entries(previous)) assert.equal(await fs.readFile(path.join(dataDir, name), 'utf8'), text);
  const maintenance = JSON.parse(await fs.readFile(path.join(dataDir, 'airport-maintenance.json'), 'utf8'));
  assert.equal(maintenance.lastSuccessAt, '2026-09-01T00:00:00.000Z');
  assert.equal(maintenance.counts.includedAirports, 123);
  assert.equal(maintenance.previousSnapshotRetained, true);
  await assert.rejects(fs.access(path.join(dataDir, '.airport-update.lock')));
});

test('seven-day freshness gate avoids a network call while retaining catalog', async t => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tusuan-airport-fresh-'));
  t.after(() => fs.rm(dataDir, { recursive: true, force: true }));
  await fs.writeFile(path.join(dataDir, 'airports.json'), JSON.stringify({ version: 1, airports: [{ id: 'airport-1' }] }));
  await fs.writeFile(path.join(dataDir, 'airport-cities.json'), JSON.stringify({ version: 1, cities: [{ id: 'aircity-1' }] }));
  await fs.writeFile(path.join(dataDir, 'airport-maintenance.json'), JSON.stringify({ lastSuccessAt: '2026-09-21T00:00:00.000Z' }));
  const result = await updateAirports({ ifStale: true, dataDir, now: () => new Date('2026-09-22T00:00:00.000Z'), fetchText: () => { throw new Error('Must not fetch'); } });
  assert.equal(result.status, 'ok');
  assert.equal(result.skipped, true);
});

test('snapshot replacement failure restores the already-replaced first file', async t => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tusuan-airport-rollback-'));
  t.after(() => fs.rm(dataDir, { recursive: true, force: true }));
  const previous = { 'airports.json': '{"oldAirports":true}\n', 'airport-cities.json': '{"oldCities":true}\n' };
  for (const [name, text] of Object.entries(previous)) await fs.writeFile(path.join(dataDir, name), text);
  const csv = rows => [Object.keys(rows[0]).join(','), ...rows.map(record => Object.values(record).map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n');
  const sources = { airports: csv([row(1, { scheduled_service: 'yes' })]), countries: csv(countries), regions: 'code,name,iso_country\nUS-MA,Massachusetts,US\n' };
  const rename = fs.rename;
  let injected = false;
  const mocked = t.mock.method(fs, 'rename', async (from, to) => {
    if (to === path.join(dataDir, 'airport-cities.json') && !injected) { injected = true; throw new Error('Injected replacement failure'); }
    return rename(from, to);
  });
  const result = await updateAirports({ dataDir, minimumAirports: 1, fetchText: async url => sources[url.split('/').pop().replace('.csv', '')] });
  mocked.mock.restore();
  assert.equal(result.status, 'error');
  assert.equal(injected, true);
  for (const [name, text] of Object.entries(previous)) assert.equal(await fs.readFile(path.join(dataDir, name), 'utf8'), text);
  assert.deepEqual((await fs.readdir(dataDir)).filter(name => name.endsWith('.tmp')), []);
});

test('stale dead-process lock is recovered while a live process retains even an old lock', async t => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tusuan-airport-lock-'));
  t.after(() => fs.rm(dataDir, { recursive: true, force: true }));
  const lockPath = path.join(dataDir, '.airport-update.lock');
  const old = new Date(Date.now() - 20 * 60000);
  await fs.writeFile(lockPath, JSON.stringify({ pid: process.pid, startedAt: old.toISOString() }));
  await fs.utimes(lockPath, old, old);
  assert.equal(await acquireAirportLock(lockPath, new Date().toISOString()), null);
  await fs.writeFile(lockPath, JSON.stringify({ pid: 2147483647, startedAt: old.toISOString() }));
  await fs.utimes(lockPath, old, old);
  await fs.writeFile(`${lockPath}.recovery`, JSON.stringify({ pid: 2147483647, startedAt: old.toISOString() }));
  await fs.utimes(`${lockPath}.recovery`, old, old);
  const recovered = await acquireAirportLock(lockPath, new Date().toISOString());
  assert.ok(recovered);
  assert.equal(JSON.parse(await fs.readFile(lockPath, 'utf8')).pid, process.pid);
  await recovered.close();
});
