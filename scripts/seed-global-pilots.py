"""Reviewed initial destination packs for the global coverage queue (2026-09-28).

Budgets and visit times are editorial planning estimates, not live quotations.
Rebuilds these packs only; canonical imports and media maintenance run separately.
"""
import json
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DAY = '2026-09-28'
M = 'https://www.munich.travel/en/topics/urban-districts/munich-sights-at-a-glance'
MF = 'https://www.munich.travel/en/topics/eat-drink/bavarian-food'
S = 'https://www.ihg.com/hotelindigo/hotels/us/en/diqing/digdq/hoteldetail'
N = 'https://nync.yn.gov.cn/html/2025/zhoushilianbo-new_1104/1422432.html'
C = 'https://mzzj.yn.gov.cn/html/2022/difangdongtai_0519/42816.html'
SF = 'https://www.ynxc.gov.cn/html/2025/whxdfocus_0402/3022216.html'


def refs(url, scope='地点、文化背景及参与方式；预算与用时为编辑估算'):
    kind = 'encyclopedia' if '.wikipedia.org/' in url else 'primary-source'
    return [{'name': url.split('/')[2], 'url': url, 'kind': kind, 'scope': scope, 'checkedAt': DAY}]


def image(article):
    return {'url': '', 'sourceUrl': 'https://en.wikipedia.org/wiki/' + quote(article.replace(' ', '_'))}


def price(currency, low, high, source, unit=None):
    result = {'low': low, 'high': high, 'currency': currency, 'type': 'estimate', 'sourceUrl': source, 'checkedAt': None,
              'note': '规划预留，非指定日期或票种的实时报价；公共区域零门票不含接驳、讲解、消费和收费内部区域。'}
    if unit:
        result['unit'] = unit
    return result


def place(city, slug, name, english, lat, lng, minutes, low, high, category, description, article, source, remote=False):
    return {'id': f'{city["id"]}-{slug}', 'name': name, 'nameEn': english, 'lat': lat, 'lng': lng,
            'coordinateAccuracy': 'approximate', 'coordinateNote': '规划用位置；实际入口以场馆或预约指引为准。',
            'durationHours': minutes / 60, 'durationRange': {'min': max(20, int(minutes * .5)), 'recommended': minutes, 'max': int(minutes * 1.5)},
            'durationBasis': 'editorial-estimate', 'category': category, 'activityType': 'nature' if '自然' in category else 'culture',
            'description': description, 'article': article, 'image': image(article), 'priority': 72 if remote else 86,
            'visitRole': 'optional' if remote else 'essential', 'automaticPlanning': not remote,
            'features': [category, '远郊需安排接驳' if remote else '可自选停留时间'],
            'bestTime': '先核对开放日、天气及预约要求；推荐用时不含前往该处的交通。',
            'sourceUrl': source, 'sourceCheckedAt': DAY, 'sourceReferences': refs(source),
            'price': price(city['currency'], low, high, source),
            **({'accessNote': '远郊项目，不能与市中心按步行衔接；单独核对往返车程与运营情况。'} if remote else {})}


def experience(city, slug, name, lat, lng, minutes, low, high, theme, description, context, source, article, months=None, date_specific=False, remote=False):
    return {'id': f'ex-{city["id"]}-{slug}', 'cityId': city['id'], 'kind': 'experience', 'name': name, 'nameEn': name,
            'provider': '详见活动来源及预约入口', 'address': name, 'lat': lat, 'lng': lng,
            'coordinateNote': '活动片区近似定位，集合点须向运营方确认。', 'durationMinutes': minutes,
            'description': description, 'tagline': context, 'localContext': context, 'experienceType': theme,
            'features': [context], 'requirements': ['需先核对所选日期、场次、余位、集合地点及包含服务。'],
            'automaticPlanning': not (remote or date_specific), 'sourceUrl': source, 'bookingUrl': source, 'checkedAt': DAY,
            'sourceReferences': refs(source), 'article': article, 'image': image(article),
            'seasonality': {'months': months or list(range(1, 13)), 'dateSpecific': date_specific,
                            'note': '日期须查当年官方公告；月份不等于每天都有活动。' if date_specific else '户外活动受天气和当地开放安排影响。'},
            'availabilityNote': '选择项目不会自动预订；费用为活动本身的规划预留，未包含城外接驳。',
            'priceOptions': [{'id': 'planning', 'name': '活动预算', **price(city['currency'], low, high, source, 'person'),
                              'includes': ['说明中列出的体验范围'], 'excludes': ['城外接驳交通', '额外餐饮和购物']} ]}


