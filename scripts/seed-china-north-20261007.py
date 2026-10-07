"""Authored northern China destination pack. Run only to regenerate this batch.

Prices, coordinates and visit durations are planning estimates unless explicitly
marked otherwise. Primary and cross-reference research is retained with each city.
Image candidates are maintained separately and must not be mistaken for approval.
"""
import json
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DAY = '2026-10-07'
CITIES, EXPERIENCES, FOODS = [], [], []
THEME_MAP = {'water-life':'nature','wellness':'local-life','coastal-life':'marine','photography':'craft',
    'heritage-study':'literary','industry':'craft','food-craft':'craft','outdoor':'nature','sport-culture':'local-life',
    'winter-culture':'festival','culture':'local-life','craft-culture':'craft','winter-outdoor':'nature',
    'transport-culture':'local-life','water-sport':'marine','seasonal-nature':'nature','creative-culture':'performance',
    'winter-sport':'nature','food-culture':'food-life','nature-outdoor':'nature'}

def refs(url, scope='地点身份、旅行主题与参与方式；价格、车程和用时为编辑估算'):
    return [{'name': url.split('/')[2], 'url': url, 'kind': 'primary-source' if '.gov.cn' in url or 'pygc.com' in url else 'reference', 'scope': scope, 'checkedAt': DAY}]

def price(low, high, source, unit='person'):
    note = ('按每间每晚规划预留，不是指定日期、房型或入住人数的实时房价；早餐、税费、取消政策与附加服务以预订条款为准。' if unit=='room-night' else
            '按介绍中的单份或共享份量规划预留，不是门店当日菜单报价；份量、时令原料、加工费和饮品另核。' if unit=='serving' else
            '按每成人规划预留，不是指定日期的实时报价；门票、材料、讲解及接驳是否包含，以具体活动或景区说明为准。' if high else
            '所述公共区域或免费基本展览不预留门票；此项零门票不包含接驳、收费内部区域、讲解及任何消费。')
    return {'low': low, 'high': high, 'currency': 'CNY', 'type': 'estimate', 'unit': unit, 'sourceUrl': source, 'checkedAt': None,
            'note': note}

def img(article):
    return {'url': '', 'sourceUrl': 'https://en.wikipedia.org/wiki/' + quote(article.replace(' ', '_'))}

def base(id, name, en, province, lat, lng, iata, days, intro, transport, sources, lodging=(150,350,850), rent=(1300,2600,5000)):
    c = {'id': id, 'name': name, 'nameEn': en, 'countryCode':'CN','country':'中国','region':'亚洲','currency':'CNY',
         'subdivision': province, 'lat':lat,'lng':lng,'iata':iata,'article':en,'aliases':[name,en], 'contentTier':'priority',
         'tierReason':'2026年中国详细目的地扩充，覆盖全国旅行与地方生活方式', 'image':img(en),
         'tagline':intro,'description':intro,'tags':['地方文化','特色饮食','慢旅行'],
         'daily':{'lodging':list(lodging),'food':[65,150,350],'transport':[20,65,180],'misc':[15,35,90]},
         'monthly':{'rent':list(rent),'utilities':[180,350,650]},
         'budgetBasis':{'type':'editorial-estimate','updatedAt':DAY,'note':'三档为经济、舒适、高端规划预算，非市场最低最高价或实时报价。住宿按每间每晚，餐饮交通杂项按每成人每天，月租与水电按每间每月；节假日、冬季供暖及旅游旺季另核。'},
         'tripDuration':{'min':max(2,days-1),'days':days,'max':days+3,'reason':transport},'planningProfile':'balanced','transportNote':transport,
         'officialTourismUrl':sources[0], 'sourceReferences':sum([refs(s) for s in sources],[]),'attractions':[],
         'guide':{'cityId':id,'intro':intro,'foodHighlights':[],'neighborhoods':[],'transport':transport,
                  'experienceIntro':'把当地饮食、手作、演出和自然体验加入行程；节庆按当年日期安排，远郊项目单独预留往返时间。'}}
    CITIES.append(c)
    return c

def places(c, rows):
    # slug|name|English|lat,lng|minutes|low,high|category|description|photo query|remote one-way minutes (0 means urban)
    for n,line in enumerate(rows.strip().splitlines()):
        slug,name,en,xy,mins,budget,category,desc,query,remote=line.split('|')
        lat,lng=map(float,xy.split(',')); low,high=map(float,budget.split(',')); mins=int(mins); remote=int(remote)
        source=c['sourceReferences'][0]['url']
        a={'id':c['id']+'-'+slug,'name':name,'nameEn':en,'lat':lat,'lng':lng,'coordinateAccuracy':'approximate',
           'coordinateNote':'规划用近似位置；入口、集合点和道路以场馆及导航指引为准。','durationHours':mins/60,
           'durationRange':{'min':max(20,round(mins*.55/5)*5),'recommended':mins,'max':round(mins*1.5/5)*5},'durationBasis':'editorial-estimate',
           'category':category,'activityType':'nature' if any(t in category for t in ['自然','湿地','海滨','山地','公园']) else 'culture',
           'description':desc,'article':en,'photoQuery':query,'image':img(en),'priority':95-min(n,15)*2 if not remote else 63,
           'visitRole':'essential' if n<5 and not remote else 'optional','automaticPlanning':not remote,
           'features':[category,'远郊需接驳' if remote else '可调游览用时'],'sourceUrl':source,'sourceCheckedAt':DAY,
           'sourceReferences':c['sourceReferences'],'price':price(low,high,source),
           'bestTime':'室内场馆先查开放日及预约；户外以天气和日照条件调整。'}
        if remote:
            a.update({'accessNote':f'从市中心出发单程约 {remote} 分钟，为非拥堵车程估算；需另留候车、返程与停车时间，不能按市内步行衔接。',
                      'transferMinutes':remote,'distanceScope':'day-trip','automaticPlanning':False})
        c['attractions'].append(a)

def experiences(c, rows):
    # slug|name|English|xy|minutes|budget|theme|description|query|months or all|remote|date specific 0/1
    for line in rows.strip().splitlines():
        slug,name,en,xy,mins,budget,theme,desc,query,months,remote,date_specific=line.split('|')
        lat,lng=map(float,xy.split(',')); low,high=map(float,budget.split(',')); mins=int(mins); remote=int(remote); special=bool(int(date_specific))
        s=c['sourceReferences'][0]['url']; row={'id':'ex-'+c['id']+'-'+slug,'cityId':c['id'],'kind':'experience',
            'name':name,'nameEn':en,'provider':'以来源页面所列主办方或具体门店为准','address':name,'lat':lat,'lng':lng,
            'coordinateNote':'体验地点或片区近似位置；参加前确认具体门店与集合点。','durationMinutes':mins,
            'durationRange':{'min':max(20,round(mins*.6/5)*5),'recommended':mins,'max':round(mins*1.5/5)*5},
            'description':desc,'tagline':name,'localContext':desc,'experienceType':THEME_MAP.get(theme,theme),'features':['地方特色体验','需核对参加方式'],
            'requirements':['体验预留不等于已预约；核对营业日、具体场次、项目范围与集合地点。'],
            'automaticPlanning':not(remote or special),'sourceUrl':s,'bookingUrl':s,'checkedAt':DAY,'sourceReferences':c['sourceReferences'],
            'article':en,'photoQuery':query,'image':img(en),
            'seasonality':{'months':list(range(1,13)) if months=='all' else list(map(int,months.split(','))), 'dateSpecific':special,
                'note':'具体活动日期以当年主办方公告为准，不按月份假定每天举办。' if special else '户外项目受气温、风力和天气影响。'},
            'availabilityNote':'按个人兴趣选择；预约、城外接驳与餐饮是否包含须另行核对。',
            'priceOptions':[{'id':'planning','name':'体验预算','includes':['说明范围内的活动预算预留'],
                 'excludes':['未明确包含的城外往返','额外餐饮购物'],**price(low,high,s)}]}
        if remote: row.update({'accessNote':f'市中心至活动区域单程约 {remote} 分钟；所列体验用时不含往返。','transferMinutes':remote})
        meals={'ex-chengde-manchu-food':'lunch','ex-qinhuangdao-seafood-market':'lunch','ex-datong-copper-hotpot':'dinner',
               'ex-hohhot-shaomai-morning':'breakfast','ex-hailar-milk-food':'breakfast','ex-shenyang-morning-market':'breakfast',
               'ex-changchun-stew':'dinner','ex-yanji-barbecue':'dinner','ex-yinchuan-night-food':'dinner'}
        if row['id'] in meals:
            row['includedMeals']=[meals[row['id']]]
            row['priceOptions'][0]['includes']=['这顿餐饮的规划预算，按选择替换相应日常餐费']
        EXPERIENCES.append(row)

def foods(c, rows):
    # slug|name|english/local|description|where|low,high|photo query
    for line in rows.strip().splitlines():
        slug,name,en,desc,where,budget,query=line.split('|'); low,high=map(float,budget.split(',')); s=c['sourceReferences'][0]['url']
        food={'id':'food-'+c['id']+'-'+slug,'cityIds':[c['id']],'name':name,'nameEn':en,'localName':name+' · '+en,
            'description':desc,'article':en,'articleScope':'dish','photoQuery':query,'image':img(en),'sourceUrl':s,
            'sourceReferences':c['sourceReferences'],'sourceCheckedAt':DAY,'sourceScope':'regional-food-context','sourceStatus':'reference',
            'catalogOrigin':'maintained-definition','price':price(low,high,s,'serving'),
            'servingNote':'按介绍中的单份、单盘或说明份量预留；作为日常餐饮选择，不重复叠加到每日餐费。',
            'whereByCity':{c['id']:[{'name':where,'kind':'area','sourceUrl':'https://www.google.com/maps/search/?api=1&query='+quote(c['name']+' '+where+' '+name),
                                  'note':'具体门店与当日菜单须核对；所列区域或老字号作为寻味入口，非已锁定套餐。'}]}}
        FOODS.append(food)
        c['guide']['foodHighlights'].append({'title':name,'text':desc})

def hotels(c, rows):
    # slug|Chinese|English|xy|budget|description|source
    for line in rows.strip().splitlines():
        slug,name,en,xy,budget,desc,s=line.split('|'); lat,lng=map(float,xy.split(',')); low,high=map(float,budget.split(','))
        EXPERIENCES.append({'id':'hotel-'+c['id']+'-'+slug,'cityId':c['id'],'kind':'hotel','name':name,'nameEn':en,
            'lat':lat,'lng':lng,'coordinateNote':'酒店所在片区近似位置；实际地址以订房页面为准。','durationMinutes':0,
            'description':desc,'tagline':desc,'features':['按每间每晚比较','房型与早餐单独核对'],
            'sourceUrl':s,'bookingUrl':s,'sourceReferences':refs(s,'酒店身份、地点与住宿特色；未核验所选日期房价'),
            'checkedAt':DAY,'article':en,'photoQuery':en,'image':img(en),'imagePolicy':'exact-only',
            'priceOptions':[{'id':'room','name':'每间每晚参考预算',**price(low,high,s,'room-night'),
                             'includes':['住宿预算预留'],'excludes':['未注明的早餐','接送','税费及额外服务']}]})

chengde=base('chengde','承德','Chengde','河北',40.9788,117.9429,'CDE',3,
    '山庄湖水、皇家寺庙和燕山山形交织；用两天读宫苑与建筑，再按兴趣留一天给山地或地方演出。',
    '承德南站通过京哈高铁联系北京、沈阳；普宁机场位于东北郊。山庄与老城可步行结合公交，双塔山约半小时车程，金山岭长城与兴隆均须按远郊整日安排。',
    ['https://lywh.chengde.gov.cn/col/col268/index.html','https://www.chengde.gov.cn/art/2022/8/5/art_360_868409.html','https://en.wikivoyage.org/wiki/Chengde'])
