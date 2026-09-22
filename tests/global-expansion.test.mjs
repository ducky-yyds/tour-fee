import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculatePlan, generateItinerary, bookingLinks } from '../shared/planner.mjs';
import { suggestStopPlan } from '../shared/itinerary.mjs';
import { CURRENCIES, REGIONS } from '../shared/currencies.mjs';

const read = name => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
const cities = read('cities'), rates = read('fx-reference');
const plan = (id, days = 3, patch = {}) => ({ originId:id, stops:[{cityId:id,days,attractionIds:[]}], departureDate:'2026-10-20', travelers:2, rooms:1, currency:'CNY', tier:1, mode:'travel', returnTrip:false, reservePercent:0, overrides:{}, ...patch });
const getCity = id => cities.find(c => c.id === id);

test('global catalog, guides and dated exchange rates cover every shipped destination', () => {
  assert.ok(cities.length >= 100);
  assert.ok(new Set(cities.map(c => c.countryCode)).size >= 59);
  assert.equal(new Set(cities.map(c => c.id)).size, cities.length);
  const allIds = cities.flatMap(c => c.attractions.map(a => a.id));
  assert.equal(new Set(allIds).size, allIds.length);
  const guides = read('city-guides');
  for (const city of cities) {
    assert.ok(guides.some(g => g.cityId === city.id), city.id);
    assert.ok(REGIONS.includes(city.region), city.id);
    assert.ok(CURRENCIES[city.currency] && rates.rates[city.currency] > 0, city.currency);
    assert.ok(city.attractions.length >= 5, city.id);
    for (const place of city.attractions) {
      assert.ok(Number.isFinite(place.lat) && Math.abs(place.lat) <= 90, place.id);
      assert.ok(Number.isFinite(place.lng) && Math.abs(place.lng) <= 180, place.id);
      assert.ok(place.price.high >= place.price.low && place.price.low >= 0, place.id);
    }
  }
  for (const currency of Object.keys(CURRENCIES)) assert.ok(rates.rates[currency] > 0, currency);
});

test('every new destination produces a finite budget and a feasible one-day highlight plan', () => {
  const expanded = ['priority','asia-oceania','europe','africa-americas'].flatMap(name => read(`expansion/${name}`));
  for (const city of expanded) {
    const stop = suggestStopPlan({cityId:city.id,days:1}, city, {departureDate:'2026-10-20'});
    const p = plan(city.id,1,{stops:[stop]});
    const budget = calculatePlan(p,cities,rates), [day] = generateItinerary(p,cities,rates);
    assert.ok(Number.isFinite(budget.total) && budget.total > 0, city.id);
    assert.ok(day.activeMinutes <= 480, `${city.id}: ${day.activeMinutes}`);
    assert.ok(day.items.at(-1).endMinute <= 1230, city.id);
    for (const id of stop.deferredAttractionIds) assert.ok(!budget.lines.some(line => line.attractionId === id), id);
  }
});

test('Maldives short intercity routes use boats and international gateways include island transfers', () => {
  const domestic = calculatePlan(plan('maafushi',3,{originId:'male'}),cities,rates);
  assert.equal(domestic.legs[0].transportMode,'boat');
  assert.ok(!domestic.lines.some(l => l.id === 'transfer-0'));
  assert.match(domestic.legs[0].link,/rome2rio/);
  const international = calculatePlan(plan('maafushi',3,{originId:'shanghai'}),cities,rates);
  assert.match(international.lines.find(l=>l.id==='transfer-0').note,/快艇/);
  assert.match(new URL(bookingLinks({origin:getCity('shanghai'),destination:getCity('maafushi')}).flights).searchParams.get('q'),/to MLE/);
  const tax = international.lines.find(l=>l.id==='stop-0-green-tax');
  assert.equal(tax.quantity,4);
  assert.equal(tax.nativeUnitLow,6);
  assert.equal(tax.nativeUnitHigh,12);
  const dayTrip = calculatePlan(plan('male',1),cities,rates);
  assert.equal(dayTrip.lines.find(l=>l.id==='stop-0-green-tax').amount,0);
});

