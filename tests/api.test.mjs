import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';

test('API serves current catalog, source failure state, validated plans and explicit errors', async () => {
  process.env.PORT = '0';
  const { server } = await import('../server/index.mjs');
  try {
    if (!server.listening) await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    const catalog = await (await fetch(`${base}/api/catalog`)).json();
    const expectedCities = JSON.parse(readFileSync(new URL('../data/cities.json', import.meta.url), 'utf8'));
    assert.equal(catalog.cities.length, expectedCities.length);
    assert.ok(catalog.cities.length >= 18);
    assert.equal(catalog.rates.base, 'CNY');
    assert.equal(catalog.providerStatus.flights.status, 'not-connected');
    assert.ok(catalog.sources.some(s => s.id === 'tokyo-subway'));
    const photo = await fetch(base + catalog.cities.find(c => c.image?.url)?.image.url);
    assert.equal(photo.status, 200);
    assert.match(photo.headers.get('content-type'), /^image\//);
    assert.equal((await fetch(base + '/images/does-not-exist.jpg')).status, 404);
    const plan = { originId: 'shanghai', stops: [{ cityId: 'tokyo', days: 4, attractionIds: [] }], departureDate: '2026-10-15', travelers: 2, rooms: 1, currency: 'CNY' };
    const result = await fetch(`${base}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) });
    assert.equal(result.status, 200);
    const payload = await result.json();
    assert.equal(payload.itinerary.length, 4);
    assert.ok(Number.isFinite(payload.itinerary[0].costs.food));
    assert.ok(payload.itinerary[0].items.some(item => item.kind === 'meal' && Number.isFinite(item.cost.amount)));
    assert.equal((await fetch(`${base}/api/plan`, { method: 'POST', body: '{}' })).status, 400);
    assert.equal((await fetch(`${base}/api/unknown`)).status, 404);
    const status = await (await fetch(`${base}/api/data-status`)).json();
    assert.equal(status.cityCount, expectedCities.length);
    assert.ok(Array.isArray(status.history));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