places(chengde,'''mountain-resort|避暑山庄|Chengde Mountain Resort|40.9907,117.9344|240|90,150|宫苑园林|先看宫殿，再在湖区选一条环线；山地园区面积很大，不能把整座山庄压缩成一小时。|Chengde Mountain Resort|0
putuo|普陀宗乘之庙|Putuo Zongcheng Temple|41.0200,117.9280|120|70,100|寺庙建筑|沿台地登临大红台，比较藏式与汉式建筑组合；台阶较多，与须弥福寿之庙的联票范围须核对。|Putuo Zongcheng Temple|0
puning|普宁寺|Puning Temple Chengde|41.0310,117.9507|90|60,90|寺庙建筑|看木构殿堂与千手千眼观音造像，保持安静，殿内是否可拍照遵循现场提示。|Puning Temple|0
museum|承德博物馆|Chengde Museum|41.0121,117.9572|120|0,0|历史博物馆|从展品了解避暑山庄与多民族交往，适合作为寺庙游览前的背景课；预约及闭馆日另查。|Chengde Museum|0
hammer-peak|磬锤峰国家森林公园|Qingchui Peak|40.9984,117.9757|150|30,100|山地自然|近看棒槌状岩峰与丹霞地貌，徒步和索道是不同预算与体力选择；雨雪天谨慎走山路。|Qingchui Peak Chengde|25
sumeru|须弥福寿之庙|Xumi Fushou Temple|41.0193,117.9410|75|70,100|寺庙建筑|寺院与班禅驻锡历史相关，金顶与依山院落值得细看；与普陀宗乘联票不要重复购买。|Xumi Fushou Temple|0
anyuan|安远庙|Anyuan Temple|41.0133,117.9647|60|10,40|寺庙建筑|寺名背后是清代边疆与民族交往的历史，适合与东侧寺庙合并游览；核对开放院落。|Anyuan Temple Chengde|0
pule|普乐寺|Pule Temple|41.0036,117.9681|60|20,50|寺庙建筑|圆形旭光阁与山峦相衬，远观轮廓和近看建筑各有趣味；常与磬锤峰线路组合。|Pule Temple|0
pushan|普善寺|Pushan Temple Chengde|41.0321,117.9525|45|0,0|寺庙遗存|与普宁寺相邻的历史寺院遗存，关注外观和可开放部分；不把修复区当成可入内展厅。|Pushan Temple Chengde|0
shuangta|双塔山|Shuangta Mountain|40.9587,117.8012|120|40,80|山地自然|双峰顶部的古塔构成特别的天际线，沿步道认识岩体；索道、导览和门票分别核价。|Shuangta Mountain Chengde|40
old-streets|二仙居与老城街巷|Erxianju Old Town Chengde|40.9756,117.9382|60|0,0|城市街区|从日常商铺和桥头小吃认识老承德，适合安排在宫苑参观后的轻松傍晚。|Chengde Erxianju|0
rehe-confucian|热河文庙|Rehe Confucian Temple|40.9654,117.9432|60|0,30|文庙古建|沿中轴看地方文教建筑与石刻；部分院落开放可能调整，出发前查当地文博公告。|Chengde Confucian Temple|0
kuixing|魁星楼|Kuixing Pavilion Chengde|40.9547,117.9354|75|20,40|城市观景|登临山坡上的楼阁看城市与周边山势，注意台阶体力需求，门票以实际开放范围为准。|Kuixing Pavilion Chengde|0
sengguan|僧冠峰|Sengguan Peak|40.9472,117.9503|150|0,50|山地自然|近郊山峰适合想远离主景区的人，选正式步道观城景，天黑前返回山下。|Sengguan Peak Chengde|20
wulie|武烈河滨河公园|Wulie River Riverside Park|40.9821,117.9488|60|0,0|城市公园|河岸步道适合饭后散步与看山城倒影，选住处附近的一段即可，不必全程赶路。|Wulie River Chengde|0
jinshanling|金山岭长城|Jinshanling Great Wall|40.6764,117.2433|240|55,100|长城徒步|敌楼与山脊构成开阔长城景观，选择有管理的开放段；上下山、索道与往返包车另留时间。|Jinshanling Great Wall|120
dongcunrui|董存瑞纪念馆|Dong Cunrui Memorial Hall|41.3108,117.7332|90|0,0|革命教育|在隆化通过纪念展与史料了解董存瑞及当地解放历史，庄重参观，团体讲解提前预约。|Dong Cunrui Memorial|90
xinglong-cave|兴隆溶洞|Xinglong Karst Cave|40.4310,117.6010|120|80,150|地质自然|洞内石笋与石幔适合地质兴趣游，湿滑台阶需慢行；兴隆与市区之间按独立出游日安排。|Xinglong cave Hebei|130
ban-cheng|板城酒博园|Bancheng Liquor Culture Park|40.7754,118.1730|90|20,100|工业文化|了解地方酿造与酒文化展示，参观线、试饮和购物不是同一项目；驾驶者不参加酒精试饮。|Chengde Bancheng wine|50
lotus-mountain|莲花山景区|Lianhua Mountain Chengde|41.0150,117.8170|150|30,80|山地自然|用近郊山地替换一段密集寺庙行程，沿开放步道看群峰；避开强风和雷雨。|Lianhua Mountain Chengde|45''')
experiences(chengde,'''kangxi-show|鼎盛王朝·康熙大典实景演出|Kangxi Grand Ceremony Outdoor Show|40.9414,117.8050|90|180,400|performance|在元宝山下看山体、灯光与群体表演构成的皇家题材舞台；座区价格不同，须确认当季演出日与散场接驳。|Kangxi Grand Ceremony Chengde|4,5,6,7,8,9,10|40|1
manchu-food|满族风味家常饭|Manchu Flavours in Chengde|40.9760,117.9370|90|60,180|food-life|在老城餐馆搭配莜面、蒸菜与小份肉菜，认识塞外家常味；套餐是否含茶水、主食先看菜单。|Manchu food Chengde|all|0|0
resort-boat|山庄湖区慢游船|Boating on the Mountain Resort Lakes|40.9938,117.9371|45|40,120|water-life|在湖区选择当日运营的游船，看岸上亭台倒映水中；山庄入园票与船费分开核算，风雨或结冰时停航。|Chengde Mountain Resort lake boat|4,5,6,7,8,9,10|0|0
paper-cut|满族剪纸与地方手作|Manchu Paper Cutting Workshop|40.9762,117.9383|90|50,160|craft|向老城非遗或文创门店询问实际开课的剪纸体验，从花鸟纹样认识满族民间审美；须先确认老师、材料和授课时间。|Manchu paper cutting|all|0|1
hot-spring|隆化温泉泡汤|Longhua Hot Spring Afternoon|41.3310,118.1450|180|100,300|wellness|把温泉作为一次放松的半日目的地，选择有公开营业信息的正规浴场；酒店住宿、浴资和往返车辆分开比较。|Longhua hot spring Chengde|all|100|0''')
foods(chengde,'''buckwheat|荞面饸饹|Buckwheat Hele Noodles|细长荞麦面常浇热卤，口感结实，适合作为一碗正餐。|二仙居小吃街|15,35|Hele noodles
oat|莜面窝子|Youmian Oat Noodle Rolls|薄莜面卷成蜂窝状蒸熟，蘸汁或配炖菜食用；多人分享一笼时另加蔬菜。|南营子大街家常菜馆|20,45|Youmian kaolao
lamb-soup|平泉羊汤|Pingquan Lamb Soup|以羊肉羊杂熬出热汤，饼和配菜通常另点；先确认是否接受内脏。|老城平泉羊汤店|18,40|Chinese lamb soup
donkey-roll|驴打滚|Ludagun Soybean Rice Rolls|糯米卷裹豆面、夹豆沙，适合买一小份作茶点，留意当天制作与储存。|二仙居糕点铺|10,25|Ludagun
almond-tea|杏仁茶|Apricot Kernel Sweet Tea|塞外杏仁香气融入温热甜糊，可配酥饼作早餐；对坚果过敏者应先问配料。|承德老城传统早点铺|8,20|Chinese almond tea''')
hotels(chengde,'''holiday-yuanbao|承德元宝山假日酒店|Holiday Inn Chengde Park View|40.9450,117.8060|400,950|位于双滦与元宝山一带，适合演出结束后就近休息；去避暑山庄需安排车程。|https://www.ihg.com.cn/holidayinn/hotels/cn/zh/chengde/cdeym/hoteldetail
express-yuanbao|承德元宝山智选假日酒店|Holiday Inn Express Chengde Park View|40.9456,117.8080|250,650|双滦区的连锁住宿选择，适合自驾与元宝山周边项目；早餐以房价条款为准。|https://www.ihg.com.cn/holidayinnexpress/hotels/cn/zh/chengde/cdecr/hoteldetail
express-downtown|承德中心智选假日酒店|Holiday Inn Express Chengde Downtown|40.9440,117.9470|260,700|市区连锁酒店，适合把预算留给景点和餐饮；订前核对到山庄丽正门的交通。|https://www.ihg.com/zh-cn/chengde-mainland-china
yunshan|承德云山饭店|Chengde Yunshan Hotel|40.9630,117.9470|220,600|市区传统饭店，适合希望公交和餐饮方便的旅客；新旧楼与翻新房型须在预订时区分。|https://www.trip.com/hotels/list?keyword=Chengde%20Yunshan%20Hotel
qianyang|承德乾阳大酒店|Chengde Qianyang Hotel|40.9880,117.9460|280,850|靠近山庄南侧与城市主要游览区，便于早入园；房型、停车和早餐逐项确认。|https://www.trip.com/hotels/list?keyword=Chengde%20Qianyang%20Hotel''')

qinhuangdao=base('qinhuangdao','秦皇岛','Qinhuangdao','河北',39.9354,119.5996,'BPE',4,
    '长城在海边收束，候鸟与沙滩把节奏放慢；山海关、海港区和北戴河适合分片区安排。',
    '铁路可选择秦皇岛、山海关或北戴河站，按酒店片区下车；北戴河机场距海港区较远。北戴河、山海关与北戴河新区不可按一片市区步行衔接，旺季接驳应留堵车余量。',
    ['https://www.shgjq.com/','https://en.wikivoyage.org/wiki/Qinhuangdao','https://en.wikivoyage.org/wiki/Beidaihe'],lodging=(180,450,1200),rent=(1500,3000,6000))
places(qinhuangdao,'''first-pass|山海关天下第一关|Shanhai Pass First Pass under Heaven|40.0118,119.7602|120|40,80|长城关隘|在城楼与关城理解长城防御格局，城楼门票和古城公共街区分开；海港区出发需要专程接驳。|Shanhaiguan|45
old-dragon|老龙头|Old Dragon Head Great Wall|39.9670,119.7995|120|40,80|海滨长城|看石城入海的地形与海防建筑，风大时注意海边台阶，安排与关城同一天更顺路。|Laolongtou Great Wall|50
pass-museum|山海关长城博物馆|Shanhaiguan Great Wall Museum|40.0105,119.7600|75|0,0|历史博物馆|用模型和文物认识长城、关隘和军防生活，适合带孩子在登城前补充背景。|Shanhaiguan Great Wall Museum|45
old-town|山海关古城街区|Shanhaiguan Old Town|40.0095,119.7565|75|0,0|历史街区|关城巷子仍有居民日常与小吃店，沿南大街慢慢看；收费院落与演出不含在街区免费漫游中。|Shanhaiguan old town|45
jiaoshan|角山长城|Jiaoshan Great Wall|40.0507,119.7591|180|30,80|长城山地|长城从平原爬上山脊，坡度较大，穿防滑鞋；只走正式开放线路，不将野长城接入行程。|Jiaoshan Great Wall|60
mengjiang|孟姜女庙|Meng Jiangnu Temple|40.0069,119.8149|60|20,40|民间文化|从庙宇与碑刻理解孟姜女传说在地方文化中的流传，适合对民俗感兴趣的人选择。|Meng Jiangnu Temple|50
pigeon-nest|鸽子窝公园|Pigeon Nest Park Beidaihe|39.8317,119.5235|120|25,45|海滨公园|沙滩、礁石和湿地构成观海路线，日出要另查潮汐与天气；观鸟时不追逐或投喂。|Pigeon Nest Park|40
tiger-rock|老虎石海上公园|Tiger Stone Marine Park|39.8149,119.4835|90|0,20|海滨公园|在礁石与沙滩之间看海，游泳只在当日开放的看护水域，浪大时不要登湿滑礁石。|Tiger Stone Beidaihe|40
biluota|碧螺塔海上酒吧公园|Biluota Seaside Park|39.8180,119.5230|150|30,160|海滨休闲|白天海岸与夜间灯光是不同游玩方式，门票是否含演出看产品说明，散场交通提前安排。|Biluota Beidaihe|40
laohushi-west|平水桥海滨|Pingshuiqiao Beach|39.8168,119.4720|120|0,0|海滨沙滩|把下午留给沙滩和海风，遮阳、淋浴、躺椅等消费另计；按潮汐和开放要求亲水。|Beidaihe Pingshuiqiao beach|40
gezi-wetland|北戴河滨海湿地观鸟区|Beidaihe Coastal Wetlands|39.8467,119.5140|120|0,30|湿地自然|春秋迁徙季可见候鸟停歇，沿允许进入的观察点用望远镜看鸟，不进入保护区核心地带。|Beidaihe birds wetland|40
botanical|集发农业梦想王国|Jifa Agricultural Park|39.8310,119.4390|240|60,150|亲子农业|设施农业、亲子活动和季节作物适合家庭半日游；游乐套票、采摘和餐饮分别核价。|Jifa Beidaihe|45
xianluo|仙螺岛|Xianluo Island|39.7800,119.4310|150|60,150|海滨休闲|海上索道是项目特色，受风力与维修安排影响；出发前确认运营，不把停运日排成固定活动。|Xianluo Island|50
gold-coast|昌黎黄金海岸|Changli Gold Coast|39.6960,119.3300|180|0,50|海滨沙滩|适合住一晚慢慢看海，公共沙滩与收费游乐项目分开选择；距海港区较远。|Changli Gold Coast|75
aranya|阿那亚礼堂与海边社区|Aranya Seaside Community|39.6530,119.3270|180|0,100|海滨建筑|白色礼堂、艺术空间与海岸形成社区景观，进入权限和展览门票须以社区当日规则为准，非随到随进。|Aranya Chapel|90
sea-museum|秦皇岛博物馆|Qinhuangdao Museum|39.9160,119.5700|120|0,0|历史博物馆|从港口、海洋与城市历史认识秦皇岛，适合雨天；馆方预约、证件与闭馆日另查。|Qinhuangdao Museum|0
xigang|西港花园|Xigang Garden Qinhuangdao|39.9040,119.6210|120|0,0|港口工业遗产|旧港区铁路与码头景观适合看城市和海港的关系，进入开放公共区域，勿跨越港务围栏。|Qinhuangdao Xigang Garden|0
dolphin-bay|新澳海底世界|Xin'ao Underwater World|39.9075,119.5630|150|60,150|海洋科普|以水族展览为主的亲子选项，先了解展馆范围和当天开放安排，再决定是否值得占用半天。|Xin Ao Underwater World|0
xinlu|秦皇求仙入海处|Qin Emperor Sea Quest Site|39.9100,119.6330|90|35,65|历史主题园|围绕秦始皇东巡传说建成的主题园，理解其现代展示性质，可与东山海岸同片区游览。|Qinhuangdao Qin emperor sea|0
lianfeng|联峰山公园|Lianfeng Mountain Park|39.8250,119.4630|150|20,40|山地公园|松林和山顶视野适合清晨轻徒步，与海边度假形成不同节奏；台阶路不适合推车全程通过。|Lianfeng Mountain|40''')
experiences(qinhuangdao,'''birdwatch|北戴河迁徙季观鸟|Beidaihe Migration Birdwatching|39.8467,119.5140|150|0,300|wildlife|在合法开放观察点辨认水鸟和迁徙猛禽，可自带望远镜或预约当地正规向导；不承诺必见鸟种，向导费按人数分摊。|Beidaihe birdwatching|3,4,5,9,10,11|40|0
beach-afternoon|金梦海湾海边午后|Slow Afternoon at Jinmeng Bay|39.9068,119.5520|150|0,100|coastal-life|给沙滩、书本和海风留一整个下午，按需要选择咖啡或遮阳租赁；没有消费也可以在开放岸线散步。|Qinhuangdao beach|5,6,7,8,9|0|0
seafood-market|海鲜市场挑选与现做|Seafood Market and Cooked-to-order Meal|39.9340,119.5920|120|80,250|food-life|在正规水产市场比较按斤单价和加工费，再选能明码标价的店处理；海鲜时价、重量与总额先确认。|Qinhuangdao seafood market|all|0|0
greatwall-photo|金色时段的关城摄影|Golden-hour Photography at Shanhai Pass|40.0100,119.7580|90|0,100|photography|用晨光或傍晚光线记录古城街巷与关楼，登城部分另购票；不占用居民门口，不为拍照跨越城墙护栏。|Shanhaiguan sunset|all|45|0
aranya-festival|阿那亚戏剧与艺术活动|Aranya Theatre and Arts Events|39.6520,119.3270|180|100,600|festival|海边剧场与社区空间会举行戏剧、音乐和展览活动，先查当年节目、入园资格及票务；活动不是全年每天都有。|Aranya theatre festival|5,6,7,8,9|90|1''')
foods(qinhuangdao,'''hun-pot|山海关浑锅|Shanhaiguan Mixed Hotpot|白菜、酸菜、肉片和海味在铜锅中煮出复合滋味，按多人共享一锅考虑，人少先问小份。|山海关古城浑锅店|50,100|Chinese copper hot pot
miancha|面茶|Millet Sesame Paste Breakfast|热面糊配芝麻酱的咸香早点，与海港城市早餐文化相连，适合单碗配小烧饼。|山海关古城早餐铺|8,18|Miancha
four-buns|四条包子|Sitiao Steamed Buns|关城老字号式包子常作为早餐或简餐，鲜肉馅和素馅按实际菜单选择。|山海关四条包子铺|15,35|Chinese baozi steamed buns
seafood|渤海蒸海鲜|Bohai Steamed Seafood|蛤蜊、扇贝等按当天到货选择，清蒸便于品尝原味；按斤报价不等于一盘总价。|海港区水产市场与海鲜餐馆|40,160|Steamed scallops China
sesame-cake|芝麻烧饼|Sesame Shaobing|外皮酥脆带芝麻香，可配羊汤或面茶；买现烤小份比一次购太多更合适。|山海关古城烧饼铺|4,12|Shaobing sesame''')
hotels(qinhuangdao,'''shangrila|秦皇岛香格里拉|Shangri-La Qinhuangdao|39.9040,119.5490|650,1800|海港区临海酒店，适合把沙滩与市内餐饮结合；海景房、园景房和早餐条款分别比较。|https://www.shangri-la.com/cn/qinhuangdao/shangrila/
sheraton|秦皇岛北戴河华贸喜来登酒店|Sheraton Qinhuangdao Beidaihe Hotel|39.8290,119.5020|500,1500|北戴河度假片区的品牌酒店，适合海边慢游；旺季价格与到海滩的步行距离以具体房型页面为准。|https://www.marriott.com.cn/hotels/shpsi-sheraton-qinhuangdao-beidaihe-hotel/overview/
marriott|秦皇岛万豪度假酒店|Qinhuangdao Marriott Resort|39.6930,119.3380|650,1900|北戴河新区滨海度假选择，适合多留一天享受酒店与海岸；并非海港区市中心住宿。|https://www.marriott.com/en-us/hotels/bpemc-qinhuangdao-marriott-resort/overview/
clubmed|北戴河黄金海岸Club Med Joyview|Club Med Joyview Golden Coast|39.6710,119.3280|1000,2800|黄金海岸休闲度假酒店，不同产品可能包含餐饮与活动；先看套餐清单，避免重复计入日常餐费。|https://www.clubmed.com.cn/r/joyview-golden-coast/y
express|秦皇岛海港智选假日酒店|Holiday Inn Express Qinhuangdao Haigang|39.9530,119.5790|220,650|西港路309号的市区连锁住宿，可把预算留给跨片区接驳；具体到海滩距离与早餐以订房条款确认。|https://www.ihg.com/holidayinnexpress/hotels/cn/zh/qinhuangdao/bpeqi/hoteldetail''')

