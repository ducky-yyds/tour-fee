/** Editorial expansion with operator identity/content checked in official web pages.
 * Rerunning this script reproduces the researched snapshot; it is not a live scraper.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const date = '2026-09-22';
const cities = JSON.parse(readFileSync(new URL('../data/cities.json', import.meta.url), 'utf8'));
const rows = [], evidence = [];
const approximate = '坐标为地址或集合区域的近似参考，不能替代入口导航；实际入口和集合点以确认单为准。';
const noInventory = '已核对经营者官网的实体与服务介绍，未查询指定日期库存、营业安排或可订席位。';
function option(id, name, low, high, includes, excludes = ['未列明的加购项目、饮品与额外收费'], extra = {}) {
  return { id, name, description: includes.join('；'), low, high, unit: 'person', type: 'estimate', checkedAt: null,
    note: '编辑预算区间，不是经营者已核实报价；实际菜单、税费及服务内容以预订确认单为准。', includes, excludes, ...extra };
}
function official(id, name, value, includes, excludes, note, extra = {}) {
  return option(id, name, value, value, includes, excludes, { type: 'official', checkedAt: date, note, ...extra });
}
function add(cityId, kind, slug, name, nameEn, sourceUrl, address, lat, lng, description, features, options, extra = {}, verified = '') {
  const city = cities.find(x => x.id === cityId);
  if (!city) throw new Error(cityId);
  const item = { id: `ex-${cityId}-${kind}-${slug}`, cityId, kind, name, nameEn, provider: nameEn,
    tagline: features.join(' · '), description: `${description} ${approximate}`, address, lat, lng,
    coordinateAccuracy: 'approximate', coordinateNote: approximate,
    durationMinutes: kind === 'hotel' ? 0 : kind === 'restaurant' ? 90 : 120,
    features, sourceUrl, bookingUrl: sourceUrl, checkedAt: date,
    requirements: kind === 'hotel' ? ['预订前确认入住人数、床型、取消条款及税费', '按每间每晚计费；超过房型允许人数须另订房间'] : kind === 'restaurant' ? ['建议提前向餐厅预约；确认实际供应餐次和菜单', '饮食限制和过敏原须提前向餐厅说明'] : ['须提前预约并取得集合与出发确认', '天气、季节或运营安排可能调整活动；不保证自然现象或野生动物出现'],
    availabilityNote: kind === 'hotel' ? `以下是按间晚的编辑住宿预算，不是指定日期的酒店报价或房态确认。${noInventory}` : noInventory,
    ...extra,
    priceOptions: options.map(p => ({ ...p, currency: city.currency, sourceUrl: p.sourceUrl || sourceUrl,
      ...(kind === 'restaurant' ? { mealTypes: p.mealTypes || extra.mealTypes || ['lunch', 'dinner'] } : {}) })) };
  delete item.mealTypes;
  rows.push(item);
  evidence.push({ item, verified: verified || description });
  return item;
}
function hotel(city, slug, name, en, url, address, lat, lng, description, features, low, high, largerLow, largerHigh, roomA = '客房', roomB = '更大房型或套房') {
  return add(city, 'hotel', slug, name, en, url, address, lat, lng, description, features, [
    option('room', `${roomA} · 编辑预算`, low, high, [`一间${roomA}住宿一晚`], ['未明确包含的早餐、加床、停车、接送与当地住宿税'], { unit: 'room-night' }),
    option('larger-room', `${roomB} · 编辑预算`, largerLow, largerHigh, [`一间${roomB}住宿一晚`], ['未明确包含的早餐、加床、停车、接送与当地住宿税'], { unit: 'room-night' }),
  ]);
}
function restaurant(city, slug, name, en, url, address, lat, lng, description, features, ranges, extra = {}) {
  return add(city, 'restaurant', slug, name, en, url, address, lat, lng, description, features, [
    option('simple', '主菜用餐 · 自选预算', ...ranges[0], ['按一人选择一份主菜预留的餐饮预算'], ['前菜、甜品、饮品、附加税费与服务费']),
    option('courses', '多道菜 · 自选预算', ...ranges[1], ['按一人选择主菜及前菜或甜品预留的餐饮预算'], ['酒水、附加税费与服务费']),
    option('leisurely', '完整晚餐 · 自选预算', ...ranges[2], ['按一人多道菜与饮品预留的较宽松用餐预算'], ['高价酒款、附加税费与服务费']),
  ], { mealType: 'dinner', ...extra, availabilityNote: `这些是自选点餐预算，不是餐厅发布的三档套餐。${noInventory}` });
}

// Hotels: official entity/room descriptions; all monetary values editorial, per room-night.
hotel('reykjavik','sand-hotel','Sand Hotel 精品酒店','Sand Hotel','https://www.keahotels.is/sand-hotel','Laugavegur 34, Reykjavík',64.145,-21.927,'位于雷克雅未克购物街的精品酒店，官网列有双人及高级房型；入住前确认早餐和床型。',['Laugavegur 商圈','精品设计','步行探索市中心'],28000,48000,45000,78000,'双人客房','高级客房');
hotel('vik','hotel-kria','Kría 酒店','Hotel Kría','https://www.hotelkria.is/','Sléttuvegur 12–14, Vík',63.418,-18.998,'维克一号公路旁的酒店，官网区分标准双人房、山景房及套房；餐厅与黑沙滩可分别安排。',['环岛公路','山景房选择','Drangar 餐厅'],26000,44000,35000,62000,'标准双人房','山景房');
hotel('akureyri','hotel-kea','Kea 酒店','Hotel Kea','https://www.keahotels.is/hotel-kea','Hafnarstræti 87, Akureyri',65.681,-18.090,'阿克雷里市中心的传统酒店，适合以步行为基础探索港口和市区；房型与景观需选日期核实。',['市中心','港口周边','北部冰岛据点'],22000,39000,34000,61000);
hotel('male','maagiri-hotel','Maagiri 酒店','Maagiri Hotel','https://maagirihotel.com/','Boduthakurufaanu Magu, opposite Henveiru ferry terminal, Malé',4.176,73.518,'马累 Henveiru 渡轮码头附近的城市酒店，官网列 Superior 与海景 Junior Suite；不是离岛度假村，马富施等岛屿船程另计。',['码头附近','城市酒店','海景套房选择'],150,260,240,420,'Superior 客房','Junior Suite');
hotel('maafushi','kaani-palm-beach','Kaani Palm Beach 酒店','Kaani Palm Beach','https://kaanihotels.com/stays/Palm-Beach','Beachfront, Maafushi, South Malé Atoll',3.945,73.490,'马富施居民岛海滨酒店，提供海景阳台房与无边泳池；从马累机场到岛的快艇不在此间晚预算中。',['居民岛海滨','无边泳池','海景阳台'],95,180,135,250,'客房','海景阳台房');
hotel('cappadocia','museum-hotel','Museum Hotel 洞穴酒店','Museum Hotel','https://www.museumhotel.com.tr/en/','Uçhisar, Cappadocia',38.632,34.807,'位于乌奇萨尔的博物馆概念洞穴酒店，并非格雷梅镇中心；前往格雷梅需额外安排道路交通。',['洞穴空间','乌奇萨尔景观','博物馆概念'],18000,32000,32000,62000,'客房','套房');
hotel('tromso','scandic-ishavshotel','Scandic Ishavshotel 港湾酒店','Scandic Ishavshotel','https://www.scandichotels.com/en/hotels/scandic-ishavshotel','Fredrik Langes gate 2, Tromsø',69.650,18.963,'位于特罗姆瑟港湾的城市酒店，官网区分 Standard 与面向峡湾或海景的 Superior 房型。',['港湾景色','市区步行','ROAST 餐厅'],1600,2800,2300,3900,'Standard 客房','Superior 客房');
hotel('rovaniemi','arctic-treehouse','Arctic TreeHouse 森林酒店','Arctic TreeHouse Hotel','https://arctictreehousehotel.com/accommodation/','Tarvantie 3, Rovaniemi, near SantaPark',66.542,25.801,'森林坡地上的树屋式酒店，距离罗瓦涅米中心约数公里；官网列 TreeHouse Suite 与含两卧室的 GlassHouse，市区与机场接送另行预订。',['森林景观窗','树屋式套房','GlassHouse 双卧选择'],380,850,750,1550,'Arctic TreeHouse Suite','Arctic GlassHouse');
hotel('interlaken','victoria-jungfrau','Victoria-Jungfrau 大酒店','Victoria-Jungfrau Grand Hotel & Spa','https://www.victoria-jungfrau.ch/','Höheweg 41, Interlaken',46.688,7.858,'因特拉肯中央大道的历史酒店，适合将阿尔卑斯观光与酒店休息结合；水疗项目及餐饮单独确认。',['历史酒店','中央大道','阿尔卑斯景观'],480,880,800,1500);
hotel('queenstown','hilton-queenstown','皇后镇希尔顿度假酒店','Hilton Queenstown Resort & Spa','https://www.hilton.com/en/hotels/zqnhqhi-hilton-queenstown-resort-and-spa/rooms/','Kawarau Village, 79 Peninsula Road, Queenstown',-45.029,168.729,'位于 Kawarau Village 湖岸，和皇后镇镇中心有道路或水上交通距离；不是镇中心步行酒店，进城交通另计。',['瓦卡蒂普湖岸','度假设施','远离镇中心'],260,450,390,680);
hotel('auckland','the-grand-skycity','The Grand by SkyCity 酒店','The Grand by SkyCity','https://thegrandbyskycity.skycityauckland.co.nz/','90 Federal Street, Auckland',-36.850,174.763,'位于奥克兰市中心 SkyCity 街区，可步行前往天空塔；房费不自动包含塔上活动或 Orbit 餐厅。',['Federal Street','天空塔旁','城市步行据点'],280,480,420,780);
hotel('edinburgh','balmoral','Balmoral 酒店','The Balmoral','https://www.roccofortehotels.com/hotels-and-resorts/the-balmoral-hotel/','1 Princes Street, Edinburgh',55.953,-3.190,'位于 Princes Street 与 Waverley 车站附近的地标酒店；Number One 餐厅须另行预约。',['王子街','铁路站附近','历史建筑'],330,680,650,1250);
hotel('dublin','merrion','Merrion 酒店','The Merrion','https://www.merrionhotel.com/','Upper Merrion Street, Dublin',53.339,-6.252,'都柏林 Merrion Street 的乔治亚式酒店；可将周边博物馆、街区散步与酒店餐饮分开选择。',['乔治亚建筑','市中心','庭院空间'],400,700,650,1100);
hotel('prague','u-prince','U Prince 酒店','Hotel U Prince','https://hoteluprince.com/','Staroměstské náměstí 29, Prague',50.087,14.420,'布拉格老城广场旁的历史建筑酒店，屋顶 Terasa 餐厅须独立订位；热门景观席位不随房费保证。',['老城广场','历史建筑','屋顶餐厅'],4200,7600,6900,12000);
hotel('vienna','sacher-vienna','维也纳萨赫酒店','Hotel Sacher Vienna','https://www.sacher.com/en/vienna/','Philharmonikerstraße 4, Vienna',48.204,16.370,'位于国家歌剧院旁的传统酒店，设多处餐厅与咖啡空间；住宿与萨赫蛋糕、餐饮分别预算。',['歌剧院旁','历史酒店','维也纳咖啡文化'],580,1000,950,1750);
hotel('budapest','aria-budapest','Aria 音乐主题酒店','Aria Hotel Budapest','https://www.ariahotelbudapest.com/','Hercegprímás utca 5, Budapest',47.501,19.054,'圣伊什特万圣殿附近的音乐主题酒店，官网列 Luxury King 房及 Signature 阳台房；屋顶酒吧消费单独计。',['音乐主题','圣殿旁','屋顶花园'],115000,190000,160000,280000,'Luxury King 客房','Signature 阳台房');
hotel('athens','grande-bretagne','雅典 Grande Bretagne 酒店','Hotel Grande Bretagne','https://www.marriott.com/en-us/hotels/athlc-hotel-grande-bretagne-a-luxury-collection-hotel-athens/overview/','1 Vasileos Georgiou A, Syntagma Square, Athens',37.976,23.736,'宪法广场旁的历史酒店，屋顶 GB Roof Garden 为独立餐饮选择；卫城景观房需按所订房型确认。',['宪法广场','历史酒店','屋顶景观餐厅'],420,750,700,1300);
hotel('santorini','canaves-epitome','Canaves Epitome 海景酒店','Canaves Epitome','https://canaves.com/canaves-oia-epitome/accommodations/','Outskirts of Oia, above Ammoudi, Santorini',36.466,25.369,'位于伊亚外围、Ammoudi 渔港上方的套房度假酒店，官网列带小泳池套房及 Pool Villa；港口和费拉接送另计。',['伊亚外围','私人泳池选择','海景套房'],580,1100,1100,2100,'Deluxe Suite with Plunge Pool','Epitome Pool Villa');
hotel('madrid','mandarin-ritz','马德里文华东方丽兹酒店','Mandarin Oriental Ritz Madrid','https://www.mandarinoriental.com/en/madrid/hotel-ritz','Plaza de la Lealtad 5, Madrid',40.416,-3.692,'普拉多博物馆附近的历史酒店，设客房、套房与 Deessa 餐厅；餐厅与水疗消费不自动包含。',['普拉多周边','历史建筑','Deessa 餐厅'],700,1200,1150,2100);
hotel('vancouver','fairmont-pacific-rim','Fairmont Pacific Rim 酒店','Fairmont Pacific Rim','https://www.fairmont.com/en/hotels/vancouver/fairmont-pacific-rim.html','1038 Canada Place, Vancouver',49.289,-123.117,'温哥华煤港一带的城市酒店，Botanist 餐厅位于酒店内；海景取决于所订房型，不保证所有客房同一视野。',['Coal Harbour','海滨步道','Botanist 餐厅'],460,780,700,1250);
hotel('mexico-city','four-seasons','墨西哥城四季酒店','Four Seasons Hotel Mexico City','https://www.fourseasons.com/mexico/','Paseo de la Reforma 500, Colonia Juárez, Mexico City',19.423,-99.175,'改革大道上的庭院式城市酒店，官网列 Deluxe Room 与单卧套房；特奥蒂瓦坎热气球为城外活动，接送另选。',['改革大道','庭院建筑','墨西哥手工设计'],10000,17500,18000,30000,'Deluxe Room','One-Bedroom Suite');
hotel('cancun','nizuc','NIZUC Resort & Spa 度假酒店','NIZUC Resort & Spa','https://www.nizuc.com/','Punta Nizuc, Boulevard Kukulcán km 21.26, Cancún',21.029,-86.812,'位于坎昆酒店区南端 Punta Nizuc 的海滨度假酒店；距市中心有车程，餐厅、水疗及机场交通应分别确认。',['Punta Nizuc','海滨度假','Ramona 餐厅'],13000,23000,22000,38000);

// Restaurants: three distinct choices; explicit self-selected budgets unless menu totals were read.
add('reykjavik','restaurant','dill','DILL 北欧风味餐厅','DILL','https://www.dillrestaurant.is/en/food-wine/','Laugavegur 59, Reykjavík',64.144,-21.921,'以冰岛食材为基础的北欧品鉴餐厅；官网公布品鉴餐和饮品搭配的独立价格。',['冰岛食材','北欧品鉴','饮品搭配'],[
  official('menu','DILL 品鉴餐',39900,['一人 DILL 品鉴菜单'],['饮品搭配和额外加点'],'官网 DILL menu 39,900 ISK。'),
  official('alcohol-free','品鉴餐＋无酒精搭配',53800,['DILL 品鉴餐','无酒精饮品搭配'],['额外酒水和加点'],'官网菜单 39,900 加无酒精搭配 13,900，合计 53,800 ISK；是两项组合。'),
  official('wine','品鉴餐＋葡萄酒与饮品搭配',61200,['DILL 品鉴餐','葡萄酒与饮品搭配'],['额外加点'],'官网菜单 39,900 加 Wine and beverage pairing 21,300，合计 61,200 ISK。'),
],{durationMinutes:180,mealType:'dinner',mealTypes:['dinner'],requirements:['提前预约晚餐','官网说明无法提供纯素或完全无乳蛋白菜单；过敏须提前沟通']});
add('vik','restaurant','drangar','Drangar 冰岛餐厅','Drangar Restaurant','https://www.hotelkria.is/restaurant','Hotel Kría, Sléttuvegur 12–14, Vík',63.418,-18.998,'Kría 酒店内的冰岛风味餐厅，以下三档为官网分别标价的单份主菜，不冒充多道菜套餐。',['冰岛羊肉','当地鱼类','酒店晚餐'],[
  official('vegetarian','花椰菜主菜',4290,['一份花椰菜主菜'],['前菜、甜点、饮品'],'官网花椰菜单份主菜 4,290 ISK，菜单注明含 VAT；不是花椰菜与茄子两道菜合餐。'),
  official('char','红点鲑主菜',5990,['一份 Arctic char 主菜'],['前菜、甜点、饮品'],'官网主菜 5,990 ISK，菜单注明含 VAT。'),
  official('lamb','羊肉主菜',6990,['一份羊肉主菜'],['前菜、甜点、饮品'],'官网主菜 6,990 ISK，菜单注明含 VAT。'),
],{mealType:'dinner',mealTypes:['dinner']});
restaurant('akureyri','rub23','Rub23 海鲜寿司餐厅','Rub23','https://www.rub23.is/','Kaupvangsstræti 6, Akureyri',65.681,-18.089,'位于市中心的海鲜与寿司餐厅，适合观鲸返回后安排晚餐；具体鱼种和菜品随菜单变化。',['海鲜','寿司','市中心'],[[4200,6500],[7000,10000],[10500,15500]]);
restaurant('male','faru','Faru 城市餐厅','Faru Restaurant at Maagiri Hotel','https://maagirihotel.com/dinings/','Maagiri Hotel, Boduthakurufaanu Magu, Malé',4.176,73.518,'Maagiri 酒店内的半正式餐厅，官网介绍自助及单点用餐；主题自助日期须向餐厅确认。',['自助与单点','城市酒店餐厅','本地及国际风味'],[[18,30],[30,50],[50,80]]);
restaurant('maafushi','palm-beach-restaurant','Palm Beach 海滨餐厅','Palm Beach Restaurant','https://kaanihotels.com/stays/Palm-Beach','Kaani Palm Beach, Maafushi',3.945,73.490,'Kaani Palm Beach 内的海滨用餐空间，官网介绍早餐至晚餐及自助餐；下面为自选用餐预算，是否开放单点及自助价格需确认。',['海滨用餐','自助餐选择','居民岛餐厅'],[[15,25],[25,40],[40,65]]);
restaurant('cappadocia','lila','Lil’a 卡帕多奇亚餐厅','Lil’a Restaurant','https://www.museumhotel.com.tr/yeme-icme','Museum Hotel, Uçhisar, Cappadocia',38.632,34.807,'Museum Hotel 内的卡帕多奇亚风味餐厅，位于乌奇萨尔而非格雷梅中心；往返用车另行安排，非住客须确认订位。',['土耳其风味','乌奇萨尔','当地食材'],[[1600,2500],[2600,4200],[4300,6800]]);
restaurant('tromso','roast','ROAST 港湾餐厅','ROAST at Scandic Ishavshotel','https://www.scandichotels.com/en/hotels/scandic-ishavshotel','Fredrik Langes gate 2, Tromsø',69.650,18.963,'Scandic Ishavshotel 内的港湾餐厅，官网以海鲜为特色；晚餐供应日期和套餐需直接确认。',['北挪威海鲜','港湾景观','酒店餐厅'],[[380,620],[650,950],[1000,1500]],{mealTypes:['dinner']});
restaurant('rovaniemi','rakas','Rakas 拉普兰餐厅','Rakas Restaurant & Bar','https://rakasrestaurant.com/','Arctic TreeHouse Hotel, Tarvantie 3, Rovaniemi',66.542,25.801,'Arctic TreeHouse 主楼的景观餐厅，使用当地食材作现代料理；距市中心有车程，餐饮预算不含往返交通。',['拉普兰食材','森林环境','现代北欧料理'],[[30,48],[55,80],[85,125]]);
restaurant('interlaken','sapori','Sapori 意大利餐厅','Ristorante e Pizzeria Sapori','https://www.victoria-jungfrau.ch/en/restaurants-bars/ristorante-e-pizzeria-sapori/','Höheweg 41, Interlaken',46.688,7.858,'Victoria-Jungfrau 酒店内的意大利餐厅，官网介绍石炉披萨、自制意面、海鲜与素食。',['石炉披萨','手工意面','历史酒店餐厅'],[[28,42],[48,72],[75,115]]);
add('queenstown','restaurant','fergburger','Fergburger 汉堡店','Fergburger','https://fergburger.com/wp-content/uploads/2026/04/Fergburger-english-menus.pdf','42 Shotover Street, Queenstown',-45.031,168.660,'皇后镇 Shotover Street 的汉堡店；以下按官网 2026 菜单的单只汉堡计价，排队可能需要额外时间。',['牛肉汉堡','素食选择','镇中心'],[
  official('classic','经典 Fergburger',17.2,['一只经典牛肉汉堡'],['薯条和饮品'],'官网 2026 英文菜单 17.20 NZD。'),
  official('vegetarian','Holier Than Thou 豆腐汉堡',18.5,['一只豆腐素食汉堡'],['薯条和饮品'],'官网 2026 英文菜单 18.50 NZD；过敏及是否含蛋乳需向店员确认。'),
  official('big-al','Big Al 双份牛肉汉堡',25.9,['一只 Big Al 汉堡'],['薯条和饮品'],'官网 2026 英文菜单 25.90 NZD。'),
],{durationMinutes:60,mealType:'lunch',mealTypes:['lunch','dinner']});
restaurant('auckland','orbit360','Orbit 360 旋转餐厅','Orbit 360° Dining','https://skycityauckland.co.nz/restaurants/orbit/','Sky Tower, Federal Street, Auckland',-36.848,174.763,'天空塔内的旋转景观餐厅，约每小时旋转一周；菜单和最低消费随餐次确认，不能把普通登塔票视为餐费。',['城市全景','旋转餐厅','新西兰风味'],[[65,95],[100,140],[145,200]],{durationMinutes:120});
add('edinburgh','restaurant','number-one','Number One 苏格兰品鉴餐厅','Number One at The Balmoral','https://www.roccofortehotels.com/hotels-and-resorts/the-balmoral-hotel/dining/number-one/menu/','The Balmoral, 1 Princes Street, Edinburgh',55.953,-3.190,'Balmoral 酒店内的正式品鉴餐厅，以下按官网菜单与两种葡萄酒搭配相加；附加服务费须订位时确认。',['苏格兰食材','品鉴菜单','王子街酒店'],[
  official('menu','品鉴菜单',125,['一人官网品鉴菜单'],['饮品搭配、另加项目和未列服务费'],'官网 Menu £125/person；不是指定日期库存。'),
  official('tasting-wines','品鉴菜单＋Tasting Wines',210,['品鉴菜单','Tasting Wines 搭配'],['其他酒水和未列服务费'],'菜单 £125 加 Tasting Wines £85，合计 £210。'),
  official('prestige-wines','品鉴菜单＋Prestige Wines',260,['品鉴菜单','Prestige Wines 搭配'],['其他酒水和未列服务费'],'菜单 £125 加 Prestige Wines £135，合计 £260。'),
],{durationMinutes:180,mealType:'dinner',mealTypes:['dinner']});
restaurant('dublin','patrick-guilbaud','Patrick Guilbaud 餐厅','Restaurant Patrick Guilbaud','https://restaurantpatrickguilbaud.ie/menus/','21 Upper Merrion Street, Dublin',53.339,-6.252,'Merrion Street 的正式餐厅，官网区分午餐、单点及八道品鉴；未使用搜索中年代较早的 PDF 价格充当现价。',['法式料理','午餐与品鉴','Merrion Street'],[[95,140],[160,230],[240,350]],{durationMinutes:150});
restaurant('prague','terasa-u-prince','Terasa U Prince 屋顶餐厅','Terasa U Prince','https://hoteluprince.com/','Hotel U Prince, Staroměstské náměstí 29, Prague',50.087,14.420,'U Prince 酒店屋顶的餐饮空间，可以俯瞰老城广场；景观区域、餐桌和低消须分别确认。',['老城屋顶','烧烤与酒吧','广场视野'],[[500,800],[850,1300],[1400,2200]]);
restaurant('vienna','rote-bar','Rote Bar 维也纳餐厅','Restaurant Rote Bar','https://www.sacher.com/en/vienna/','Hotel Sacher, Philharmonikerstraße 4, Vienna',48.204,16.370,'萨赫酒店内的维也纳风味餐厅，与咖啡馆属于不同用餐空间；餐桌、菜单和着装要求向餐厅确认。',['维也纳料理','历史酒店','歌剧院周边'],[[45,70],[80,120],[125,190]]);
restaurant('budapest','cafe-liszt','Café Liszt 音乐餐厅','Café Liszt','https://www.ariahotelbudapest.com/','Aria Hotel, Hercegprímás utca 5, Budapest',47.501,19.054,'Aria 酒店官网介绍的欧洲风味餐厅，具有音乐主题环境；演出活动须另查，不默认含现场表演票。',['欧洲风味','音乐主题','圣殿附近'],[[8000,12000],[14000,20000],[22000,32000]]);
restaurant('athens','gb-roof-garden','GB Roof Garden 屋顶餐厅','GB Roof Garden','https://www.marriott.com/en-us/hotels/athlc-hotel-grande-bretagne-a-luxury-collection-hotel-athens/overview/','Hotel Grande Bretagne, Syntagma Square, Athens',37.976,23.736,'Grande Bretagne 顶层的地中海风味餐厅，可看雅典城市景观；景观桌与窗边席位不保证。',['地中海风味','屋顶景观','宪法广场'],[[55,85],[95,140],[150,220]]);
restaurant('santorini','elements','Elements 海景品鉴餐厅','Elements Restaurant','https://elements-santorini.com/','Canaves Epitome, Oia outskirts, Santorini',36.466,25.369,'Canaves Epitome 内的现代欧洲与希腊风味品鉴餐厅，位于伊亚外围；晚餐需要预约并另计来回交通。',['希腊食材','品鉴料理','伊亚外围'],[[150,210],[220,290],[300,420]],{durationMinutes:180,mealTypes:['dinner']});
restaurant('madrid','deessa','Deessa 品鉴餐厅','Deessa','https://cms.mandarinoriental.com/en/madrid/hotel-ritz/dine/deessa','Mandarin Oriental Ritz, Plaza de la Lealtad 5, Madrid',40.416,-3.692,'文华东方丽兹酒店的 Quique Dacosta 餐厅，以正式创作料理为特色；下面预算不表示商家提供单点或三档固定套餐，订位前确认可选品鉴菜单。',['创作料理','历史酒店','普拉多周边'],[[220,290],[300,380],[400,550]],{durationMinutes:180});
restaurant('vancouver','botanist','Botanist 西北海岸餐厅','Botanist','https://www.botanistrestaurant.com/','Fairmont Pacific Rim, 1038 Canada Place, Vancouver',49.289,-123.117,'Fairmont Pacific Rim 内的餐厅，官网强调太平洋西北地区食材与植物主题；加拿大销售税和自愿小费不包含在自选预算中。',['西北海岸食材','植物主题','海鲜选择'],[[45,70],[85,120],[135,190]]);
restaurant('mexico-city','zanaya','Zanaya 墨西哥海鲜餐厅','Zanaya','https://www.fourseasons.com/mexico/dining/restaurants/zanaya/','Four Seasons, Paseo de la Reforma 500, Mexico City',19.423,-99.175,'四季酒店内的墨西哥太平洋风味海鲜餐厅，可结合改革大道观光；自选预算不等于酒店住宿含餐。',['墨西哥海鲜','庭院餐饮','改革大道'],[[550,900],[1000,1500],[1700,2500]]);
restaurant('cancun','ramona','Ramona 墨西哥创作餐厅','Ramona','https://www.nizuc.com/cuisine/ramona/','NIZUC Resort, Punta Nizuc, Cancún',21.029,-86.812,'NIZUC 度假酒店内的现代墨西哥餐厅，位于酒店区南端；非住客预约、晚餐着装与交通须先确认。',['墨西哥风味','本地香料','海滨度假酒店'],[[1100,1700],[1900,2800],[3000,4200]],{mealTypes:['dinner']});

// Experiences: time and inclusions distinguish actual services from editorial reserves.
add('reykjavik','experience','sky-lagoon','Sky Lagoon 海滨温泉与七步仪式','Sky Lagoon','https://www.skylagoon.com/is/leidir-til-ad-njota/','Vesturvör 44–48, Kópavogur',64.113,-21.911,'温泉实际位于雷克雅未克近郊 Kópavogur，需另安排城市交通；两种入场均含 Skjól 七步仪式，区别在更衣设施。规划预留约 2.5 小时，非运营方限时票。',['海滨温泉','七步仪式','独立更衣选择'],[
  option('saman','Saman 公共更衣 · 预算',14990,19000,['温泉与一次 Skjól 仪式','公共更衣与毛巾'],['往返接送、餐饮和额外加购'],{note:'官网 Saman 公布 14,990 ISK 起；上限为编辑留量，整段仍为估算，未核对出行日票价。'}),
  option('ser','Sér 独立更衣 · 预算',19000,25000,['温泉与一次 Skjól 仪式','独立更衣、淋浴设施与毛巾'],['往返接送、餐饮和额外加购']),
],{durationMinutes:150});
add('vik','experience','katlatrack-ice-cave','Katlatrack 卡特拉冰洞探访','Katlatrack Katla Ice Cave','https://katlatrack.is/all-tours/ice-cave-tours/','Katlatrack meeting area, Austurvegur 16, Vík',63.419,-19.003,'从维克集合前往卡特拉冰洞，活动包含离开小镇的冰川道路行程；冰洞形态、进入范围依天气与导游判断，不能自驾替代导览。',['火山冰洞','当地导游','维克集合'],[
  option('fast-track','Katla Fast Track · 预算',29900,36000,['拼团冰洞导览及该行程道路交通'],['雷克雅未克接送、餐饮和住宿'],{durationMinutes:180,note:'官网 2.5–3 小时、29,900 ISK 起；上限为预算留量，未核对日期，故仍标估算。'}),
  option('cave-black-beach','冰洞与黑沙滩 Drone 行程 · 预算',41500,49000,['冰洞、黑沙滩及官网 Drone 行程'],['雷克雅未克接送、餐饮和额外影像服务'],{durationMinutes:240,note:'官网列 3–4 小时、41,500 ISK 起；无人机使用及天气限制须预约确认。'}),
],{durationMinutes:180,includesTransfers:true});
add('akureyri','experience','elding-whales','Elding 埃亚峡湾观鲸','Elding Akureyri Whale Watching','https://elding.is/akureyri-schedule-prices','Akureyri harbour; boarding pier confirmed by Elding',65.681,-18.086,'从阿克雷里港口探索埃亚峡湾，经典船和快速船属于不同活动；观察结果不保证。官网价格表覆盖 2025-04-01 至 2027-03-31。',['埃亚峡湾','经典观鲸船','快速船选择'],[
  official('classic','经典观鲸船',14500,['经典观鲸航程'],['酒店接送、船上餐饮'],'官网 AK-01 成人 14,500 ISK；2.5–3.5 小时，不提供酒店接送。',{durationMinutes:210}),
  official('express','Express 快速观鲸船',24900,['快速船观鲸航程'],['酒店接送、餐饮'],'官网 AK-02 成人 24,900 ISK；1.5–2.5 小时，通常 4–10 月；年龄与身高门槛须核实。',{durationMinutes:150}),
],{durationMinutes:210,requirements:['提前预约并确认港口登船点，酒店接送不包含','Express 的儿童年龄及约 145cm 身高门槛按运营方确认','快速船季节及海况可能导致调整，野生动物不保证出现']});
add('male','experience','secret-paradise-walk','Secret Paradise 马累文化步行','Secret Paradise 4 Hour Malé City Walking Tour','https://secretparadise.mv/product/4-hour-male-walking-tour/','Presidential Jetty / Jetty No. 1, Boduthakurufaanu Magu, Malé',4.179,73.511,'由当地向导带领的 4 小时马累城市步行，集合在总统码头一号；不包含从机场或其他岛屿到马累的船程。',['当地向导','城市文化','步行探索'],[
  official('walking','四小时城市步行',50,['当地向导的四小时城市步行服务'],['机场或岛屿接送、未列明门票与餐饮'],'官网 USD 50/person，4 小时，最高 8 人团；时段与集合须确认。',{maxParticipants:8}),
],{durationMinutes:240,maxParticipants:8,requirements:['预订后按确认单到总统码头一号集合','提前确认上午或下午时段；其他岛屿到马累的交通另计','进入宗教场所须遵守当地着装与访问要求']});
add('maafushi','experience','kaani-full-day','Kaani 珊瑚礁浮潜与沙洲午餐','Kaani Full Day Trip','https://kaanihotels.com/experiences/Full-Day-Trip','Kaani Maafushi excursion meeting point; pier confirmed on booking',3.943,73.488,'马富施出发的拼船浮潜，官网列 Biyadhoo、Coral Garden、Turtle Reef、观海豚及沙洲午餐；这些地点在离岛海域，船程包含在 08:30–14:00 项目中。',['珊瑚礁浮潜','沙洲午餐','出海观察'],[
  official('full-day','全日浮潜拼团',40,['官网所列出海浮潜航程','浮潜装备、水下照片与视频','沙洲午餐'],['从马累或机场到马富施的交通、额外饮品、未列明税费'],'官网具体产品页标 USD 40/person，08:30–14:00；税费及指定日确认金额须询价。',{includedMeals:['lunch'],includesTransfers:true}),
],{durationMinutes:330,preferredStartTime:'08:30',requirements:['提前预约并确认马富施集合码头','必须先到达马富施；不包含马累机场至马富施船票','遵守船员浮潜与海况要求，海豚和海龟不保证遇见']});
add('cappadocia','experience','royal-balloon','Royal Balloon 日出热气球','Royal Balloon Cappadocia','https://royalballoon.com/','Göreme hotel pickup / Royal Balloon headquarters, Cappadocia',38.649,34.836,'卡帕多奇亚日出热气球，官网三档飞行时间均约 60 分钟，以篮筐人数区分；整体预留约 3.5 小时，具体清晨接送随日出、天气调整。',['日出热气球','不同篮筐人数','酒店接送'],[
  option('queen','Royal Queen · 20–24 人篮筐预算',7500,12500,['约 60 分钟飞行','酒店接送与简早餐'],['额外影像与未列加购'],{includedMeals:['breakfast'],includesTransfers:true,note:'官网确认 20–24 人篮筐、60 分钟及接送早餐；2026 价格需询价，TRY 为编辑预算。'}),
  option('queen-plus','Royal Queen Plus · 最多 16 人预算',10000,16500,['约 60 分钟飞行','最多 16 人篮筐','酒店接送与简早餐'],['额外影像与未列加购'],{includedMeals:['breakfast'],includesTransfers:true}),
  option('king','Royal King · 8–12 人篮筐预算',14000,22000,['约 60 分钟飞行','8–12 人篮筐','酒店接送与简早餐'],['额外影像与未列加购'],{includedMeals:['breakfast'],includesTransfers:true}),
],{durationMinutes:210,preferredStartTime:'05:00',requirements:['必须提前预约；05:00 仅是规划占位，不是已确认起飞时刻','酒店接送范围和季节性集合时间须确认','天气停飞及参与资格按运营方条件执行']});
add('tromso','experience','brim-whales','Brim Explorer 静音观鲸','Brim Explorer Silent Whale Watching','https://brimexplorer.com/tours/silent-whale-watching','Kaigata 6, pier beside Skarven Kro, Tromsø',69.648,18.957,'从特罗姆瑟前往鲸群觅食海域的混合动力船，官网预计 8–9 小时，交通本身占用整天；不可再按半天项目塞入多处景点。',['冬季观鲸','混合动力船','整日海上行程'],[
  official('adult','成人观鲸航程',1990,['混合动力船观鲸航程','船上导览'],['酒店往返接送、船上餐饮'],'官网成人 NOK 1,990；2026-10-16 至 2027-01-31 季节，8–9 小时。'),
],{durationMinutes:540,preferredStartTime:'08:00',requirements:['官网列多个清晨班次；08:00 仅是其中一档规划占位，按确认单选择','提前至少 15 分钟在 Kaigata 6 码头集合','为 8–9 小时整日活动；鲸群位置和海况可能延长或取消行程']});
add('rovaniemi','experience','bearhill-husky','Bearhill Husky 雪林犬拉雪橇','Bearhill Husky Winter Safaris','https://bearhillhusky.com/winter-tours/the-happy-trail-tour/','Selected pickup points in Rovaniemi; kennel outside town',66.503,25.730,'罗瓦涅米周边犬舍的季节性雪橇，含指定地点接送；地图仅标城市接送区域。犬舍项目为 2.5 或 3 小时，官网接送提前 15–90 分钟，因此规划额外为来回交通共留三小时上限缓冲，实际以确认单缩短。',['哈士奇犬舍','雪林雪橇','含指定接送'],[
  option('happy-trail','Happy Trail 成人',196,201,['犬舍内 2.5 小时项目及 45 分钟自驾雪橇','指定罗瓦涅米集合点往返接送','保暖外衣、热饮与饼干'],['Apukka 与 Vaattunki 指定额外接送费、雪镜和完整正餐'],{type:'official',checkedAt:date,durationMinutes:330,includesTransfers:true,note:'官网成人 196 EUR；2026-11-30 至 2027-01-10 为 201 EUR。票价不含特别地点接送附加费；全程 330 分钟含编辑交通缓冲。'}),
  official('call-wild','Call of the Wild 成人',249,['犬舍内 3 小时项目及 90 分钟自驾雪橇','指定罗瓦涅米集合点往返接送','保暖外衣、热饮与饼干'],['特别地点接送附加费、雪镜和完整正餐'],'官网成人 EUR 249，犬舍内 3 小时；全程 360 分钟含编辑交通缓冲。',{durationMinutes:360,includesTransfers:true,sourceUrl:'https://bearhillhusky.com/winter-tours/call-of-the-wild/'}),
],{durationMinutes:330,requirements:['预订具体冬季日期与所列接送点；自驾旅客也须在 K-Market Sinettä 转乘，不能自行到犬舍','官网自驾雪橇最低 17 岁；共享雪橇不是每人独享一架','Apukka 与 Vaattunki 接送每人每方向另付 12 EUR，未计入本条基础价','地图为城市接送区域，真正集合点和往返用时以确认单为准']});
add('interlaken','experience','big-blue-paragliding','Big Blue 双人滑翔伞','Paragliding Interlaken Big Blue','https://paragliding-interlaken.ch/sommer/aktivitaeten/paragliding-big-blue-sommer-interlaken-schweiz/','Operator meeting point, Höheweg 125, Interlaken',46.691,7.867,'从 Beatenberg 起飞并飞往因特拉肯的双人滑翔伞，约 10–20 分钟飞行，包含上山与准备的全程约 1.5 小时。',['阿尔卑斯滑翔伞','专业双人飞行','含上山交通'],[
  official('flight','Big Blue 飞行',190,['指定集合点接送及上山交通','双人滑翔伞飞行和所需装备'],['照片视频、餐饮、非指定范围酒店接送'],'官网 CHF 190，整体 1.5 小时，空中约 10–20 分钟。',{includesTransfers:true}),
  official('flight-media','飞行＋照片视频',230,['Big Blue 飞行与上山交通','照片视频服务'],['餐饮和非指定范围接送'],'官网 CHF 190 加照片视频 CHF 40，合计 CHF 230。',{includesTransfers:true}),
],{durationMinutes:90,requirements:['提前预约并核对运营方指定集合点','官网最低 6 岁，重量约 25–100kg；当日天气及资格由运营方确认','不可将 10–20 分钟空中时间误当成全程用时']});
add('queenstown','experience','shotover-jet','Shotover Jet 峡谷喷射快艇','Shotover Jet','https://www.shotoverjet.com/prices/individual/','3 Arthurs Point Road, Arthurs Point, Queenstown',-44.988,168.672,'在 Shotover 峡谷进行约 25 分钟快艇活动，要求提前 30 分钟报到；基地在镇外 Arthurs Point，规划另留准备时间。',['峡谷快艇','25 分钟乘船','镇外河谷'],[
  official('adult','成人喷射快艇',199,['一名成人 25 分钟喷射快艇体验'],['影像、餐饮、未选班次的往返接送'],'官网成人 NZD 199，价表适用于至 2027-09-30；免费市中心班车仅指定班次可选。'),
],{durationMinutes:75,requirements:['提前预约，乘船前 30 分钟报到','基地在镇外约 10 分钟车程；免费班车仅指定班次，须预约时选择','年龄、身高、健康与随身设备限制按运营方规定确认']});
add('auckland','experience','skywalk','奥克兰 SkyWalk 塔外步行','AJ Hackett Auckland SkyWalk','https://www.bungy.co.nz/auckland/sky-tower/skywalk/','Sky Tower, Federal Street, Auckland',-36.848,174.763,'在天空塔约 192 米高度的外圈进行带保护系统的步行体验，官网要求预留 90 分钟，包括准备和说明。',['高空步行','城市全景','90 分钟全程'],[
  option('skywalk','SkyWalk 成人 · 预算',215,250,['SkyWalk 保护系统与工作人员带领的塔外步行'],['接送、餐饮和未列影像加购'],{note:'官网成人 NZD 215 起，上限为编辑留量；不是指定日期确认价。'}),
],{durationMinutes:90,requirements:['提前预约并到天空塔内运营方柜台报到','官网最低 10 岁，未满 15 岁需成人签字；重量 30–127kg，强风时最低 45kg','穿平底系带鞋，具体参与条件与天气决定以运营方为准']});
add('edinburgh','experience','scotch-whisky','苏格兰威士忌体验馆导览','The Scotch Whisky Experience','https://www.scotchwhiskyexperience.co.uk/','354 Castlehill, Royal Mile, Edinburgh',55.949,-3.195,'爱丁堡城堡附近的威士忌文化导览，银色与金色体验的时间、品饮数量不同；饮酒仅适用成年旅客。',['威士忌文化','城堡街区','分级品饮'],[
  official('silver','Silver 导览',25,['约 50 分钟导览','成人一款威士忌品饮'],['额外饮品、餐饮和交通'],'官网成人 £25，50 分钟；未成年和无酒精安排须向场馆确认。',{durationMinutes:50}),
  official('gold','Gold 导览与品饮',39.75,['约 75 分钟导览及品饮','共五款威士忌体验'],['餐饮和交通'],'官网成人 £39.75，75 分钟；Gold 为 18 岁以上方案。',{durationMinutes:75}),
],{durationMinutes:75,requirements:['按预约时间到 Castlehill 场馆集合','Gold 和含酒精品饮须满 18 岁并携带实体带照片身份证件','银色体验可咨询家庭与不饮酒安排，预算当前按成人票计']});
add('dublin','experience','guinness-storehouse','健力士仓库与 Gravity Bar','Guinness Storehouse','https://www.guinness-storehouse.com/en','St. James’s Gate, Dublin 8',53.342,-6.287,'七层啤酒文化展馆的自主参观，官方售票介绍约 90 分钟，结束可在 Gravity Bar 领取一杯健力士或软饮。',['酿造文化','自主参观','Gravity Bar'],[
  option('self-guided','自主参观＋Gravity · 预算',25,40,['自主参观','Gravity Bar 一杯指定啤酒或软饮'],['额外品饮、餐饮、酒店交通'],{note:'官网确认服务与约 90 分钟；在线价格随日期时段变化，此为编辑预算，不采用未选人数页面的 0.00 价格。'}),
],{durationMinutes:90,requirements:['预订具体入场时段并到 St. James’s Gate 入口','饮酒限 18 岁以上；软饮替代与儿童票按官方规则','不是人工全程导游产品']},'官网及其官方售票域名 cietours.guinness-storehouse.com 确认 Self-Guided Experience + Gravity、约 90 分钟和饮品；未查询有效成人指定日成交价。');
add('prague','experience','prague-boats','Prague Boats 伏尔塔瓦河游船','Prague Boats Sightseeing Cruise','https://www.prague-boats.cz/one-hour-river-cruise/','Dvořák Embankment at Čech Bridge, Prague',50.093,14.418,'Čech Bridge 旁码头出发的观光游船，产品虽称一小时游船，官网实际航程写 50 分钟；另预留报到时间。',['伏尔塔瓦河','电动游船','多语言导览'],[
  option('sightseeing','50 分钟观光船 · 预算',550,700,['50 分钟观光航程','在线 GPS 与纸质导览'],['船上餐饮、酒店接送'],{note:'官网预约目录展示 CZK 550 起；区间上限为编辑留量，尚未核对所选日期。'}),
],{durationMinutes:75,requirements:['提前订票并确认 Čech Bridge 码头编号与班次','预留约 25 分钟报到缓冲，实际航程 50 分钟','船上饮品与零食另付，不是含晚餐游船']});
add('vienna','experience','spanish-riding-school','西班牙骑术学校晨训观摩','Spanish Riding School Morning Exercise','https://www.srs.at/en/tickets/morning-exercise','Michaelerplatz 1, Hofburg, Vienna',48.207,16.367,'在霍夫堡骑术学校观看约 60 分钟晨间训练；这不是正式整场演出，也不是游客骑马课程。',['利比扎马','霍夫堡','晨训观摩'],[
  option('morning','晨训入场 · 预算',17,35,['官网 Morning Exercise 入场观摩'],['正式表演、马厩导览和骑马课程'],{note:'官方首页列 Morning Exercise 约 60 分钟、EUR 17 起；座位及日期差异另查，此为预算区间。'}),
],{durationMinutes:60,preferredStartTime:'10:00',requirements:['须在官网选择实际晨训日期；10:00 是待确认的规划时刻','官网活动说明 3 岁以上；儿童票和观看区域须确认','不保证包含完整表演动作；不得与正式演出票混淆']});
add('budapest','experience','szechenyi','塞切尼温泉浴场','Széchenyi Thermal Bath','https://www.szechenyibath.hu/prices-2026','Állatkerti körút 9–11, Budapest',47.519,19.082,'布达佩斯城市公园内的温泉浴场，官网按工作日、周末及旺季区分票价。以下区间直接来自 2026 价表，按普通日票规划约三小时，不代表门票仅限三小时。',['历史浴场','室内外温泉','储物柜票'],[
  option('locker','日票＋储物柜',13200,15800,['日间浴场门票','储物柜使用'],['毛巾拖鞋购买、按摩、餐饮、酒店交通'],{type:'official',checkedAt:date,note:'官网 2026：周一至四 13,200，周五及周末 14,800，节假日旺季 15,800 HUF。'}),
  option('fast-track','Fast Track 日票＋储物柜',15200,17800,['官网 Fast Track 入场','储物柜使用'],['毛巾拖鞋购买、按摩、餐饮、酒店交通'],{type:'official',checkedAt:date,note:'官网 2026：15,200 / 16,800 / 17,800 HUF，按日期分类；仅在线购票。'}),
],{durationMinutes:180,requirements:['按实际日期查询工作日/周末/旺季价格并预订','自备合规泳装、拖鞋与毛巾；官网提示不提供租赁，购买另付','年龄、泳池使用及临时关闭范围按场馆最新规则']});
add('athens','experience','greek-cooking','雅典希腊料理课堂与晚餐','Athens Walking Tours Cooking Class','https://athenswalkingtours.gr/food-drink/athens-cooking-lesson-dinner-18.html','Thissio area, Athens; exact venue provided with confirmation',37.976,23.720,'Thissio 区域的英语料理课，亲手准备希腊菜并享用完整晚餐，全程约四小时；不是卫城景点导览。',['动手烹饪','希腊晚餐','小组体验'],[
  official('class-dinner','烹饪课堂＋晚餐',98,['当地料理老师与动手制作','完整晚餐','一杯葡萄酒、啤酒或软饮'],['酒店接送和额外饮品'],'官网 AGT10 成人 EUR 98、4 小时、最多 16 人小组。',{includedMeals:['dinner'],maxParticipants:16}),
],{durationMinutes:240,preferredStartTime:'16:00',requirements:['须提前预约；16:00 为晚餐课堂的规划占位，实际上课时刻以确认单为准','Thissio 地区集合，具体餐厅由确认邮件提供','饮食限制提前沟通，未包含酒店接送'],maxParticipants:16});
add('santorini','experience','spiridakos-catamaran','Spiridakos 火山海湾双体帆船','Spiridakos Sailing Cruises','https://www.santorini-yachts.com/cruise/catamaran-semi-private-cruise/','Vlychada Marina, Santorini; hotel pickup confirmed by operator',36.339,25.435,'从 Vlychada Marina 出发的火山海湾日间拼船，官网航程 10:30–15:30，含酒店接送、船上午餐与浮潜装备；规划额外为酒店往返留两小时缓冲，实际接送按酒店位置确认。',['火山海湾','双体帆船','含午餐接送'],[
  option('classic','Classic 日间拼船 · 预算',100,160,['五小时拼船航程与浮潜装备','船上烧烤、意面与沙拉午餐及指定饮品','官网范围内酒店往返接送'],['额外酒水、私人包船及未列服务'],{includedMeals:['lunch'],includesTransfers:true,note:'官网 Classic 从 EUR 100 起；100–160 为编辑范围。五小时船程加两小时编辑接送缓冲，全程规划七小时。'}),
],{durationMinutes:420,preferredStartTime:'09:30',requirements:['提前预约 Classic 日间航程，并确认酒店接送地点与实际时间','官网船程 10:30–15:30；09:30 仅为接送规划占位，不是已确认接人时刻','坐标为 Vlychada 港区近似位置，具体码头以确认单为准']});
add('madrid','experience','corral-flamenco','Corral de la Morería 弗拉门戈','Corral de la Morería','https://www.corraldelamoreria.com/','Calle Morería 17, Madrid',40.412,-3.714,'马德里传统 tablao 的弗拉门戈表演，官网区分含饮品的演出与演出加晚餐；本条只预算演出和一杯指定饮品。',['弗拉门戈','现场演出','传统 tablao'],[
  option('show-drink','表演＋指定饮品 · 预算',50,75,['预约场次的弗拉门戈表演','该票种包含的指定饮品'],['晚餐、额外饮品、酒店交通'],{note:'官网售票说明存在演出含饮品票种，但未查询所选日期价格；区间为编辑预算。'}),
],{durationMinutes:90,preferredStartTime:'19:00',requirements:['提前预订具体场次；19:00 仅是待确认的夜间规划占位','官网不接待 7 岁以下儿童','演出约一小时，规划加报到约 90 分钟；晚餐不含在本方案']});
add('vancouver','experience','prince-of-whales','Prince of Whales 半日观鲸','Prince of Whales Vancouver','https://princeofwhales.com/tour/half-day-whale-watching-vancouver/','1666 Duranleau Street, Granville Island, Vancouver',49.271,-123.136,'从 Granville Island 出发的半日观鲸，官网航程 3–5 小时并要求提前 30 分钟报到；观察到的动物取决于当天海况与位置。',['Granville Island','半日观鲸','海岸野生动物'],[
  option('half-day','半日观鲸成人 · 预算',250,320,['成人观鲸航程','编辑预留的税费与运营附加费缓冲'],['餐饮、酒店接送和自愿小费'],{note:'官网标 CAD 229 起另加税费、随季节定价；250–320 是含预留税费缓冲的编辑预算，不是官网总价。'}),
],{durationMinutes:330,requirements:['提前预订季节内实际日期并在出发前 30 分钟报到','Granville Island Adventure Centre 集合，不是 Canada Place 码头','3–5 小时为船程，报到与市内往返需另留时间；不保证看见鲸']});
add('mexico-city','experience','volare-balloon','Volare 特奥蒂瓦坎热气球','Volare Shared Balloon Flight','https://volare.com.mx/en/shared-balloon-flight/','Globopuerto Volare, Teotihuacán; hotel pickup option in Mexico City',19.704,-98.846,'活动位于墨西哥城以外的特奥蒂瓦坎，飞行约 30–50 分钟，现场流程约三小时；从墨西哥城参加应另算清晨来回道路交通。',['遗址周边热气球','共享篮筐','含早餐'],[
  option('self-arrival','自行抵达球场 · 预算',2900,3500,['共享热气球飞行','现场咖啡与墨西哥早餐'],['墨西哥城往返接送、遗址门票、影像加购'],{durationMinutes:180,preferredStartTime:'05:45',includedMeals:['breakfast'],note:'官网标准成人价 MXN 2,900，另有选定日期促销；为避免把促销当通用价，此处按 2,900–3,500 编辑预算。'}),
  option('hotel-transfer','墨西哥城酒店接送 · 预算',3400,4100,['共享飞行、咖啡与早餐','指定旅游区酒店往返接送'],['遗址门票、延长遗址参观与影像加购'],{durationMinutes:420,preferredStartTime:'04:00',includedMeals:['breakfast'],includesTransfers:true,note:'官网成人基础 2,900 加往返接送 500 MXN；上限及全程七小时为编辑留量，实际接送时刻另确认。'}),
],{durationMinutes:420,requirements:['必须预约；天气可停飞，携带运营方认可的身份证件','自行到达方案需约 05:45 在城外球场集合；交通另留时间','接送仅适用指定旅游区酒店，不默认覆盖民宿或私人住所；04:00 只是规划占位','遗址入场和额外三小时遗址游览不自动包含']});
add('cancun','experience','aquaworld-jungle','Aquaworld 红树林快艇与浮潜','Aquaworld Jungle Tour','https://aquaworld.com.mx/tours/jungle-tour/','Aquaworld Marina, Boulevard Kukulcán, Hotel Zone, Cancún',21.090,-86.773,'约两小时的 Nichupté 红树林快艇与海边浮潜活动，码头位于酒店区；虽然使用双人小艇，官网活动预算按每人计。',['红树林水道','快艇驾驶','珊瑚礁浮潜'],[
  option('jungle','Jungle Tour＋生态费缓冲 · 预算',2550,3100,['活动导览、快艇与浮潜装备','饮水、储物柜和淋浴','为每人 USD 22 珊瑚保育费预留的比索缓冲'],['酒店接送、照片视频与额外餐饮'],{note:'官网西语页标 MXN 2,100 起，另付每人 USD 22 生态费；此处合并后的 MXN 区间是汇率及税费缓冲估算，不是官方总价。'}),
],{durationMinutes:150,requirements:['提前预约并自行到 Aquaworld 酒店区码头报到','官网要求会游泳；驾驶者至少 18 岁，参与年龄 5–65 岁，儿童另用儿童票','孕期或酒精药物影响下不可参加；以运营方完整参与条件为准','两小时活动另加报到缓冲，酒店接送不包含']});

// Fine-dining estimates must not invent an à-la-carte menu where only tasting is established.
for (const slug of ['patrick-guilbaud','elements','deessa']) {
  const r = rows.find(x => x.id.endsWith(`restaurant-${slug}`));
  const names = ['品鉴用餐 · 基础预算','品鉴与饮品 · 舒适预算','品鉴与高档饮品 · 宽松预算'];
  r.priceOptions.forEach((p, i) => { p.name=names[i]; p.includes=[i ? '为经营者实际可订品鉴菜单及饮品预留的用餐预算' : '为经营者实际可订品鉴或午餐菜单预留的用餐预算']; p.description=p.includes[0]; });
}

const expected = 'reykjavik vik akureyri male maafushi cappadocia tromso rovaniemi interlaken queenstown auckland edinburgh dublin prague vienna budapest athens santorini madrid vancouver mexico-city cancun'.split(' ');
if (rows.length !== 66 || new Set(rows.map(r=>r.id)).size !== 66) throw new Error('Expected 66 unique offers');
for (const id of expected) for (const kind of ['restaurant','hotel','experience']) if (!rows.some(r=>r.cityId===id&&r.kind===kind)) throw new Error(`${id}/${kind}`);
for (const r of rows) for (const p of r.priceOptions) {
  if (!(p.low >= 0 && p.high >= p.low) || (p.type==='estimate' && p.checkedAt!==null)) throw new Error(r.id);
}
const out = new URL('../data/experience-expansion/', import.meta.url);
mkdirSync(out,{recursive:true});
writeFileSync(new URL('europe-islands-americas.json',out),JSON.stringify(rows,null,2)+'\n');
const header = `# 欧洲、海岛、美洲与新西兰体验来源核验\n\n核验日期：${date}。范围：22 城，66 个真实经营者场所或具体活动，每城餐厅、酒店、活动各一条。\n\n本文件核验实体身份与官网介绍，并记录能直接读到的公开价格。没有进行指定入住日、乘船日或用餐日的库存查询；不表示当前营业、可订或履约得到确认。酒店全部为编辑预算，按每间每晚，不是每人。未公开费用及只有起价的产品保持 type=estimate、price.checkedAt=null；记录 checkedAt 只代表服务介绍核验。\n\n所有坐标显式标 approximate。大部分为已核对地址附近的人工位置参考；Bearhill 为罗瓦涅米接送区域、Spiridakos 为南部港区示意，不能当作犬舍或登船点导航。活动中的接送范围、集合时间与未含项目保留在 requirements/includes/excludes。05:00、04:00 等规划占位不是已确认预约时间。\n\n官方价保留票种和限制：例如普通成人价、按工作日或旺季的区间，以及明确的菜单加配价格。预算不套用特殊促销或未选择人数的零价。可选自愿小费和未公开附加服务费未假称已计入。餐厅自选预算的三个层次不是商家发布的三个套餐。\n\n运行 scripts/build-experience-expansion-europe.mjs 只重建此核验快照，不联网更新。未来更新需重新读来源并核对适用日期，不能仅改 checkedAt。\n\n`;
let body='';
for (const cityId of expected) {
  body+=`## ${cities.find(c=>c.id===cityId).name}（${cityId}）\n\n`;
  for (const {item:r,verified} of evidence.filter(e=>e.item.cityId===cityId)) {
    body+=`- **${r.name}**（${r.kind}）：[官网证据](${r.sourceUrl})。${verified}\n`;
    body+=`  - 价格记录：${r.priceOptions.map(p=>`${p.name} ${p.low===p.high?p.low:`${p.low}–${p.high}`} ${p.currency}/${p.unit}；${p.type==='official'?'官网公开价':'编辑估算'}；${p.note}`).join('；')}\n`;
  }
  body+='\n';
}
body+='## 补充价格与内容交叉核验\n\n';
body+='- [Fergburger 2026 英文菜单](https://fergburger.com/wp-content/uploads/2026/04/Fergburger-english-menus.pdf)：采用 2026 PDF 的单品价格；没有把旧 2024 菜单当作当前价。\n';
body+='- [Royal Balloon 官网](https://royalballoon.com/)：Queen / Queen Plus / King 均列飞行 60 分钟，分别 20–24 / 最多 16 / 8–12 人篮筐，含酒店接送与简早餐；2026 价格需询问，不沿用旧版 75 分钟说明。\n';
body+='- [Sky Lagoon 官方票种页](https://www.skylagoon.com/is/leidir-til-ad-njota/)：Saman 为公共更衣，Sér 为独立更衣，均含 Skjól；起价不等于全日期成交价。\n';
body+='- [Guinness 官方售票内容](https://cietours.guinness-storehouse.com/list/otherProducts?lang=en)：自主参观约 90 分钟，含 Gravity Bar 啤酒或软饮；未选人数显示 0.00 不构成免费票。\n';
body+='- [Shotover 官方常见问题](https://www.shotoverjet.com/experience/faqs/)：镇外基地约十分钟车程，免费市中心接驳仅指定班次可预约，因此没有无条件标 includesTransfers。\n';
body+='- [Prince of Whales 官方目录](https://princeofwhales.com/all-tours/)：CAD 229 起另加税费，3–5 小时；本包 250–320 CAD 是明确标识的编辑现金预算。\n';
body+='- [Volare 西语具体产品](https://volare.com.mx/vuelo-compartido/)：30–50 分钟飞行、早餐、MXN 500/人加购接送；接送不含民宿私人地址，遗址门票另付。取消促销假设，保留普通基础价与预算上限。\n';
body+='- [Aquaworld 西语具体产品](https://aquaworld.com.mx/tours/jungle-tour/)：2 小时、每人 USD 22 保育费另付、无酒店接送；组合后的比索金额只标估算。\n';
mkdirSync(new URL('../docs/',import.meta.url),{recursive:true});
writeFileSync(new URL('../docs/experience-expansion-europe-islands-americas.md',import.meta.url),header+body);
console.log(JSON.stringify({offers:rows.length,cities:expected.length,options:rows.reduce((n,r)=>n+r.priceOptions.length,0),officialOptions:rows.flatMap(r=>r.priceOptions).filter(p=>p.type==='official').length}));
