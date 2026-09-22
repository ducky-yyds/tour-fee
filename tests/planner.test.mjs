import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculatePlan, generateItinerary, convertCurrency, addDays, bookingLinks } from '../shared/planner.mjs';

const city = (id, currency, lat = 10) => ({ id, name: id, nameEn: id, currency, lat, lng: lat, daily: { lodging: [100, 200, 400], food: [10, 20, 40], transport: [5, 10, 20], misc: [1, 2, 4] }, monthly: { rent: [1000, 2000, 4000], utilities: [100, 200, 400] }, budgetBasis: { note: 'test estimates', updatedAt: '2026-09-22' }, attractions: [{ id: `${id}-museum`, name: 'Museum', durationHours: 2, price: { low: 10, high: 20, currency, type: 'official', sourceUrl: 'https://example.com/tickets', checkedAt: '2026-09-22' } }] });
const cities = [city('a', 'CNY', 10), city('b', 'JPY', 20), city('c', 'EUR', 30)];
const rates = { base: 'CNY', rates: { CNY: 1, JPY: 20, EUR: 0.125, USD: 0.15 }, status: 'fresh' };
const plan = (overrides = {}) => ({ originId: 'a', stops: [{ cityId: 'b', days: 4, attractionIds: ['b-museum'] }], departureDate: '2026-10-15', travelers: 2, rooms: 1, currency: 'CNY', mode: 'travel', tier: 1, returnTrip: true, reservePercent: 10, overrides: {}, ...overrides });
const line = (result, id) => result.lines.find(l => l.id === id);
test('native currencies convert through CNY without inverted rates', () => {
  assert.equal(convertCurrency(2000, 'JPY', 'CNY', rates), 100);
  assert.equal(convertCurrency(2000, 'JPY', 'USD', rates), 15);
  assert.equal(convertCurrency(10, 'EUR', 'JPY', rates), 1600);
  assert.throws(() => convertCurrency(10, 'MISSING', 'CNY', rates), /缺少/);
});
test('rooms scale accommodation; people scale food and admissions', () => {
  const a = calculatePlan(plan(), cities, rates);
  const b = calculatePlan(plan({ travelers: 4, rooms: 1 }), cities, rates);
  const c = calculatePlan(plan({ travelers: 4, rooms: 2 }), cities, rates);
  assert.equal(line(a, 'stop-0-lodging').amount, 30); // JPY 200 x 3 nights / 20
  assert.equal(line(a, 'stop-0-lodging').amount, line(b, 'stop-0-lodging').amount);
  assert.equal(line(c, 'stop-0-lodging').amount, 2 * line(a, 'stop-0-lodging').amount);
  assert.equal(line(b, 'stop-0-food').amount, 2 * line(a, 'stop-0-food').amount);
  assert.equal(line(b, 'stop-0-attraction-b-museum').amount, 2 * line(a, 'stop-0-attraction-b-museum').amount);
});
test('multi-stop calendar counts all days and subtracts exactly one final night', () => {
  const p = plan({ stops: [{ cityId: 'b', days: 3, attractionIds: [] }, { cityId: 'c', days: 2, attractionIds: [] }] });
  const result = calculatePlan(p, cities, rates);
  assert.equal(result.days, 5); assert.equal(result.nights, 4);
  assert.equal(line(result, 'stop-0-lodging').quantity, 3);
  assert.equal(line(result, 'stop-1-lodging').quantity, 1);
  assert.equal(result.legs.length, 3);
  assert.deepEqual(result.legs.map(l => l.date), ['2026-10-15', '2026-10-18', '2026-10-19']);
  assert.equal(generateItinerary(p, cities).length, 5);
});
test('one-day trip has zero nights; no selected attractions stays empty', () => {
  const p = plan({ stops: [{ cityId: 'b', days: 1, attractionIds: [] }], returnTrip: false });
  const result = calculatePlan(p, cities, rates);
  assert.equal(result.nights, 0); assert.equal(line(result, 'stop-0-lodging').amount, 0);
  assert.equal(result.lines.filter(l => l.category === 'attractions').length, 0);
  assert.equal(generateItinerary(p, cities)[0].items.some(i => i.kind === 'attraction'), false);
  assert.equal(result.legs.length, 1);
});
test('monthly stay uses room-month quantities, not people or nightly hotel prices', () => {
  const result = calculatePlan(plan({ mode: 'stay', stops: [{ cityId: 'b', days: 30, attractionIds: [] }], travelers: 2, rooms: 1 }), cities, rates);
  assert.equal(result.nights, 30);
  assert.equal(line(result, 'stop-0-lodging').quantity, 1);
  assert.equal(line(result, 'stop-0-lodging').amount, 100);
  assert.equal(line(result, 'stop-0-utilities').amount, 10);
  assert.equal(result.endDate, '2026-11-14');
  assert.equal(result.legs.at(-1).date, '2026-11-14');
  const schedule = generateItinerary(plan({ mode: 'stay', stops: [{ cityId: 'b', days: 30, attractionIds: [] }] }), cities);
  assert.equal(schedule.length, 30);
  assert.match(schedule.at(-1).items.at(-1).title, /次日退房/);
});
test('a local trip has no intercity or transfer fee and no fictional arrival', () => {
  const p = plan({ stops: [{ cityId: 'a', days: 1, attractionIds: [] }] });
  const result = calculatePlan(p, cities, rates);
  assert.equal(result.legs.length, 0);
  assert.equal(result.lines.some(l => ['intercity', 'transfer'].includes(l.category)), false);
  assert.equal(line(result, 'stop-0-lodging').sourceUrl, null);
  assert.ok(generateItinerary(p, cities)[0].items[0].title.includes('本地旅程'));
});
test('user override is party total, fixes range and is confirmed only explicitly', () => {
  const result = calculatePlan(plan({ overrides: { 'stop-0-lodging': { amount: 1234.56, confirmed: true }, visa: { amount: 600, confirmed: false } } }), cities, rates);
  const lodging = line(result, 'stop-0-lodging');
  assert.equal(lodging.amount, 1234.56); assert.equal(lodging.low, 1234.56); assert.equal(lodging.high, 1234.56);
  assert.equal(lodging.sourceType, 'user'); assert.equal(result.confirmedCount, 1); assert.equal(result.confirmedAmount, 1234.56);
  assert.equal(line(result, 'visa').amount, 600);
  assert.equal(line(result, 'reserve').amount, Math.round(result.subtotal * 10) / 100);
});
test('bounds, categories and person/day totals reconcile at every tier', () => {
  for (const tier of [0, 1, 2]) {
    const r = calculatePlan(plan({ tier }), cities, rates);
    const sum = values => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;
    assert.equal(r.total, sum(r.lines.map(l => l.amount)));
    assert.equal(r.total, sum(r.categories.map(c => c.amount)));
    assert.ok(r.low <= r.total && r.total <= r.high);
    assert.equal(r.perPerson, Math.round(r.total / 2 * 100) / 100);
    assert.equal(r.perDay, Math.round(r.total / 4 * 100) / 100);
  }
});
test('validates inputs rather than silently dropping invalid cities or values', () => {
  for (const bad of [{ travelers: 0 }, { rooms: 3 }, { tier: 9 }, { departureDate: '2026-02-31' }, { stops: [] }, { stops: [{ cityId: 'b', days: -1 }] }, { stops: [{ cityId: 'b', days: 2.5 }] }, { stops: [{ cityId: 'unknown', days: 3 }] }, { overrides: { visa: { amount: -1 } } }, { stops: [{ cityId: 'b', days: 2, attractionIds: ['unknown'] }] }]) {
    assert.throws(() => calculatePlan(plan(bad), cities, rates));
  }
});
test('date arithmetic is UTC stable across leap years and month boundaries', () => {
  assert.equal(addDays('2028-02-28', 2), '2028-03-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});
test('booking links preserve explicit dates, destination and party size', () => {
  const links = bookingLinks({ origin: cities[0], destination: cities[1], departureDate: '2026-10-15', returnDate: '2026-10-18', travelers: 3, rooms: 2 });
  const hotel = new URL(links.hotels);
  assert.equal(hotel.searchParams.get('group_adults'), '3');
  assert.equal(hotel.searchParams.get('no_rooms'), '2');
  assert.equal(hotel.searchParams.get('checkout'), '2026-10-18');
  assert.ok(decodeURIComponent(links.flights).includes('returning 2026-10-18'));
});
test('attraction currency takes precedence over city currency', () => {
  const local = structuredClone(cities); local[1].attractions[0].price.currency = 'EUR';
  const result = calculatePlan(plan(), local, rates);
  assert.equal(line(result, 'stop-0-attraction-b-museum').amount, 320); // 20 EUR x 2 / .125
});
test('all shipped cities produce finite budgets with their own native currencies', () => {
  const catalog = JSON.parse(readFileSync(new URL('../data/cities.json', import.meta.url), 'utf8'));
  const currencies = Object.fromEntries(catalog.map(c => [c.currency, 1]));
  for (const c of catalog) for (const mode of ['travel', 'stay']) {
    const result = calculatePlan(plan({ originId: 'shanghai', stops: [{ cityId: c.id, days: 4, attractionIds: c.attractions.map(a => a.id) }], mode }), catalog, { rates: { ...currencies, CNY: 1, EUR: 1 } });
    assert.ok(Number.isFinite(result.total));
    assert.ok(result.high >= result.total && result.low <= result.total);
  }
});
