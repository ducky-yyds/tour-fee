import { railConnection, railPlanningModel } from './rail-network.mjs';

export const JOURNEY_MODE_LABELS = { auto: '智能选择', air: '飞机', 'high-speed-rail': '高铁 / 动车', rail: '城际铁路', road: '公路', boat: '渡船' };
const modeValues = new Set(Object.keys(JOURNEY_MODE_LABELS));

/** A shared planning-mode decision, not a verified commercial connection.
 * islandGroup identifies a landmass; islandAccess is its cross-region default.
 * airportIsGateway means iata belongs to an external gateway, not this town.
 * The established MV/IS and gateway rules remain; rail access is checked separately.
 */
function islandDefault(from, to, distanceKm) {
  const domestic = from?.countryCode === to?.countryCode;
  if (domestic && from?.countryCode === 'MV' && distanceKm < 150) return { mode: 'boat', reason: 'legacy-mv', islandAware: false };
  if (domestic && from?.countryCode === 'IS' && distanceKm < 450) return { mode: 'road', reason: 'legacy-is', islandAware: false };
  const fromGroup = typeof from?.islandGroup === 'string' && from.islandGroup ? from.islandGroup : null;
  const toGroup = typeof to?.islandGroup === 'string' && to.islandGroup ? to.islandGroup : null;
  const islandAware = Boolean(fromGroup || toGroup);
  const sameIsland = Boolean(fromGroup && fromGroup === toGroup);
  const gateway = from?.airportIsGateway === true || to?.airportIsGateway === true;
  const ferry = [from, to].some(city => city?.islandGroup && city.islandAccess === 'ferry');
  const sharedGateway = domestic && (gateway || islandAware) && from?.iata && from.iata === to?.iata;
  if (sharedGateway) return { mode: !sameIsland && ferry ? 'boat' : 'road', reason: 'shared-gateway', islandAware: true, surfaceConnection: true };
  if (domestic && islandAware && !sameIsland) {
    return { mode: ferry && distanceKm < 450 ? 'boat' : 'air', reason: 'island-crossing', islandAware: true, surfaceConnection: ferry && distanceKm < 450 };
  }
  if (domestic && sameIsland && [from.routeMode, to.routeMode].includes('road')) return { mode: 'road', reason: 'same-island', islandAware: true, surfaceConnection: true };
  return { mode: 'air', reason: sameIsland ? 'same-island' : islandAware ? 'island-air-access' : 'distance-air', islandAware };
}

