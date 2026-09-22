import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculatePlan, generateItinerary, suggestStopPlan } from '../shared/planner.mjs';
import { buildJourneyWindows } from '../shared/journey-windows.mjs';

const cities = JSON.parse(readFileSync(new URL('../data/cities.json', import.meta.url), 'utf8'));
const paris = cities.find(city => city.id === 'paris');
const rates = { rates: { CNY: 1, EUR: 0.125, USD: 0.14 } };
const plan = (stopPatch = {}, patch = {}) => ({ originId: 'shanghai', departureDate: '2026-10-10', currency: 'CNY', tier: 1, travelers: 2, rooms: 1, reservePercent: 10, returnTrip: false, mode: 'travel', stops: [{ cityId: 'paris', days: 3, attractionIds: [], dayPlans: [[], [], []], transportWindow: { arrivalReadyTime: '15:00' }, ...stopPatch }], ...patch });
const sum = values => Math.round(values.reduce((total, value) => total + (value || 0), 0) * 100) / 100;
const timed = day => day.items.filter(item => item.timing !== 'unscheduled');

test('afternoon arrival puts untimed breakfast and lunch inside the travel section before the arrival marker', () => {
  const [day] = generateItinerary(plan(), cities, rates);
  const journeyIndex = day.items.findIndex(item => item.id.endsWith('-inbound-journey'));
  const readyIndex = day.items.findIndex(item => item.routineType === 'arrival-ready');
  for (const meal of ['breakfast', 'lunch']) {
    const index = day.items.findIndex(item => item.mealType === meal), item = day.items[index];
    assert.ok(index > journeyIndex && index < readyIndex);
    assert.equal(item.timing, 'unscheduled');
    assert.equal(item.time, null);
    assert.equal(item.endTime, null);
    assert.equal(item.durationMinutes, 0);
    assert.equal(item.placement, 'during-journey');
    assert.equal(item.relatedJourneyId, day.items[journeyIndex].id);
    assert.ok(Number.isFinite(item.startMinute));
  }
  assert.equal(day.items[readyIndex].time, '15:00');
  const dinner = day.items.find(item => item.mealType === 'dinner');
  assert.equal(dinner.duringJourney, false, 'an untimed dinner after arrival must not claim to be eaten during the earlier journey');
});

test('empty afternoon arrival gains a bounded check-in and an actual nearby free neighbourhood walk', () => {
  const input = plan(), before = structuredClone(input);
  const [day] = generateItinerary(input, cities, rates);
  const checkIn = day.items.find(item => item.routineType === 'check-in');
  const walk = day.items.find(item => item.routineType === 'citywalk');
  assert.equal(checkIn.durationMinutes, 30);
  assert.equal(checkIn.time, '15:00');
  assert.ok(walk && walk.suggestedPlaces.length > 0);
  assert.ok(walk.startMinute >= checkIn.endMinute);
  assert.equal(walk.durationMinutes, walk.walkingMinutes + walk.strollMinutes);
  assert.equal(walk.cost.amount, 0);
  assert.equal(checkIn.cost.amount, 0);
  assert.equal(day.localTravelMinutes, walk.walkingMinutes);
  for (const place of walk.suggestedPlaces) {
    const original = paris.attractions.find(attraction => attraction.id === place.id);
    assert.ok(original);
    assert.equal(original.name, place.name);
    assert.equal(original.price.high, 0);
    assert.ok(place.mapsUrl.startsWith('https://www.google.com/maps/dir/'));
  }
  assert.ok(day.localActiveMinutes <= day.dayWindow.maxLocalActiveMinutes);
  assert.ok(walk.endMinute <= day.dayWindow.endMinute);
  assert.ok(!day.warnings.some(warning => warning.code === 'journey-window-conflict'));
  assert.deepEqual(input, before);
});

test('arrival routines and moved budget reminders retain exact daily and whole-trip reconciliation', () => {
  const input = plan({}, { overrides: { 'stop-0-food': { amount: 301.01 }, 'stop-0-transport': { amount: 19.03 } } });
  const budget = calculatePlan(input, cities, rates), days = generateItinerary(input, cities, rates);
  for (const line of budget.lines.filter(line => ['intercity', 'transfer', 'food', 'transport', 'attractions'].includes(line.category))) {
    assert.equal(sum(days.flatMap(day => day.items).filter(item => item.cost.budgetLineId === line.id).map(item => item.cost.amount)), line.amount, line.id);
  }
  for (const day of days) {
    assert.equal(sum(day.items.map(item => item.cost.amount)), day.costs.total);
    timed(day).forEach((item, index, rows) => { if (index) assert.ok(item.startMinute >= rows[index - 1].endMinute); });
  }
});

test('overnight travel adds no phantom arrival or check-in before the real arrival date', () => {
  const days = generateItinerary(plan({ transportWindow: { arrivalDayOffset: 1, arrivalReadyTime: '15:00' } }), cities, rates);
  assert.ok(days[0].dayWindow.travelOnly);
  assert.ok(!days[0].items.some(item => ['arrival-ready', 'check-in', 'citywalk'].includes(item.routineType)));
  assert.ok(!days[0].items.find(item => item.journeyPhase === 'in-transit').title.includes('抵达'));
  assert.ok(days[1].items.some(item => item.routineType === 'arrival-ready'));
  assert.ok(days[1].items.some(item => item.routineType === 'citywalk'));
  const beyond = generateItinerary(plan({ days: 1, dayPlans: [[]], transportWindow: { arrivalDayOffset: 2, arrivalReadyTime: '15:00' } }), cities, rates)[0];
  assert.ok(!beyond.items.some(item => ['arrival-ready', 'check-in', 'citywalk'].includes(item.routineType)));
});