datong=base('datong','大同','Datong','山西',40.0915,113.2916,'DAT',4,
    '云冈石窟、辽金木构与古城烟火同在一座北方城里；以雕刻、寺院和面食为主线，城外再择一座山。',
    '大同南站有高铁联系北京、太原等地，云冈机场另有市区接驳。古城以步行为主；云冈在西郊，悬空寺与恒山在浑源，不能塞进市内步行串线。',
    ['https://dt.gov.cn/dtszf/whlvn/whly.shtml','https://www.dt.gov.cn/dtszf/tzggnr/202504/a8ebe399d79a444e828d7aa0dbaf6214.shtml','https://en.wikivoyage.org/wiki/Datong'])
places(datong,'''yungang|云冈石窟|Yungang Grottoes|40.1097,113.1323|210|100,150|石窟艺术|从昙曜五窟到后期开凿的小窟看造像风格变化，按开放窟群游览；保护区域不触摸、不用闪光灯。|Yungang Grottoes|45
huayan|华严寺|Huayan Temple Datong|40.0893,113.2892|120|40,80|辽金木构|大雄宝殿、薄伽教藏殿与彩塑让人近距离感受辽金建筑，慢看构件与殿内陈设。|Huayan Temple Datong|0
shanhua|善化寺|Shanhua Temple|40.0833,113.2922|90|0,50|辽金木构|院落中保存大殿与塑像艺术，选择安静时段细看；票务政策可能随淡旺季调整。|Shanhua Temple|0
nine-dragon|九龙壁|Nine Dragon Wall Datong|40.0918,113.2965|45|0,20|琉璃艺术|沿长壁比较九龙姿态、釉色与水纹，适合与附近古城建筑顺路参观。|Nine Dragon Wall Datong|0
walls|大同古城墙|Datong City Wall|40.0940,113.3060|120|0,60|城墙观景|选择一个开放城门登城看街巷格局，步行或租车骑行费用另查，不必绕完整圈才算游过。|Datong City Wall|0
museum|大同市博物馆|Datong Museum|40.0940,113.3540|150|0,0|历史博物馆|通过北魏陶俑与地方文物串起平城历史，适合作为石窟与寺庙参观的补充。|Datong Museum|0
dai-palace|代王府|Dai Prince Mansion|40.0940,113.2960|120|60,150|历史主题建筑|如今可见的是以明代王府格局重建的建筑群，按兴趣选择建筑游览或演出，勿与原存古建混为一谈。|Dai Prince Mansion Datong|0
fahua|法华寺|Fahua Temple Datong|40.0990,113.3050|60|0,30|寺庙建筑|在古城东北侧看寺院与白塔环境，适合与城墙路线组合；尊重宗教活动与拍摄边界。|Fahua Temple Datong|0
chunyang|纯阳宫|Chunyang Palace Datong|40.0890,113.2950|60|0,30|道教建筑|小院落与木构细部适合细看，减少赶场，把这里与鼓楼周边一道安排。|Chunyang Palace Datong|0
guandi|关帝庙|Guandi Temple Datong|40.0940,113.2920|60|0,30|历史寺庙|从地方祭祀与戏台空间看北方城镇生活，进殿参观以现场开放安排为准。|Guandi Temple Datong|0
drum-tower|大同鼓楼|Datong Drum Tower|40.0882,113.2963|30|0,0|城市地标|从街口看鼓楼与古城交通轴线，作为寻访老店的路标；外观免费不代表一定开放登楼。|Datong Drum Tower|0
sculpture|中国雕塑博物馆|China Sculpture Museum Datong|40.1050,113.2960|90|0,0|雕塑艺术|城墙空间内的当代雕塑与古城外观形成有趣对照，需先核实展览开放入口。|Datong sculpture museum|0
panjiayuan|大同潘家园|Datong Panjiayuan Cultural Market|40.0850,113.2880|60|0,0|文化市集|浏览地方手作、文创与小店，重点感受市场气氛；古董真伪及收藏价值不作为旅游承诺。|Datong Panjiayuan|0
wenying|文瀛湖生态公园|Wenying Lake Park|40.0820,113.4010|120|0,0|城市湿地|沿湖骑行或步行，留一点空间看水鸟与城市远景；不进入封闭湿地或惊扰鸟类。|Wenying Lake Datong|0
mingtang|北魏明堂遗址公园|Northern Wei Mingtang Site|40.0610,113.3020|90|0,40|考古遗址|通过遗址与展示认识北魏礼制建筑，明确哪些是考古遗存、哪些是现代解释性展示。|Northern Wei Mingtang Datong|0
hanging|悬空寺|Hanging Temple|39.6581,113.6746|120|100,160|悬崖古建|建筑贴崖而立，登临有容量和体力限制；门票与登临票是否分开需确认，不适合恐高者勉强登高。|Hanging Temple|95
hengshan|北岳恒山|Mount Heng Shanxi|39.6740,113.7390|240|40,150|山地古建|把登山与沿途庙宇作为半天以上活动，索道不能省略全部爬升；风雪天气改室内路线。|Mount Heng Shanxi|100
yong-an|浑源永安寺|Yong'an Temple Hunyuan|39.6950,113.6880|90|20,50|壁画寺庙|殿内壁画与书法需要安静细看，可与浑源县城美食合并，进殿拍照按文保规定。|Yongan Temple Hunyuan|95
earth-forest|大同土林|Datong Earth Forest|39.9640,113.5350|90|40,80|地质自然|风化土柱在斜光下层次明显，雨后泥路与坡缘不稳；仅走管理方允许的路线。|Datong earth forest|50
yingxian|应县木塔|Sakyamuni Pagoda of Fogong Temple|39.5654,113.1837|90|40,70|木构古塔|在塔外与开放区域观察木构比例和斗拱，不假定能登塔；距大同较远，适合专门的古建日。|Sakyamuni Pagoda Fogong|90''')
experiences(datong,'''noodle-demo|看削面师傅下一锅刀削面|Knife-cut Noodles at a Datong Noodle Shop|40.0890,113.2910|60|20,50|food-life|在有开放档口的面馆看面片落锅，再选肉卤与小菜；观摩依店家安排，不承诺可进入后厨操作。|Datong knife cut noodles|all|0|0
copper-hotpot|铜火锅围桌晚饭|Datong Copper Hotpot Dinner|40.0900,113.2930|120|70,180|food-life|把什锦铜火锅当成共享晚餐，肉菜搭配先看份量，人少可点小锅；酒水与服务费核清。|Datong copper hotpot|all|0|0
bronze-craft|大同铜器与手工錾刻|Datong Copper Craft Encounter|40.0850,113.2880|90|30,180|craft|在古城传统铜器店或非遗展示活动观察打制、錾刻与纹样，亲手体验需事先确认工坊是否开课。|Datong copper craft|all|0|1
lanterns|大同古城年节灯会|Datong Ancient City Lantern Festival|40.0940,113.3050|150|0,120|festival|春节前后城墙与街巷可能举办灯会和年俗活动，按当年公告选择日期；普通夜景不等于灯会专场。|Datong lantern festival|1,2,3|0|1
wood-architecture|辽金建筑慢看与讲解|Liao and Jin Architecture Guided Study|40.0860,113.2910|180|100,350|heritage-study|以华严寺和善化寺为主线观察斗拱、殿宇尺度与彩塑，选择有资质的讲解服务；门票、讲解人数和集合点分开确认。|Huayan Shanhua wooden architecture|all|0|0''')
foods(datong,'''knife-noodles|大同刀削面|Datong Knife-cut Noodles|面片外滑内韧，搭配猪肉卤、豆腐和卤蛋很常见；按一碗主食预留。|东方削面及古城面馆|15,35|Knife cut noodles
shaomai|大同烧麦|Datong Shaomai|薄皮花边包裹肉馅，蘸醋配热茶，按一笼或菜单标示的面粉两数点单。|凤临阁及鼓楼周边烧麦店|30,75|Datong shaomai
liangfen|浑源凉粉|Hunyuan Liangfen|凉粉配辣油、醋与豆干，凉爽酸辣；到浑源县游古建时可作午间小食。|浑源县鼓楼周边凉粉店|8,20|Hunyuan liangfen
yellow-cake|黄米油炸糕|Fried Yellow Millet Cake|黏软黄米面包豆馅后炸出酥皮，刚出锅很烫，适合少量分享。|大同古城糕点与家常菜馆|8,25|Shanxi fried millet cake
copper-pot|大同什锦铜火锅|Datong Copper Hotpot|酥肉、丸子、烧肉和蔬菜在铜锅中层叠炖煮，按多人共享的一锅折算人均。|古城鼓楼附近铜火锅店|60,150|Datong hot pot''')
hotels(datong,'''jianguo|大同云冈建国宾馆|Yungang Jianguo Hotel Datong|40.0680,113.3020|300,900|位于老城与御东之间的城市饭店，适合兼顾景区与铁路站；临时接驳活动不能当成全年固定服务。|https://www.btgjianguo.com.cn/hotel/JG0088
wangfu|大同王府至尊酒店|Datong Wangfu Supreme Hotel|40.0570,113.2950|280,800|市区综合型酒店，餐饮选择较多，去古城通常需短程车；新旧房型与早餐分别查看。|https://hotels.ctrip.com/hotels/436531.html
pushy|建国璞隐大同古城西环路云冈店|Jianguo Puyin Datong Ancient City Xihuan Road|40.0790,113.2650|260,650|古城西侧的中档国风连锁，适合自驾往返云冈；停车、洗衣和早餐以房型条款为准。|https://www.bthhotels.com/wap/HotelInfo/B35206?pt=info
datong-hotel|大同宾馆|Datong Hotel|40.0710,113.2920|200,600|市区传统饭店，适合较看重公共交通与餐饮便利的旅客；确认楼栋、翻新情况与无烟房。|https://www.dt.gov.cn/dtszf/tzggnr/202504/a8ebe399d79a444e828d7aa0dbaf6214.shtml
weidu|大同魏都国际酒店|Weidu International Hotel Datong|40.0630,113.3000|350,1000|综合型城市酒店，适合家庭或希望酒店设施较齐全的旅客；酒店接送与景区车需单独询问。|https://www.dt.gov.cn/dtszf/tzggnr/202504/a8ebe399d79a444e828d7aa0dbaf6214.shtml''')

pingyao=base('pingyao','平遥','Pingyao','山西',37.2022,112.1800,'TYN',3,
    '住进院落，在城墙、票号与小吃铺之间认识晋商生活；彩塑、漆器与摄影让古城不只是打卡背景。',
    '平遥古城站有大西高铁，平遥站有普速列车；太原武宿机场是可选航空门户，需另计城际转乘。古城内以步行为主，双林寺约20分钟、镇国寺约30分钟车程。',
    ['https://www.pygc.com/single/13','https://whc.unesco.org/en/list/812/','https://en.wikivoyage.org/wiki/Pingyao'],lodging=(130,320,1100),rent=(1000,2200,4000))
places(pingyao,'''wall|平遥古城墙|Pingyao City Wall|37.1980,112.1779|120|100,125|城墙古建|从开放城门登城看民居屋顶与城防格局，按体力走一段即可；属古城通票，勿逐处重复买票。|Pingyao city wall|0
rishengchang|日昇昌票号|Rishengchang Exchange House|37.2050,112.1770|90|100,125|晋商金融|从柜台、账房与院落了解票号汇兑，让传统金融历史变得具体；属古城通票。|Rishengchang|0
county|平遥县衙|Pingyao County Government Office|37.1995,112.1770|90|100,125|衙署建筑|按大堂、内宅和院落理解传统县级行政空间，演示表演并非每天同一时刻；属古城通票。|Pingyao county government|0
wenmiao|平遥文庙|Pingyao Confucian Temple|37.1984,112.1840|75|100,125|文庙古建|沿礼制轴线看殿宇与科举文化，部分古建筑保存较早年代构件；属古城通票。|Pingyao Confucian Temple|0
shuanglin|双林寺|Shuanglin Temple|37.1725,112.1267|120|25,40|彩塑艺术|殿内彩塑的表情、衣纹与姿态值得慢看，勿触摸与用闪光灯；此处不含在古城通票内。|Shuanglin Temple|20
zhenguo|镇国寺|Zhenguo Temple|37.2770,112.2168|90|20,35|五代木构|万佛殿木构与彩塑共同展现早期建筑艺术，适合古建爱好者专程来；另购门票。|Zhenguo Temple|30
chenghuang|平遥城隍庙|Pingyao City God Temple|37.2000,112.1834|60|100,125|民间信仰|从戏台、殿宇和壁画认识城市守护神信仰，属古城通票，院落之间留意高门槛。|Pingyao City God Temple|0
qingxu|清虚观|Qingxu Taoist Temple Pingyao|37.2077,112.1856|60|100,125|道教建筑|古城东北部的道观与地方文物展线，适合避开南大街的人流；属古城通票。|Qingxu Guan Pingyao|0
xietongqing|协同庆钱庄博物馆|Xietongqing Bank Museum|37.2011,112.1804|75|100,125|晋商金融|将钱庄业务与票号汇兑作比较，地下展示空间按开放要求参观；属古城通票。|Xietongqing Pingyao|0
escort|中国镖局博物馆|Chinese Armed Escort Museum Pingyao|37.2005,112.1805|60|100,125|商旅历史|看晋商货物运输背后的护送、镖路与江湖规矩，属古城通票；民俗展示与真实史料注意区分。|Pingyao escort museum|0
lei-house|雷履泰故居|Lei Lutai Former Residence|37.1985,112.1751|60|100,125|晋商院落|从宅院尺度与空间分区认识票号人物的家庭生活，属古城通票，尊重文物护栏。|Lei Lutai residence|0
ma-house|马家大院|Ma Family Courtyard Pingyao|37.2090,112.1870|90|100,125|民居院落|通过多进院落认识晋商住宅格局，可选择与其他票号互补游览；属古城通票。|Ma family courtyard Pingyao|0
baichuantong|百川通票号|Baichuantong Exchange House|37.2014,112.1804|60|100,125|晋商家具|看票号宅院与传统家具陈设，属古城通票；已看多家票号时可自由略过。|Baichuantong Pingyao|0
erlang|二郎庙|Erlang Temple Pingyao|37.2090,112.1773|60|100,125|民俗庙宇|位于北大街的寺庙院落适合观察地方民间神祇与戏台，属古城通票。|Erlang temple Pingyao|0
weishengchang|蔚盛长票号|Weishengchang Bank Pingyao|37.2051,112.1790|45|100,125|晋商金融|选看票号展陈中的经营与商号往来，规模较小，可作为深度选项而非必到点；属古城通票。|Weishengchang Pingyao|0
huabei-escort|华北第一镖局|North China First Escort Agency Pingyao|37.2059,112.1817|60|100,125|商旅历史|院落展示押运线路与镖师故事，适合对商旅交通感兴趣的人；属古城通票。|Pingyao North China escort museum|0
south-street|南大街明清街|South Street Pingyao|37.2020,112.1804|90|0,0|历史街区|店铺、招牌和院门密集，走进支巷更能感受街坊生活；公共街巷免费，店内体验另计。|Pingyao South Street|0
market-tower|市楼外观|Pingyao Market Tower|37.2025,112.1804|30|0,0|城市地标|从街口看古城市楼与两侧商铺比例，外观即可认识中轴线，不假定开放登楼。|Pingyao Market Tower|0
catholic|平遥天主教堂外观|Pingyao Catholic Church|37.2060,112.1870|30|0,0|近代建筑|这座教堂为晋商古城提供不同的建筑视角，尊重礼拜与院落开放边界，平时以外观欣赏为主。|Pingyao Catholic Church|0
wang-courtyard|王家大院|Wang Family Compound|36.8985,111.8689|180|35,80|晋商大院|灵石的大型院落群适合专程半日古建游，与平遥城内住宅不是同一地点；需往返车辆。|Wang Family Compound|80''')
pass_slugs={'wall','rishengchang','county','wenmiao','chenghuang','qingxu','xietongqing','escort','lei-house','ma-house','baichuantong','erlang','weishengchang','huabei-escort'}
for a in pingyao['attractions']:
    if a['id'].removeprefix('pingyao-') in pass_slugs:
        a['price'].update({'passGroup':'pingyao-ancient-city-pass','passValidityDays':3,'note':'古城22景点通票预算，同一有效期内只计一次；官方说明有效3天、每个景点限进入一次。双林寺、镇国寺及又见平遥演出不含。'})
