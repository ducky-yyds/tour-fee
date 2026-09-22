import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculatePlan, generateItinerary, suggestStopPlan } from '../shared/planner.mjs';
import { buildJourneyWindows } from '../shared/journey-windows.mjs';

const city = (id, lat, lng, countryCode = 'US') => ({ id, name: id, nameEn: id, countryCode, currency: 'CNY', lat, lng, daily: { lodging: [100, 200, 400], food: [30, 60, 120], transport: [10, 20, 40], misc: [5, 10, 20] }, monthly: { rent: [1000, 2000, 4000], utilities: [100, 200, 400] }, attractions: [{ id: `${id}-sight`, name: `${id} museum`, lat: lat + 0.001, lng: lng + 0.001, durationHours: 1, priority: 99, price: { low: 10, high: 20, currency: 'CNY', type: 'estimate' } }] });
const home = city('home', 40.7, -74), town = city('town', 35.7, 139.7, 'JP');
const cities = [home, town];
const rates = { rates: { CNY: 1 } };
const makePlan = (patch = {}) => ({ originId: home.id, departureDate: '2026-10-15', stops: [{ cityId: town.id, days: 3, attractionIds: town.attractions.map(a => a.id) }], travelers: 2, rooms: 1, tier: 1, currency: 'CNY', returnTrip: false, reservePercent: 10, ...patch });
const replan = (plan, catalog = cities) => {
  const windows = buildJourneyWindows(plan, catalog);
  return { ...plan, stops: plan.stops.map((stop, index) => suggestStopPlan(stop, catalog.find(c => c.id === stop.cityId), { dayWindows: windows[index], departureDate: plan.departureDate })) };
};
const sum = values => Math.round(values.reduce((n, value) => n + (value || 0), 0) * 100) / 100;

test('long-haul reservations occupy multiple calendar days without fabricating a thirty-hour event', () => {
  const planned = replan(makePlan());
  const days = generateItinerary(planned, cities, rates);
  assert.equal(days[0].dayWindow.travelOnly, true);
  assert.deepEqual(days[0].attractionIds, []);
  assert.equal(days[0].localActiveMinutes, 0);
  assert.ok(days.filter(day => day.items.some(item => item.journeyDirection === 'inbound')).length >= 2);
  assert.ok(days.every(day => day.items.every(item => !item.journey || item.durationMinutes <= 690)));
  assert.ok(days.every(day => day.items.at(-1).endMinute < 1440));
  assert.ok(days.some(day => day.attractionIds.length > 0));
});

test('same-day long-haul arrival and return leave no automatic sightseeing and retain both ticket budgets', () => {
  const planned = replan(makePlan({ returnTrip: true, stops: [{ cityId: town.id, days: 1, attractionIds: [town.attractions[0].id] }] }));
  const budget = calculatePlan(planned, cities, rates);
  const [day] = generateItinerary(planned, cities, rates);
  assert.equal(day.attractionIds.length, 0);
  assert.equal(day.localActiveMinutes, 0);
  assert.equal(day.dayWindow.travelOnly, true);
  assert.equal(day.costs.intercity, sum(budget.lines.filter(line => line.category === 'intercity').map(line => line.amount)));
  assert.equal(day.costs.transfer, sum(budget.lines.filter(line => line.category === 'transfer').map(line => line.amount)));
  assert.ok(day.items.at(-1).endMinute <= 1230);
});

test('a fully blocked first day does not hide an available second day from smart selection', () => {
  const plan = makePlan({ stops: [{ cityId: town.id, days: 2, attractionIds: [town.attractions[0].id], transportWindow: { arrivalReadyTime: '09:00', arrivalDayOffset: 1 } }] });
  const planned = replan(plan);
  assert.deepEqual(planned.stops[0].dayPlans[0], []);
  assert.deepEqual(planned.stops[0].dayPlans[1], [town.attractions[0].id]);
});

test('a partially available arrival day does not hide a full second day for one long candidate', () => {
  const longer = { ...town, attractions: town.attractions.map(sight => ({ ...sight, durationHours: 4 })) };
  const plan = makePlan({ stops: [{ cityId: town.id, days: 2, attractionIds: [town.attractions[0].id], transportWindow: { arrivalReadyTime: '18:00' } }] });
  const planned = replan(plan, [home, longer]);
  assert.deepEqual(planned.stops[0].dayPlans[0], []);
  assert.deepEqual(planned.stops[0].dayPlans[1], [town.attractions[0].id]);
});

test('manual 15:00 ready time limits all local activities and early experiences cannot time-travel before arrival', () => {
  const plan = makePlan({ stops: [{ cityId: town.id, days: 1, attractionIds: [town.attractions[0].id], transportWindow: { arrivalReadyTime: '15:00' } }] });
  const planned = replan(plan);
  const [day] = generateItinerary(planned, cities, rates);
  assert.ok(day.attractionIds.length > 0);
  assert.ok(day.items.filter(item => !item.journey && item.durationMinutes > 0).every(item => item.startMinute >= 900));
  const selectedCity = { ...town, attractions: town.attractions.map(a => ({ ...a, preferredStartTime: '05:00' })) };
  const constrained = replan(plan, [home, selectedCity]);
  assert.deepEqual(constrained.stops[0].attractionIds, []);
  const [manual] = generateItinerary(plan, [home, selectedCity], rates);
  assert.ok(manual.items.find(item => item.kind === 'attraction').startMinute >= 900);
  assert.ok(manual.warnings.some(warning => warning.code === 'attraction-time-conflict'));
});