test('water and Iceland road segments retain their own modes rather than walking/transit assumptions', () => {
  const island = getCity('maafushi');
  const ids = ['maafushi-beach','maafushi-gulhi'];
  const [day] = generateItinerary(plan(island.id,1,{stops:[{cityId:island.id,days:1,attractionIds:ids,dayPlans:[ids]}]}),cities,rates);
  const boat = day.items.find(i=>i.kind==='transport' && i.segment?.mode==='boat');
  assert.ok(boat);
  assert.ok(!new URL(boat.segment.mapsUrl).searchParams.has('travelmode'));
  const road = calculatePlan(plan('vik',3,{originId:'reykjavik'}),cities,rates);
  assert.equal(road.legs[0].transportMode,'road');
  assert.equal(calculatePlan(plan('akureyri',3,{originId:'reykjavik'}),cities,rates).legs[0].transportMode,'road');
  const [vikDay] = generateItinerary(plan('vik',1,{stops:[{cityId:'vik',days:1,attractionIds:['vik-skogafoss']}]}),cities,rates);
  assert.ok(vikDay.items.some(i=>i.segment?.mode==='road'));
  for (const schedule of [day,vikDay]) {
    const paid=schedule.items.filter(i=>i.kind==='transport' && i.segment && i.segment.mode!=='walk');
    assert.ok(paid.every(i=>i.cost.amount>0));
    assert.equal(Math.round(paid.reduce((n,i)=>n+i.cost.amount,0)*100),Math.round(schedule.costs.transport*100));
  }
});

test('night markets honor their evening suggestions and manual time conflicts remain visible', () => {
  const city=read('expansion/asia-oceania').find(c=>c.id==='taipei'), market=city.attractions.find(a=>a.id==='taipei-shilin');
  assert.ok(market);
  const [day]=generateItinerary(plan(city.id,1,{stops:[{cityId:city.id,days:1,attractionIds:[market.id]}]}),[city],rates);
  assert.ok(day.items.find(i=>i.attractionId===market.id).startMinute>=1020);
  const long=city.attractions.find(a=>a.id!==market.id);
  const [late]=generateItinerary(plan(city.id,1,{stops:[{cityId:city.id,days:1,attractionIds:[long.id,market.id],dayPlans:[[long.id,market.id]],visitDurations:{[long.id]:720}}]}),[city],rates);
  assert.ok(late.warnings.some(w=>w.code==='attraction-time-conflict'));
  assert.deepEqual(late.attractionIds,[long.id,market.id]);
});

test('night-market dinners fit within the visit and reconcile the existing food budget exactly once', () => {
  const cents=value=>Math.round(value*100);
  for(const [cityId,marketId] of [['taipei','taipei-shilin'],['luang-prabang','luang-prabang-night-market']]) {
    const city=read('expansion/asia-oceania').find(c=>c.id===cityId), market=city.attractions.find(a=>a.id===marketId);
    assert.equal(market.mealWithinVisit,'dinner');
    const stop=suggestStopPlan({cityId,days:1},city,{departureDate:'2026-10-20',candidateIds:[marketId]});
    assert.deepEqual(stop.attractionIds,[marketId]);
    const p=plan(cityId,1,{stops:[stop],overrides:{'stop-0-food':{amount:123.47,confirmed:true}}});
    const budget=calculatePlan(p,[city],rates), [day]=generateItinerary(p,[city],rates);
    const visit=day.items.find(i=>i.attractionId===marketId), dinners=day.items.filter(i=>i.mealType==='dinner');
    assert.equal(visit.startMinute,1020);
    assert.equal(visit.durationMinutes,market.durationRange.recommended);
    assert.equal(dinners.length,1);
    assert.equal(dinners[0].startMinute,visit.startMinute);
    assert.equal(dinners[0].durationMinutes,0);
    assert.equal(dinners[0].withinAttractionId,marketId);
    assert.equal(dinners[0].includedInVisit,true);
    assert.equal(dinners[0].cost.budgetLineId,'stop-0-food');
    assert.ok(dinners[0].cost.amount>0);
    assert.equal(day.activeMinutes,day.visitMinutes+day.travelMinutes+90);
    assert.ok(day.items.at(-1).endMinute<=1230);
    assert.equal(cents(day.costs.food),12347);
    assert.equal(day.items.filter(i=>i.kind==='meal').reduce((sum,i)=>sum+cents(i.cost.amount),0),budget.lines.filter(l=>l.category==='food').reduce((sum,l)=>sum+cents(l.amount),0));
    day.items.forEach((item,index)=>{ if(index) assert.ok(item.startMinute>=day.items[index-1].endMinute); });
  }
});

