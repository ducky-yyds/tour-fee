import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCountryDraft, listCountryDestinations } from '../shared/country-planning.mjs';
import { generateDetailedItinerary } from '../shared/itinerary.mjs';
import { buildJourneyWindows } from '../shared/journey-windows.mjs';

const cities = JSON.parse(readFileSync(new URL('../data/cities.json', import.meta.url), 'utf8'));
const defaults = { cities, countryCode: 'JP', totalDays: 7, originId: 'shanghai', departureDate: '2026-10-10', returnToOrigin: true };
const total = draft => draft.stops.reduce((sum, stop) => sum + stop.days, 0);

test('country catalogue admits only detailed cities and labels existing country codes distinctly', () => {
  const airport = { id: 'airport-only', countryCode: 'XX', country: 'Airport', coverage: 'airport-only', lat: 10, lng: 10, attractions: [{ id: 'invented' }] };
  const noSights = { ...airport, id: 'empty', coverage: 'detailed', countryCode: 'YY', attractions: [] };
  const groups = listCountryDestinations([...cities, airport, noSights]);
  assert.ok(!groups.some(country => ['XX', 'YY'].includes(country.countryCode)));
  assert.equal(groups.find(country => country.countryCode === 'JP').cityCount, 3);
  assert.equal(groups.find(country => country.countryCode === 'HK').name, '中国香港');
  assert.ok(groups.every(group => group.cities.every(city => city.attractions.length > 0)));
});

test('a one-day local country plan selects highlights instead of retaining all Beijing attractions', () => {
  const draft = buildCountryDraft({ ...defaults, countryCode: 'CN', totalDays: 1, originId: 'beijing', returnToOrigin: false });
  const beijing = cities.find(city => city.id === 'beijing');
  assert.equal(total(draft), 1);
  assert.equal(draft.stops.length, 1);
  assert.equal(draft.stops[0].cityId, 'beijing');
  assert.equal(draft.feasible, true);
  assert.ok(draft.stops[0].attractionIds.length > 0);
  assert.ok(draft.stops[0].attractionIds.length < beijing.attractions.length);
  assert.equal(draft.stops[0].attractionIds.length + draft.stops[0].deferredAttractionIds.length, beijing.attractions.length);
});

test('a short international trip stays in one city while longer trips gain useful local time in each city', () => {
  const short = buildCountryDraft({ ...defaults, totalDays: 3 });
  const long = buildCountryDraft({ ...defaults, totalDays: 10 });
  assert.equal(short.stops.length, 1);
  assert.equal(total(short), 3);
  assert.equal(long.stops.length, 3);
  assert.equal(total(long), 10);
  assert.equal(long.feasible, true);
  assert.ok(long.summary.stops.every(stop => stop.localMinutes >= 600 && stop.selectedCount > 0));
  assert.ok(long.stops.find(stop => stop.cityId === 'tokyo').days >= long.stops.find(stop => stop.cityId === 'kyoto').days);
  assert.ok(long.transportLegs.some(leg => leg.direction === 'intercity'));
  assert.equal(long.transportLegs.at(-1).direction, 'return');
});

test('impossible intercontinental day trips stay within the requested day and report the traffic deficit', () => {
  const draft = buildCountryDraft({ ...defaults, originId: 'new-york', totalDays: 1 });
  assert.equal(total(draft), 1);
  assert.equal(draft.feasible, false);
  assert.ok(draft.warnings.some(warning => warning.code === 'country-transport-conflict'));
  assert.ok(draft.summary.transportMinutes > 24 * 60);
  assert.equal(draft.summary.selectedAttractionCount, 0);
  assert.equal(draft.summary.travelOnlyDays, 1);
});

test('every generated attraction obeys the same transport windows used by the actual itinerary', () => {
  const draft = buildCountryDraft({ ...defaults, countryCode: 'IS', totalDays: 10, originId: 'beijing' });
  const plan = { ...defaults, departureDate: draft.planDepartureDate, originId: draft.originId, stops: draft.planStops, mode: 'travel', returnTrip: draft.returnTrip, currency: 'CNY', travelers: 1, rooms: 1 };
  const windows = buildJourneyWindows(plan, cities).flat();
  const itinerary = generateDetailedItinerary(plan, cities, null);
  assert.equal(itinerary.length, 10);
  assert.equal(draft.feasible, true);
  itinerary.forEach((day, index) => {
    assert.ok(!day.warnings.some(warning => warning.severity === 'danger'), JSON.stringify(day.warnings));
    if (windows[index].travelOnly) assert.equal(day.attractionIds.length, 0);
    const localItems = day.items.filter(item => !item.journey && item.attractionId);
    assert.ok(localItems.every(item => item.startMinute >= windows[index].startMinute && item.endMinute <= windows[index].endMinute));
  });
});

