/** A shared planning-mode decision, not a verified commercial connection.
 * islandGroup identifies a landmass; islandAccess is its cross-region default.
 * airportIsGateway means iata belongs to an external gateway, not this town.
 * Routes without these new fields retain the established MV/IS/distance rules.
 */
export function resolveJourneyMode(from, to, distanceKm) {
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
  return { mode: domestic && distanceKm < 600 ? 'rail' : 'air', reason: sameIsland ? 'same-island' : islandAware ? 'island-air-access' : 'legacy-distance', islandAware };
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
