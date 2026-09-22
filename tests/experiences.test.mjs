import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculatePlan, generateItinerary, suggestStopPlan, applyExperienceSelection, resolveExperienceSelections, experienceLineId, removeExperienceSelection } from '../shared/planner.mjs';

const option = (id, patch = {}) => ({ id, name: id, low: 100, high: 200, currency: 'JPY', unit: 'person', type: 'official', sourceUrl: 'https://example.org/official', checkedAt: '2026-09-22', includes: [], excludes: [], ...patch });
const offer = (id, kind, patch = {}) => ({ id, cityId: 'town', kind, name: id, provider: 'Official venue', lat: 35.004, lng: 139.003, durationMinutes: kind === 'hotel' ? 0 : 60, priceOptions: [option('standard', kind === 'hotel' ? { unit: 'room-night', low: 1000, high: 2000 } : {})], ...patch });
const town = { id: 'town', name: 'Town', lat: 35, lng: 139, currency: 'JPY', daily: { lodging: [1000, 3000, 9000], food: [500, 1000, 3000], transport: [100, 300, 1000], misc: [100, 200, 400] }, monthly: { rent: [10000, 30000, 90000], utilities: [1000, 3000, 9000] }, attractions: [{ id: 'sight', name: 'Sight', lat: 35.002, lng: 139.001, durationHours: 2, price: { low: 200, high: 200, currency: 'JPY', type: 'official' } }], experiences: [offer('meal', 'restaurant', { mealType: 'lunch' }), offer('hotel', 'hotel'), offer('activity', 'experience', { durationMinutes: 120 })] };
const origin = { ...town, id: 'origin', name: 'Origin', lat: 32, experiences: [], attractions: [] };
const cities = [origin, town], rates = { rates: { CNY: 1, JPY: 20, USD: 0.15 }, status: 'fresh' };
const choice = (id, patch = {}) => ({ experienceId: id, optionId: 'standard', dayIndex: 0, ...patch });
const stop = patch => ({ cityId: 'town', days: 2, attractionIds: ['sight'], dayPlans: [['sight'], []], ...patch });
const plan = s => ({ originId: 'origin', stops: [s], departureDate: '2026-10-22', travelers: 3, rooms: 2, currency: 'CNY', tier: 1, reservePercent: 10, returnTrip: true, overrides: {} });
const cents = n => Math.round(n * 100);
const sum = values => values.reduce((s, value) => s + cents(value), 0);
const assertNoOverlap = itinerary => itinerary.forEach(day => day.items.forEach((item, index) => { if (index) assert.ok(item.startMinute >= day.items[index - 1].endMinute, `${item.title}: time overlaps`); }));

test('concrete restaurant replaces only its meal slot and reconciles baseline, restaurant and total overrides', () => {
  const s = stop({ experienceSelections: [choice('meal', { mealType: 'lunch' })] });
  for (const tier of [0, 1, 2]) {
    const p = { ...plan(s), tier, overrides: { 'stop-0-food': { amount: 123.47, confirmed: true }, [experienceLineId(0, s.experienceSelections[0])]: { amount: 44.19, confirmed: true }, 'stop-0-transport': { amount: 3.17, confirmed: true } } };
    const budget = calculatePlan(p, cities, rates), days = generateItinerary(p, cities, rates);
    const food = budget.lines.filter(l => l.category === 'food');
    assert.equal(food.length, 2);
    assert.equal(food.find(l => l.id === 'stop-0-food').quantity, 1.6 * 3);
    assert.match(food.find(l => l.id === 'stop-0-food').note, /仅覆盖其余餐次/);
    assert.equal(sum(days.flatMap(d => d.items.filter(i => i.kind === 'meal').map(i => i.cost.amount))), sum(food.map(l => l.amount)));
    assert.equal(days[0].items.filter(i => i.mealType === 'lunch').length, 1);
    assert.equal(days[0].items.find(i => i.mealType === 'lunch').experienceId, 'meal');
    assert.equal(days[0].items.find(i => i.mealType === 'lunch').cost.amount, 44.19);
    assert.equal(sum(days.map(d => d.costs.food)), sum(food.map(l => l.amount)));
    assert.equal(sum(days.flatMap(d => d.items.filter(i => i.kind === 'transport').map(i => i.cost.amount))), 317);
    assertNoOverlap(days);
  }
  const unmodified = calculatePlan(plan(s), cities, rates);
  assert.equal(unmodified.lines.find(l => l.id === 'stop-0-food').amount, 1000 * 1.6 * 3 / 20);
});

