/** Editorial pace hints supplied by maintained destination records.
 * Missing hints preserve the existing eight-hour, time-based planner.
 * These limits apply only to automatically added sights, never to purchased
 * activities, user-entered visit durations or an unchanged manual itinerary.
 */
export function getDestinationPlanningProfile(city) {
  const explicit = ['leisure', 'balanced'].includes(city?.planningProfile);
  const leisure = city?.planningProfile === 'leisure';
  return {
    id: leisure ? 'leisure' : 'balanced',
    source: explicit ? 'city-profile' : 'default',
    label: leisure ? '休闲慢游' : '文化与城市探索',
    maxAutomaticPlacesPerDay: explicit ? (leisure ? 2 : 3) : null,
    targetActiveMinutes: leisure ? 420 : 480,
    maxActiveMinutes: 480,
    note: leisure
      ? '优先保留海边、湖畔或街区慢游的完整推荐用时；每天最多两个自动主活动，短街区与打卡点可顺路补充。有多个主活动时连同用餐、当地交通通常控制在七小时内；单个完整体验与顺路补充仍可使用原八小时容量。'
      : explicit
        ? '优先选择少量有代表性的文化体验；每天最多三个自动主活动，短街区与打卡点不占主活动名额，但仍计算实际用餐、交通和停留时间。'
        : '按景点价值、推荐时长和实际可活动窗口挑选，不另加城市地点数量限制。',
  };
}

export function getAttractionActivityType(attraction) {
  return ['leisure', 'culture'].includes(attraction?.activityType) ? attraction.activityType : null;
}

export function getAttractionVisitRole(attraction) {
  return ['highlight', 'neighborhood', 'optional'].includes(attraction?.visitRole) ? attraction.visitRole : 'highlight';
}

/** A long beach visit or theme park remains a main activity even if tagged optional. */
export function isSupportingVisit(attraction, durationMinutes) {
  return getAttractionVisitRole(attraction) !== 'highlight' && durationMinutes <= 120;
}

/** Stable editorial preference; source priority still distinguishes peers. */
export function destinationAttractionPriority(attraction, profile) {
  const base = Number.isFinite(attraction?.priority) ? attraction.priority : 0;
  const type = getAttractionActivityType(attraction);
  if (profile.id === 'leisure' && type === 'leisure') return base + 80;
  if (type === 'culture') return base + (profile.id === 'leisure' ? 10 : 20);
  return base;
}

export function automaticDayCapacity(profile, placeCount, window) {
  const paceLimit = profile.id === 'leisure' && placeCount > 1 ? profile.targetActiveMinutes : profile.maxActiveMinutes;
  return Math.min(paceLimit, window.maxLocalActiveMinutes);
}
