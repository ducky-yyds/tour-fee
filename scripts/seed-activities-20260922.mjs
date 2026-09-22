import { writeFileSync, readFileSync } from 'node:fs';
const date='2026-09-22';
const rows=[];
function offer(cityId,slug,name,provider,address,lat,lng,durationMinutes,sourceUrl,description,options,extra={}) {
  const record={id:`ex-${cityId}-${slug}`,cityId,kind:'experience',name,provider,address,lat,lng,durationMinutes,sourceUrl,bookingUrl:sourceUrl,checkedAt:date,tagline:description,description,features:[],requirements:['须向运营方确认所选日期、余位和取消条件'],availabilityNote:'展示参考服务和预算；生成行程不代表完成预订。集合坐标为近似位置，以确认单为准。',priceOptions:[],...extra};
  record.priceOptions=options.map(([id,label,low,high,currency,includes=[],extras={}])=>({id,name:label,description:label,low,high,currency,unit:'person',type:'estimate',sourceUrl,checkedAt:null,note:'人工规划区间，未获取指定日期可订报价；税费与附加项目须在运营方页面确认。',includes,excludes:['未列明的附加消费','前往集合地点的交通'],...extras}));
  for(const option of record.priceOptions) if(option.type==='official') {option.checkedAt=date;option.note=option.note.startsWith('人工')?'官方公开成人参考价；不是所选日期的可订报价，条件及附加费请核对来源。':option.note;}
  rows.push(record);return record;
}
offer('shanghai','era','ERA 时空之旅 2','上海马戏城','静安区共和新路2266号',31.2807,121.4528,120,'https://whlyj.sh.gov.cn/','在杂技、舞台与多媒体之间，看一场属于上海的夜晚。',[
 ['standard','普通看台座位',280,480,'CNY',['指定区域演出票']],['premium','较优视野座位',580,880,'CNY',['较优区域演出票']]
],{features:['杂技艺术','夜间演出','分区座席'],preferredStartTime:'19:30',sourceUrl:'https://whlyj.sh.gov.cn/cmsres/60/60195750731c4871a03be0d896b2c7dc/7fdaf71fb7145466340c367268a7c85f.pdf',bookingUrl:'https://www.era-shanghai.com/'});
offer('beijing','hutong-breakfast','胡同早餐寻味步行','Lost Plate','鼓楼周边；精确集合点见预订确认',39.9412,116.3969,180,'https://lostplate.com/beijing-food-tours/','跟着本地向导穿过胡同，把一顿早餐变成认识北京的方式。',[
 ['breakfast','早餐小团步行',39,39,'USD',['早餐食物与饮品','当地向导'],{type:'official',includedMeals:['breakfast']}]
],{features:['胡同生活','地方早餐','小团步行'],preferredStartTime:'09:00',availabilityNote:'官网列9:00出发、约3小时；集合位置和饮食限制预订时确认。'});
offer('tokyo','yae-kimono','浅草和服租赁与街区散步','YAE Kimono Rental','浅草雷门周边门店，详见预约确认',35.7112,139.7945,120,'https://yae-japan.com/en/','选一套和服，体验穿着与配饰，再留出时间走进浅草。',[
 ['classic','基础和服与穿着服务',4000,6500,'JPY',['和服、腰带、鞋袋等配件','穿着协助']],['retro','复古款式预算',6500,10000,'JPY',['复古款式与基础配件','穿着协助']]
],{features:['和服体验','街区摄影','浅草散步'],requirements:['须按门店规定时间归还','摄影、发型与升级配件是否另收费以套餐为准'],availabilityNote:'此处2小时包括挑选穿着和附近散步，并非租赁期限。请勿与同一时段浅草游览重复安排。'});
offer('kyoto','canon-tea','伏见稻荷旁茶道体验','Tea Ceremony Canon Kyoto','72-1 Fukakusa Inarionmaecho, Fushimi',34.9683,135.7703,60,'https://kyoto-tea-ceremony.jp/book-tea-ceremony/','在伏见的茶室了解点茶礼仪，自己尝试一碗抹茶。',[
 ['shared','共享茶道场次',4000,4000,'JPY',['约40分钟茶道体验'],{type:'official'}],['kimono','茶道＋女式和服租赁',7300,7300,'JPY',['共享茶道','女式和服租赁'],{type:'official',durationMinutes:100,note:'4000日元茶道＋3300日元女式和服；男式和服加4400日元，发型另计，不适用于所有服装选择。'}]
],{features:['茶道礼仪','抹茶','伏见文化']});
offer('osaka','tombori-cruise','道顿堀水上观光船','一本松海运','太左卫门桥码头',34.669,135.5034,45,'https://www.ipponmatsu.co.jp/cruise/tombori.html','从河道看霓虹招牌与桥梁，给道顿堀换一个角度。',[
 ['adult','标准成人观光船',2000,2000,'JPY',['约20分钟航程'],{type:'official'}]
],{features:['道顿堀','城市水路','短程体验'],availabilityNote:'总时长45分钟包含登船余量；实际航班、停航和购票方式请看运营方。'});
offer('seoul','nanta','明洞乱打秀','PMC / NANTA','3F,26 Myeongdong-gil, Jung-gu',37.5637,126.9852,110,'https://www.nanta.co.kr/en/show/detail.php?id=1','用节奏、厨房道具与喜剧，体验不依赖语言的韩国舞台。',[
 ['a','A区座席',50000,50000,'KRW',['A区演出票'],{type:'official'}],['s','S区座席',60000,60000,'KRW',['S区演出票'],{type:'official'}],['vip','VIP座席',70000,70000,'KRW',['VIP区演出票'],{type:'official'}]
],{features:['无语言喜剧','打击乐','明洞剧场'],preferredStartTime:'17:00',availabilityNote:'官网工作日17:00/20:00，周末可能加场；此处17:00仅为排程建议，未核验余位。'});
offer('bangkok','princess-cruise','湄南河晚餐游船','Chao Phraya Princess','ICONSIAM码头（具体航班集合点见确认单）',13.7268,100.5107,150,'https://www.chaophrayaprincess.com/reservations.php','在河上享用晚餐，看曼谷两岸的寺庙与桥梁入夜。',[
 ['buffet','自助晚餐与观光航程',1200,2200,'THB',['晚餐自助','观光航程'],{includedMeals:['dinner']}]
],{features:['河景晚餐','夜景','自助餐'],preferredStartTime:'19:00',availabilityNote:'码头、船只、菜单与外籍票种请核对；本区间不是官网即时成交价。'});
offer('singapore','ifly','圣淘沙室内跳伞','iFly Singapore','43 Siloso Beach Walk',1.2514,103.8171,120,'https://online.iflysingapore.com/shop/redirect_to_tag?tagid=teaser','在风洞里体验悬浮，从一次尝试到更完整的飞行练习。',[
 ['teaser','Teaser · 1次飞行',59,99,'SGD',['1次风洞飞行','初次体验指导'],{type:'official',note:'提前至少2日59新币起，常规价99；具体场次适用价另核对。'}],['challenge','Challenge · 2次飞行',89,139,'SGD',['2次风洞飞行','初次体验指导'],{type:'official',note:'提前至少2日89新币起，常规价139；不含额外升级。'}],['training','Trial Training · 6次飞行',250,250,'SGD',['6次飞行','训练与教练指导'],{type:'official'}]
],{features:['风洞飞行','圣淘沙','不同体验次数'],requirements:['年龄、体重、健康和着装须符合运营方要求','2小时为报到、教学、换装与飞行的整体预留，不是连续飞行时间']});
offer('bali','discover-diving','图兰奔初次水肺潜水','Bali Hai Diving Adventures','Tulamben；南巴厘岛指定区域酒店接送',-8.2751,115.5943,480,'https://balihaidiving.com/program/discover-scuba-diving-bali/','在教练带领下学习水下呼吸，用一天体验巴厘岛海底。',[
 ['tulamben','图兰奔 · 2次体验潜水',2500000,2500000,'IDR',['两次体验潜水','潜水装备与PADI教练','指定区域酒店接送'],{type:'official',includesTransfers:true,note:'官网按至少2人报价；单人报名需询价。天气、水况、资格与确切接送范围需确认。'}]
],{features:['初次潜水','装备与教练','酒店接送'],preferredStartTime:'07:00',requirements:['报价至少2人；单人需另询','需填写运营方健康问卷并遵守潜水与飞行间隔要求','水况或健康条件不符时不得按预排强行参加'],availabilityNote:'8小时是含长途接送的全日规划预留，非水下时长。官网两潜价格；餐食未明确，保留餐费预算。'});
offer('paris','bateaux-mouches','塞纳河游船与船上用餐','Bateaux Mouches','Port de la Conference, Pont de l’Alma',48.8637,2.3055,90,'https://www.bateaux-mouches.fr/en/cruise/information','从单纯观景到船上晚餐，选择你想怎样度过塞纳河上的时光。',[
 ['sightseeing','约1小时观光船',20,20,'EUR',['普通成人观光船票'],{type:'official'}],['early-dinner','18:00早场晚餐',90,90,'EUR',['18:00场次晚餐与游船'],{type:'official',includedMeals:['dinner'],durationMinutes:135,preferredStartTime:'18:00'}],['prestige','Prestige晚餐',135,135,'EUR',['Prestige菜单与游船'],{type:'official',includedMeals:['dinner'],durationMinutes:165,preferredStartTime:'20:00',note:'20:00起登船、20:30离港，22:45返港；属晚间活动，返程需另外预留。'}]
],{features:['河岸地标','观光或用餐','不同菜单'],availabilityNote:'航线受水位影响；晚餐场次有着装要求。观光船不包含卢浮宫、铁塔等岸上门票。'});
offer('london','thames-rockets','泰晤士河快艇体验','Thames Rockets','London Eye Pier, SE1 7PB',51.5038,-0.1205,80,'https://www.thamesrockets.com/ultimate-london-adventure/','在讲解与加速航段之间，从河上认识伦敦。',[
 ['adventure','Ultimate London Adventure',60,80,'GBP',['约50分钟快艇体验','运营方提供的必要装备']]
],{features:['快艇','伦敦河景','约50分钟航程'],requirements:['须符合运营方年龄和健康要求','提前报到；体验受天气与航行管制影响']});
offer('rome','pasta-class','罗马手工意面与提拉米苏','Eat and Walk Italy','Piazza Navona周边合作餐厅；确认单给出门牌',41.8992,12.4731,180,'https://www.eatandwalkitaly.it/best-cooking-classes-in-rome/','亲手制作意面和甜点，再坐下来吃掉自己的作品。',[
 ['pasta','意面与提拉米苏课堂',65,95,'EUR',['食材与厨师指导','完成后的餐食'],{includedMeals:['lunch'],preferredStartTime:'11:00'}],['ravioli','意面、饺形意面与提拉米苏',80,120,'EUR',['多种面食制作与甜点','餐食及所选套餐饮品'],{includedMeals:['lunch'],preferredStartTime:'11:00'}]
],{features:['动手烹饪','意式餐桌','小团体验'],requirements:['提前告知过敏与饮食禁忌'],availabilityNote:'不同课程在不同餐厅举办；此处坐标为街区参考，未获取具体课次门牌。'});
offer('barcelona','sailing','地中海双小时帆船','Barcelona Sailing Day','Moll de la Marina, Port Olimpic',41.386,2.2015,150,'https://barcelonasailingday.com/tour/2-hour-sailing-tour/','离开岸边，用海风和城市天际线安排一个慢下来的下午。',[
 ['shared','2小时共享帆船',50,80,'EUR',['约2小时航程','运营方说明中的饮品与小食']]
],{features:['小团帆船','天际线','海风'],requirements:['出航与游泳安排取决于天气和船长判断']});
offer('new-york','circle-line','曼哈顿水上观光','Circle Line','Pier 83, W 42nd Street',40.7626,-74.0003,120,'https://www.circleline.com/','从哈德逊河看摩天楼与自由女神，航程本身就是一段城市散步。',[
 ['liberty','Liberty Midtown短航程',35,55,'USD',['自由女神方向观光航程']],['landmarks','Landmarks地标航程',45,65,'USD',['较长地标观光航程'],{durationMinutes:150}]
],{features:['水上地标','城市讲解','自由女神远眺'],availabilityNote:'不登自由岛或埃利斯岛，岛上门票未包含；税费、日期与各航程时刻需查官网。'});
offer('sydney','bridgeclimb','悉尼海港大桥攀登','BridgeClimb Sydney','3 Cumberland Street, The Rocks',-33.8574,151.2076,210,'https://www.bridgeclimb.com/experiences/compare','穿戴装备走向桥顶，把港湾尽收眼底。',[
 ['day','Summit白天攀登',364,450,'AUD',['指定路线攀登','向导与安全装备']],['twilight','Summit黄昏攀登',394,480,'AUD',['黄昏指定路线攀登','向导与安全装备'],{preferredStartTime:'15:00'}]
],{features:['桥顶视野','专业带领','白天或黄昏'],requirements:['必须满足健康、身高与年龄条件','随身相机等物品限制以运营方为准'],availabilityNote:'区间参考已发布产品价与旺季余量，当前日期必须重新报价，非保证票价。'});
offer('dubai','hero-balloon','沙漠日出热气球','Hero Balloon Flights Dubai','Dubai Desert Conservation Reserve；酒店接送',24.845,55.653,300,'https://uae.heroballoonflights.com/','清晨升空看沙丘，再在沙漠营地享用早餐。',[
 ['signature','Signature共享热气球',1695,1695,'AED',['日出飞行','猎鹰展示','早餐','指定范围接送'],{type:'official',includedMeals:['breakfast'],includesTransfers:true}],['private','双人起私人体验',12950,16000,'AED',['私人体验预算','早餐与接送'],{unit:'booking',partyCapacity:2,includedMeals:['breakfast'],includesTransfers:true,note:'官网双人起价12950AED；上限为预算预留，非官方最高价。超过2人或特殊安排必须另询。'}]
],{features:['日出热气球','沙漠早餐','共享或私人'],preferredStartTime:'05:00',requirements:['一般运营季为10月1日至次年5月31日','实际起飞时间、天气取消与参与条件由运营方确认'],availabilityNote:'5:00仅是清晨排程预留，不是已确认接送时间。夏季不可按常规运营季假定有班次。'});
offer('istanbul','bosphorus','城市渡轮博斯普鲁斯观光','Sehir Hatlari','Eminonu观光渡轮码头',41.0187,28.9736,150,'https://sehirhatlari.istanbul/en/price-list/bosphorus-tours-78','乘城市运营的观光渡轮，从海峡看两岸。',[
 ['short','短程观光 · 外国成人',340,340,'TRY',['短程观光票'],{type:'official',note:'采用官网FOREIGN PASSENGER票价，不使用仅适用本地乘客的170里拉。'}],['long','长程往返 · 外国成人',640,640,'TRY',['长程往返票'],{type:'official',durationMinutes:390,note:'采用外国乘客640里拉；长程停靠与返程时间必须查当季时刻表。'}]
],{features:['公共渡轮','海峡两岸','本地运营'],requirements:['淡旺季与当天时刻表可能调整']});
offer('hong-kong','aqualuna','张保仔维港晚间航游','aqualuna','尖沙咀／中环指定码头',22.2934,114.1691,75,'https://aqualuna.com.hk/experiences/evening-harbour-cruise/','在红帆船上看两岸亮灯，给维港留一个安静的角度。',[
 ['evening','晚间航游成人票',280,280,'HKD',['指定晚间航程','官网所列欢迎饮品'],{type:'official'}]
],{features:['红帆船','维港夜景','船上饮品'],preferredStartTime:'18:00',availabilityNote:'上船码头和出发时间须按选定航班确认，非所有时段均含幻彩咏香江。'});
offer('chengdu','opera','蜀风雅韵川剧变脸','蜀风雅韵','青羊区琴台路136号',30.6591,104.0494,120,'https://cdsfyy.com/','一晚看变脸、戏曲和民间绝艺，坐进成都的茶馆舞台。',[
 ['standard','普通演出座位',180,280,'CNY',['普通区域演出票']],['vip','VIP区域座位',300,450,'CNY',['VIP区域演出票']]
],{features:['川剧变脸','茶馆舞台','传统绝艺'],preferredStartTime:'19:30',availabilityNote:'票价是规划区间；茶水、特色体验、具体桌号是否包含按所购票种确认。'});
offer('xian','tang-dance','唐乐宫《大唐女皇》','陕旅集团 · 唐乐宫','碑林区长安北路75号',34.2318,108.9428,110,'https://www.sxtourgroup.com/home/yu/info.html?catId=237&id=2645','用乐舞、古乐与舞台叙事感受唐风。',[
 ['show','纯演出预算',220,380,'CNY',['指定席位演出票']]
],{features:['唐宫乐舞','古乐演奏','剧场之夜'],preferredStartTime:'19:30',availabilityNote:'官网核实节目与地址，未取得当日座席报价；餐宴组合不默认包含。'});
offer('hangzhou','westlake-show','西湖《最忆是杭州》','印象西湖','西湖岳湖演出区',30.2494,120.1374,90,'https://www.hzxcw.gov.cn/content_47231.html','在真实湖面、水光和音乐之间看江南。',[
 ['standard','普通观众区',320,420,'CNY',['普通区域演出票']],['premium','较优观众区',480,680,'CNY',['较优区域演出票']]
],{features:['湖上舞台','交响与舞蹈','西湖夜色'],preferredStartTime:'19:30',availabilityNote:'官方宣传确认2026演出季；当前票价为预算，不代表具体席区可售。演出受天气和季节影响。'});
offer('guangzhou','pearl-cruise','天字码头珠江夜游','珠江夜游运营船舶','越秀区沿江中路天字码头',23.1114,113.2713,90,'https://www.yuexiu.gov.cn/zjyx/yxjd/bgjq/content/post_8679192.html','从天字码头出发，在江风里看广州两岸灯火。',[
 ['indoor','普通舱位预算',98,168,'CNY',['指定航班普通座位']],['deck','露天或较优视野舱位预算',168,268,'CNY',['所选航班较优观景舱位']]
],{features:['珠江夜色','历史码头','船舱选择'],preferredStartTime:'19:00',bookingUrl:'https://gzzjyy.cn/',availabilityNote:'政务来源核实码头与游览性质；船舶、餐饮和舱位以具体运营方订单为准。预算不保证有指定船。'});
offer('lisbon','hippotrip','里斯本水陆两栖游览','HIPPOtrip','Doca de Santo Amaro, Alcantara',38.6984,-9.1773,105,'https://www.hippotrip.com/en/tickets/','同一辆水陆两栖车，从城市道路驶向特茹河。',[
 ['adult','17–64岁成人票',30,34,'EUR',['水陆两栖游览'],{type:'official',note:'成人30欧元起，7/8月每张加4欧元；水上部分可能因自然条件取消。'}]
],{features:['水陆两栖','特茹河','城市讲解'],requirements:['班次、交通与潮汐可能调整出发时间']});
offer('amsterdam','flagship','阿姆斯特丹小船运河游','Flagship Amsterdam','市中心所选登船码头，以确认单为准',52.3751,4.8842,90,'https://flagshipamsterdam.com/','沿运河穿过桥洞与山墙房屋，选择纯观光或船上小食。',[
 ['classic','经典运河观光',20,30,'EUR',['运河航程与船员讲解']],['cheese','含奶酪与饮品的游船',30,45,'EUR',['所选航程','套餐奶酪与饮品']]
],{features:['运河建筑','小船','可选小食'],availabilityNote:'多个码头和不同产品，请勿仅凭城市中心坐标登船；区间为编辑预算。'});
offer('berlin','stern-cruise','施普雷河历史城市游船','STERN + KREIS','Friedrichstrasse码头',52.5216,13.3867,90,'https://www.sternundkreis.de/infos/fahrplan/','坐船经过博物馆岛与议会区，换一个视角理解柏林。',[
 ['historic','C4历史城市线 · 1小时',22.5,22.5,'EUR',['约1小时游船'],{type:'official',note:'官网22.50欧元起，特殊日期和附加服务另计。'}]
],{features:['施普雷河','历史城市线','水上视角']});
offer('venice','gondola','威尼斯贡多拉包船','威尼斯持牌贡多拉船夫','圣马可附近MOLO船站；可改选官方船站',45.4339,12.3398,50,'https://www.comune.venezia.it/it/node/16768','按整船收费，和同行的人一起穿过水巷。',[
 ['day','白天30分钟 · 每船最多5人',90,90,'EUR',['30分钟日间船程'],{type:'official',unit:'booking',partyCapacity:5,note:'09:00–19:00，90欧元/整船，最多5人；不是每人90欧元。'}],['night','夜间35分钟 · 每船最多5人',110,110,'EUR',['35分钟夜间船程'],{type:'official',unit:'booking',partyCapacity:5,preferredStartTime:'19:00',durationMinutes:55,note:'19:00–04:00，110欧元/整船；特殊时长另按比例计。'}]
],{features:['整船计费','水巷','白天或夜晚'],availabilityNote:'官方公布基础运价与船站联系方式；潮汐和交通可能改变路线和时长。'});
offer('florence','pizza-gelato','佛罗伦萨披萨与意式冰淇淋课堂','Florence Food Studio','Oltrarno街区，确切门牌见确认单',43.7671,11.2443,150,'https://florencefoodstudio.com/en/cooking-classes/pizza-and-gelato','在厨师指导下揉面与制作冰淇淋，再一起品尝成果。',[
 ['class','披萨与Gelato课堂',65,100,'EUR',['制作课堂与食材','品尝完成的作品'],{includedMeals:['lunch'],preferredStartTime:'11:00'}]
],{features:['披萨制作','意式冰淇淋','动手体验'],requirements:['过敏或饮食限制提前沟通'],availabilityNote:'官网介绍约2小时课程；此处包含报到余量，具体时段与售价需预约确认。'});
offer('los-angeles','warner-studio','华纳兄弟好莱坞片场游','Warner Bros. Studio Tour Hollywood','3400 Warner Blvd, Burbank',34.1497,-118.3382,210,'https://www.wbstudiotour.com/tour/studio/','走进真实片场与影视布景，了解银幕背后的工作。',[
 ['studio','Studio Tour · 成人11岁及以上',79,79,'USD',['45–60分钟导览','约2小时自助区域'],{type:'official'}],['plus','Studio Tour Plus预算',160,200,'USD',['更长导览与自助区域','官网所列午餐与饮品'],{durationMinutes:270,includedMeals:['lunch']}]
],{features:['影视制作','片场导览','经典布景'],requirements:['实际片场因拍摄工作可能调整','5岁以下不可参加；有效证件及语言安排请查官网'],availabilityNote:'官网列11月3–5日和11月26日闭馆提示；年份与所选日期在预约页再次核对。停车另计。'});
offer('melbourne','global-balloon','墨尔本日出热气球','Global Ballooning Australia','Pullman East Melbourne, 192 Wellington Parade',-37.8158,144.9834,270,'https://www.globalballooning.com.au/flights/melbourne-public-flight/','随着风越过城市，在清晨看见另一面的墨尔本。',[
 ['flight','共享飞行 · 不含早餐',595,595,'AUD',['约1小时飞行','集合点至起降场接驳'],{type:'official',sourceUrl:'https://www.globalballooning.com.au/',note:'官网Melbourne项目595澳元起；仅飞行具体套餐与日期需核对。',durationMinutes:240}],['breakfast','共享飞行＋酒店早餐',650,650,'AUD',['约1小时飞行','酒店自助早餐','飞行照片','集合点至起降场接驳'],{type:'official',includedMeals:['breakfast'],note:'官网成人650澳元；总流程约4–4.5小时，停车另计。'}]
],{features:['日出飞行','城市上空','可选早餐'],preferredStartTime:'05:00',requirements:['天气、最低成团人数和身体条件由运营方确认','需自己到集合酒店，套餐地面接驳只在集合点与起降场之间'],availabilityNote:'5:00是清晨时间预留；确切集合时间通常前一晚确认。'});
offer('chiang-mai','farm-cooking','有机农场泰餐课堂','Thai Farm Cooking School','清迈郊外有机农场；指定城区酒店接送',18.902,99.061,360,'https://thaifarmcooking.net/contact-us/','从香草与食材认识泰餐，再动手做一桌自己的菜。',[
 ['full-day','全天烹饪课堂',1500,1500,'THB',['烹饪课堂与食材','完成餐食','指定范围接送'],{type:'official',includedMeals:['lunch'],includesTransfers:true,note:'官网全天1500泰铢/人；以官网预订，运营方声明不通过列出的聚合平台销售。'}]
],{features:['有机农场','泰餐烹饪','包餐体验'],preferredStartTime:'08:30',requirements:['说明过敏与素食需求','确认接送范围和具体集合时间']});
const cityIds=JSON.parse(readFileSync('data/cities.json','utf8')).map(c=>c.id);
rows.find(x=>x.cityId==='bali').minParticipants=2;
const privateBalloon=rows.find(x=>x.cityId==='dubai').priceOptions.find(x=>x.unit==='booking');
privateBalloon.minParticipants=2; privateBalloon.maxParticipants=2;
const era=rows.find(x=>x.cityId==='shanghai'); era.priceOptions.forEach(o=>o.sourceUrl=era.sourceUrl);
if(rows.length!==30 || cityIds.some(id=>!rows.some(r=>r.cityId===id))) throw Error('Missing city experience');
writeFileSync('data/city-activities.json',JSON.stringify(rows,null,2)+'\n');
writeFileSync('docs/city-activities.md','# 城市特色体验资料\n\n2026-09-22核对运营方或政府公开网页。当前30城各1项特色体验，套餐差异单独记录。地址坐标为集合点或场馆近似位置；以订单确认单为准。官方参考价不等于指定日期可订库存，estimate明确为人工预算。\n\n餐食包含以includedMeals记录；酒店接送以includesTransfers记录，已包含项目不叠加默认费用/交通时间。墨尔本集合酒店到起降场的接驳包含在整体体验时长，用户自己到集合点的交通另算。潜水和热气球参与条件由运营方确认。\n\n|城市|体验|资料来源|选项价格性质|\n|---|---|---|---|\n'+rows.map(r=>`|${r.cityId}|${r.name}|[运营方/官方资料](${r.sourceUrl})|${r.priceOptions.map(o=>o.name+'：'+(o.type==='official'?'公开参考价':'规划估算')).join('；')}|`).join('\n')+'\n');
console.log(JSON.stringify({experiences:rows.length,options:rows.reduce((n,r)=>n+r.priceOptions.length,0)}));