def food(city, slug, name, local, description, article, area, low, high, source):
    return {'id': f'food-{city["id"]}-{slug}', 'cityIds': [city['id']], 'name': name, 'localName': local,
            'description': description, 'article': article, 'articleScope': 'dish', 'image': image(article),
            'sourceUrl': source, 'sourceReferences': refs(source, '当地食物与饮食文化'), 'sourceCheckedAt': DAY,
            'sourceScope': 'regional-food-context', 'sourceStatus': 'primary-reference', 'catalogOrigin': 'maintained-definition',
            'price': price(city['currency'], low, high, source, 'serving'),
            'servingNote': '单份或说明中份量的编辑预算；作为每日餐饮选择，不重复叠加固定费用。',
            'whereByCity': {city['id']: [{'name': area, 'kind': 'area', 'sourceUrl': 'https://www.google.com/maps/search/?api=1&query=' + quote(city['nameEn'] + ' ' + area + ' ' + local),
                                        'note': '餐饮检索起点；请到具体商家核对当日菜单、份量与价格。'}]}}


def hotel(city, slug, name, source, lat, lng, low, high, description):
    return {'id': f'hotel-{city["id"]}-{slug}', 'cityId': city['id'], 'kind': 'hotel', 'name': name, 'nameEn': name,
            'lat': lat, 'lng': lng, 'coordinateNote': '酒店片区近似位置，以预订页面实际地址为准。', 'durationMinutes': 0,
            'description': description, 'tagline': description, 'features': ['官方预订入口', '按日期核价'],
            'sourceUrl': source, 'bookingUrl': source, 'sourceReferences': refs(source, '酒店身份、位置与特色；非实时房价'),
            'checkedAt': DAY, 'article': city['article'], 'image': image(city['article']),
            'imageScope': 'nearby', 'imageContextNote': '展示所在目的地环境，非该酒店客房或设施照片。',
            'priceOptions': [{'id': 'room', 'name': '每间每晚规划预算', **price(city['currency'], low, high, source, 'room-night'),
                              'includes': ['房间预算预留'], 'excludes': ['未明确包含的早餐', '停车', '接送', '税费及附加服务']} ]}


def base(identity, name, english, code, country, region, currency, lat, lng, iata, article, aliases, intro, daily, monthly, transport, days, wikidata):
    return {'id': identity, 'name': name, 'nameEn': english, 'countryCode': code, 'country': country, 'region': region,
            'currency': currency, 'lat': lat, 'lng': lng, 'iata': iata, 'article': article, 'aliases': aliases,
            'wikidataId': wikidata, 'contentTier': 'priority', 'tierReason': '用户点名补齐的重点目的地',
            'image': image(article), 'tagline': intro, 'description': intro, 'tags': ['地方文化', '自然与街区', '特色饮食'],
            'daily': dict(zip(['lodging', 'food', 'transport', 'misc'], daily)), 'monthly': dict(zip(['rent', 'utilities'], monthly)),
            'budgetBasis': {'type': 'editorial-estimate', 'updatedAt': DAY, 'note': '经济、舒适、高端三档规划估算，不是市场最低最高价或商家实时报价。住宿按每间每晚，饮食交通杂项按每成人每天，月租水电按每间每月。节庆、日期与房型会改变实际支出。'},
            'planningProfile': 'balanced', 'tripDuration': {'min': max(2, days - 1), 'days': days, 'max': days + 3, 'reason': transport},
            'transportNote': transport, 'attractions': [],
            'guide': {'cityId': identity, 'intro': intro, 'foodHighlights': [], 'neighborhoods': [], 'experienceIntro': '将具体体验加入行程，季节性活动先核对日期；城外路线应单独留出交通时间。'}}


munich = base('munich', '慕尼黑', 'Munich', 'DE', '德国', '欧洲', 'EUR', 48.1372, 11.5756, 'MUC', 'Munich', ['München', 'Muenchen', '慕尼黑'],
              '从老城钟楼到艺术馆，再在栗树下分享一顿巴伐利亚午餐；这座城市适合把博物馆与户外生活交替安排。',
              [[60, 145, 360], [25, 55, 120], [10, 18, 60], [8, 20, 45]], [[900, 1700, 3200], [160, 260, 450]],
              '老城可步行；宁芬堡宫、奥林匹克公园和安联球场用地铁、电车及公交衔接。机场接驳另计，德国城市之间可优先比较铁路。啤酒节期间住宿应单独核价。', 4, 'Q1726')