test('append starts at the previous country and date, preserves all saved stops and returns to the original origin', () => {
  const saved = { cityId: 'tokyo', days: 3, planningMode: 'manual', attractionIds: ['sensoji'], dayPlans: [['sensoji'], [], []], visitDurations: { sensoji: 90 } };
  const context = { originId: 'beijing', departureDate: '2026-10-02', returnTrip: true, stops: [saved] };
  const before = structuredClone(context);
  const draft = buildCountryDraft({ ...defaults, countryCode: 'TH', totalDays: 7, planContext: context });
  assert.deepEqual(context, before);
  assert.deepEqual(draft.planStops[0], saved);
  assert.equal(draft.departureDate, '2026-10-05');
  assert.equal(draft.planDepartureDate, '2026-10-02');
  assert.equal(draft.transportLegs[0].fromId, 'tokyo');
  assert.equal(draft.transportLegs.at(-1).toId, 'beijing');
  assert.equal(total(draft), 7);
  assert.equal(draft.summary.overallDays, 10);
  assert.equal(draft.planStops.length, draft.stops.length + 1);
});

test('append excludes already selected cities and respects the eight-stop project capacity', () => {
  const existingIds = ['beijing', 'paris', 'london', 'rome', 'seoul', 'bangkok', 'tokyo'];
  const context = { originId: 'shanghai', departureDate: '2026-10-01', returnTrip: false, stops: existingIds.map(cityId => ({ cityId, days: 3, planningMode: 'manual', attractionIds: [], dayPlans: [[], [], []] })) };
  const draft = buildCountryDraft({ ...defaults, totalDays: 7, planContext: context });
  assert.equal(draft.stops.length, 1);
  assert.notEqual(draft.stops[0].cityId, 'tokyo');
  assert.equal(draft.planStops.length, 8);
  assert.ok(!draft.transportLegs.some(leg => leg.direction === 'return'));
  assert.throws(() => buildCountryDraft({ ...defaults, planContext: { ...context, stops: [...context.stops, { cityId: 'kyoto', days: 2 }] } }), /8 站/);
});

test('manual ordering and day allocation remain exact, and malformed or foreign choices cannot enter', () => {
  const draft = buildCountryDraft({ ...defaults, cityIds: ['osaka', 'tokyo'], dayAllocations: [3, 4] });
  assert.deepEqual(draft.stops.map(stop => stop.cityId), ['osaka', 'tokyo']);
  assert.deepEqual(draft.stops.map(stop => stop.days), [3, 4]);
  assert.throws(() => buildCountryDraft({ ...defaults, cityIds: ['tokyo', 'tokyo'] }), /重复/);
  assert.throws(() => buildCountryDraft({ ...defaults, cityIds: ['tokyo', 'paris'] }), /所选国家/);
  assert.throws(() => buildCountryDraft({ ...defaults, cityIds: ['tokyo'], dayAllocations: [8] }), /之和/);
  assert.throws(() => buildCountryDraft({ ...defaults, totalDays: 0 }), /1–365/);
  assert.throws(() => buildCountryDraft({ ...defaults, departureDate: '2026-02-30' }), /日期/);
});

test('sparse country coverage remains explicit and missing origin cannot silently omit required transport', () => {
  const draft = buildCountryDraft({ ...defaults, countryCode: 'FR', totalDays: 20 });
  assert.equal(draft.stops.length, 1);
  assert.equal(total(draft), 20);
  assert.equal(draft.coverage.allCitiesCovered, false);
  assert.equal(draft.coverage.availableCityCount, 1);
  assert.ok(draft.warnings.some(warning => warning.code === 'country-coverage'));
  const missingOrigin = buildCountryDraft({ ...defaults, originId: null });
  assert.equal(missingOrigin.feasible, false);
  assert.ok(missingOrigin.warnings.some(warning => warning.code === 'missing-origin'));
});