function separation(from, to) {
  if (![from?.lat, from?.lng, to?.lat, to?.lng].every(Number.isFinite)) return 0;
  const rad = Math.PI / 180;
  const h = Math.sin((to.lat - from.lat) * rad / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(to.lat * rad) * Math.sin((to.lng - from.lng) * rad / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}
const mainlandUS = new Set(['new-york','washington-dc','boston','philadelphia','chicago','atlanta','charleston','savannah','miami','orlando','new-orleans','nashville','austin','san-antonio','denver','salt-lake-city','flagstaff','los-angeles','san-diego','las-vegas','san-francisco','seattle','portland','monterey']);
function modeAvailability(from, to, km) {
  km = Math.max(0, Math.round(Number(km) || 0));
  const fallback = islandDefault(from, to, km);
  const fast = railPlanningModel(from, to, km, 'high-speed-rail');
  const rail = railPlanningModel(from, to, km, 'rail');
  const sameIsland = from?.islandGroup && from.islandGroup === to?.islandGroup;
  const domestic = from?.countryCode && from.countryCode === to?.countryCode;
  const knownRoad = domestic && km < 2400 && (sameIsland || fast || (rail && !['jp-hokkaido'].includes(rail.networkId)) || (mainlandUS.has(from.id) && mainlandUS.has(to.id)));
  const road = fallback.mode === 'road' || knownRoad;
  const boat = fallback.mode === 'boat';
  // Shared gateway destinations do not acquire a fictitious flight between
  // two locations that are both served by the same external airport.
  const air = fallback.reason !== 'shared-gateway' && !(from?.iata && from.iata === to?.iata);
  return { fallback, fast, rail, road, boat, air };
}

export function listJourneyModes(from, to, distanceKm = separation(from, to)) {
  if (!from || !to || from.id === to.id) return [];
  const available = modeAvailability(from, to, distanceKm);
  const rows = [{ mode: 'auto', label: JOURNEY_MODE_LABELS.auto, note: '结合已维护铁路连接和途中耗时选择，仍须核对实际车次或航班。' }];
  for (const [mode, model] of [['high-speed-rail', available.fast], ['rail', available.rail]]) {
    if (model) rows.push({ mode, label: model.modeLabel, sourceUrl: model.sourceUrl, note: model.note });
  }
  if (available.air) rows.push({ mode: 'air', label: '飞机', note: '按距离预留航空费用及时间，不保证直飞或有当日航班。' });
  if (available.road) rows.push({ mode: 'road', label: '公路', note: '按巴士、租车分摊至包车的区间估算，实际路况和报价另核。' });
  if (available.boat) rows.push({ mode: 'boat', label: '渡船', note: '航线、码头、船班与接送范围需要向经营者确认。' });
  return rows;
}

/** Endpoint-bound preferences survive save/load without moving onto another leg. */
export function getJourneyModePreference(plan, legId, from, to) {
  const value = plan?.transportModes?.[legId];
  if (!from || !to || from.id === to.id) return 'auto';
  if (!value && !(plan?.transportModelVersion >= 2) && (plan?.overrides?.[legId] !== undefined || plan?.overrides?.[legId.replace(/^leg-/, 'transfer-')] !== undefined)) {
    const km = separation(from, to), old = islandDefault(from, to, km);
    const oldIslandRail = old.islandAware && from.countryCode === to.countryCode && km < 600 && !['road','boat'].includes(old.mode) && from.islandGroup === to.islandGroup;
    const legacyMode = oldIslandRail ? (railConnection(from, to, 'rail') ? 'rail' : 'high-speed-rail') : old.mode;
    if (listJourneyModes(from, to, km).some(option => option.mode === legacyMode)) return legacyMode;
  }
  if (!value || typeof value !== 'object' || value.fromId !== from?.id || value.toId !== to?.id || !modeValues.has(value.mode)) return 'auto';
  return listJourneyModes(from, to).some(option => option.mode === value.mode) ? value.mode : 'auto';
}

export function normalizeJourneyModes(plan, cities = []) {
  const byId = new Map(cities.map(city => [city.id, city]));
  const choices = {};
  let from = byId.get(plan?.originId);
  const record = (to, legId) => {
    const mode = getJourneyModePreference(plan, legId, from, to);
    if (mode !== 'auto') choices[legId] = { fromId: from.id, toId: to.id, mode };
    from = to;
  };
  (plan?.stops || []).forEach((stop, index) => record(byId.get(stop.cityId), `leg-${index}`));
  if (plan?.returnTrip !== false) record(byId.get(plan?.originId), 'leg-return');
  return choices;
}

/** Old generic mainland lines were priced as flights even when the timeline
 * called them rail. Preserve a user's recorded amount with its old meaning;
 * unedited legacy estimates can adopt the new automatic mode choice. */
export function migrateJourneyTransport(plan, cities = []) {
  return { transportModes: normalizeJourneyModes(plan, cities), transportModelVersion: 2 };
}

export function resolveJourneyMode(from, to, distanceKm, preferredMode = 'auto') {
  const available = modeAvailability(from, to, distanceKm);
  const { fallback, fast, rail } = available;
  const requestedMode = modeValues.has(preferredMode) ? preferredMode : 'auto';
  const canSelect = mode => mode === 'high-speed-rail' ? Boolean(fast) : mode === 'rail' ? Boolean(rail) : Boolean(available[mode]);
  let mode;
  if (requestedMode !== 'auto' && canSelect(requestedMode)) mode = requestedMode;
  else if (['boat','road'].includes(fallback.mode)) mode = fallback.mode;
  else if (fast && fast.estimatedMinutes <= 450) mode = 'high-speed-rail';
  else if (rail && rail.estimatedMinutes <= 360) mode = 'rail';
  else if (available.road && distanceKm < 280 && !fast && !rail) mode = 'road';
  else if (available.air) mode = 'air';
  else mode = fast ? 'high-speed-rail' : rail ? 'rail' : available.boat ? 'boat' : 'road';
  const railModel = mode === 'high-speed-rail' ? fast : mode === 'rail' ? rail : null;
  return {
    ...fallback, mode, requestedMode, modeLabel: railModel?.modeLabel || JOURNEY_MODE_LABELS[mode], railModel,
    reason: railModel ? `reviewed-rail:${railModel.networkId}` : mode === fallback.mode ? fallback.reason : `selected-${mode}`,
    ...(mode !== 'air' ? { surfaceConnection: true } : {}),
  };
}

/** Distance-based party-per-person editorial ranges, never observed fares. */
export function islandSurfaceBudget(mode, distanceKm) {
  const roadDistance = Math.max(0, distanceKm) * 1.35;
  const round = value => Math.round(value);
  return {
    values: mode === 'boat'
      ? [Math.max(20, round(roadDistance * 0.8)), Math.max(50, round(roadDistance * 1.8)), Math.max(150, round(roadDistance * 5))]
      : [Math.max(10, round(roadDistance * 0.55)), Math.max(35, round(roadDistance * 1.4)), Math.max(120, round(roadDistance * 5))],
    nativeCurrency: 'CNY',
    sourceName: '按路距的编辑交通预算',
    note: mode === 'boat'
      ? '根据直线距离乘1.35的路距参考，预留公路接驳、渡船与候船的每人单程编辑预算；不是经营者报价，也未核实实际码头、可用船班或整程联运。此段不另加机场接驳；不是把门户机场当成目的地本地机场。'
      : '根据直线距离乘1.35的路距参考预留每人单程地面交通预算；不是实时车次或包车报价，实际路线、接送范围及费用需核实。此段不另加机场接驳。',
  };
}