experiences(pingyao,'''encore|又见平遥沉浸式演出|Encore Pingyao Immersive Theatre|37.2015,112.1630|100|200,300|performance|跟随行进式舞台进入票号与家族故事，演出包含站立和移动；必须先选场次，门票不含古城通票。|Encore Pingyao|all|0|1
lacquer|推光漆器技艺与手作|Pingyao Polished Lacquer Craft|37.2040,112.1780|90|80,250|craft|在有实际接待的漆器工坊了解打磨、描金与纹样，可选择非生漆接触的安全体验；预约和成品费用先问清。|Pingyao lacquerware|all|0|1
photo-festival|平遥国际摄影大展|Pingyao International Photography Festival|37.2050,112.1780|180|0,100|festival|古城院落与工业遗存会成为摄影展场，按当年展期、场馆及票务挑选主题；不是全年常设项目。|Pingyao photography festival|9|0|1
noodle-workshop|山西面食花样体验|Shanxi Noodle Making in Pingyao|37.2010,112.1800|90|60,180|food-craft|向提供体验的客栈或餐馆预约揪片、剔尖等面食制作，吃自己做的一餐；餐费与课程费是否包含先确认。|Shanxi noodle making|all|0|1
courtyard-tea|古城院落里的茶与慢时光|Courtyard Tea in Pingyao|37.2040,112.1810|90|30,100|local-life|在对外营业的院落茶室坐一会儿，观察木窗与院落光线；不打扰客栈住客，按菜单选择茶点。|Pingyao courtyard|all|0|0''')
foods(pingyao,'''beef|平遥牛肉|Pingyao Beef|盐卤慢煮后切片，肉纹紧密，适合作为冷盘与面食一起分享；真空特产与堂食单盘价不同。|冠云牛肉门店与古城晋菜馆|30,70|Pingyao beef
wantuo|平遥碗托|Pingyao Wantuo|荞麦或面粉糊蒸熟切条，可凉拌也可炒食，蒜醋香气鲜明。|南大街与北大街碗托铺|10,25|Pingyao wantuo
kaolao|莜面栲栳栳|Youmian Kaolaolao|蜂窝形莜面卷蒸好后蘸卤食用，作为主食按笼点，通常适合两人分享。|古城晋菜馆|20,45|Youmian kaolao
long-yam|长山药甜品|Pingyao Chinese Yam Dessert|当地长山药可蒸、拔丝或做甜品，不同做法含糖和份量差异较大，先选适合自己的版本。|南大街晋菜馆|20,50|Chinese yam dessert
youcha|油茶|Shanxi Roasted Flour Tea|炒面与芝麻等配料冲成温热糊状，是古城早餐或茶点的一种，先问是否含坚果。|古城早点铺|6,15|Chinese youcha flour tea''')
hotels(pingyao,'''jing|平遥锦宅客栈|Jing's Residence Pingyao|37.2059,112.1830|1000,2500|东大街晋商院落改造的精品住宿，适合慢住并欣赏建筑；接站与餐饮须看房价条款。|https://hotels.ctrip.com/hotels/535816.html
yunjincheng|平遥云锦成公馆|Yunjincheng Mansion Pingyao|37.2048,112.1760|650,1700|西大街院落式酒店，以传统空间和木构细节为特色；古城限行时核对行李接驳。|https://www.pyyjc.cn/kfyd.html
hongshanyi|平遥洪善驿君澜别院|Hongshanyi Hotel Pingyao|37.1979,112.1821|350,1000|古城南部院落住宿，适合喜欢安静院落的旅客；床型、采暖和隔音需看具体房间。|https://www.trip.com/hotels/list?keyword=Hongshanyi%20Pingyao
dechaoge|平遥德朝阁客栈|De Chao Ge Hotel Pingyao|37.2010,112.1760|250,700|传统院落客栈，去县衙片区较便利；老建筑客房面积和门槛高低与标准连锁不同。|https://www.trip.com/hotels/list?keyword=De%20Chao%20Ge%20Pingyao
tianyuankui|平遥天元奎客栈|Tian Yuan Kui Guesthouse Pingyao|37.2014,112.1802|180,650|南大街生活气息较浓的院落客栈，适合重视位置的旅客；临街与内院房安静程度不同。|https://www.trip.com/hotels/list?keyword=Tian%20Yuan%20Kui%20Pingyao''')

hohhot=base('hohhot','呼和浩特','Hohhot','内蒙古',40.8175,111.6522,'HET',4,
    '召庙、乳食和清晨烧麦是青城日常；看完博物馆，再去敕勒川感受山脚草原的开阔。',
    '呼和浩特站与东站有高铁联系北京、包头等地，机场启用及航班终端以订票确认为准。市内地铁结合公交；博物院新馆在东站附近，草原与乳业工厂都需专门接驳。',
    ['https://wlt.nmg.gov.cn/','https://en.wikivoyage.org/wiki/Hohhot','https://szb.nmgnews.com.cn/bfxb/resfile/2026-04-30/04/bfxb2026043004.pdf'])
places(hohhot,'''dazhao|大召寺|Dazhao Temple|40.8014,111.6510|90|25,50|藏传佛教寺庙|在银佛、龙雕与壁画之外看寺院和老城生活的关系，殿内拍照遵循寺方要求。|Dazhao Temple|0
xilitu|席力图召|Xilitu Zhao Temple|40.8014,111.6542|75|25,45|召庙文化|院落与白塔展示青城召庙特色，适合与相邻大召择一深入或作建筑比较。|Xilitu Zhao|0
five-pagoda|五塔寺|Five Pagoda Temple Hohhot|40.8015,111.6611|60|0,30|石刻建筑|金刚座舍利宝塔的砖雕、石刻与天文图是看点，沿开放范围细看，勿攀爬。|Five Pagoda Temple Hohhot|0
general-office|绥远城将军衙署|Suiyuan General Government Office|40.8309,111.6861|90|0,0|清代衙署|在衙署空间了解绥远驻防与城市形成，老建筑门槛较高，馆方开放日需核对。|Suiyuan General Government Office|0
inner-mongolia-museum|内蒙古博物院新馆|Inner Mongolia Museum New Building|40.8450,111.7470|180|0,0|历史博物馆|以北方生态、考古和民族历史为主线，新馆位于新华东街76号、东站附近，须按新馆预约与入口前往，勿误到原馆。|内蒙古博物院新馆|0
natural-museum|内蒙古自然博物馆|Inner Mongolia Natural History Museum|40.7880,111.7160|150|0,0|自然科普|化石、地质与生态展览适合亲子与雨天，和历史博物院是不同场馆，预约入口分别确认。|Inner Mongolia Natural History Museum|0
princess|和硕恪靖公主府|Princess Kejing Mansion|40.8492,111.6530|90|0,30|清代府邸|院落反映清代公主府制度与地方交往，适合与将军衙署串起城市北部文化线。|Princess Kejing Mansion|0
zhaojun|昭君博物院|Zhaojun Museum|40.7060,111.6790|120|0,60|历史纪念|以昭君出塞和民族交往为主题，在馆舍与墓冢环境中了解叙事与史料的区别。|Zhaojun Tomb|40
great-mosque|清真大寺|Great Mosque Hohhot|40.8103,111.6540|45|0,0|宗教建筑|欣赏中国式清真寺建筑与周边生活，是否接待游客依礼拜和管理安排，不进入非开放礼拜区。|Great Mosque Hohhot|0
saishang|塞上老街|Saishang Old Street|40.8000,111.6495|75|0,0|老城街区|从手作店、茶食与旧街空间认识青城老城，购物与拍照套餐按个人兴趣决定。|Saishang Old Street|0
kuanxiangzi|宽巷子|Kuan Xiangzi Hohhot|40.8150,111.6490|60|0,0|饮食街区|清真小吃与日常商铺聚集，适合分量小、种类多地尝试；尊重店铺饮食习惯。|Hohhot Kuanxiangzi|0
wulanfu|乌兰夫纪念馆|Ulanhu Memorial Hall|40.8210,111.6270|90|0,0|革命教育|通过照片、文献与历史陈列了解乌兰夫生平，团体讲解和开放日以纪念馆预约为准。|Ulanhu Memorial|0
baota|万部华严经塔|Wanbu Huayanjing Pagoda|40.8410,111.9040|75|20,50|辽代古塔|俗称白塔的辽代砖塔保存多语题记，是理解交通与文化交流的独特点；是否能登塔另查。|Wanbu Huayanjing Pagoda|40
wusutu|乌素图召|Wusutu Zhao Temple|40.8510,111.5580|90|0,40|山麓寺院|大青山脚的寺庙群与果园村落相邻，适合放缓脚步看建筑，勿把未开放院落列入必游。|Wusutu Zhao|35
chilechuan|敕勒川草原|Chilechuan Grassland|40.9230,111.8690|180|0,60|草原自然|城市近郊草原适合骑行、散步与看山，不保证每季都有绿色草地，秋冬以枯草景观为主。|Chilechuan grassland|45
hasuhai|哈素海|Hasuhai Lake|40.6110,111.0310|150|0,100|湖泊湿地|水面、芦苇与候鸟适合轻松自然游，乘船与骑行另计，鸟类活动不作必见承诺。|Hasuhai|80
huhe-museum|呼和浩特博物馆|Hohhot Museum|40.8210,111.6740|90|0,0|城市博物馆|从城市沿革与地方展览认识归化、绥远到今天的青城，地址及临展安排出发前再核实。|Hohhot museum|0
naobao|恼包村|Naobao Village Hohhot|40.8880,111.8650|120|0,60|乡村休闲|村落水景与休闲商业适合家庭短途，明确这里是现代休闲乡村，不当作完整保留的古村。|Naobao village|40
qingcheng|青城公园|Qingcheng Park|40.8080,111.6690|75|0,0|城市公园|在湖边与树荫下体验城市公园生活，适合早餐后散步，游船和游乐设施单独收费。|Qingcheng Park|0
racecourse|内蒙古赛马场|Inner Mongolia Racecourse|40.8550,111.6800|75|0,100|体育文化|赛马场可作为了解马文化的城市点位，赛事与开放参观分别查公告；不默认每天有赛马。|Inner Mongolia racecourse|0''')
experiences(hohhot,'''shaomai-morning|一两烧麦与砖茶的早晨|Shaomai and Brick Tea Breakfast|40.8010,111.6510|75|30,75|food-life|当地烧麦常按面粉两数点单，先问一两有多少个，再配砖茶；在早餐时间感受老城慢节奏。|Hohhot shaomai tea|all|0|0
dairy-tour|伊利乳都工业参观|Yili Dairy Industry Tour|40.7350,111.5120|150|30,120|industry|通过可预约的公开参观路线了解乳品生产和质量控制，工厂开放区与购物区分开；须提前核实团散接待方式。|Yili dairy Hohhot|all|45|1
morin-khuur|听马头琴与蒙古族长调|Morin Khuur and Long-song Performance|40.8020,111.6500|90|80,250|performance|选择有公开节目单的剧场或文化场所，听马头琴与长调的声音关系；餐秀套餐不等于纯音乐会。|Morin khuur performance Inner Mongolia|all|0|1
naadam|那达慕的竞技与民俗|Naadam Games near Hohhot|40.9230,111.8690|240|0,300|festival|那达慕有搏克、射箭、赛马等传统项目，实际举办地和日期逐年不同；确认活动与接驳后再加入行程。|Naadam Inner Mongolia|6,7,8,9|45|1
milk-tea|蒙古奶茶与奶食体验|Mongolian Milk Tea and Dairy Tasting|40.8000,111.6500|90|35,100|food-craft|在正规的蒙餐馆品尝咸奶茶、奶皮子和奶酪，询问炒米与奶食吃法；动手制作需另行预约。|Mongolian milk tea dairy|all|0|0''')
foods(hohhot,'''shaomai|青城烧麦|Hohhot Shaomai|薄皮羊肉烧麦配浓茶，是青城有代表性的早饭；按一两面粉计量的店家要先问个数。|麦香村、老绥元与大召周边烧麦馆|25,60|Hohhot shaomai
milk-tea|咸奶茶|Mongolian Salted Milk Tea|砖茶与牛奶煮出的咸奶茶常配炒米和奶食，按一壶或一碗的菜单单位比较。|塞上老街蒙餐馆|10,35|Suutei tsai
hand-lamb|手把肉|Boiled Lamb on the Bone|清煮羊肉带骨上桌，蘸料可选，适合多人分享；按重量点菜并先确认是生重还是熟重。|额尔敦及市区蒙餐馆|70,160|Mongolian boiled lamb
cheese|奶皮子|Urume Milk Skin|浓缩乳脂形成的奶皮子奶香足，可与奶茶、小米或糕点搭配，少量尝试即可。|宽巷子奶食铺|15,45|Mongolian urum
oat|莜面|Inner Mongolian Oat Noodles|莜面可卷、搓或拌，常搭配土豆、蘑菇和肉卤，适合作为一份扎实主食。|市区莜面馆|20,45|Youmian noodles''')
hotels(hohhot,'''shangrila|呼和浩特香格里拉|Shangri-La Huhhot|40.8130,111.6690|550,1500|青城公园附近的高端城市酒店，适合结合老城和商业区，早餐及行政礼遇按房型选择。|https://www.shangri-la.com/huhhot/shangrila/
sheraton|呼和浩特喜来登酒店|Sheraton Hohhot Hotel|40.8300,111.6660|400,1100|靠近火车站与市中心，适合乘铁路往返；不同朝向与楼层房型单独比较。|https://www.marriott.com/en-us/hotels/hetsi-sheraton-hohhot-hotel/overview/
express-east|呼和浩特东站智选假日酒店|Holiday Inn Express Hohhot East Station|40.8550,111.7620|250,650|方便东站片区出行的连锁选择，适合早班高铁；到大召老城需另外预留地铁或车程。|https://www.ihg.com/holidayinnexpress/hotels/us/en/hohhot/hethh/hoteldetail
wanda|呼和浩特富力万达文华酒店|Wanda Vista Hohhot|40.8360,111.7350|450,1200|东部商业片区综合酒店，适合家庭与城市休闲，注意博物院已经迁新馆，不能依据旧馆距离选房。|https://www.wandahotels.com/index.php?a=hotel_profile&c=index&catid=65&id=48&m=wap&siteid=2
xincheng|内蒙古新城宾馆|Inner Mongolia Xincheng Hotel|40.8220,111.6830|300,800|老牌园林式城市饭店，适合喜欢传统接待空间的旅客；确认实际楼栋、房间设施和停车。|https://www.trip.com/hotels/list?keyword=Inner%20Mongolia%20Xincheng%20Hotel''')

hailar=base('hailar','呼伦贝尔·海拉尔','Hailar','内蒙古',49.2122,119.7414,'HLD',4,
    '以海拉尔为住宿基地，先读草原民族的历史，再把一天交给河曲、牧场与蒙古奶茶；辽阔不等于每处都顺路。',
    '海拉尔机场与海拉尔站是门户，铁路以普速为主，不假设有高铁。城区可出租车与公交结合；莫尔格勒河、呼和诺尔和锡尼河方向需包车或核实班车，额尔古纳与满洲里宜单列目的地。',
    ['https://www.hlbe.gov.cn/OpennessContent/show/436851.html','https://www.hlbe.gov.cn/OpennessGazette/show/8450.html','https://en.wikivoyage.org/wiki/Hailar'],lodging=(180,450,1000),rent=(1400,2800,5000))
