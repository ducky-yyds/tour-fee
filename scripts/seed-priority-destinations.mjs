// Evidence and intentionally unverified budget ranges for the 2026-09 expansion.
import { mkdirSync, writeFileSync } from 'node:fs';
const rows = [];
const wiki = title => ({ sourceUrl: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(title.replaceAll(' ', '_')) });
function city(id,name,nameEn,country,countryCode,currency,region,lat,lng,iata,source,tagline,prices,food,areas,places,extra={}) {
  const c = { id,name,nameEn,country,countryCode,currency,region,lat,lng,iata,tagline,description:tagline, tags:extra.tags || ['文化与风景','当地生活','自由探索'], image:wiki(extra.article || nameEn), officialTourismUrl:source,
    daily:{lodging:prices[0],food:prices[1],transport:prices[2],misc:prices[3]},monthly:{rent:prices[4],utilities:prices[5]},
    budgetBasis:{type:'editorial-estimate',updatedAt:'2026-09-22',note:'经济/舒适/高端为人工规划区间，非实时报价，也非市场最低最高价。住宿按每间每晚，餐饮、交通及杂项按每成人每天。月租、水电按每房每月；季节、车型、地段与税费须逐项核对。'},
    guide:{cityId:id,intro:tagline,foodHighlights:food.map(([name,description])=>({name,description})),neighborhoods:areas.map(([name,description])=>({name,description})),experienceIntro:extra.experienceIntro || '先挑选真正感兴趣的地点；项目时段、交通与预约条件请在官方页面确认。'},
    transportNote:extra.transportNote || '时间与路程按地理模型估算；实际公共交通时刻、营业安排和预约余位需确认。', ...extra,
    attractions:places.map(([slug,n,en,x,y,h,lo,hi,desc,opts={}],i)=>({id:`${id}-${slug}`,name:n,nameEn:en,lat:x,lng:y,durationHours:h,category:opts.category || '文化与风景',description:desc,features:opts.features || [n,lo===0&&hi===0?'公共区域':'可预约参观','自由选择用时'],bestTime:opts.bestTime || '白天；开放时段请确认',priority:98-i*3,durationRange:{min:Math.max(30,Math.round(h*30)),recommended:h*60,max:Math.min(720,h*90)},image:opts.noArticle?{}:wiki(opts.article || en),price:{low:lo,high:hi,currency,type:'estimate',checkedAt:null,sourceUrl:opts.source || source,sourceName:'官方旅游或场馆资料',note:lo===0&&hi===0?'公共区域或基础参观按零门票规划，开放状态未逐项实时核验；停车、交通、展览和消费另计。':'人工票价预算区间，未核验所选日期报价；来源确认地点与服务，不能作为价格凭证。交通、停车、导览及附加项目除非明确列出均另计。'},...opts})),
  }; rows.push(c); return c;
}
const ice=[[15000,30000,65000],[5000,10000,21000],[2500,6500,18000],[1000,2200,5500],[180000,320000,650000],[18000,30000,50000]];
const iceFood=[['鱼汤与海鲜','用一碗热汤衔接海边散步；餐厅与外带价格相差明显。'],['羊肉与Skyr','羊肉料理和冰岛乳制品适合认识本地饮食。']];
city('reykjavik','雷克雅未克','Reykjavík','冰岛','IS','ISK','欧洲',64.1466,-21.9426,'KEF','https://visitreykjavik.is/sights-attractions','从彩色街道与海港出发，把温泉和火山地貌留给更从容的一天。',ice,iceFood,[['市中心与海港','教堂、音乐厅和海滨步道适合连成市内路线。'],['黄金圈','辛格维利尔、间歇泉与黄金瀑布在城外，建议独立公路日。']], [
 ['hallgrimskirkja','哈尔格林姆教堂','Hallgrímskirkja',64.1417,-21.9266,1,1000,2000,'观看教堂建筑，预算包含登塔参考；礼拜和登塔时间需分别确认。'],
 ['harpa','哈帕音乐厅','Harpa (concert hall)',64.1504,-21.9326,1,0,0,'欣赏玻璃立面与可开放公共区域；演出和导览另付。'],
 ['sun-voyager','太阳航海者雕塑','The Sun Voyager',64.1476,-21.9223,0.5,0,0,'沿海边步道看船形雕塑与山海轮廓。'],
 ['tjornin','托宁湖','Tjörnin',64.1445,-21.9418,1,0,0,'城市湖泊与湖畔公园漫步。'],
 ['national-museum','冰岛国家博物馆','National Museum of Iceland',64.1422,-21.9482,2,2500,4500,'通过文物和展览了解冰岛历史。'],
 ['perlan','珍珠楼自然展馆','Perlan',64.1294,-21.9187,2.5,6500,9500,'参观以冰川、地质和自然为主题的展馆；具体票种另核。'],
 ['thingvellir','辛格维利尔国家公园','Þingvellir',64.2559,-21.1295,3,0,0,'沿裂谷和历史议会遗址步道探索；停车及潜水另计。',{routeMode:'road',accessNote:'距首都较远，需自驾或预订公路团，冬季以道路状态为准。',source:'https://www.thingvellir.is/'}],
 ['gullfoss','黄金瀑布','Gullfoss',64.3271,-20.1199,1.5,0,0,'从观景平台欣赏峡谷瀑布；低温和风大时注意步道开放。',{routeMode:'road',accessNote:'黄金圈远郊景点，建议独立公路游览日。',source:'https://www.south.is/en/destinations/travel-routes/the-golden-circle'}],
 ['strokkur','史托克间歇泉','Strokkur',64.3104,-20.3003,1,0,0,'在指定步道观察间歇泉；保持地热区安全距离。',{routeMode:'road'}],
 ['blue-lagoon','蓝湖温泉','Blue Lagoon (geothermal spa)',63.8804,-22.4495,3,13000,22000,'在地热温泉休息；预约、道路与火山活动相关开放情况需出发前确认。',{routeMode:'road',source:'https://www.bluelagoon.com/',accessNote:'不在市中心；交通另计，不能假定始终开放。'}],
],{transportNote:'市区可步行及公交；黄金圈、蓝湖等城外目的地需另订接驳、自驾或跟团。冬季日照与路况会改变可行行程。',article:'Reykjavík'});
city('vik','维克与冰岛南岸','Vík í Mýrdal','冰岛','IS','ISK','欧洲',63.4186,-19.006,'KEF','https://www.south.is/en/destinations/travel-routes/the-south-coast','以维克为落脚点，慢慢看黑沙海岸、瀑布与冰川边缘。',[[18000,35000,70000],...ice.slice(1)],iceFood,[['维克镇与海岸','小镇、教堂和海滩可以组合短线。'],['斯科加与冰川方向','瀑布和冰川分散在公路沿线，预留停车及风雨缓冲。']], [
 ['reynisfjara','雷尼斯黑沙滩','Reynisfjara',63.4044,-19.0444,1.5,0,0,'在指定区域观察玄武岩与海蚀柱；不接近海水。',{accessNote:'离岸巨浪可能突袭，遵守现场分区警报；停车另计。'}],
 ['dyrholaey','迪霍拉里海岬','Dyrhólaey',63.3999,-19.126,1.5,0,0,'欣赏海蚀拱门和黑沙海岸线。',{accessNote:'道路、风势与鸟类繁殖季可能限制进入。'}],
 ['skogafoss','斯科加瀑布','Skógafoss',63.5321,-19.5114,1.5,0,0,'在瀑布前和开放阶梯旁看水雾与地形。'],
 ['skogar-museum','斯科加民俗博物馆','Skógar Museum',63.5255,-19.4945,2,2500,4500,'草皮屋和民俗收藏展现南岸生活。'],
 ['solheimajokull','索尔黑马冰川观景步道','Sólheimajökull',63.5308,-19.3705,2,0,0,'只安排通往冰川前缘的开放步道与远观。',{accessNote:'上冰川必须另订合格导览及装备，本条不含冰川徒步。'}],
 ['seljalandsfoss','塞里雅兰瀑布','Seljalandsfoss',63.6156,-19.9886,1.5,0,0,'从观景步道欣赏南岸瀑布；瀑布背后小径以当天开放为准。'],
 ['gljufrabui','秘密瀑布','Gljúfrabúi',63.6208,-19.9856,1,0,0,'峡谷中的瀑布，涉水与结冰条件不佳时仅在外侧观看。'],
 ['fjadrargljufur','羽毛峡谷','Fjaðrárgljúfur',63.7713,-18.1719,2,0,0,'沿开放观景路径观察苔原峡谷。',{accessNote:'距维克较远，脆弱植被区域可能季节关闭，勿离开步道。'}],
],{routeMode:'road',transportNote:'景点分散，采用公路行程估算；需自驾、包车或已确认巴士团。凯夫拉维克为国际门户，不是维克镇机场。冰川和冬季道路不可只按直线距离安排。'});
city('akureyri','阿克雷里','Akureyri','冰岛','IS','ISK','欧洲',65.6826,-18.0907,'AEY','https://www.visitakureyri.is/en/see-and-do/attractions','在北方峡湾小城看花园与博物馆，再为米湖和瀑布留出公路游览日。',ice,iceFood,[['老城与花园','教堂、植物园和老城展馆可以慢走。'],['米湖与众神瀑布','北部自然景观相距较远，需单独核对路况。']], [
 ['church','阿克雷里教堂','Akureyrarkirkja',65.6796,-18.0909,1,0,0,'登上教堂前台阶看城市与峡湾；室内开放以礼拜安排为准。'],
 ['botanical','阿克雷里植物园','Akureyri Botanical Garden',65.6745,-18.0924,1.5,0,0,'在北方植物园辨认花卉；主要户外观赏季节有限。'],
 ['art-museum','阿克雷里美术馆','Akureyri Art Museum',65.6807,-18.0906,1.5,1500,3000,'了解冰岛和北方艺术展览。'],
 ['museum','阿克雷里博物馆','Akureyri Museum',65.6682,-18.0788,1.5,1800,3500,'从老城展品认识港口与日常生活。'],
 ['godafoss','众神瀑布','Goðafoss',65.6828,-17.5502,1.5,0,0,'在河岸观景步道看弧形瀑布。',{routeMode:'road'}],
 ['myvatn','米湖','Mývatn',65.6039,-16.9973,3,0,0,'湖岸地貌与湿地观景，选择开放停车点步道。',{routeMode:'road',accessNote:'远郊公路景区，湖周不适合一次短途步行全部走完。'}],
 ['dimmuborgir','黑暗城堡熔岩地貌','Dimmuborgir',65.5913,-16.9123,2,0,0,'循标记步道穿行熔岩柱与天然拱形地貌。',{routeMode:'road'}],
 ['namafjall','纳马山地热区','Námafjall',65.6411,-16.8087,1.5,0,0,'在步道上观察泥浆池与地热喷气，停车费另计。',{routeMode:'road'}],
],{transportNote:'镇内步行；米湖、地热区和众神瀑布建议自驾或公路团，冬季受路况和日照限制。'});
const mvPrices=[[60,150,450],[20,55,130],[10,40,120],[5,15,40],[900,2000,6000],[100,200,450]];
const mvFood=[['Mas huni与薄饼','金枪鱼、椰丝与薄饼构成本地常见早餐。'],['咖喱鱼与海鲜','居民岛餐厅和度假村餐饮计价差异大，查明服务费及税是否包含。']];
const mvExtra={travelGroup:'male',transportNote:'旅游预算以USD表达；本地同时使用MVR。跨岛需核对快艇/渡轮班次与天气，度假村接送可能需额外购买水飞或专船。居民岛住宿与度假村不可视作同一种产品。',budgetBasis:{type:'editorial-estimate',updatedAt:'2026-09-22',note:'以USD编制旅游预算（当地法币MVR）。食宿为人工估算，已预留一般消费税及服务费；Green Tax单列，住宿已含税报价请将该行调为0避免重复。月度数据为旅居假设，不代表长租房源。'},greenTax:{currency:'USD',low:6,high:12,sourceUrl:'https://www.mira.gov.mv/Legislations/View/Green-tax-regulation',checkedAt:'2026-09-22',note:'按成人和住宿晚数预留，50间及以下居民岛酒店/客栈通常6美元，大型酒店及度假村通常12美元。实际按法规24小时段和入住类型核算；若住宿总价已含请将本项改0。'}};
city('male','马累与周边岛屿','Malé','马尔代夫','MV','USD','亚洲',4.1755,73.5093,'MLE','https://old.visitmaldives.com/male-city/','从马累的集市、清真寺和海边开始，区分首都生活与度假岛体验。',mvPrices,mvFood,[['马累市区','博物馆、历史清真寺与市场较集中。'],['胡鲁马累与维利马累','胡鲁马累有陆路桥梁，维利马累仍须渡轮；不要直接按步行路线跨海。']], [
 ['friday-mosque','马累古星期五清真寺','Malé Friday Mosque',4.1784,73.5124,1,0,0,'观看珊瑚石建筑和历史细节。',{accessNote:'宗教场所，非礼拜访客进入范围、着装及许可需现场确认。',travelGroup:'male'}],
 ['islamic-centre','伊斯兰中心与共和广场','Islamic Centre (Maldives)',4.1787,73.5108,1,0,0,'在金色穹顶附近的公共广场认识城市地标。',{travelGroup:'male'}],
 ['museum','马尔代夫国家博物馆','National Museum (Maldives)',4.1753,73.5091,1.5,7,15,'通过王室与地方历史藏品认识岛国。',{travelGroup:'male'}],
 ['sultan-park','苏丹公园','Sultan Park',4.1761,73.5103,1,0,10,'在首都绿地休息；非居民或活动时段费用以入口公告为准。',{travelGroup:'male'}],
 ['fish-market','马累鱼市场','Malé Fish Market',4.1794,73.5083,1,0,0,'观察港口鱼获交易；尊重市场作业空间。',{travelGroup:'male'}],
 ['tsunami','海啸纪念碑','Tsunami Monument',4.1721,73.5014,0.5,0,0,'在城市海边了解纪念建筑与海岸线。',{travelGroup:'male'}],
 ['hulhumale','胡鲁马累海滨','Hulhumalé',4.213,73.544,2.5,0,0,'沿海岸公共区域散步，咖啡和水上活动另付。',{travelGroup:'male',routeMode:'road',accessNote:'可经桥梁陆路前往；居民区海滩着装规定不同于度假岛。'}],
 ['villimale','维利马累岛','Villimalé',4.1735,73.4854,3,0,0,'离开密集市区，在小岛公共街道与海岸步行。',{travelGroup:'villimale',routeMode:'boat',accessNote:'必须核对往返渡轮或船班；门票为零不表示交通免费。'}],
],mvExtra);
city('maafushi','马富施岛','Maafushi','马尔代夫','MV','USD','亚洲',3.9426,73.4908,'MLE','https://maafushi.gov.mv/guide','用居民岛作落脚点，按自己的节奏选择海滩、附近岛屿和海上行程。',[[50,110,250],[20,45,100],[15,55,150],[5,15,40],[750,1800,4500],[90,180,350]],mvFood,[['马富施北侧游客海滩','泳装活动仅在指定区域；居民区遵守当地着装要求。'],['南马累环礁周边','居民岛、私人度假岛和海上项目需分别确认船程与准入。']], [
 ['beach','马富施游客海滩','Maafushi Bikini Beach',3.946,73.4901,2,0,0,'在指定游客海滩休息，遮阳设施和水上活动另付。',{noArticle:true,travelGroup:'maafushi'}],
 ['gulhi','古丽岛','Gulhi',3.9912,73.5088,3,0,0,'乘船探访邻近居民岛，选择允许游客使用的海滩。',{travelGroup:'gulhi',routeMode:'boat',accessNote:'岛间船班并非随到随走，交通另计且须确认返程。'}],
 ['guraidhoo','古拉伊杜岛','Guraidhoo (Kaafu Atoll)',3.9004,73.4669,3,0,0,'在居民岛街道与海岸了解当地生活。',{travelGroup:'guraidhoo',routeMode:'boat',accessNote:'需船程及返程确认，岛上活动开放范围以当地指引为准。'}],
 ['biyadhoo','比亚度岛日间访问','Biyadhoo',3.9217,73.4588,5,100,220,'私人度假岛访问预算占位，仅在确认运营方接受日客时安排。',{travelGroup:'biyadhoo',routeMode:'boat',accessNote:'非公共岛屿；未确认日间准入及经营状态，不能直接上岛。海上交通另核。',automaticPlanning:false,priority:5}],
 ['fihalhohi','菲哈后岛日间访问','Fihalhohi',3.8772,73.3653,5,120,260,'私人度假岛的海滩与餐饮访问须取得运营方确认。',{travelGroup:'fihalhohi',routeMode:'boat',accessNote:'未取得当日准入，不参与自动推荐；费用仅为询价前预算。',automaticPlanning:false,priority:5,source:'https://www.fihalhohi.com.mv/'}],
],{...mvExtra,travelGroup:'maafushi',article:'Maafushi (Kaafu Atoll)',routeMode:'island',gatewayTransfer:{currency:'USD',values:[25,35,80],note:'国际门户为MLE马累机场，另预留机场到岛快艇费用；具体船班、码头、行李与接送包含项待核。'},transportNote:'机场位于马累附近，往返马富施必须另外安排船班。跨岛均按待核船程显示；交通预算覆盖日常船程预留，私人度假岛准入和包船费用须独立核价。'});
city('edinburgh','爱丁堡','Edinburgh','英国','GB','GBP','欧洲',55.9533,-3.1883,'EDI','https://www.visitscotland.com/places-to-go/edinburgh/things-to-do','沿石砌老城穿过皇家一英里，走上山丘看城市层叠的轮廓。',[[70,150,350],[25,55,130],[6,16,50],[8,20,50],[1100,2200,5000],[150,250,450]],[['苏格兰早餐','Haggis和丰盛早餐可以单独安排一餐。'],['海鲜与下午茶','港区海鲜与老城茶室风格不同，先看菜单与服务费。']],[['皇家一英里','城堡、巷道与宫殿构成历史轴线。'],['新城与利斯港','艺术馆、街道和港区适合另一日漫步。']], [
 ['castle','爱丁堡城堡','Edinburgh Castle',55.9486,-3.1999,3,22,35,'在火山岩上的城堡了解苏格兰历史。'],['royal-mile','皇家一英里','Royal Mile',55.9506,-3.1856,2,0,0,'沿老城主街看小巷、石建筑与商铺。'],['calton','卡尔顿山','Calton Hill',55.955,-3.1825,1.5,0,0,'登上城市观景山丘看纪念建筑。'],['arthur','亚瑟王座','Arthur’s Seat',55.9445,-3.1619,3,0,0,'在荷里路德公园选择适合体力的山路。',{article:"Arthur's Seat",accessNote:'山路与天气需确认，湿滑或大风时缩短路线。'}],['museum','苏格兰国家博物馆','National Museum of Scotland',55.9469,-3.19,3,0,0,'自然、科学与历史常设展，收费特展另计。'],['holyrood','荷里路德宫','Palace of Holyroodhouse',55.9527,-3.1723,2,20,35,'参观皇家宫殿与历史庭院；官方活动可能影响开放。'],['gallery','苏格兰国家美术馆','Scottish National Gallery',55.9509,-3.1957,2,0,0,'看常设艺术收藏，特别展览另计。'],['botanic','爱丁堡皇家植物园','Royal Botanic Garden Edinburgh',55.9651,-3.2093,2,0,0,'户外园区散步，温室和专项活动另核。'],
]);
city('dublin','都柏林','Dublin','爱尔兰','IE','EUR','欧洲',53.3498,-6.2603,'DUB','https://www.visitdublin.com/things-to-do','从书页、河岸与老街出发，认识都柏林的文学与日常生活。',[[90,180,400],[30,65,150],[8,20,65],[10,25,60],[1500,2600,5500],[150,260,450]],[['爱尔兰炖菜','炖菜与面包是认识本地餐桌的起点。'],['咖啡馆与酒馆餐食','听音乐、饮酒及餐食分别预算，注意年龄与场次限制。']],[['三一学院与利菲河','书籍、校园和河岸可以衔接步行。'],['凤凰公园与西城','公园面积大，展馆需要另留时间。']], [
 ['trinity','三一学院与凯尔经展','Trinity College Dublin',53.3438,-6.2546,2.5,20,40,'进入学院历史环境并参观所选书籍展；图书馆修复范围以官网为准。'],['guinness','健力士展馆','Guinness Storehouse',53.3419,-6.2868,2.5,25,45,'了解酿造历史与工业建筑，所含饮品依票种确认。'],['kilmainham','基尔梅纳姆监狱博物馆','Kilmainham Gaol',53.3419,-6.3098,2,8,18,'通过预约导览了解历史监狱，提前确认名额。'],['phoenix','凤凰公园','Phoenix Park',53.3559,-6.3298,3,0,0,'大型城市公园漫步，动物园和租车另付。'],['patrick','圣帕特里克大教堂','St Patrick’s Cathedral, Dublin',53.3395,-6.2714,1.5,8,16,'参观历史教堂建筑，礼拜与游客时段分开。',{article:"St Patrick's Cathedral, Dublin"}],['museum','爱尔兰国家博物馆考古馆','National Museum of Ireland – Archaeology',53.3404,-6.2545,2,0,0,'常设考古收藏参观，开放安排见官方。'],['stephens','圣史蒂芬绿地','St Stephen’s Green',53.3381,-6.2591,1.5,0,0,'在市中心公园缓一缓旅行节奏。',{article:"St Stephen's Green"}],['temple-bar','圣殿酒吧区','Temple Bar, Dublin',53.3456,-6.264,1.5,0,0,'街区漫步与小店浏览，餐饮演出另付。'],
]);
city('brussels','布鲁塞尔','Brussels','比利时','BE','EUR','欧洲',50.8503,4.3517,'BRU','https://www.visit.brussels/en/visitors/what-to-do/attractions-and-monuments.BME.251039','在大广场的建筑细节、漫画与博物馆之间安排一段城市漫步。',[[65,135,300],[25,55,130],[7,18,55],[7,18,45],[1000,1800,3800],[120,220,380]],[['华夫饼与巧克力','街头甜点和正式甜品店按份计费，购物另留预算。'],['青口与薯条','传统餐馆套餐留意份量、饮品和服务条件。']],[['大广场与老城','拱廊、小巷与广场可以步行串联。'],['欧洲区与五十周年公园','离开核心老城后以轨道交通衔接。']], [
 ['grand-place','布鲁塞尔大广场','Grand-Place',50.8467,4.3525,1.5,0,0,'观察市政厅与行会建筑，室内展览另付。'],['atomium','原子球塔','Atomium',50.895,4.3416,2,15,25,'进入城市标志性的球形建筑与展览。'],['manneken','撒尿小童','Manneken Pis',50.845,4.35,0.5,0,0,'老城街角的小型雕塑，适合顺路停留。'],['galleries','圣于贝尔拱廊','Royal Saint-Hubert Galleries',50.8475,4.3544,1,0,0,'穿过玻璃顶商业拱廊，消费另计。'],['magritte','马格利特博物馆','Magritte Museum',50.8425,4.3581,2,10,20,'从作品认识超现实主义艺术。'],['cinquantenaire','五十周年纪念公园','Cinquantenaire',50.8405,4.3922,2,0,0,'在拱门与绿地间步行，周边博物馆另计。'],['comic','比利时漫画中心','Belgian Comic Strip Center',50.851,4.3601,2,10,18,'在新艺术建筑中探索漫画文化。'],['cathedral','圣米歇尔及圣古都勒大教堂','Cathedral of St. Michael and St. Gudula',50.8479,4.3598,1,0,0,'观看教堂主要开放区，地下遗址或专题参观另核。'],
]);
city('dubrovnik','杜布罗夫尼克','Dubrovnik','克罗地亚','HR','EUR','欧洲',42.6507,18.0944,'DBV','https://tzdubrovnik.hr/lang/en/news/spomenici/index.html','沿亚得里亚海的城墙和石街走一走，为海岛与山顶各留一点时间。',[[65,150,380],[25,60,140],[7,22,70],[8,20,50],[1000,2300,5000],[100,200,380]],[['海鲜与黑墨鱼饭','老城景观餐位与普通餐馆价差明显。'],['达尔马提亚小食','以橄榄油、奶酪与面包认识沿海餐桌。']],[['老城与城墙','石阶较多，城墙独立购票，避免中午暴晒。'],['洛克鲁姆与斯尔季山','船程、缆车与天气都需要单独确认。']], [
 ['walls','杜布罗夫尼克城墙','Walls of Dubrovnik',42.6416,18.1085,2.5,30,45,'走上城墙看红瓦屋顶与海岸线，提前核对票种。'],['stradun','斯特拉顿大街','Stradun (street)',42.6414,18.1098,1.5,0,0,'老城主街和街巷慢步。'],['rector','总督宫','Rector’s Palace, Dubrovnik',42.6402,18.1106,1.5,12,20,'参观历史宫殿与城市收藏。',{article:"Rector's Palace, Dubrovnik"}],['franciscan','方济各会修道院','Franciscan Church and Monastery (Dubrovnik)',42.6421,18.1077,1.5,5,12,'看回廊、药房相关历史与馆藏。'],['lokrum','洛克鲁姆岛','Lokrum',42.6277,18.1219,4,25,40,'自然保护岛步道与修道院遗迹。',{routeMode:'boat',accessNote:'必须船程；门票和船票可能为组合价，结算时核对避免重复。'}],['srd','斯尔季山','Srđ',42.6505,18.1107,2,0,0,'在山顶看古城和海湾；本条不含缆车票。',{routeMode:'road',accessNote:'到山顶需确认徒步、公路或缆车方案，缆车另付。'}],['banje','班杰海滩','Banje Beach',42.6416,18.1156,2,0,0,'在海滩公共区域休息，躺椅和餐饮另付。',{noArticle:true}],['trsteno','特尔斯泰诺植物园','Trsteno Arboretum',42.7137,17.977,2,8,15,'在城外古老花园看植物与海景。',{routeMode:'road',accessNote:'远郊景点，需要安排往返交通。'}],
]);
city('cappadocia','卡帕多西亚·格雷梅','Cappadocia','土耳其','TR','TRY','亚洲',38.6431,34.8286,'NAV','https://goturkiye.com/cappadocia/routes','以格雷梅为落脚点，把洞穴遗址、山谷与清晨的天空分开安排。',[[2000,4500,12000],[800,1700,4200],[350,1200,3500],[200,600,1600],[18000,40000,100000],[1800,3500,6500]],[['陶罐炖肉','注意需提前预订的制作时间与份量。'],['土耳其早餐','酒店早餐是否含在房费中，订房时先确认。']],[['格雷梅与乌奇希萨尔','步道、岩石城堡和洞穴旅馆分布在山谷与坡地。'],['地下城与伊赫拉拉','较远遗址适合独立公路日，避免与清晨飞行挤在一起。']], [
 ['goreme','格雷梅露天博物馆','Göreme Open Air Museum',38.6402,34.845,2.5,1200,2000,'洞穴教堂与壁画遗址，特殊展区可能另票。'],['uchisar','乌奇希萨尔城堡','Uçhisar',38.6304,34.8049,2,150,400,'登上岩石城堡看周边山谷。'],['kaymakli','凯马克勒地下城','Kaymakli Underground City',38.4606,34.7523,2,600,1100,'在开放通道中认识地下聚落。',{article:'Kaymaklı underground city',accessNote:'狭窄阶梯与低顶空间，按体力和闭塞空间耐受选择。'}],['derinkuyu','代林库尤地下城','Derinkuyu underground city',38.3735,34.7348,2,600,1100,'参观地下空间，路线和开放层数以现场为准。'],['zelve','泽尔维露天博物馆','Zelve Open Air Museum',38.6697,34.8562,2.5,350,700,'在岩洞和山谷遗址间慢走。'],['avanos','阿瓦诺斯老镇','Avanos',38.7192,34.8461,2,0,0,'红河岸边与制陶街区漫步，制陶课程另付。'],['ihlara','伊赫拉拉峡谷','Ihlara Valley',38.2536,34.3018,4,450,850,'选择一段峡谷步道和开放岩石教堂。',{accessNote:'远郊且需步行体力，往返公路时间不包含在观光用时中。'}],['pigeon','鸽子谷','Pigeon Valley',38.6345,34.8128,2,0,0,'从观景点或开放步道欣赏鸽舍与岩石地形。',{noArticle:true}],
],{routeMode:'road',transportNote:'NAV为门户机场之一，也可查ASR；目的地是格雷梅周边区域。地形有坡度，跨谷与地下城按公路估算；热气球须另订运营方并受天气影响。'});
mkdirSync('data/expansion',{recursive:true});
// Precise Commons sources where the encyclopedia lead is missing or unsuitable.
const photoFiles = {
  maafushi:'Maafushi-Beach-Maldives.jpg',
  'maafushi-beach':'Maafushi-Beach-Maldives.jpg',
  'reykjavik-harpa':'The Harbour And Harpa (33650362931).jpg',
  'reykjavik-perlan':'Perlan 2.jpg',
  'reykjavik-blue-lagoon':'Blue Lagoon, Iceland (20869851002).jpg',
};
for (const entity of rows.flatMap(c => [c,...c.attractions])) if (photoFiles[entity.id]) entity.image={sourceUrl:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(photoFiles[entity.id].replaceAll(' ','_'))};
writeFileSync('data/expansion/priority.json',JSON.stringify(rows,null,2)+'\n');
writeFileSync('docs/expansion-priority.md','# 冰岛、马尔代夫与补充目的地\n\n2026-09-22核对官方旅游介绍。票价除单列Green Tax外全部是未核验的人工规划范围；坐标为规划参考，不能代替导航。马富施私岛准入未确认的地点保留候选，不自动推荐。\n\n'+rows.map(c=>`- ${c.name}：${c.attractions.length}处；[官方目的地资料](${c.officialTourismUrl})。${c.transportNote}`).join('\n')+'\n\n[马尔代夫Green Tax法规](https://www.mira.gov.mv/Legislations/View/Green-tax-regulation)：成人6或12 USD按住宿类型分别计收，本应用按夜数做预留，并非税务账单。\n');
console.log(JSON.stringify({cities:rows.length,sights:rows.reduce((n,c)=>n+c.attractions.length,0)}));
