/** Public city pickers only offer destinations with actual travel content. */
export function isTravelDestination(city) {
  return Boolean(city && !city.legacyAirportAlias && city.coverage !== 'airport-only' && city.nameKind !== 'airport'
    && (city.attractions?.length || city.experiences?.length || city.localFoods?.length));
}

/** Retain airport nodes for transport and previously saved trips, not browsing. */
export function mergeAirportCities(curated = [], airportCities = [], aliases = {}) {
  const result = [...curated];
  const seen = new Set(curated.map(city => city.id));
  for (const raw of Array.isArray(airportCities) ? airportCities : []) {
    if (!raw || typeof raw.id !== 'string' || seen.has(raw.id) || (raw.curatedCityId && seen.has(raw.curatedCityId))) continue;
    if (![raw.lat, raw.lng].every(Number.isFinite) || Math.abs(raw.lat) > 90 || Math.abs(raw.lng) > 180) continue;
    const zeros = () => [0, 0, 0];
    result.push({ ...raw, name: raw.name || raw.nameEn || raw.id, nameEn: raw.nameEn || raw.name || raw.id, country: raw.country || raw.countryEn || raw.countryCode || '国家或地区待核对', region: raw.region || '其他地区', tags: [], attractions: [], experiences: [], coverage: 'airport-only', airportOnly: true, costsUnknown: true, currency: 'USD', budgetCurrencyOnly: true, localCurrency: null, currencyLabel: 'USD（预算录入币种，不代表当地币种）', daily: { lodging: zeros(), food: zeros(), transport: zeros(), misc: zeros() }, monthly: { rent: zeros(), utilities: zeros() }, missingPrices: { lodging: true, food: true, transport: true, misc: true, utilities: true }, budgetBasis: { type: 'missing', updatedAt: null, note: '目前只有机场及所属地点资料，尚未收录当地食宿、交通与生活成本。USD 仅供填写个人预算，不代表当地货币；未填写金额不可视为免费，也不计入已知费用小计。' }, tagline: '原有行程的机场交通资料', description: '保留原有项目使用的机场与所属地点资料。机场存在不代表所选日期有直达或可订航班；新行程请从已有旅行内容的城市中选择。', transportNote: '地理坐标以机场为参考，不是市中心。航班、地面接驳和实际可到达性需向运营方核对。', airportCount: raw.airportCount ?? raw.airportIds?.length ?? 0 });
    seen.add(raw.id);
  }
  const canonicalCities = new Map(curated.map(city => [city.id, city]));
  for (const [id, canonicalId] of Object.entries(aliases || {})) {
    const canonical = canonicalCities.get(canonicalId);
    if (!id.startsWith('aircity-') || seen.has(id) || !canonical) continue;
    result.push({ ...canonical, id, canonicalCityId: canonicalId, legacyAirportAlias: true });
    seen.add(id);
  }
  return result;
}

export function cityCostIsMissing(city, category) {
  return Boolean(city?.missingPrices?.[category] || city?.costsUnknown || city?.budgetBasis?.type === 'missing');
}