hailar['aliases'] += ['海拉尔','呼伦贝尔海拉尔','Hulunbuir Hailar']
places(hailar,'''west-forest|海拉尔国家森林公园|Hailar National Forest Park|49.2000,119.7040|150|20,60|森林自然|城区西侧的樟子松林适合轻徒步，沿开放步道认识沙地森林，冬季留意积雪和防火规定。|Hailar National Forest Park|0
history-museum|呼伦贝尔历史博物馆|Hulunbuir History Museum|49.1550,119.7520|150|0,0|历史博物馆|通过考古、民族服饰与地方史展陈认识呼伦贝尔，先核实开放日和馆址，勿与老馆混淆。|Hulunbuir museum|0
ethnic-museum|呼伦贝尔民族博物馆与盟署街区|Hulunbuir Ethnic Museum and Old Government Quarter|49.2180,119.7540|90|0,30|民族文化|历史建筑与街区提供城市形成的线索，展览是否开放以公告为准，闭馆时可改为外观建筑路线。|Hulunbuir ethnic museum|0
anti-fascist|世界反法西斯战争海拉尔纪念园|Hailar Anti-Fascist War Memorial|49.2460,119.7290|150|40,80|革命教育|在纪念馆与日军工事遗址了解侵略与抵抗历史，地下参观按安全与开放安排进行。|Hailar fortress memorial|20
genghis|成吉思汗广场|Genghis Khan Square Hailar|49.2150,119.7650|60|0,0|城市公共空间|广场雕塑与城市绿地适合了解地方公共文化，傍晚可与伊敏河步道搭配。|Genghis Khan Square Hailar|0
old-city|呼伦贝尔古城|Hulunbuir Old Town|49.2120,119.7320|90|0,0|城市街区|传统风格街区融合商业与休闲，适合夜间找小吃和手作；当前街景有重建与现代商业部分。|Hulunbuir old town|0
yimin|伊敏河滨河步道|Yimin River Promenade|49.2080,119.7450|75|0,0|河岸公园|沿河看桥梁与城市天际线，选住处附近的一段慢走即可；冬季不擅自踏入河面。|Yimin River Hailar|0
darjilin|达尔吉林寺|Darjilin Monastery Hailar|49.2550,119.7700|75|0,40|藏传佛教寺庙|山坡寺院与敖包景观可俯看海拉尔，保持宗教场所安静，拍摄与殿内开放先问管理方。|Darjilin Hailar|25
evenki|鄂温克博物馆|Evenki Museum Bayantuohai|49.1460,119.7510|120|0,0|民族文化|在巴彦托海镇认识鄂温克族历史、生产与服饰文化，勿把这里误作根河驯鹿营地。|Evenki museum Bayantuohai|25
bayan-hushuo|巴彦呼硕敖包山|Bayan Hushuo Oboo Hill|48.9970,119.7380|150|20,80|草原文化|在敖包与草原环境中了解祭祀文化，绕行和参与活动遵循当地引导；不要攀踏敖包。|Bayan Hushuo|55
mozhigle|莫尔格勒河景区|Morigele River Scenic Area|49.5370,119.6520|240|30,200|河曲草原|从正式观景点看蜿蜒河道，景区接驳和门票产品分开查；不穿越牧场围栏或碾压草地。|Morigele River|70
huhe-nuoer|呼和诺尔湖旅游区|Huhenuoer Lake|49.3020,119.2550|180|30,150|湖泊草原|湖水与草原相连，适合野餐与观景，骑马、游船和住宿是独立收费项目。|Huhenuoer Lake|60
chenbarhu|陈巴尔虎旗民族博物馆|Chen Barag Banner Ethnic Museum|49.3280,119.4220|90|0,0|民族文化|在巴彦库仁了解巴尔虎历史与民俗，与草原观景形成知识上的补充，开放安排先查询。|Chen Barag museum|60
hake|哈克遗址博物馆|Hake Archaeological Site Museum|49.2470,120.0840|90|0,0|考古遗址|通过哈克遗址的考古发现理解当地早期生活方式，郊外馆舍需先确认接待再出发。|Hake archaeological site|60
hake-cliff|哈克断崖观景|Hake River Cliffs|49.2790,120.1450|90|0,0|地质河景|从允许停留的安全观景位置看河流和陡岸，不靠近无护栏边缘；雨雪与风大时取消。|Hake Hulunbuir river|70''')
experiences(hailar,'''grassland-horse|正规牧场初学骑马|Beginner Horse Riding near Hailar|49.3000,119.4200|90|100,300|outdoor|选择提供头盔、领骑和明确路线的正规营地，初学者先上基础课，不追求疾驰；按实际骑乘分钟数核价。|Inner Mongolia horse riding|5,6,7,8,9|60|1
milk-food|蒙古奶茶与奶食早午餐|Mongolian Dairy Brunch in Hailar|49.2150,119.7440|90|35,100|food-life|在海拉尔蒙餐馆点奶茶、炒米、奶皮子和小份肉食，先问奶茶咸淡与套餐份量。|Mongolian milk tea|all|0|0
buryat-buns|锡尼河布里亚特包子制作|Buryat Buuz Making in Xinihe|48.8610,120.0350|150|100,250|food-craft|在确认接待的文化体验点学习捏制布里亚特包子，先约具体家庭或营地，尊重住家空间。|Buryat buuz|5,6,7,8,9,10|100|1
archery|布里亚特传统射箭体验|Buryat Archery Introduction|48.8610,120.0350|90|80,200|sport-culture|在有教练和隔离射区的体验点了解布龙射箭，按规则轮流练习；不能自行在草原公共空间放箭。|Buryat archery|5,6,7,8,9,10|100|1
horse-music|马头琴与长调小型演出|Morin Khuur and Long-song Evening|49.2110,119.7340|90|80,250|performance|选择有实际场次的文化场馆或营地，了解曲目与乐器故事，餐饮与节目是否打包需另问。|Morin khuur Mongolia|all|0|1
naadam|呼伦贝尔那达慕|Hulunbuir Naadam Gathering|49.3000,119.4200|240|0,300|festival|按当年公告去看搏克、射箭或赛马，赛事日期与场地不固定，别将旅游表演当作正式节庆赛事。|Hulunbuir Naadam|6,7,8,9|60|1
wetland-birds|草原河谷观鸟|Grassland River-valley Birdwatching|49.4800,119.6700|180|0,350|wildlife|沿合法道路与观鸟点观察草原和湿地鸟类，向导可帮助辨认但不能保证物种；使用望远镜、不播放诱鸟声。|Hulunbuir birds|4,5,6,7,8,9,10|70|0
winter-culture|冰雪那达慕与冬季民俗|Winter Naadam and Snow Culture|49.2000,119.7450|180|50,250|winter-culture|冬季活动可能结合雪地竞技与民族表演，按官方旅游季日程确认场地；保暖、装备租赁与接驳另计。|Hulunbuir winter Naadam|12,1,2|0|1
night-sky|草原营地观星|Grassland Stargazing near Hailar|49.2800,119.3200|120|50,200|nature|预约合法营地后在低光环境看星空，月相和云量决定效果；不擅闯牧场、不将夜间返程留给无照明步行。|Hulunbuir grassland night|6,7,8,9|65|1
dance|了解达斡尔与布里亚特歌舞|Daur and Buryat Song and Dance Encounter|49.0700,119.7080|120|60,200|culture|向民族文化创业园或官方推荐的接待点确认民俗展示，了解服饰与集体舞背景；参与需得到主人同意。|Buryat dance festival|all|45|1''')
foods(hailar,'''hand-lamb|呼伦贝尔手把肉|Hulunbuir Boiled Lamb|带骨羊肉清煮后蘸料食用，风味来自原料与火候；按斤点菜时确认熟重、配菜与总价。|海拉尔蒙餐馆|70,170|Mongolian boiled lamb
buuz|布里亚特包子|Buryat Buuz|开口或褶口大包子里包牛羊肉馅，汤汁较足，刚蒸好时先小口咬开。|海拉尔布里亚特包子馆|25,60|Buryat buuz
milk-pot|蒙古锅茶|Mongolian Pot Tea|奶茶加入炒米、奶食或肉干，既是热饮也是分享式食物，按一锅的人数折算预算。|诺敏塔拉奶茶馆及市区蒙餐馆|25,70|Mongolian pot tea
leba|俄式列巴|Russian-style Rye Bread|酸香扎实的面包可配黄油、奶酪或果酱，不同店用料和大小差别明显。|海拉尔俄式面包店|15,45|Russian rye bread
roast-lamb|烤羊排|Roasted Lamb Ribs|表面烤香、内部保留肉汁，通常按份或按重量点；两人用餐不必点整羊。|海拉尔市区烤羊排餐馆|80,200|Mongolian roasted lamb ribs''')
hotels(hailar,'''tianjiao|呼伦贝尔天骄宾馆|Tianjiao Hotel Hulunbuir|49.2210,119.7630|350,1200|海拉尔的园林式老牌宾馆，适合出发草原前后休息；楼栋、旺季价格与早餐逐项确认。|https://hotels.ctrip.com/hotels/741779.html
hampton|呼伦贝尔海拉尔大街希尔顿欢朋酒店|Hampton by Hilton Hulunbuir Hailar Street|49.1960,119.7520|350,1100|海拉尔大街与满洲里路附近的连锁酒店，适合市区用餐与出发接车，暑期房价波动较大。|https://www.hilton.com/zh-hans/hotels/hlddohx-hampton-hulunbuir-hailar-street/
garden|呼伦贝尔海拉尔希尔顿花园酒店|Hilton Garden Inn Hulunbuir Hailar|49.2080,119.7350|300,1000|市区品牌住宿选择，适合把多日草原旅行前后设为同一基地；接送是否收费须确认。|https://www.booking.com/airport/cn/hld.html
hulunbeier|呼伦贝尔宾馆|Hulunbeier Hotel|49.2160,119.7530|300,1200|老牌城市宾馆，适合关注地方接待风格的旅客；预订时看实际房间照片与近期设施说明。|https://www.trip.com/hotels/list?keyword=Hulunbeier%20Hotel
hanting-central|汉庭优佳呼伦贝尔海拉尔中央路酒店|Hanting Youjia Hailar Central Road|49.2150,119.7370|180,650|中央路片区的经济连锁选择，方便找餐馆和城市散步；旺季连锁酒店也需提前按日期核价。|https://www.hotelhulunbuir.cn/''')

shenyang=base('shenyang','沈阳','Shenyang','辽宁',41.8031,123.4315,'SHE',4,
    '从盛京宫阙到工厂旧址，再到鸡架、早市和二人转，沈阳适合把厚重历史与热闹日常交替安排。',
    '沈阳、沈阳北和沈阳南站接入高铁网，桃仙机场可用地铁或机场交通。皇城片区步行方便，辽宁省博物馆与福陵较远，应单独按方向安排。',
    ['https://wlgd.shenyang.gov.cn/rhjsdwlzds/202607/t20260723_5061456.html','https://wlgd.shenyang.gov.cn/xxfb/tpxw/202207/t20220718_3444966.html','https://en.wikivoyage.org/wiki/Shenyang'])
places(shenyang,'''palace|沈阳故宫|Mukden Palace|41.7969,123.4499|180|40,60|皇家宫殿|大政殿与十王亭等空间展示清初宫廷制度，按中东西路选线慢看，预约时段与特展另查。|Mukden Palace|0
marshal|张学良旧居陈列馆|Former Residence of Zhang Xueliang|41.7920,123.4520|150|40,80|近代历史|大青楼、小青楼与院落串起东北近代历史，主馆与金融博物馆票种是否联动须核对。|Zhang Xueliang former residence Shenyang|0
zhaoling|清昭陵|Zhaoling Tomb Shenyang|41.8575,123.4170|150|20,60|皇家陵寝|北陵公园绿地与陵寝核心区是不同范围，沿神道理解清代陵制，深度参观需预留步行距离。|Zhaoling Shenyang|0
fuling|清福陵|Fuling Tomb Shenyang|41.8350,123.5910|150|30,70|皇家陵寝|东陵山林与阶梯轴线相连，适合历史与自然结合；市中心往返不能省略。|Fuling Tomb Shenyang|45
918|九一八历史博物馆|September 18 History Museum|41.8320,123.4630|150|0,0|革命教育|在史料与遗物中认识九一八事变及抗战历史，保持庄重；团体与散客预约规则分别查询。|September 18 History Museum|0
liaoning-museum|辽宁省博物馆|Liaoning Provincial Museum|41.6780,123.4600|210|0,0|综合博物馆|书画、考古与工艺展览内容丰富，选两三条主题即可；特展轮换不保证每次都能看同一件文物。|Liaoning Provincial Museum|35
shenyang-museum|沈阳博物馆|Shenyang Museum|41.8050,123.4330|120|0,0|城市博物馆|从城市考古与历史展览建立时间线，适合与市府广场和中街分时段衔接。|Shenyang Museum|0
industrial|中国工业博物馆|China Industrial Museum|41.8050,123.3500|150|0,0|工业遗产|铸造车间、机器与工业展品让重工业史可触可见，室内外路线按开放情况安排。|China Industrial Museum Shenyang|0
xinle|新乐遗址博物馆|Xinle Archaeological Site Museum|41.8470,123.4100|90|0,30|史前考古|看新石器时代遗存与复原展示，理解沈阳历史远不止清代，和北陵同方向组合。|Xinle culture museum|0
zhongjie|沈阳中街|Zhongjie Shenyang|41.8010,123.4510|90|0,0|商业街区|百年商业街与新消费混合，选支巷尝小吃或看旧招牌，不必把购物当成强制行程。|Zhongjie Shenyang|0
laobeishi|老北市|Laobeishi Shenyang|41.8130,123.4200|90|0,0|民俗街区|历史商业片区与夜间文旅活动交织，具体巡游或表演要查当天节目，普通街区散步无需等演出。|Laobeishi Shenyang|0
xita|西塔朝鲜族街区|Xita Korean Quarter|41.8040,123.3980|90|0,0|文化饮食街区|冷面、烤肉、米糕和双语招牌构成街区特色，以用餐和观察日常为主，尊重居民与店铺。|Xita Shenyang|0
zhongshan|中山广场历史建筑|Zhongshan Square Shenyang|41.7940,123.4080|60|0,0|近代建筑|沿广场外围看近代建筑立面，注意交通；内部有办公与经营用途，不默认可进入。|Zhongshan Square Shenyang|0
hongmei|红梅文创园|Hongmei Cultural Creative Park|41.8100,123.3660|120|0,0|工业文创|旧工业建筑中有艺术、咖啡和文创店，按当期展览选停留点，消费与特展门票另计。|Hongmei creative park Shenyang|0
1905|1905文化创意园|1905 Creative Culture Park|41.8040,123.3650|90|0,0|工业文创|老厂房中的小店与活动适合雨天缓冲，先确认展馆和演出是否营业。|1905 creative park Shenyang|0
catholic|沈阳南关天主教堂外观|Sacred Heart Cathedral Shenyang|41.7840,123.4500|45|0,0|宗教建筑|哥特式立面与周边街巷形成对照，教堂内参观要尊重礼拜、婚礼和管理要求。|Sacred Heart Cathedral Shenyang|0
beita|北塔护国法轮寺|Huguo Falun Temple|41.8390,123.4370|60|0,30|藏传寺庙|从白塔与寺院看清初盛京的城市护国格局，殿内安静参观，拍摄遵循现场规则。|Huguo Falun Temple|0
hunhe|浑河生态走廊|Hun River Greenway|41.7440,123.4450|90|0,0|河岸自然|沿河步道骑行或散步，看城市天际线，选短段即可，租车费用单独核算。|Hun River Shenyang|0
botanical|沈阳植物园与世博园|Shenyang Botanical Garden|41.8580,123.6470|240|30,80|植物园|季节花卉与园区景观适合家庭半日游，园区面积大，园内车和餐饮另计。|Shenyang Botanical Garden|60
manchuria-office|中共满洲省委旧址|Former CPC Manchuria Provincial Committee Site|41.8160,123.4140|75|0,0|革命教育|通过旧址与史料认识东北早期革命活动，先核实开放时段与团体预约要求。|CPC Manchuria committee Shenyang|0''')
experiences(shenyang,'''errenzhuan|刘老根大舞台看二人转|Errenzhuan at Liu Laogen Grand Stage|41.7980,123.4470|120|120,350|performance|在中街剧场听东北曲艺与喜剧表演，按当日演员和节目购票，不承诺明星固定登台。|Liu Laogen Grand Stage|all|0|1
morning-market|小河沿早市早餐|Xiaoheyan Morning Market Breakfast|41.7850,123.4700|90|20,60|food-life|早点摊、蔬菜和熟食呈现真实城市晨间节奏，分小份尝试，拥挤时保管物品并给居民买菜让路。|Shenyang morning market|all|0|0
chicken-rack|鸡架与汽水的夜宵|Shenyang Chicken Rack Supper|41.8010,123.4510|90|25,70|food-life|点一份拌、熏或烤鸡架配本地汽水，尝不同做法即可；这是夜宵选择，应替换原有晚餐预算。|Shenyang chicken rack|all|0|0
qipao|盛京旗袍与服饰文化|Shengjing Qipao Culture Experience|41.7980,123.4490|120|100,350|craft-culture|在正规服饰店了解旗袍剪裁与纹样，可自选租衣拍摄，先确认服装、妆造、摄影与押金分别多少钱。|Shenyang qipao|all|0|1
ice-snow|棋盘山冬季冰雪|Qipanshan Winter Snow Activities|41.9260,123.6600|240|100,350|winter-outdoor|冬季按实际雪场开放和课程选择初学滑雪或雪地活动，雪具、头盔、教练和接驳是否包含需核实。|Qipanshan skiing|12,1,2|70|1''')
foods(shenyang,'''dumpling|老边饺子|Laobian Dumplings|以熟馅与多种蒸煮做法闻名，按一盘或一笼实际个数比较，搭配蔬菜即可成为正餐。|老边饺子馆中街店|30,70|Laobian dumplings
chicken|沈阳鸡架|Shenyang Chicken Rack|鸡架有拌、熏、炸和烤等做法，吃的是骨边肉与调味，留意小骨，适合小份分享。|中街与老北市鸡架店|12,35|Shenyang chicken rack
cold-noodle|西塔冷面|Xita Cold Noodles|朝鲜族冷面常带酸甜冷汤和蔬菜配料，冬夏都有人吃，不吃牛肉需先问汤底。|西塔大冷面及西塔街区|20,45|Naengmyeon
pork|辽宁锅包肉|Liaoning Guobaorou|炸肉片裹酸甜汁，部分辽宁做法带番茄风味，口味因店而异；按一盘两人共享。|宝发园及市区东北菜馆|35,70|Guobaorou
sauerkraut|酸菜白肉血肠|Sauerkraut Pork and Blood Sausage|酸菜与白肉炖汤，血肠通常另切上桌，点单前说明是否接受动物血制品。|市区白肉血肠馆|40,90|Suan cai pork blood sausage''')
hotels(shenyang,'''conrad|沈阳康莱德酒店|Conrad Shenyang|41.8050,123.4350|900,2200|恒隆广场高层的城市景观酒店，适合希望留时间享受酒店的旅客；景观、早餐与加床分开比较。|https://www.hilton.com/en-gb/hotels/sheyaci-conrad-shenyang/
shangrila|沈阳香格里拉|Shangri-La Shenyang|41.7810,123.4380|650,1700|青年大街沿线高端酒店，适合城市游与餐饮，去浑南博物馆仍需安排车程。|https://www.shangri-la.com/shenyang/shangrila/
jen|沈阳JEN酒店|JEN Shenyang by Shangri-La|41.7940,123.4010|280,750|太原街商圈、靠近沈阳站，适合乘铁路和重视步行餐饮的旅客；房型与早餐单独核对。|https://www.shangri-la.com/shenyang/jen/
express-north|沈阳北站智选假日酒店|Holiday Inn Express Shenyang North Station|41.8240,123.4400|220,600|北站一路41号的连锁住宿，适合早晚高铁到达；靠近沈阳北站南出站口，早餐按房价条款核对。|https://www.ihg.com.cn/holidayinnexpress/hotels/cn/zh/shenyang/sheex/hoteldetail
mukden|沈阳中山皇冠假日酒店|Crowne Plaza Shenyang Zhongshan|41.7940,123.4070|350,950|中山广场附近的城市酒店，适合连接历史建筑与商业街区；订前确认营业与房型安排。|https://tapc.ctrip.com/Hotel_Review-g297454-d306445-Reviews-Crowne_Plaza_Shenyang_Zhongshan-Shenyang_Liaoning.html''')

