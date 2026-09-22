import { buildJourneyWindows, estimateJourneyLeg } from './journey-windows.mjs';
import { suggestJourneyStops } from './journey-planning.mjs';
import { getTripDuration, recommendedDays } from './trip-duration.mjs';

// Editorial entry preferences, not a ranking of every city in a country.
const ENTRY_ORDER = {
  CN: ['beijing', 'shanghai', 'xian', 'chengdu', 'hangzhou', 'guangzhou'],
  JP: ['tokyo', 'kyoto', 'osaka'], TH: ['bangkok', 'chiang-mai'],
  IT: ['rome', 'florence', 'venice'], VN: ['hanoi', 'ho-chi-minh-city', 'da-nang', 'hoi-an'],
  MY: ['kuala-lumpur', 'penang', 'langkawi'], IS: ['reykjavik', 'vik', 'akureyri'],
  MV: ['maafushi', 'male'], GB: ['london', 'edinburgh'],
  EG: ['cairo', 'luxor'], IN: ['delhi', 'jaipur'], LK: ['colombo', 'kandy'],
};
const COUNTRY_LABELS = { HK: '中国香港', TW: '中国台湾' };
const MODES = { air: '航空交通预留', rail: '铁路 / 地面交通预留', road: '公路交通预留', boat: '船运交通预留' };
const dateAfter = (value, days) => new Date(Date.parse(`${value}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
const validCity = city => city && city.coverage !== 'airport-only' && city.countryCode && Array.isArray(city.attractions) && city.attractions.length > 0 && Number.isFinite(city.lat) && Number.isFinite(city.lng);
const compareCity = (a, b) => {
  const priority = ENTRY_ORDER[a.countryCode] || [];
  const aRank = priority.indexOf(a.id), bRank = priority.indexOf(b.id);
  return (aRank < 0 ? 100 : aRank) - (bRank < 0 ? 100 : bRank) || recommendedDays(b) - recommendedDays(a) || a.id.localeCompare(b.id);
};

/** Only cities with a maintained sightseeing catalogue are eligible destinations. */
export function listCountryDestinations(cities = []) {
  const groups = new Map();
  for (const city of cities.filter(validCity)) {
    if (!groups.has(city.countryCode)) groups.set(city.countryCode, { countryCode: city.countryCode, name: COUNTRY_LABELS[city.countryCode] || city.country || city.countryCode, cities: [] });
    groups.get(city.countryCode).cities.push(city);
  }
  return [...groups.values()].map(group => ({ ...group, cities: group.cities.sort(compareCity), cityCount: group.cities.length })).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

function validateDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || !Number.isFinite(Date.parse(`${value}T12:00:00Z`)) || new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error('出发日期无效，请选择有效日期。');
  return value;
}
function normalizedContext(input, cities) {
  const prior = input.planContext || {};
  const existingStops = Array.isArray(prior.stops) ? prior.stops : [];
  if (existingStops.some(stop => !Number.isInteger(Number(stop.days)) || Number(stop.days) < 1 || !cities.some(city => city.id === stop.cityId))) throw new Error('原行程包含无效城市或天数，请先修正原行程。');
  const totalDays = Number(input.totalDays ?? 7);
  if (!Number.isInteger(totalDays) || totalDays < 1 || totalDays > 365) throw new Error('本次旅程天数应为 1–365 的整数。');
  const maxCities = Math.min(8 - existingStops.length, Number(input.maxCities ?? 8));
  if (!Number.isInteger(maxCities) || maxCities < 1) throw new Error('行程最多安排 8 站，请先删除一站后再添加国家。');
  const originId = prior.originId ?? input.originId ?? null;
  const origin = cities.find(city => city.id === originId);
  const departureDate = validateDate(prior.departureDate || input.departureDate || new Date().toISOString().slice(0, 10));
  const returnTrip = prior.returnTrip ?? input.returnToOrigin ?? true;
  const excluded = new Set([...(input.excludedCityIds || []), ...existingStops.map(stop => stop.cityId)]);
  const country = listCountryDestinations(cities).find(group => group.countryCode === String(input.countryCode || '').toUpperCase());
  if (!country) throw new Error('该国家或地区尚无可自动规划的详细城市。');
  const pool = country.cities.filter(city => !excluded.has(city.id));
  if (!pool.length) throw new Error('该国家已维护的城市已在原行程内，暂无新的可添加城市。');
  const context = { originId, origin, departureDate, returnTrip: Boolean(returnTrip), mode: 'travel', existingStops, totalDays, maxCities, country, pool };
  context.entryCity = cities.find(city => city.id === existingStops.at(-1)?.cityId) || origin;
  return context;
}

function rawPlan(route, days, context) {
  return { originId: context.originId, departureDate: context.departureDate, mode: 'travel', returnTrip: context.returnTrip,
    stops: [...context.existingStops, ...route.map((city, index) => ({ cityId: city.id, days: days[index], daysSource: 'country-plan', planningMode: 'smart', attractionIds: city.attractions.map(item => item.id) }))] };
}
function inspect(route, days, context, cities) {
  const windows = buildJourneyWindows(rawPlan(route, days, context), cities).slice(context.existingStops.length);
  const localMinutes = windows.map(rows => rows.reduce((sum, row) => sum + row.maxLocalActiveMinutes, 0));
  const conflict = windows.some(rows => rows.some(row => /未能分配|不足以容纳|抵达与返程的活动边界重叠/.test(row.note)));
  const legs = [];
  let previous = context.entryCity;
  for (let i = 0; i < route.length; i++) {
    const leg = estimateJourneyLeg(previous, route[i], `leg-${context.existingStops.length + i}`);
    if (leg) legs.push({ ...leg, toStopIndex: i, direction: i === 0 ? 'arrival' : 'intercity', modeLabel: MODES[leg.mode] });
    previous = route[i];
  }
  if (context.returnTrip) {
    const leg = estimateJourneyLeg(previous, context.origin, 'leg-return');
    if (leg) legs.push({ ...leg, toStopIndex: null, direction: 'return', modeLabel: MODES[leg.mode] });
  }
  return { windows, localMinutes, conflict, legs, transportMinutes: legs.reduce((sum, leg) => sum + leg.estimatedMinutes, 0) };
}

function allocateDays(route, total, context, cities) {
  const days = route.map(() => 1);
  const targets = route.map(city => recommendedDays(city) * 360);
  // Add one calendar day where it most improves the least satisfied local stay.
  // Re-evaluation includes inbound/return overlap, not just proportional rounding.
  for (let remaining = total - route.length; remaining > 0; remaining--) {
    const current = inspect(route, days, context, cities);
    let bestIndex = 0, bestScore = -Infinity;
    for (let i = 0; i < route.length; i++) {
      const rows = current.windows[i];
      const hasConflict = rows.some(row => /未能分配|不足以容纳|抵达与返程的活动边界重叠/.test(row.note));
      const ratio = current.localMinutes[i] / targets[i];
      const score = (hasConflict ? 10000 : 0) + (1 - ratio) * 1000 + targets[i] / 10000 - i / 100;
      if (score > bestScore) { bestScore = score; bestIndex = i; }
    }
    days[bestIndex]++;
  }
  return days;
}
function minimumLocalMinutes(city) { return Math.max(1, Math.min(3, getTripDuration(city).min)) * 300; }
function rankedEntry(context, cities) {
  return context.pool.map((city, index) => {
    const route = [city], days = [context.totalDays], review = inspect(route, days, context, cities);
    const score = (review.conflict ? -100000 : 0) + Math.min(review.localMinutes[0], minimumLocalMinutes(city)) / 5 + Math.max(0, 140 - index * 22) - review.transportMinutes / 12;
    return { route, days, review, score };
  }).sort((a, b) => b.score - a.score || a.route[0].id.localeCompare(b.route[0].id))[0];
}
function chooseRoute(context, cities) {
  let selected = rankedEntry(context, cities);
  // Short breaks focus on one city. Longer trips earn additional stops only
  // when each receives meaningful local time after the transport reservation.
  const limit = Math.min(context.maxCities, context.pool.length, context.totalDays <= 4 ? 1 : Math.max(2, Math.floor(context.totalDays / 3)));
  while (selected.route.length < limit) {
    let next = null;
    for (const city of context.pool.filter(item => !selected.route.includes(item))) {
      for (let position = 0; position <= selected.route.length; position++) {
        const route = [...selected.route.slice(0, position), city, ...selected.route.slice(position)];
        const days = allocateDays(route, context.totalDays, context, cities);
        const review = inspect(route, days, context, cities);
        if (review.conflict || review.localMinutes.some((minutes, index) => minutes < minimumLocalMinutes(route[index]))) continue;
        const priority = context.pool.indexOf(city);
        const score = -review.transportMinutes - priority * 40;
        if (!next || score > next.score) next = { route, days, review, score };
      }
    }
    if (!next) break;
    selected = next;
  }
  return selected;
}

/**
 * totalDays belongs to the NEW country segment, including its travel days.
 * planContext keeps previous stops unchanged; stops contains only new stops,
 * planStops contains the complete preview. No commercial route is asserted.
 */
export function buildCountryDraft(input) {
  const allCities = Array.isArray(input?.cities) ? input.cities : [];
  const context = normalizedContext(input || {}, allCities);
  const contextIds = new Set([context.originId, ...context.existingStops.map(stop => stop.cityId)]);
  // The public catalogue can contain tens of thousands of airport-only places.
  // Keep them searchable outside this module, without rebuilding that giant map
  // for every prospective day allocation.
  const cities = allCities.filter(city => validCity(city) || contextIds.has(city.id));
  let route, days;
  if (input.cityIds !== undefined) {
    if (!Array.isArray(input.cityIds) || !input.cityIds.length || new Set(input.cityIds).size !== input.cityIds.length) throw new Error('城市顺序不能为空或包含重复城市。');
    if (input.cityIds.length > Math.min(context.maxCities, context.totalDays)) throw new Error('每个城市至少安排一天，且不能超过剩余站点数。');
    route = input.cityIds.map(id => context.pool.find(city => city.id === id));
    if (route.some(city => !city)) throw new Error('城市必须属于所选国家的详细资料库，且不能重复原行程中的城市。');
    if (input.dayAllocations !== undefined) {
      days = input.dayAllocations;
      if (!Array.isArray(days) || days.length !== route.length || days.some(day => !Number.isInteger(day) || day < 1) || days.reduce((a, b) => a + b, 0) !== context.totalDays) throw new Error('各城天数之和必须等于本次总天数，每城至少一天。');
    } else days = allocateDays(route, context.totalDays, context, cities);
  } else ({ route, days } = chooseRoute(context, cities));
  const review = inspect(route, days, context, cities);
  const base = rawPlan(route, days, context);
  // Only this new segment is generated. Existing manual AND smart stops keep
  // their saved selections and durations; the caller can replan those explicitly.
  const generationPlan = { ...base, stops: base.stops.map((stop, index) => index < context.existingStops.length ? { ...stop, planningMode: 'manual' } : stop) };
  const stops = suggestJourneyStops(generationPlan, cities, { automaticOnly: true }).slice(context.existingStops.length);
  const warnings = [
    { code: 'country-coverage', severity: 'info', message: `目前只在${context.country.name}的 ${context.country.cityCount} 个已维护城市中规划，不代表该国家的全部城市或景点。` },
    { code: 'transport-model', severity: 'info', message: '交通按现有距离模型预留接驳、候车与路程时间；并非已核实的直达航线、车次或时刻表，预订后请核对实际时间。' },
  ];
  if (!context.origin || !Number.isFinite(context.origin.lat) || !Number.isFinite(context.origin.lng)) warnings.push({ code: 'missing-origin', severity: 'danger', message: '尚未取得有效出发地，进出国家的交通未完整核算；请先选择有坐标的出发城市。' });
  if (review.conflict) warnings.push({ code: 'country-transport-conflict', severity: 'danger', message: '现有天数不足以容纳入城与返程交通。没有自动延长总天数；请增加天数、减少跨城移动或核对实际航班。' });
  if (input.cityIds && route.length >= 3) {
    const travelCost = ordered => {
      let previous = context.entryCity, sum = 0;
      for (const city of ordered) { sum += estimateJourneyLeg(previous, city)?.estimatedMinutes || 0; previous = city; }
      if (context.returnTrip) sum += estimateJourneyLeg(previous, context.origin)?.estimatedMinutes || 0;
      return sum;
    };
    let shorter = review.transportMinutes;
    for (let start = 0; start < route.length - 1; start++) for (let end = start + 1; end < route.length; end++) {
      const ordered = [...route.slice(0, start), ...route.slice(start, end + 1).reverse(), ...route.slice(end + 1)];
      shorter = Math.min(shorter, travelCost(ordered));
    }
    if (review.transportMinutes - shorter >= 90 && review.transportMinutes > shorter * 1.2) warnings.push({ code: 'country-route-detour', severity: 'warning', message: `当前城市顺序可能绕路；调整顺序可减少约 ${Math.round((review.transportMinutes - shorter) / 60 * 10) / 10} 小时的模型交通预留。已保留你的顺序，可使用“重新智能挑选”比较。` });
  }
  const unvisited = stops.filter(stop => !stop.attractionIds.length);
  if (unvisited.length) warnings.push({ code: 'country-no-sightseeing', severity: 'danger', message: `${unvisited.map(stop => route.find(city => city.id === stop.cityId).name).join('、')}在当前交通与开放条件下未能安排景点，请调整天数或城市。` });
  const deferredCount = stops.reduce((sum, stop) => sum + (stop.deferredAttractionIds?.length || 0), 0);
  if (deferredCount) warnings.push({ code: 'country-candidates', severity: 'info', message: `${deferredCount} 个景点留在候选库，已优先挑选能在时间预算内游览的内容，可在每日规划中替换。` });
  const routeIds = new Set(stops.map(stop => stop.cityId));
  const startOffset = context.existingStops.reduce((sum, stop) => sum + Number(stop.days), 0);
  let elapsed = 0;
  const stopSummaries = stops.map((stop, index) => {
    const localStartDay = elapsed + 1; elapsed += stop.days;
    return { cityId: stop.cityId, name: route[index].name, days: stop.days, startDay: localStartDay, endDay: elapsed, date: dateAfter(context.departureDate, startOffset + localStartDay - 1), localMinutes: review.localMinutes[index], travelOnlyDays: review.windows[index].filter(day => day.travelOnly).length, selectedCount: stop.attractionIds.length, deferredCount: stop.deferredAttractionIds.length, highlights: stop.attractionIds.slice(0, 3).map(id => route[index].attractions.find(attraction => attraction.id === id)?.name).filter(Boolean), recommendedDays: recommendedDays(route[index]) };
  });
  const candidates = context.pool.filter(city => !routeIds.has(city.id)).map(city => ({ cityId: city.id, name: city.name, recommendedDays: recommendedDays(city), reason: '为控制总天数与跨城移动保留为候选，可替换或加入后重新分配。' }));
  return {
    countryCode: context.country.countryCode, countryName: context.country.name, totalDays: context.totalDays,
    originId: context.originId, departureDate: dateAfter(context.departureDate, startOffset), planDepartureDate: context.departureDate,
    returnTrip: context.returnTrip, returnToOrigin: context.returnTrip, mode: 'travel',
    stops, planStops: [...context.existingStops, ...stops], transportLegs: review.legs,
    feasible: !warnings.some(warning => warning.severity === 'danger'), warnings, candidates,
    coverage: { scope: 'maintained-detailed-cities', availableCityCount: context.country.cityCount, eligibleCityCount: context.pool.length, selectedCityCount: stops.length, allCitiesCovered: false },
    summary: { cityCount: stops.length, totalDays: context.totalDays, priorDays: startOffset, overallDays: startOffset + context.totalDays, transportMinutes: review.transportMinutes, localMinutes: review.localMinutes.reduce((a, b) => a + b, 0), travelOnlyDays: review.windows.flat().filter(day => day.travelOnly).length, selectedAttractionCount: stops.reduce((sum, stop) => sum + stop.attractionIds.length, 0), deferredAttractionCount: deferredCount, stops: stopSummaries },
  };
}
