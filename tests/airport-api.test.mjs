import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { getAirportInventory, getCatalog, searchAirports } from '../server/catalog.mjs';

test('airport catalog preserves curated coverage, serves compact extra cities, and reuses unchanged raw inventory', () => {
  const inventory = getAirportInventory();
  assert.ok(inventory.available);
  assert.ok(inventory.airports.length > 40000);
  assert.ok(inventory.cities.length > 30000);
  assert.equal(inventory.airports, getAirportInventory().airports);
  assert.equal(inventory.cities, getAirportInventory().cities);
  const catalog = getCatalog();
  const maintainedCities = JSON.parse(readFileSync(new URL('../data/cities.json', import.meta.url), 'utf8'));
  assert.deepEqual(catalog.cities.map(city => city.id).sort(), maintainedCities.map(city => city.id).sort());
  assert.equal(catalog.airportCoverage.airportCount, inventory.airports.length);
  assert.equal(catalog.airportCoverage.additionalCityCount, catalog.airportCities.length);
  assert.ok(catalog.airportCities.every(city => !city.daily && !city.attractions && !city.airportIds));
  const linked = new Set(inventory.cities.filter(city => city.curatedCityId).map(city => city.id));
  assert.ok(catalog.airportCities.every(city => !linked.has(city.id)));
  const beijing = catalog.cities.find(city => city.id === 'beijing');
  const shanghai = catalog.cities.find(city => city.id === 'shanghai');
  assert.ok(beijing.scheduledService && shanghai.scheduledService);
  assert.ok(['PEK', 'PKX'].every(code => beijing.airportCodes.includes(code)));
  assert.ok(['SHA', 'PVG'].every(code => shanghai.airportCodes.includes(code)));
  assert.ok(beijing.airportCount >= 2 && shanghai.airportCount >= 2);
  assert.equal(beijing.lat, 39.9042, 'curated city-centre coordinates remain unchanged');
});

test('airport search paginates deterministically, supports detailed-city mappings and rejects invalid boundaries', () => {
  const first = searchAirports();
  assert.equal(first.airports.length, 40);
  assert.equal(first.limit, 40);
  assert.equal(first.hasMore, true);
  const second = searchAirports({ offset: 40, limit: 40 });
  assert.equal(second.total, first.total);
  assert.ok(!second.airports.some(airport => first.airports.some(other => other.id === airport.id)));
  const beijing = searchAirports({ cityId: 'beijing', limit: 100 });
  assert.ok(beijing.airports.some(airport => airport.iata === 'PEK'));
  const airportCity = getAirportInventory().cities.find(city => !city.curatedCityId);
  const group = searchAirports({ cityId: airportCity.id, limit: 100 });
  assert.ok(group.airports.length > 0);
  assert.ok(group.airports.every(airport => airport.cityId === airportCity.id));
  assert.ok(searchAirports({ q: 'PEK', limit: 100 }).airports.some(airport => airport.iata === 'PEK'));
  for (const options of [{ limit: 101 }, { limit: 0 }, { offset: -1 }, { offset: 1.5 }, { cityId: '../bad' }, { q: 'a'.repeat(151) }]) assert.throws(() => searchAirports(options));
});

test('HTTP airport lookup validates pagination, compresses large catalogs, and accepts airport-origin and airport-destination plans', async () => {
  process.env.PORT = '0';
  const { server } = await import('../server/index.mjs');
  try {
    if (!server.listening) await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const lookup = await fetch(`${base}/api/airports?cityId=beijing&limit=100`);
    assert.equal(lookup.status, 200);
    assert.ok((await lookup.json()).airports.some(airport => airport.iata === 'PEK'));
    assert.equal((await fetch(`${base}/api/airports?limit=101`)).status, 400);
    assert.equal((await fetch(`${base}/api/airports?offset=-1`)).status, 400);
    const response = await fetch(`${base}/api/catalog`, { headers: { 'Accept-Encoding': 'gzip' } });
    assert.equal(response.headers.get('content-encoding'), 'gzip');
    assert.match(response.headers.get('vary'), /Accept-Encoding/);
    const catalog = await response.json();
    assert.ok(Number(response.headers.get('content-length')) < JSON.stringify(catalog).length / 2);
    const id = catalog.airportCities.find(city => city.scheduledService).id;
    const plan = { originId: id, stops: [{ cityId: 'tokyo', days: 4, attractionIds: [] }], departureDate: '2026-12-15', travelers: 1, rooms: 1, currency: 'USD' };
    const send = body => fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const fromAirport = await send(plan);
    assert.equal(fromAirport.status, 200);
    assert.equal((await fromAirport.json()).incomplete, false);
    const toAirport = await send({ ...plan, originId: 'tokyo', stops: [{ cityId: id, days: 3, attractionIds: [] }] });
    assert.equal(toAirport.status, 200);
    const result = await toAirport.json();
    assert.equal(result.incomplete, true);
    assert.equal(result.missingCosts.length, 4);
    assert.ok(result.itinerary.some(day => day.costs.missingPrice));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