munich['officialTourismUrl'] = 'https://www.munich.travel/en'
munich['sourceReferences'] = refs(M)
munich_rows = [
 ('marienplatz','玛利亚广场','Marienplatz',48.1372,11.5755,50,0,0,'历史广场','从市政厅立面与街道尺度认识老城中心；钟琴演出依季节有固定场次，登塔与内部导览另购票。','Marienplatz',M),
 ('frauenkirche','圣母教堂','Frauenkirche, Munich',48.1386,11.5730,50,0,0,'宗教建筑','双塔是慕尼黑天际线的标志；参观教堂与付费登塔分开安排，礼拜时段尊重宗教活动。','Frauenkirche, Munich',M),
 ('residenz','慕尼黑王宫博物馆','Munich Residenz',48.1411,11.5786,180,12,25,'宫殿博物馆','穿过厅堂、庭院与宫廷收藏认识维特尔斯巴赫王朝；宝库和剧院的票种可能与主体展线不同。','Munich Residenz','https://www.residenz-muenchen.de/englisch/tourist/index.htm'),
 ('nymphenburg','宁芬堡宫','Nymphenburg Palace',48.1580,11.5034,180,10,25,'宫殿园林','夏宫主体、马车馆和园中小宫殿适合按兴趣选择，别将整片公园当作短暂停留点。','Nymphenburg Palace','https://www.schloss-nymphenburg.de/englisch/tourist/index.htm'),
 ('deutsches','德意志博物馆','Deutsches Museum',48.1299,11.5834,210,15,25,'科学博物馆','沿航天、能源与技术展线探索，动手展项适合慢慢看；部分展厅可能因更新临时调整。','Deutsches Museum','https://www.deutsches-museum.de/en/museumsinsel/visit'),
 ('alte-pinakothek','老绘画陈列馆','Alte Pinakothek',48.1484,11.5702,150,7,16,'艺术博物馆','挑选欧洲古典绘画展厅细看光线与人物，预留座椅休息时间，避免同一天连续塞满美术馆。','Alte Pinakothek','https://www.pinakothek.de/en/visit/alte-pinakothek'),
 ('modern-pinakothek','现代艺术陈列馆','Pinakothek der Moderne',48.1468,11.5723,150,10,18,'艺术博物馆','艺术、设计、建筑与版画的收藏同处一馆，适合根据特展与自己的兴趣确定路线。','Pinakothek der Moderne','https://www.pinakothek.de/en/visit/pinakothek-der-moderne'),
 ('lenbachhaus','伦巴赫美术馆','Lenbachhaus',48.1467,11.5630,120,10,18,'艺术博物馆','围绕蓝骑士与现代艺术看慕尼黑的另一面；别错过别墅建筑和安静庭院。','Lenbachhaus','https://www.lenbachhaus.de/en/visit'),
 ('brandhorst','布兰德霍斯特博物馆','Museum Brandhorst',48.1484,11.5741,120,7,15,'当代艺术','以轮换展览认识当代绘画与艺术收藏，彩色立面适合作为艺术区路线的起点。','Museum Brandhorst','https://www.museum-brandhorst.de/en/'),
 ('egyptian','巴伐利亚埃及艺术博物馆','Staatliches Museum Ägyptischer Kunst',48.1467,11.5693,120,7,15,'考古博物馆','地下展厅以雕塑、器物与文字展开古埃及艺术，适合雨天与相邻美术馆择一组合。','Staatliches Museum Ägyptischer Kunst','https://smaek.de/en/'),
 ('english-garden','英国花园','Englischer Garten',48.1640,11.6050,120,0,0,'自然公园','草地、林荫路与湖面构成城市休闲空间，可以只选择南段，骑车和餐饮另计。','Englischer Garten',M),
 ('olympiapark','奥林匹克公园','Olympiapark, Munich',48.1731,11.5503,120,0,0,'现代建筑与公园','从湖边看1972年场馆的帐篷形屋顶，可登奥林匹克山丘；场馆活动与付费导览需另订。','Olympiapark, Munich','https://www.olympiapark.de/en'),
 ('bmw-welt','宝马世界','BMW Welt',48.1769,11.5563,75,0,0,'汽车与设计','进入开放展示空间欣赏建筑与车型，工厂导览和旁边宝马博物馆不是同一项目。','BMW Welt','https://www.bmw-welt.com/en.html'),
 ('bmw-museum','宝马博物馆','BMW Museum',48.1770,11.5592,120,12,22,'工业博物馆','沿车型、摩托车与品牌历史展线参观；与宝马世界步行相连但需分别安排门票和用时。','BMW Museum','https://www.bmw-welt.com/en/locations/museum.html'),
 ('allianz','安联球场及拜仁博物馆','Allianz Arena',48.2188,11.6247,150,25,50,'体育文化','球场导览和俱乐部博物馆适合球迷，比赛日路线与开放范围会变；从市中心乘地铁后仍需步行。','Allianz Arena','https://allianz-arena.com/en/arena-tours'),
 ('asam','阿萨姆教堂','Asam Church, Munich',48.1350,11.5699,35,0,0,'宗教建筑','窄街立面之后是密集的巴洛克装饰，适合仔细观看祭坛与天花；开放受宗教活动影响。','Asam Church, Munich','https://www.munich.travel/artikel/muenchen-tipps-fuer/kostenlose-guenstige-aktivitaeten-muenchen'),
 ('viktualienmarkt','谷物市场','Viktualienmarkt',48.1352,11.5761,75,0,0,'地方市场','从奶酪、面包与花摊认识城市日常，可以将午餐放在市场，购物和饮食按实际消费计算。','Viktualienmarkt',M),
 ('konigsplatz','国王广场','Königsplatz, Munich',48.1456,11.5658,45,0,0,'历史广场','古典柱廊围合的广场与艺术区相连，室外参观与周边考古馆的门票分开计算。','Königsplatz, Munich',M),
 ('ns-documentation','慕尼黑纳粹历史文献中心','Munich Documentation Centre for the History of National Socialism',48.1453,11.5685,120,0,0,'历史教育','通过常设展理解纳粹运动在慕尼黑的兴起及迫害历史，适合预留安静阅读与思考的时间。','Munich Documentation Centre for the History of National Socialism','https://www.nsdoku.de/en/'),
 ('botanical','宁芬堡植物园','Botanischer Garten München-Nymphenburg',48.1633,11.5017,120,6,12,'植物与自然','观察温室和季节性花园；与宁芬堡宫相邻但收藏独立，冬季开放区域与时段需提前核对。','Botanischer Garten München-Nymphenburg','https://botmuc.snsb.de/en/'),
]
munich['attractions'] = [place(munich, *row) for row in munich_rows]