test('late arrival, exhausted return window and unknown nearby places never receive invented exploration', () => {
  for (const arrivalReadyTime of ['17:00', '22:30']) {
    const [day] = generateItinerary(plan({ transportWindow: { arrivalReadyTime } }), cities, rates);
    assert.ok(!day.items.some(item => ['check-in', 'citywalk'].includes(item.routineType)));
    assert.equal(day.localActiveMinutes, 0);
    if (arrivalReadyTime === '22:30') assert.match(day.items.find(item => item.routineType === 'arrival-ready').description, /安顿休息/);
  }
  const [blocked] = generateItinerary(plan({ days: 1, dayPlans: [[]], transportWindow: { arrivalReadyTime: '15:00', departureLeaveTime: '16:00' } }, { returnTrip: true }), cities, rates);
  assert.ok(!blocked.items.some(item => ['check-in', 'citywalk'].includes(item.routineType)));
  const remote = { ...paris, attractions: paris.attractions.map(place => ({ ...place, lat: place.lat + 20 })) };
  const [noPlace] = generateItinerary(plan(), cities.map(city => city.id === paris.id ? remote : city), rates);
  assert.ok(noPlace.items.some(item => item.routineType === 'check-in'));
  assert.ok(!noPlace.items.some(item => item.routineType === 'citywalk'));
});

test('a day trip with no lodging nights offers rest without a hotel claim or a zero-night lodging link', () => {
  const input = plan({ days: 1, dayPlans: [[]] });
  const [day] = generateItinerary(input, cities, rates);
  assert.equal(calculatePlan(input, cities, rates).lines.find(line => line.id === 'stop-0-lodging').quantity, 0);
  assert.ok(!day.items.some(item => item.kind === 'hotel'));
  const rest = day.items.find(item => item.routineType === 'arrival-rest');
  assert.equal(rest.durationMinutes, 30);
  assert.ok(!rest.cost.budgetLineId);
  assert.match(rest.description, /没有把行李寄存视作免费/);
  const [localDay] = generateItinerary(plan({}, { originId: 'paris' }), cities, rates);
  assert.ok(!localDay.items.some(item => ['arrival-ready', 'check-in', 'citywalk'].includes(item.routineType)));
});

test('selected hotel is shown once on the real arrival day, never as check-in while still travelling', () => {
  const hotel = { id: 'fixture-hotel', cityId: paris.id, kind: 'hotel', name: 'Fixture Hotel', lat: paris.lat, lng: paris.lng, durationMinutes: 0, priceOptions: [{ id: 'room', name: 'Room', low: 100, high: 150, currency: 'EUR', unit: 'room-night', type: 'estimate' }] };
  const catalog = cities.map(city => city.id === paris.id ? { ...city, experiences: [hotel] } : city);
  const input = plan({ transportWindow: { arrivalDayOffset: 1, arrivalReadyTime: '15:00' }, experienceSelections: [{ experienceId: hotel.id, optionId: 'room', dayIndex: 0 }] });
  const days = generateItinerary(input, catalog, rates);
  assert.ok(!days[0].items.some(item => item.kind === 'hotel'));
  const hotelItems = days[1].items.filter(item => item.kind === 'hotel');
  assert.equal(hotelItems.length, 1);
  assert.equal(hotelItems[0].routineType, 'check-in');
  assert.equal(hotelItems[0].experienceId, hotel.id);
  assert.equal(hotelItems[0].cost.amount, 0);
});

test('selected sights and explicit restaurant times take priority over optional arrival routines', () => {
  const sight = paris.attractions.find(place => place.id === 'le-marais');
  const [manual] = generateItinerary(plan({ attractionIds: [sight.id], dayPlans: [[sight.id], [], []], visitDurations: { [sight.id]: 45 } }), cities, rates);
  assert.ok(manual.items.some(item => item.attractionId === sight.id));
  assert.ok(!manual.items.some(item => ['check-in', 'citywalk'].includes(item.routineType)));
  const restaurant = { id: 'fixture-dinner', cityId: paris.id, kind: 'restaurant', name: 'Fixture Dinner', lat: paris.lat, lng: paris.lng, preferredStartTime: '18:30', durationMinutes: 60, priceOptions: [{ id: 'menu', name: 'Menu', low: 30, high: 40, currency: 'EUR', unit: 'person', type: 'estimate', mealTypes: ['dinner'] }] };
  const catalog = cities.map(city => city.id === paris.id ? { ...city, experiences: [restaurant] } : city);
  const [dinnerDay] = generateItinerary(plan({ experienceSelections: [{ experienceId: restaurant.id, optionId: 'menu', dayIndex: 0, mealType: 'dinner' }] }), catalog, rates);
  const dinner = dinnerDay.items.find(item => item.experienceId === restaurant.id);
  assert.equal(dinner.time, '18:30');
  assert.equal(dinner.timing, 'scheduled');
  assert.equal(dinner.durationMinutes, 60);
  assert.ok(!dinnerDay.items.some(item => item.routineType === 'citywalk'));
});

test('smart selection uses the same remaining capacity and future selected neighbourhoods are not repeated as a walk', () => {
  const input = plan({ attractionIds: paris.attractions.map(place => place.id) });
  const windows = buildJourneyWindows(input, cities);
  const selected = suggestStopPlan(input.stops[0], paris, { departureDate: input.departureDate, dayWindows: windows[0] });
  const days = generateItinerary({ ...input, stops: [selected] }, cities, rates);
  assert.ok(days.every(day => !day.warnings.some(warning => warning.code === 'journey-window-conflict')));
  const [reserved] = generateItinerary(plan({ attractionIds: ['le-marais'], dayPlans: [[], ['le-marais'], []] }), cities, rates);
  assert.ok(!reserved.items.some(item => item.suggestedPlaces?.some(place => place.id === 'le-marais')));
});
