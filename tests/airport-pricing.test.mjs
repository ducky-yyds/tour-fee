import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeAirportCities } from '../shared/airport-catalog.mjs';
import { calculatePlan, generateItinerary } from '../shared/planner.mjs';

const curated = { id: 'curated', name: 'Curated', nameEn: 'Curated', countryCode: 'US', currency: 'CNY', lat: 40, lng: -74, tags: [], attractions: [], daily: { lodging: [100, 200, 300], food: [20, 40, 80], transport: [10, 20, 40], misc: [5, 10, 20] }, monthly: { rent: [1000, 2000, 3000], utilities: [100, 200, 300] } };
const raw = { id: 'aircity-test', name: 'Airport town', country: 'Example', countryCode: 'JP', lat: 35, lng: 139, iata: 'ZZZ', airportCodes: ['ZZZ'], airportIds: ['airport-1'], sourceUrl: 'https://ourairports.com/' };
const cities = mergeAirportCities([curated], [raw]);
const fx = { rates: { CNY: 1, USD: 0.14 } };
const plan = (patch = {}) => ({ originId: 'curated', stops: [{ cityId: raw.id, days: 3, attractionIds: [] }], departureDate: '2026-12-15', travelers: 2, rooms: 1, tier: 1, currency: 'CNY', returnTrip: true, reservePercent: 10, ...patch });

test('airport merge retains curated records and explicitly separates budget-entry currency from local currency', () => {
  const merged = mergeAirportCities([curated], [raw, raw, { ...raw, id: 'mapped', curatedCityId: curated.id }, { ...raw, id: 'bad', lat: NaN }]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0], curated);
  assert.equal(merged[1].costsUnknown, true);
  assert.equal(merged[1].currency, 'USD');
  assert.equal(merged[1].localCurrency, null);
  assert.equal(merged[1].budgetCurrencyOnly, true);
  assert.deepEqual(merged[1].attractions, []);
  assert.deepEqual(merged[1].experiences, []);
  assert.equal(merged[1].missingPrices.food, true);
  assert.equal(raw.currency, undefined);
});

test('unpriced positive-quantity local costs produce an incomplete known subtotal, never free-price claims', () => {
  const result = calculatePlan(plan(), cities, fx);
  assert.equal(result.incomplete, true);
  assert.equal(result.knownSubtotal, result.total);
  assert.deepEqual(result.missingCosts.map(row => row.category).sort(), ['food', 'lodging', 'misc', 'transport']);
  for (const row of result.lines.filter(row => row.missingPrice)) {
    assert.equal(row.sourceType, 'missing');
    assert.ok(row.quantity > 0);
    assert.equal(row.amount, 0);
    assert.equal(row.confirmed, false);
  }
  assert.ok(result.total > 0, 'distance-based tickets and general allowances still contribute known estimates');
  assert.equal(result.costGroups.find(group => group.id === 'daily').missingCount, 4);
  assert.equal(result.categories.find(category => category.id === 'food').missingPrice, true);
});

test('zero-night lodging is not missing, while explicit zero overrides resolve unknown positive costs', () => {
  const initial = plan({ stops: [{ cityId: raw.id, days: 1, attractionIds: [] }] });
  const result = calculatePlan(initial, cities, fx);
  assert.equal(result.lines.find(row => row.id === 'stop-0-lodging').missingPrice, false);
  assert.equal(result.missingCosts.length, 3);
  const overrides = Object.fromEntries(result.missingCosts.map(row => [row.id, { amount: 0, confirmed: true }]));
  const entered = calculatePlan({ ...initial, overrides }, cities, fx);
  assert.equal(entered.incomplete, false);
  for (const id of Object.keys(overrides)) {
    assert.equal(entered.lines.find(row => row.id === id).sourceType, 'user');
    assert.equal(entered.lines.find(row => row.id === id).missingPrice, false);
    assert.equal(entered.lines.find(row => row.id === id).referenceMissingPrice, true);
    assert.equal(entered.lines.find(row => row.id === id).originalSourceType, 'missing');
  }
});

test('daily preferences including zero resolve missing costs in native budget-entry currency', () => {
  const preferencePlan = plan({ stops: [{ cityId: raw.id, days: 3, attractionIds: [], dailyPreferences: { lodging: 0, food: 14, transport: 0, misc: 0 } }] });
  const result = calculatePlan(preferencePlan, cities, fx);
  assert.equal(result.incomplete, false);
  assert.equal(result.lines.find(row => row.id === 'stop-0-food').amount, 600);
  assert.equal(result.lines.find(row => row.id === 'stop-0-food').nativeCurrency, 'USD');
  assert.equal(result.lines.find(row => row.id === 'stop-0-lodging').amount, 0);
  assert.throws(() => calculatePlan(plan({ stops: [{ cityId: raw.id, days: 2, dailyPreferences: { misc: -1 } }] }), cities, fx), /有效范围/);
});

test('monthly rent and utilities remain unknown until supplied; an explicit hotel replaces unknown rent', () => {
  const stay = calculatePlan(plan({ mode: 'stay', stops: [{ cityId: raw.id, days: 30, attractionIds: [] }] }), cities, fx);
  assert.deepEqual(stay.missingCosts.map(row => row.category).sort(), ['food', 'lodging', 'misc', 'transport', 'utilities']);
  const hotel = { id: 'known-hotel', cityId: raw.id, kind: 'hotel', name: 'Known hotel', durationMinutes: 0, priceOptions: [{ id: 'room', name: 'Room', low: 14, high: 14, currency: 'USD', type: 'estimate', unit: 'room-night' }] };
  const withHotel = cities.map(city => city.id === raw.id ? { ...city, experiences: [hotel] } : city);
  const result = calculatePlan(plan({ mode: 'stay', stops: [{ cityId: raw.id, days: 3, attractionIds: [], experienceSelections: [{ experienceId: hotel.id, optionId: 'room' }] }] }), withHotel, fx);
  assert.equal(result.lines.find(row => row.id === 'stop-0-lodging').amount, 300);
  assert.equal(result.lines.find(row => row.id === 'stop-0-lodging').missingPrice, false);
  assert.equal(result.lines.find(row => row.id === 'stop-0-utilities').missingPrice, false);
});

test('airport-only origin does not make priced destinations incomplete or alter curated daily prices', () => {
  const result = calculatePlan(plan({ originId: raw.id, stops: [{ cityId: curated.id, days: 3, attractionIds: [] }] }), cities, fx);
  assert.equal(result.incomplete, false);
  assert.equal(result.missingCosts.length, 0);
  assert.equal(result.lines.find(row => row.id === 'stop-0-lodging').amount, 400);
  assert.equal(result.lines.find(row => row.id === 'stop-0-food').amount, 240);
});

test('daily itinerary flags unknown food and transport without losing known ticket allocations', () => {
  const days = generateItinerary(plan(), cities, fx);
  assert.ok(days.every(day => day.costs.missingPrice));
  assert.ok(days.every(day => day.costs.missingCategories.includes('food') && day.costs.missingCategories.includes('transport')));
  const meals = days.flatMap(day => day.items).filter(item => item.kind === 'meal');
  assert.ok(meals.every(item => item.cost.missingPrice && item.cost.amount === null && item.cost.sourceType === 'missing'));
  assert.ok(days.some(day => day.costs.intercity > 0));
});