dalian=base('dalian','大连','Dalian','辽宁',38.9140,121.6147,'DLC',4,
    '老电车穿过近代街区，礁石与海湾连接山海步道；把海鲜市场和一个海边午后放进路线，比追逐景点更像度假。',
    '大连站和大连北站连接哈大高铁，周水子机场可搭地铁。市内轨道交通结合步行，旅顺与金石滩各在不同方向，建议分别安排一日，不跨城来回折返。',
    ['https://www.sport.gov.cn/n14471/n14503/n14535/c29133766/content.html','https://www.mct.gov.cn/whzx/qgwhxxlb/ln/202503/t20250326_959022.htm','https://en.wikivoyage.org/wiki/Dalian'],lodging=(180,450,1300),rent=(1800,3500,6500))
places(dalian,'''xinghai|星海广场|Xinghai Square|38.8790,121.5870|90|0,0|海滨广场|开阔广场连接海岸步道，适合傍晚看星海湾，不必为了一个机位追逐投喂海鸥。|Xinghai Square|0
bangchuidao|棒棰岛景区|Bangchuidao Scenic Area|38.8830,121.6890|180|20,50|海滨自然|海湾、卵石滩与绿地适合安静停留，岛体并非随意登岛项目；按景区开放范围游览。|Bangchuidao|25
binhai|滨海路步道|Dalian Binhai Road|38.8580,121.6220|150|0,0|海岸徒步|选择傅家庄至北大桥等开放短段徒步，山海起伏需要体力，不把整条滨海路都安排为步行。|Dalian Binhai Road|0
fisherman|老虎滩渔人码头|Tiger Beach Fisherman's Wharf|38.8720,121.6760|90|0,0|渔港街区|渔船、海港和咖啡小店提供慢节奏，不进入作业码头阻碍卸货；天气好时沿岸稍作停留。|Dalian Fishermans Wharf|0
zhongshan|中山广场|Zhongshan Square Dalian|38.9230,121.6410|60|0,0|近代建筑|围绕广场看不同年代建筑立面，办公楼多不能自由入内，注意环岛过街安全。|Zhongshan Square Dalian|0
russian|俄罗斯风情街|Russian Street Dalian|38.9300,121.6400|60|0,0|近代街区|历史建筑与现代旅游商业并置，可作为认识港口城市形成的短路线，不必强制购物。|Russian street Dalian|0
donggang|东港商务区海岸|Donggang Waterfront Dalian|38.9200,121.6900|120|0,0|海滨休闲|沿港湾步道看城市与海面，音乐喷泉需按当日公告，不将喷泉表演视作每天必有。|Dalian Donggang|0
venice|东方水城|Dalian Venice Water City|38.9150,121.6990|90|0,0|水岸街区|运河式现代街区适合傍晚散步与餐饮，乘船和店内项目另计，这是当代主题街区。|Dalian Venice water city|0
heishijiao|黑石礁海滨公园|Heishijiao Seashore Park|38.8650,121.5560|90|0,0|海岸地质|黑色礁石与海蚀景观适合观察潮汐，湿滑礁面不要冒险攀爬，避开涨潮封闭区域。|Heishijiao|0
natural-museum|大连自然博物馆|Dalian Natural History Museum|38.8660,121.5590|150|0,0|自然科普|海洋生物与地质标本是重点，可与黑石礁合并半日，馆方预约与闭馆日另查。|Dalian Natural History Museum|0
modern-museum|大连现代博物馆|Dalian Modern Museum|38.8840,121.5850|120|0,0|城市博物馆|从城市规划、港口与近现代生活看大连变迁，适合海边行程中的室内休息段。|Dalian Modern Museum|0
lianhua|莲花山观景台|Lianhua Mountain Observatory Dalian|38.8750,121.6090|120|30,100|山地观景|从山上看星海湾与城市山海关系，登山、景区车和观景设施分别核价。|Lianhuashan Dalian|0
fujiazhuang|傅家庄海滨公园|Fujiazhuang Beach Park|38.8640,121.6230|120|0,0|海滨公园|海湾开阔，适合午后看海或沙滩休息，游泳依当日水域开放与救生安排。|Fujiazhuang beach|0
jinshitan|金石滩滨海国家地质公园|Jinshitan Coastal National Geopark|39.0930,122.0360|240|50,120|海岸地质|海蚀岩体的纹理与形态适合慢看，景区公交与步行结合，离市中心较远。|Jinshitan geopark|75
discovery|发现王国主题公园|Dalian Discovery Kingdom|39.1000,121.9930|360|180,300|主题乐园|适合把一整天留给游乐设施，身高限制、开放设备与夜场另查，勿再塞大量市区景点。|Dalian Discovery Kingdom|75
lushun-museum|旅顺博物馆|Lushun Museum|38.8160,121.2420|150|0,0|历史博物馆|展览和馆舍共同呈现旅顺的历史层次，按当期开放馆区预约，与太阳沟片区顺路。|Lushun Museum|60
taiyanggou|旅顺太阳沟历史街区|Taiyanggou Historic Quarter|38.8130,121.2410|120|0,0|近代街区|林荫路与近代建筑适合按街区走读，许多建筑仍在使用，以公共道路和外观为主。|Taiyanggou Lushun|60
baiyu|白玉山景区|Baiyu Mountain Lushun|38.8150,121.2530|90|30,80|港口观景|在山上看旅顺港地形与历史空间，索道和门票分开核价，天气差时视野有限。|Baiyu Mountain|60
prison|旅顺日俄监狱旧址博物馆|Lushun Russo-Japanese Prison Museum|38.8240,121.2590|120|0,0|历史教育|旧址揭示殖民统治与侵略历史，部分内容沉重，带儿童时按理解能力选择讲解。|Lushun prison museum|60
dongguan|东关街历史文化街区|Dongguan Street Dalian|38.9170,121.6240|90|0,0|历史街区|街巷更新中保留近代城市肌理，按实际开放区域看建筑、展览与小店，避开施工围挡。|Dongguan Street Dalian|0''')
experiences(dalian,'''tram|201路老电车体验|Dalian Route 201 Heritage Tram Ride|38.9220,121.6450|60|2,10|transport-culture|坐一段正常运营电车观察车厢与街景，老式车型不是每班保证；作为市内交通体验，勿与接驳费用重复。|Dalian tram 201|all|0|0
seafood-market|桃源市场海鲜寻味|Taoyuan Market Seafood Tasting|38.8920,121.6500|120|60,200|food-life|先看海鲜时价，再选小份熟食与焖子，要求称重和加工费明示；不把购买整箱海鲜列为默认消费。|Dalian seafood market|all|0|0
sailing|星海湾或东港帆船体验|Sailing on Dalian Bay|38.9190,121.6910|90|180,450|water-sport|选合法运营商和含救生衣的基础帆船体验，实际出海港口、海况和航时以当天确认为准，风浪大可取消。|Dalian sailing|5,6,7,8,9,10|0|1
beach-afternoon|把午后留给海边|A Slow Afternoon at Dalian Beach|38.8640,121.6230|180|0,100|coastal-life|在傅家庄或住处附近的开放沙滩停留，读书、看海、喝一杯饮品即可，租伞躺椅按需付费。|Dalian beach afternoon|5,6,7,8,9|0|0
cherry|旅顺春季樱花|Lushun Cherry Blossom Season|38.8420,121.2700|150|20,80|seasonal-nature|花期随气温变化，确认当年樱花园开放与花况再出发；不以固定日期承诺满开。|Lushun cherry blossom|4,5|65|1''')
foods(dalian,'''menzi|大连焖子|Dalian Menzi|淀粉块煎出焦壳，配芝麻酱、蒜水与调味汁，海鲜版本通常更贵。|天津街、桃源市场焖子铺|10,30|Dalian menzi
mackerel|鲅鱼水饺|Spanish Mackerel Dumplings|细腻鱼肉馅带海鲜鲜味，按盘或按两售卖，先问份量避免点太多。|日丰园与大连饺子馆|35,75|Mackerel dumplings
seaweed|海菜包子|Seaweed Steamed Buns|海菜与肉馅搭配，春季鲜海菜风味突出；咸鲜口适合作早餐或轻午餐。|黑石礁与天津街包子铺|10,25|Seaweed baozi
seafood-noodle|海鲜焖面|Dalian Seafood Noodles|海鲜与面条同煮或焖制，汤汁和用料因店而异，单人可选择一碗海鲜面替代整桌海鲜。|桃源市场周边面馆|25,65|Chinese seafood noodles
scallops|蒜蓉蒸扇贝|Garlic Steamed Scallops|蒜蓉、粉丝与贝肉搭配，按只售卖时比较大小和实际数量，尽量现蒸。|市区明码标价海鲜馆|20,70|Garlic steamed scallops''')
hotels(dalian,'''castle|大连一方城堡豪华精选酒店|The Castle Hotel A Luxury Collection Hotel Dalian|38.8750,121.5880|900,2400|星海湾山坡上的城堡式酒店，适合海景度假；坡地出入与海滩步行距离需实际衡量。|https://www.marriott.com/en-us/hotels/dlclc-the-castle-hotel-a-luxury-collection-hotel-dalian/overview/
shangrila|大连香格里拉|Shangri-La Dalian|38.9240,121.6560|500,1500|人民路商务片区的城市酒店，适合中山广场与东港线路，海景不是所有房型都有。|https://www.shangri-la.com/dalian/shangrila/
kempinski|大连凯宾斯基饭店|Kempinski Hotel Dalian|38.9130,121.6400|500,1400|劳动公园与市中心商业区附近，适合以餐饮、街区和公共交通为主的旅程。|https://www.kempinski.com/en/hotel-dalian
express|大连海尊智选假日酒店|Holiday Inn Express Dalian City Centre|38.9250,121.6400|250,700|中山广场周边的经济品牌选择，可步行探访老建筑，早餐和取消条款按所选日期确认。|https://www.ihg.com.cn/holidayinnexpress/hotels/cn/zh/dalian/dlccc/hoteldetail
aloft|大连雅乐轩酒店|Aloft Dalian|38.9220,121.6450|300,850|靠近中山广场的现代连锁酒店，适合年轻旅客和城市漫游，交通便利但非海滨度假村。|https://www.marriott.com/en-us/hotels/dlcal-aloft-dalian/overview/''')

changchun=base('changchun','长春','Changchun','吉林',43.8171,125.3235,'CGQ',4,
    '电影、汽车和有轨电车构成城市记忆；从博物馆走向森林湖畔，再用一顿东北家常饭收尾。',
    '长春站、长春西站连接高铁，龙嘉机场可通过机场站城际铁路转入市区。轨道交通覆盖主要片区；净月潭、博物院和市中心之间需预留实际乘车时间。',
    ['https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/gdxl/zcs/zcs_424332/202507/t20250704_9272968.html','https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/gdxl/zcs/zcs_424332/202507/t20250703_9272013.html','https://en.wikivoyage.org/wiki/Changchun'])