shangri = base('shangri-la', '香格里拉', 'Shangri-La', 'CN', '中国', '亚洲', 'CNY', 27.8100, 99.7060, 'DIG', 'Shangri-La, Yunnan', ['香格里拉市', '中甸', 'Zhongdian', 'Shangri-La City'],
               '高原湖泊、藏式村落与手艺人的炉火共同组成香格里拉；先慢慢适应海拔，再选择寺院、非遗与山野的一天。',
               [[160, 420, 1500], [60, 150, 380], [25, 90, 350], [25, 65, 180]], [[1300, 3000, 7000], [200, 400, 800]],
               '古城及城区用步行和出租车组合；松赞林与纳帕海需接驳。普达措、尼西、虎跳峡和三坝方向不可按同一片区衔接，远郊路线宜单独成日。可比较丽江至香格里拉铁路，海拔较高需循序安排体力。', 4, 'Q933866')
shangri['isoRegion'] = 'CN-YN'
shangri['officialTourismUrl'] = 'https://www.xianggelila.gov.cn/'
shangri['sourceReferences'] = refs(S) + refs(C)
shangri_rows = [
 ('songzanlin','噶丹松赞林寺','Ganden Sumtseling Monastery',27.8619,99.7068,150,75,130,'藏传佛教建筑','沿台阶进入寺院建筑群，留出听讲解和远看金顶的时间；尊重礼仪，殿内摄影遵守现场规定。','Ganden Sumtseling Monastery',S,False),
 ('dukezong','独克宗古城','Dukezong',27.8094,99.7065,100,0,0,'历史街区','在仓房街与金龙街辨认藏式民居和茶马古道街巷，石板路不平，古城消费与周边场馆另计。','Dukezong','https://www.xianggelila.gov.cn/zfxxgk_xglls/fdzdgknr/fzjhbg1/fzjhbg/202512/20251217_236264.html',False),
 ('guishan','龟山公园与转经筒','Guishan Park, Shangri-La',27.8090,99.7078,45,0,0,'文化地标','登上古城中的小山看屋顶与转经筒，台阶需要放慢速度，初到高原不宜急走。','Dukezong',S,False),
 ('diqing-museum','迪庆州博物馆','Diqing Museum',27.8100,99.7072,90,0,0,'地方博物馆','用文物与地方展览了解迪庆的多民族生活和历史，为之后的村落与寺院游览补充背景。','Shangri-La, Yunnan','https://www.gov.cn/zhengce/zhengceku/2020-05/22/5513734/files/1b6a0d01bf584c20bf17d5801a3e3e6f.pdf',False),
 ('long-march','迪庆红军长征博物馆','Diqing Red Army Long March Museum',27.8098,99.7065,75,0,0,'历史教育','从长征在迪庆的展览认识当地红色历史，可结合中心镇公堂旧址；入馆以馆方当日开放与预约安排为准。','Dukezong','https://diqing.gov.cn/zfxxgk_dqzzf/fdzdgknr/zdmslyxx/lysczxhfwzl/jiudianjingqudengjipingdingxinxi/202409/20240905_215624.html',False),
 ('baiji','百鸡寺','Baiji Temple',27.8037,99.7002,70,0,0,'山地寺院','位于古城西侧山坡，沿步道缓慢上行看城镇与山谷；不追逐动物，参观范围以现场开放为准。','Dukezong','https://zh.wikipedia.org/wiki/香格里拉市各级文物保护单位列表',False),
 ('ringha-temple','大宝寺与仁安谷地','Ringha Temple',27.7340,99.7840,90,0,30,'藏族村落与寺院','在仁安谷地观察寺院与村居的关系，山谷距古城有一段车程；进入建筑前询问开放与礼仪。','Shangri-La, Yunnan','https://www.banyantree.com/china/ringha',True),
 ('napahai','纳帕海湖滨与湿地','Napa Lake',27.8670,99.6450,150,0,0,'高原自然','季节变化让湖面与草甸呈现不同景观，只在开放道路和合法观景点停留，不驶入湿地或随意进入牧场。','Napa Lake','https://xianggelila.gov.cn/zwxx/yw/202609/20260907_245206.html',False),
 ('potatso','普达措国家公园','Pudacuo National Park',27.8350,99.9630,270,130,200,'高原湖泊与森林','在景区开放线路上看湖泊、草甸与森林，步道和接驳都需要时间；不要将同一公园的不同湖泊重复算作必去点。','Pudacuo National Park','https://lcj.yn.gov.cn/special/2020/0712/2890.html',True),
 ('shika','石卡雪山','Shika Snow Mountain',27.7760,99.6020,210,180,300,'高山自然','缆车和山上观景适合天气稳定且适应海拔后选择；遇风雪、维护或停运应取消，不以山顶活动填满抵达首日。','Shika Snow Mountain','https://invest.yn.gov.cn/tzyn/ynsjzdxm/material/xm2026a/06010.html',True),
 ('balagezong','巴拉格宗峡谷','Balagezong',28.2410,99.4430,300,170,260,'峡谷与山地','将峡谷栈道、村落和观景接驳放在完整一天内选择，往返城区车程另留；不要与东面的普达措硬接同一天。','Balagezong','https://mz.yn.gov.cn/html/2019/difangdongtai_0424/32103.html',True),
 ('baishuitai','白水台','Baishuitai',27.5030,100.0300,120,30,70,'自然与东巴文化','在指定步道欣赏层叠的钙华台地，并了解当地东巴文化；不能踩入池体，三坝方向山路交通另留。','Baishuitai','https://www.diqing.gov.cn/file/diqing/dqzzf_zwhhlyj/file/20240904/1725418456204010539.pdf',True),
 ('tiger-leaping','虎跳峡上虎跳观景','Tiger Leaping Gorge',27.1810,100.1100,150,45,80,'峡谷自然','沿开放观景设施看金沙江急流，台阶上下需体力；这条观景路线不等同于需多日准备的高路徒步。','Tiger Leaping Gorge',S,True),
 ('haba-village','哈巴村','Haba village',27.3770,100.1150,120,0,0,'山地村落','在村落远望哈巴雪山、了解山地生活，可作为徒步前后的落脚点；村落游览不包括登顶活动。','Haba Snow Mountain','https://tyj.yn.gov.cn/tyzx/tycy/202310/t20231025_3417340.html',True),
 ('niru-village','尼汝村','Niru village',27.9410,100.0950,150,0,0,'高原村落','在开放村道观察木屋、河谷与藏族乡村生活，尊重住户和牧场边界；路远，建议结合住宿而不是当作市区短途。','Shangri-La, Yunnan',N,True),
]
shangri['attractions'] = [place(shangri, *row) for row in shangri_rows]

