import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlan, generateItinerary } from '../shared/planner.mjs';
import { buildDayAssignments, optimizeDayRoute, allocateMoney, geographicDistanceKm, formatItineraryTime } from '../shared/itinerary.mjs';

const spot = (id, lng, hours = 1.5) => ({ id, name: id, nameEn: id, description: `${id} distinct attraction`, lat: 35, lng, durationHours: hours, image: { url: `/${id}.jpg` }, features: [`${id} feature`], price: { low: 100, high: 250, currency: 'JPY', type: 'official', sourceUrl: `https://example.com/${id}`, checkedAt: '2026-09-22' } });
const fixtureCity = { id: 'town', name: 'Town', nameEn: 'Town', currency: 'JPY', lat: 35, lng: 139, daily: { lodging: [1000, 3000, 9000], food: [1011, 3091, 12031], transport: [271, 707, 1923], misc: [61, 127, 313] }, monthly: { rent: [30000, 60000, 150000], utilities: [4000, 8000, 16000] }, attractions: [spot('a', 139.002), spot('b', 139.15), spot('c', 139.015), spot('d', 139.16)], tags: ['City'], image: { url: '/town.jpg' } };
const origin = { ...fixtureCity, id: 'origin', name: 'Origin', lng: 135 };
const cities = [origin, fixtureCity];
const rates = { base: 'CNY', rates: { CNY: 1, JPY: 23.504, USD: 0.14938 }, status: 'fresh' };
const plan = patch => ({ originId: 'origin', stops: [{ cityId: 'town', days: 3, attractionIds: ['a', 'b', 'c', 'd'] }], departureDate: '2026-10-15', travelers: 3, rooms: 2, currency: 'CNY', tier: 1, returnTrip: true, reservePercent: 10, overrides: {}, ...patch });
const cents = value => Math.round(value * 100);
const sumCents = values => values.reduce((s, value) => s + cents(value), 0);