places(changchun,'''puppet-palace|伪满皇宫博物院|Museum of the Imperial Palace of Manchukuo|43.9055,125.3547|180|60,90|近代历史|通过宫廷旧址与历史陈列认识日本侵略及傀儡政权，避免只把它当作宫殿摄影地。|Museum Imperial Palace Manchukuo|0
occupation-museum|东北沦陷史陈列馆|Northeast China Occupation History Museum|43.9030,125.3540|120|0,0|历史教育|以史料理解东北沦陷与反抗历史，参观内容较沉重，可与皇宫分段安排。|Northeast occupied history museum Changchun|0
film|长影旧址博物馆|Changchun Film Studio Museum|43.8670,125.2970|150|70,110|电影文化|从摄影、录音与电影故事认识长影历史，互动项目与沉浸式演出票种另行确认。|Changchun Film Studio|0
jingyuetan|净月潭国家森林公园|Jingyuetan National Forest Park|43.7910,125.4490|240|25,60|森林湖泊|选择湖边步行、森林路或观光车，不必环完整个湖；冬季活动和索道等项目另计。|Jingyuetan National Forest Park|35
sculpture|长春世界雕塑园|Changchun World Sculpture Park|43.8260,125.3200|180|0,60|公共艺术|户外雕塑与室内馆舍适合按兴趣组合，园区票与馆票范围可能不同，留出走路休息时间。|Changchun World Sculpture Park|0
jilin-museum|吉林省博物院|Jilin Provincial Museum|43.7640,125.4150|150|0,0|综合博物馆|以吉林考古、历史和艺术展陈为重点，预约与特展单独查，与省科技馆位置相近。|Jilin Provincial Museum|35
science|吉林省科学技术馆|Jilin Science and Technology Museum|43.7630,125.4190|180|0,50|科学互动|基础科学与互动展项适合亲子，影院、课程及特展不一定包含在免费基本参观中。|Jilin Science Technology Museum|35
optics|中国光学科学技术馆|China Optical Science and Technology Museum|43.7630,125.4210|120|0,30|光学科普|通过光学现象与技术展示认识长春的科研特色，参与实验和课程需确认预约条件。|China Optical Science Technology Museum|35
nanhu|南湖公园|South Lake Park Changchun|43.8570,125.3140|120|0,0|城市公园|湖岸、树林与市民活动适合放松，夏日和雪景都各有味道，游船与冰上项目另查开放。|South Lake Park Changchun|0
nanxi|南溪湿地公园|Nanxi Wetland Park Changchun|43.8050,125.3650|150|0,0|湿地自然|沿栈道看芦苇与水系，适合把一整个下午放慢，不进入湿地保护或施工区域。|Nanxi Wetland Changchun|0
zheyou-shan|这有山|The Hill Mall Changchun|43.8610,125.2910|120|0,0|特色商业|室内山城式空间与小店、餐饮相结合，适合雨雪天，消费按个人选择而非门票。|The Hill Changchun|0
xinmin|新民大街历史建筑|Xinmin Street Historic Buildings|43.8670,125.3160|90|0,0|近代建筑|从公共道路观察近代行政建筑与街道规划，许多建筑仍为院校或医疗用途，不能随意入内。|Xinmin Street Changchun|0
banruo|般若寺|Banruo Temple Changchun|43.8920,125.3300|60|0,30|佛教寺院|市中心寺院保留安静的礼佛空间，宗教活动与旅游参观错峰，殿内拍摄先看提示。|Banruo Temple Changchun|0
wanshou|万寿寺|Wanshou Temple Changchun|43.9680,125.3240|90|0,40|佛教寺院|城北寺院与湿地环境相邻，可作为慢游选项，寺内接待与院落开放事先确认。|Wanshou Temple Changchun|30
beihu|北湖国家湿地公园|North Lake Wetland Park Changchun|43.9800,125.3290|180|0,50|湿地公园|湖水、植被与步道适合自然散步，园内游乐和船只不是公共散步的必选消费。|Beihu Wetland Changchun|35
film-wonderland|长影世纪城|Changchun Movie Wonderland|43.7780,125.4550|300|120,260|电影主题乐园|以电影特效和主题项目为主，开园设备、身高限制与淡季停运须先核对。|Changchun Movie Wonderland|40
zoological|长春动植物公园|Changchun Zoological and Botanical Park|43.8680,125.3360|180|30,80|城市游园|动物、植物与阶段性主题活动结合，按实际开放区域参观，不把特定互动节目当成每日固定表演。|Changchun Zoological Botanical Park|0
water-culture|长春水文化生态园|Changchun Water Culture Ecology Park|43.8610,125.3280|120|0,0|工业文创|旧水厂空间转为休闲与展览场所，看城市供水历史和工业建筑，餐饮与临展另计。|Changchun water culture park|0
railway-station|长春站南广场与街区|Changchun Railway Station Historic Quarter|43.9080,125.3240|45|0,0|城市交通史|从站前广场与周边路网理解铁路对城市的影响，以公共空间散步为主，勿影响乘车人流。|Changchun railway station|0
chongqing-road|重庆路商业街区|Chongqing Road Changchun|43.8900,125.3270|90|0,0|城市商业|老商业街与餐饮、商场相连，适合晚餐前后自由活动，冬季可用室内商场作短暂保暖。|Chongqing Road Changchun|0''')
experiences(changchun,'''tram54|54路有轨电车慢游|Changchun Route 54 Tram Ride|43.8640,125.2930|60|2,10|transport-culture|搭普通运营电车看城市街道变迁，文旅专列是另行预约的产品，不把普通车费当作专列含餐报价。|Changchun tram 54|all|0|0
film-dubbing|长影电影配音与互动|Film Dubbing and Interactive Cinema at Changying|43.8670,125.2970|120|80,220|creative-culture|查看长影旧址当期互动项目或沉浸式演出，体验电影声音与场景制作；须先确认项目、场次和是否含馆票。|Changchun Film Studio museum|all|0|1
vasa|净月潭越野滑雪与瓦萨文化|Jingyuetan Cross-country Skiing and Vasa Culture|43.7910,125.4490|180|150,400|winter-sport|冬季选入门越野滑雪课程，赛事仅在官方赛期举办；装备、教练、雪道及往返费用分别确认。|Changchun Vasa skiing|12,1,2|35|1
auto|汽车工业与红旗研学|FAW and Hongqi Automotive Industry Visit|43.8440,125.2370|150|50,200|industry|选择一汽公开可预约的参观或研学项目，生产线并非随到随进；以实际场地、年龄和团体要求为准。|FAW Hongqi Changchun|all|30|1
stew|东北铁锅炖共享晚餐|Northeastern Iron-pot Stew Dinner|43.8840,125.3200|120|50,120|food-life|肉、鱼或鹅按喜好选一锅，玉米饼与蔬菜看是否另计；炖煮需要时间，适合放松的一餐。|Northeastern Chinese iron pot stew|all|0|0''')
foods(changchun,'''spring-pancake|春饼卷菜|Spring Pancakes with Fillings|薄饼包炒菜、肉丝或鸡蛋，多人各选几种馅料共享，比一人点整桌更合理。|老昌春饼|25,60|Chunbing spring pancake
pot-stew|东北铁锅炖|Northeastern Iron-pot Stew|大铁锅炖鱼、鸡或鹅，配贴饼和蔬菜；按共享一锅的人数折算单人预算。|长春市区铁锅炖馆|50,120|Dongbei iron pot stew
guobaorou|锅包肉|Guobaorou|炸肉片裹酸甜汁，刚出锅口感更好，适合两三人分享一盘。|春发合及市区东北菜馆|35,70|Guobaorou
hotpot|铜锅涮羊肉|Copper-pot Lamb Hotpot|薄切羊肉涮煮配芝麻酱，按盘点菜，先看锅底、蘸料与蔬菜是否另收。|元盛居|60,140|Chinese copper hotpot lamb
sticky-bun|粘豆包|Sticky Millet Bean Buns|黄米或糯米面包豆馅，蒸后软糯，蘸糖与否可自选，适合作早餐或小份甜点。|市区东北家常菜馆与早点铺|8,25|Niandoubao''')
hotels(changchun,'''shangrila|长春香格里拉|Shangri-La Changchun|43.8910,125.3190|550,1500|重庆路商圈老牌高端酒店，适合城市餐饮和地铁出行，房型朝向与早餐单独比较。|https://www.shangri-la.com/cn/changchun/shangrila/
hyatt|长春凯悦酒店|Hyatt Regency Changchun|43.8790,125.3240|650,1800|人民大街沿线高层城市酒店，适合市中心住宿与景观需求，去净月潭另留乘车时间。|https://www.hyatt.com/hyatt-regency/zh-CN/cgqhr-hyatt-regency-changchun
holiday-hightech|长春高新假日酒店|Holiday Inn Changchun High-tech Zone|43.7970,125.2620|350,900|高新区品牌酒店，适合自驾或西南部活动较多的行程，不应按故宫附近住宿理解。|https://www.ihg.com.cn/holidayinn/hotels/cn/zh/changchun/cgqhz/hoteldetail
express-ecology|长春生态广场智选假日酒店|Holiday Inn Express Changchun Ecological Square|43.7920,125.3780|240,650|净月与南部片区经济品牌选择，适合博物院、湿地和森林方向，市中心夜生活需要接驳。|https://www.ihg.com/holidayinnexpress/hotels/cn/zh/changchun/cgqce/hoteldetail
sheraton|长春净月潭益田喜来登酒店|Sheraton Changchun Jingyuetan Hotel|43.7780,125.3940|450,1200|净月片区度假与商务兼顾的酒店，适合家庭慢住，去潭边具体入口仍需核对路程。|https://www.marriott.com/en-us/hotels/cgqsi-sheraton-changchun-jingyuetan-hotel/overview/''')

yanji=base('yanji','延吉','Yanji','吉林',42.8910,129.5090,'YNJ',3,
    '冷面、打糕、咖啡与双语招牌构成延吉的日常；在朝鲜族文化、森林山坡和真实市集之间慢慢体验。',
    '延吉西站接入长珲高铁，朝阳川机场距城区较近。市区以公交和出租车串联；龙井、图们是城外方向，须留往返，不把长白山当作市内景点。',
    ['https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/gdxl/ybz/yjs/202506/t20250625_9264370.html','https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/gdxl/ybz/ljs/202506/t20250625_9264390.html','https://en.wikivoyage.org/wiki/Yanji'],lodging=(160,350,900),rent=(1300,2500,4800))
places(yanji,'''folk-park|中国朝鲜族民俗园|Korean Folk Park Yanji|42.8620,129.5100|150|20,60|民族文化|传统民居风格园区展示饮食、服饰和生活场景，租衣、妆造与演出通常另计，别只把这里当拍照布景。|Korean Folk Park Yanji|0
maoer|帽儿山国家森林公园|Maoershan National Forest Park|42.8460,129.5010|180|0,30|森林山地|沿林间步道登高看延吉与周边山地，部分路段台阶较多，冬季需防滑。|Maoershan Yanji|20
yanbian-museum|延边博物馆|Yanbian Museum|42.8750,129.4650|150|0,0|民族历史|从考古、朝鲜族民俗与革命史建立背景，农乐舞等专题展示让地方文化更容易理解。|Yanbian Museum|0
dinosaur-museum|延吉恐龙博物馆|Yanji Dinosaur Museum|42.8510,129.5200|120|40,100|古生物科普|结合本地恐龙化石发现看古生物与地质历史，博物馆与恐龙王国游乐园票务分别核对。|Yanji Dinosaur Museum|0
dinosaur-park|延吉恐龙王国|Yanji Dinosaur Kingdom|42.8460,129.5200|300|120,260|主题乐园|亲子可按设备开放和身高要求选项目，主题演出、水乐园及温泉不一定同票包含。|Yanji Dinosaur Kingdom|0
yanbian-university|延边大学校外街区|Yanbian University Neighbourhood|42.9140,129.5000|60|0,0|大学街区|双语招牌、咖啡馆与学生餐馆适合了解城市日常；校园入内须按校方访客规定，校外路线即可。|Yanbian University|0
people-park|延吉人民公园|Yanji People's Park|42.9120,129.5120|90|0,0|城市公园|树荫、湖边与市民晨练构成日常公园生活，游乐与动物展区是否收费另查。|Yanji Peoples Park|0
river|布尔哈通河滨河步道|Burhatong River Promenade|42.8930,129.5100|90|0,0|河岸公园|沿河看城市桥梁与夜景，走一段便能放松，冬季不把冰面当作步道。|Burhatong River Yanji|0
youth-lake|青年湖公园|Youth Lake Park Yanji|42.9050,129.5150|60|0,0|城市公园|市区小湖适合作为餐后短暂停留，与人民公园择一即可，不必为凑数重复游园。|Youth Lake Yanji|0
martyrs|延边革命烈士陵园|Yanbian Revolutionary Martyrs Cemetery|42.9420,129.5110|90|0,0|革命教育|纪念设施与展陈讲述当地革命历史，庄重参观，团队祭扫和讲解需提前联系。|Yanbian martyrs cemetery|25
west-market|延吉西市场|Yanji West Market|42.9050,129.5100|90|0,0|生活市集|米糕、泡菜、调料和地方日用品集中，按实际摊位菜单小份尝试，拍摄先征得商户同意。|Yanji West Market|0
water-market|延吉水上市场|Yanji Water Market|42.9100,129.5180|75|0,0|早餐市集|清晨市场适合看打糕、米肠与热汤，通常越早选择越多，注意给本地买菜人留通道。|Yanji Water Market|0
daeseong|龙井大成中学旧址|Daeseong Middle School Former Site Longjing|42.7750,129.4260|90|0,30|教育与革命史|在学校历史展陈中认识朝鲜族教育和反日活动，参观区域与正常教学区域严格区分。|Daeseong Middle School Longjing|40
poet-house|明东尹东柱故居|Yun Dong-ju Birthplace Longjing|42.6520,129.3660|90|0,50|文学文化|在明东村看纪念性重建故居和文学展示，了解诗人与地方教育，勿将重建屋舍称为原存建筑。|Yun Dong-ju birthplace|65
piyan|龙井琵岩山|Piyan Mountain Longjing|42.7900,129.4700|180|40,150|山地休闲|山林与景区游乐项目适合家庭半日出游，玻璃设施、滑道等项目按需选，不与徒步门票混算。|Piyan Mountain Longjing|45''')
experiences(yanji,'''costume|了解朝鲜族服饰与旅拍|Korean Ethnic Costume Portrait Session|42.8620,129.5100|150|120,450|craft-culture|先了解服饰款式与穿着礼仪，再选择租衣或摄影；妆造、精修、原片、押金与园区门票分别写清。|Korean traditional costume Yanji|all|0|1
ricecake|打糕制作与品尝|Tteok Rice-cake Making in Yanji|42.9100,129.5180|90|40,150|food-craft|市场可观察现打现售米糕，亲手打糕需预约正规体验店，保持食品卫生并按工作人员指导操作。|Korean tteok pounding|all|0|1
kimchi|泡菜与发酵食物体验|Kimchi and Fermented Food Workshop|42.9040,129.5100|120|80,220|food-craft|了解辣白菜调味与发酵，只有确认开课与冷链携带条件后才选择动手制作；不承诺任意摊位接待课程。|Kimchi making|all|0|1
farm-dance|长鼓与农乐舞演出|Korean Long-drum and Farmers Dance|42.8620,129.5100|90|60,180|performance|按实际节目单欣赏长鼓、象帽和农乐舞，理解节奏与集体舞关系；场次、座位与拍摄规则提前确认。|Korean farmers dance China|all|0|1
coffee|延吉咖啡与双语街景|Coffee and Bilingual Streets in Yanji|42.9140,129.5020|90|25,70|local-life|找一家有座位的本地咖啡店看街景，读双语菜单，给午后留白；不必为同一打卡墙排长队。|Yanji cafe Korean signs|all|0|0
barbecue|朝鲜族烤肉共享晚餐|Korean-style Barbecue Dinner in Yanji|42.8980,129.5100|120|60,160|food-life|按人数选择肉、蔬菜和主食，留意炭火与排烟，服务员烤制是否收费、冷面是否包含先问清。|Korean barbecue Yanji|all|0|0
football|看一场延边主场足球|A Home Football Match in Yanbian|42.8790,129.4560|150|40,150|sport-culture|延边有浓厚足球氛围，只在公布的主场赛程选择比赛；球队、场馆、票价和实名要求以当季公告为准。|Yanbian football stadium|3,4,5,6,7,8,9,10,11|0|1
ski|梦都美冬季初学滑雪|Mengdumei Beginner Skiing|43.0670,129.5940|240|150,400|winter-outdoor|冬季在正规雪场选初级雪道或教练课，雪票、雪具、头盔和温泉是不同产品，天气不适时调整。|Mengdumei skiing Yanji|12,1,2|45|1
harvest-festival|朝鲜族秋收与节庆活动|Korean Ethnic Harvest Celebrations|42.8620,129.5100|180|0,200|festival|秋收与民俗庆典可能有歌舞、体育和饮食活动，按当年官方公告确定具体举办村落、日期与参与方式。|Korean harvest festival China|8,9,10|0|1
literature|龙井文学与教育小旅行|Longjing Literature and Education Day|42.7750,129.4260|240|80,250|heritage-study|结合学校旧址与明东村纪念展示理解地方教育和诗歌，选择正规的文化讲解；交通与门票另核，避免同日重复安排相同景点。|Yun Dong-ju Longjing|all|45|1''')
foods(yanji,'''cold-noodles|延吉冷面|Yanji Naengmyeon|荞麦面常配酸甜冷汤、牛肉和蔬菜，先确认是否含牛肉汤与过敏配料。|服务大楼冷面、金达莱冷面|20,45|Naengmyeon
ricecake|朝鲜族打糕|Korean Pounded Rice Cake|糯米反复捶打后裹豆粉或芝麻，软糯有弹性，现做小份更适合旅途中食用。|水上市场与西市场打糕摊|10,30|Injeolmi
rice-sausage|朝鲜族米肠|Korean Rice Sausage|米与肉或血制品灌入肠衣蒸煮，口味因店而异，不接受内脏者可改选米糕。|水上市场朝鲜族熟食摊|20,45|Korean sundae sausage
bibimbap|石锅拌饭|Dolsot Bibimbap|热石锅中米饭、蔬菜、肉和蛋拌酱食用，想保留锅巴可稍等再拌；生蛋或辣酱可先提出调整。|全州拌饭等延吉拌饭馆|25,55|Dolsot bibimbap
pollock|辣拌明太鱼|Seasoned Dried Pollock|明太鱼干撕条后拌辣甜酱，适合做配菜而非一整餐，海鲜过敏者避免。|西市场朝鲜族熟食摊|20,50|Myeongtae muchim''')
hotels(yanji,'''hampton|延吉市中心希尔顿欢朋酒店|Hampton by Hilton Yanji City Center|42.9170,129.5100|350,950|市中心品牌酒店，便于餐饮与城市观光，节假日房价和早餐包含情况按日期确认。|https://www.hilton.com/zh-hans/hotels/ynjjshx-hampton-by-hilton-yanji-city-center/
baishan|延吉白山大厦|Baishan Hotel Yanji|42.8990,129.5130|300,900|布尔哈通河畔的老牌酒店，可把河岸散步与晚餐连起来；河景需要选择相应房型。|https://hotels.ctrip.com/hotels/811408.html
hongju|延吉红菊酒店|Hongju Hotel Yanji|42.8840,129.4680|450,1300|靠近西部商业区与河岸的现代酒店，适合自驾或重视客房设施的旅客，市中心景点需车程。|https://hotels.ctrip.com/hotels/112956299.html
yanbian|延边宾馆|Yanbian Hotel|42.9130,129.5300|300,1000|城市老牌接待酒店，适合希望了解地方餐饮与服务风格的旅客；房间更新程度按楼栋确认。|https://www.trip.com/hotels/list?keyword=Yanbian%20Hotel
xi-an|希岸延吉延边大学百货大楼店|Xana Hotel Yanji Yanbian University Department Store|42.9050,129.5080|180,650|市中心经济连锁选项，适合步行找餐馆和市场；街景、安静房与取消政策分别比较。|https://m.ctrip.com/webapp/hotel/yanji523/sl9711967''')

