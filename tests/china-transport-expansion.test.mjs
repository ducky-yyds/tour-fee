import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { railPlanningModel } from '../shared/rail-network.mjs';
import { buildJourneyWindows, estimateJourneyLeg, lodgingDayIndexes } from '../shared/journey-windows.mjs';
import { suggestStopPlan, generateDetailedItinerary } from '../shared/itinerary.mjs';
import { calculatePlan } from '../shared/planner.mjs';

const cities = JSON.parse(readFileSync(new URL('../data/cities.json', import.meta.url), 'utf8'));
const city = id => cities.find(c => c.id === id);
const model = (from, to, mode = 'rail') => railPlanningModel(city(from), city(to), 400, mode);

test('new Chinese destinations distinguish high-speed, regional, and overnight rail', () => {
  assert.ok(model('chengdu', 'leshan', 'high-speed-rail'));
  assert.equal(model('kunming', 'jinghong', 'high-speed-rail'), null);
  assert.ok(model('kunming', 'jinghong').rideMinutes >= 180);
  assert.equal(model('lhasa', 'nyingchi', 'high-speed-rail'), null);
  assert.ok(model('lhasa', 'nyingchi').rideMinutes >= 225);
  assert.ok(model('xining', 'lhasa').estimatedMinutes >= 1320);
  assert.equal(model('kunming', 'tengchong', 'high-speed-rail'), null);
  assert.equal(model('guangzhou', 'macau', 'high-speed-rail'), null);
  assert.equal(model('urumqi', 'kashgar', 'high-speed-rail'), null);
});

test('arrival pacing limits the first usable local day without removing manual selections', () => {
  const destination = { ...city('lhasa'), arrivalDayMaxActiveMinutes: 240, arrivalPaceNote: '抵达后的首个活动日先休息与短途活动。' };
  const origin = city('xining');
  const stop = { cityId: destination.id, days: 5, transportWindow: { arrivalDayOffset: 1, arrivalReadyTime: '09:00' } };
  const plan = { originId: origin.id, stops: [stop], departureDate: '2026-11-01', returnTrip: false, currency: 'CNY', travelers: 1, rooms: 1 };
  const windows = buildJourneyWindows(plan, [origin, destination])[0];
  assert.equal(windows[0].travelOnly, true);
  assert.equal(windows[0].lodgingInTransit, true);
  assert.equal(windows[1].paceLimited, true);
  assert.equal(windows[1].maxLocalActiveMinutes, 240);
  assert.notEqual(windows[2].paceLimited, true);
  const suggestion = suggestStopPlan(stop, destination, { dayWindows: windows, departureDate: plan.departureDate });
  const scheduled = suggestion.stop || suggestion;
  const detail = generateDetailedItinerary({ ...plan, stops: [{ ...stop, ...scheduled }] }, [origin, destination], null, [windows]);
  assert.ok(detail[1].localActiveMinutes <= 240);
  const manualIds = destination.attractions.slice(0, 5).map(a => a.id);
  const manual = generateDetailedItinerary({ ...plan, stops: [{ ...stop, attractionIds: manualIds, dayPlans: [[],manualIds,[],[],[]] }] }, [origin, destination], null, [windows]);
  assert.deepEqual(manual[1].attractionIds, manualIds);
  assert.ok(manual[1].warnings.some(w => w.code === 'journey-window-conflict'));
});

const overnightPlan = (days, patch = {}) => ({
  originId: 'xining', departureDate: '2026-11-01', returnTrip: false,
  transportModes: { 'leg-0': { fromId: 'xining', toId: 'lhasa', mode: 'rail' } },
  stops: [{ cityId: 'lhasa', days, attractionIds: [] }], ...patch,
});

test('a 24-hour railway reserve arrives next morning and preserves every elapsed minute', () => {
  const plan = overnightPlan(3);
  const leg = estimateJourneyLeg(city('xining'), city('lhasa'), 'leg-0', 'rail');
  assert.equal(leg.estimatedMinutes, 1440);
  const windows = buildJourneyWindows(plan, cities)[0];
  assert.deepEqual(windows.slice(0, 2).map(w => [w.inbound.startMinute, w.inbound.endMinute]), [[540, 1440], [0, 540]]);
  assert.equal(windows.reduce((sum, w) => sum + (w.inbound?.allocatedMinutes || 0), 0), leg.estimatedMinutes);
  assert.equal(windows[0].travelOnly, true);
  assert.equal(windows[1].startMinute, 540);
  assert.equal(windows[1].travelOnly, false);
  assert.equal(windows[1].paceLimited, true);
  assert.equal(windows[1].maxLocalActiveMinutes, 240);
  assert.equal(windows[1].overnightTravelMinutes, 540);
  assert.notEqual(windows[1].lodgingInTransit, true);
  assert.equal(windows[2].inbound, null);
  assert.deepEqual(lodgingDayIndexes(plan.stops[0], 0, 1, windows), [1]);
  assert.deepEqual(lodgingDayIndexes(plan.stops[0], 0, 1, windows, { stay: true }), [0,1,2]);
  assert.match(windows[0].note, /跨夜/);
});

