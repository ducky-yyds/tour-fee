import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { preserveUnchangedQuotes } from '../shared/quote-preservation.mjs';
import { calculatePlan } from '../shared/planner.mjs';
const read = name => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const cities = read('cities.json'), rates = read('fx-reference.json');
test('appended country preserves unchanged recorded costs but releases obsolete room-night and return quotes', () => {
  const previous = { originId: 'shanghai', departureDate: '2026-11-12', mode: 'travel', stops: [{ cityId: 'beijing', days: 5, attractionIds: ['forbidden-city'] }], travelers: 2, rooms: 1, tier: 1, currency: 'CNY', reservePercent: 10, returnTrip: true,
    overrides: { 'stop-0-food': { amount: 999, confirmed: true }, 'stop-0-lodging': { amount: 2789, confirmed: true }, 'leg-0': { amount: 1234, confirmed: true }, 'leg-return': { amount: 1500, confirmed: true } } };
  // Use the actual maintained admission ID, independent of its human-readable name.
  previous.stops[0].attractionIds = [cities.find(city => city.id === 'beijing').attractions[0].id];
  const next = { ...previous, stops: [...previous.stops, { cityId: 'bangkok', days: 7, attractionIds: [] }] };
  const result = preserveUnchangedQuotes(previous, next, cities, rates);
  assert.deepEqual(Object.keys(result.overrides).sort(), ['leg-0', 'stop-0-food']);
  assert.deepEqual(result.resetIds.sort(), ['leg-return', 'stop-0-lodging']);
  assert.equal(result.overrides['stop-0-food'].confirmed, true);
  assert.notEqual(result.overrides['stop-0-food'], previous.overrides['stop-0-food']);
  const budget = calculatePlan({ ...next, overrides: result.overrides }, cities, rates);
  assert.equal(budget.lines.find(line => line.id === 'stop-0-lodging').quantity, 5);
  assert.equal(budget.lines.find(line => line.id === 'stop-0-lodging').confirmed, false);
  assert.equal(previous.overrides['stop-0-lodging'].amount, 2789);
});
