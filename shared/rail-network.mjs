/** Reviewed rail-connected city groups. Membership is explicit: an airport or a
 * country code alone never establishes a passenger railway connection. Groups
 * describe network access, possibly with changes, not a direct train service.
 * All duration/fare coefficients below are editorial planning assumptions.
 */
export const RAIL_REVIEWED_AT = '2026-09-23';
const china = ['beijing','shanghai','chengdu','xian','hangzhou','guangzhou','chongqing','jinan','zhengzhou','xiamen','qingdao','dali','lijiang','guilin','luoyang','quanzhou','nanjing','suzhou','shenzhen','changsha','wuhan','harbin','zhangjiajie','nanchang','tianjin','zunyi','yanan'];
const chinaConventional = china.filter(cityId => cityId !== 'quanzhou');
const japan = ['tokyo','kyoto','osaka','fukuoka','hiroshima'];
const make = (id, cities, modes, currency, sourceName, sourceUrl, fastSpeed, railSpeed, fastRates, railRates, extra = {}) => ({
  id, cities, modes, currency, sourceName, sourceUrl, fastSpeed, railSpeed, fastRates, railRates,
  routeFactor: 1.3, stationMinutes: 90, minimumFare: currency === 'JPY' ? 300 : currency === 'KRW' ? 4000 : 8, ...extra,
});
export const RAIL_NETWORKS = [
  make('cn-mainland', china, ['high-speed-rail'], 'CNY', '中国铁路 12306', 'https://www.12306.cn/index/', 215, 75, [0.38,0.6,1.65], [0.12,0.24,0.42], { minimumFare: 15 }),
  make('cn-conventional', chinaConventional, ['rail'], 'CNY', '中国铁路 12306', 'https://www.12306.cn/index/', 215, 75, [0.38,0.6,1.65], [0.12,0.24,0.42], { minimumFare: 15, note: '按普速铁路网络预留，可能需要换乘；硬座、卧铺与日期车次的实际差价以 12306 为准。' }),
  make('cn-dunhuang', [...chinaConventional,'dunhuang'], ['rail'], 'CNY', '中国铁路 12306', 'https://www.12306.cn/index/', 150, 70, [0.38,0.6,1.65], [0.12,0.24,0.42], { minimumFare: 15, routeFactor: 1.4, note: '敦煌方向按普速铁路及可能换乘估算，不把柳园南站当作敦煌市中心的高铁站。' }),
  make('cn-hk', [...china,'hong-kong'], ['high-speed-rail'], 'CNY', '中国铁路 12306 / 香港西九龙', 'https://www.12306.cn/index/', 210, 75, [0.42,0.65,1.7], [0.12,0.24,0.42], { stationMinutes: 120, minimumFare: 30, note: '涉及香港西九龙口岸，额外预留通关时间；证件、车站与具体班次在订票前核对。' }),
  make('hainan', ['haikou','sanya','wanning','lingshui'], ['high-speed-rail'], 'CNY', '中国铁路 12306', 'https://www.12306.cn/index/', 145, 75, [0.38,0.6,0.95], [0.12,0.24,0.42], { minimumFare: 15, routeFactor: 1.25, stationMinutes: 75, note: '仅海南岛内动车；跨海往返大陆不按纯铁路处理。' }),
  make('jp-main', japan, ['high-speed-rail','rail'], 'JPY', '日本国家旅游局 / JR', 'https://www.japan.travel/en/plan/getting-around/shinkansen/', 200, 70, [22,28,42], [11,17,25], { note: '新干线按东海道、山阳通道估算；普通铁路可能多次换乘，通票适用列车与加价另核。' }),
  make('jp-hokkaido', [...japan,'sapporo'], ['rail'], 'JPY', '札幌观光协会 / JR', 'https://www.sapporo.travel/en/info/about/transportation/', 180, 125, [22,28,42], [20,28,42], { routeFactor: 1.55, stationMinutes: 150, note: '札幌方向需换乘新干线与在来线特急，不是新干线直达札幌；本项为混合铁路预算。' }),
  make('kr-main', ['seoul','busan'], ['high-speed-rail','rail'], 'KRW', '韩国铁路 KORAIL', 'https://www.letskorail.com/', 185, 85, [110,155,225], [60,85,120], { routeFactor: 1.3, note: 'KTX 与常规铁路分别预留；济州岛不接入该铁路组。' }),
  make('tw-main', ['taipei','kaohsiung'], ['high-speed-rail','rail'], 'TWD', '台湾高铁 / 台铁', 'https://en.thsrc.com.tw/', 200, 95, [3.2,4.2,6], [1.6,2.2,3], { sourceUrls: { rail: 'https://www.railway.gov.tw/tra-tip-web/tip?lang=EN_US' }, routeFactor: 1.25 }),
  make('fr-main', ['paris','lyon','marseille','nice'], ['high-speed-rail','rail'], 'EUR', 'SNCF Connect', 'https://www.sncf-connect.com/en-en/train', 195, 95, [0.05,0.13,0.28], [0.05,0.1,0.2], { note: 'TGV 可包含普速线路区段；普通铁路通常需要换乘。票价随日期、席别和预订时间变化。' }),
  make('es-main', ['madrid','barcelona','seville','granada'], ['high-speed-rail'], 'EUR', '西班牙铁路 Renfe', 'https://www.renfe.com/es/en', 210, 95, [0.04,0.11,0.24], [0.04,0.09,0.18], { routeFactor: 1.4, note: '按已连接的西班牙高速铁路网估算，城市对之间可能经马德里等枢纽换乘。' }),
  make('pt-main', ['lisbon','porto'], ['rail'], 'EUR', '葡萄牙铁路 CP', 'https://www.cp.pt/en/pesquisa-comboio', 160, 110, [0.05,0.1,0.2], [0.04,0.1,0.16], { note: '按 Alfa Pendular / Intercidades 城际列车预算；不把葡萄牙岛屿接入大陆铁路。' }),
  make('it-main', ['rome','florence','venice'], ['high-speed-rail','rail'], 'EUR', '意大利铁路 Trenitalia', 'https://www.trenitalia.com/en.html', 180, 90, [0.05,0.14,0.3], [0.04,0.09,0.17]),
  make('gb-main', ['london','edinburgh'], ['rail'], 'GBP', '英国国家铁路 National Rail', 'https://www.nationalrail.co.uk/', 160, 135, [0.05,0.15,0.4], [0.04,0.15,0.4], { routeFactor: 1.2, note: '按英国城际列车估算，提前票、随到票与头等车厢差价较大。' }),
  make('ch-main', ['zurich','interlaken'], ['rail'], 'CHF', '瑞士联邦铁路 SBB', 'https://www.sbb.ch/en', 120, 85, [0.1,0.3,0.6], [0.15,0.4,0.75], { routeFactor: 1.5 }),
  make('eurostar', ['london','paris','brussels','amsterdam'], ['high-speed-rail'], 'EUR', 'Eurostar', 'https://www.eurostar.com/rw-en/destinations', 180, 90, [0.07,0.18,0.4], [0.05,0.13,0.25], { routeFactor: 1.35, stationMinutes: 120, minimumFare: 30, note: '按 Eurostar 网络估算，部分城市对需换乘；伦敦方向须核对出入境与提前到站要求。' }),
  make('us-northeast', ['boston','new-york','philadelphia','washington-dc'], ['high-speed-rail','rail'], 'USD', 'Amtrak', 'https://www.amtrak.com/train-routes', 115, 90, [0.13,0.3,0.65], [0.05,0.14,0.35], { fastLabel: 'Acela 快速列车', stationMinutes: 75, note: 'Acela 与 Northeast Regional 分开估算；不套用中国高铁速度或票价。' }),
  make('us-cascades', ['seattle','portland'], ['rail'], 'USD', 'Amtrak Cascades', 'https://www.amtrak.com/cascades-train', 100, 75, [0.1,0.2,0.4], [0.06,0.13,0.28], { stationMinutes: 75 }),
  make('us-surfliner', ['los-angeles','san-diego'], ['rail'], 'USD', 'Pacific Surfliner', 'https://www.pacificsurfliner.com/', 100, 70, [0.1,0.2,0.4], [0.08,0.16,0.3], { stationMinutes: 75 }),
];

