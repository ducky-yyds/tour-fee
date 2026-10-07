import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlan } from '../shared/planner.mjs';

function fixture(visitDays, validity) {
  const attractions = visitDays.map((day, index) => ({ id: `museum-${index}`, name: `Museum ${index}`, lat: 37.2, lng: 112.1, durationHours: 1,
    price: { low: 125, high: 125, currency: 'CNY', type: 'estimate', passGroup: 'old-town', ...(validity ? { passValidityDays: validity } : {}) } }));
  const city = { id: 'town', name: 'Town', countryCode: 'CN', currency: 'CNY', lat: 37.2, lng: 112.1, attractions,
    daily: { lodging: [100,200,300], food: [50,100,150], transport: [10,20,30], misc: [10,20,30] }, monthly: { rent: [1000,2000,3000], utilities: [100,200,300] } };
  const days = Math.max(...visitDays) + 1;
  const plan = { originId: 'town', departureDate: '2026-11-01', travelers: 2, rooms: 1, currency: 'CNY', tier: 1, returnTrip: false,
    stops: [{ cityId: 'town', days, attractionIds: attractions.map(a=>a.id), dayPlans: Array.from({length:days}, (_,day)=>attractions.filter((a,i)=>visitDays[i]===day).map(a=>a.id)) }] };
  return { plan, city };
}
const admission = (plan, cities) => calculatePlan(plan, cities, { CNY:1 }).lines.filter(l=>l.category==='attractions');
function budget(visitDays, validity) {
  const { plan, city } = fixture(visitDays, validity);
  return admission(plan, [city]);
}

test('three-day admission covers museums on different days without changing selected visits', () => {
  const lines = budget([2,0,1], 3);
  assert.equal(lines.length, 3);
  assert.equal(lines.reduce((sum,line)=>sum+line.amount,0), 250);
  assert.equal(lines.filter(line=>line.sourceType==='included').length, 2);
  assert.equal(lines.find(line=>line.amount>0).attractionId, 'museum-1');
});

test('a new pass starts on the next actual visit after expiry, including gaps', () => {
  const lines = budget([0,5,6], 3);
  assert.equal(lines.reduce((sum,line)=>sum+line.amount,0), 500);
});

test('unspecified validity retains daily admission charging', () => {
  const lines = budget([0,0,1]);
  assert.equal(lines.reduce((sum,line)=>sum+line.amount,0), 500);
});

test('the same city shares an unexpired pass across separate stops', () => {
  const { plan, city } = fixture([0,1,2], 3);
  plan.stops = [
    { cityId:city.id, days:1, attractionIds:['museum-0'] },
    { cityId:city.id, days:2, attractionIds:['museum-1'] },
    { cityId:city.id, days:1, attractionIds:['museum-2'] },
  ];
  const lines = admission(plan, [city]);
  assert.deepEqual(lines.map(l=>l.amount), [250,0,250]);
});

test('matching pass names in distinct cities cannot share admission', () => {
  const { plan, city } = fixture([0], 3);
  const other = { ...city, id:'other-town', name:'Other town' };
  plan.stops.push({ cityId:other.id, days:1, attractionIds:['museum-0'] });
  assert.deepEqual(admission(plan,[city,other]).map(l=>l.amount), [250,250]);
});