test('manual market order and an explicitly chosen dinner restaurant are preserved without a second dinner budget', () => {
  const source=read('expansion/asia-oceania').find(c=>c.id==='taipei'), market=source.attractions.find(a=>a.id==='taipei-shilin');
  const restaurant={id:'qa-dinner',cityId:source.id,kind:'restaurant',name:'Chosen dinner',lat:market.lat,lng:market.lng,durationMinutes:60,preferredStartTime:'19:00',priceOptions:[{id:'standard',name:'Dinner',low:400,high:600,currency:source.currency,unit:'person',type:'estimate',checkedAt:null,mealTypes:['dinner']}]};
  const city={...source,experiences:[restaurant]};
  const p=plan(city.id,1,{stops:[{cityId:city.id,days:1,attractionIds:[market.id],dayPlans:[[market.id]],experienceSelections:[{experienceId:restaurant.id,optionId:'standard',dayIndex:0,mealType:'dinner'}]}]});
  const budget=calculatePlan(p,[city],rates), [day]=generateItinerary(p,[city],rates), dinners=day.items.filter(i=>i.mealType==='dinner');
  assert.equal(day.items.find(i=>i.attractionId===market.id).startMinute,1020);
  assert.equal(dinners.length,1);
  assert.equal(dinners[0].experienceId,restaurant.id);
  assert.equal(dinners[0].durationMinutes,60);
  assert.equal(dinners[0].startMinute,1140);
  assert.ok(!dinners[0].includedInVisit);
  assert.ok(day.warnings.some(w=>w.code==='visit-meal-restaurant-selected'));
  assert.equal(Math.round(day.costs.food*100),budget.lines.filter(l=>l.category==='food').reduce((sum,l)=>sum+Math.round(l.amount*100),0));
  const other=city.attractions.find(a=>a.id!==market.id), ids=[market.id,other.id];
  const [manual]=generateItinerary(plan(city.id,1,{stops:[{cityId:city.id,days:1,attractionIds:ids,dayPlans:[ids]}]}),[city],rates);
  assert.deepEqual(manual.attractionIds,ids);
  assert.equal(manual.items.find(i=>i.attractionId===market.id).startMinute,1020);
  assert.equal(manual.items.filter(i=>i.mealType==='dinner').length,1);
});

test('an ordinary 17:00 sight without in-visit dining never moves generic dinner into mid-afternoon', () => {
  const source=read('expansion/asia-oceania').find(c=>c.id==='taipei');
  const city={...source,attractions:source.attractions.map(a=>({...a,mealWithinVisit:undefined}))};
  const [day]=generateItinerary(plan(city.id,1,{stops:[{cityId:city.id,days:1,attractionIds:['taipei-shilin']}]}),[city],rates);
  assert.equal(day.items.find(i=>i.attractionId==='taipei-shilin').startMinute,1020);
  const dinner=day.items.find(i=>i.mealType==='dinner');
  assert.ok(dinner.startMinute>=1020);
  assert.equal(dinner.durationMinutes,60);
});

test('a shared sightseeing pass is billed once on the same day and again on another day', () => {
  const city=getCity('siem-reap');
  const sights=city.attractions.filter(a=>a.price.passGroup==='angkor-pass').slice(0,2);
  assert.equal(sights.length,2);
  const ids=sights.map(a=>a.id);
  const compute=dayPlans=>calculatePlan(plan(city.id,2,{stops:[{cityId:city.id,days:2,attractionIds:ids,dayPlans}]}),cities,rates).lines.filter(l=>l.category==='attractions');
  const together=compute([ids,[]]), apart=compute([[ids[0]],[ids[1]]]);
  assert.deepEqual(together.map(l=>l.quantity),[2,0]);
  assert.deepEqual(apart.map(l=>l.quantity),[2,2]);
  assert.equal(together[1].sourceType,'included');
  assert.equal(together[1].amount,0);
});

test('unconfirmed private-island access stays out of automatic suggestions and warns when manually selected', () => {
  const city=getCity('maafushi'), restricted=city.attractions.filter(a=>a.automaticPlanning===false);
  assert.ok(restricted.length);
  const stop=suggestStopPlan({cityId:city.id,days:7},city,{departureDate:'2026-10-20'});
  for(const a of restricted) assert.ok(stop.deferredAttractionIds.includes(a.id));
  const [day]=generateItinerary(plan(city.id,1,{stops:[{cityId:city.id,days:1,attractionIds:[restricted[0].id]}]}),cities,rates);
  assert.ok(day.warnings.some(w=>w.code==='access-needs-confirmation'));
});