experiences = [
 experience(munich,'oktoberfest','十月啤酒节与民俗游艺',48.1314,11.5498,240,35,100,'festival','在特蕾西娅草坪感受帐篷音乐、游艺和巴伐利亚服饰；场地参观与餐饮、游艺分开计费，确认日期与席位后再加入行程。','Wiesn 是城市的季节性民俗聚会','https://www.munich.travel/en/pois/markets-festivals/oktoberfest','Oktoberfest',[9,10],True),
 experience(munich,'biergarten','栗树下的啤酒花园午后',48.1441,11.5497,120,15,40,'food-life','在 Augustiner-Keller 等啤酒花园找一张长桌，搭配面包、奶酪或热食慢慢坐；饮食可替代原本的一餐，开放受天气影响。','长桌与树荫里的巴伐利亚社交生活','https://www.munich.travel/en','Augustiner-Keller',[4,5,6,7,8,9,10]),
 experience(munich,'opera','巴伐利亚国家歌剧院之夜',48.1396,11.5798,180,15,180,'performance','按剧目选择歌剧或芭蕾，入场前留出取票与寄存时间；演出时长、座位视线及票价以具体场次为准。','历史剧院里的现场表演','https://www.staatsoper.de/en/','National Theatre Munich',date_specific=True),
 experience(munich,'isar-picnic','伊萨尔河岸野餐与慢骑',48.1217,11.5674,150,0,25,'nature','在 Flaucher 合法开放河岸休息或沿骑行道慢骑，带走垃圾；不把游泳当作默认项目，自行车租赁另计。','把城市里的半天交给河流与树荫','https://www.munich.travel/en/pois/sports-leisure/flosslaende','Flaucher',[4,5,6,7,8,9,10]),
 experience(munich,'christmas','玛利亚广场圣诞集市',48.1372,11.5755,100,0,30,'festival','在冬季集市挑选手工装饰、热饮和季节小吃；以当年官方日期为准，品尝与购物按实际消费计算。','冬日灯饰与热饮组成的传统集市','https://www.christkindlmarkt-muenchen.de/en/','Munich Christmas Market',[11,12],True),
 experience(shangri,'nixi-pottery','尼西汤堆黑陶工艺体验',27.9990,99.5640,150,80,250,'craft','先看陶匠如何塑形与打磨，再向尼西黑陶研习或展示工坊询问可预约的入门体验；烧制、寄送和作品费用需分别确认。','黑陶连接炊具、炉火与藏家日常','https://www.xianggelila.gov.cn/zwxx/xzdt/202604/20260407_239741.html','Pottery',remote=True),
 experience(shangri,'napahai-birds','纳帕海冬季远距观鸟',27.8700,99.6390,150,0,200,'wildlife','在开放观鸟点用望远镜观察越冬水鸟，选择当地合规向导时另计服务费；保持距离、不投喂、不进入保护核心区，不能保证遇见某种鸟。','湿地是候鸟迁徙与越冬的栖息地','https://www.xianggelila.gov.cn/zfxxgk_xglls/fdzdgknr/jytabljggk/rdjybljggk/202105/20210528_160514.html','Black-necked crane',[11,12,1,2,3]),
 experience(shangri,'guozhuang','独克宗广场锅庄文化',27.8100,99.7063,60,0,0,'performance','晚间遇到公共锅庄活动时先观察节奏，经参与者邀请再加入；并非每天有固定演出，尊重领舞与当地人的活动空间。','圆圈舞中的社区生活','https://mzzj.yn.gov.cn/html/2022/difangdongtai_0519/42816.html','Guozhuang dance',date_specific=True),
 experience(shangri,'thangka','唐卡绘画入门与观摩',27.8078,99.7118,120,120,400,'craft','通过月光城英迪格酒店提供的唐卡艺术中心咨询入口，了解绘画与色彩，再确认是否有适合初学者的课程；材料与作品规格需预约时询问。','用绘画认识藏族艺术中的图案语言',S,'Thangka'),
 experience(shangri,'tibetan-table','藏式早餐与酥油茶饮食课',27.8590,99.7110,90,60,180,'food-life','选择提供藏式早餐的餐厅，从咸味酥油茶、糌粑和当地乳制品认识高原餐桌；捏糌粑等互动先向店家确认，费用可替代当天早餐。','乳品、青稞与茶组成的日常饮食',S,'Butter tea'),
 experience(shangri,'horse-festival','格咱松茸与传统赛马节',28.0570,99.8260,240,0,150,'festival','了解格咱乡传统赛马、非遗展陈和松茸文化活动；2026年活动已有官方记录，未来出行必须重新核对当年日期及具体马场。','山林物产与民间赛事相遇','https://www.xianggelila.gov.cn/zfxxgk_xglls/fdzdgknr/gzdt/202607/20260721_243561.html','Horse racing',[7],True,True),
 experience(shangri,'seasonal-market','松茸季的高原市场寻味',27.8195,99.7040,90,30,150,'food-life','雨季在城区市场观察松茸等级和当地农产品，再在正规餐馆选择熟食；不要自行采食不认识的野菌，鲜货价格与季节波动很大。','从市场认识山林物产的季节性',SF,'Matsutake',[7,8,9]),
 experience(shangri,'niru-waterfall','尼汝七彩瀑布徒步',27.9410,100.0950,420,150,500,'nature','从尼汝村安排往返七彩瀑布的向导徒步，线路较长，应先确认实际里程、通行条件和体能；另留抵达尼汝与住宿时间。','森林、河谷与苔藓瀑布的整日路线',N,'Waterfall',remote=True),
 experience(shangri,'haba-foothills','哈巴雪山山麓向导徒步',27.3760,100.1130,300,180,550,'nature','以哈巴村为出发点，向合规运营者确认适合自身的山麓线路；预算不包含技术攀登和登顶，需另行核对路况、装备和接驳。','村落之上的高山植被与雪峰视野','https://tyj.yn.gov.cn/tyzx/tycy/202310/t20231025_3417340.html','Haba Snow Mountain',[4,5,6,9,10,11],False,True),
 experience(shangri,'xiaozhongdian-flowers','小中甸杜鹃花季田野休息',27.6180,99.8070,150,0,60,'nature','在允许进入的乡村步道看草甸和花期变化，找一处不打扰牧场的地点休息；不压花、不越围栏，开花时间随气候变化。','把一段高原午后留给季节风景','https://mz.yn.gov.cn/html/2019/difangdongtai_0424/32103.html','Rhododendron',[5,6],False,True),
]
for row in experiences:
    if row['id'].endswith('napahai-birds'):
        row['wildlife'] = {'species': ['黑颈鹤', '黑鹳', '斑头雁'], 'encounterNote': '季节与野生动物活动不可保证，使用远距观察。', 'responsibleNote': '不投喂、不追逐、不进入保护核心区。'}

