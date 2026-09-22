/** Curated public-source expansion. Run after reviewing the evidence in docs/experience-expansion-asia-africa.md. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveExperienceSelections } from '../shared/experiences.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATE = '2026-09-22';
const cities = JSON.parse(await fs.readFile(path.join(ROOT, 'data/cities.json'), 'utf8'));
const byId = new Map(cities.map(city => [city.id, city]));
const entries = [];
const LOCATION_NOTE = '坐标为经营场所或集合区域的近似参考位置，未经门牌级测绘；请按官方地址与预订确认单导航。';
const ESTIMATE_NOTE = '编辑预算区间，未获得指定日期的可订含税报价；并非经营者承诺的套餐或房价，实际供应、税费、服务费与取消条款请向经营者核对。';
function option(id, name, low, high, currency, extra = {}) {
  const type = extra.type || 'estimate';
  return { id, name, description: name, low, high, currency, unit: 'person', type, checkedAt: type === 'official' ? DATE : null, note: type === 'official' ? '经营者公开参考价；尚未查询所选日期余位，最终收费及条件以预订确认页为准。' : ESTIMATE_NOTE, includes: [name], excludes: ['未列明的额外消费', '前往集合地点的交通'], ...extra };
}
function add(cityId, kind, key, data) {
  const entry = {
    id: `ex-aa-${cityId}-${key}`, cityId, kind, sourceCheckedAt: DATE, checkedAt: DATE,
    coordinateBasis: 'approximate-venue', coordinateAccuracy: 'approximate', locationNote: LOCATION_NOTE,
    durationMinutes: kind === 'hotel' ? 0 : kind === 'restaurant' ? 90 : 180,
    requirements: ['请提前确认日期、营业时段、人数与取消条件'],
    availabilityNote: `资料核对日期：${DATE}。尚未查询实际房态、座位或库存。${LOCATION_NOTE}`,
    ...data,
  };
  entry.bookingUrl ||= entry.sourceUrl;
  entry.nameEn ||= entry.name;
  entry.tagline ||= entry.description;
  entry.evidence = { sourceType: entry.sourceType || 'operator-official', sourceUrl: entry.sourceUrl, checkedAt: DATE, scope: 'venue-and-service', summary: entry.evidenceSummary || entry.description };
  delete entry.evidenceSummary;
  entry.priceOptions = entry.priceOptions.map(o => ({ sourceUrl: entry.sourceUrl, ...o }));
  entries.push(entry);
  return entry;
}
// All room values below are deliberate editorial budgets, never scraped live room rates.
const hotelRows = [
 ['hanoi','metropole','河内索菲特传奇大都会酒店','Sofitel Legend Metropole Hanoi','https://www.sofitel-legend-metropole-hanoi.com/','15 Ngo Quyen, Hoan Kiem, Hanoi',21.026,105.857,[6500000,11000000],[11000000,20000000],['历史酒店','还剑湖周边','庭院空间']],
 ['ho-chi-minh-city','park-hyatt','西贡柏悦酒店','Park Hyatt Saigon','https://www.hyatt.com/park-hyatt/en-US/saiph-park-hyatt-saigon','2 Lam Son Square, Ho Chi Minh City',10.777,106.704,[6500000,11000000],[11000000,22000000],['歌剧院周边','法式建筑元素','城市度假']],
 ['hoi-an','anantara','会安安纳塔拉度假酒店','Anantara Hoi An Resort','https://www.anantara.com/en/hoi-an','1 Pham Hong Thai, Hoi An',15.877,108.336,[5000000,9000000],[9000000,16000000],['秋盆河畔','花园','古城步行圈']],
 ['da-nang','furama','岘港富丽华度假酒店','Furama Resort Danang','https://furamavietnam.com/','103–105 Vo Nguyen Giap, Da Nang',16.04,108.252,[3500000,6500000],[6500000,13000000],['海滨度假','热带花园','越南建筑元素']],
 ['luang-prabang','satri-house','萨特里别院','Satri House','https://satrihouse.com/wp-content/uploads/2022/12/Compendium-.pdf','Ban That Luang, Luang Prabang',19.882,102.131,[3500000,6000000],[6000000,10500000],['传统宅院','老挝艺术','庭院泳池']],
 ['siem-reap','sala-lodges','Sala Lodges 高棉木屋','Sala Lodges','https://www.salalodges.com/','498 Sala Kamreuk, Siem Reap',13.347,103.864,[180,320],[320,500],['修复高棉木屋','高脚建筑','热带花园']],
 ['kuala-lumpur','traders','吉隆坡盛贸饭店','Traders Hotel Kuala Lumpur','https://www.shangri-la.com/kualalumpur/traders/','Kuala Lumpur City Centre',3.153,101.714,[500,850],[850,1400],['KLCC公园周边','城市天际线','双子塔区域']],
 ['penang','eastern-oriental','槟城东方大酒店','Eastern & Oriental Hotel','https://www.eohotels.com/dinings/','10 Lebuh Farquhar, George Town, Penang',5.423,100.336,[850,1500],[1500,2700],['乔治市历史酒店','海滨长廊','套房住宿']],
 ['langkawi','danna','兰卡威丹纳酒店','The Danna Langkawi','https://www.thedanna.com/','Telaga Harbour Park, Pantai Kok, Langkawi',6.366,99.68,[1500,2500],[2500,4800],['私人海滩区域','庭院建筑','Pantai Kok']],
 ['cebu','shangrila-mactan','宿务麦克坦香格里拉','Shangri-La Mactan, Cebu','https://www.shangri-la.com/cebu/mactanresort/about/','Punta Engaño Road, Lapu-Lapu, Cebu',10.307,124.021,[12000,21000],[21000,35000],['麦克坦海湾','海洋保护区','热带花园']],
 ['taipei','grand-hyatt','台北君悦酒店','Grand Hyatt Taipei','https://www.hyatt.com/grand-hyatt/en-US/taigh-grand-hyatt-taipei?src=corp_lclb_google_seo_taigh','台北市信义区松寿路2号',25.036,121.562,[6500,11000],[11000,19000],['信义商圈','台北101周边','城市酒店']],
 ['kathmandu','dwarikas','德瓦里卡酒店','The Dwarika’s','https://dwarikas.com/thedwarikas/','Battisputali, Kathmandu',27.706,85.344,[35000,60000],[60000,100000],['尼瓦尔工艺','雕花木构件','庭院住宿']],
 ['jaipur','samode-haveli','萨莫德哈维利宅邸酒店','Samode Haveli','https://samode.com/samode-haveli/','Gangapole, Jaipur',26.935,75.835,[16000,28000],[28000,45000],['拉贾斯坦宅邸','手绘壁画','老城庭院']],
 ['colombo','galle-face','加勒菲斯酒店','Galle Face Hotel','https://gallefacehotel.com/history/','2 Galle Road, Colombo 3',6.92,79.845,[40000,75000],[75000,125000],['海滨历史酒店','Galle Face Green旁','殖民时期建筑']],
 ['kandy','kings-pavilion','康提国王亭阁酒店','Kings Pavilion Kandy','https://www.kingspavilion.com/','4/22 Galkanda Road, Aniwatta, Kandy',7.293,80.619,[60000,100000],[100000,170000],['山景','小型精品酒店','花园空间']],
 ['cape-town','mount-nelson','尼尔森山贝尔蒙德酒店','Mount Nelson, A Belmond Hotel','https://www.belmond.com/en/hotels/africa/south-africa/mount-nelson-cape-town','76 Orange Street, Gardens, Cape Town',-33.933,18.415,[12000,21000],[21000,36000],['粉色历史建筑','桌山脚下','花园酒店']],
 ['marrakech','maison-arabe','阿拉伯之家庭院酒店','La Maison Arabe','https://www.cenizaro.com/lamaisonarabe/marrakech','1 Derb Assehbe, Bab Doukkala, Marrakech',31.631,-7.995,[2500,4500],[4500,8000],['麦地那庭院','摩洛哥装饰','烹饪学校']],
 ['cairo','mena-house','开罗米娜宫万豪酒店','Marriott Mena House, Cairo','https://www.marriott.com/en-gb/en-us/hotels/caimn-marriott-mena-house-cairo/overview/','Pyramids Road, Giza',29.986,31.135,[15000,25000],[25000,40000],['吉萨金字塔周边','花园','历史酒店']],
 ['zanzibar','emerson-spice','Emerson Spice 石头城酒店','Emerson Spice','https://emersonzanzibar.com/','Stone Town, Zanzibar',-6.162,39.191,[400000,700000],[700000,1100000],['修复商人宅邸','石头城','特色客房']],
 ['mauritius','royal-palm','皇家棕榈 Beachcomber 酒店','Royal Palm Beachcomber Luxury','https://www.beachcomber-hotels.com/en/hotel/royal-palm-beachcomber-luxury','Grand Baie, Mauritius',-20.005,57.581,[35000,60000],[60000,110000],['大湾海滩','套房酒店','毛里求斯海滨']],
];
const hotelByCity = new Map();
for (const [cityId,key,name,nameEn,sourceUrl,address,lat,lng,base,upgrade,features] of hotelRows) {
  const currency = byId.get(cityId).currency;
  const hotel = add(cityId,'hotel',key,{name,nameEn,provider:nameEn,sourceUrl,address,lat,lng,features,
    description:`在${features[0]}的环境中停留，适合希望把住宿本身纳入旅行体验的旅客。`,
    evidenceSummary:'经营者官网确认酒店身份、所在地与特色；未查询日期、房型库存或实时房价。',
    priceOptions:[
      option('room-budget','双人住宿·客房预算',...base,currency,{unit:'room-night',includes:['一间客房一晚的住宿预算；入住人数上限向酒店确认'],excludes:['早餐、加床和接送，除非最终房价条款明确含有','地方税、服务费或旅游附加费，以酒店结算页为准']}),
      option('upgrade-budget','升级空间或景观·预算',...upgrade,currency,{unit:'room-night',includes:['升级空间或景观的客房预算；具体房型需询价'],excludes:['套房或景观不作保证，以实际预订房型为准','未列明的早餐、加床、税费与接送']})
    ]});
  hotelByCity.set(cityId,hotel);
}
const restaurants = [
 ['hanoi','spice-garden','Spice Garden 越南餐厅','Spice Garden','https://www.sofitel-legend-metropole-hanoi.com/dining/spice-garden/','越南区域风味与当代演绎',[650000,1100000],[1200000,2200000]],
 ['ho-chi-minh-city','square-one','Square One 餐厅','Square One','https://www.hyatt.com/park-hyatt/en-US/saiph-park-hyatt-saigon/dining','法式料理与越南风味',[800000,1400000],[1500000,2800000]],
 ['hoi-an','riverside','会安河畔餐厅','Hoi An Riverside Restaurant','https://www.anantara.com/uploads/minor/anantara/documents/anantara-hoi-an-resort/hotel-info/anantara_hoi-an_resort_resort_factsheet_2026.pdf','秋盆河畔的会安及越南中部菜肴',[450000,800000],[850000,1500000]],
 ['da-nang','don-cipriani','Don Cipriani’s 意式餐厅','Don Cipriani’s','https://furamavillasdanang.com/vi/culinary/','意式面食与海鲜料理',[450000,800000],[850000,1500000]],
 ['luang-prabang','tamarind','Tamarind 老挝餐厅','Tamarind Restaurant','https://www.tamarindlaos.com/','南康河旁的老挝地方食材',[180000,320000],[350000,600000]],
 ['siem-reap','ma-om','Ma Om 高棉餐厅','Ma Om Restaurant','https://www.salalodges.com/','花园中的当代高棉料理',[15,28],[30,55]],
 ['kuala-lumpur','gobo','Gobo Chit Chat','Gobo Chit Chat','https://www.shangri-la.com/kualalumpur/traders/dining/restaurants/gobo-chit-chat/','马来西亚与国际菜肴',[70,130],[140,230]],
 ['penang','sarkies','Sarkies 自助餐厅','Sarkies','https://www.eohotels.com/dinings/','马来西亚和国际风味自助餐',[130,190],[190,280]],
 ['langkawi','planters','Planter’s 餐厅','Planter’s','https://www.thedanna.com/dine/planters','亚洲与欧洲风味晚餐',[150,250],[260,450]],
 ['cebu','cowrie-cove','Cowrie Cove 海滨餐厅','Cowrie Cove Seafood Bar & Grill','https://www.shangri-la.com/cebu/mactanresort/dining/restaurants/cowrie-cove/','海湾边的海鲜与炭烤料理',[1800,3000],[3200,5200]],
 ['taipei','yun-jin','云锦中餐厅','Yun Jin','https://www.hyatt.com/grand-hyatt/en-US/taigh-grand-hyatt-taipei?src=corp_lclb_google_seo_taigh','川沪京等区域中餐',[1200,2000],[2200,3800]],
 ['kathmandu','krishnarpan','Krishnarpan 尼泊尔品鉴餐厅','Krishnarpan','https://dwarikas.com/thedwarikas/dining/krishnarpan','六道至多道的尼泊尔慢餐体验',[8000,13000],[14000,22000]],
 ['jaipur','samode-dining','Samode Haveli 宅邸餐厅','Samode Haveli Dining','https://samode.com/samode-haveli-dining-adventures/','拉贾斯坦地方菜与庭院用餐',[1800,3000],[3200,5500]],
 ['colombo','1864','1864 Limited Edition','1864 Limited Edition','https://gallefacehotel.com/dining/1864-limited-edition/','斯里兰卡食材与当代融合料理',[5000,7500],[9000,16000]],
 ['kandy','kings-dining','Kings Pavilion 山景餐厅','Kings Pavilion Dining','https://www.kingspavilion.com/dining/','山景中的斯里兰卡咖喱与国际料理',[6000,9500],[10000,16000]],
 ['cape-town','oasis','Oasis 花园餐厅','Oasis Restaurant','https://www.belmond.com/en/hotels/africa/south-africa/mount-nelson-cape-town/restaurants-and-bars','花园与泳池旁的当季料理',[450,750],[800,1300]],
 ['marrakech','trois-saveurs','Les Trois Saveurs','Les Trois Saveurs','https://www.cenizaro.com/lamaisonarabe/marrakech/dining/les-trois-saveurs','摩洛哥、法国与亚洲风味',[350,550],[600,950]],
 ['cairo','139-pavilion','139 Pavilion 花园餐厅','139 Pavilion','https://www.marriott.com/en-us/hotels/caimn-marriott-mena-house-cairo/dining/','吉萨花园中的国际料理',[1600,2800],[3000,5000]],
 ['zanzibar','hurumzi-tea','Emerson on Hurumzi 屋顶茶屋','Emerson on Hurumzi Tea House','https://emersonzanzibar.com/restaurants-in-stone-town/emerson-on-hurumzi-tea-house-restaurant/','石头城屋顶的斯瓦希里风味',[80000,130000],[130000,210000]],
 ['mauritius','goelette','La Goélette 海景餐厅','La Goélette','https://www.beachcomber-hotels.com/en/restaurants-grand-baie','大湾海景中的当地食材与精致料理',[2500,4000],[4500,7000]],
];
for(const [cityId,key,name,nameEn,sourceUrl,specialty,basic,extended] of restaurants){
  const hotel=hotelByCity.get(cityId),currency=byId.get(cityId).currency;
  const ownLocation=cityId==='luang-prabang'?{address:'Ban Wat Sene, Nam Khan riverfront, Luang Prabang',lat:19.893,lng:102.14}:cityId==='zanzibar'?{address:'Emerson on Hurumzi, Stone Town, Zanzibar',lat:-6.16,lng:39.19}:{};
  const dinnerOnly=['hoi-an','langkawi','cebu','kathmandu','zanzibar','mauritius'].includes(cityId);
  add(cityId,'restaurant',key,{name,nameEn,provider:cityId==='luang-prabang'?'Tamarind':cityId==='zanzibar'?'Emerson Zanzibar':hotel.provider,sourceUrl,address:hotel.address,lat:hotel.lat,lng:hotel.lng,...ownLocation,description:specialty,features:[specialty,'可查看经营者菜单','用餐预算可选'],mealType:'dinner',evidenceSummary:`官网确认${nameEn}提供${specialty}；两档金额为编辑用餐预算，未声称经营者出售同名套餐。`,
    priceOptions:[option('simple-meal','日常点餐或基础菜单·预算',...basic,currency,{mealTypes:dinnerOnly?['dinner']:['lunch','dinner'],includes:['按一人份主菜或基础菜单预留预算'],excludes:['酒水、额外加点','菜单税费、服务费及人数限制，需另行核价']}),option('extended-meal','多道菜或升级食材·预算',...extended,currency,{mealTypes:['dinner'],includes:['按一人份多道菜或升级食材预留预算'],excludes:['配酒、额外加点','菜单税费、服务费及人数限制，需另行核价']})]
  });
  if(cityId==='penang'){
    const meal=entries.at(-1);
    meal.priceOptions[0].name=meal.priceOptions[0].description='自助餐用餐·预算';
    meal.priceOptions[0].includes=['一位成人自助餐的编辑预算；实际日期菜单需确认'];
    meal.priceOptions[1].name=meal.priceOptions[1].description='自助餐与额外饮品·预算';
    meal.priceOptions[1].includes=['一位成人自助餐及额外饮品的编辑预算'];
    meal.priceOptions[1].excludes=['高档酒水、未列明额外点单','税费及服务费以当日菜单为准'];
  }
}

const activity = (cityId,key,name,provider,sourceUrl,address,lat,lng,durationMinutes,description,priceOptions,extra={}) => add(cityId,'experience',key,{name,provider,sourceUrl,address,lat,lng,durationMinutes,description,features:extra.features||[provider,'按日期预约'],priceOptions,...extra});
const official = (id,name,amount,currency,extra={}) => option(id,name,amount,amount,currency,{type:'official',...extra});

activity('hanoi','thang-long-puppets','升龙水上木偶剧','Thang Long Water Puppet Theatre','https://vietnam.travel/node/1299','57B Dinh Tien Hoang, Hoan Kiem, Hanoi',21.032,105.854,75,'在还剑湖畔观看水上木偶与传统音乐；时长含提前入场的规划缓冲。',[
 option('standard','普通座席·预算',150000,200000,'VND',{includes:['一场成人演出门票预算']}),option('preferred-seat','较优座席·预算',200000,300000,'VND',{includes:['较优区域成人演出门票预算']})
],{bookingUrl:'https://nhahatmuaroithanglong.vn/en/',sourceType:'tourism-official',preferredStartTime:'18:00',evidenceSummary:'越南国家旅游官网明确列出升龙水上木偶剧院；未取得可核实的当日座位价，金额保留估算。'});
activity('ho-chi-minh-city','saigon-princess','Saigon Princess 西贡河晚餐游船','Saigon Princess','https://www.saigonprincess.com.vn/ticket/set-menu-2026-s41449t2','Saigon river boarding pier；具体登船点按确认单',10.768,106.707,180,'沿西贡河欣赏城市夜景并用晚餐；预留登船检查时间。',[
 option('dinner','晚餐航程·预算',1600000,2200000,'VND',{includedMeals:['dinner'],includes:['游船航程与晚餐预算'],excludes:['酒水、酒店接送、升级座位']}),option('upgraded-dinner','升级晚餐·预算',2300000,3500000,'VND',{includedMeals:['dinner'],includes:['游船航程与升级餐饮预算'],excludes:['酒水、酒店接送；实际菜单需核实']})
],{preferredStartTime:'18:30',evidenceSummary:'经营者2026套餐页和Daily Cruising页确认西贡河晚餐航程；菜单图片未转写为确定价格。'});
activity('hoi-an','spice-spoons','Spice Spoons 越南烹饪课','Anantara Hoi An Resort','https://www.anantara.com/vi/hoi-an/restaurants/spice-spoons','Anantara Hoi An Resort, 1 Pham Hong Thai',15.877,108.336,240,'在厨师带领下制作越南菜，午餐品尝自己的作品，并带回食谱。',[
 option('cooking','烹饪与午餐·预算',1800000,3000000,'VND',{includedMeals:['lunch'],includes:['烹饪教学、食材及自制午餐预算'],excludes:['酒店接送','特殊食材或定制菜单升级']})
],{preferredStartTime:'09:00',evidenceSummary:'Anantara官方Spice Spoons页确认按需开班、逐步教学与自制午餐；价格与四小时预算时长待经营者确认。'});
activity('da-nang','ba-na-combo','巴拿山缆车与山顶体验','Sun World Ba Na Hills','https://sunworld.vn/en/banahills/sunworld-news/price-list-tickets-services-sun-world-ba-na-hills-year-2026-19796','Hoa Ninh, Hoa Vang, Da Nang；山脚缆车站',15.996,107.99,360,'乘往返缆车到山顶，在金桥、法国村与园内活动之间自由安排。',[
 official('non-local-adult','非本地成人基础票',1000000,'VND',{includes:['往返缆车','基础票列明的园内景点及演出'],excludes:['岘港市区往返交通','餐饮','酒窖、部分互动区及另收费游乐项目']})
],{preferredStartTime:'09:00',availabilityNote:'这是巴拿山基础票体验。若同时选择景点库中的巴拿山/金桥，请只保留一份门票预算；不含岘港市区接送。2026多日权益有换票和人脸登记条件，需按官网办理。'});
activity('luang-prabang','tamarind-cooking','Tamarind 老挝烹饪课','Tamarind','https://www.tamarindlaos.com/cookingschool','Tamarind Restaurant, Ban Wat Sene；在市内餐厅集合后赴郊外课堂',19.893,102.14,330,'从食材认识到亲手烹饪，在市内餐厅集合，再前往郊外课堂。',[
 official('daytime','日间市场与烹饪课',40,'USD',{durationMinutes:330,preferredStartTime:'09:00',includedMeals:['lunch'],includes:['市场体验','五道菜与糯米饭教学','自制午餐、食谱','餐厅至课堂的往返交通'],excludes:['酒店至市内餐厅交通','加点饮品']}),
 official('evening','傍晚烹饪课',34,'USD',{durationMinutes:270,preferredStartTime:'16:00',includedMeals:['dinner'],includes:['四道菜与糯米饭教学','自制晚餐、食谱','餐厅至课堂往返交通'],excludes:['酒店至市内餐厅交通','市场参观']}),
 official('private-master','私人进阶课·每组1–4人',300,'USD',{unit:'booking',partyCapacity:4,maxParticipants:4,durationMinutes:300,preferredStartTime:'09:30',includedMeals:['lunch'],includes:['私人烹饪教学与自制午餐','餐厅至课堂往返交通'],excludes:['酒店至市内餐厅交通']})
],{evidenceSummary:'现行课程页列40USD日课、34USD晚课、300USD/1–4人私人课；食谱与课堂交通含在内，酒店接送不含。'});
activity('siem-reap','phare','Phare 柬埔寨马戏演出','Phare, The Cambodian Circus','https://pharecircus.org/tickets/','Ring Road 与 Sok San Road 交界，Siem Reap',13.355,103.836,90,'用杂技、戏剧与现场音乐讲述柬埔寨故事；演出约一小时，另预留入场时间。',[
 official('section-c','C区成人自由席',18,'USD',{includes:['侧面C区自由席'],excludes:['部分座位可能视线受阻','晚餐、接送']}),official('section-b','B区成人自由席',28,'USD',{includes:['中区后半部自由席'],excludes:['晚餐、接送']}),official('section-a','A区成人预留席',38,'USD',{includes:['中区前半部预留席','官方列明纪念品'],excludes:['晚餐、接送']})
],{preferredStartTime:'19:30',requirements:['成人价适用12岁及以上；儿童票需另查','场次与节目以演出日历为准']} );
activity('kuala-lumpur','jadi-batek','Jadi Batek 蜡染手作','Jadi Batek','https://jadibatek.com/product/batik-drawing-coloring-class-at-jadi-batek-gift-voucher/','Jadi Batek Gallery, Kuala Lumpur；具体分店由预约确认',3.144,101.715,120,'用蜡笔工具描线并上色，制作可带走的马来西亚蜡染作品。',[
 official('cotton','30×40厘米棉布蜡染券',78,'MYR',{includes:['棉布、蜡染材料与指导'],excludes:['酒店接送','寄送或额外商品'],note:'官网电子体验券价；购买后3个月内有效，须预约实体课堂。'}),official('silk','30×40厘米真丝蜡染券',98,'MYR',{includes:['Habutai真丝材料与指导'],excludes:['酒店接送','寄送或额外商品'],note:'官网电子体验券价；购买后3个月内有效，须预约实体课堂。'})
]);
activity('penang','spice-garden-cooking','Tropical Spice Garden 香料烹饪课','Tropical Spice Garden','https://tropicalspicegarden.com/home/cook/','Lot 595 Mukim 2, Jalan Teluk Bahang, Penang',5.464,100.229,270,'在热带香料园的厨房学习地方菜，认识香料与食材。',[
 option('cooking','半日烹饪课·预算',260,400,'MYR',{includes:['课程、食材与自制菜品预算'],excludes:['乔治市往返交通','完整正餐、额外饮品；园区门票是否包含需确认']})
],{preferredStartTime:'09:00',evidenceSummary:'官网COOK页面确认园内烹饪学校；具体日期菜单、最终价格、课堂时长及含餐范围需预订确认。'});
activity('langkawi','skytrail','SkyTrail 雨林向导徒步','Panorama Langkawi','https://panoramalangkawi.com/skytrail/','SkyCab售票柜台, Oriental Village, Langkawi',6.371,99.672,180,'跟随自然向导走入玛琼山雨林，按体力选择中站到峰顶或从山脚上行。',[
 official('beginner','入门路线·约2小时',180,'MYR',{durationMinutes:180,includes:['自然向导徒步','SkyCab Express Lane缆车票'],excludes:['酒店接送','餐食','另收费景点']}),official('intermediate','中级路线·约3–4小时',230,'MYR',{durationMinutes:270,includes:['从Oriental Village到中站的向导徒步','SkyCab Express Lane缆车票'],excludes:['酒店接送','餐食']}),official('challenging','挑战路线·约4–5小时',280,'MYR',{durationMinutes:330,includes:['从Oriental Village到峰顶的向导徒步','SkyCab Express Lane缆车票'],excludes:['酒店接送','餐食']})
],{preferredStartTime:'09:30',availabilityNote:'官网徒步时长之外另预留约一小时集合和缆车缓冲，已计入规划用时。已含SkyCab快线票，请勿重复选择同日SkyCab门票。天气和体力条件须向运营方确认。'});
activity('cebu','sidive-discover','SiDive 麦克坦体验潜水','SiDive','https://www.sidive.com/course/padi-discover-scuba-diving/','Kontiki Marina, Mactan, Cebu',10.283,124.0,180,'先学习基础技巧，再由教练陪同进行一次海中体验潜水；这不是完整潜水执照课程。',[
 official('join-two','两人以上参加·每人含电子教材',3450,'PHP',{minParticipants:2,includes:['体验潜水、装备与教练','PADI DSD电子教材350PHP'],excludes:['酒店接送','另收费的体验证书'],note:'官方3100PHP/人（至少2人）+350PHP电子教材，共3450PHP/人。'}),official('private','一对一体验·含电子教材',3650,'PHP',{maxParticipants:1,includes:['一对一体验潜水、装备与教练','电子教材350PHP'],excludes:['酒店接送','另收费的体验证书'],note:'官方一对一3300PHP+350PHP电子教材，共3650PHP。'})
],{requirements:['需符合经营者入水与健康条件并填写要求的表格','潜水后乘机间隔须遵守经营者要求，避免安排在临近航班前']} );
activity('taipei','cookinn','Cookinn 小笼包与牛肉面课程','Cookinn Taiwan','https://cookinn.tw/zh/signature-taiwanese-dumplings-and-noodles/','台北中山或西门教室；教室地址以课前通知为准',25.053,121.517,180,'亲手制作小笼包，学习台湾经典面点与牛肉面的料理方式。',[
 official('signature','小笼包牛肉面课·成人参考价',2650,'TWD',{includedMeals:['lunch'],includes:['指定烹饪课程与食材','自制午餐、珍珠奶茶与食谱'],excludes:['接送','私人包班升级'],note:'官方具体课程页明确NTD2650/人，周二、三、四、六09:30–12:30含午餐；是该课程公开参考价，不是任意日期可订承诺。'})
],{preferredStartTime:'09:30',bookingUrl:'https://cookinntaiwan.rezio.shop/zh-TW',requirements:['课程页列周二、三、四、六，生成日期后需核对是否开班','有最低成班人数要求；报名人数不足时经营者可能改期或退款','台北有中山和西门两间教室，请按课前通知导航'],evidenceSummary:'具体课程官网明确2650TWD/人、周二三四六09:30–12:30含午餐；采用具体课程价格，不把列表页“2650起”当作全课程固定价。'});
activity('kathmandu','nepal-cooking','Nepal Cooking School 尼泊尔家常菜','Nepal Cooking School','https://www.nepalcookingschool.com.np/bookings/','Kathmandu；集合地址由学校确认',27.717,85.31,240,'认识尼泊尔食材，并在课堂中练习当地家常菜；菜单与集合安排按日期确认。',[
 option('class','尼泊尔烹饪体验·预算',4000,6500,'NPR',{includes:['课程与食材预算'],excludes:['接送、饮品及额外课程','是否含完整正餐需按菜单核实']})
],{evidenceSummary:'学校官方预订页确认加德满都实体与每日课程；页面报价未得到可靠读取，保留编辑预算。'});
activity('jaipur','skywaltz','SkyWaltz 斋浦尔热气球','SkyWaltz Balloon Safari','https://www.skywaltz.com/ticket-options/','Jaipur周边；起飞点随天气与当天运行安排变化',27.0,75.85,300,'清晨从空中观看斋浦尔周边乡村与地貌；预留起飞准备及集合交通的时间。',[
 official('foreign-adult','外国成人共享热气球',325,'USD',{includes:['外国成人热气球体验','官网列明税费','飞行纪念证书'],excludes:['未明确包含的接送、额外服务'],note:'官网Jaipur Foreign National成人价325USD，含税；印度国籍优惠价不适用于外国旅客。'})
],{preferredStartTime:'06:00',requirements:['天气允许才起飞；集合时间与交通范围按经营者确认','报价适用外国成人；儿童、国籍与身体条件另核'],evidenceSummary:'经营者Ticket Options明确Jaipur外国成人325USD含税；不是印度居民14990INR未税价。'});
activity('colombo','colombo-walks','Colombo Walks 老城步行','Colombo Walks','https://www.colombowalks.com/booknow','Dutch Hospital Precinct入口，Colombo 1',6.934,79.844,180,'从荷兰医院区出发，沿城市街巷认识科伦坡历史与日常生活。',[
 option('guided-walk','向导步行与简餐·预算',6000,11000,'LKR',{includedMeals:['lunch'],includes:['向导步行与官网所述简餐预算'],excludes:['酒店接送','未列明的景点门票'],note:'官网同页同时列4000LKR与27USD起，隐含汇率明显陈旧；仅核实活动身份与约2.5–3小时内容，不把该金额视作当前可靠官方价。'})
],{preferredStartTime:'11:00',evidenceSummary:'官网列Dutch Hospital集合、每日6:45/11:00/16:00、约2.5–3小时与简餐；币种对照陈旧，因此全部按预算而非官方现价。'});
activity('kandy','lake-club-dance','Kandy Lake Club 康提舞蹈','Kandy Lake Club','https://www.kandylakeclubdance.com/aboutus.php','Kandy Lake Club，康提湖区域',7.293,80.644,90,'用一场舞蹈与鼓乐演出认识斯里兰卡传统表演，另留入场缓冲。',[
 official('adult','成人演出门票',4500,'LKR',{includes:['康提文化舞蹈演出门票'],excludes:['接送','餐饮']})
],{preferredStartTime:'16:30',availabilityNote:'官方通常17:00开演，规划16:30到场；节庆期间场次可能变化，按确认单调整。'});
activity('cape-town','city-sightseeing','开普敦 City Sightseeing 观光巴士','City Sightseeing South Africa','https://citysightseeing.co.za/en/cape-town/cape-town-specials','V&A Waterfront两洋水族馆外或81 Long Street',-33.908,18.418,240,'用敞篷观光巴士连接市区和半岛线路；四小时为自由选择的一段使用时长，并非完整路线保证。',[
 official('classic-online','Classic一日成人·官网促销参考',345,'ZAR',{includes:['Classic一日线路通票'],excludes:['桌山缆车与沿途另收费景点','餐食'],note:'官方Specials页列网上成人345ZAR、柜台常规365ZAR；未查询日期库存，线上活动可变。'}),official('classic-counter','Classic一日成人·柜台参考',365,'ZAR',{includes:['Classic一日线路通票'],excludes:['缆车、景点门票、餐饮']})
],{evidenceSummary:'官网当前Specials页成人345/365ZAR；未采用产品JSON-LD中已过期的299ZAR报价。'});
activity('marrakech','marrakech-by-air','Marrakech By Air 热气球','Marrakech By Air','https://marrakechbyair.com/fr/flights','Marrakech周边；起飞与集合地点以确认单为准',31.75,-7.95,300,'清晨乘共享热气球观看马拉喀什周边平原；用时含运营准备的编辑缓冲。',[
 official('classic','经典共享飞行·成人',2050,'MAD',{includes:['经典共享热气球飞行'],excludes:['接送、早餐及其他服务以所订套餐确认'],note:'官网列2050MAD/200EUR每人；保留经营者MAD标价，不将两种币价解释为实时汇率。'})
],{preferredStartTime:'06:00',requirements:['天气与空域允许才起飞','接送、早餐和取消条款须在预订时确认']} );
activity('cairo','walk-like-egyptian','Walk Like an Egyptian 开罗文化步行','Walk Like an Egyptian','https://walklikeanegyptian.com/','Cairo；定制路线集合点由运营方确认',30.048,31.244,180,'与文化向导步行认识开罗街区；可以按兴趣询问历史建筑与城市生活路线。',[
 option('private-four','私人步行向导·最多4人预算',6000,12000,'EGP',{unit:'booking',partyCapacity:4,maxParticipants:4,includes:['一组最多4人的文化向导预算'],excludes:['景点门票','交通、餐食、特别开放申请费用'],note:`${ESTIMATE_NOTE} 此处4人是应用预算分摊假设，需由经营者确认接待与整组报价。`})
],{evidenceSummary:'经营者官网确认开罗步行、私人定制与小团文化游；未取得固定路线的公开报价。'});
activity('zanzibar','safari-blue','Safari Blue 桑给巴尔海上体验','The Original Safari Blue','https://safariblue.net/','Fumba出发，Zanzibar；集合点按预订确认',-6.317,39.28,420,'乘传统帆船探索海湾，随向导浮潜并享用岛上午餐；酒店到码头的交通另计。',[
 official('original-adult','Original Experience成人',85,'USD',{includedMeals:['lunch'],includes:['共享帆船行程','浮潜装备与向导','活动内餐食及饮料'],excludes:['酒店到出发码头交通'],note:'官方成人价85USD（15岁及以上）；不把船上全包误解为酒店接送。'}),official('private-two','私人帆船·两人整船',550,'USD',{unit:'booking',partyCapacity:2,maxParticipants:2,includedMeals:['lunch'],includes:['两人的私人帆船与船员','私人午餐、浮潜及官网列明服务'],excludes:['酒店至码头交通','第3人起额外费用'],note:'官网550USD含2人，额外客人85USD/人。此方案限制为最多2人，更多人数需重新询价。'})
]);
activity('mauritius','blue-safari-submarine','Blue Safari 观光潜艇','Blue Safari Mauritius','https://blue-safari.com/submarine/','Trou aux Biches北岸，Mauritius；上船点以确认单为准',-20.039,57.544,150,'乘观光潜艇从舷窗观察水下景观；无需把该项目当成水肺潜水课程。',[
 option('submarine','成人观光潜艇·预算',5500,7500,'MUR',{includes:['共享观光潜艇舱位预算'],excludes:['酒店接送','额外摄影、餐饮及其他活动']})
],{evidenceSummary:'运营方Submarine页面确认观光潜艇活动；未沿用旧Press Kit或第三方促销价作为现行官方价。'});

activity('bangkok','silom-cooking','Silom Thai Cooking 泰菜课堂','Silom Thai Cooking School','https://silomthaicooking.com/2018/main/','6/14 Decho Road, Bangrak, Bangkok',13.725,100.525,200,'亲手做泰菜、咖喱酱与甜点；上午课包含市场体验，晚间课程在课堂内认识食材。',[
 official('morning','上午市场与烹饪课',1200,'THB',{preferredStartTime:'09:00',durationMinutes:200,includedMeals:['lunch'],includes:['食材、茶点与烹饪教学','自制菜品','上午市场体验'],excludes:['酒店接送'],note:'官网1200THB，注明现金支付；上午09:00–12:20，菜式随星期轮换。'}),official('evening','晚间烹饪课',1200,'THB',{preferredStartTime:'18:00',durationMinutes:180,includedMeals:['dinner'],includes:['食材、茶点与烹饪教学','自制晚餐'],excludes:['酒店接送','实体市场参观'],note:'官网1200THB，现金支付；晚课18:00–21:00，在课堂认识食材，不含实体市场参观。'})
],{maxParticipants:10});
activity('bangkok','wat-pho-massage','卧佛寺传统泰式按摩','Wat Po Thai Traditional Medical School','https://watpho.com/en/contact/plan','Wat Pho, Sanam Chai Road, Bangkok',13.747,100.493,75,'在卧佛寺的传统按摩服务区选择不同用时。所示仅按摩价；进入寺院的300THB门票没有自动加收，可另选卧佛寺景点纳入预算。',[
 official('thai-30','泰式按摩30分钟',340,'THB',{durationMinutes:45,includes:['30分钟泰式按摩'],excludes:['卧佛寺入场票300THB（若需进入寺院且尚未购买）','排队时间及交通'],note:'340THB仅为按摩价；另需300THB寺院票，当前方案不会自动加收。可同时选择卧佛寺景点核算；已购寺院票者勿重复计费。'}),official('thai-60','泰式按摩60分钟',520,'THB',{durationMinutes:75,includes:['60分钟泰式按摩'],excludes:['卧佛寺入场票300THB（若需进入寺院且尚未购买）','排队时间及交通'],note:'520THB仅为按摩价；另需300THB寺院票，当前方案不会自动加收。可同时选择卧佛寺景点核算；已购寺院票者勿重复计费。'}),official('thai-120','泰式按摩120分钟',1040,'THB',{durationMinutes:135,includes:['120分钟泰式按摩'],excludes:['卧佛寺入场票300THB（若需进入寺院且尚未购买）','排队时间及交通'],note:'1040THB仅为按摩价；另需300THB寺院票，当前方案不会自动加收。可同时选择卧佛寺景点核算；已购寺院票者勿重复计费。'})
],{requirements:['所示价格只含按摩，未自动加收进入寺院的300THB门票','可同时选择卧佛寺景点核算入场成本；已购票者勿重复添加'],availabilityNote:'规划用时在服务时长外预留15分钟准备；实际排队可能更长。寺院票另计，同日已购买卧佛寺票时不要重复购买。请向门店说明不适与服务需求。'});
activity('chiang-mai','asia-scenic','Asia Scenic 清迈泰菜课堂','Asia Scenic Thai Cooking School','https://www.asiascenic.com/','31 Rachadumneon Soi 5, Chiang Mai；农场课另赴郊外',18.79,98.991,330,'选择古城花园厨房或郊外农场，在市场与食材之间认识泰国料理。',[
 official('old-town-morning','古城上午班',1000,'THB',{sourceUrl:'https://www.asiascenic.com/full-course-morning-in-old-town',preferredStartTime:'08:20',durationMinutes:340,includesTransfers:true,includedMeals:['lunch'],includes:['课堂、食材、自制午餐与食谱','市区范围接送'],excludes:['信用卡支付加收3%','超出接送范围的交通'],note:'官网课程09:00–13:30，接人08:20–08:50；规划已预留接送缓冲。1000THB为未加信用卡3%手续费的参考价。'}),
 official('old-town-evening','古城傍晚班',1000,'THB',{sourceUrl:'https://www.asiascenic.com/full-course-evening-in-old-town',preferredStartTime:'15:20',durationMinutes:340,includesTransfers:true,includedMeals:['dinner'],includes:['课堂、食材、自制晚餐与食谱','市区范围接送'],excludes:['信用卡3%手续费','超范围接送'],note:'官网课程16:00–20:30，接人15:20–15:50；规划已预留接送缓冲。'}),
 official('farm','郊外农场全天班',1200,'THB',{sourceUrl:'https://www.asiascenic.com/full-course-at-farm-only-morning',preferredStartTime:'08:20',durationMinutes:460,includesTransfers:true,includedMeals:['lunch'],includes:['市场、农场与烹饪教学','自制午餐、食谱','市区范围接送'],excludes:['信用卡3%手续费','超范围接送'],note:'官网课程09:00–15:30，08:20起接人；规划460分钟包含约30分钟返程缓冲，实际依接送地点调整。'})
]);
activity('chiang-mai','patara-riding','Patara 大象照护与骑乘','Patara Elephant Farm','https://www.pataraelephantfarm.com/pricing/','Baan Pong, Hang Dong, Chiang Mai',18.751,98.838,420,'经营者明确提供带骑乘环节的照护体验；与观察项目分列，按自己想参与的内容选择。',[
 official('morning-one','上午·一人对应一头象',5800,'THB',{preferredStartTime:'07:30',durationMinutes:420,includesTransfers:true,includedMeals:['lunch'],includes:['大象照护教学与骑乘','接送','泰式野餐午餐、饮用水','活动照片'],excludes:['超出经营者接送范围的费用'],note:'官方5800THB/人，07:30–14:30；不是一整组的价格。'}),
 official('morning-sharing','上午·两人共享一头象（每人）',4200,'THB',{preferredStartTime:'07:30',durationMinutes:420,includesTransfers:true,includedMeals:['lunch'],minParticipants:2,includes:['两人共享一头象的骑乘与照护体验','接送、午餐、饮水及活动照片'],excludes:['超出接送范围费用'],note:'官方标4200THB/人、2人对应1头象；两位合计8400THB，不能把4200视作整组费用。配对安排需核实。'}),
 official('afternoon-one','下午·一人对应一头象',4800,'THB',{preferredStartTime:'13:00',durationMinutes:270,includesTransfers:true,includes:['照护与骑乘','接送、野餐茶点、饮水及活动照片'],excludes:['完整午餐或晚餐','超出接送范围费用'],note:'官方4800THB/人，13:00–17:30；picnic break作为茶点，不扣减完整正餐预算。'})
],{features:['明确含骑乘','Baan Pong / Hang Dong','可比较共享与独享'],requirements:['实际活动、接送区域与参与条件按经营者确认','共享方案按每人计价，人数与配对需要提前确认'],evidenceSummary:'官方Pricing当前明确列Riding with elephant；上午5800/4200、下午4800/3200THB每人。此记录未把其他不骑乘营地误标为骑乘。'});
activity('chiang-mai','jungle-observation','Elephant Jungle Paradise 大象观察','Elephant Jungle Paradise Park','https://www.e-junglepark.com/copy-of-elephant-tour-full-day2','Mae Sa Pok, Mae Win, Mae Wang, Chiang Mai',18.626,98.665,390,'在营地向导带领下观察大象与栖息地；大象自然靠近时可按工作人员安排准备食物。',[
 official('morning-observation','上午观察与轻徒步',1700,'THB',{preferredStartTime:'07:00',durationMinutes:390,includesTransfers:true,includes:['向导观察和轻徒步','范围内住宿接送','咖啡、水果、饮水及活动照片','供大象食用的食物'],excludes:['骑乘或给大象洗澡','完整午餐','接送范围以外费用'],note:'官网1700THB/成人；07:00–07:30接人、11:30离开营地。规划390分钟已为返城预留约2小时；实际由接送地点决定。'})
],{features:['观察大象','不含骑乘','不含洗澡互动'],availabilityNote:'经营者首页明确不骑乘、不洗澡、不强迫互动；上午项目只列咖啡与水果，不当作完整正餐。网站子页标题命名不一致，以上按正文“HALF DAY MORNING”确认。'});

// Enforce meaningful schema and category coverage without depending on server integration.
const ids = new Set();
for(const entry of entries){
  if(ids.has(entry.id))throw Error(`Duplicate expansion ID: ${entry.id}`); ids.add(entry.id);
  const city={...byId.get(entry.cityId),experiences:[entry]};
  for(const price of entry.priceOptions){
    if(price.type==='estimate'&&price.checkedAt!==null)throw Error(`Estimate marked verified: ${entry.id}`);
    resolveExperienceSelections({cityId:entry.cityId,days:3,experienceSelections:[{experienceId:entry.id,optionId:price.id,dayIndex:0}]},city);
  }
}
for(const [cityId] of hotelRows)for(const kind of ['hotel','restaurant','experience'])if(!entries.some(e=>e.cityId===cityId&&e.kind===kind))throw Error(`Missing ${cityId}/${kind}`);
const dir=path.join(ROOT,'data/experience-expansion');await fs.mkdir(dir,{recursive:true});
await fs.writeFile(path.join(dir,'asia-africa.json'),JSON.stringify(entries,null,2)+'\n','utf8');
const officialCount=entries.flatMap(e=>e.priceOptions).filter(o=>o.type==='official').length;
const lines=[
 '# 亚洲与非洲经营者资料扩展', '',
 `资料核对日期：${DATE}。本批 ${entries.length} 条经营地点或活动，${entries.reduce((sum,e)=>sum+e.priceOptions.length,0)} 个方案，其中 ${officialCount} 个保留经营者公开价格。20 个此前空白城市均覆盖餐饮、住宿、体验三类，另补曼谷与清迈特色活动。`, '',
 '身份、服务内容和价格验证分开：`sourceCheckedAt`/条目 `checkedAt` 表示阅读官方经营者或旅游部门资料的日期；仅 `priceOptions.type=official` 且带价格 `checkedAt` 才表示页面中有对应公开报价。`estimate` 始终 `checkedAt:null`。酒店价均为编辑预算，未读取任何指定日期房态。', '',
 '位置均标记 `coordinateBasis:approximate-venue`、`coordinateAccuracy:approximate`，只用于位置参考与粗略路程预算。集合点与酒店门牌以官方确认单为准。没有复制版权图片，也没有把城市照片冒充这些商家的照片。', '',
 '公开报价保留经营者原币：例如Tamarind、Phare、SkyWaltz外国游客与Safari Blue的USD。由应用现有汇率换算显示，换算值不标为新的官方当地币报价。餐厅的两个预算档是用户可调整的消费假设，不是杜撰的官方套餐。', '',
 '## 逐条来源与证据', '',
 '| 城市 | 条目 | 类型 | 已确认的内容 | 官方来源 |', '| --- | --- | --- | --- | --- |',
 ...entries.map(e=>`| ${byId.get(e.cityId).name} | ${e.name} | ${e.kind} | ${e.evidence.summary.replaceAll('|','/')} | [经营者或官方旅游资料](${e.sourceUrl}) |`), '',
 '## 公开价格与边界', '',
 ...entries.filter(e=>e.priceOptions.some(o=>o.type==='official')).map(e=>`- **${e.name}**：[来源](${e.sourceUrl})。${e.priceOptions.filter(o=>o.type==='official').map(o=>`${o.name}：${o.low} ${o.currency}/${o.unit}${o.priceQualifier==='from'?'起':''}`).join('；')}。`), '',
 '## 需要特别保留的说明', '',
 '- Patara 官方页明确提供骑乘；共享4200THB是每人、两人共享一头象。E-junglepark当前官网明确不骑乘、不洗澡，两者没有混写。',
 '- 按现有程序字段 `includedMeals`、`includesTransfers`、`durationMinutes` 表达含餐、接送和完整占用时间。Tamarind仅含餐厅到课堂交通，因此没有设置“酒店接送全包”；课程内交通已包含在时长，酒店到餐厅仍需规划。',
 '- SiDive把350PHP电子教材计入总额：两人以上3450PHP/人，一对一3650PHP；证书另收费。只用体验潜水课程，不把多日执照课程塞进一天。',
 '- 卧佛寺按摩价格只含按摩，不含入寺必需的300THB门票。排除项不会触发引擎自动加收，用户需同时选择卧佛寺景点核算；已购票者勿重复计费。本批没有实现依赖门票自动加入/去重。巴拿山和SkyTrail已含相应缆车基础票，选择时需避免和景点库门票重复。',
 '- Colombo Walks官网卢比与美元对照明显陈旧，仅把活动内容作为证据，金额保持估算。City Sightseeing没有采用已过期的产品结构化数据299ZAR价，保留当前Specials页面345/365ZAR。',
 '- Cookinn以具体小笼包牛肉面课程页明确的2650TWD/人、09:30–12:30含午餐为依据；没有把列表“2650起”外推成其他课程上界。该课只列周二三四六，需要用户核对实际开班。Galle Face 1864的3900/4400LKR午餐未税“++”没有冒充含税价，数据仍用明确估算。', '',
 '生成/验证命令：`node scripts/build-experiences-asia-africa.mjs`。脚本只写本扩展包和本证据文件，不修改城市、旧经营者库、服务端或界面。', '',
];
await fs.writeFile(path.join(ROOT,'docs/experience-expansion-asia-africa.md'),lines.join('\n'),'utf8');
console.log(JSON.stringify({entries:entries.length,options:entries.reduce((sum,e)=>sum+e.priceOptions.length,0),officialOptions:officialCount,cities:new Set(entries.map(e=>e.cityId)).size},null,2));
