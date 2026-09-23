/** Local-day planning only. Routes and times are transparent models, not navigation or timetables. */
import { resolveExperienceSelections, experienceLineId, coveredMealSlots, MEAL_WEIGHTS } from './experiences.mjs';
import { buildJourneyWindows } from './journey-windows.mjs';
import { illustrationFor } from './media.mjs';
import { getDestinationPlanningProfile, getAttractionActivityType, getAttractionVisitRole, isSupportingVisit, destinationAttractionPriority, automaticDayCapacity } from './destination-planning.mjs';
const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
const attractionMap = city => new Map((city?.attractions || []).map(a => [a.id, a]));
const validCoordinate = p => Number.isFinite(p?.lat) && Number.isFinite(p?.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
export function getVisitDurationRange(attraction) {
  const clamp = value => Math.max(15, Math.min(720, Math.round(value)));
  const base = Number(attraction?.durationHours) > 0 ? Number(attraction.durationHours) * 60 : 120;
  const range = attraction?.durationRange || {};
  const recommended = clamp(Number.isFinite(range.recommended) ? range.recommended : base);
  const min = Math.min(recommended, clamp(Number.isFinite(range.min) ? range.min : Math.round(recommended * 0.5 / 15) * 15));
  const max = Math.max(recommended, clamp(Number.isFinite(range.max) ? range.max : Math.ceil(recommended * 1.5 / 15) * 15));
  return { min, recommended, max };
}
function visitDuration(attraction, stop) {
  const override = stop?.visitDurations?.[attraction?.id];
  if (override === undefined) return getVisitDurationRange(attraction).recommended;
  if (!Number.isFinite(override) || !Number.isInteger(override) || override < 15 || override > 720) throw new Error('自定义游览时长应为 15–720 分钟的整数');
  return override;
}
function validatedDurationOverrides(stop, city) {
  if (stop.visitDurations === undefined) return {};
  if (!stop.visitDurations || typeof stop.visitDurations !== 'object' || Array.isArray(stop.visitDurations)) throw new Error('自定义游览时长格式无效');
  const byId = attractionMap(city), result = {};
  for (const [id, minutes] of Object.entries(stop.visitDurations)) {
    if (!byId.has(id)) continue;
    result[id] = visitDuration(byId.get(id), stop);
  }
  return result;
}

/** Merge only validated user-defined sights. Curated records and input arrays are never mutated. */
export function mergeCustomAttractions(cities, customs = []) {
  if (!Array.isArray(cities) || !Array.isArray(customs) || customs.length > 200) throw new Error('自定义景点列表无效，最多支持 200 项');
  const result = cities.map(city => ({ ...city, attractions: [...(city.attractions || []).filter(a => !a.custom)] }));
  const byCity = new Map(result.map(c => [c.id, c]));
  const used = new Set(result.flatMap(c => c.attractions.map(a => a.id)));
  const safeText = (value, max, fallback = '') => typeof value === 'string' ? value.trim().slice(0, max) : fallback;
  const safeUrl = (value, image = false) => {
    if (!value) return null;
    if (typeof value !== 'string' || value.length > 2048) throw new Error('自定义景点链接格式无效');
    if (image && /^\/images\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..')) return value;
    let url;
    try { url = new URL(value); } catch { throw new Error('自定义景点链接应为 HTTP(S) 地址'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('自定义景点链接应为 HTTP(S) 地址');
    return url.href;
  };
  for (const input of customs) {
    if (!input || typeof input !== 'object' || !byCity.has(input.cityId)) throw new Error('自定义景点所属城市无效');
    if (typeof input.id !== 'string' || !/^custom-[a-zA-Z0-9_-]{1,93}$/.test(input.id) || used.has(input.id)) throw new Error('自定义景点 ID 应以 custom- 开头且不能重复');
    const city = byCity.get(input.cityId), name = safeText(input.name, 100);
    if (!name) throw new Error('请填写自定义景点名称');
    const durationHours = input.durationHours ?? 2;
    if (!Number.isFinite(durationHours) || durationHours < 0.25 || durationHours > 12) throw new Error('自定义景点时长应为 0.25–12 小时');
    const low = input.price?.low ?? 0, high = input.price?.high ?? low;
    if (![low, high].every(n => Number.isFinite(n) && n >= 0 && n <= 1e7) || low > high) throw new Error('自定义门票金额无效');
    const currency = input.price?.currency || city.currency;
    if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) throw new Error('自定义门票币种格式无效');
    const hasCoordinates = input.lat !== undefined || input.lng !== undefined;
    if (hasCoordinates && !validCoordinate(input)) throw new Error('自定义景点需要成对填写有效经纬度');
    const sourceUrl = safeUrl(input.price?.sourceUrl);
    const imageUrl = safeUrl(input.image?.url, true);
    const custom = { id: input.id, cityId: city.id, name, nameEn: safeText(input.nameEn, 100, name), description: safeText(input.description, 1500, '你的自定义景点；请核对开放、预约及交通条件。'), durationHours, category: safeText(input.category, 50, '自定义'), features: Array.isArray(input.features) ? input.features.filter(f => typeof f === 'string').slice(0, 6).map(f => f.slice(0, 80)) : ['我的私藏'], custom: true, price: { low, high, currency, type: 'user', sourceUrl, sourceName: '用户填写', checkedAt: input.price?.checkedAt && /^\d{4}-\d{2}-\d{2}/.test(input.price.checkedAt) ? input.price.checkedAt : null, note: safeText(input.price?.note, 1000, '用户提供的门票预算，不代表已核验的官方票价。') } };
    if (hasCoordinates) { custom.lat = input.lat; custom.lng = input.lng; }
    if (input.durationRange) custom.durationRange = getVisitDurationRange(input);
    if (Number.isFinite(input.priority)) custom.priority = input.priority;
    if (imageUrl) custom.image = { url: imageUrl, credit: safeText(input.image.credit, 200, '用户提供'), sourceUrl: safeUrl(input.image.sourceUrl) || imageUrl, license: safeText(input.image.license, 100, '请核对原图使用许可') };
    else custom.image = illustrationFor(custom);
    used.add(custom.id); city.attractions.push(custom);
  }
  return result;
}

export function buildDayAssignments(stop, city) {
  const count = Number(stop?.days);
  if (!Number.isInteger(count) || count < 1 || count > 365) throw new Error('停留天数应为 1–365 的整数');
  const byId = attractionMap(city);
  validatedDurationOverrides(stop, city);
  const selected = [...new Set((Array.isArray(stop.attractionIds) ? stop.attractionIds : []).filter(id => byId.has(id)))];
  const selectedSet = new Set(selected), used = new Set();
  const days = Array.from({ length: count }, () => []);
  const loads = Array(count).fill(0);
  if (Array.isArray(stop.dayPlans)) stop.dayPlans.slice(0, count).forEach((ids, day) => {
    if (!Array.isArray(ids)) return;
    for (const id of ids) if (selectedSet.has(id) && !used.has(id)) {
      days[day].push(id); used.add(id); loads[day] += visitDuration(byId.get(id), stop);
    }
  });
  // Selected attractions on a removed day or added after editing are never dropped.
  for (const id of selected) if (!used.has(id)) {
    let day = 0;
    for (let i = 1; i < count; i++) if (loads[i] < loads[day]) day = i;
    days[day].push(id); loads[day] += visitDuration(byId.get(id), stop); used.add(id);
  }
  return days;
}

export function geographicDistanceKm(a, b) {
  if (!validCoordinate(a) || !validCoordinate(b)) return null;
  const rad = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lng - a.lng) * rad / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
function pathDistance(ids, byId) {
  let sum = 0;
  for (let i = 1; i < ids.length; i++) {
    const d = geographicDistanceKm(byId.get(ids[i - 1]), byId.get(ids[i]));
    if (d === null) return null;
    sum += d;
  }
  return sum;
}
export function optimizeDayRoute(ids, city) {
  const byId = attractionMap(city);
  const original = [...new Set((Array.isArray(ids) ? ids : []).filter(id => byId.has(id)))];
  if (original.length < 3 || original.some(id => !validCoordinate(byId.get(id)))) return original;
  const candidate = [original[0]], remaining = original.slice(1);
  while (remaining.length) {
    let nearest = 0;
    for (let i = 1; i < remaining.length; i++) if (geographicDistanceKm(byId.get(candidate.at(-1)), byId.get(remaining[i])) < geographicDistanceKm(byId.get(candidate.at(-1)), byId.get(remaining[nearest]))) nearest = i;
    candidate.push(...remaining.splice(nearest, 1));
  }
  let best = pathDistance(candidate, byId);
  for (let pass = 0; pass < original.length * 2; pass++) {
    let improved = false;
    for (let i = 1; i < candidate.length - 1; i++) for (let j = i + 1; j < candidate.length; j++) {
      const next = [...candidate.slice(0, i), ...candidate.slice(i, j + 1).reverse(), ...candidate.slice(j + 1)];
      const distance = pathDistance(next, byId);
      if (distance + 0.000001 < best) { candidate.splice(0, candidate.length, ...next); best = distance; improved = true; }
    }
    if (!improved) break;
  }
  // A heuristic must never suggest a route longer than the original.
  return best < pathDistance(original, byId) ? candidate : original;
}

/** Integer-cent largest-remainder allocation: no lost cents across days, meals or legs. */
export function allocateMoney(amount, weights) {
  if (!weights.length) return [];
  if (amount === null || amount === undefined) return weights.map(() => null);
  if (!Number.isFinite(amount) || amount < 0) throw new Error('分配金额无效');
  const safe = weights.map(w => Number.isFinite(w) && w > 0 ? w : 0);
  const sum = safe.reduce((a, b) => a + b, 0);
  const normalized = sum ? safe.map(w => w / sum) : safe.map(() => 1 / safe.length);
  const cents = Math.round(amount * 100);
  const precise = normalized.map(w => cents * w);
  const allocated = precise.map(n => Math.floor(n));
  let remainder = cents - allocated.reduce((a, b) => a + b, 0);
  const order = precise.map((n, i) => ({ index: i, rest: n - allocated[i] })).sort((a, b) => b.rest - a.rest || a.index - b.index);
  for (let i = 0; remainder > 0; i++, remainder--) allocated[order[i % order.length].index]++;
  return allocated.map(n => n / 100);
}
export function formatItineraryTime(minutes) {
  const whole = Math.max(0, Math.round(minutes));
  const suffix = whole >= 1440 ? `+${Math.floor(whole / 1440)}` : '';
  const value = whole % 1440;
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}${suffix}`;
}
function parseStartTime(value = '09:00') {
  if (!/^\d{2}:\d{2}$/.test(value)) throw new Error('每日开始时间格式应为 HH:mm');
  const [h, m] = value.split(':').map(Number), minutes = h * 60 + m;
  if (m >= 60 || minutes < 420 || minutes > 720) throw new Error('每日开始时间应在 07:00–12:00 之间');
  return minutes;
}
function dateAt(date, offset) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
function closedOn(attraction, date) {
  const availability = attraction.availability;
  if (!availability || availability.status !== 'temporarily-closed') return false;
  return (!availability.from || date >= availability.from) && (!availability.until || date <= availability.until);
}
function makeSegment(from, to, city = {}) {
  const straight = geographicDistanceKm(from, to);
  if (straight === null) return null;
  const water = (from.travelGroup && to.travelGroup && from.travelGroup !== to.travelGroup) || (['boat'].includes(to.routeMode) || ['boat'].includes(from.routeMode));
  const mode = water ? 'boat' : straight * 1.25 <= 1.5 ? 'walk' : [city.routeMode, from.routeMode, to.routeMode].includes('road') ? 'road' : 'transit';
  const detourFactor = mode === 'walk' ? 1.25 : mode === 'boat' ? 1.2 : 1.35;
  const distanceKm = straight * detourFactor;
  const durationMinutes = mode === 'walk' ? Math.max(distanceKm > 0 ? 5 : 0, Math.ceil(distanceKm / 4.5 * 60)) : mode === 'boat' ? Math.ceil(distanceKm / 25 * 60 + 30) : mode === 'road' ? Math.ceil(distanceKm / 45 * 60 + 15) : Math.ceil(distanceKm / 23 * 60 + 18);
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('origin', `${from.lat},${from.lng}`);
  url.searchParams.set('destination', `${to.lat},${to.lng}`);
  if (mode !== 'boat') url.searchParams.set('travelmode', mode === 'walk' ? 'walking' : mode === 'road' ? 'driving' : 'transit');
  return { fromId: from.id, toId: to.id, fromName: from.name, toName: to.name, distanceKm, straightLineKm: straight, detourFactor, mode, estimated: true, durationMinutes, mapsUrl: url.href, sourceType: 'model', note: mode === 'walk' ? '直线距离 × 1.25，按步速 4.5 km/h 估算；未检查步道、坡度与过街条件。' : mode === 'boat' ? '跨岛待核船程：直线距离 × 1.2，按25 km/h及30分钟登船预留。未查询码头、船班或海况，不是可执行航线；地图只定位起终点，必须向运营方核实。' : mode === 'road' ? '公路参考：直线距离 × 1.35，按45 km/h及15分钟停车预留。不是实时导航，不保证有公交；租车、燃油、停车、冬季道路另核。' : '直线距离 × 1.35，按 23 km/h 加 18 分钟接近站点/候车估算；不是实际线路或时刻表。' };
}

// A transport block can be just one day of a longer journey. Never call that
// partial block an arrival, even though it is stored under window.inbound.
function completesArrival(window, allWindows, day) {
  if (!window.inbound || /未能分配|不足以容纳|抵达日在本站|才可开始活动/.test(window.note || '')) return false;
  if (window.inbound.fromId === window.inbound.toId || window.inbound.mode === 'local') return false;
  if (allWindows.slice(day + 1).some(next => next.inbound?.legId === window.inbound.legId)) return false;
  if (window.inbound.basis === 'user-local-window') return true;
  const allocated = allWindows.reduce((sum, next) => sum + (next.inbound?.legId === window.inbound.legId ? next.inbound.reservedMinutes : 0), 0);
  // suggestStopPlan evaluates a single partial-day window in isolation. A
  // remainder smaller than one full travel day still denotes the final block.
  return allocated >= window.inbound.estimatedMinutes || window.inbound.reservedMinutes < 690;
}

function nearbyArrivalWalk(city, anchor, excludedIds, date, availableMinutes) {
  if (!validCoordinate(anchor) || availableMinutes < 30) return null;
  const candidates = (city.attractions || []).filter(place => {
    const text = `${place.name || ''} ${place.category || ''} ${(place.features || []).join(' ')}`;
    return !excludedIds.has(place.id) && place.automaticPlanning !== false && !closedOn(place, date) && validCoordinate(place)
      && place.price?.low === 0 && place.price?.high === 0
      && /街区|广场|公园|河岸|河畔|滨江|海滨|步行街|老街|胡同|公共街区|promenade|square|neighbou?rhood|park/i.test(text)
      && !/山丘|登山|山顶|火山|国家公园|跨岛|海岛|瀑布|沙漠|自然保护区|hiking|mountain|national park/i.test(text)
      && !/需.{0,8}预约|必须.{0,8}预约|预约入场|按预约|预约.{0,3}安检|实名|reservation required|booking required/i.test(`${place.bestTime || ''} ${place.description || ''} ${place.price?.note || ''}`);
  }).map(place => ({ place, segment: makeSegment(anchor, place, city) }))
    .filter(row => row.segment?.mode === 'walk' && row.segment.durationMinutes <= 25 && row.segment.durationMinutes * 2 + 30 <= availableMinutes)
    .sort((a, b) => a.segment.durationMinutes - b.segment.durationMinutes || (b.place.priority || 0) - (a.place.priority || 0));
  if (!candidates.length) return null;
  const { place, segment } = candidates[0];
  const strollMinutes = Math.min(45, Math.floor((availableMinutes - segment.durationMinutes * 2) / 15) * 15);
  return { place, segment, strollMinutes, walkingMinutes: segment.durationMinutes * 2, durationMinutes: segment.durationMinutes * 2 + strollMinutes };
}
const emptyCost = currency => ({ amount: 0, currency, sourceType: 'included', note: '此项不另计费用。' });
function lineCost(line, currency, amount = line?.amount, allocation = false) {
  return {
    amount: line?.missingPrice ? null : amount ?? null, currency, missingPrice: Boolean(line?.missingPrice), sourceType: !line ? 'unavailable' : line.missingPrice ? 'missing' : allocation ? 'budget-allocation' : line.sourceType,
    originalSourceType: line?.sourceType || null, budgetLineId: line?.id || null,
    sourceUrl: line?.sourceUrl || null, sourceName: line?.sourceName || null, checkedAt: line?.checkedAt || null,
    confirmed: allocation ? false : Boolean(line?.confirmed),
    note: !line ? '加载汇率后按整团预算分配；当前未计算金额。' : line.missingPrice ? line.note : allocation ? '从现有整团预算中分摊，不新增总费用，也不是这一餐或这一段的实际报价。' : line.note,
  };
}

export function generateDetailedItinerary(plan, cities, budget = null, planningWindows = null) {
  const cityMap = new Map(cities.map(c => [c.id, c]));
  const currency = plan.currency || 'CNY';
  const lineMap = new Map((budget?.lines || []).map(l => [l.id, l]));
  const result = [];
  const journeyWindows = planningWindows || buildJourneyWindows(plan, cities);
  const chargedJourneyLines = new Set();
  let elapsed = 0;
  plan.stops.forEach((stop, stopIndex) => {
    const city = cityMap.get(stop.cityId);
    if (!city) throw new Error('目的地不存在');
    const assignments = buildDayAssignments(stop, city), byId = attractionMap(city);
    const selectedExperiences = resolveExperienceSelections(stop, city);
    const hotel = selectedExperiences.find(row => row.experience.kind === 'hotel');
    const baseStart = parseStartTime(stop.startTime);
    const foodLine = lineMap.get(`stop-${stopIndex}-food`), transportLine = lineMap.get(`stop-${stopIndex}-transport`);
    const restaurants = selectedExperiences.filter(row => row.experience.kind === 'restaurant');
    const foodWeights = assignments.flatMap((_, day) => ['breakfast', 'lunch', 'dinner'].map(meal => coveredMealSlots(selectedExperiences, day).has(meal) ? 0 : MEAL_WEIGHTS[meal]));
    const baselineMealShares = foodWeights.some(weight => weight > 0) ? allocateMoney(foodLine?.amount, foodWeights) : foodWeights.map(() => budget ? 0 : null);
    const transportShares = allocateMoney(transportLine?.amount, assignments.map(() => 1));
    assignments.forEach((ordinaryIds, localDay) => {
      const dayWindow = journeyWindows?.[stopIndex]?.[localDay] || { startMinute: 0, endMinute: 1440, maxLocalActiveMinutes: 480, reservedMinutes: 0 };
      const arrivalCompleted = completesArrival(dayWindow, journeyWindows?.[stopIndex] || [dayWindow], localDay);
      const stayNights = plan.mode === 'stay' ? stop.days : stop.days - (stopIndex === plan.stops.length - 1 ? 1 : 0);
      const hasNightAfterToday = localDay < stayNights && (!budget || (lineMap.get(`stop-${stopIndex}-lodging`)?.quantity || 0) > 0);
      const constrained = Boolean(dayWindow.inbound || dayWindow.outbound || dayWindow.reservedMinutes || dayWindow.startMinute > 0 || dayWindow.endMinute < 1440);
      const activities = selectedExperiences.filter(row => row.experience.kind === 'experience' && row.selection.dayIndex === localDay && row.selection.scheduleStatus !== 'needs-more-days');
      const anchor = hotel && validCoordinate(hotel.experience) ? { travelGroup: city.travelGroup, ...hotel.experience, id: `${city.id}-selected-hotel` } : { id: `${city.id}-center-reference`, name: '住宿区域待填写（市中心参考）', lat: city.lat, lng: city.lng, travelGroup: city.travelGroup };
      const ids = [...ordinaryIds];
      for (const row of activities) {
        const id = `experience-${row.key}`;
        const place = { ...row.experience, ...(row.includesTransfers ? { lat: anchor.lat, lng: anchor.lng } : {}), id, durationHours: row.durationMinutes / 60, _experienceRow: row };
        byId.set(id, place);
        let best = { position: ids.length, distance: Infinity };
        for (let position = 0; position <= ids.length; position++) {
          const previous = position ? byId.get(ids[position - 1]) : anchor, next = position < ids.length ? byId.get(ids[position]) : anchor;
          const a = geographicDistanceKm(previous, place), b = geographicDistanceKm(place, next), c = geographicDistanceKm(previous, next);
          if (a !== null && b !== null && c !== null && a + b - c < best.distance) best = { position, distance: a + b - c };
        }
        ids.splice(best.position, 0, id);
      }
      const preferredMinute = row => /^\d{2}:\d{2}$/.test(row?.preferredStartTime || '') ? Number(row.preferredStartTime.slice(0, 2)) * 60 + Number(row.preferredStartTime.slice(3)) : null;
      // Early activities precede ordinary sightseeing. This is a requested time,
      // explicitly unconfirmed, never a claim that a supplier has availability.
      const earlyIds = ids.filter(id => { const minute = preferredMinute(byId.get(id)._experienceRow); return minute !== null && minute <= baseStart; }).sort((a, b) => preferredMinute(byId.get(a)._experienceRow) - preferredMinute(byId.get(b)._experienceRow));
      const eveningIds = ids.filter(id => { const minute = preferredMinute(byId.get(id)._experienceRow); return minute !== null && minute >= 1020; }).sort((a, b) => preferredMinute(byId.get(a)._experienceRow) - preferredMinute(byId.get(b)._experienceRow));
      ids.splice(0, ids.length, ...earlyIds, ...ids.filter(id => !earlyIds.includes(id) && !eveningIds.includes(id)), ...eveningIds);
      const firstEarlyRow = earlyIds.length ? byId.get(earlyIds[0])._experienceRow : null;
      const breakfastAfterEarly = firstEarlyRow && (preferredMinute(firstEarlyRow) < 420 || firstEarlyRow.includedMeals.includes('breakfast'));
      const earliest = firstEarlyRow ? preferredMinute(firstEarlyRow) - (makeSegment(anchor, byId.get(earlyIds[0]), city)?.durationMinutes || 0) - (breakfastAfterEarly ? 0 : 30) : baseStart;
      const localStart = Math.max(dayWindow.startMinute, 0, Math.min(baseStart, earliest));
      const dayId = `stop-${stopIndex}-day-${localDay}`;
      const first = localDay === 0;
      const last = localDay === assignments.length - 1 && stopIndex === plan.stops.length - 1;
      const previousCityId = stopIndex ? plan.stops[stopIndex - 1].cityId : plan.originId;
      const arriving = first && previousCityId !== city.id;
      const returning = last && plan.returnTrip !== false && plan.mode !== 'stay' && city.id !== plan.originId;
      const warnings = [], items = [];
      const packageForMeal = meal => activities.find(row => row.includedMeals.includes(meal));
      const dinnerRestaurant = restaurants.find(row => row.selection.dayIndex === localDay && row.selection.mealType === 'dinner');
      // A food market can cover the time for dinner without covering its price.
      // Reserve this meal slot for the visit, while keeping the existing daily
      // food allocation. Explicit restaurants and prepaid meals take precedence.
      const dinnerVisit = !dinnerRestaurant && !packageForMeal('dinner')
        ? ids.map(id => byId.get(id)).find(place => !place._experienceRow && place.mealWithinVisit === 'dinner')
        : null;
      const includedMealItem = (meal, row) => ({ id: `${dayId}-${meal}`, kind: 'meal', mealType: meal, timing: 'unscheduled', title: `${{ breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }[meal]} · 已含体验套餐`, description: `包含在 ${row.experience.name} / ${row.option.name} 中；用餐时间包含在该体验总时长内，本提醒不另占时间或计费。具体供餐时段待确认。`, experienceId: row.experience.id, optionId: row.option.id, timeUnconfirmed: true, includedInExperience: true, cost: { ...emptyCost(currency), budgetLineId: experienceLineId(stopIndex, row.selection), note: '费用和时长已包含在体验套餐，未重复计入餐饮预算。' } });
      let cursor = localStart, lunchDone = false, dinnerDone = false, lunchEnd = 0, breakfastDone = false;
      let location = anchor;
      const segments = [];
      const mealShares = baselineMealShares.slice(localDay * 3, localDay * 3 + 3);
      const push = (item, durationMinutes = 0, notBefore = cursor) => {
        cursor = Math.max(cursor, notBefore);
        const timing = item.timing === 'unscheduled' && durationMinutes === 0 ? 'unscheduled' : 'scheduled';
        const result = { ...item, timing, time: timing === 'unscheduled' ? null : formatItineraryTime(cursor), endTime: timing === 'unscheduled' ? null : formatItineraryTime(cursor + durationMinutes), startMinute: cursor, endMinute: cursor + durationMinutes, durationMinutes };
        items.push(result); cursor += durationMinutes; return result;
      };
      const addJourney = (journey, direction) => {
        if (!journey) return;
        const legId = journey.legId || `leg-${direction === 'inbound' ? stopIndex : 'return'}`;
        const line = lineMap.get(legId);
        const zeroReserve = !(journey.reservedMinutes > 0);
        const start = zeroReserve ? (direction === 'inbound' ? localStart : dayWindow.endMinute) : Math.max(0, Math.min(1440, journey.startMinute ?? (direction === 'inbound' ? 540 : dayWindow.endMinute)));
        const end = zeroReserve ? start : Math.max(start, Math.min(1440, journey.endMinute ?? (start + (journey.reservedMinutes || 0))));
        if (direction === 'inbound') cursor = Math.min(cursor, start);
        const duration = Math.max(0, end - Math.max(cursor, start));
        const alreadyCharged = chargedJourneyLines.has(legId);
        const cost = alreadyCharged ? { ...emptyCost(currency), budgetLineId: legId, note: '这段交通的预算已在此前的交通日计入，不重复收费。' } : !line && budget ? emptyCost(currency) : lineCost(line, currency);
        push({ id: `${dayId}-${direction}-journey`, kind: direction === 'inbound' ? 'arrival' : 'departure', journey: true, journeyPhase: 'in-transit', journeyDirection: direction, transportMode: journey.mode || journey.transportMode, plannedStartMinute: start, plannedEndMinute: end, reservedDurationMinutes: journey.reservedMinutes || end - start, title: direction === 'inbound' ? `${localDay ? '继续前往' : '出发前往'}${city.name} · 跨城交通` : `返程交通 · ${line?.label || '离开目的地'}`, description: `${dayWindow.note || '跨城交通占时预留。'} 此处为当地日间规划占位，不是航班或车次时刻；接驳、候车与路程已纳入占时，实际票面日期和时区需另核对。${alreadyCharged ? '票价已在此前交通日列出。' : '以下金额引用现有整团交通预算，不新增一笔费用。'}`, timeUnconfirmed: true, cost }, duration, start);
        chargedJourneyLines.add(legId);
        const transferId = legId.replace(/^leg-/, 'transfer-');
        const transfer = lineMap.get(transferId);
        if (transfer && !chargedJourneyLines.has(transferId)) {
          push({ id: `${dayId}-${direction}-gateway`, kind: 'journey-transfer', journey: true, journeyDirection: direction, timing: 'unscheduled', title: '两端接驳预算 · 已含在上述交通占时中', description: transfer.note, timeUnconfirmed: true, cost: lineCost(transfer, currency) });
          chargedJourneyLines.add(transferId);
        }
        if (direction === 'inbound') cursor = Math.max(cursor, localStart);
      };
      if (dayWindow.inbound) addJourney(dayWindow.inbound, 'inbound');
      else if (first) push({ id: `${dayId}-arrival`, kind: arriving ? 'arrival' : 'free', title: arriving ? `抵达${city.name} · 当地开始时间待核对` : `开始${city.name}本地旅程`, description: arriving ? '根据交通设置安排当地可活动时间；这不是航班/火车抵达时刻，请按实际交通核对。' : '出发地就在本城，无需这一段城际交通。', cost: emptyCost(currency) });
      if (arrivalCompleted) push({ id: `${dayId}-arrival-ready`, kind: 'arrival', routineType: 'arrival-ready', journey: true, journeyPhase: 'arrived', journeyDirection: 'inbound', title: `抵达后 · 开始${city.name}的当地安排`, description: `这是交通预留结束后的当地活动起点，不是已确认的列车或航班抵达时刻。接驳时间已在跨城预留中考虑。${localStart >= 1140 ? ' 抵达较晚，建议直接安顿休息，入住请提前向住宿方确认。' : ''}`, timeUnconfirmed: true, cost: emptyCost(currency) });
      if (hotel && hasNightAfterToday && ((first && !dayWindow.inbound) || arrivalCompleted)) push({ id: `${dayId}-hotel`, kind: 'hotel', timing: 'unscheduled', title: `住宿选择 · ${hotel.experience.name}`, description: `${hotel.option.name}；入住时间及所选日期房态待酒店确认。此提醒不占用游览时段，住宿费见整站明细。`, experienceId: hotel.experience.id, optionId: hotel.option.id, image: hotel.experience.image || city.image, bookingUrl: hotel.experience.bookingUrl, cost: { ...emptyCost(currency), budgetLineId: `stop-${stopIndex}-lodging`, note: '整站住宿费用已在住宿明细计入，此提醒不重复计费。' } });
      const journeyMealPlacement = meal => {
        const pastMeal = { breakfast: 660, lunch: 900, dinner: 1140 }[meal];
        if (dayWindow.inbound && (!arrivalCompleted || dayWindow.startMinute >= pastMeal)) return { duringJourney: true, placement: 'during-journey', relatedJourneyId: `${dayId}-inbound-journey`, journeyDirection: 'inbound' };
        if (dayWindow.outbound && (dayWindow.travelOnly || { breakfast: 480, lunch: 780, dinner: 1140 }[meal] >= dayWindow.outbound.startMinute)) return { duringJourney: true, placement: 'during-journey', relatedJourneyId: `${dayId}-outbound-journey`, journeyDirection: 'outbound' };
        return { duringJourney: false, placement: 'flexible' };
      };
      const addBreakfast = () => {
        if (breakfastDone) return;
        breakfastDone = true;
        const included = packageForMeal('breakfast');
        const restaurant = restaurants.find(row => row.selection.dayIndex === localDay && row.selection.mealType === 'breakfast');
        if (restaurant) addMeal('breakfast', cursor);
        else if (included) push(includedMealItem('breakfast', included));
        else {
          const usedLocalMinutes = items.filter(item => !item.journey).reduce((total, item) => total + item.durationMinutes, 0);
          const unscheduled = constrained && (dayWindow.travelOnly || cursor >= 660 || cursor + 30 > dayWindow.endMinute || usedLocalMinutes + 30 > dayWindow.maxLocalActiveMinutes);
          const placement = unscheduled ? journeyMealPlacement('breakfast') : {};
          push({ id: `${dayId}-breakfast`, kind: 'meal', mealType: 'breakfast', ...(unscheduled ? { timing: 'unscheduled', ...placement } : {}), title: unscheduled ? `${placement.duringJourney ? '出发前 / 途中' : ''}早餐预算 · 自行安排` : cursor >= 660 ? '早餐 / 早午餐' : '早餐', description: unscheduled ? placement.duringJourney ? '早餐费用从原日预算分配，留给出发前或交通途中用餐，没有指定某个时刻，也不占用抵达后的游览时间。' : '早餐费用从原日预算分配；尚未指定用餐时刻，可在休息时自行安排，这条预算提醒不另占活动时间。' : '按未指定餐次的预算分摊；如有清晨体验则安排在体验之后，具体供应时段需另核对。', features: ['当地餐饮', '整团预算分摊'], cost: lineCost(foodLine, currency, mealShares[0], true) }, unscheduled ? 0 : 30);
        }
      };
      const lunchDue = Math.max(750, baseStart + 180);
      const addMeal = (mealType, notBefore) => {
        const row = restaurants.find(row => row.selection.dayIndex === localDay && row.selection.mealType === mealType);
        const included = packageForMeal(mealType);
        const mealName = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }[mealType];
        if (row) {
          if (included) warnings.push({ code: 'duplicate-included-meal', severity: 'warning', message: `${included.experience.name}套餐已含${mealName}，同时选择了${row.experience.name}；两笔用户选择的费用均保留，请确认是否需要额外用餐。` });
          move(row.experience, `meal-${mealType}`, false);
          const line = lineMap.get(experienceLineId(stopIndex, row.selection));
          const requested = preferredMinute(row);
          if (requested !== null && cursor > requested) warnings.push({ code: 'experience-time-conflict', severity: 'warning', message: `${row.experience.name}的建议用餐时段 ${row.preferredStartTime} 与前段行程冲突，请调整或联系餐厅确认。` });
          push({ id: `${dayId}-${mealType}`, kind: 'meal', mealType, title: `${row.experience.name} · ${mealName}`, description: `${row.option.name}。${row.experience.description || ''} 已替换对应餐次预留；营业、订位及套餐适用时段待确认。`, experienceId: row.experience.id, optionId: row.option.id, image: row.experience.image || city.image, features: row.experience.features || [], price: row.option, bookingUrl: row.experience.bookingUrl, requestedStartTime: row.preferredStartTime, timeUnconfirmed: true, cost: lineCost(line, currency) }, row.durationMinutes, requested ?? notBefore);
        } else if (included) push(includedMealItem(mealType, included));
        else {
          const usedLocalMinutes = items.filter(item => !item.journey).reduce((total, item) => total + item.durationMinutes, 0);
          const unscheduled = constrained && (dayWindow.travelOnly || Math.max(cursor, notBefore) + 60 > dayWindow.endMinute || (mealType === 'lunch' && cursor >= 900) || usedLocalMinutes + 60 > dayWindow.maxLocalActiveMinutes);
          const placement = unscheduled ? journeyMealPlacement(mealType) : {};
          push({ id: `${dayId}-${mealType}`, kind: 'meal', mealType, ...(unscheduled ? { timing: 'unscheduled', ...placement } : {}), title: unscheduled ? `${placement.duringJourney ? '出发前 / 途中' : ''}${mealName}预算 · 自行安排` : mealType === 'lunch' ? '景点周边午餐' : '当地晚餐', description: unscheduled ? placement.duringJourney ? '餐费保留在原日预算中，在出发前或交通途中灵活用餐；未指定用餐时刻，这条提醒不占用当地游览时间。' : '餐费保留在原日预算中，未指定具体餐厅或时刻；可在当地休息时自行安排，这条提醒不另占活动时间。' : '未指定餐厅的餐次；金额从本城市剩余餐饮预算按餐次权重分摊，未新增费用。', features: ['预留休息', '整团预算分摊'], cost: lineCost(foodLine, currency, mealShares[mealType === 'lunch' ? 1 : 2], true) }, unscheduled ? 0 : 60, unscheduled ? cursor : notBefore);
        }
      };
      const addLunch = (notBefore = cursor) => {
        if (lunchDone) return;
        lunchDone = true; addMeal('lunch', notBefore); lunchEnd = cursor;
      };
      const addDinner = (notBefore = cursor) => {
        if (dinnerDone) return;
        dinnerDone = true; addMeal('dinner', notBefore);
      };
      const beforeBlock = duration => {
        if (!lunchDone && (cursor >= lunchDue || (cursor >= lunchDue - 60 && cursor + duration > lunchDue + 60))) addLunch();
        const dinnerDue = Math.max(1110, lunchEnd + 240);
        if (lunchDone && !dinnerDone && !dinnerVisit && (cursor >= dinnerDue || (cursor >= dinnerDue - 60 && cursor + duration > dinnerDue + 60))) addDinner();
      };
      const move = (to, suffix, checkMeals = true) => {
        if (checkMeals) beforeBlock(makeSegment(location, to, city)?.durationMinutes || 0);
        const from = location, segment = makeSegment(from, to, city);
        if (!segment) {
          warnings.push({ code: 'missing-coordinates', severity: 'warning', message: `${from.name}至${to.name}缺少坐标，未估算该段距离与用时；需在地图补充。` });
          location = to;
          return;
        }
        location = to;
        if (segment.distanceKm < 0.01) return;
        const item = push({ id: `${dayId}-transport-${suffix}-${segments.length}`, kind: 'transport', title: `${{walk:'步行',boat:'跨岛船程待确认',road:'公路出行参考',transit:'公共交通'}[segment.mode]} · ${from.name} → ${to.name}`, description: `${segment.note}${!hotel && (from.id === anchor.id || to.id === anchor.id) ? ' 酒店地址尚未填写，使用城市中心坐标作临时参考。' : ''}`, segment, cost: segment.mode === 'walk' ? { ...emptyCost(currency), sourceType: 'free', note: '按步行不产生车票费用规划；该模型未核验实际通行条件。' } : lineCost(transportLine, currency, 0, true) }, segment.durationMinutes);
        segments.push(item);
      };
      // Fill an otherwise uncommitted arrival afternoon. This never moves a
      // chosen sight, booked activity or restaurant, and shares the same local
      // capacity limit used while evaluating smart-planning candidates.
      const hasChosenRestaurant = restaurants.some(row => row.selection.dayIndex === localDay);
      if (arrivalCompleted && !dayWindow.travelOnly && !ids.length && !hasChosenRestaurant && cursor < 1020) {
        const used = items.filter(item => !item.journey).reduce((sum, item) => sum + item.durationMinutes, 0);
        const available = Math.min(dayWindow.maxLocalActiveMinutes - used, dayWindow.endMinute - cursor);
        if (available >= 30) {
          if (hasNightAfterToday) {
            const hotelReminderIndex = items.findIndex(item => item.id === `${dayId}-hotel`);
            if (hotelReminderIndex >= 0) items.splice(hotelReminderIndex, 1);
            push({ id: `${dayId}-check-in`, kind: 'hotel', routineType: 'check-in', title: hotel ? `放行李 / 办理入住 · ${hotel.experience.name}` : '放行李 / 办理入住', description: `预留30分钟整理行李和安顿。${hotel ? '所选酒店' : '住宿尚未指定，先以住宿区域为参考'}的入住时刻与房态需确认；提前到达可先询问行李寄存，是否收费需向住宿方确认。住宿费用已在整站预算中处理，本项不重复计费。`, ...(hotel ? { experienceId: hotel.experience.id, optionId: hotel.option.id, bookingUrl: hotel.experience.bookingUrl } : {}), cost: { ...emptyCost(currency), budgetLineId: `stop-${stopIndex}-lodging`, note: '只是入住手续与放行李的时间预留，不新增一晚住宿；额外行李寄存费尚未核实或计入。' } }, 30);
          } else push({ id: `${dayId}-arrival-rest`, kind: 'free', routineType: 'arrival-rest', title: '抵达后短暂休息', description: '本次没有后续住宿夜数，先预留30分钟整理随身物品、喝水和休息。未安排入住，也没有把行李寄存视作免费；如需寄存，请另查服务位置与费用。', cost: emptyCost(currency) }, 30);
          const walkBudget = Math.min(available - 30, 1080 - cursor);
          const walk = nearbyArrivalWalk(city, anchor, new Set(assignments.flat()), dateAt(plan.departureDate, elapsed + localDay), walkBudget);
          if (walk) {
            const { place, segment, strollMinutes, walkingMinutes, durationMinutes } = walk;
            push({ id: `${dayId}-arrival-citywalk`, kind: 'free', routineType: 'citywalk', title: `轻松探索 · ${place.name}`, description: `从住宿参考区域步行前往${place.name}，选一小段免费公共区域慢慢走，约${strollMinutes}分钟，往返步行另预留${walkingMinutes}分钟，均已计入本项用时。${hotel ? '' : '酒店未指定，距离暂以城市中心估算。'}这是抵达后的短途建议，不代替该景点完整游览；开放、步道与实际步行路线需核对。`, suggestedPlaces: [{ id: place.id, name: place.name, description: place.description || '', image: place.image || null, lat: place.lat, lng: place.lng, mapsUrl: segment.mapsUrl, sourceUrl: place.price?.sourceUrl || null }], walkingMinutes, strollMinutes, distanceKm: segment.distanceKm * 2, routeEstimated: true, cost: { ...emptyCost(currency), sourceType: 'free', note: '只安排库内零门票地点的公共户外范围；步行与此建议不加收门票、餐费或住宿费。购物、付费展馆及额外消费不含。' } }, durationMinutes);
          }
        }
      }
      if (!earlyIds.length || !breakfastAfterEarly) addBreakfast();
      ids.forEach((id, index) => {
        const attraction = byId.get(id);
        const row = attraction._experienceRow;
        if (attraction.automaticPlanning === false && !attraction.visitRole) warnings.push({ code:'access-needs-confirmation', severity:'warning', message:`${attraction.name}的准入尚未确认；手动加入不代表已经预约，请先核对运营方。` });
        const requestedStart = preferredMinute(row || attraction);
        if (closedOn(attraction, dateAt(plan.departureDate, elapsed + localDay))) warnings.push({ code: 'closed-attraction', severity: 'danger', message: `${attraction.name}在该日期处于已公布的闭馆期${attraction.availability.until ? `（至 ${attraction.availability.until}）` : ''}；不能按正常入场游览安排，请移除或选择开放日期并核对官网。`, sourceUrl: attraction.availability.sourceUrl, attractionId: id });
        if (!earlyIds.includes(id)) addBreakfast();
        // Keep lunch before an explicitly timed afternoon leisure visit instead
        // of postponing it until an intact half-day beach/park visit has ended.
        if (getAttractionActivityType(attraction) === 'leisure' && requestedStart !== null && requestedStart >= 780 && !lunchDone
          && !packageForMeal('lunch') && !restaurants.some(meal => meal.selection.dayIndex === localDay && meal.selection.mealType === 'lunch')) {
          const approach = makeSegment(location, attraction, city)?.durationMinutes || 0;
          const beforeVisit = Math.min(lunchDue, requestedStart - 60 - approach);
          if (beforeVisit >= 690 && Math.max(cursor, beforeVisit) + 60 + approach <= requestedStart) addLunch(Math.max(cursor, beforeVisit));
        }
        if (requestedStart !== null && requestedStart >= lunchDue + 60 && !lunchDone) addLunch(Math.max(cursor, lunchDue));
        if (requestedStart !== null && requestedStart >= 1020 && !dinnerDone && !dinnerVisit && requestedStart - cursor >= 60) {
          const approach = makeSegment(location, attraction, city)?.durationMinutes || 0;
          const latestDinnerStart = requestedStart - 60 - approach;
          // Do not push an ordinary dinner into mid-afternoon to make an
          // evening sight fit. Keep it after the visit if 17:00 is too late.
          if (latestDinnerStart >= 1020) addDinner(Math.max(cursor, Math.min(1110, latestDinnerStart)));
        }
        move(attraction, `${location.id}-${id}`, !earlyIds.includes(id));
        const duration = visitDuration(attraction, stop);
        if (!earlyIds.includes(id)) beforeBlock(duration);
        if (location.id !== attraction.id) move(attraction, `after-meal-${id}`, false);
        const admission = lineMap.get(row ? experienceLineId(stopIndex, row.selection) : `stop-${stopIndex}-attraction-${id}`);
        const durationRange = getVisitDurationRange(attraction);
        if (requestedStart !== null && cursor > requestedStart) warnings.push({ code: row ? 'experience-time-conflict' : 'attraction-time-conflict', severity: 'warning', message: `${attraction.name}建议 ${(row || attraction).preferredStartTime} 开始，但此前安排无法按时到达；请核对可游览时段并调整。`, ...(row ? {experienceId:row.experience.id} : {attractionId:id}) });
        if (!row && requestedStart !== null && cursor < requestedStart) push({id:`${dayId}-wait-${id}`,kind:'free',title:'自由休息 · 等待建议游览时段',description:`${formatItineraryTime(cursor)}–${formatItineraryTime(requestedStart)} 可自由活动；${attraction.name}建议 ${attraction.preferredStartTime} 后游览，实际营业状态尚未核验。这段留白不计入活动时长。`,cost:emptyCost(currency)});
        if (attraction === dinnerVisit && !dinnerDone) {
          dinnerDone = true;
          push({ id: `${dayId}-dinner`, kind: 'meal', mealType: 'dinner', timing: 'unscheduled', title: `晚餐 · ${attraction.name}小吃`, description: `用餐时间包含在接下来的 ${duration} 分钟游览内，不另占一小时。餐费仍从本城市日常餐饮预算分摊一次，并非门票包含餐食；具体摊位、份量与价格请现场核对。`, withinAttractionId: id, includedInVisit: true, features: ['游览中用餐', '整团预算分摊'], cost: lineCost(foodLine, currency, mealShares[2], true) }, 0, requestedStart ?? cursor);
        } else if (!row && attraction.mealWithinVisit === 'dinner' && dinnerRestaurant) {
          warnings.push({ code: 'visit-meal-restaurant-selected', severity: 'info', attractionId: id, experienceId: dinnerRestaurant.experience.id, message: `${attraction.name}的建议游览时长可包含小吃晚餐；你已另选 ${dinnerRestaurant.experience.name}，保留该餐厅的用餐时间与费用，夜市不再额外分配一份晚餐预算。请自行取舍小吃或调整游览时长。` });
        }
        push({ id: `${dayId}-attraction-${id}`, kind: row ? 'experience' : 'attraction', title: attraction.name, description: `${attraction.description || ''} ${stop.visitDurations?.[id] !== undefined ? '按你的选择安排' : '建议停留'} ${duration / 60} 小时；参考体验区间 ${durationRange.min}–${durationRange.max} 分钟。此时间未校验开放日、预约时段或排队。${row ? ` ${row.option.name}；${requestedStart !== null ? `建议 ${row.preferredStartTime} 开始，时段未确认。` : '具体场次待预订确认。'}${row.includesTransfers ? ' 套餐已含酒店接送，所列总时长含接送，不另加往返场地交通。' : ''}` : ''}`, ...(row ? { experienceId: row.experience.id, optionId: row.option.id, bookingUrl: row.experience.bookingUrl, requestedStartTime: row.preferredStartTime, timeUnconfirmed: true, includesTransfers: row.includesTransfers, includedMeals: row.includedMeals } : { attractionId: id }), image: attraction.image || city.image, features: attraction.features?.length ? attraction.features : [attraction.nameEn, ...(city.tags || []).slice(0, 2)].filter(Boolean), durationRange, durationCustomized: stop.visitDurations?.[id] !== undefined, price: row?.option || attraction.price, source: { name: admission?.sourceName || attraction.price?.sourceName, url: admission?.sourceUrl || attraction.price?.sourceUrl, checkedAt: admission?.checkedAt || attraction.price?.checkedAt, type: admission?.sourceType || attraction.price?.type }, cost: lineCost(admission, currency) }, duration, requestedStart ?? cursor);
        const activityType = getAttractionActivityType(attraction);
        if (activityType) items.at(-1).activityType = activityType;
        if (attraction.visitRole) items.at(-1).visitRole = getAttractionVisitRole(attraction);
        location = attraction;
      });
      addBreakfast();
      if (!ids.length && !dayWindow.travelOnly && !constrained) {
        beforeBlock(120);
        push({ id: `${dayId}-free`, kind: 'free', title: plan.mode === 'stay' ? '在地生活与街区探索' : `${city.name}自由漫步`, description: '预留两小时自由探索；这不是额外选中的收费景点，可从景点清单安排具体目的地。', image: city.image, features: city.tags || [], cost: emptyCost(currency) }, 120);
      }
      const pendingRestaurant = restaurants.some(row => row.selection.dayIndex === localDay && ((row.selection.mealType === 'lunch' && !lunchDone) || (row.selection.mealType === 'dinner' && !dinnerDone)));
      // Unspecified meals can be near the lodging reference. Return before a
      // generic evening meal instead of inventing a mandatory late journey from
      // the last sight. A concrete restaurant still gets its real route.
      if (!pendingRestaurant && location.id !== anchor.id) move(anchor, `${location.id}-return-before-meals`, false);
      if (!lunchDone) addLunch(Math.max(cursor, lunchDue));
      if (!dinnerDone) {
        if (!restaurants.some(row => row.selection.dayIndex === localDay && row.selection.mealType === 'dinner') && location.id !== anchor.id) move(anchor, `${location.id}-return-before-dinner`, false);
        addDinner(Math.max(cursor, 1110, lunchEnd + 240));
      }
      if (!foodWeights.some(weight => weight > 0) && (foodLine?.amount || 0) > 0) push({ id: `${dayId}-food-allowance`, kind: 'meal', timing: 'unscheduled', title: '额外餐饮费用记录', description: '全部餐次已被餐厅或套餐覆盖，保留你手动填写的餐饮总额作为额外预留；如不需要请清除此行覆盖金额。', cost: lineCost(foodLine, currency, allocateMoney(foodLine.amount, assignments.map(() => 1))[localDay], true) });
      if (location.id !== anchor.id) move(anchor, `${location.id}-return`, false);
      const paidSegments = segments.filter(item => item.segment.mode !== 'walk');
      if (paidSegments.length) {
        const shares = allocateMoney(transportShares[localDay], paidSegments.map(item => item.durationMinutes));
        paidSegments.forEach((item, index) => { item.cost = lineCost(transportLine, currency, shares[index], true); });
      } else push({ id: `${dayId}-transport-allowance`, kind: 'transport', timing: 'unscheduled', title: '其他市内交通预留', description: '已规划的景点路线为步行或自由活动；此金额保留给公交、地铁等未指定行程。它是日预算分摊，不是步行收费。', cost: lineCost(transportLine, currency, transportShares[localDay], true), allowance: true });
      const localEndMinute = cursor;
      if (dayWindow.outbound) addJourney(dayWindow.outbound, 'outbound');
      else if (last && (plan.returnTrip !== false || plan.mode === 'stay')) push({ id: `${dayId}-departure`, kind: 'departure', timing: 'unscheduled', title: plan.mode === 'stay' ? '整理行李 · 次日退房' : returning ? '返程时刻待核对' : '结束本地旅程', description: plan.mode === 'stay' ? `${dateAt(plan.departureDate, elapsed + stop.days)} 退房${plan.returnTrip !== false ? '并按实际交通时刻返程' : '，后续交通自行安排'}；上面是最后一个完整住宿日。` : returning ? '这里是行程收尾提醒，不是已确认的航班/车次出发时间；请将返程前的景点安排与票面时刻核对。' : '按自己的节奏结束今天的探索。', timeUnconfirmed: true, cost: emptyCost(currency) });

      // Untimed in-transit meal budgets belong beside the journey, before the
      // local arrival marker (or before an outbound journey), not at the later
      // clock position where meal-budget reconciliation happened to run.
      for (const direction of ['inbound', 'outbound']) {
        const relatedId = `${dayId}-${direction}-journey`;
        const reminders = items.filter(item => item.timing === 'unscheduled' && item.relatedJourneyId === relatedId);
        const journey = items.find(item => item.id === relatedId);
        if (!reminders.length || !journey) continue;
        for (const reminder of reminders) items.splice(items.indexOf(reminder), 1);
        let insertAt = direction === 'inbound' ? items.findIndex(item => item.routineType === 'arrival-ready') : items.indexOf(journey);
        if (insertAt < 0) insertAt = items.indexOf(journey) + 1;
        const anchorMinute = direction === 'inbound' ? journey.endMinute : journey.startMinute;
        reminders.forEach(reminder => { reminder.startMinute = anchorMinute; reminder.endMinute = anchorMinute; });
        items.splice(insertAt, 0, ...reminders);
      }

      const visitMinutes = items.filter(i => ['attraction', 'experience'].includes(i.kind)).reduce((s, i) => s + i.durationMinutes, 0);
      const localTravelMinutes = segments.reduce((s, i) => s + i.durationMinutes, 0) + items.reduce((sum, item) => sum + (item.routineType === 'citywalk' ? item.walkingMinutes : 0), 0);
      const localActiveMinutes = items.filter(i => !i.journey).reduce((s, i) => s + i.durationMinutes, 0);
      const intercityMinutes = dayWindow.reservedMinutes || 0;
      const travelMinutes = localTravelMinutes + intercityMinutes;
      const activeMinutes = localActiveMinutes + intercityMinutes;
      const timedLocalItems = items.filter(i => !i.journey && i.durationMinutes > 0);
      const journeyConflict = constrained && (localActiveMinutes > dayWindow.maxLocalActiveMinutes || timedLocalItems.some(i => i.startMinute < dayWindow.startMinute || i.endMinute > dayWindow.endMinute));
      if (journeyConflict) warnings.push({ code: 'journey-window-conflict', severity: 'danger', message: `当天跨城交通后可在当地活动的窗口为 ${formatItineraryTime(dayWindow.startMinute)}–${formatItineraryTime(dayWindow.endMinute)}，当前手动选择与交通预留冲突；景点已保留，请智能重排、移至其他天或按真实票面信息修改交通设置。` });
      if (dayWindow.travelOnly) warnings.push({ code: 'journey-travel-only', severity: 'info', message: '这一天主要预留给跨城交通；自动规划不安排景点，日常餐费继续作为途中开销预算保留。' });
      if ((dayWindow.inbound && dayWindow.outbound && dayWindow.inbound.endMinute > dayWindow.outbound.startMinute) || /未能分配|不足以容纳|抵达日在本站/.test(dayWindow.note || '')) warnings.push({ code: 'journey-capacity-conflict', severity: 'danger', message: `现有天数不足或入城与返程的交通预留重叠，尚不能形成可执行的交通安排。${dayWindow.note || ''} 请增加天数，或依据已核实的票面信息填写当地可活动窗口。` });
      const distance = segments.reduce((s, i) => s + i.segment.distanceKm, 0) + items.reduce((sum, item) => sum + (item.routineType === 'citywalk' ? item.distanceKm : 0), 0);
      if (activeMinutes > 480 && localActiveMinutes > 0) warnings.push({ code: 'busy-day', severity: activeMinutes > 660 ? 'danger' : 'warning', message: `今天安排约 ${Math.round(activeMinutes / 60 * 10) / 10} 小时（含游览、城际及市内交通与用餐），超过 8 小时；建议移动部分景点到其他天。` });
      if (cursor > 1230) warnings.push({ code: 'late-finish', severity: 'warning', message: `预计结束于 ${formatItineraryTime(cursor)}，晚于 20:30；可提前开始或减少景点。` });
      if (arriving && localActiveMinutes > 360) warnings.push({ code: 'busy-arrival', severity: 'warning', message: '抵达当天的本地安排超过 6 小时，且另有城际交通占时；请核对抵达窗口并删减或移走景点。' });
      if (returning && localActiveMinutes > 300) warnings.push({ code: 'busy-return', severity: 'warning', message: '返程当天的本地安排超过 5 小时；请核对已预留的返程窗口与实际票面时刻是否一致。' });
      const nightAttractions = items.filter(i => i.kind === 'attraction' && i.endMinute > 1320);
      if (nightAttractions.length) warnings.push({ code: 'late-attraction', severity: 'danger', message: `${nightAttractions.map(i => i.title).join('、')}被安排到 22:00 以后，可能已闭馆；请重新分配景点并查验官网。` });
      if (cursor >= 1440) warnings.push({ code: 'after-midnight', severity: 'danger', message: '行程已经跨到次日（时间标为 +1）；它会占用下一天，建议拆分，不应直接照此出行。' });
      const suggestedOrder = optimizeDayRoute(ordinaryIds, city);
      const routeDistance = pathDistance(ordinaryIds, byId), optimizedDistance = pathDistance(suggestedOrder, byId);
      if (routeDistance !== null && optimizedDistance !== null && optimizedDistance > 0 && routeDistance > optimizedDistance * 1.3 && (routeDistance - optimizedDistance) * 1.35 > 3) warnings.push({ code: 'detour', severity: 'warning', message: `当前景点顺序按地理模型约多绕 ${round((routeDistance - optimizedDistance) * 1.35)} km；可查看建议顺序后自行应用。模型未考虑开放时间、真实线路或预约。`, suggestedOrder });
      if (ids.length) warnings.push({ code: 'verify-opening', severity: 'info', message: '游览时长来自景点建议；开闭馆、预约、排队和路线需在出行前核对。交通距离含模型绕行系数。' });
      const attractionTotal = budget ? round(items.filter(i => i.kind === 'attraction').reduce((s, i) => s + (i.cost.amount || 0), 0)) : null;
      const foodTotal = budget ? round(items.filter(i => i.kind === 'meal').reduce((s, i) => s + (i.cost.amount || 0), 0)) : null;
      const experienceTotal = budget ? round(items.filter(i => i.kind === 'experience').reduce((s, i) => s + (i.cost.amount || 0), 0)) : null;
      const unscheduled = selectedExperiences.filter(row => row.selection.scheduleStatus === 'needs-more-days' && row.selection.dayIndex === localDay);
      for (const row of unscheduled) warnings.push({ code: 'experience-needs-days', severity: 'danger', message: `${row.experience.name}已选择并计入预算，但无法装入现有可用天数，尚未生成可执行时段；请增加天数或调整选择。`, experienceId: row.experience.id });
      const intercityTotal = budget ? round(items.filter(i => i.journey && i.kind !== 'journey-transfer').reduce((sum, item) => sum + (item.cost.amount || 0), 0)) : null;
      const transferTotal = budget ? round(items.filter(i => i.kind === 'journey-transfer').reduce((sum, item) => sum + (item.cost.amount || 0), 0)) : null;
      const missingCategories = [...new Set(items.filter(item => item.cost?.missingPrice).map(item => lineMap.get(item.cost.budgetLineId)?.category).filter(Boolean))];
      const costs = { missingPrice: missingCategories.length > 0, missingCategories, food: foodTotal, transport: transportShares[localDay], attractions: attractionTotal, experiences: experienceTotal, intercity: intercityTotal, transfer: transferTotal, unscheduledExperiences: budget ? round(unscheduled.reduce((sum, row) => sum + (lineMap.get(experienceLineId(stopIndex, row.selection))?.amount || 0), 0)) : null, total: budget ? round(foodTotal + transportShares[localDay] + attractionTotal + experienceTotal + intercityTotal + transferTotal) : null, currency, includedInTripTotal: true, note: '当天已安排的餐饮、市内交通、门票、体验及本次列出的城际交通和接驳均已包含在整团总预算，不重复加收；住宿与未安排体验见费用明细。跨多日交通只在首次列出时计费，旅居模式次日返程另见总预算。' };
      result.push({ day: elapsed + localDay + 1, date: dateAt(plan.departureDate, elapsed + localDay), cityId: city.id, stopIndex, localDay, title: `${city.name} · ${ids.length ? ids.map(id => byId.get(id).name).join(' / ') : dayWindow.travelOnly ? '跨城交通日' : '慢慢探索'}`, items, startTime: items[0]?.time || formatItineraryTime(localStart), endTime: formatItineraryTime(cursor), activeMinutes, localActiveMinutes, visitMinutes, travelMinutes, localTravelMinutes, intercityMinutes, localStartMinute: localStart, localEndMinute, dayWindow, distanceKm: round(distance), attractionIds: [...ordinaryIds], experienceIds: activities.map(row => row.experience.id), warnings, costs, customized: Array.isArray(stop.dayPlans), timeBasis: 'destination-local-planning', routeBasis: hotel ? 'geographic-model-with-selected-hotel' : 'geographic-model-with-city-center-reference' });
    });
    elapsed += stop.days;
  });
  return result;
}

/** Explicit smart selection. Manual buildDayAssignments never removes a selected attraction. */
export function suggestStopPlan(stop, city, { candidateIds, includeOptional = false, dayWindows = null, departureDate = new Date().toISOString().slice(0, 10) } = {}) {
  const days = Number(stop.days);
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('停留天数应为 1–365 的整数');
  parseStartTime(stop.startTime);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate) || dateAt(departureDate, 0) !== departureDate) throw new Error('智能规划开始日期无效');
  const byId = attractionMap(city), visitDurations = validatedDurationOverrides(stop, city);
  const destinationProfile = getDestinationPlanningProfile(city);
  const pool = candidateIds ?? (Array.isArray(stop.attractionIds) || Array.isArray(stop.deferredAttractionIds) ? [...(stop.attractionIds || []), ...(stop.deferredAttractionIds || [])] : city.attractions.map(a => a.id));
  if (!Array.isArray(pool)) throw new Error('候选景点列表无效');
  const candidates = [...new Set(pool.filter(id => byId.has(id)))];
  // Only an explicit opt-in with a concrete candidate list marks new requests.
  // Persist requests so later smart replanning does not silently drop them.
  const requestedIds = new Set([
    ...(Array.isArray(stop.requestedAttractionIds) ? stop.requestedAttractionIds : []),
    ...(includeOptional && Array.isArray(candidateIds) ? candidateIds : []),
  ].filter(id => byId.has(id) && candidates.includes(id)));
  const supporting = id => isSupportingVisit(byId.get(id), visitDuration(byId.get(id), stop));
  const mainCount = ids => ids.filter(id => !supporting(id)).length;
  const isFree = id => byId.get(id).price?.type !== 'missing' && byId.get(id).price?.low === 0 && byId.get(id).price?.high === 0;
  const originalIndex = new Map(city.attractions.map((a, index) => [a.id, index]));
  candidates.sort((a, b) => {
    const requestedOrder = Number(requestedIds.has(b)) - Number(requestedIds.has(a));
    if (requestedOrder) return requestedOrder;
    // Reserve a complete day for a deliberately selected long visit before
    // distributing smaller city sights across every available day.
    if (requestedIds.has(a) && requestedIds.has(b)) {
      const fullDayOrder = Number(visitDuration(byId.get(b), stop) >= 360) - Number(visitDuration(byId.get(a), stop) >= 360);
      if (fullDayOrder) return fullDayOrder;
    }
    const supportingOrder = Number(supporting(a)) - Number(supporting(b));
    if (supportingOrder) return supportingOrder;
    if (supporting(a) && isFree(a) !== isFree(b)) return Number(isFree(b)) - Number(isFree(a));
    const priorityA = destinationAttractionPriority(byId.get(a), destinationProfile);
    const priorityB = destinationAttractionPriority(byId.get(b), destinationProfile);
    return priorityB - priorityA || originalIndex.get(a) - originalIndex.get(b);
  });
  const dayPlans = Array.from({ length: days }, () => []), deferred = [];
  const requestedRows = resolveExperienceSelections(stop, city, { clampDays: true });
  const selectedRows = requestedRows.filter(row => row.experience.kind !== 'experience');
  const smartWarnings = [];
  let unscheduledCount = 0;
  // At most one nonempty day per candidate can be useful; a long stay should not
  // evaluate hundreds of identical empty days for every attraction.
  const activeDayLimit = Math.min(days, Math.max(1, candidates.length + new Set(requestedRows.filter(row => row.experience.kind !== 'hotel').map(row => row.selection.dayIndex)).size + requestedRows.filter(row => row.experience.kind === 'experience').length));
  const cache = new Map();
  const windowFor = day => dayWindows?.[day] || { startMinute: 0, endMinute: 1440, maxLocalActiveMinutes: 480, reservedMinutes: 0 };
  const windowKey = day => { const w = windowFor(day); return `${w.startMinute}:${w.endMinute}:${w.maxLocalActiveMinutes}:${Boolean(w.travelOnly)}`; };
  const eligibleDays = Array.from({ length: days }, (_, day) => day).filter(day => !windowFor(day).travelOnly && windowFor(day).maxLocalActiveMinutes > 0);
  const representativeDays = new Map();
  for (const day of eligibleDays) if (!representativeDays.has(windowKey(day))) representativeDays.set(windowKey(day), day);
  const availableCandidateDays = [...new Set([...eligibleDays.slice(0, activeDayLimit), ...representativeDays.values()])];
  const evaluate = (ids, day = 0, extra = []) => {
    const selections = [...selectedRows.filter(row => row.experience.kind === 'hotel' || row.selection.dayIndex === day), ...extra].map(row => ({ ...row.selection, dayIndex: 0 }));
    const key = dateAt(departureDate, day) + '::' + windowKey(day) + '::' + ids.join('|') + '::' + JSON.stringify(selections);
    if (!cache.has(key)) {
      const p = { originId: city.id, stops: [{ ...stop, cityId: city.id, days: 1, attractionIds: ids, dayPlans: [ids], visitDurations, experienceSelections: selections }], departureDate: dateAt(departureDate, day), currency: city.currency, travelers: 1, rooms: 1, mode: 'travel', returnTrip: false };
      cache.set(key, generateDetailedItinerary(p, [city], null, [[windowFor(day)]])[0]);
    }
    return cache.get(key);
  };
  // Measure real occupied afternoon time, never the generic untimed allowance.
  // The timeline evaluator remains the source of all route/meal/time constraints.
  const afternoonMinutes = detail => detail.items.reduce((sum, item) => sum + (
    !item.journey && item.durationMinutes > 0 && item.kind !== 'free'
      ? Math.max(0, Math.min(1050, item.endMinute) - Math.max(780, item.startMinute)) : 0
  ), 0);
  // Explicit purchased/desired activities have priority over ordinary sights.
  // A deliberate full-day package may exceed eight hours, but is never silently
  // expanded into an impossible multi-day timeline inside one calendar day.
  const activityRows = requestedRows.filter(row => row.experience.kind === 'experience').sort((a, b) => b.durationMinutes - a.durationMinutes);
  for (const row of activityRows) {
    const preferredDay = row.selection.dayIndex;
    const consideredDays = new Set([preferredDay, ...availableCandidateDays]);
    let best = null;
    for (const day of consideredDays) {
      const window = windowFor(day);
      if (window.travelOnly || window.maxLocalActiveMinutes <= 0) continue;
      const trialRow = { ...row, selection: { ...row.selection, dayIndex: day } };
      delete trialRow.selection.scheduleStatus;
      // The same experience cannot be selected twice for the same day.
      if (selectedRows.some(other => other.experience.id === row.experience.id && other.selection.dayIndex === day)) continue;
      const detail = evaluate([], day, [trialRow]);
      const constrainedDay = Boolean(window.inbound || window.outbound || window.reservedMinutes || window.startMinute > 0 || window.endMinute < 1440);
      if (detail.localActiveMinutes > (constrainedDay ? window.maxLocalActiveMinutes : 720) || detail.localEndMinute > window.endMinute || detail.items.at(-1).endMinute > 1440 || detail.warnings.some(w => ['experience-time-conflict', 'closed-attraction', 'journey-window-conflict'].includes(w.code))) continue;
      const score = (day === preferredDay ? -100000 : 0) + detail.activeMinutes * 10 + day;
      if (!best || score < best.score) best = { row: trialRow, score };
    }
    if (best) {
      selectedRows.push(best.row);
      if (best.row.selection.dayIndex !== preferredDay) smartWarnings.push({ code: 'experience-moved', severity: 'info', experienceId: row.experience.id, message: `${row.experience.name}已移至第 ${best.row.selection.dayIndex + 1} 天，避免同日安排过满。` });
    } else {
      selectedRows.push({ ...row, selection: { ...row.selection, scheduleStatus: 'needs-more-days' } });
      unscheduledCount++;
      smartWarnings.push({ code: 'experience-needs-days', severity: 'warning', experienceId: row.experience.id, message: `${row.experience.name}保留在选择及预算中；现有天数不能排入，请增加天数或调整套餐/时段。` });
    }
  }
  for (const id of candidates) {
    const requested = requestedIds.has(id), supplement = supporting(id);
    if (byId.get(id).automaticPlanning === false && !requested) { deferred.push(id); continue; }
    if (!validCoordinate(city) || !validCoordinate(byId.get(id))) { deferred.push(id); continue; }
    let best = null;
    const seen = new Set();
    const candidateDays = new Set(availableCandidateDays);
    dayPlans.forEach((ids, day) => { if (ids.length) candidateDays.add(day); });
    // A long stay may extend beyond a known closure. Consider the reopening day
    // without evaluating every identical empty day before it.
    const until = byId.get(id).availability?.until;
    if (until && /^\d{4}-\d{2}-\d{2}$/.test(until)) {
      const reopeningDay = Math.round((Date.parse(until) - Date.parse(departureDate)) / 86400000) + 1;
      if (reopeningDay >= 0 && reopeningDay < days) candidateDays.add(reopeningDay);
    }
    for (const day of [...candidateDays].sort((a, b) => a - b)) {
      const window = windowFor(day);
      if (window.travelOnly || window.maxLocalActiveMinutes <= 0) continue;
      const explicitActivities = selectedRows.filter(row => row.experience.kind === 'experience' && row.selection.dayIndex === day && row.selection.scheduleStatus !== 'needs-more-days').length;
      const currentMainCount = mainCount(dayPlans[day]) + explicitActivities;
      if (!requested && !supplement && destinationProfile.maxAutomaticPlacesPerDay !== null && currentMainCount >= destinationProfile.maxAutomaticPlacesPerDay) continue;
      if (closedOn(byId.get(id), dateAt(departureDate, day))) continue;
      const currentKey = windowKey(day) + '::' + dayPlans[day].join('|') + '::' + JSON.stringify(selectedRows.filter(row => row.selection.dayIndex === day || row.experience.kind === 'hotel').map(row => row.selection));
      if (seen.has(currentKey)) continue;
      seen.add(currentKey);
      for (let position = 0; position <= dayPlans[day].length; position++) {
        const trial = [...dayPlans[day].slice(0, position), id, ...dayPlans[day].slice(position)];
        const detail = evaluate(trial, day);
        const lateSelected = selectedRows.some(row => row.selection.dayIndex === day && row.preferredStartTime && row.preferredStartTime >= '17:00');
        const fullDayRequested = requested && visitDuration(byId.get(id), stop) >= 360 && trial.length === 1 && explicitActivities === 0;
        const constrainedDay = Boolean(window.inbound || window.outbound || window.reservedMinutes || window.startMinute > 0 || window.endMinute < 1440);
        const capacity = fullDayRequested
          ? (constrainedDay ? Math.min(720, window.maxLocalActiveMinutes) : 720)
          : requested ? Math.min(480, window.maxLocalActiveMinutes) : automaticDayCapacity(destinationProfile, mainCount(trial) + explicitActivities, window);
        if (detail.localActiveMinutes > capacity || detail.localEndMinute > Math.min(window.endMinute, lateSelected || fullDayRequested ? 1440 : 1230) || detail.warnings.some(w => ['missing-coordinates', 'experience-time-conflict', 'attraction-time-conflict', 'journey-window-conflict'].includes(w.code))) continue;
        // Prefer a balanced day, then lower transport time, then earlier day for stable output.
        // Short additions prefer an existing nearby route, then useful afternoon
        // coverage. They never bypass the same full timeline capacity check.
        const previous = supplement ? evaluate(dayPlans[day], day) : null;
        const extraTravel = previous ? Math.max(0, detail.localTravelMinutes - previous.localTravelMinutes) : 0;
        const afternoonGain = previous ? Math.max(0, afternoonMinutes(detail) - afternoonMinutes(previous)) : 0;
        const score = supplement
          ? (currentMainCount ? 0 : 10000000) + extraTravel * 10000 + Math.max(0, 120 - afternoonGain) * 100 + detail.localActiveMinutes * 10 + day
          : detail.localActiveMinutes * 10000 + detail.localTravelMinutes * 10 + day;
        if (!best || score < best.score) best = { day, trial, score };
      }
    }
    if (best) dayPlans[best.day] = best.trial;
    else deferred.push(id);
  }
  const selectedActivityTypes = { leisure: 0, culture: 0, other: 0 };
  dayPlans.flat().forEach(id => { selectedActivityTypes[getAttractionActivityType(byId.get(id)) || 'other']++; });
  const deferredRequests = deferred.filter(id => requestedIds.has(id));
  if (deferredRequests.length) smartWarnings.push({ code: 'requested-attractions-deferred', severity: 'warning', attractionIds: deferredRequests, message: `${deferredRequests.map(id => byId.get(id).name).join('、')}是你明确选择的地点，但现有时间、交通窗口、已知开放限制或位置资料不足以安排；已保留在候选中，请增加天数、调整时长或手动分配。` });
  return { ...stop, attractionIds: dayPlans.flat(), dayPlans, deferredAttractionIds: deferred, requestedAttractionIds: [...requestedIds], visitDurations, experienceSelections: selectedRows.map(row => row.selection), smartPlan: { selectedCount: dayPlans.flat().length, selectedMainActivityCount: mainCount(dayPlans.flat()), selectedSupportingVisitCount: dayPlans.flat().filter(supporting).length, deferredCount: deferred.length, deferredRequestedCount: deferredRequests.length, unscheduledExperienceCount: unscheduledCount, suggestedAdditionalDays: unscheduledCount, warnings: smartWarnings, maxActiveMinutes: 480, maxExplicitExperienceMinutes: 720, latestFinish: '20:30', destinationProfile: destinationProfile.id, destinationProfileSource: destinationProfile.source, destinationProfileLabel: destinationProfile.label, maxAutomaticPlacesPerDay: destinationProfile.maxAutomaticPlacesPerDay, maxAutomaticMainActivitiesPerDay: destinationProfile.maxAutomaticPlacesPerDay, targetActiveMinutes: destinationProfile.targetActiveMinutes, selectedActivityTypes, note: `先扣除跨城交通预留或你填写的当地可活动窗口，再优先安排明确选择的体验与地点，结合景点优先级、完整推荐时长和地理模型挑选。${destinationProfile.note} 短街区优先沿已有路线补充，并考虑午后可用时段；不自动缩短半日休闲项目或加入付费供应商。没有跨城占时的已选整日体验仍可至12小时。未入选地点保留候选，无法安排的体验保留预算并提示加天；实际营业和票面时刻仍须核对。` } };
}