foods = [
 food(munich,'weisswurst','巴伐利亚白香肠','Weißwurst','热水温煮的白香肠常搭配甜芥末和碱水面包；一般去掉肠衣食用，可按一份早餐或早午餐预算。','Weisswurst','Viktualienmarkt / 老城巴伐利亚餐馆',7,16,MF),
 food(munich,'brezn','巴伐利亚碱水面包','Brezn','结状面包带深褐色外皮与盐粒，适合当小食，也常与奶酪酱一起作为简餐。','Pretzel','老城面包店 / 啤酒花园',2,5,MF),
 food(munich,'obatzda','巴伐利亚奶酪酱','Obazda / Obatzter','软奶酪、黄油和调味料拌成的抹酱，常搭配洋葱与面包分享；乳制品过敏者应先询问配方。','Obatzda','Viktualienmarkt / 啤酒花园',7,15,'https://www.munich.travel/en/content/download/261600/file/Gaestefuehrg_Brosch-UK.pdf'),
 food(munich,'schweinshaxe','巴伐利亚烤猪肘','Schweinshaxe','酥皮猪肘通常配马铃薯团子或卷心菜，份量较大，可询问是否适合分享。','Schweinshaxe','老城传统 Wirtshaus',20,38,MF),
 food(munich,'auszogne','巴伐利亚炸面饼','Auszogne / Schmalznudel','边缘鼓起、中间薄脆的酵母炸面饼，现炸搭配咖啡更适合下午茶；并非有馅的柏林甜甜圈。','Knieküchle','Café Frischhut / Viktualienmarkt',3,7,'https://www.munich.travel/en/topics/urban-districts/local-love-munich/altstadt-s-fast-eats'),
 food(shangri,'butter-tea','酥油茶','酥油茶 · Po cha','茶汤与酥油搅打成咸香饮品，适合小杯品尝；不应把饮用酥油茶视为治疗或预防高原反应。','Butter tea','独克宗藏餐馆 / 酒店藏式早餐',10,35,S),
 food(shangri,'tsampa','糌粑','糌粑 · Tsampa','炒熟青稞磨成的粉常与酥油茶和乳品混合食用，能观察主食从原料到餐桌的不同吃法。','Tsampa','独克宗藏餐馆 / 藏式早餐',12,35,S),
 food(shangri,'tibetan-cheese','藏式乳渣与奶酪','奶渣 · Chura','以乳制品加工而成，鲜软、干制和入菜的口感不同；点餐时问清甜咸做法和一份的分量。','Tibetan cheese','独克宗藏餐馆 / 松赞林卡餐厅',15,45,'https://m.ccas.com.cn/site/content/88723.html'),
 food(shangri,'matsutake','时令松茸','松茸 · Matsutake','雨季高原山林的代表性菌类，可以在正规餐馆选择熟制菜品；单品价格随品级、重量和季节变化明显。','Matsutake','城区市场周边餐馆 / 松赞林卡餐厅',60,220,'https://www.songtsam.com/en/hotel/info/1'),
 food(shangri,'momo','藏式包子','藏式包子 · Momo','藏餐馆常见的蒸制面食，馅料与蘸料按店家做法不同；可以搭配酥油茶，点餐时问清是否为牛羊肉馅。','Momo (food)','红心小吃 / 扎西卡达藏餐店',18,45,SF),
]