test('manual selected sights survive a blocked travel day with an explicit window conflict', () => {
  const plan = makePlan({ returnTrip: true, stops: [{ cityId: town.id, days: 1, attractionIds: [town.attractions[0].id], dayPlans: [[town.attractions[0].id]] }] });
  const [day] = generateItinerary(plan, cities, rates);
  assert.deepEqual(day.attractionIds, [town.attractions[0].id]);
  assert.ok(day.warnings.some(warning => warning.code === 'journey-window-conflict'));
});

test('early balloon is deferred after an afternoon arrival, but remains possible after a user-confirmed 05:00 ready time', () => {
  const balloon = { id: 'balloon', cityId: town.id, kind: 'experience', name: 'Sunrise balloon', lat: town.lat, lng: town.lng, preferredStartTime: '05:00', durationMinutes: 270, priceOptions: [{ id: 'standard', name: 'standard', low: 100, high: 200, currency: 'CNY', unit: 'person', type: 'estimate', includesTransfers: true, includedMeals: ['breakfast'] }] };
  const destination = { ...town, experiences: [balloon] };
  const stop = { cityId: town.id, days: 1, attractionIds: [], experienceSelections: [{ experienceId: 'balloon', optionId: 'standard', dayIndex: 0 }], transportWindow: { arrivalReadyTime: '15:00' } };
  const afternoonPlan = replan(makePlan({ stops: [stop] }), [home, destination]);
  assert.equal(afternoonPlan.stops[0].experienceSelections[0].scheduleStatus, 'needs-more-days');
  const [afternoon] = generateItinerary(afternoonPlan, [home, destination], rates);
  assert.equal(afternoon.items.filter(item => item.kind === 'experience').length, 0);
  const morningPlan = replan(makePlan({ stops: [{ ...stop, transportWindow: { arrivalReadyTime: '05:00' } }] }), [home, destination]);
  const [morning] = generateItinerary(morningPlan, [home, destination], rates);
  assert.equal(morning.items.find(item => item.kind === 'experience').time, '05:00');
});

test('empty one-day intercity plan never creates a free walk or meal beyond the usable window', () => {
  const catalog = JSON.parse(readFileSync(new URL('../data/cities.json', import.meta.url), 'utf8'));
  const plan = makePlan({ originId: 'shanghai', returnTrip: true, stops: [{ cityId: 'beijing', days: 1, attractionIds: [] }] });
  const [day] = generateItinerary(replan(plan, catalog), catalog);
  assert.ok(!day.warnings.some(warning => warning.code === 'journey-window-conflict'));
  assert.ok(!day.items.some(item => item.kind === 'free' && item.durationMinutes > 0));
  assert.ok(day.localActiveMinutes <= day.dayWindow.maxLocalActiveMinutes);
});

test('same-city exploration keeps full local capacity without intercity charges', () => {
  const plan = makePlan({ originId: town.id, returnTrip: true, stops: [{ cityId: town.id, days: 1, attractionIds: [town.attractions[0].id] }] });
  const [day] = generateItinerary(replan(plan), cities, rates);
  assert.equal(day.intercityMinutes, 0);
  assert.equal(day.dayWindow.maxLocalActiveMinutes, 480);
  assert.equal(day.attractionIds.length, 1);
  assert.equal(day.costs.intercity, 0);
  assert.equal(day.costs.transfer, 0);
});

test('repeated multi-day journey blocks charge each existing ticket and transfer line once, with exact daily reconciliation', () => {
  const plan = replan(makePlan({ returnTrip: true, stops: [{ cityId: town.id, days: 6, attractionIds: [town.attractions[0].id] }] }));
  const budget = calculatePlan(plan, cities, rates);
  const days = generateItinerary(plan, cities, rates);
  for (const line of budget.lines.filter(line => ['intercity', 'transfer', 'food', 'transport', 'attractions'].includes(line.category))) {
    assert.equal(sum(days.flatMap(day => day.items).filter(item => item.cost.budgetLineId === line.id).map(item => item.cost.amount)), line.amount, line.id);
  }
  for (const day of days) assert.equal(sum(day.items.map(item => item.cost.amount)), day.costs.total);
  assert.equal(sum(days.map(day => day.costs.total)), sum(budget.lines.filter(line => ['intercity', 'transfer', 'food', 'transport', 'attractions'].includes(line.category)).map(line => line.amount)));
});

test('new cross-city stop reserves its own inbound day without charging the preceding day twice', () => {
  const nearby = city('nearby', 36.7, 139.7, 'JP');
  const plan = makePlan({ originId: town.id, stops: [{ cityId: town.id, days: 1, attractionIds: [] }, { cityId: nearby.id, days: 2, attractionIds: [nearby.attractions[0].id] }] });
  const days = generateItinerary(replan(plan, [...cities, nearby]), [...cities, nearby], rates);
  assert.equal(days[0].intercityMinutes, 0);
  assert.ok(days[1].intercityMinutes > 0);
  assert.equal(days.flatMap(day => day.items).filter(item => item.cost.budgetLineId === 'leg-1' && item.cost.amount > 0).length, 1);
});

test('actual Beijing planning differs for local and intercontinental one-day origins', () => {
  const catalog = JSON.parse(readFileSync(new URL('../data/cities.json', import.meta.url), 'utf8'));
  const beijing = catalog.find(city => city.id === 'beijing');
  const base = makePlan({ originId: 'beijing', returnTrip: true, stops: [{ cityId: 'beijing', days: 1, attractionIds: beijing.attractions.map(a => a.id) }] });
  const local = replan(base, catalog);
  const distant = replan({ ...base, originId: 'new-york' }, catalog);
  assert.ok(local.stops[0].attractionIds.length > 0);
  assert.equal(distant.stops[0].attractionIds.length, 0);
  assert.ok(distant.stops[0].deferredAttractionIds.length > 0);
});