test('hotel replaces room-night model including stay mode and no phantom one-day lodging', () => {
  const s = stop({ days: 3, experienceSelections: [choice('hotel')] });
  const p = plan(s), budget = calculatePlan(p, cities, rates);
  assert.equal(budget.lines.filter(l => l.category === 'lodging').length, 1);
  assert.equal(budget.lines.find(l => l.category === 'lodging').amount, 1500 * 2 * 2 / 20);
  assert.equal(budget.lines.find(l => l.category === 'lodging').experienceId, 'hotel');
  assert.equal(generateItinerary(p, cities, rates)[0].routeBasis, 'geographic-model-with-selected-hotel');
  const stay = calculatePlan({ ...p, mode: 'stay' }, cities, rates);
  assert.equal(stay.lines.find(l => l.category === 'lodging').amount, 1500 * 3 * 2 / 20);
  assert.equal(stay.lines.find(l => l.category === 'utilities').amount, 0);
  const oneDay = calculatePlan(plan({ ...s, days: 1 }), cities, rates);
  assert.equal(oneDay.lines.find(l => l.category === 'lodging').amount, 0);
  assert.ok(oneDay.warnings.some(w => /没有对应住宿夜数/.test(w)));
});

test('selection helpers replace a meal slot and hotel atomically and validate limits', () => {
  const city = { ...town, experiences: [...town.experiences, offer('meal-other', 'restaurant'), offer('hotel-other', 'hotel')] };
  let s = applyExperienceSelection(stop(), city, choice('meal', { mealType: 'dinner' }));
  s = applyExperienceSelection(s, city, choice('meal-other', { mealType: 'dinner' }));
  assert.equal(s.experienceSelections.length, 1);
  assert.equal(s.experienceSelections[0].experienceId, 'meal-other');
  s = applyExperienceSelection(s, city, choice('hotel')); s = applyExperienceSelection(s, city, choice('hotel-other'));
  assert.equal(s.experienceSelections.length, 2);
  const [row] = resolveExperienceSelections(s, city);
  assert.equal(removeExperienceSelection(s, city, row.key).experienceSelections.length, 1);
  assert.throws(() => resolveExperienceSelections(stop({ experienceSelections: [choice('meal'), choice('meal')] }), city), /只能选择|重复/);
  assert.throws(() => resolveExperienceSelections(stop({ experienceSelections: [choice('hotel'), choice('hotel-other')] }), city), /一家酒店/);
  assert.throws(() => resolveExperienceSelections(stop({ experienceSelections: [choice('activity', { dayIndex: 2 })] }), city), /超出停留/);
});

test('breakfast-only menus replace breakfast, enforce meal eligibility and retain unverified price provenance', () => {
  const breakfast = offer('breakfast', 'restaurant', { mealType: 'breakfast', checkedAt: '2026-09-22', priceOptions: [option('standard', { mealTypes: ['breakfast'], type: 'estimate', checkedAt: null })] });
  const city = { ...town, experiences: [breakfast] };
  const s = stop({ days: 1, experienceSelections: [choice('breakfast')] });
  const p = plan(s), budget = calculatePlan(p, [origin, city], rates), [day] = generateItinerary(p, [origin, city], rates);
  assert.equal(budget.lines.find(l => l.id === 'stop-0-food').quantity, .8 * 3);
  assert.equal(budget.lines.find(l => l.experienceId === 'breakfast').checkedAt, null, 'Verified venue identity is not a verified menu price');
  assert.equal(day.items.find(i => i.mealType === 'breakfast').experienceId, 'breakfast');
  assert.ok(day.items.some(i => i.segment?.toId === 'breakfast'), 'The real restaurant address participates in routing');
  assert.throws(() => resolveExperienceSelections({ ...s, experienceSelections: [choice('breakfast', { mealType: 'dinner' })] }, city), /不适用于所选餐次/);
  assertNoOverlap([day]);
});

test('booking-unit group prices ceil by capacity and min/max participant constraints are explicit', () => {
  const boat = offer('boat', 'experience', { priceOptions: [option('standard', { low: 90, high: 90, currency: 'USD', unit: 'booking', partyCapacity: 5 })] });
  const city = { ...town, experiences: [...town.experiences, boat] };
  const p = { ...plan(stop({ experienceSelections: [choice('boat')] })), travelers: 7 };
  const line = calculatePlan(p, [origin, city], rates).lines.find(l => l.experienceId === 'boat');
  assert.equal(line.quantity, 2); assert.equal(line.amount, 90 * 2 / .15);
  const privateBoat = { ...boat, priceOptions: [option('standard', { minParticipants: 2, maxParticipants: 2 })] };
  assert.throws(() => calculatePlan(p, [origin, { ...city, experiences: [privateBoat] }], rates), /最多 2 人/);
  assert.throws(() => resolveExperienceSelections(stop({ experienceSelections: [choice('boat')] }), { ...city, experiences: [{ ...boat, minParticipants: 2 }] }, { travelers: 1 }), /至少需要 2 人/);
});

