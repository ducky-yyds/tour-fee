/** Pure budget engine shared by the browser and API. Every amount is a total for the party. */
import { generateDetailedItinerary } from './itinerary.mjs';
import { buildDayAssignments } from './itinerary.mjs';
import { cityCostIsMissing } from './airport-catalog.mjs';
import { resolveJourneyMode, islandSurfaceBudget, getJourneyModePreference } from './journey-mode.mjs';
import { resolveExperienceSelections, experienceLineId, experiencePriceValues, experiencePriceNote, coveredMealSlots, MEAL_WEIGHTS, validateExperienceParty } from './experiences.mjs';
export { resolveExperienceSelections, experienceSelectionKey, experienceLineId, applyExperienceSelection, removeExperienceSelection } from './experiences.mjs';
export { buildDayAssignments, optimizeDayRoute, getVisitDurationRange, suggestStopPlan, mergeCustomAttractions } from './itinerary.mjs';
export const CATEGORY_LABELS = { intercity: '往返与城际', lodging: '住宿', food: '餐饮', transport: '市内交通', attractions: '景点门票', experiences: '特色体验', transfer: '车站与机场接驳', utilities: '水电网络', misc: '日常杂费', insurance: '旅行保险', connectivity: '通信上网', visa: '签证与入境', reserve: '机动预算' };
const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const finite = (value, name, min = 0, max = 1e9) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${name}超出有效范围`);
  return n;
};
function integer(value, name, min, max) {
  const n = finite(value, name, min, max);
  if (!Number.isInteger(n)) throw new Error(`${name}必须为整数`);
  return n;
}
export function convertCurrency(amount, from, to, fx) {
  const rates = fx?.rates || fx;
  if (from === to) return finite(amount, '金额');
  if (!rates || !(rates[from] > 0) || !(rates[to] > 0)) throw new Error(`缺少 ${from} / ${to} 汇率`);
  return finite(amount, '金额') / rates[from] * rates[to];
}
export function addDays(date, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('出发日期格式应为 YYYY-MM-DD');
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date) throw new Error('出发日期无效');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function distanceKm(a, b) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h))));
}
export function bookingLinks({ origin, destination, departureDate, returnDate, travelers = 1, rooms = 1 } = {}) {
  const name = destination?.nameEn || destination?.name || '';
  const from = origin?.nameEn || origin?.name || '';
  const hotel = new URL('https://www.booking.com/searchresults.html');
  hotel.searchParams.set('ss', name);
  hotel.searchParams.set('group_adults', travelers);
  hotel.searchParams.set('no_rooms', rooms);
  hotel.searchParams.set('group_children', '0');
  if (departureDate) hotel.searchParams.set('checkin', departureDate);
  if (returnDate) hotel.searchParams.set('checkout', returnDate);
  const flights = `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${origin?.iata || from} to ${destination?.iata || name}${departureDate ? ` on ${departureDate}` : ''}${returnDate ? ` returning ${returnDate}` : ' one way'} ${travelers} adults`)}`;
  return { flights, hotels: hotel.href, maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`, route: `https://www.rome2rio.com/s/${encodeURIComponent(from)}/${encodeURIComponent(name)}` };
}
function validatePlan(plan, cities) {
  if (!plan || !Array.isArray(cities)) throw new Error('缺少行程或城市数据');
  const byId = new Map(cities.map(c => [c.id, c]));
  if (!byId.has(plan.originId)) throw new Error('请选择有效出发城市');
  if (!Array.isArray(plan.stops) || !plan.stops.length || plan.stops.length > 12) throw new Error('请选择 1–12 个目的地');
  const stops = plan.stops.map((stop, index) => {
    if (!byId.has(stop.cityId)) throw new Error(`第 ${index + 1} 站城市无效`);
    const city = byId.get(stop.cityId);
    const days = integer(stop.days, '停留天数', 1, 365);
    if (stop.attractionIds !== undefined && !Array.isArray(stop.attractionIds)) throw new Error('景点选择无效');
    const attractionIds = [...new Set(stop.attractionIds || [])];
    for (const id of attractionIds) if (!city.attractions?.some(a => a.id === id)) throw new Error(`${city.name}的景点 ${id} 无效`);
    if (stop.dailyPreferences !== undefined) {
      if (!stop.dailyPreferences || typeof stop.dailyPreferences !== 'object' || Array.isArray(stop.dailyPreferences)) throw new Error('每日费用偏好格式无效');
      for (const category of ['lodging', 'food', 'transport', 'misc', 'utilities']) if (stop.dailyPreferences[category] !== undefined) finite(stop.dailyPreferences[category], '每日费用偏好', 0, 1e7);
    }
    if (stop.visitDurations !== undefined) {
      if (!stop.visitDurations || typeof stop.visitDurations !== 'object' || Array.isArray(stop.visitDurations)) throw new Error('自定义游览时长格式无效');
      for (const value of Object.values(stop.visitDurations)) integer(value, '自定义游览时长（分钟）', 15, 720);
    }
    const experiences = resolveExperienceSelections({ ...stop, days }, city);
    return { ...stop, days, attractionIds, city, experiences };
  });
  const days = stops.reduce((sum, s) => sum + s.days, 0);
  if (days > 730) throw new Error('行程最多支持 730 天');
  const travelers = integer(plan.travelers ?? 1, '旅行人数', 1, 20);
  stops.forEach(stop => stop.experiences.forEach(row => validateExperienceParty(row, travelers)));
  const rooms = integer(plan.rooms ?? 1, '房间数', 1, travelers);
  const tier = integer(plan.tier ?? 1, '预算档位', 0, 2);
  const reservePercent = finite(plan.reservePercent ?? 10, '机动预算比例', 0, 100);
  if (plan.mode && !['travel', 'stay'].includes(plan.mode)) throw new Error('行程模式无效');
  addDays(plan.departureDate, 0);
  return { byId, stops, days, travelers, rooms, tier, reservePercent };
}
function values3(values, label) {
  if (!Array.isArray(values) || values.length !== 3) throw new Error(`${label}预算数据缺失`);
  const result = values.map(v => finite(v, label));
  if (result[0] > result[1] || result[1] > result[2]) throw new Error(`${label}预算区间无效`);
  return result;
}
export function calculatePlan(plan, cities, rates) {
  const { byId, stops, days, travelers, rooms, tier, reservePercent } = validatePlan(plan, cities);
  const currency = plan.currency || 'CNY';
  // Validate currency even for an all-free itinerary.
  convertCurrency(1, 'CNY', currency, rates);
  const stay = plan.mode === 'stay';
  const nights = stay ? days : Math.max(days - 1, 0);
  const lines = [], legs = [], warnings = [];
  let confirmedCount = 0;
  const add = (data) => {
    const nativeCurrency = data.nativeCurrency || 'CNY';
    const native = values3(data.values, data.label);
    const quantity = finite(data.quantity ?? 1, '计费数量');
    const converted = native.map(v => convertCurrency(v, nativeCurrency, currency, rates));
    let low = round(converted[0] * quantity), high = round(converted[2] * quantity), amount = round(converted[tier] * quantity);
    const override = plan.overrides?.[data.id];
    let confirmed = false;
    if (override !== undefined) {
      amount = round(finite(override.amount, '自定义费用'));
      low = amount; high = amount;
      confirmed = override.confirmed === true;
      if (confirmed) confirmedCount++;
    }
    const { values: ignored, ...rest } = data;
    const missingPrice = Boolean(data.missingPrice) && quantity > 0 && override === undefined;
    const referenceMissingPrice = Boolean(data.missingPrice) && quantity > 0;
    const costGroup = data.category === 'reserve' ? 'reserve' : ['intercity', 'attractions', 'experiences', 'transfer', 'visa'].includes(data.category) ? 'fixed' : 'daily';
    const line = { ...rest, costGroup, quantity, unit: data.unit || '次', unitLow: round(converted[0]), unitHigh: round(converted[2]), unitAmount: round(converted[tier]), amount, low, high, currency, nativeCurrency, nativeUnitLow: native[0], nativeUnitHigh: native[2], missingPrice, referenceMissingPrice, sourceType: override !== undefined ? 'user' : missingPrice ? 'missing' : data.missingPrice && quantity === 0 ? 'included' : (data.sourceType || 'editorial-estimate'), originalSourceType: referenceMissingPrice ? 'missing' : data.sourceType || 'editorial-estimate', sourceUrl: data.sourceUrl || null, sourceName: override !== undefined ? '你的费用记录' : missingPrice ? '当地价格尚未收录' : (data.sourceName || '途算预算假设'), checkedAt: data.checkedAt || null, confirmed, overridden: override !== undefined, note: missingPrice ? `${data.note || ''} 尚未收录该项当地价格；当前不计入已知费用小计，不代表免费。请填入预算或实际报价。` : data.note || '' };
    lines.push(line);
    return line;
  };
  let elapsed = 0;
  let previousCity = byId.get(plan.originId);
  const addLeg = (from, to, index, date, isReturn = false) => {
    if (from.id === to.id) return;
    const distance = distanceKm(from, to);
    const legId = `leg-${index}`;
    const resolution = resolveJourneyMode(from, to, distance, getJourneyModePreference(plan, legId, from, to));
    const boat = resolution.mode === 'boat', road = resolution.mode === 'road';
    const links = bookingLinks({ origin: from, destination: to, departureDate: date, travelers, rooms });
    const metadata = { transportMode: resolution.mode, modeLabel: resolution.modeLabel, routeBasis: resolution.reason, fromId: from.id, toId: to.id, journeyDate: date, fromAirportIsGateway: from.airportIsGateway === true, toAirportIsGateway: to.airportIsGateway === true };
    const pushLeg = (line, link) => legs.push({ id: line.id, ...metadata, requestedMode: resolution.requestedMode, date, distanceKm: distance, amount: line.amount, low: line.low, high: line.high, sourceType: line.sourceType, link });
    if (boat || road) {
      const mode = resolution.mode;
      const surfaceModel = resolution.islandAware || road ? islandSurfaceBudget(mode, distance) : null;
      const label = boat ? surfaceModel ? '公路接驳与渡船' : '跨岛船程' : '公路交通';
      const line = add({
        id: legId, category: 'intercity', label: `${from.name} → ${to.name}${isReturn ? ' · 返程' : ''} · ${label}`,
        cityId: to.id, quantity: travelers, unit: '人 / 单程',
        values: surfaceModel?.values || (boat ? [20,40,120] : [250,650,1600]),
        nativeCurrency: surfaceModel?.nativeCurrency || (boat ? 'USD' : 'CNY'),
        sourceType: 'model', sourceName: surfaceModel?.sourceName || '跨岛/公路规划区间', sourceUrl: links.route,
        ...metadata,
        note: surfaceModel?.note || (boat ? '仅为渡轮、共享快艇至私人接送的预算区间，不代表所选日期有船班；需核对码头、航线、天气及行李费用。此段不另收机场接驳，市内交通另计。' : '公路单程预算假设；租车分摊、燃油、巴士或包车报价需自行核对，不代表存在直达班车。此段不另收机场接驳。'),
      });
      pushLeg(line, links.route);
      return;
    }
    if (resolution.railModel) {
      const model = resolution.railModel;
      const line = add({ id: legId, category: 'intercity', label: `${from.name} → ${to.name}${isReturn ? ' · 返程' : ''} · ${model.modeLabel}`, cityId: to.id, quantity: travelers, unit: '人 / 单程', values: model.values, nativeCurrency: model.nativeCurrency, sourceType: 'model', sourceName: model.sourceName, sourceUrl: model.sourceUrl, ...metadata, railNetworkId: model.networkId, routeDistanceKm: model.routeKm, note: `${model.note} 路网资料查阅于 ${model.checkedAt}，该日期不代表票价已核实。` });
      pushLeg(line, model.sourceUrl);
      const transferValues = [0,1,2].map(tier => [from,to].reduce((sum, city) => sum + (city.countryCode === 'CN' ? [5,20,80][tier] : [15,45,150][tier]), 0));
      add({ id: `transfer-${index}`, category: 'transfer', label: `${from.name} → ${to.name} · 两端车站接驳`, cityId: to.id, quantity: travelers, unit: '人 / 两端', values: transferValues, sourceType: 'allowance', ...metadata, note: '往返市区与火车站的公交、地铁或出租车预算预留，按两端分别计算，不含在城际车票或市内日常交通预算中；住宿就在车站旁、已有交通票或接送已包含时可填写实际总额或 0。未计任何机场接驳。' });
      return;
    }
    // Illustrative one-way economy transport ranges, NOT availability or observed fares.
    const values = distance < 450 ? [180, 450, 1200] : distance < 1600 ? [450, 1100, 2800] : distance < 4000 ? [850, 1900, 5000] : distance < 8000 ? [1900, 3800, 9500] : [2800, 5600, 14000];
    const link = links.flights;
    const gatewayNote = [from, to].filter(city => city.airportIsGateway).map(city => `${city.name}使用${city.iata || '外部'}门户机场，机场不在该目的地；接驳另见现有两端接驳预算。`).join(' ');
    const line = add({ id: legId, category: 'intercity', label: `${from.name} → ${to.name}${isReturn ? ' · 返程' : ''} · 飞机`, cityId: to.id, quantity: travelers, unit: '人 / 单程', values, sourceType: 'model', sourceName: '航空距离分段预算模型', sourceUrl: link, ...metadata, note: `直线距离约 ${distance.toLocaleString()} km；航空模型区间，不代表有直达航线、即时票价或舱位。${resolution.islandAware ? '跨海航空或中转安排需核对。' : ''}行李与税费须在预订页核对。${gatewayNote}` });
    pushLeg(line, link);
    // Each intercity leg has both origin and destination terminal transfers.
    const transferValues = [0,1,2].map(tier => [from,to].reduce((sum, city) => sum + (city.gatewayTransfer ? convertCurrency(city.gatewayTransfer.values[tier], city.gatewayTransfer.currency, 'CNY', rates) : [15,50,180][tier]),0));
    const gatewayNotes = [from,to].filter(city => city.gatewayTransfer).map(city => `${city.name}：${city.gatewayTransfer.note}`).join(' ');
    add({ id: `transfer-${index}`, category: 'transfer', label: `${from.name} → ${to.name} · 两端机场接驳`, cityId: to.id, quantity: travelers, unit: '人 / 两端', values: transferValues, sourceType: 'allowance', ...metadata, note: `${gatewayNotes} 按两端机场接驳预留；酒店报价已含接送或无需接驳时可改为 0。市内交通预算不含这部分。`.trim() });
  };
  stops.forEach((stop, index) => {
    const city = stop.city;
    addLeg(previousCity, city, index, addDays(plan.departureDate, elapsed));
    const stopNights = stay ? stop.days : stop.days - (index === stops.length - 1 ? 1 : 0);
    if (city.greenTax) add({ id:`stop-${index}-green-tax`, category:'lodging', cityId:city.id, label:`${city.name} · Green Tax 住宿税预留`, quantity:stopNights*travelers, unit:'成人夜', values:[city.greenTax.low,city.greenTax.high,city.greenTax.high], nativeCurrency:city.greenTax.currency, sourceType:'allowance', sourceName:'按官方税率的规划预留', sourceUrl:city.greenTax.sourceUrl, checkedAt:city.greenTax.checkedAt, note:city.greenTax.note });
    const basis = { cityId: city.id, nativeCurrency: city.currency, checkedAt: city.budgetBasis?.updatedAt, sourceType: 'editorial-estimate', sourceName: '城市消费预算区间', note: city.budgetBasis?.note || '人工维护的规划区间；不代表当前可预订价格。' };
    const preference = (category, fallback, monthly = false) => {
      const amount = stop.dailyPreferences?.[category];
      if (amount === undefined) return { values: fallback, missingPrice: cityCostIsMissing(city, category) };
      const value = finite(amount, '每日费用偏好', 0, 1e7) * (monthly ? 30 : 1);
      return { values: [value, value, value], missingPrice: false, sourceType: 'user-preference', sourceName: '你的每日费用偏好', checkedAt: null, note: `按你填写的 ${amount} ${city.currency} / ${category === 'lodging' ? '间夜' : category === 'utilities' ? '间天' : '人天'} 计算${monthly ? '，以 30 天折算月度金额' : ''}；这是预算目标，不是已核实成交价格。${city.budgetCurrencyOnly ? ' USD 只是你填写预算的币种，不代表该地的法定货币。' : ''}` };
    };
    const links = bookingLinks({ origin: previousCity, destination: city, departureDate: addDays(plan.departureDate, elapsed), returnDate: addDays(plan.departureDate, elapsed + stopNights), travelers, rooms });
    const hotel = stop.experiences.find(row => row.experience.kind === 'hotel');
    if (hotel) {
      const { experience, option, selection } = hotel;
      add({ id: `stop-${index}-lodging`, category: 'lodging', label: `${city.name} · ${experience.name} · ${option.name}`, cityId: city.id, experienceId: experience.id, optionId: option.id, quantity: stopNights * rooms, unit: '间夜', values: experiencePriceValues(option), nativeCurrency: option.currency, sourceType: option.type, sourceName: option.sourceName || experience.provider || experience.name, sourceUrl: option.sourceUrl || experience.sourceUrl, bookingUrl: experience.bookingUrl, checkedAt: option.checkedAt ?? (option.type === 'official' ? experience.checkedAt : null), note: `${experiencePriceNote(experience, option)} 本站 ${stopNights} 晚 × ${rooms} 间房，已替换城市住宿参考预算。${stopNights === 0 ? '当天往返没有住宿夜数，不计酒店费用。' : ''}`, selection });
      if (stopNights === 0) warnings.push(`${city.name}所选酒店没有对应住宿夜数，当前未计住宿；如需入住请增加停留天数。`);
    } else if (stay) {
      add({ ...basis, id: `stop-${index}-lodging`, category: 'lodging', label: `${city.name} · 月租折算`, quantity: stop.days / 30 * rooms, unit: '间 / 30天', sourceUrl: links.hotels, note: `${basis.note} 按 30 天月租线性折算；短租溢价、押金及清洁费未包含，需按实际合同调整。`, ...preference('lodging', city.monthly.rent, true) });
    } else {
      add({ ...basis, id: `stop-${index}-lodging`, category: 'lodging', label: `${city.name} · ${stopNights} 晚住宿`, quantity: stopNights * rooms, unit: '间夜', sourceUrl: stopNights > 0 ? links.hotels : null, ...preference('lodging', city.daily.lodging) });
    }
    if (stay) add({ ...basis, id: `stop-${index}-utilities`, category: 'utilities', label: `${city.name} · 水电网络`, quantity: hotel ? 0 : stop.days / 30 * rooms, unit: '间 / 30天', ...preference('utilities', city.monthly.utilities, true), note: hotel ? '已选择按晚计费的酒店，不再另加月租水电网络预算；如有另收费项目请填写实际金额。' : '月度水电与固定网络预留，按 30 天比例折算；含费租约可改为 0。' });
    const restaurants = stop.experiences.filter(row => row.experience.kind === 'restaurant');
    const coveredMeals = Array.from({ length: stop.days }, (_, day) => coveredMealSlots(stop.experiences, day));
    const mealCount = coveredMeals.reduce((sum, meals) => sum + meals.size, 0);
    const remainingFoodDays = round(stop.days - coveredMeals.reduce((sum, meals) => sum + [...meals].reduce((subtotal, meal) => subtotal + MEAL_WEIGHTS[meal], 0), 0));
    for (const category of ['food', 'transport', 'misc']) {
      const model = preference(category, city.daily[category]);
      add({ ...basis, id: `stop-${index}-${category}`, category, label: `${city.name} · ${CATEGORY_LABELS[category]}${category === 'food' && mealCount ? '（其余餐次）' : ''}`, quantity: (category === 'food' ? remainingFoodDays : stop.days) * travelers, unit: category === 'food' && mealCount ? '人天等值 / 未选餐次' : '人天', ...model, note: category === 'food' && mealCount ? `${model.note || basis.note} 已扣除 ${mealCount} 个指定餐厅或体验含餐餐次（早餐20%、午餐40%、晚餐40%）；本行仅覆盖其余餐次。若录入本行全程金额，也只代表未指定餐次，所选餐厅另列且只计一次。` : category === 'misc' ? '洗衣、饮用水、零星日用等预留；不包含购物、签证和大额消费。' : model.note || basis.note });
    }
    for (const { selection, experience, option } of stop.experiences.filter(row => row.experience.kind !== 'hotel')) {
      const dining = experience.kind === 'restaurant', quantity = option.unit === 'booking' ? Math.ceil(travelers / option.partyCapacity) : travelers;
      add({ id: experienceLineId(index, selection), category: dining ? 'food' : 'experiences', label: `${city.name} · ${experience.name} · ${option.name}`, cityId: city.id, experienceId: experience.id, optionId: option.id, dayIndex: selection.dayIndex, mealType: selection.mealType, scheduleStatus: selection.scheduleStatus, quantity, unit: option.unit === 'booking' ? `单 / 每单最多${option.partyCapacity}人` : '人', values: experiencePriceValues(option), nativeCurrency: option.currency, sourceType: option.type, sourceName: option.sourceName || experience.provider || experience.name, sourceUrl: option.sourceUrl || experience.sourceUrl, bookingUrl: experience.bookingUrl, checkedAt: option.checkedAt ?? (option.type === 'official' ? experience.checkedAt : null), note: `${experiencePriceNote(experience, option)} ${dining ? '已替换该日对应餐次的基础餐费，不重复计餐饮预留。' : selection.scheduleStatus === 'needs-more-days' ? '所选体验仍计入预算，但日程容量不足，尚未安排；请增加天数或移除。' : '独立体验费用，未另加普通景点门票。'}` });
      if (selection.scheduleStatus === 'needs-more-days') warnings.push(`${experience.name}尚未找到可行日程，费用已保留；建议增加停留天数后重新安排。`);
    }
    const assignedDays = new Map(buildDayAssignments(stop, city).flatMap((ids, day) => ids.map(id => [id,day])));
    const paidPasses = new Set();
    for (const attractionId of stop.attractionIds) {
      const attraction = city.attractions.find(a => a.id === attractionId);
      const p = attraction.price;
      const passKey = p.passGroup ? `${p.passGroup}:${assignedDays.get(attractionId) ?? 0}` : null;
      const included = passKey && paidPasses.has(passKey);
      if (passKey) paidPasses.add(passKey);
      add({ id: `stop-${index}-attraction-${attraction.id}`, category: 'attractions', label: `${city.name} · ${attraction.name}${included ? '（已含当日通票）' : p.passGroup ? '（当日通票）' : ''}`, cityId: city.id, attractionId, quantity: included ? 0 : travelers, unit: included ? '已含当日通票' : '成人票', values: [p.low, p.high, p.high], nativeCurrency: p.currency || city.currency, missingPrice: p.type === 'missing' || p.missingPrice === true, sourceType: included ? 'included' : p.type, sourceName: p.sourceName || (p.type === 'free' ? '免费公共空间' : '景点预算'), sourceUrl: p.sourceUrl, checkedAt: p.checkedAt, note: `${p.note || ''} ${p.passGroup ? '相同通票组同一安排日只计一次，不同日期按日票分别预留；多日优惠票、有效期及额外参观点数量限制请在官网核对。' : ''} 按成人计费；舒适/高端档按票价区间上限预留，优惠资格、时段、预约和附加体验请核对官网。`.trim() });
    }
    if (stop.attractionIds.reduce((sum, id) => sum + (city.attractions.find(a => a.id === id)?.durationHours || 2), 0) > stop.days * 6) warnings.push(`${city.name}景点较密集，建议增加停留天数或减少景点。`);
    previousCity = city; elapsed += stop.days;
  });
  if (plan.returnTrip !== false) addLeg(previousCity, byId.get(plan.originId), 'return', addDays(plan.departureDate, stay ? days : days - 1), true);
  add({ id: 'insurance', category: 'insurance', label: '旅行保险预留', quantity: days * travelers, unit: '人天', values: [3, 8, 20], sourceType: 'allowance', note: '预算占位，非保险产品报价。请按目的地、年龄、活动和实际保单改写。' });
  add({ id: 'connectivity', category: 'connectivity', label: '手机上网预留', quantity: travelers * Math.ceil(days / 30), unit: '人 / 30天以内', values: [30, 100, 250], sourceType: 'allowance', note: '按每人每 30 天一个套餐预留，非运营商报价；已有漫游或本地套餐可改为 0。' });
  add({ id: 'visa', category: 'visa', label: '签证与入境费用 · 待填写', quantity: travelers, unit: '人', values: [0, 0, 0], sourceType: 'excluded', note: '未获取国籍、居留身份和签证类型，默认不计入；请核对每一目的地官方要求并填写团队总额。0 不代表免签。' });
  const subtotal = round(lines.reduce((sum, l) => sum + l.amount, 0));
  const subtotalLow = round(lines.reduce((sum, l) => sum + l.low, 0));
  const subtotalHigh = round(lines.reduce((sum, l) => sum + l.high, 0));
  // Reserve is based on matching totals at each range end, not on the selected tier only.
  const reserveLine = add({ id: 'reserve', category: 'reserve', label: `机动预算 · ${reservePercent}%`, quantity: 1, unit: '笔', values: [subtotalLow * reservePercent / 100, subtotal * reservePercent / 100, subtotalHigh * reservePercent / 100], nativeCurrency: currency, sourceType: 'allowance', note: '覆盖小额价格浮动；不能替代未填写的签证、购物、押金及特殊活动费用。' });
  if (!plan.overrides?.reserve) { reserveLine.amount = round(subtotal * reservePercent / 100); reserveLine.unitAmount = reserveLine.amount; }
  const total = round(lines.reduce((sum, l) => sum + l.amount, 0));
  const low = round(lines.reduce((sum, l) => sum + l.low, 0));
  const high = round(lines.reduce((sum, l) => sum + l.high, 0));
  const categories = Object.entries(CATEGORY_LABELS).map(([id, label]) => {
    const group = lines.filter(l => l.category === id);
    return { id, label, missingPrice: group.some(line => line.missingPrice), missingCount: group.filter(line => line.missingPrice).length, amount: round(group.reduce((s, l) => s + l.amount, 0)), low: round(group.reduce((s, l) => s + l.low, 0)), high: round(group.reduce((s, l) => s + l.high, 0)) };
  }).filter(c => lines.some(l => l.category === c.id));
  const costGroups = [{ id: 'daily', label: '每日生活与保障' }, { id: 'fixed', label: '固定与单次费用' }, { id: 'reserve', label: '机动预算' }].map(group => {
    const included = lines.filter(l => l.costGroup === group.id);
    const amount = round(included.reduce((sum, l) => sum + l.amount, 0));
    return { ...group, amount, missingPrice: included.some(line => line.missingPrice), missingCount: included.filter(line => line.missingPrice).length, low: round(included.reduce((sum, l) => sum + l.low, 0)), high: round(included.reduce((sum, l) => sum + l.high, 0)), perDay: round(amount / days), lines: included.map(l => l.id), currency, note: group.id === 'daily' ? '住宿、饮食、市内交通和生活保障；通信套餐按使用周期计入，不一定每天发生同额支出。' : group.id === 'fixed' ? '在当前路线与选择下的单次费用；改路线、人数或景点时仍会变化。日均仅为分摊展示。' : '按预算比例预留。' };
  });
  warnings.push('交通与食宿为规划区间；最低和最高是当前模型范围，不是全球可获得的极值。价格会随出发日期、库存和条件变化。');
  warnings.push('签证、购物、可退押金、酒店城市税/清洁费、超额行李及特殊活动未自动报价；请在明细中补充或加入机动预算。');
  if (stay) warnings.push('旅居按每 30 天月租折算并计入完整停留日的住宿；不足一个月不保证按天租赁。');
  if (days === 1 && legs.some(l => l.distanceKm > 1000)) warnings.push('当前是跨城一天行程，交通可能占用全天或跨夜；请先核对可行车次或航班，并调整停留天数。');
  if (rates?.status && rates.status !== 'fresh') warnings.push('当前使用缓存或参考汇率，请在付款时核对兑换成本。');
  if (plan.departureDate < new Date().toISOString().slice(0, 10)) warnings.push('出发日期已过去；此预算可用于复盘，预订前请更新日期。');
  const missingCosts = lines.filter(line => line.missingPrice).map(({ id, category, cityId, label, quantity, unit, nativeCurrency }) => ({ id, category, cityId, label, quantity, unit, nativeCurrency }));
  if (missingCosts.length) warnings.push(`预算尚不完整：有 ${missingCosts.length} 项当地费用待填写；当前总额及机动预算仅包含已知金额，缺失项目不是免费。`);
  return { incomplete: missingCosts.length > 0, missingCosts, knownSubtotal: total, total, low, high, subtotal, perPerson: round(total / travelers), perDay: round(total / days), perPersonPerDay: round(total / travelers / days), days, nights, currency, lines, legs, categories, costGroups, warnings, confirmedCount, confirmedAmount: round(lines.filter(l => l.confirmed).reduce((s, l) => s + l.amount, 0)), estimatedCount: lines.length - confirmedCount, endDate: addDays(plan.departureDate, stay ? days : days - 1) };
}
export function generateItinerary(plan, cities, rates) {
  validatePlan(plan, cities);
  return generateDetailedItinerary(plan, cities, rates ? calculatePlan(plan, cities, rates) : null);
}