// Selected busy city pairs use edited route/time anchors rather than straight
// line speed alone. These are rounded planning allowances, NEVER a timetable.
const ANCHORS = {
  'beijing|shanghai': { km: 1318, fast: 285, rail: 900 },
  'beijing|guangzhou': { km: 2298, fast: 510, rail: 1320 },
  'beijing|shenzhen': { km: 2400, fast: 555, rail: 1440 },
  'beijing|xian': { km: 1216, fast: 330, rail: 780 },
  'beijing|jinan': { km: 406, fast: 110, rail: 360 },
  'beijing|zhengzhou': { km: 693, fast: 180, rail: 570 },
  'beijing|wuhan': { km: 1229, fast: 275, rail: 690 },
  'beijing|harbin': { km: 1250, fast: 335, rail: 780 },
  'shanghai|hangzhou': { km: 169, fast: 65, rail: 150 },
  'shanghai|suzhou': { km: 85, fast: 35, rail: 90 },
  'shanghai|nanjing': { km: 301, fast: 100, rail: 255 },
  'guangzhou|shenzhen': { km: 102, fast: 45, rail: 110 },
  'guangzhou|hong-kong': { km: 142, fast: 65 },
  'hong-kong|shenzhen': { km: 40, fast: 25 },
  'chengdu|chongqing': { km: 308, fast: 105, rail: 270 },
  'dali|lijiang': { km: 159, fast: 100, rail: 165 },
  'changsha|zhangjiajie': { km: 350, fast: 150, rail: 330 },
  'haikou|sanya': { km: 308, fast: 140 },
  'kyoto|tokyo': { km: 514, fast: 145, rail: 510 },
  'osaka|tokyo': { km: 552, fast: 160, rail: 555 },
  'kyoto|osaka': { km: 43, fast: 20, rail: 35 },
  'fukuoka|hiroshima': { km: 281, fast: 75, rail: 340 },
  'hiroshima|osaka': { km: 342, fast: 100, rail: 390 },
  'sapporo|tokyo': { km: 1150, rail: 550 },
  'busan|seoul': { km: 417, fast: 165, rail: 300 },
  'kaohsiung|taipei': { km: 345, fast: 120, rail: 285 },
  'lyon|paris': { km: 465, fast: 130, rail: 300 },
  'marseille|paris': { km: 750, fast: 200, rail: 525 },
  'nice|paris': { km: 980, fast: 360, rail: 660 },
  'marseille|nice': { km: 224, fast: 165, rail: 175 },
  'barcelona|madrid': { km: 621, fast: 170 },
  'madrid|seville': { km: 472, fast: 165 },
  'granada|seville': { km: 285, fast: 165 },
  'lisbon|porto': { km: 336, rail: 185 },
  'edinburgh|london': { km: 632, rail: 285 },
  'new-york|washington-dc': { km: 362, fast: 185, rail: 215 },
  'boston|new-york': { km: 370, fast: 225, rail: 260 },
  'portland|seattle': { km: 300, rail: 215 },
  'los-angeles|san-diego': { km: 205, rail: 180 },
};
const cityId = city => city?.canonicalCityId || city?.id;
const anchorKey = (from, to) => [cityId(from), cityId(to)].sort().join('|');
// Normalize the small manually-maintained anchor table once, so author order
// never changes whether the reverse trip uses the same estimate.
const anchors = new Map(Object.entries(ANCHORS).map(([key, value]) => [key.split('|').sort().join('|'), value]));

