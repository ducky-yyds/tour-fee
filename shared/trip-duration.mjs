/** Editorial starting points for a first visit, not a required length of stay.
 * City sightseeing, regional excursions and resort stays have different rhythms.
 * Existing user-entered durations are never migrated or shortened by this table.
 */
const GROUPS = [
  { ids: 'beijing tokyo london new-york', days: 5, min: 4, max: 7, reason: '街区、博物馆与远郊景点较多，分区游览并留出交通和休息时间。' },
  { ids: 'shanghai paris rome sydney istanbul hong-kong chengdu los-angeles seoul delhi mexico-city cape-town', days: 4, min: 3, max: 6, reason: '适合分几个街区或主题慢慢游览，安排一两项半日体验。' },
  { ids: 'bali mauritius', days: 5, min: 4, max: 7, reason: '目的地范围较大，海岸、自然体验与度假休息适合分开安排。' },
  { ids: 'mahe zanzibar cancun', days: 4, min: 3, max: 6, reason: '除城镇游览外，给海岛活动、出海与休息各留一些时间。' },
  { ids: 'vik akureyri brussels dubrovnik tallinn riga vilnius kandy quebec-city', days: 2, min: 1, max: 2, reason: '核心游览区相对集中，可用一至两天认识主要风景与街区。' },
  { ids: 'male', days: 1, min: 1, max: 2, reason: '市区主要风景适合短暂停留；前往其他岛屿的交通另留时间。' },
  { ids: 'kyoto osaka bangkok singapore barcelona dubai xian hangzhou guangzhou lisbon amsterdam berlin venice florence melbourne chiang-mai hanoi ho-chi-minh-city hoi-an da-nang luang-prabang siem-reap kuala-lumpur penang langkawi manila reykjavik maafushi edinburgh dublin cappadocia johannesburg marrakech fes cairo luxor nairobi vancouver toronto lima cusco rio-de-janeiro buenos-aires santiago cebu taipei kaohsiung kathmandu jaipur colombo auckland queenstown oslo bergen tromso copenhagen stockholm helsinki rovaniemi warsaw krakow prague vienna budapest zurich interlaken athens santorini madrid', days: 3, min: 2, max: 4, reason: '用两三天体验主要街区与特色项目，再按兴趣留一点弹性时间。' },
];
const PROFILES = new Map(GROUPS.flatMap(({ ids, ...profile }) => ids.split(' ').map(id => [id, Object.freeze(profile)])));
export function getTripDuration(city) {
  const profile = PROFILES.get(typeof city === 'string' ? city : city?.id);
  if (profile) return { ...profile, type: 'editorial', label: profile.min === profile.max ? `${profile.min} 天` : `${profile.min}–${profile.max} 天` };
  if (!city || city.coverage === 'airport-only') return { days: 2, min: 1, max: 2, label: '暂定 2 天', type: 'provisional', reason: '目前仅有机场基础资料，先预留两天，待补充当地行程后自行调整。' };
  return { days: 3, min: 2, max: 4, label: '2–4 天', type: 'editorial', reason: '首次到访的编辑建议；按实际想去的地点调整，不按景点数量全部塞入。' };
}
export function recommendedDays(city) { return getTripDuration(city).days; }

/** A new stop always starts as a trip, independent of any old monthly-stay mode. */
export function createRecommendedStop(city) {
  return { cityId: city.id, days: recommendedDays(city), daysSource: 'recommendation', attractionIds: (city.attractions || []).map(attraction => attraction.id), planningMode: 'smart' };
}