test('explicit activities spread before ordinary sights and remain pending if days are insufficient', () => {
  const activity = offer('activity', 'experience', { durationMinutes: 360, priceOptions: [option('standard', { includesTransfers: true, includedMeals: ['lunch'] })] });
  const other = { ...activity, id: 'other', name: 'Other' };
  const city = { ...town, experiences: [activity, other] };
  const selections = [choice('activity'), choice('other')];
  const short = suggestStopPlan(stop({ days: 1, experienceSelections: selections }), city);
  assert.equal(short.experienceSelections.length, 2);
  assert.equal(short.smartPlan.unscheduledExperienceCount, 1);
  assert.equal(short.smartPlan.suggestedAdditionalDays, 1);
  // This package-packing scenario begins in the destination; intercity limits
  // are exercised separately with real journey windows.
  const shortPlan = { ...plan(short), originId: city.id, returnTrip: false }, shortBudget = calculatePlan(shortPlan, [origin, city], rates), shortDays = generateItinerary(shortPlan, [origin, city], rates);
  assert.equal(shortBudget.lines.filter(l => l.category === 'experiences').length, 2);
  assert.equal(shortDays[0].items.filter(i => i.kind === 'experience').length, 1);
  assert.ok(shortDays[0].activeMinutes <= 720);
  assert.ok(shortDays[0].warnings.some(w => w.code === 'experience-needs-days'));
  const expanded = suggestStopPlan({ ...short, days: 3 }, city);
  assert.equal(expanded.smartPlan.unscheduledExperienceCount, 0);
  assert.equal(new Set(expanded.experienceSelections.map(s => s.dayIndex)).size, 2);
  assert.ok(expanded.attractionIds.includes('sight'), 'A third free day must be considered for the desired sight');
  const expandedDays = generateItinerary({ ...plan(expanded), originId: city.id, returnTrip: false }, [origin, city], rates);
  assert.equal(expandedDays.flatMap(d => d.items).filter(i => i.kind === 'experience').length, 2);
  assertNoOverlap(expandedDays);
});

test('eight-hour package keeps included meals and transfers inside its duration without duplicate charges', () => {
  const tour = offer('tour', 'experience', { lat: 36, lng: 140, durationMinutes: 480, priceOptions: [option('standard', { includedMeals: ['lunch'], includesTransfers: true })] });
  const city = { ...town, experiences: [tour] };
  const s = suggestStopPlan(stop({ days: 1, experienceSelections: [choice('tour')] }), city);
  assert.equal(s.smartPlan.unscheduledExperienceCount, 0);
  assert.deepEqual(s.attractionIds, []);
  const p = { ...plan(s), originId: city.id, returnTrip: false }, budget = calculatePlan(p, [origin, city], rates), [day] = generateItinerary(p, [origin, city], rates);
  assert.equal(day.items.find(i => i.kind === 'experience').durationMinutes, 480);
  assert.equal(day.items.find(i => i.mealType === 'lunch').durationMinutes, 0);
  assert.equal(day.items.find(i => i.mealType === 'lunch').cost.amount, 0);
  assert.equal(day.travelMinutes, 0, 'Hotel pickup and return are already included');
  assert.equal(day.activeMinutes, 570);
  assert.ok(day.warnings.some(w => w.code === 'busy-day'));
  assert.equal(budget.lines.find(l => l.id === 'stop-0-food').amount, 1000 * .6 * 3 / 20);
  assertNoOverlap([day]);
});

test('package meal and explicitly selected restaurant coexist with a warning and only one base deduction', () => {
  const tour = offer('tour', 'experience', { durationMinutes: 180, priceOptions: [option('standard', { includedMeals: ['lunch'] })] });
  const city = { ...town, experiences: [...town.experiences, tour] };
  const p = plan(stop({ days: 1, attractionIds: [], experienceSelections: [choice('tour'), choice('meal', { mealType: 'lunch' })] }));
  const budget = calculatePlan(p, [origin, city], rates), [day] = generateItinerary(p, [origin, city], rates);
  assert.equal(budget.lines.find(l => l.id === 'stop-0-food').quantity, .6 * 3);
  assert.ok(day.warnings.some(w => w.code === 'duplicate-included-meal'));
  assert.equal(day.items.filter(i => i.mealType === 'lunch').length, 1);
  assert.equal(day.items.find(i => i.mealType === 'lunch').experienceId, 'meal');
  assertNoOverlap([day]);
});