export function railConnection(from, to, mode) {
  const fromId = cityId(from), toId = cityId(to);
  if (!fromId || !toId || fromId === toId) return null;
  const network = RAIL_NETWORKS.find(row => row.modes.includes(mode) && row.cities.includes(fromId) && row.cities.includes(toId));
  return network ? { ...network, anchor: anchors.get(anchorKey(from, to)), sourceUrl: network.sourceUrls?.[mode] || network.sourceUrl } : null;
}

export function railPlanningModel(from, to, distanceKm, mode) {
  const network = railConnection(from, to, mode);
  if (!network) return null;
  const fast = mode === 'high-speed-rail';
  const routeKm = network.anchor?.km || Math.max(1, distanceKm) * network.routeFactor;
  const rideMinutes = network.anchor?.[fast ? 'fast' : 'rail'] || routeKm / (fast ? network.fastSpeed : network.railSpeed) * 60 + (routeKm > 650 ? 45 : 15);
  const values = (fast ? network.fastRates : network.railRates).map(rate => Math.round(Math.max(network.minimumFare, routeKm * rate)));
  const modeLabel = fast ? network.fastLabel || (from.countryCode === 'JP' && to.countryCode === 'JP' ? '新干线' : '高铁 / 动车') : from.countryCode === 'CN' && to.countryCode === 'CN' ? '普速铁路' : '城际铁路';
  return {
    modeLabel, networkId: network.id, routeKm: Math.round(routeKm), rideMinutes: Math.ceil(rideMinutes / 15) * 15,
    stationMinutes: network.stationMinutes, estimatedMinutes: Math.ceil((rideMinutes + network.stationMinutes) / 15) * 15,
    values, nativeCurrency: network.currency, sourceUrl: network.sourceUrl, sourceName: `${network.sourceName} · 编辑预算`,
    checkedAt: RAIL_REVIEWED_AT,
    note: `${network.note || ''} 路程、换乘和票价为编辑估算；${network.anchor ? '部分路段采用取整行程参考' : '按路网绕行系数及平均速度预留'}，不是实时车次、余票或已确认直达列车。经济 / 舒适 / 高端是预算区间，不保证每趟列车提供对应席别；两端车站接驳另计。`,
  };
}