stays = [
 hotel(munich,'wombats','Wombat’s City Hostel Munich Hauptbahnhof','https://www.wombats-hostels.com/munich/hauptbahnhof/contact-directions',48.1387,11.5606,90,220,'中央车站附近的青年旅舍选择；本项按独立房规划，多人间床位的价格另行核对。'),
 hotel(munich,'motel-one','Motel One München-Sendlinger Tor','https://www.motel-one.com/en/hotels/munich/hotel-munich-sendlinger-tor/',48.1329,11.5668,100,230,'靠近森德灵门，适合以步行和地铁探索老城；早餐和停车是否包含以房价条款为准。'),
 hotel(munich,'platzl','Platzl Hotel','https://www.platzl.de/en/',48.1378,11.5790,180,420,'老城传统风格酒店，靠近歌剧院与谷物市场，适合希望晚间步行回房的旅客。'),
 hotel(munich,'bayerischer-hof','Hotel Bayerischer Hof','https://www.bayerischerhof.de/en/',48.1404,11.5731,350,900,'老城高端酒店，文化场馆与购物街步行可达；套房、餐厅和其他服务分别核价。'),
 hotel(munich,'vier-jahreszeiten','Hotel Vier Jahreszeiten Kempinski München','https://www.kempinski.com/en/hotel-vier-jahreszeiten',48.1392,11.5824,350,1000,'位于马克西米利安大街的高端酒店，适合将歌剧、艺术与城市购物组合成行程。'),
 hotel(shangri,'resort','香格里拉大酒店 Shangri-La Resort','https://www.shangri-la.com/yunnan/shangrila/',27.8240,99.7050,650,1800,'城区酒店，提供藏式设计与多种餐饮服务；供氧设备、早餐和接机按所订房型套餐核对。'),
 hotel(shangri,'indigo','迪庆月光城英迪格酒店',S,27.8068,99.7112,1000,2600,'位于独克宗古城高处，以茶马古道与藏族文化为设计线索；坡道接驳和客房视野需核对。'),
 hotel(shangri,'ringha','仁安悦榕庄','https://www.banyantree.com/china/ringha',27.7360,99.7810,1300,3800,'仁安谷地以藏式农舍转化的别墅度假体验；距离古城较远，适合留在山谷慢住并另算接驳。'),
 hotel(shangri,'linka','松赞香格里拉林卡','https://www.songtsam.com/en/hotel/info/1',27.8650,99.7110,1500,4200,'松赞林寺附近的藏式石屋度假空间，结合乡村景观与地方餐饮；活动与餐食是否包含以套餐为准。'),
 hotel(shangri,'lvgu','松赞香格里拉绿谷','https://www.songtsam.com/en/contact',27.8610,99.7040,1000,2600,'靠近松赞林寺的松赞山居，适合寺院与乡村路线；与松赞林卡是不同酒店，预订时确认名称。'),
]

for city in [munich, shangri]:
    city['guide']['foodHighlights'] = [{'name': f['name'], 'description': f['description']} for f in foods if city['id'] in f['cityIds']]
    city['guide']['neighborhoods'] = ([{'name': 'Altstadt / Maxvorstadt', 'description': '老城历史建筑与艺术区适合分半天安排，馆际步行也要留出时间。'}]
                                    if city['id'] == 'munich' else [{'name': '独克宗 / 松赞林片区', 'description': '古城适合步行慢看，寺院方向另留接驳；远郊自然路线独立成日。'}])

for relative, rows in [('data/expansion/global-pilots-20260928.json', [munich, shangri]),
                       ('data/experience-expansion/global-pilots-20260928.json', experiences + stays),
                       ('data/food-expansion/global-pilots-20260928.json', foods)]:
    path = ROOT / relative
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'cities': 2, 'attractions': sum(len(c['attractions']) for c in [munich, shangri]), 'experiences': len(experiences), 'foods': len(foods), 'stays': len(stays)}))