test('early balloon and late performance respect requested unconfirmed times without fake arrivals', () => {
  const balloon = offer('balloon', 'experience', { preferredStartTime: '05:00', durationMinutes: 270, priceOptions: [option('standard', { includedMeals: ['breakfast'], includesTransfers: true })] });
  const show = offer('show', 'experience', { preferredStartTime: '19:30', durationMinutes: 120 });
  for (const experience of [balloon, show]) {
    const city = { ...town, experiences: [experience] };
    const s = suggestStopPlan(stop({ days: 1, experienceSelections: [choice(experience.id)] }), city);
    assert.equal(s.smartPlan.unscheduledExperienceCount, 0, experience.name);
    const [day] = generateItinerary({ ...plan(s), originId: city.id, returnTrip: false }, [origin, city], rates);
    const scheduled = day.items.find(i => i.kind === 'experience');
    assert.equal(scheduled.time, experience.preferredStartTime);
    assert.equal(scheduled.timeUnconfirmed, true);
    if (experience.id === 'show') {
      assert.ok(day.warnings.some(w => w.code === 'late-finish'));
      assert.ok(s.attractionIds.includes('sight'), 'A night show does not block all daytime sightseeing');
    }
    assert.ok(day.items.at(-1).endMinute < 1440);
    assertNoOverlap([day]);
  }
});

test('all meals included retain an explicit food override without losing cents or double-counting meals', () => {
  const city = { ...town, experiences: [offer('package', 'experience', { priceOptions: [option('standard', { includedMeals: ['breakfast', 'lunch', 'dinner'], includesTransfers: true })] })] };
  const p = { ...plan(stop({ days: 1, attractionIds: [], experienceSelections: [choice('package')] })), overrides: { 'stop-0-food': { amount: 12.34, confirmed: true } } };
  const budget = calculatePlan(p, [origin, city], rates), [day] = generateItinerary(p, [origin, city], rates);
  assert.equal(budget.lines.find(l => l.id === 'stop-0-food').quantity, 0);
  assert.equal(sum(day.items.filter(i => i.kind === 'meal').map(i => i.cost.amount)), 1234);
  assert.equal(day.items.filter(i => i.includedInExperience).length, 3);
});

test('real catalog hotels, meals and activity options all produce finite budgets and valid schedules', () => {
  const load = file => JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));
  const experiences = [...load('city-experiences.json'), ...load('city-activities.json')];
  const shipped = load('cities.json').map(city => ({ ...city, experiences: experiences.filter(e => e.cityId === city.id) }));
  const fx = { CNY: 1, JPY: 20, USD: .15, EUR: .13, GBP: .11, KRW: 180, THB: 5, SGD: .18, MYR: .6, IDR: 2200, AED: .52, TRY: 6, AUD: .2, HKD: 1.1 };
  let count = 0;
  for (const city of shipped) for (const experience of city.experiences) for (const option of experience.priceOptions) {
    const travelers = option.minParticipants || experience.minParticipants || 2;
    const s = { cityId: city.id, days: 3, attractionIds: [], experienceSelections: [{ experienceId: experience.id, optionId: option.id, dayIndex: 0 }] };
    const p = { ...plan(s), originId: city.id, travelers, rooms: 1 };
    const budget = calculatePlan(p, shipped, fx);
    assert.ok(Number.isFinite(budget.total), `${city.id}/${experience.id}/${option.id}`);
    const selected = suggestStopPlan(s, city, { departureDate: p.departureDate });
    const itinerary = generateItinerary({ ...p, stops: [selected] }, shipped, fx);
    assertNoOverlap(itinerary);
    if (experience.kind === 'experience') assert.equal(selected.smartPlan.unscheduledExperienceCount, 0, `${city.id}/${experience.id}/${option.id}`);
    count++;
  }
  assert.ok(count >= 180, `Expected expanded experience catalog, got ${count}`);
});

test('Tokyo Sensoji and kimono remain feasible over two days with generic dinner near lodging', () => {
  const load = file => JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8'));
  const city = load('cities.json').find(c => c.id === 'tokyo');
  city.experiences = load('city-activities.json').filter(e => e.cityId === 'tokyo');
  const activity = city.experiences[0], sight = city.attractions.find(a => a.id === 'sensoji');
  const s = suggestStopPlan({ cityId: city.id, days: 2, attractionIds: [sight.id], experienceSelections: [{ experienceId: activity.id, optionId: activity.priceOptions[0].id }] }, city);
  assert.ok(s.attractionIds.includes(sight.id));
  assert.equal(s.smartPlan.unscheduledExperienceCount, 0);
  const days = generateItinerary({ ...plan(s), originId: city.id }, [city], rates);
  assert.ok(days.every(day => day.activeMinutes <= 480 && day.items.at(-1).endMinute <= 1230));
  assertNoOverlap(days);
});