test('overnight return railway slices run continuously backwards from the final day', () => {
  const plan = overnightPlan(4, { returnTrip: true, transportModes: {
    'leg-0': { fromId: 'xining', toId: 'lhasa', mode: 'rail' },
    'leg-return': { fromId: 'lhasa', toId: 'xining', mode: 'rail' },
  } });
  const windows = buildJourneyWindows(plan, cities)[0];
  assert.deepEqual(windows.slice(2).map(w => [w.outbound.startMinute, w.outbound.endMinute]), [[1230, 1440], [0, 1230]]);
  assert.equal(windows.reduce((sum, w) => sum + (w.outbound?.allocatedMinutes || 0), 0), 1440);
  assert.equal(windows[2].travelOnly, false);
  assert.equal(windows[2].endMinute, 1230);
  assert.equal(windows[2].lodgingInTransit, true);
  assert.equal(windows[3].travelOnly, true);
  assert.deepEqual(lodgingDayIndexes(plan.stops[0], 0, 1, windows), [1]);
});

test('insufficient days retain the unallocated cross-night railway warning', () => {
  const [window] = buildJourneyWindows(overnightPlan(1), cities)[0];
  assert.equal(window.inbound.allocatedMinutes, 900);
  assert.equal(window.travelOnly, true);
  assert.match(window.note, /9 小时 未能分配/);
});

test('a user-confirmed next-day railway arrival keeps the existing manual window', () => {
  const plan = overnightPlan(3, { stops: [{ cityId: 'lhasa', days: 3, transportWindow: { arrivalDayOffset: 1, arrivalReadyTime: '15:00' } }] });
  const windows = buildJourneyWindows(plan, cities)[0];
  assert.equal(windows[0].inbound.basis, 'user-local-window');
  assert.equal(windows[0].inbound.allocatedMinutes, 690);
  assert.equal(windows[1].startMinute, 900);
  assert.equal(windows[1].inbound.basis, 'user-local-window');
  assert.equal(windows[1].continuousTravelMinutes, undefined);
  assert.equal(windows[0].lodgingInTransit, true);
});

test('a sightseeing-free day or late same-day arrival still retains its hotel night', () => {
  const stop = { cityId: 'lhasa', days: 2 };
  assert.deepEqual(lodgingDayIndexes(stop, 0, 1, [{ travelOnly: true }, {}]), [0]);
  assert.deepEqual(lodgingDayIndexes(stop, 0, 2, [{ travelOnly: true }, {}]), [0,1]);
  const plan = overnightPlan(2, { stops: [{ ...stop, transportWindow: { arrivalReadyTime: '23:00' } }] });
  assert.deepEqual(lodgingDayIndexes(stop, 0, 1, buildJourneyWindows(plan, cities)[0]), [0]);
});

test('budget and timeline share actual destination nights after overnight rail', () => {
  const plan = overnightPlan(3);
  const budget = calculatePlan(plan, cities, {CNY:1});
  const lodging = budget.lines.find(line=>line.id==='stop-0-lodging');
  assert.equal(lodging.quantity, 1);
  assert.equal(lodging.amount, city('lhasa').daily.lodging[1]);
  assert.equal(budget.nights, 2);
  assert.equal(budget.lodgingNights, 1);
  const booking = new URL(lodging.sourceUrl);
  assert.equal(booking.searchParams.get('checkin'), '2026-11-02');
  assert.equal(booking.searchParams.get('checkout'), '2026-11-03');
  const days = generateDetailedItinerary(plan, cities, budget);
  assert.equal(days[0].intercityMinutes, 900);
  assert.equal(days[1].intercityMinutes, 540);
  assert.ok(!days[0].items.some(item=>item.kind==='hotel'));
  assert.ok(days[1].items.some(item=>item.routineType==='check-in'));
  assert.ok(days[0].warnings.some(w=>w.code==='overnight-journey'));
  assert.ok(!days[0].warnings.some(w=>w.code==='after-midnight'));
  const override = calculatePlan({...plan,overrides:{'stop-0-lodging':{amount:750,confirmed:true}}},cities,{CNY:1});
  assert.equal(override.lines.find(line=>line.id==='stop-0-lodging').amount,750);
});

test('overnight return starts booking on its first rail day and excludes that hotel night', () => {
  const plan = overnightPlan(4,{returnTrip:true,transportModes:{
    'leg-0':{fromId:'xining',toId:'lhasa',mode:'rail'},
    'leg-return':{fromId:'lhasa',toId:'xining',mode:'rail'},
  }});
  const budget = calculatePlan(plan,cities,{CNY:1});
  assert.equal(budget.lines.find(l=>l.id==='stop-0-lodging').quantity,1);
  assert.equal(budget.legs.find(l=>l.id==='leg-return').date,'2026-11-03');
});