test('custom day assignments and order are honored exactly; new selections use least-loaded day', () => {
  const stop = { days: 3, attractionIds: ['a', 'b', 'c', 'd'], dayPlans: [['b', 'a'], ['c'], []] };
  assert.deepEqual(buildDayAssignments(stop, fixtureCity), [['b', 'a'], ['c'], ['d']]);
  const custom = { ...stop, dayPlans: [['b', 'a'], ['d', 'c'], []] };
  const before = JSON.stringify(custom);
  assert.deepEqual(buildDayAssignments(custom, fixtureCity), custom.dayPlans);
  assert.equal(JSON.stringify(custom), before);
  const schedule = generateItinerary(plan({ stops: [{ ...custom, cityId: 'town' }] }), cities, rates);
  assert.deepEqual(schedule.map(d => d.attractionIds), custom.dayPlans);
  assert.deepEqual(schedule[1].items.filter(i => i.kind === 'attraction').map(i => i.attractionId), ['d', 'c']);
});
test('shrinking days, stale IDs and duplicate assignments never lose selected attractions', () => {
  const result = buildDayAssignments({ days: 2, attractionIds: ['a', 'b', 'c', 'd', 'a'], dayPlans: [['b', 'b', 'ghost'], ['a'], ['c', 'd']] }, fixtureCity);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map(d => d[0]), ['b', 'a']);
  assert.deepEqual([...result.flat()].sort(), ['a', 'b', 'c', 'd']);
  assert.deepEqual(buildDayAssignments({ days: 2, attractionIds: [], dayPlans: [['a']] }, fixtureCity), [[], []]);
});
test('all scheduled events remain chronological and non-overlapping, including meals and midnight', () => {
  const longCity = { ...fixtureCity, attractions: fixtureCity.attractions.map(a => ({ ...a, durationHours: 6 })) };
  const p = plan({ stops: [{ cityId: 'town', days: 1, startTime: '12:00', attractionIds: ['a', 'b', 'c', 'd'], dayPlans: [['a', 'b', 'c', 'd']] }] });
  const [day] = generateItinerary(p, [origin, longCity], rates);
  for (let i = 0; i < day.items.length; i++) {
    assert.equal(day.items[i].endMinute - day.items[i].startMinute, day.items[i].durationMinutes);
    if (i) assert.ok(day.items[i].startMinute >= day.items[i - 1].endMinute);
    assert.match(day.items[i].time, /^\d{2}:\d{2}(\+\d+)?$/);
  }
  assert.deepEqual(day.items.filter(i => i.kind === 'meal').map(i => i.mealType), ['breakfast', 'lunch', 'dinner']);
  assert.ok(day.items.some(i => i.time.includes('+1')));
  for (const code of ['busy-day', 'late-finish', 'late-attraction', 'after-midnight', 'busy-arrival', 'busy-return']) assert.ok(day.warnings.some(w => w.code === code), code);
  assert.equal(formatItineraryTime(1505), '01:05+1');
});
test('clear geographic detours produce an opt-in suggestion without changing the manual route', () => {
  const order = ['a', 'b', 'c', 'd'];
  const p = plan({ stops: [{ cityId: 'town', days: 1, attractionIds: order, dayPlans: [order] }] });
  const [day] = generateItinerary(p, cities, rates);
  const warning = day.warnings.find(w => w.code === 'detour');
  assert.ok(warning);
  assert.deepEqual(day.attractionIds, order);
  assert.equal(warning.suggestedOrder[0], 'a');
  assert.deepEqual([...warning.suggestedOrder].sort(), [...order].sort());
  assert.deepEqual(optimizeDayRoute(order, fixtureCity), warning.suggestedOrder);
  assert.deepEqual(order, ['a', 'b', 'c', 'd']);
});
test('meal, transit and admission amounts reconcile exactly to their parent lines at all tiers and overrides', () => {
  for (const tier of [0, 1, 2]) for (const currency of ['CNY', 'USD']) for (const overridden of [false, true]) {
    const p = plan({ tier, currency, stops: [{ cityId: 'town', days: 3, attractionIds: ['a', 'b', 'c', 'd'], dayPlans: [['a'], ['b', 'd', 'c'], []] }], overrides: overridden ? { 'stop-0-food': { amount: 1000.01, confirmed: true }, 'stop-0-transport': { amount: 7.03, confirmed: true }, 'stop-0-attraction-d': { amount: 44.44, confirmed: true } } : {} });
    const budget = calculatePlan(p, cities, rates), days = generateItinerary(p, cities, rates);
    const parentLines = budget.lines.filter(l => ['food', 'transport', 'attractions', 'intercity', 'transfer'].includes(l.category));
    for (const line of parentLines) {
      const allocated = days.flatMap(day => day.items).filter(item => item.cost.budgetLineId === line.id);
      assert.equal(sumCents(allocated.map(item => item.cost.amount)), cents(line.amount), `${tier}/${currency}/${overridden}/${line.id}`);
    }
    for (const day of days) {
      assert.equal(sumCents(day.items.map(i => i.cost.amount)), cents(day.costs.total));
      assert.equal(sumCents(day.items.filter(i => i.kind === 'meal').map(i => i.cost.amount)), cents(day.costs.food));
      assert.equal(sumCents(day.items.filter(i => i.kind === 'transport').map(i => i.cost.amount)), cents(day.costs.transport));
    }
    assert.equal(sumCents(days.map(d => d.costs.total)), sumCents(parentLines.map(l => l.amount)));
  }
});
test('walks are free and unused transport budget stays explicit on free or walk-only days', () => {
  const walkingCity = { ...fixtureCity, attractions: [spot('a', 139.002), spot('b', 139.004)] };
  const p = plan({ stops: [{ cityId: 'town', days: 2, attractionIds: ['a', 'b'], dayPlans: [['a', 'b'], []] }] });
  const days = generateItinerary(p, [origin, walkingCity], rates);
  const walks = days[0].items.filter(i => i.segment?.mode === 'walk');
  assert.ok(walks.length);
  assert.ok(walks.every(i => i.cost.amount === 0 && i.segment.estimated));
  assert.ok(walks.every(i => i.segment.distanceKm > 0 && i.segment.distanceKm < 1));
  assert.ok(days.every(day => day.items.some(i => i.allowance && i.cost.amount === day.costs.transport)));
  assert.ok(geographicDistanceKm(walkingCity.attractions[0], walkingCity.attractions[1]) < 1);
});
test('no-rate legacy calls keep schedules usable and mark financial amounts unavailable', () => {
  const days = generateItinerary(plan(), cities);
  assert.equal(days.length, 3);
  assert.equal(days[0].costs.total, null);
  assert.equal(days[0].items.find(i => i.kind === 'meal').cost.amount, null);
  assert.ok(days[0].items.find(i => i.kind === 'attraction').image);
  assert.deepEqual(days[0].items.find(i => i.kind === 'attraction').features, ['a feature']);
});
test('money allocation preserves cents, zero values and arbitrary weighting', () => {
  assert.deepEqual(allocateMoney(0.01, [1, 1, 1]), [0.01, 0, 0]);
  assert.deepEqual(allocateMoney(0, [2, 4, 4]), [0, 0, 0]);
  assert.equal(sumCents(allocateMoney(987654.32, [1, 3, 7, 23, 51])), 98765432);
  assert.throws(() => generateItinerary(plan({ stops: [{ cityId: 'town', days: 1, attractionIds: [], startTime: '06:00' }] }), cities, rates), /07:00/);
});