yinchuan=base('yinchuan','银川','Yinchuan','宁夏',38.4872,106.2309,'INC',4,
    '西夏历史、贺兰山岩画、葡萄酒庄与湖城生活在这里相遇；把城内博物馆和城外山麓分开，更能看见塞上风物。',
    '银川站连接银西等高铁线路，河东机场通过铁路和公路接驳。老城可步行结合公交；西夏陵、贺兰山与水洞沟分属不同方向，安排单独出游日，酒庄试饮后不要自行驾车。',
    ['https://www.yinchuan.gov.cn/sshc/lyjd/zdlyjq/','https://www.yinchuan.gov.cn/xwzx/mrdt/202404/t20240429_4526366.html','https://www.yinchuan.gov.cn/xwzx/mrdt/202505/t20250506_4898432.html','https://en.wikivoyage.org/wiki/Yinchuan'])
places(yinchuan,'''western-xia|西夏陵|Western Xia Imperial Tombs|38.4056,105.9822|210|60,110|考古遗址|先看博物馆理解西夏历史，再到陵区观察地形与夯土遗迹，景区车和讲解另查包含范围。|Western Xia tombs|50
ningxia-museum|宁夏博物馆|Ningxia Museum|38.4820,106.2260|150|0,0|综合博物馆|通过考古、西夏与地方文化展览建立时间线，适合旅行第一天安排，特展以馆方公告为准。|Ningxia Museum|0
helan-rock|贺兰山岩画|Helan Mountains Rock Art|38.7410,105.9570|180|50,100|岩画艺术|在贺兰口看古代刻画与山地环境，识别图案可配讲解，不触摸岩面或离开保护步道。|Helan Mountain rock art|70
zhenbeibao|镇北堡西部影城|Zhenbeibao Western Film Studio|38.6110,106.0630|210|70,120|电影文化|堡垒与电影布景交织，按熟悉的影片选线，服饰、摄影与演出另收费。|Zhenbeibao film studio|50
shuidonggou|水洞沟|Shuidonggou Archaeological Site|38.2830,106.5060|240|60,240|史前考古|从旧石器遗址与博物馆延伸到景区体验，基础参观和交通游乐套票差别大，按需求购买。|Shuidonggou|60
suyukou|贺兰山国家森林公园|Helan Mountain National Forest Park|38.7260,105.9450|240|60,180|山地森林|正式步道连接山谷和观景点，索道与景区车单独核价；风雪、强风和防火封闭时不进山。|Suyukou Helan Mountain|75
haibao|海宝塔|Haibao Pagoda|38.4840,106.2750|75|10,30|佛教古塔|塔与寺院位于城市北部，外观和登塔安排不同，先核对是否开放登临。|Haibao Pagoda|0
chengtian|承天寺塔|Chengtian Temple Pagoda|38.4620,106.2740|60|10,30|西夏古塔|城市老街中的塔院适合与鼓楼串联，注意现存建筑多次修缮的历史，勿将所有部分称为西夏原物。|Chengtian Temple Pagoda|0
drum|银川鼓楼|Yinchuan Drum Tower|38.4670,106.2840|30|0,0|城市地标|从公共街区看鼓楼与城市主街轴线，外观停留即可，内部开放以公告为准。|Yinchuan Drum Tower|0
yuhuang|玉皇阁|Yuhuang Pavilion Yinchuan|38.4670,106.2920|60|0,30|历史建筑|楼阁与周边街区形成老城短路线，常有地方文化展示，入内与展览开放先核实。|Yuhuang Pavilion Yinchuan|0
south-gate|南门楼|South Gate Yinchuan|38.4550,106.2830|30|0,0|城市地标|从广场看门楼与周边街道，适合晚餐前顺路停留；不把外观节点当成需要很久的大景区。|South Gate Yinchuan|0
lanshan|览山公园|Lanshan Park Yinchuan|38.5330,106.1910|120|0,0|城市观景|登台阶看落日与阅海水面，建筑是当代景观设计，节假日人多需留上下台阶时间。|Lanshan Park Yinchuan|0
yuehai|阅海国家湿地公园|Yuehai Wetland Park|38.5450,106.2060|150|0,60|湿地自然|水鸟、芦苇与湖岸步道让银川有柔和一面，乘船与游乐项目按需另计。|Yuehai wetland|0
mingcui|鸣翠湖国家湿地公园|Mingcui Lake Wetland Park|38.4290,106.3700|180|30,80|湿地自然|沿步道认识芦苇湿地，观鸟受季节与天气影响，勿为拍照进入鸟类栖息地。|Mingcui Lake|35
art-museum|银川当代美术馆|Museum of Contemporary Art Yinchuan|38.2590,106.3450|150|20,80|当代艺术|建筑与当期展览值得专程半日看，离市区较远，先确认展期、预约和返程交通。|Museum Contemporary Art Yinchuan|50
baishikou|拜寺口双塔|Baisikou Twin Pagodas|38.7570,105.9650|75|0,40|西夏古塔|双塔与贺兰山背景构成独特遗存景观，参观以保护区开放道路为界，不擅自入封闭塔院。|Baisikou Twin Pagodas|75
geology|宁夏地质博物馆|Ningxia Geological Museum|38.4780,106.2270|90|0,0|地质科普|通过矿石、化石和地质展示理解宁夏山河，适合作为亲子或雨天补充，开放安排先核对。|Ningxia Geological Museum|0
goji|百瑞源枸杞博物馆|Bairuiyuan Goji Berry Museum|38.5600,106.2890|90|0,30|农业文化|了解枸杞种植、加工与地方物产，展馆与销售区分开，保健宣传不作为医学功效承诺。|Ningxia goji museum|30
zhongshan|银川中山公园|Zhongshan Park Yinchuan|38.4780,106.2700|75|0,0|城市公园|市民休闲、树荫与步道适合城市慢游，游乐设施与公共绿地消费分开。|Zhongshan Park Yinchuan|0
hongfo|宏佛塔|Hongfo Pagoda|38.5650,106.3600|60|0,0|西夏古塔|郊外古塔适合对文物有兴趣者从开放道路看外观，保护与维修期不保证进入塔院。|Hongfo Pagoda|45''')
experiences(yinchuan,'''winery|贺兰山东麓酒庄参观与品鉴|Helan Mountain Foothills Winery Tasting|38.5770,106.0210|180|80,300|food-culture|在志辉源石或张裕等公开接待酒庄预约参观，比较土壤、酿造与酒款；只选一家深入体验，安排代驾或包车。|Helan Mountain winery|all|55|1
manpu|漫葡·看见贺兰夜间演艺|Manpu Seeing Helan Immersive Evening|38.6110,106.0600|180|100,250|performance|山麓演艺小镇以流动表演和街景构成夜游，按当晚节目与入场规则选择，散场回市区车程需预留。|Manpu Helan|4,5,6,7,8,9,10|50|1
eight-tea|盖碗八宝茶与老城慢坐|Eight-treasure Tea in Yinchuan Old Town|38.4670,106.2840|90|15,50|local-life|在老城餐馆或茶馆点一盖碗八宝茶，学着用碗盖轻拨茶叶，按自己口味减少糖。|Eight treasure tea|all|0|0
night-food|怀远夜市小份寻味|Huaiyuan Night Market Food Trail|38.4950,106.1460|120|40,120|food-life|辣糊糊、烤肉和面食以小份串联一餐，先看价格与排队，不为凑品种重复点主食。|Huaiyuan night market Yinchuan|all|0|0
desert-edge|黄河与沙地轻体验|Yellow River and Desert-edge Experience|38.5230,106.5810|210|100,300|nature-outdoor|选择正规开放景区的黄河观景与沙地活动，乘船、滑沙和观光车套票分开比较，避开大风高温。|Huangsha Gudu Ningxia|5,6,7,8,9,10|60|1''')
foods(yinchuan,'''lamb|宁夏手抓羊肉|Ningxia Hand-pulled Lamb|清水煮滩羊突出肉香，蘸盐或蒜食用，按斤点单先确认生熟重与份量。|老毛手抓、国强手抓|60,150|Ningxia lamb
offal|羊杂碎|Lamb Offal Soup|羊肚、羊肺等杂碎配热汤和辣油，搭油香或茴香饼；不吃内脏可换羊肉面。|阿叶羊杂碎|15,35|Chinese lamb offal soup
tea|盖碗八宝茶|Eight-treasure Tea|茶叶配枣、枸杞、桂圆和糖等，多次续水慢慢喝，具体配料因店而异。|老城清真餐馆与茶馆|12,35|Eight treasure tea
youxiang|油香|Youxiang Fried Bread|外层微脆的圆形油饼常配羊汤，热食口感好，可两人分食一个。|怀远夜市与老城早点铺|5,15|Youxiang fried bread
lahuhu|辣糊糊|Ningxia Lahuhu|蔬菜、豆制品和面筋裹浓稠辣汤，按串或按份计价；辣度和芝麻酱等过敏配料先问。|怀远夜市辣糊糊摊|15,40|Ningxia lahuhu''')
hotels(yinchuan,'''jw|银川JW万豪酒店|JW Marriott Hotel Yinchuan|38.4920,106.2280|650,1700|金凤区高端酒店，邻近会展与博物馆片区，适合城市舒适住宿，去老城仍需短程车。|https://www.marriott.com.cn/hotels/incjw-jw-marriott-hotel-yinchuan/overview/
kempinski|银川凯宾斯基饭店|Kempinski Hotel Yinchuan|38.4870,106.2300|550,1400|金凤行政中心片区综合酒店，适合城内文博和山麓出游前后休息；房型与餐饮按日期核价。|https://www.kempinski.com/cn/kempinski-hotel-yinchuan
courtyard|银川万怡酒店|Courtyard Yinchuan|38.4920,106.2270|350,900|会展中心与宁夏博物馆附近的中高档连锁，适合兼顾预算与交通，早餐单独看条款。|https://www.marriott.com.cn/hotels/inccy-courtyard-yinchuan/overview/
express|银川中心智选假日酒店|Holiday Inn Express Yinchuan Downtown|38.4900,106.1770|220,600|亲水大街片区经济连锁选择，适合自驾或公交衔接，不能按鼓楼老城步行距离理解。|https://www.ihg.com/holidayinnexpress/hotels/cn/zh/yinchuan/incyd/hoteldetail
holiday-guomao|银川国贸中心酒店|Yinchuan International Trade Centre Hotel|38.4700,106.2800|300,800|老城商业区品牌酒店，便于鼓楼、玉皇阁与餐饮街区，周末停车和夜间噪声按房间位置确认。|https://hotels.ctrip.com/hotels/430272.html''')

def write_packs():
    for city in CITIES:
        active=[e for e in EXPERIENCES if e['cityId']==city['id'] and e['kind']=='experience']
        stays=[e for e in EXPERIENCES if e['cityId']==city['id'] and e['kind']=='hotel']
        assert len(city['attractions'])+len(active)>=25,city['id']
        assert len(active)>=5 and len(stays)>=5,city['id']
        assert len({e['experienceType'] for e in active})>=3,city['id']
        assert all(e['experienceType'] in {'festival','marine','wildlife','nature','craft','performance','food-life','local-life','literary'} for e in active),city['id']
        assert len([f for f in FOODS if city['id'] in f['cityIds']])>=5,city['id']
        city['guide']['neighborhoods']=[{'name':a['name'],'note':a['description']} for a in city['attractions'] if '街区' in a['category']][:3]
    ids=[c['id'] for c in CITIES]+[a['id'] for c in CITIES for a in c['attractions']]+[e['id'] for e in EXPERIENCES]+[f['id'] for f in FOODS]
    assert len(ids)==len(set(ids)),'duplicate batch ids'
    assert all(re.fullmatch(r'[a-z0-9-]+',i) for i in ids),'non-ASCII identifier'
    for directory,rows in [('expansion',CITIES),('experience-expansion',EXPERIENCES),('food-expansion',FOODS)]:
        path=ROOT/'data'/directory/'china-north-20261007.json'
        path.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n','utf-8')
    print(json.dumps({'cities':len(CITIES),'attractions':sum(len(c['attractions']) for c in CITIES),'experiences':sum(e['kind']=='experience' for e in EXPERIENCES),'hotels':sum(e['kind']=='hotel' for e in EXPERIENCES),'foods':len(FOODS)}))

if __name__=='__main__':
    import re
    write_packs()
