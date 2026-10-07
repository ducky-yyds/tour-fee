"""Western China editorial destination packs. Never imports canonical data.

Identity/background checked against the sources captured in this pack on 2026-10-07.
Prices are explicitly editorial reserves, never current merchant quotations.
Photo research candidates are not permission grants or completed visual reviews.
"""
import json
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DAY = '2026-10-07'
BASE = {'__file__':str(ROOT/'scripts/seed-global-pilots.py')}
exec((ROOT / 'scripts/seed-global-pilots.py').read_text(encoding='utf-8').split('\nmunich = base(')[0], BASE)
BASE['DAY'] = DAY
place, experience, food, hotel, base = [BASE[x] for x in ['place', 'experience', 'food', 'hotel', 'base']]

SOURCES = {
 'kunming': ['https://www.visityunnanchina.com/files/2021-06/Colorful%20Yunnan.pdf', 'https://mz.yn.gov.cn/html/2024/yilvcurong_0926/4055855.html'],
 'jinghong': ['https://www.xtbg.ac.cn/', 'https://www.jhs.gov.cn/'],
 'tengchong': ['https://tengchong.gov.cn/info/16031/5029153.htm','https://www.tengchong.gov.cn/info/9607/4091573.htm'],
 'lhasa': ['https://www.lasa.gov.cn/lasa/msgj/201706/ea2ee50de05f4c918c4c1c9eba23a6f9.shtml','https://wlj.lasa.gov.cn/lsslyfzj/tjxx/201909/3ad2d7b6c0514169a69321c67ab0ca24.shtml'],
 'nyingchi': ['https://wlj.linzhi.gov.cn/lzslyfzwyh/c103820/202108/6bb104a8e13a48188c7746615ae49eef.shtml','https://wlj.linzhi.gov.cn/lzslyfzwyh/c103820/202306/5ce577e6788c45138e1326b66dd66e48.shtml'],
 'xining': ['https://www.qh.gov.cn/','https://www.qhmuseum.cn/'],
 'lanzhou': ['https://www.gansumuseum.com/','https://wlt.gansu.gov.cn/'],
 'zhangye': ['https://www.zhangye.gov.cn/chzy/zyly/ajjq/ghb.html','https://www.zhangye.gov.cn/zyszfxxgk/zfwj_5652/zfwj/agwzlfl/zzf_5653/202404/W020240417654764435418.pdf'],
 'urumqi': ['https://www.xjmuseum.com.cn/','https://wlt.xinjiang.gov.cn/'],
 'kashgar': ['https://www.kashi.gov.cn/ksdqxzgs/c106707/202307/ef05aa1c91d64ae9bbdc5fa6e31b4ad7.shtml','https://www.kashi.gov.cn/'],
 'yining': ['https://www.yining.gov.cn/yining/tsyn/201603/a831d06ed7254e01b0246bd681916b5e.shtml','https://www.yining.gov.cn/yining/wtlyj/202505/c5f157a7cb474269a99b3f93e29dd099/files/3b5bf04696614e45884a9bc2ab97f799.pdf'],
}

# id | zh | en | province | lat | lng | airport | days | wikidata | overview | access
CITY_ROWS = '''
kunming|昆明|Kunming|YN|25.0438|102.7100|KMG|4|Q182852|在翠湖喝茶、在花市辨认当季花材，再用博物馆和滇池岸边的一天认识云南的山水与多民族生活。|城区以地铁、步行和出租车衔接；石林、九乡、东川分别需要独立往返。昆明站与昆明南站不要混淆，可比较前往大理、丽江、景洪的铁路。
jinghong|景洪·西双版纳|Jinghong, Xishuangbanna|YN|22.0044|100.7970|JHG|4|Q1020832|澜沧江畔的热带小城，以傣族村寨、佛寺、雨林植物和酸辣餐桌迎接缓慢的假期。|住宿和出发中心为景洪城区，西双版纳站提供中老铁路国内段联系；勐仑植物园、勐罕和基诺山分属不同方向，不能按市内步行串联。
tengchong|腾冲|Tengchong|YN|25.0207|98.4901|TCZ|4|Q1021667|火山与温泉之外，侨乡院落、抗战遗址、手工纸和村里的茶香组成腾冲更细腻的一面。|腾冲以驼峰机场与公路接入；暂无城区客运火车站，保山站转公路须另算时间。和顺、热海、固东、界头分片安排，不将北线南线混成半日。
lhasa|拉萨|Lhasa|XZ|29.6525|91.1721|LXA|5|Q5869|在高原阳光下慢看寺院、壁画与老城生活，用甜茶馆和林卡休息穿插文化参观。|拉萨站连接青藏铁路、拉林铁路；贡嘎机场在城外，接驳另留。初到先安排轻缓活动，甘丹寺、纳木错等另作远郊路线；入藏手续按本人证件及目的地规定核对。
nyingchi|林芝|Nyingchi|XZ|29.6548|94.3615|LZY|5|Q69087|以八一城区落脚，沿尼洋河认识工布文化，再择一方向探索林海、桃花与雪山。|目的地中心为巴宜区八一城区，米林机场与林芝站均需接驳。鲁朗、巴松措、派镇大峡谷不在同一片区，宜分日或分段住宿；不把波密、墨脱塞作市内短途。
xining|西宁|Xining|QH|36.6171|101.7782|XNN|3|Q69060|河湟古城汇聚寺院、清真寺、青海文物与面食香气，适合在高原长途旅行前后留出几天。|曹家堡机场经公路接驳；西宁站可比较兰州、张掖方向动车和拉萨方向列车。塔尔寺、湟源与大通分开安排；青海湖不能当作城内湖滨活动。
lanzhou|兰州|Lanzhou|GS|36.0611|103.8343|LHW|3|Q183584|黄河穿城而过，牛肉面、河岸茶摊和丝路文物让中转站也值得慢慢停留。|城区沿黄河东西展开，可用地铁与公交分段衔接；中川机场离市中心较远。兰州站、兰州西站与中川机场站分开核对，河西城市可优先比较铁路。
zhangye|张掖|Zhangye|GS|38.9329|100.4526|YZY|4|Q69047|从西夏大佛到丹霞、湿地与裕固族文化，张掖适合用城内缓行搭配完整的郊外一天。|张掖西站和张掖站是不同车站，甘州机场另留接驳；丹霞、马蹄寺、平山湖、山丹各走不同公路，景区游览用时不含往返城区车程。
urumqi|乌鲁木齐|Urumqi|XJ|43.8256|87.6168|URC|4|Q3820|博物馆、巴扎与多民族餐桌之外，南山的山地风景让乌鲁木齐拥有城市和自然两种节奏。|地铁可衔接部分城区与机场交通，具体航站楼再核对；乌鲁木齐站与南站不同。天池在阜康、南山在城南，均需单独半日或整日接驳，伊宁和喀什不能作当天近郊。
kashgar|喀什|Kashgar|XJ|39.4704|75.9898|KHG|4|Q36966|在老城听铜器叮当、看土陶与木门纹样，再以茶、馕和烤包子的香味认识绿洲日常。|徕宁机场与喀什站均需接驳；城市间可比较普通铁路与航班，不默认高铁。帕米尔和塔县是另一个住宿段，需核对证件、开放与山路条件。
yining|伊宁|Yining|XJ|43.9080|81.2774|YIN|4|Q33424|蓝色庭院、手风琴与伊犁河的晚风，让伊宁成为值得停留的河谷城市，而不只是草原中转站。|伊宁机场与伊宁站连接城区；乌鲁木齐方向列车耗时需按实际车次安排。霍城、赛里木湖、特克斯和那拉提各自较远，不安排成连续的市区小景点。
'''

CITIES = []
for line in CITY_ROWS.strip().splitlines():
    cid, name, en, province, lat, lng, iata, days, wd, intro, access = line.split('|')
    c = base(cid,name,en,'CN','中国','亚洲','CNY',float(lat),float(lng),iata,en.split(',')[0],[name,en],intro,
      [[180,420,1200],[65,150,350],[25,90,300],[20,60,150]], [[1200,2800,6500],[160,320,650]],access,int(days),wd)
    c.update(isoRegion='CN-'+province, contentTier='priority',tierReason='全国均衡补齐的详细中国目的地',sourceReferences=BASE['refs'](SOURCES[cid][0], '城市文化与游览背景；价格不是官方报价'),officialTourismUrl=SOURCES[cid][0])
    if cid == 'jinghong': c['aliases'] += ['西双版纳','景洪','西双版纳傣族自治州','Xishuangbanna']
    if cid == 'nyingchi': c['aliases'] += ['林芝市','八一镇','巴宜','Linzhi','Bayi']
    if cid == 'urumqi': c['aliases'] += ['Ürümqi','Wulumuqi']
    if cid == 'kashgar': c['aliases'] += ['Kashi','喀什市']
    if cid == 'yining': c['aliases'] += ['Ghulja','Yili','伊宁市']
    c['guide']['neighborhoods'] = [{'name': '分区安排', 'description': access}]
    if province == 'XZ': c['planningNotes'] = ['初到高原避免安排高强度登阶、徒步及远途往返，留出适应和休息。','寺院内摄影及参观区域遵守场馆要求；部分目的地与证件类别需要提前办理手续。']
    if province == 'XZ':
        c['arrivalDayMaxActiveMinutes']=240
        c['arrivalPaceNote']='抵达当天采用轻缓节奏，先休息与适应环境；此安排不代表医学安全保证，身体不适时调整或取消活动。'
    CITIES.append(c)
BY_ID = {c['id']:c for c in CITIES}

# slug | name | english | lat,lng | minutes | low,high | category | description | image article | remote road minutes one-way
PLACES = {}
PLACES['kunming'] = '''
green-lake|翠湖公园|Green Lake Park|25.0494,102.7028|90|0,0|湖滨公园|湖岛、亭廊与树荫适合慢走，冬季能在远处观察红嘴鸥；不追逐或抓拍惊扰鸟群。|Green Lake (Kunming)|0
military-academy|云南陆军讲武堂历史博物馆|Yunnan Military Academy|25.0485,102.7010|90|0,0|历史教育|黄色院落内认识近代军校历史，可与翠湖相邻路线组合，入馆预约和展厅开放另查。|Yunnan Military Academy|0
provincial-museum|云南省博物馆|Yunnan Provincial Museum|24.9517,102.7567|180|0,0|地方博物馆|从古滇青铜器到民族生活理解云南历史，展厅内容适合半天慢看。|Yunnan Provincial Museum|0
ethnic-museum|云南民族博物馆|Yunnan Nationalities Museum|24.9680,102.6660|120|0,0|民族文化|服饰、乐器和生产生活器物让民族文化有具体细节，与民族村的现场展演是不同参观内容。|Yunnan Nationalities Museum|0
ethnic-village|云南民族村|Yunnan Ethnic Village|24.9588,102.6655|240|80,120|文化园区|选择感兴趣的村寨建筑和表演理解地方文化，表演以当天节目单为准，不代表真实村落生活全貌。|Yunnan Ethnic Village|0
western-hills|西山龙门|Western Hills, Kunming|24.9617,102.6270|180|50,160|山地石刻|沿山间步道看石刻与滇池全景，索道和景区交通与门票可能分别收费，登阶需量力。|Western Hills|0
daguan|大观公园|Daguan Park|25.0248,102.6754|120|0,30|园林文化|在湖岸园林读大观楼长联并看滇池北岸风景，园内临时展览或游乐另计。|Daguan Park|0
golden-temple|金殿风景区|Golden Temple Park|25.0983,102.7673|120|20,40|道教建筑|观察铜铸殿宇和山林中的建筑布局，台阶较多，适合安排半天的东北郊线路。|Golden Temple Park|0
yuantong|圆通寺|Yuantong Temple|25.0521,102.7092|60|5,20|宗教建筑|顺着下沉式庭院看水池与佛殿的层次，参访时让出礼佛通道，室内摄影先看提示。|Yuantong Temple|0
guandu|官渡古镇|Guandu Ancient Town|24.9549,102.7524|150|0,0|历史街区|古塔、寺庙与饵块小食构成老镇生活，收费展馆和餐饮不包含在公共街巷参观内。|Guandu Ancient Town|0
kunming-old-street|昆明老街与文明街|Kunming Old Street|25.0396,102.7082|90|0,0|历史街区|在文明街一带看旧商铺与院落尺度，可挑一间咖啡馆歇脚，不将每条巷子重复算成景点。|Kunming Old Street|0
east-west-pagodas|东西寺塔|East and West Pagodas, Kunming|25.0294,102.7095|60|0,0|历史建筑|两座古塔分处相近街区，沿途观察老城与现代商业的交界，主要在公共空间观外观。|East Pagoda and West Pagoda|0
railway-museum|云南铁路博物馆|Yunnan Railway Museum|25.0568,102.7263|120|0,30|工业历史|从米轨车辆与滇越铁路展览认识云南的交通变化，车辆展区开放情况需核对。|Yunnan Railway Museum|0
southwest-university|西南联大旧址纪念馆|National Southwest Associated University Museum|25.0569,102.7022|90|0,0|历史教育|在校园中的旧址和展览回望战时教育，进入校园与纪念馆可能需分别预约。|National Southwestern Associated University|0
black-dragon-pool|黑龙潭公园|Black Dragon Pool Park, Kunming|25.1445,102.7463|120|0,30|园林植物|古树、道观与水潭适合清静慢游，梅花季另核对花期，不与丽江同名公园混淆。|Black Dragon Pool, Kunming|0
botanical-garden|昆明植物园|Kunming Botanical Garden|25.1430,102.7390|150|10,30|植物园|按开放路线看云南植物、山茶与扶荔宫温室，温室讲解和专类园开放可能需另订。|Kunming Botanical Garden|0
haigeng|海埂公园|Haigeng Park|24.9565,102.6619|100|0,0|湖滨自然|坐在湖边或沿步道看滇池与西山，适合留出休息时间，游船和骑行租赁另算。|Dianchi Lake|0
stone-forest|石林风景区|Stone Forest, Yunnan|24.8173,103.3245|240|120,180|喀斯特自然|在开放步道辨认石峰与狭道，往返昆明须单列铁路或公路接驳，整片景区不拆成多个必去点。|Stone Forest|90
jiuxiang|九乡风景区|Jiuxiang Scenic Region|25.0760,103.3700|210|80,150|溶洞自然|峡谷、地下洞厅和暗河形成连续参观线，台阶及潮湿路面需要合适鞋履，与石林组合会占完整一天以上。|Jiuxiang Scenic Region|100
dongchuan|东川红土地开放观景点|Dongchuan Red Land|26.0290,103.1200|180|0,0|乡村景观|在公共观景平台看不同作物与红土色带，尊重田地边界；距城区远，适合单独住宿一晚。|Dongchuan Red Land|180
'''
PLACES['jinghong'] = '''
manting|曼听御花园|Manting Park|21.9930,100.8018|150|35,70|历史园林|傣式建筑、园林与湖岸适合慢游，夜间演出和白天门票是不同产品。|Manting Park|0
zongfo|西双版纳总佛寺|Xishuangbanna Zongfo Temple|21.9876,100.8030|75|0,0|佛教建筑|金色屋顶下观察傣族南传佛教建筑，穿着与拍照遵守寺院提示，参观不等于参加宗教仪式。|Wat Pa Che|0
tropical-flowers|热带花卉园|Xishuangbanna Tropical Flower Garden|22.0148,100.7854|150|25,60|热带植物|可可、热带果树与花卉展示把热带农业带进城内，按导览识别植物而不随意采摘。|Xishuangbanna Tropical Flower Garden|0
ethnic-museum|西双版纳民族博物馆|Xishuangbanna Nationalities Museum|21.9692,100.8011|120|0,0|民族博物馆|通过服饰、工具和地方历史展览认识不同社区，参观前核对开放日与预约。|Xishuangbanna Museum|0
mengle|勐泐文化旅游区|Mengle Cultural Tourism Zone|21.9563,100.7988|180|90,150|文化园区|沿山势看佛教主题建筑群与城区景色，商业演出以当日安排为准，注意它与总佛寺不同。|Mengle Buddhist Temple|0
gaozhuang|告庄西双景|Gaozhuang Xishuangjing|22.0092,100.8186|90|0,0|当代休闲街区|白天看傣式商业建筑与江岸，夜晚人多，购物、写真和餐饮均按自愿消费选择。|Gaozhuang Xishuangjing|0
jiangbian|澜沧江滨公园|Lancang Riverfront Park|22.0060,100.8045|90|0,0|城市河岸|沿开放河岸休息看两岸灯火，不下水游泳，雨季避开封闭或积水路段。|Lancang River Jinghong|0
manjinglan|曼景兰老村片区|Manjinglan Dai Quarter|21.9981,100.8028|75|0,0|社区文化|在公共巷道看傣族村落与城市商业相邻的生活，入户和人物摄影先征得同意。|Manjinglan Jinghong|0
man-ge|曼阁佛寺|Mange Temple|22.0207,100.8126|60|0,20|佛教建筑|木构佛殿与屋檐纹样适合静静观察，具体开放范围以寺院现场为准。|Mange Temple|0
forest-park|西双版纳原始森林公园|Xishuangbanna Primitive Forest Park|22.0392,100.8860|210|45,100|森林公园|在开放栈道观察热带森林结构，选植物和鸟类自然观察，动物接触表演不作默认安排。|Xishuangbanna Primitive Forest Park|30
wild-elephant-valley|野象谷开放观察步道|Wild Elephant Valley|22.1605,100.8580|210|60,160|野生动物观察|以栈道与观察设施了解亚洲象栖息地，野象出现不能保证；不安排骑象或触摸野生动物。|Wild Elephant Valley|45
jinuo|基诺山寨|Jinuo Mountain Village|22.0180,100.9810|180|120,200|民族文化|通过导览、生活器物和展演认识基诺族文化，民俗表演不等同于日常自发仪式。|Jino people|60
mantuan|曼团村佛寺与老寨|Mantuan Dai Village|21.8570,101.0180|120|0,30|村落文化|在傣族村寨公共道路看佛寺与民居，住户院落和宗教空间需先询问。|Mantuan Village Xishuangbanna|60
dai-garden|勐罕傣族园|Xishuangbanna Dai Garden|21.8590,101.0250|240|40,120|村落文化|园区由多个相连村寨构成，以佛寺、民居和传统生活为主线，一次计为完整园区游览。|Xishuangbanna Dai Garden|60
botanical-garden|中科院西双版纳热带植物园|Xishuangbanna Tropical Botanical Garden|21.9226,101.2517|300|70,180|植物科学|选择西区专类园或增加东区雨林步道，植物收藏丰富；位于勐腊县勐仑镇，需整日往返。|Xishuangbanna Tropical Botanical Garden|90
manzhang|曼掌村|Manzhang Village|22.0765,100.8648|150|0,0|非遗村落|公共村道可看傣式民居与手艺店，造纸、制陶和讲解是单独预约收费内容。|Manzhang Village Xishuangbanna|35
manluan|曼乱典傣族村|Manluandian Dai Village|22.0840,100.7400|120|0,0|乡村文化|村道、佛寺和田地构成傣乡日常，家庭院落不可擅入，节庆日人车较多。|Manluandian Village|35
nannuo|南糯山半坡老寨|Nannuo Mountain Banpo Village|21.9490,100.5880|180|0,0|茶山村落|看茶林与哈尼族村寨的关系，进入茶园先获许可，茶叶购买与向导另计；位于勐海方向。|Nannuo Mountain|60
dadugang|大渡岗茶园开放观景区|Dadugang Tea Plantations|22.3670,100.9560|120|0,40|茶园景观|在允许进入的步道看茶园纹理，不踏入生产区；采茶等活动需事先向经营者确认。|Dadugang Tea Plantation|70
mengyang|勐养镇老街|Mengyang Old Town|22.1330,100.8860|90|0,0|集镇生活|逛农贸市场与老街了解沿线集镇生活，赶集日期先问当地，适合作为北线行程的用餐停留。|Mengyang Jinghong|40
'''
PLACES['tengchong'] = '''
heshun|和顺古镇|Heshun Old Town|25.0053,98.4562|240|45,90|侨乡古镇|沿巷道看侨乡院落、洗衣亭与田野，图书馆等联票场馆按当日范围选择，不将同一古镇拆成多次收费。|Heshun Town|0
re-hai|腾冲热海景区|Tengchong Rehai Geothermal Area|24.9510,98.4390|150|40,90|地热自然|沿步道看热泉、地热蒸汽与钙华，远离热水边缘；泡汤是另行付费的温泉产品。|Tengchong Rehai|30
volcano|马站火山地质公园|Tengchong Volcanic Geopark|25.2280,98.5020|150|30,70|火山地质|沿开放阶梯认识火山锥和岩石，登高量力，热气球等运营项目不包含在基础参观中。|Tengchong Volcanic Geothermal National Geopark|45
beihai|北海湿地|Beihai Wetland|25.1190,98.5310|150|50,120|湿地自然|在栈道与许可游船上观察浮毯型湿地，不踩入保护区植被或追逐鸟类。|Beihai Wetland|30
cemetery|国殇墓园|Tengchong National Martyrs Cemetery|25.0165,98.4800|100|0,0|历史教育|在纪念设施中了解腾冲战役与抗战牺牲者，保持肃静，避免娱乐化摆拍。|Tengchong National Martyrs Cemetery|0
war-museum|滇西抗战纪念馆|Western Yunnan Anti-Japanese War Museum|25.0161,98.4795|150|0,0|历史博物馆|通过文物、照片和战事叙述理解滇西抗战，展馆与墓园相邻但内容不同，可安排连续半天。|Western Yunnan Anti-Japanese War Museum|0
dieshui|叠水河瀑布|Dieshuihe Waterfall|25.0295,98.4840|75|10,30|城市瀑布|在指定平台看河水跌落与柱状节理，雨季水汽湿滑，不越过护栏靠近落水口。|Dieshuihe Waterfall|0
laifeng|来凤山国家森林公园|Laifengshan Forest Park|25.0080,98.4930|150|0,30|森林公园|森林步道与城景适合半天缓步，石阶有起伏，可选择较短的开放路线。|Laifeng Mountain|0
li-genyuan|李根源旧居|Former Residence of Li Genyuan|25.0274,98.4849|60|0,0|人物故居|在叠园看旧居院落及李根源相关展陈，适合连接叠水河一带的近代历史路线。|Li Genyuan|0
qiluo|绮罗古镇|Qiluo Historic Village|24.9980,98.5090|150|0,0|侨乡文化|从文昌宫、古宅外观和乡村水系认识绮罗，部分建筑开放需向现场确认。|Qiluo Village Tengchong|0
ginkgo|江东银杏村|Jiangdong Ginkgo Village|25.3110,98.5140|180|20,60|季节乡村|银杏与村屋交错，秋季颜色取决于当年天气；尊重住户边界，茶餐和停车另计。|Jiangdong Ginkgo Village|60
yunfeng|云峰山|Yunfeng Mountain, Tengchong|25.4350,98.4080|240|50,220|山地宗教|在高山步道与道观之间登高观景，索道运行受天气影响，台阶陡峭需量力。|Yunfeng Mountain Tengchong|90
simola|司莫拉佤族村|Simola Wa Village|24.9520,98.5200|120|0,0|乡村文化|看村寨建筑与稻田生活，民俗展示、家访和手作须先与经营者确认，公共参观不等于可随意入户。|Simola Wa Village|30
jiangju|江苴古镇|Jiangju Old Town|25.2380,98.6070|120|0,0|古道集镇|沿旧街看商铺与古道集镇的空间，许多房屋仍在使用，近拍人物与进入院落需询问。|Jiangju Tengchong|60
paper-village|界头新庄手抄古纸村|Xinzhuang Handmade Paper Village|25.5340,98.6500|150|0,50|工艺乡村|手工纸展示让树皮到纸张的过程变得可见，操作课程单独预约；地处界头方向，宜独立安排北线。|Gaoligong Museum of Handcraft Paper|110
gaoligong-tea|高黎贡山茶博园|Gaoligong Tea Culture Park|25.0570,98.5360|100|0,60|茶文化|通过茶文化陈列和生产展示理解腾冲茶区，品饮、研学与购物按实际选择收费。|Gaoligong Tea Tengchong|25
he-mu|和睦茶花村|Hemu Camellia Village|25.2280,98.4520|120|0,40|植物乡村|山茶与村寨相伴，花季随天气变化，进入私人花园或收费展区需先询价。|Hemu Camellia Village Tengchong|50
pa-lian|帕连傣族古寨|Palian Dai Village|24.8350,98.6710|120|0,0|乡村文化|在公共村道看竹木民居和大树，尊重生活空间，体验项目需确认经营和预约。|Palian Dai Village|60
xinqi|新岐古镇|Xinqi Old Town|25.3900,98.4850|120|0,0|历史集镇|看滇西集镇街巷与地方木构建筑，和银杏村属于同一北线方向但仍需接驳。|Xinqi Tengchong|75
cherry-valley|高黎贡山樱花谷|Gaoligong Cherry Valley|25.3440,98.6430|210|40,100|森林峡谷|沿经营景区的开放步道看森林与溪谷，温泉另核价，雨季和防火期需确认开放。|Cherry Valley Tengchong|90
'''
PLACES['lhasa'] = '''
potala|布达拉宫|Potala Palace|29.6578,91.1170|150|100,220|世界遗产|按预约时段参观宫殿、壁画与历史展陈，台阶较多，抵达高原首日不宜匆忙登高。|Potala Palace|0
jokhang|大昭寺|Jokhang Temple|29.6500,91.1329|120|70,110|世界遗产|在允许参观的殿堂理解建筑与信仰传统，内部摄影、参观方向和时间遵守现场要求。|Jokhang|0
barkhor|八廓街|Barkhor|29.6501,91.1340|100|0,0|历史街区|在公共街巷看商铺、院门与老城生活，尊重转经人群，不阻挡宗教活动路线。|Barkhor|0
norbulingka|罗布林卡|Norbulingka|29.6501,91.0892|180|50,90|世界遗产|园林、宫殿与壁画适合边走边休息，不把夏季藏戏活动视作每天固定节目。|Norbulingka|0
tibet-museum|西藏博物馆|Tibet Museum|29.6455,91.0900|180|0,0|地方博物馆|通过历史文物和民俗展览为寺院与村落参访建立背景，预约和临时展厅以馆方公告为准。|Tibet Museum (Lhasa)|0
sera|色拉寺|Sera Monastery|29.7011,91.1337|150|40,70|寺院文化|寺院建筑和开放庭院值得慢看，辩经是宗教学习活动，场次与可参观范围需确认。|Sera Monastery|0
drepung|哲蚌寺|Drepung Monastery|29.6750,91.0480|180|40,80|寺院文化|山坡上的寺院群规模较大，留出缓慢登阶和休息时间，重要法会期间另核对管制安排。|Drepung Monastery|0
ramoche|小昭寺|Ramoche Temple|29.6580,91.1320|75|20,50|宗教建筑|在老城北侧寺院观察殿堂与庭院布局，避开宗教仪式并遵守摄影提示。|Ramoche Temple|0
zongjiao|宗角禄康公园|Zongjiao Lukang Park|29.6620,91.1182|90|0,0|城市园林|布达拉宫背后的湖面与树荫适合低强度休息，看居民锻炼与散步，不进入限制区域。|Dzongyab Lukhang|0
chagpori-view|药王山开放观景台|Chagpori Viewpoint|29.6540,91.1152|45|0,0|城市观景|在开放平台远看布达拉宫与城市，排队拍照时让出通道；不是药王山全山攀爬路线。|Chagpori|0
meru|木如宁巴寺|Meru Nyingba Monastery|29.6510,91.1353|60|0,30|宗教建筑|八廓附近的院落空间适合理解寺院与老城生活相邻的关系，开放状态以现场为准。|Meru Nyingba Monastery|0
ani-tsangkhung|仓姑寺|Ani Tsankhung Nunnery|29.6466,91.1358|60|20,50|尼寺文化|在允许区域参观尼寺，保持安静，旁边茶馆用餐与寺院参观分开选择。|Ani Tsankhung Nunnery|0
resident-minister|清政府驻藏大臣衙门旧址陈列馆|Former Qing Resident Minister Office|29.6518,91.1352|75|0,0|历史展馆|通过旧址和文献展陈了解历史行政联系，展馆位于老城巷道，预约和开放日先核对。|Amban|0
gendun-chophel|根敦群培纪念馆|Gendun Chophel Memorial Hall|29.6515,91.1338|60|0,0|人物文化|用人物生平、学术与艺术相关展览认识西藏近代知识文化，适合安静阅读。|Gendun Chophel|0
gyabum-gang|吉本岗艺术中心|Gyabumgang Art Center|29.6590,91.1272|90|30,100|艺术空间|在历史建筑中看壁画与当代艺术展览，展览更换与门票须向艺术中心核实。|Gyabumgang|0
lalu|拉鲁湿地开放游览区|Lalu Wetland|29.6760,91.0980|100|0,0|湿地自然|只在对公众开放的栈道观察芦苇与水鸟，保护区内部并非全部可进入。|Lalu Wetlands National Nature Reserve|0
lhasa-river|拉萨河滨河公园|Lhasa River Park|29.6338,91.1202|75|0,0|河岸休闲|在城市开放河岸缓步看山与桥，风大时缩短停留，不进入河滩险区或下水。|Lhasa River|0
ganden|甘丹寺|Ganden Monastery|29.7630,91.4740|180|40,80|山地寺院|海拔与台阶都高于城区，应适应后再来，山路接驳另留；不把高山转山作为默认短项目。|Ganden Monastery|75
yerpa|扎叶巴寺|Drak Yerpa|29.7520,91.2760|150|25,60|山地寺院|洞窟寺院沿山坡分布，台阶和暴露山路需要体力，天气不佳或尚未适应时改选城内项目。|Drak Yerpa|60
namtso|纳木错扎西半岛|Namtso Tashi Peninsula|30.7180,90.8620|180|100,250|高原湖泊|选择开放观景路线看湖与山，海拔高且离城远，往返应整日或另设住宿段，不靠近野生动物。|Namtso|240
'''
PLACES['nyingchi'] = '''
museum|林芝市博物馆|Nyingchi Museum|29.6640,94.3570|120|0,0|地方博物馆|先了解工布地区历史与多民族生活，再选择乡村和自然路线，核对展馆开放日。|Nyingchi Museum|0
gongbu-park|工布公园|Gongbu Park|29.6520,94.3740|90|0,0|城市公园|在城区公共绿地低强度散步，观察居民休闲节奏，适合作为抵达后的轻松一站。|Gongbu Park Nyingchi|0
niyang-waterfront|八一尼洋河滨河步道|Niyang River Bayi Promenade|29.6425,94.3680|90|0,0|河岸自然|沿开放步道看河谷与远山，雨季遵守封闭提示，适合将午后留作休息。|Niyang River|0
gala|嘎拉桃花村|Gala Peach Blossom Village|29.6830,94.3940|120|0,50|季节乡村|春季在开放道路看桃树与田野，花期随当年气温变化，平日也要尊重农田边界。|Gala Village Nyingchi|20
giant-cypress|世界柏树王园林|Giant Cypress Nature Reserve|29.6630,94.4500|90|20,40|古树自然|沿保护步道观察古柏与河谷环境，不触碰树皮、踩踏根系或悬挂物件。|Giant Cypress Nature Reserve|25
biri|苯日景区开放观景区|Biri Scenic Area|29.6240,94.4510|150|40,120|山地文化|在经营景区开放路线看河谷与林地，具体线路和接驳当日确认，不将神山全线穿越作为短游。|Benri Mountain|40
lamaling|喇嘛岭寺|Lamaling Monastery|29.4900,94.4010|90|20,40|宗教建筑|在寺院庭院观察彩绘与藏式建筑，位于城区以南，尊重仪式与拍摄范围。|Lamaling Monastery|60
kading|卡定沟|Kading Valley|29.8550,94.2850|150|20,50|森林瀑布|在景区步道看峡壁与瀑布，雨后路滑，进入前确认落石及临时关闭提示。|Kading Valley|60
cuomuji-ri|措木及日|Cuomujiri Lake|29.7100,94.3910|180|100,200|高山湖林|高处湖泊与冷杉林需要景区接驳，地势高于八一城区，适应后再按开放路线游览。|Cuomujiri|50
serkhyim|色季拉山开放观景台|Sejila Mountain Viewpoint|29.6120,94.6950|60|0,30|高山观景|在公路沿线合法观景平台看山林与雪峰，海拔较高且天气变化快，不停车占用行车道。|Sejila Mountain|100
lulang-forest|鲁朗林海观景区|Lulang Forest Viewpoint|29.7690,94.7340|90|20,60|森林景观|远望林海、村落与草甸层次，观景平台与鲁朗小镇不是同一处，另留公路时间。|Lulang Forest|110
lulang-town|鲁朗国际旅游小镇|Lulang International Tourism Town|29.7800,94.7350|150|0,0|山地度假|湖岸与藏式建筑适合慢住休息，骑马和牧场消费另计，建议以鲁朗住宿段串联附近村落。|Lulang Town|120
zhaxigang|扎西岗村|Zhaxigang Village, Lulang|29.7760,94.7480|120|0,0|工布村落|在公共村道观察工布民居与田园，家访、骑马等活动先向当地经营者确认。|Zhaxigang Lulang|120
basum|巴松措景区|Basum Tso|30.0100,93.9820|240|100,200|高原湖泊|湖心岛与开放湖岸是完整参观路线，位于工布江达县方向，单程约两小时，应单独成日。|Basum Tso|120
jieba|结巴村|Jieba Village|30.0180,93.9990|120|0,0|湖畔村落|沿湖畔村道看工布木屋与日常生活，适合结合巴松措住宿；进入景区可能先需购买通票。|Jieba Village Basum Tso|130
cuogao|错高村|Cuogao Village|30.0640,94.0110|120|0,0|传统村落|传统村屋与湖谷环境适合慢看，路况、开放及景区边界先确认，非市中心短途。|Cuogao Village|150
yarlung-canyon|雅鲁藏布大峡谷派镇景区|Yarlung Tsangpo Grand Canyon Pai Scenic Area|29.5060,94.8810|300|150,300|峡谷自然|选择景区开放观景与接驳路线，南迦巴瓦能否露出受天气影响；不等于徒步穿越大峡谷。|Yarlung Tsangpo Grand Canyon|150
suosong|索松村|Suosong Village|29.5460,94.9120|180|0,100|山地村落|在开放村道看峡谷与南迦巴瓦方向，常适合住一晚等待天气；通行、停车和住宿另查。|Suosong Village|170
danniang|丹娘沙丘开放观景点|Danniang Sand Dune|29.4800,94.7350|60|0,30|河谷地貌|从合法道路和平台观察河谷风成沙丘，不擅入沙坡或临河危险区域，适合派镇路线途中停留。|Danniang Sand Dune|120
nanyi|南伊沟开放游览区|Nanyi Valley|29.1610,94.2260|240|100,230|森林文化|米林方向的森林与珞巴文化项目需提前确认开放、证件与接驳；线路受管理和天气影响，不默认可随到随进。|Nanyi Valley|150
'''
PLACES['xining'] = '''
qinghai-museum|青海省博物馆|Qinghai Provincial Museum|36.6333,101.7534|150|0,0|地方博物馆|从彩陶、丝路交流与地方历史文物认识青海，专题展览和预约要求以馆方安排为准。|Qinghai Provincial Museum|0
tibetan-culture|青海藏文化博物院|Qinghai Tibetan Culture Museum|36.7080,101.7570|210|60,100|藏文化博物馆|藏医药、工艺与唐卡相关展厅适合慢看，不把文化展示中的传统医疗知识当作个人治疗建议。|Qinghai Tibetan Culture Museum|0
dongguan|东关清真大寺|Dongguan Mosque|36.6143,101.8015|75|0,0|宗教建筑|在允许参观的区域观察建筑与社区生活，礼拜期间让出通道，服装与摄影遵守提示。|Dongguan Mosque|0
taer|塔尔寺|Kumbum Monastery|36.4836,101.5686|180|40,100|寺院文化|以酥油花、壁画与堆绣认识寺院艺术，殿内摄影依规定，湟中往返交通单独安排。|Kumbum Monastery|45
beichan|北禅寺与北山开放步道|Beichan Temple|36.6430,101.7880|90|0,30|山地历史|从开放区域看山体与建筑，石窟保护和山路开放可能调整，不进入封闭洞窟。|Beichan Temple|0
nanshan|南山公园|Nanshan Park, Xining|36.6020,101.7910|120|0,0|山地公园|选择合适长度的步道看西宁盆地，登阶放缓，日落前预留安全下山时间。|Nanshan Park Xining|0
renmin|人民公园|People's Park, Xining|36.6390,101.7650|90|0,0|城市公园|树荫、湖岸与市民活动适合缓步休息，园内游乐设施不包含在免费公共空间里。|People's Park Xining|0
botanical|西宁植物园|Xining Botanical Garden|36.6150,101.7470|120|0,30|植物自然|沿山坡开放园路认识高原城市植被，花期随季节变化，雨雪天注意步道情况。|Xining Botanical Garden|0
plateau-zoo|西宁野生动物园|Xining Wildlife Park|36.6200,101.7130|210|20,60|动物科普|参观正规展区了解高原动物，遵守禁投喂提示，避免将圈养动物接触作为特色体验。|Xining Wildlife Park|0
shenan|沈那遗址开放展示区|Shen'na Archaeological Site|36.6690,101.7570|75|0,0|考古遗址|了解河湟地区史前聚落，遗址展示与博物馆不同；出发前确认保护区是否开放。|Shenna Site|0
wenmiao|西宁文庙|Xining Confucian Temple|36.6200,101.7830|60|0,0|历史建筑|看儒学建筑和城市文脉，展陈活动与开放时段按现场公告，不默认所有殿堂可进入。|Xining Confucian Temple|0
ma-bufang|马步芳公馆|Ma Bufang Residence|36.6215,101.7955|90|20,40|近代历史|从院落格局认识青海近代历史，参观需核实当前开放与展览安排。|Ma Bufang Mansion|0
xining-museum|西宁市博物馆|Xining Museum|36.6260,101.7740|90|0,0|城市历史|用城市沿革与出土器物补充地方背景，若临时闭馆可改选省博物馆。|Xining Museum|0
danggar|丹噶尔古城|Danggar Old Town|36.6855,101.2610|180|0,80|历史古城|在湟源老城看茶马商贸街巷，公共街道与收费院馆分开计算；不要把湟源当作西宁市内步行点。|Huangyuan County|60
laoye|大通老爷山|Laoye Mountain|36.9340,101.6940|180|20,50|山地自然|沿开放山路登高看大通河谷，台阶较多且有海拔，雨雪或结冰时调整线路。|Laoye Mountain|60
niangniang|大通娘娘山开放景区|Niangniang Mountain, Datong|36.9570,101.6140|210|20,60|山地自然|在经营景区开放路线观察山地植被，草地不能随意驾车驶入，往返城区需单独预留。|Niangniang Mountain Datong|75
sun-moon|日月山|Riyue Mountain|36.4210,101.0920|100|30,70|高原文化|在开放观景区域看高原地貌与文成公主相关文化叙事，风大海拔高，活动强度应保守。|Riyue Mountain|100
huangshui|湟水河滨河步道|Huangshui River Promenade|36.6330,101.7820|75|0,0|城市河岸|沿城市开放步道看河流与桥梁，适合餐后散步，施工或汛期封闭区绕行。|Huang Shui|0
limei|力盟商业巷|Lime Commercial Lane|36.6288,101.7542|90|0,0|城市生活|咖啡、餐饮和商铺适合放松与补给，公共街区免费，实际消费按选择计入餐饮或购物。|Xining Chengxi|0
qinghai-lake|青海湖二郎剑景区|Qinghai Lake Erlangjian Scenic Area|36.5800,100.4890|180|50,150|高原湖泊|在开放湖岸看辽阔湖面，不进入保护区和野生动物栖息地；距西宁较远，应独立整日或湖边住宿。|Qinghai Lake|150
'''
PLACES['lanzhou'] = '''
gansu-museum|甘肃省博物馆|Gansu Provincial Museum|36.0674,103.7751|180|0,0|地方博物馆|彩陶、丝路文物与铜奔马相关展览适合半天慢看，热门展厅先预约。|Gansu Provincial Museum|0
zhongshan|中山桥|Zhongshan Bridge|36.0655,103.8153|50|0,0|历史桥梁|在黄河铁桥公共步行区域看桥桁架和两岸山势，日落时人多，拍照不要阻挡通行。|Zhongshan Bridge|0
baita|白塔山公园|White Pagoda Mountain|36.0706,103.8150|150|0,0|山地公园|登上开放步道看黄河穿城，白塔与坡地建筑适合慢慢看，下山时间另留。|White Pagoda Mountain|0
yellow-river-mother|黄河母亲雕塑|Yellow River Mother Sculpture|36.0668,103.8040|35|0,0|城市艺术|理解母亲与孩子的形象表达，再沿河岸短走；是短暂停留点，不应占用完整半天。|Yellow River Mother Sculpture|0
waterwheel|兰州水车博览园|Lanzhou Waterwheel Expo Park|36.0620,103.8444|90|0,0|工业文化|看水车结构与黄河灌溉历史，机械运行和水位随季节变化，不攀爬设施。|Lanzhou Waterwheel Park|0
wuwuan|五泉山公园|Wuquan Mountain Park|36.0400,103.8240|150|0,0|山地园林|泉水、古建筑与山路组成南城经典路线，参观以开放区域为准，登阶量力。|Five Springs Mountain|0
lanzhou-museum|兰州市博物馆|Lanzhou Museum|36.0540,103.8230|120|0,0|城市历史|从地方历史展陈了解黄河城市沿革，白衣寺塔等旧址部分以现场开放为准。|Lanzhou Museum|0
gansu-art|甘肃省美术馆|Gansu Art Museum|36.0570,103.8400|90|0,0|艺术展馆|选择当期绘画或专题展览，适合与附近文化场馆组合，展期与闭馆日先查。|Gansu Art Museum|0
readers|读者博物馆|Duzhe Museum|36.0630,103.8490|90|0,0|出版文化|从杂志出版、阅读和城市记忆认识读者品牌，部分研学活动需预约。|Duzhe|0
science|甘肃科技馆|Gansu Science and Technology Museum|36.0890,103.7160|180|0,0|科学博物馆|互动展项适合亲子与雨天，球幕电影、临时展和预约要求另查。|Gansu Science and Technology Museum|0
yellow-river-building|黄河楼|Yellow River Tower, Lanzhou|36.0870,103.7490|120|30,100|城市观景|在楼内文化展示与高处视野中认识黄河城市，夜间演出与日常登楼可能分别售票。|Yellow River Tower Lanzhou|0
xiguan|西关清真大寺外观|Xiguan Mosque|36.0610,103.8130|45|0,0|宗教建筑|以公共街道外观观察为主，内部是否接待游客须询问，不打扰礼拜和社区生活。|Xiguan Mosque|0
wu-muquan|兰州碑林|Lanzhou Forest of Steles|36.0700,103.8100|100|0,30|书法文化|在白塔山西侧看碑刻与书法展陈，步道与展馆开放先核对，和登山路线合理合并交通。|Lanzhou Forest of Steles|0
bapanxia|八盘峡库区开放观景点|Bapanxia Reservoir Viewpoint|36.1420,103.3480|100|0,0|河谷自然|在合法公共观景点看黄河库区，水工设施与岸边危险区域不能擅入。|Bapanxia Dam|75
xinglong|兴隆山景区|Xinglong Mountain|35.7880,104.0610|240|40,150|山地森林|榆中方向的山林与古建筑适合整日安排，索道、不同山线和接驳分别核对。|Xinglong Mountain|75
qingcheng|青城古镇|Qingcheng Ancient Town|36.3370,104.1850|180|0,70|黄河古镇|看商贸院落、古街与黄河沿岸生活，公共街道和收费院馆分开，不把它按市区交通计算。|Qingcheng Ancient Town Gansu|100
hekou|河口古镇|Hekou Ancient Town, Lanzhou|36.1480,103.4910|150|0,40|历史古镇|从老街、院门和黄河渡口文化理解交通节点，进入私宅需征得同意。|Hekou Ancient Town Lanzhou|60
yantan|雁滩公园|Yantan Park|36.0630,103.8710|75|0,0|城市公园|水面与绿地适合短时间休息，可与东段河岸线路组合，餐饮游乐另计。|Yantan Park Lanzhou|0
baitashan-tunnel|金城关文化博览园|Jinchengguan Culture Exhibition Park|36.0690,103.8200|120|0,30|民俗工艺|在黄河北岸的文化场馆看非遗、彩陶或地方工艺展览，具体开放馆舍和活动先查。|Jinchengguan Lanzhou|0
ru-yuan|甘肃简牍博物馆|Gansu Jiandu Museum|36.0320,103.8260|150|0,0|考古文字|简牍展示让丝路交通、书写与日常行政变得具体，适合为河西走廊旅行补充背景。|Gansu Bamboo Slips Museum|0
'''
PLACES['zhangye'] = '''
dafo|张掖大佛寺|Dafo Temple, Zhangye|38.9253,100.4561|120|35,60|西夏文化|看西夏佛殿、卧佛及寺院展陈，殿内摄影遵守规定；不同附属场馆的门票范围需核对。|Dafo Temple (Zhangye)|0
wooden-pagoda|木塔寺广场|Wooden Pagoda Temple|38.9290,100.4530|45|0,30|历史建筑|从公共广场观察木塔，登塔是否开放另查，适合连接老城的短暂停留。|Wooden Pagoda Temple Zhangye|0
bell-tower|镇远楼|Zhenyuan Tower, Zhangye|38.9360,100.4560|35|0,0|历史地标|在安全步行区域看钟鼓楼与老城路网，不为拍照进入机动车道。|Zhenyuan Tower Zhangye|0
shandan-hall|山西会馆|Shanxi Guild Hall, Zhangye|38.9270,100.4610|60|0,30|商贸文化|戏楼与会馆建筑体现河西商贸联系，开放时段及是否包含在联票中向现场确认。|Shanxi Guild Hall Zhangye|0
wetland|张掖国家湿地公园|Zhangye National Wetland Park|38.9700,100.4450|150|0,0|湿地自然|在开放栈道看水面、芦苇和鸟类，保护区敏感区域不进入，游船等另计。|Zhangye National Wetland Park|0
ganquan|甘泉公园|Ganquan Park, Zhangye|38.9340,100.4350|75|0,0|城市公园|树荫、水面与居民活动适合休息，作为低强度城市时段使用，游乐设施另收费。|Ganquan Park Zhangye|0
heihe|黑河湿地开放步道|Heihe River Wetland, Zhangye|38.9910,100.4100|120|0,0|河流自然|在允许进入的河岸看绿洲与湿地，观察水鸟保持距离，不下水或开车进入沙洲。|Heihe River|0
colorful-danxia|张掖七彩丹霞|Zhangye Danxia Geopark|38.9760,100.0690|240|80,180|地质自然|观景台之间需要景区接驳，颜色随光照和天气变化，日落游览要核对末班车。|Zhangye National Geopark|60
binggou|冰沟丹霞|Binggou Danxia|38.8850,100.0430|180|40,120|地质自然|柱状与城堡状岩体和七彩丹霞的彩色丘陵不同，步道上下坡较多，两个景区不可当作同一张票。|Binggou Danxia|70
pingshan|平山湖大峡谷|Pingshanhu Grand Canyon|39.1730,100.7320|300|100,220|峡谷自然|峡谷台阶、狭道与观景需要体力，选择路线时核对是否需爬梯，往返市区另计。|Pingshanhu Grand Canyon|75
mati|马蹄寺石窟群|Mati Temple Grottoes|38.4850,100.4200|240|60,160|石窟艺术|按开放洞窟与导览参观，窟内楼梯窄，禁止拍摄区域依要求；远郊山路单独留时间。|Mati Temple|90
jinta|金塔寺石窟预约参观|Jinta Temple Grottoes|38.4370,100.3970|120|200,400|石窟艺术|保护性开放的小型石窟需提前确认名额、导览与费用，未预约不自动加入行程。|Jinta Temple Grottoes|110
shandan-great-wall|山丹明长城开放遗址|Shandan Ming Great Wall|38.7900,101.0950|100|0,30|历史遗址|在开放道路看夯土长城与河西地貌，不登踩脆弱遗址；属于山丹方向整日路线。|Great Wall Shandan|90
shandan-museum|山丹县博物馆|Shandan County Museum|38.7810,101.0890|100|0,0|地方历史|了解山丹历史与路易艾黎相关文化联系，馆内开放与特展信息应提前查阅。|Shandan Museum|85
rewi|艾黎纪念馆|Rewi Alley Memorial Hall|38.7840,101.0860|90|0,0|人物教育|围绕路易艾黎的教育和公益经历参观，适合与山丹县城而非张掖市内步行串联。|Rewi Alley|85
horse-farm|山丹马场开放游览区|Shandan Horse Farm|38.2930,101.2340|180|0,100|草原牧业|在开放观景区看牧场与祁连山背景，骑马须另找合规经营者；路远，适合山丹住宿段。|Shandan Horse Farm|180
gaotai-memorial|高台中国工农红军西路军纪念馆|Western Route Army Memorial, Gaotai|39.3770,99.8230|150|0,0|历史教育|在纪念馆与陵园认识西路军历史，保持肃静；高台县距张掖较远，单列交通。|Chinese Workers and Peasants Red Army Western Route Army|100
wulan|屋兰古镇|Wulan Ancient Town|38.8990,100.6540|150|0,80|历史文化|根据开放展馆与非遗活动选择内容，仿古展示和历史遗存区别理解，不把商业街全部当古建筑。|Wulan Ancient Town Zhangye|40
bals|巴尔斯雪山景区|Bals Snow Mountain Scenic Area|38.4940,99.5520|240|150,300|高山自然|高海拔观景需先适应，乘景区车辆并停留在开放区；不包括冰川攀登或无人区穿越。|Bals Snow Mountain|150
kangle|康乐草原开放景区|Kangle Grassland|38.7490,99.9140|180|40,100|草原文化|在肃南方向开放草原看牧业景观，草场有生产边界，雨雪季需核对道路和营业。|Kangle Grassland|100
'''
PLACES['urumqi'] = '''
xinjiang-museum|新疆维吾尔自治区博物馆|Xinjiang Museum|43.8210,87.5860|210|0,0|地方博物馆|从丝路文物、服饰与历史展览认识新疆，热门时段先预约，避免把多个文化传统混成单一印象。|Xinjiang Museum|0
grand-bazaar|新疆国际大巴扎|Xinjiang International Grand Bazaar|43.7790,87.6150|150|0,0|商贸文化|公共商区可看建筑、乐器与手工艺商铺，观景塔、演出和购物另收费。|Xinjiang International Grand Bazaar|0
hongshan|红山公园|Hong Shan Park|43.8073,87.6076|120|0,0|城市山景|沿开放步道看城市天际线与山景，台阶较多，可按体力选择短线。|Hong Shan|0
people-park|人民公园|People's Park, Urumqi|43.8000,87.5980|90|0,0|城市园林|树荫、湖面和市民文体活动适合放松，游乐与付费项目自选。|People's Park (Ürümqi)|0
shuimogou|水磨沟公园|Shuimogou Park|43.8330,87.6590|150|0,0|城市自然|泉水、林荫与历史节点交织，适合安排一段轻缓步行，冬季注意结冰路面。|Shuimogou Park|0
hongguangshan|红光山生态园|Hongguangshan Park|43.9080,87.6270|150|20,60|城市山地|选择开放园路看山坡与城市北部景观，收费范围和宗教建筑开放需现场核对。|Hongguangshan|0
geology-museum|新疆地质矿产博物馆|Xinjiang Geological and Mineral Museum|43.8330,87.5770|120|0,0|地质科学|矿物、化石和地质展览帮助理解之后的山地旅行，提前确认馆舍开放。|Xinjiang Geological Museum|0
art-museum|新疆美术馆|Xinjiang Art Museum|43.8020,87.6160|120|0,0|艺术展馆|通过当期展览看不同艺术家的地域表达，免费常设和临时活动以馆方公告为准。|Xinjiang Art Museum|0
city-museum|乌鲁木齐市博物馆|Urumqi Museum|43.9120,87.6260|120|0,0|城市历史|在文化中心片区认识城市历史与生活变迁，可与周边场馆按兴趣择一组合。|Urumqi Museum|0
science-museum|新疆科技馆|Xinjiang Science and Technology Museum|43.8270,87.5850|150|0,0|科学博物馆|互动科学展览适合亲子或休整日，球幕等项目和闭馆日需核实。|Xinjiang Science and Technology Museum|0
botanical|乌鲁木齐植物园|Urumqi Botanical Garden|43.8920,87.5560|120|0,40|植物园|开放园区可看适应干旱气候的植物，花期与温室开放受季节和维护影响。|Urumqi Botanical Garden|0
wenmiao|乌鲁木齐文庙|Urumqi Confucian Temple|43.7950,87.6300|60|0,0|历史建筑|历史院落适合作为老城区文化短站，进入场馆前确认开放时间。|Urumqi Confucian Temple|0
shanxi-mosque|陕西大寺外观|Shaanxi Mosque, Urumqi|43.7900,87.6240|45|0,0|宗教建筑|在公共道路观察中式建筑风格，内部不是默认旅游空间，入内需征得许可。|Shaanxi Mosque Urumqi|0
salt-lake|盐湖景区|Urumqi Salt Lake|43.4820,88.0720|150|30,150|盐湖自然|盐湖景观和经营体验分开选择，漂浮或温泉需核对开放、设施与适用条件。|Urumqi Salt Lake|75
dabancheng|达坂城古镇开放街区|Dabancheng Old Town|43.3620,88.3100|120|0,40|地域文化|认识风口集镇与地方民俗，具体展馆和演出先核对，公路停留仅在合法位置。|Dabancheng District|90
tianshan-canyon|天山大峡谷景区|Tianshan Grand Canyon, Urumqi|43.4700,87.4930|300|80,180|山地自然|走经营景区开放线路看山林湖谷，接驳与步行时间都要预留，不能和市中心景点按短途相连。|Tianshan Grand Canyon Urumqi|90
west-baiyang|南山西白杨沟|West Baiyanggou Valley|43.3860,87.1930|240|30,100|山地森林|溪谷、云杉与牧场适合整日郊游，徒步长度按体力和天气确定，不随意穿越牧场围栏。|Baiyanggou|100
silk-road-resort|丝绸之路山地度假区|Silk Road Mountain Resort|43.4550,87.4070|240|80,350|山地运动|冬季滑雪与其他季节观景是不同产品，雪票、装备、教练与保险分别核价。|Silk Road Mountain Resort|90
heavenly-lake|天山天池|Heavenly Lake of Tianshan|43.8900,88.1280|240|120,240|高山湖泊|位于阜康方向，湖边步道、接驳与观景占完整时段；索道和游船另计，不默认天气晴朗。|Heavenly Lake of Tianshan|110
annanqu|安宁渠文旅小镇|Anningqu Cultural Town|44.0140,87.5030|150|0,60|乡村文化|在开放街区看地方手作与集市，活动日期及工作坊预约先查，餐饮购物按实际消费。|Anningqu|50
'''
PLACES['kashgar'] = '''
old-city|喀什古城|Kashgar Old City|39.4750,75.9860|180|0,0|历史街区|以完整街区漫游看门窗、土色院墙与日常生活，住户空间需尊重，不将每个路口凑成独立景点。|Kashgar Old City|0
id-kah|艾提尕尔清真寺|Id Kah Mosque|39.4720,75.9850|90|30,60|宗教建筑|在开放参观区域看院落、柱廊与建筑细节，礼拜与特殊活动时段遵守限制。|Id Kah Mosque|0
apakh-hoja|香妃园与阿帕克霍加墓建筑群|Apakh Hoja Mausoleum and Xiangfei Park|39.4890,76.0250|150|25,100|历史园林|观察墓园建筑与庭院，香妃主题演艺属于当代旅游叙事，参观和表演票种分别确认。|Afaq Khoja Mausoleum|0
gaotai|高台民居开放展示区|Gaotai Historic Dwellings|39.4770,76.0010|120|0,60|传统民居|在开放区域看高台聚落与民居技艺，保护修缮区不能擅入，住户与工坊摄影先询问。|Gaotai Folk Houses|0
museum|喀什地区博物馆|Kashgar Museum|39.4600,75.9900|150|0,0|地方博物馆|通过出土文物与地方历史理解绿洲城市，热门时段先核对预约和闭馆日。|Kashgar Museum|0
pan-tuo|盘橐城遗址|Pantuo City Site|39.4450,75.9890|90|0,40|历史遗址|了解疏勒历史与班超相关叙事，现有展示与原始遗存分别理解，开放情况先确认。|Pantuo City|0
yusuf|玉素甫·哈斯·哈吉甫墓|Yusuf Khass Hajib Mausoleum|39.4570,75.9850|75|15,40|人物文化|通过纪念性建筑认识《福乐智慧》作者及其文学背景，宗教与纪念空间保持安静。|Yusuf Balasaguni|0
east-lake|东湖公园|East Lake Park, Kashgar|39.4700,76.0080|75|0,0|城市公园|湖边树荫适合作为老城步行后的休息点，游船和餐饮不包含在公共区域参观内。|East Lake Kashgar|0
people-park|人民公园|People's Park, Kashgar|39.4610,75.9900|75|0,0|城市公园|看居民散步与休闲节奏，选择低强度时段，不将公园游乐与免费入园混算。|People's Park Kashgar|0
id-kah-square|艾提尕尔广场|Id Kah Square|39.4720,75.9870|35|0,0|城市广场|从公共广场看老城门户与人流，节日或活动期间按现场引导通行，不能承诺每天有歌舞。|Id Kah Square|0
kashgar-university|喀什大学高台校区周边|Kashgar University Gaotai Campus Exterior|39.4840,75.9840|45|0,0|城市文化|在允许通行的校园外围看教育与老城相邻的空间，校内参访必须服从访客管理。|Kashgar University|0
old-consulate|色满宾馆历史庭院|Former Russian Consulate, Kashgar|39.4750,75.9710|60|0,50|近代历史|历史领事馆建筑现与酒店经营相连，庭院或建筑参观须先征得经营方许可，不默认免费入内。|Seman Hotel|0
qinibagh|其尼瓦克历史建筑外观|Chini Bagh Historic Residence|39.4800,75.9770|60|0,50|近代历史|了解历史领事馆与丝路交流背景，酒店经营空间的参观权限先询问。|Chini Bagh|0
three-fairy-caves|三仙洞开放外围观景|Three Immortals Buddhist Caves|39.5310,75.9200|60|0,40|石窟遗址|只选择管理方允许的外围观景点，崖洞不作为可自行进入项目，保护与路况优先。|Three Immortals Buddhist Caves|40
morr-stupa|莫尔佛寺遗址|Mor Buddhist Temple Site|39.7000,76.1100|100|0,60|考古遗址|远观佛塔与遗址地貌，考古和保护区域不擅入，出发前确认开放路线和讲解。|Mor Buddhist Temple|70
han-nuoyi|汗诺依古城遗址开放区|Hannoi Ancient City Site|39.7000,76.1300|90|0,50|古城遗址|遗址地貌需要结合历史讲解理解，未确认开放时不进入，不攀踩夯土建筑。|Hanoi Ruins Kashgar|70
shule-museum|疏勒县张骞纪念馆|Zhang Qian Memorial Hall, Shule|39.4000,76.0480|90|0,0|历史教育|通过展陈理解汉代丝路交流，位于疏勒方向，提前核对展馆开放与预约。|Zhang Qian Memorial Hall Shule|35
shufu-musical-village|疏附吾库萨克乐器村|Wukusake Musical Instrument Village|39.3780,75.8640|150|0,60|手工艺村落|在对外开放的工坊看传统乐器制作，演奏和手作课程需预约，不能随意进入私人作坊。|Wukusake Musical Instrument Village|40
dawakul|达瓦昆沙漠开放景区|Dawakun Desert Scenic Area|39.8440,76.6930|210|30,180|沙漠自然|在景区开放线路看沙丘与绿洲交界，骑乘、越野等项目自选另计；位于岳普湖，需整日往返。|Dawakun Desert|120
aksu-orchard|阿克喀什乡开放杏园|Akekashi Apricot Orchards|39.3820,75.7800|120|0,80|季节乡村|只在经营者允许进入的杏园看花或采摘，花期、果期和按斤收费方式须先确认。|Shufu County Apricot|50
'''
PLACES['yining'] = '''
kazanqi|喀赞其民俗旅游区|Kazanqi Folk Tourism Area|43.9000,81.3240|180|0,0|历史社区|沿公共街巷看蓝色门墙与庭院生活，家访须预约，居民住所不能因拍照擅入。|Kazanqi|0
liuxing|六星街|Six Star Street|43.9270,81.3150|150|0,0|多民族街区|放射状街道连接不同社区的院落，适合以建筑、音乐和小店认识城市，消费另计。|Liuxing Street|0
ili-museum|伊犁州博物馆|Ili Kazakh Autonomous Prefecture Museum|43.9240,81.2980|150|0,0|地方博物馆|从考古、历史与民俗展陈理解伊犁河谷，入馆预约和开放日按官方公告。|Ili Museum|0
accordion|六星街历史与民俗文化陈列馆|Six Star Street History and Accordion Museum|43.9280,81.3140|90|20,60|音乐文化|看手风琴收藏及街区历史，现场演奏场次另查，不保证每次参观都能听到演出。|Accordion Museum Yining|0
princess|汉家公主纪念馆|Han Princess Memorial Hall|43.9180,81.3060|90|0,0|历史文化|认识汉代与乌孙交流及相关人物故事，展陈和历史建筑参观以当日开放为准。|Han Princess Memorial Hall Yining|0
ili-river|伊犁河风景区|Ili River Scenic Area|43.8770,81.3080|120|0,0|河流自然|沿开放堤岸看河谷光线与树影，汛期避开封闭区，不下水或驶入河滩。|Ili River|0
ili-bridge|伊犁河大桥开放观景点|Ili River Bridge Viewpoint|43.8710,81.3000|45|0,0|城市地标|从允许停留的岸边看桥与河面，车辆通行区域不停车拍照，可与河滨路线共享交通。|Ili River Bridge|0
hanren-market|汉人街市场|Hanren Street Market|43.8970,81.3250|100|0,0|地方市场|干果、香料与熟食摊帮助理解地方饮食，询价按公斤或份明确，不把购物算固定门票。|Hanren Street Yining|0
baitullah|拜图拉清真寺外观|Baitullah Mosque|43.9100,81.3280|45|0,0|宗教建筑|在公共街道观察历史建筑，宗教空间能否入内须询问，拍摄人物先征得同意。|Baitullah Mosque|0
sha-an|陕西大寺外观|Shaanxi Mosque, Yining|43.9050,81.3240|45|0,0|宗教建筑|看中式建筑与地方社区的联系，以外围参观为默认，礼拜活动不打扰。|Shaanxi Mosque Yining|0
wangmeng|王蒙书屋与巴彦岱村|Wang Meng Study and Bayandai Village|43.9620,81.2200|150|0,40|文学乡村|从作家生活和作品相关展陈认识河谷文学，村落公共区域与书屋开放分别确认。|Wang Meng Bayandai|30
suburb-village|苏勒阿勒玛塔村|Sule Alemata Village|43.9900,81.1630|150|0,0|乡村生活|在公共道路看庭院、田地与山前生活，家访和体验由村内合规经营者确认。|Sule Alemata Village|45
silk-road-light|丝路之光旅游小镇|Silk Road Light Cultural Town|43.9120,81.2800|120|0,60|当代文化空间|以当日开放展览、文创与休闲活动为主，商业街体验和历史遗址不是同一类内容。|Silk Road Light Yining|0
people-park|人民公园|People's Park, Yining|43.9180,81.3250|75|0,0|城市公园|树荫与市民活动适合作为低强度休整段，儿童游乐和餐饮另计。|People's Park Yining|0
ningyuan|宁远城墙开放遗址|Ningyuan City Wall Site|43.9100,81.3190|50|0,0|城市历史|通过开放遗址与介绍理解旧城边界，保护区不攀爬，适合和博物馆历史主题串联。|Ningyuan City Yining|0
huiyuan|惠远古城|Huiyuan Ancient Town|44.0040,80.8880|180|0,100|边疆历史|城楼、旧街和伊犁将军府等按实际开放选择；位于霍城县，收费院馆独立核对。|Huiyuan Town|60
qapqal|察布查尔锡伯民俗风情园|Qapqal Xibe Cultural Park|43.8340,81.1480|150|20,100|锡伯文化|通过展陈认识锡伯族迁徙、文字和射箭传统，活动是否可参与需先预约。|Qapqal Xibe Autonomous County|50
lavender|霍城解忧公主薰衣草园|Princess Jieyou Lavender Garden|44.1070,80.8030|150|30,80|季节花园|花期受气候与收割时间影响，进入经营园区按开放步道行走，勿踩踏生产花田。|Huocheng Lavender|75
kuerdening|库尔德宁景区|Kuerdening Scenic Area|43.1300,82.8660|300|80,200|森林山地|巩留方向的森林草甸景区需单独住宿或整日长途，接驳、步道开放和天气先确认。|Kuerdening|180
sayram|赛里木湖开放景区|Sayram Lake|44.5650,81.2010|300|70,200|高山湖泊|湖区面积大且离城远，选择一段合法湖岸路线，不进入草甸保护区；宜独立整日或湖畔住宿。|Sayram Lake|150
'''

MEDIA = []
for cid, block in PLACES.items():
    city = BY_ID[cid]
    for line in block.strip().splitlines():
        slug, name, en, coord, minutes, amount, category, desc, article, road = line.split('|')
        lat,lng = map(float,coord.split(',')); low,high=map(float,amount.split(',')); road=int(road)
        p=place(city,slug,name,en,lat,lng,int(minutes),low,high,category,desc,article,SOURCES[cid][0],road>0)
        p['sourceReferences'] = BASE['refs'](SOURCES[cid][0], '当地历史、文化和旅游资源背景；具体开放、票价、坐标与用时需另核验')
        p['sourceCheckedAt'] = None
        p['editorialReviewedAt'] = DAY
        if road:
            p['accessNote'] = f'城区出发单程公路暂按约 {road} 分钟预留（编辑估算，未含堵车、等车和中途停靠），必须单独加入往返接驳。'+('建议另设住宿段。' if road>=150 else '')
            p['access']={'type':'road-transfer','oneWayMinutesEstimate':road,'basis':'editorial-estimate','requiresSeparateTransfer':True}
        if slug in ['jinta','three-fairy-caves','han-nuoyi','shenan','old-consulate','qinibagh','nanyi']:
            p['automaticPlanning']=False
            p['requirements']=['先确认当前开放、访客权限及预约，不默认随到随进。']
        city['attractions'].append(p)
        MEDIA.append({'entityId':p['id'],'cityId':cid,'kind':'attraction','name':name,'query':en+' '+city['nameEn'],'article':article,'requiredMatch':'exact-place','status':'research-candidate','reuseRequired':True})

# Five distinct participatory / seasonal experiences, rather than five more streets.
# slug | zh | en | coord | minutes | low,high | theme | description | article | months | conditional | road
EXPERIENCES = {
'kunming': '''
flower-market|斗南花市选花与花材观察|Dounan Flower Market Visit|24.9080,102.7790|120|0,100|food-life|在公开交易区观察鲜花分级和包装，询问花束单价；拍卖及生产区域不默认向游客开放，购买花材自愿。|Dounan Flower Market|all|0|35
zhuanxin-tasting|篆新菜市场云南小吃寻味|Zhuanxin Market Food Tasting|25.0370,102.6960|120|30,100|food-life|从豆花米线、烧饵块与熟食摊选一顿午餐，市场不同摊位分开结账，试吃先征得店家同意。|Zhuanxin Market Kunming|all|0|0
gull-watching|滇池冬日远距观鸥|Dianchi Winter Gull Watching|24.9660,102.6550|90|0,80|wildlife|在海埂开放岸线远距看越冬红嘴鸥，出现数量受天气影响，不触摸或追逐鸟群。|Black-headed gull Dianchi|11,12,1,2,3|0|0
tea-afternoon|翠湖茶馆里的云南茶席|Yunnan Tea Tasting near Green Lake|25.0494,102.7028|90|50,180|food-life|选择公开营业茶馆，比较普洱生熟茶香气与泡法；套餐按人数与茶叶等级询价，购买茶叶不是必选项。|Pu'er tea|all|0|0
theatre|云南民族艺术演出之夜|Yunnan Performing Arts Evening|25.0470,102.7130|120|120,380|performance|查阅云南艺术剧院等正规剧场当期节目，选择舞蹈或音乐演出；剧目、场次和演员阵容不作固定承诺。|Yunnan dance performance|all|1|0
''',
'jinghong': '''
paper-making|曼掌村傣族慢轮制陶与造纸择一|Dai Papermaking or Pottery Workshop|22.0765,100.8648|150|60,200|craft|先向村内对外营业工坊确认课程，选择造纸或慢轮制陶其中一项；材料、作品烧制寄送分别询价。|Dai papermaking|all|1|35
rainforest-walk|基诺山合规向导雨林观察|Jinuo Forest Guided Nature Walk|22.0180,100.9810|240|180,450|nature|仅预约经营者允许通行的线路，观察藤本、昆虫与林层；不擅入保护核心区，不保证遇见指定动物。|Xishuangbanna tropical rainforest|all|1|60
dai-table|傣味手抓饭与香草餐桌|Dai Hand-Served Rice Feast|21.9981,100.8028|120|70,180|food-life|在正规傣味餐馆辨认香茅、蘸水和烤制菜品，可替代当天正餐；份量、辣度和是否含肉先问清。|Dai cuisine|all|0|0
songkran|傣历新年泼水节公共活动|Dai New Year Water Festival|22.0060,100.8045|180|0,100|festival|只在当年公布的公共活动区域参与，拍照和泼水尊重他人意愿；节庆日期及交通管制核实后才排程。|Water-Sprinkling Festival|4|1|0
garden-night|热带植物园预约夜观|Tropical Botanical Garden Night Walk|21.9226,101.2517|150|100,280|wildlife|向植物园核对是否有合规夜观讲解，在允许路线观察夜间昆虫和两栖类；名额、天气和返程交通提前落实。|Xishuangbanna Tropical Botanical Garden|all|1|90
''',
'tengchong': '''
hot-spring|腾冲温泉半日休息|Tengchong Hot Spring Afternoon|25.0920,98.5270|180|150,450|wellness|选择玛御谷等正规温泉经营场所，核对池区开放、毛巾和接驳是否包含；泡汤不作为疗效承诺。|Tengchong hot springs|all|0|30
paper-workshop|界头手工纸预约制作|Jietou Handmade Paper Workshop|25.5340,98.6500|180|80,220|craft|在对外工坊学习抄纸与压水，材料、干燥和作品带走方式先确认，往返城区另留整段车程。|Gaoligong Museum of Handcraft Paper|all|1|110
shadow-puppets|固东刘家寨皮影戏观摩|Gudong Shadow Puppet Performance|25.3300,98.4980|90|40,180|performance|联系传承展示点核对皮影演出或讲解，了解雕刻、操偶与唱腔；没有确认场次时不自动排入。|Tengchong shadow puppetry|all|1|65
wetland-birds|北海湿地远距观鸟|Beihai Wetland Birdwatching|25.1190,98.5310|150|50,220|wildlife|从开放栈道使用望远镜看湿地鸟类，导赏服务另计，不保证遇见某种鸟；不进入浮毯草甸。|Beihai Wetland|11,12,1,2,3|0|30
earthen-hotpot|腾冲土锅子慢午餐|Tengchong Earthen Pot Lunch|25.0053,98.4562|120|80,180|food-life|在和顺或城区正规餐馆品尝炭火土锅子，按锅确认人数、肉类与配菜，费用可替代当天一餐。|Tengchong hot pot|all|0|0
''',
'lhasa': '''
sweet-tea|老城甜茶馆慢早餐|Lhasa Sweet Tea Breakfast|29.6500,91.1360|90|15,55|food-life|在公开营业的老城甜茶馆点茶、藏面或小食，入座与拍摄先尊重店家和客人，不把茶饮当高反预防手段。|Tibetan sweet tea|all|0|0
thangka|唐卡艺术观摩与预约入门|Thangka Art Demonstration|29.6550,91.1280|150|100,350|craft|先联系对外开放的艺术工坊，了解颜料、线描和图案，再确认是否提供初学者课程与材料。|Thangka painting|all|1|0
shoton|雪顿节藏戏与公共文化活动|Shoton Festival Tibetan Opera|29.6501,91.0892|180|0,150|festival|依据当年公告选择罗布林卡等地公开藏戏节目，日期、门票及交通管制先核对，非每天可体验。|Shoton Festival|8,9|1|0
linka|林卡树荫下的藏式野餐|Lhasa Lingka Picnic|29.6620,91.1182|120|30,100|local-life|在允许野餐的公共绿地安排茶点与休息，遵守禁火和清洁要求，尊重当地家庭的活动空间。|Norbulingka picnic|5,6,7,8,9|0|0
princess-drama|《文成公主》演出预约之夜|Princess Wencheng Outdoor Performance|29.6160,91.1470|150|200,600|performance|按官方公布演出季与场次购票，城南接驳、散场返程和夜间保暖另留时间，恶劣天气可能停演。|Princess Wencheng Lhasa performance|4,5,6,7,8,9,10|1|25
''',
'nyingchi': '''
peach-festival|林芝桃花季公共文化活动|Nyingchi Peach Blossom Season|29.6830,94.3940|180|0,120|festival|根据当年花期与官方节目选择嘎拉等地公共活动，不保证某一天盛花，进入农田或摄影点先确认许可。|Nyingchi peach blossoms|3,4|1|20
lulang-pot|鲁朗石锅鸡慢午餐|Lulang Stone Pot Chicken Lunch|29.7800,94.7350|120|80,180|food-life|在正规餐馆点石锅鸡，按锅确认份量、配菌和价格，费用可替代当天正餐，不自行采食野菌。|Lulang stone pot chicken|all|0|120
gongbu-culture|工布服饰与传统手艺观摩|Gongbu Cultural Craft Demonstration|29.7760,94.7480|120|60,200|craft|向鲁朗村内对外经营的文化展示点确认服饰或手艺讲解，家访先预约；不安排未公开的家庭仪式。|Gongbu traditional clothing|all|1|120
forest-birding|鲁朗开放林道向导观鸟|Lulang Forest Guided Birdwatching|29.7690,94.7340|210|180,450|wildlife|向合规向导核对开放林道、天气和体力要求，远距观察不播放诱鸟声，不承诺具体物种出现。|Lulang forest birds|4,5,6,9,10|1|120
niyang-picnic|尼洋河谷轻缓野餐午后|Niyang Valley Picnic Afternoon|29.6425,94.3680|150|30,100|nature|选择城区允许停留的滨河绿地，带茶点坐看山谷，雨季或强风改为室内休息，禁止下水和野外用火。|Niyang River|4,5,6,7,8,9,10|0|0
''',
'xining': '''
breakfast|莫家街青海早餐寻味|Mojia Street Qinghai Breakfast|36.6180,101.7900|100|25,70|food-life|选择营业摊店品尝酿皮、酸奶或面食，价格按份询问，早餐费用替代当天餐饮预算。|Mojia Street Xining|all|0|0
flower-song|河湟花儿公开演出|Hehuang Hua'er Folk Song Performance|36.6260,101.7740|120|0,150|performance|按文化馆和剧场当期节目选择公开花儿演出，民间歌会日期另核实，不默认每天有固定场次。|Hua'er|5,6,7,8,9|1|0
thangka|青海唐卡艺术预约观摩|Qinghai Thangka Art Demonstration|36.7080,101.7570|120|60,220|craft|在公开展馆或有预约服务的工坊看线描与色彩，若参加课程先确认材料与讲解，不以购物作为必要内容。|Thangka painting|all|1|0
shehuo|丹噶尔社火与灯会|Danggar Shehuo Festival|36.6855,101.2610|180|0,120|festival|春节前后以当年官方灯会、社火时间为准，演出与古城院馆门票分别核对，返程交通提前安排。|Shehuo festival|1,2,3|1|60
river-tea|湟水河边的高原茶点午后|Huangshui Riverside Tea Break|36.6330,101.7820|120|20,80|local-life|在公开茶馆或合法休息区点茶和青海小食，轻松坐一会儿，用于高原长途前后的休整。|Xining tea food|all|0|0
''',
'lanzhou': '''
beef-noodle|清晨一碗兰州牛肉面|Lanzhou Beef Noodle Breakfast|36.0590,103.8150|75|15,45|food-life|点面时选择面型、辣椒和肉蛋配料，观察开放明档拉面但不擅入后厨，可替代当天早餐。|Lanzhou beef noodles|all|0|0
river-tea|黄河岸边三泡台茶席|Yellow River Sanpaotai Tea Break|36.0655,103.8153|120|25,80|local-life|在营业茶摊坐看黄河，三泡台通常含茶叶与甜味配料，按杯或按席先问价，留出真正休息的时间。|Sanpaotai tea|4,5,6,7,8,9,10|0|0
river-cruise|黄河正规游船看两岸|Yellow River Sightseeing Cruise|36.0650,103.8190|90|50,160|water|只选有运营许可的码头游船，出发时间、航线和救生设施先确认，水位与天气可能停航。|Yellow River cruise Lanzhou|4,5,6,7,8,9,10|1|0
gourd-carving|兰州刻葫芦工艺观摩|Lanzhou Carved Gourd Workshop|36.0690,103.8200|120|60,200|craft|向金城关非遗展示场馆确认刻葫芦讲解或入门课程，材料和作品带走方式另问，非每天固定开课。|Lanzhou carved gourds|all|1|0
qin-opera|秦腔与陇原戏曲之夜|Gansu Traditional Opera Evening|36.0560,103.8400|150|50,250|performance|查正规剧院当期剧目和场次，选择秦腔或地方戏演出，字幕和时长以实际节目为准。|Qinqiang|all|1|0
''',
'zhangye': '''
danxia-light|丹霞晚光摄影时段|Danxia Evening Light Photography|38.9760,100.0690|180|80,200|nature|在官方观景台等待光线，天气不佳也不进入未开放区；与丹霞常规游览二选一，避免重复计票。|Zhangye Danxia sunset|all|0|60
yugur-culture|裕固族服饰与歌谣预约体验|Yugur Culture Demonstration|38.7490,99.9140|150|80,250|craft|向肃南公开文化场馆或经营点预约讲解，了解服饰与民歌传统，家访与摄影征得同意。|Yugur people|all|1|100
wetland-birding|张掖湿地清晨观鸟|Zhangye Wetland Morning Birdwatching|38.9700,100.4450|150|0,180|wildlife|用望远镜从开放栈道观察迁徙与留鸟，保持距离、不诱鸟，物种出现不能保证。|Zhangye wetland birds|3,4,5,9,10,11|0|0
noodle-workshop|搓鱼面与河西面食餐桌|Zhangye Fish-Shaped Noodle Meal|38.9340,100.4560|100|25,90|food-life|在正规面馆品尝搓鱼面、臊面等不同形制，开放明档可观察制作，不把普通用餐承诺成动手课程。|Zhangye noodles|all|0|0
horse-intro|山丹马场合规短程骑乘|Shandan Horse Farm Supervised Riding|38.2930,101.2340|150|150,400|outdoor|只预约明示资质和装备的经营者，初学者选择牵引短线，体重年龄限制、头盔及保险先确认，往返车程另计。|Shandan Horse Farm horses|5,6,7,8,9,10|1|180
''',
'urumqi': '''
uyghur-music|巴扎传统乐器与现场音乐|Bazaar Traditional Music Session|43.7790,87.6150|120|50,200|performance|选择公开售票演出或有当日节目单的场所，欣赏都塔尔等乐器，具体曲目与时长以场次为准。|Dutar Xinjiang|all|1|0
nan-breakfast|热馕与奶茶的新疆早餐|Xinjiang Nan and Milk Tea Breakfast|43.7830,87.6150|90|20,70|food-life|在营业馕店和餐馆选热馕与奶茶，询问口味、份量和配料，可替代当天早餐。|Uyghur nan bread|all|0|0
felt-craft|新疆毛毡与织物工艺观摩|Xinjiang Felt and Textile Demonstration|43.7790,87.6150|120|60,220|craft|联系对外开放的工艺展示点确认讲解或小型课程，不把巴扎商铺默认成可制作地毯的工坊。|Kazakh felt crafts|all|1|0
ski-lesson|南山滑雪入门课程|Nanshan Beginner Ski Lesson|43.4550,87.4070|240|350,900|winter-sport|向正规雪场预约初级教练，核对雪票、装备、头盔与保险，初学者不进入高级道，雪期以实际公告为准。|Silk Road Mountain Resort skiing|11,12,1,2,3|1|90
mountain-picnic|南山草地合法营地区野餐|Nanshan Mountain Picnic|43.3860,87.1930|180|50,220|nature|在经营者允许的营地或休息区看云杉与山地景色，不在林地生火，不跨牧场围栏，天气变化及时返回。|Baiyanggou grassland|5,6,7,8,9|0|100
''',
'kashgar': '''
copper-craft|老城铜器工坊观摩|Kashgar Copper Craft Demonstration|39.4740,75.9880|100|0,120|craft|向营业铜器店询问是否可观看锤打与纹饰制作，拍摄和体验先获允许，购买商品自愿。|Kashgar copper workshop|all|1|0
pottery|高台土陶预约体验|Kashgar Earthenware Pottery Workshop|39.4770,76.0010|150|60,220|craft|只在对外营业且可预约的工坊学习拉坯或纹样，作品烧制和寄送另查，不进入修缮中的居民房。|Kashgar pottery|all|1|0
tea-house|老城茶馆与馕的午后|Kashgar Old City Tea House Afternoon|39.4740,75.9890|120|20,80|food-life|在公开茶馆点茶、馕和小食，歌舞若恰逢公开活动可欣赏，不能把临时音乐当固定节目。|Kashgar tea house|all|0|0
instrument-demo|疏附传统乐器制作与试听|Shufu Instrument Making and Music|39.3780,75.8640|150|50,180|performance|向乐器村公开展示点预约，了解都塔尔、热瓦普制作并试听，动手课程和购琴分别询价。|Uyghur musical instruments|all|1|40
night-food|喀什夜间烤包子与烤肉寻味|Kashgar Evening Food Tasting|39.4700,75.9900|120|40,130|food-life|选择正规营业摊店搭配烤包子、烤肉和蔬菜，询问计价单位及辣度，可替代当天晚餐。|Samsa Kashgar|all|0|0
''',
'yining': '''
accordion-music|六星街手风琴现场音乐|Six Star Street Accordion Music|43.9280,81.3140|90|30,150|performance|按陈列馆或音乐庭院公开节目预约，了解巴扬手风琴与街区文化，演出时间不保证每天相同。|Yining accordion|all|1|0
ice-cream|伊宁手工冰淇淋与列巴茶点|Yining Ice Cream and Russian Bread Tasting|43.9270,81.3150|90|25,90|food-life|在营业店铺比较奶味冰淇淋与列巴，询问乳制品和坚果配料；制作参观只有店家确认后才提供。|Yining ice cream|all|0|0
xibe-archery|喀赞其锡伯族射箭入门|Kazanqi Xibe Archery Introduction|43.9000,81.3240|120|80,220|outdoor|通过新娱弓道等公开经营入口确认教练与课程，初学者在受控靶场练习，年龄、装备与保险先询问。|Xibe archery|all|1|0
leather-craft|喀赞其皮具手作预约体验|Kazanqi Leather Craft Workshop|43.9000,81.3240|150|80,260|craft|向喀赞其文化体验区对外经营工坊预约，选择适合初学者的小件，材料与成品费用先确认。|Uyghur leather craft|all|1|0
river-picnic|伊犁河傍晚野餐与看晚霞|Ili River Sunset Picnic|43.8770,81.3080|150|30,100|nature|在允许停留的岸边绿地带茶点休息，日落时刻随季节变化，避开河滩、水边险处与禁火区。|Ili River sunset|4,5,6,7,8,9,10|0|0
'''}
ALL_EXPERIENCES=[]
for cid, block in EXPERIENCES.items():
    for line in block.strip().splitlines():
        slug,name,en,coord,minutes,amount,theme,desc,article,months,conditional,road=line.split('|')
        lat,lng=map(float,coord.split(',')); low,high=map(float,amount.split(',')); road=int(road)
        e=experience(BY_ID[cid],slug,name,lat,lng,int(minutes),low,high,theme,desc,desc.split('，')[0],SOURCES[cid][0],article,
            None if months=='all' else list(map(int,months.split(','))),conditional=='1',road>0)
        e['nameEn']=en
        e['experienceType']={'wellness':'local-life','water':'nature','winter-sport':'nature','outdoor':'nature'}.get(theme,theme)
        e['durationRange']={'min':max(30,int(int(minutes)*.6)),'recommended':int(minutes),'max':int(int(minutes)*1.5)}
        e['sourceReferences']=BASE['refs'](SOURCES[cid][0],'地域文化背景；课程和场次须由经营者确认，不代表已核实在售')
        e['checkedAt']=None; e['editorialReviewedAt']=DAY
        meals={'ex-kunming-zhuanxin-tasting':['lunch'],'ex-jinghong-dai-table':['dinner'],'ex-tengchong-earthen-hotpot':['lunch'],'ex-lhasa-sweet-tea':['breakfast'],'ex-nyingchi-lulang-pot':['lunch'],'ex-xining-breakfast':['breakfast'],'ex-lanzhou-beef-noodle':['breakfast'],'ex-zhangye-noodle-workshop':['lunch'],'ex-urumqi-nan-breakfast':['breakfast'],'ex-kashgar-night-food':['dinner']}
        if e['id'] in meals:
            e['includedMeals']=meals[e['id']]
            e['priceOptions'][0]['includes']=['说明中列出的体验范围','所标餐次的用餐预算']
            e['priceOptions'][0]['excludes']=['往返交通','超出说明范围的加菜、酒水及购物']
        e['bookingUrl']='https://www.google.com/maps/search/?api=1&query='+quote(BY_ID[cid]['name']+' '+name)
        e['bookingLinkType']='venue-search'
        e['bookingNote']='地点及经营者检索入口；请先咨询当天可提供的活动，不是已确认可售的预约单。'
        if conditional=='1': e['requirements'].append('预订前取得经营者对日期、开放或课程可提供的确认。')
        if road:
            e['access']={'type':'road-transfer','oneWayMinutesEstimate':road,'basis':'editorial-estimate','requiresSeparateTransfer':True}
            e['accessNote']=f'市中心单程约 {road} 分钟公路预留，往返接驳与活动用时分开；这是规划估算。'
        if cid=='yining' and slug in ['xibe-archery','leather-craft']:
            e['sourceUrl']='https://www.yining.gov.cn/yining/c115634/202508/a7a244a7a132475ca56b1dfbe7ac51c8.shtml'
            e['sourceReferences']=BASE['refs'](e['sourceUrl'],'官方公布的文化体验区商家身份；课程内容、日期和价格需另向商家确认')
        if cid=='jinghong' and slug=='garden-night': e['sourceUrl']=e['bookingUrl']='https://www.xtbg.ac.cn/'
        if cid=='kunming' and slug=='flower-market': e['sourceUrl']=e['bookingUrl']='https://www.dounanflowers.com/'
        if cid=='zhangye' and slug=='danxia-light': e['alternativeTo']=['zhangye-colorful-danxia']; e['automaticPlanning']=False
        ALL_EXPERIENCES.append(e)
        MEDIA.append({'entityId':e['id'],'cityId':cid,'kind':'experience','name':name,'query':article,'article':article,'requiredMatch':'real-related-theme','status':'research-candidate','reuseRequired':True})

# slug | dish | English/local term | description | exact dish article/query | eating district/market | low,high
FOOD_ROWS={
'kunming': '''
bridge-noodles|过桥米线|Crossing-the-bridge rice noodles|热汤、米线与配料分开上桌，按店家提示先烫熟生食；不同套餐配料差异很大。|Crossing-the-bridge noodles|建新园米线馆及南屏街周边正规米线店|20,65
small-pot-noodles|小锅米线|Xiaoguo mixian|米线与肉末、腌菜在小锅现煮，酸辣香气鲜明，辣椒和荤素配料可先询问。|Small pot rice noodles|篆新农贸市场及周边米线店|12,30
erkuai|烧饵块|Grilled erkuai|烤热的米制饵块夹酱料、油条或其他馅料，适合早餐或小食，不同加料另收费。|Erkuai|篆新农贸市场熟食区|5,18
steam-chicken|汽锅鸡|Steam-pot chicken|陶汽锅用蒸汽凝结成汤，鸡肉与清汤适合多人分食，点餐确认整锅或小份。|Steam pot chicken|昆明老街周边滇菜馆|60,180
flower-cake|鲜花饼|Rose flower cake|玫瑰花馅配酥皮，现烤与礼盒包装价格不同，配料中可能含乳、蛋或坚果。|Flower cake|嘉华鲜花饼门店及南屏街饼店|3,12
''',
'jinghong': '''
pineapple-rice|菠萝紫米饭|Pineapple purple rice|糯米与菠萝的酸甜形成傣味餐桌常见主食，份量从单人到分享装不等。|Pineapple rice Yunnan|曼景兰傣味餐馆及江边餐饮区|18,45
lemongrass-fish|香茅草烤鱼|Lemongrass grilled fish|香茅与香草包裹鱼肉烤制，按条或重量计价，确认鱼种、份量与配菜。|Dai lemongrass grilled fish|曼听路及勐罕傣味餐馆|40,100
bamboo-rice|香竹饭|Bamboo tube rice|糯米装入竹筒烤熟带淡淡竹香，可作为小份主食，现做与预包装要区分。|Bamboo rice|曼掌村营业小吃店及告庄餐饮区|10,30
pounded-feet|舂鸡脚|Pounded chicken feet|熟鸡脚与酸辣香料舂拌，口味通常偏酸辣，购买正规熟食并问清是否去骨。|Pounded chicken feet|江边夜市及告庄正规熟食摊|20,50
nanmi|番茄喃咪与蔬菜|Dai tomato nanmi dip|烤番茄与香草做成蘸酱，配蔬菜或主食；不同喃咪可能含鱼或虾酱。|Dai tomato nanmi|曼景兰和勐罕傣味餐馆|15,40
''',
'tengchong': '''
dajiujia|大救驾|Dajiujia fried erkuai|饵块片与鸡蛋、蔬菜炒制，是腾冲代表性家常主食，荤素版本先问清。|Dajiujia|和顺古镇及腾越老城餐馆|20,45
ersi|腾冲饵丝|Tengchong ersi|米制细条可汤煮或凉拌，常配肉汤与腌菜，作为早餐可按单碗预算。|Ersi|绮罗与腾越城区早餐店|10,25
earthen-pot|腾冲土锅子|Tengchong earthen hot pot|炭火土锅里搭配肉类、蛋卷和蔬菜，多人分享更合适，按整锅确认人数。|Tengchong hot pot|和顺与腾冲城区土锅子餐馆|100,260
chickpea-jelly|鸡豆凉粉|Chickpea jelly|以鸡豆制成的凉粉可凉拌或煎食，酸辣蘸料和薄荷让口感清爽。|Jidou liangfen|和顺古镇熟食摊及绮罗小吃店|8,20
pine-pollen-cake|松花糕|Pine pollen rice cake|米糕与松花粉组成细软点心，适合小份尝味，是否加糖及包装保质期先核对。|Tengchong pine pollen cake|腾越老城糕点店及和顺小吃店|6,20
''',
'lhasa': '''
butter-tea|酥油茶|Po cha · Butter tea|茶与酥油搅打成咸香饮品，初尝可点小杯；饮用不是高原反应的预防或治疗方法。|Butter tea|仓姑寺茶馆周边及八廓藏餐馆|10,35
tsampa|糌粑|Tsampa|炒青稞粉与茶、乳品按习惯混合，店内吃法不同，先询问配料和单份份量。|Tsampa|八廓藏餐馆及酒店藏式早餐|15,40
momo|藏式包子|Momo|面皮包入肉或蔬菜蒸制，点单时问清馅料，蒸熟趁热搭配蘸料。|Momo (food)|八廓及北京东路藏餐馆|18,45
thukpa|藏面|Thukpa|肉汤和面条搭配葱与调味，适合作为茶馆早餐，不同店家的面条和肉量不同。|Thukpa|光明港琼甜茶馆周边营业茶馆|10,30
yogurt|藏式酸奶|Tibetan yogurt|发酵乳口味偏酸，可按个人喜好加糖，乳制品过敏者须先核对。|Tibetan yogurt|八廓老城正规酸奶店|10,30
''',
'nyingchi': '''
stone-chicken|鲁朗石锅鸡|Lulang stone pot chicken|鸡汤在石锅中配菌类慢煮，通常按锅分享，配菌与肉量会改变价格。|Lulang stone pot chicken|鲁朗小镇石锅鸡餐馆|160,360
tibetan-pork|藏香猪菜肴|Tibetan pork|本地餐馆以烧、炖或烤等做法呈现猪肉，询问部位、做法与份量，肉源以店家标注为准。|Tibetan pork dish|八一城区藏餐馆及鲁朗餐饮区|60,150
mushrooms|林芝时令菌汤|Nyingchi mushroom soup|正规餐馆熟制菌汤适合分享，松茸与普通菌类价差大，不自行采食不认识的野菌。|Matsutake soup|鲁朗与八一城区正规餐馆|60,220
butter-tea|酥油茶|Po cha · Butter tea|咸香热茶与乳香相配，适合小杯品尝；不将茶饮作为适应海拔的医疗手段。|Butter tea|八一城区藏餐馆与鲁朗酒店餐厅|10,35
buckwheat-cake|荞麦饼|Tibetan buckwheat pancake|荞麦面烙成薄饼，可配酥油或蜂蜜，具体甜咸做法与配料向店家确认。|Tibetan buckwheat pancake|鲁朗村落餐馆及八一藏餐馆|15,40
''',
'xining': '''
yogurt|青海老酸奶|Qinghai yogurt|碗装发酵酸奶常有乳脂层，糖可另外加入，是否巴氏消毒及储存情况购买时留意。|Qinghai yogurt|莫家街正规酸奶店及大新街食品店|6,18
niangpi|青海酿皮|Qinghai niangpi|淀粉皮与面筋搭配醋、蒜和辣椒，凉食选择卫生良好的店铺，可请店家少辣。|Niangpi|莫家街及下南关街小吃店|8,20
shouzhua|手抓羊肉|Shouzhua mutton|清煮羊肉突出肉香，通常按重量或拼盘计价，点单前确认骨肉比例与适合人数。|Shou zhua yang rou|下南关街清真餐馆|60,160
gamian|尕面片|Qinghai ga mianpian|小面片配肉汤、蔬菜热煮，适合一碗正餐，荤素与辣度可先沟通。|Qinghai noodle pieces|西宁城东区正规面馆|15,35
tianpei|甜醅|Tianpei fermented barley|青稞等谷物发酵后带自然甜香，通常冷饮或甜点食用，含发酵成分需按个人情况选择。|Tianpei|莫家街及大新街甜品店|6,18
''',
'lanzhou': '''
beef-noodle|兰州牛肉面|Lanzhou beef noodles|清汤、萝卜、香菜蒜苗与辣油搭配拉面，可选择毛细、二细等面型，肉蛋另加常单计。|Lanzhou beef noodles|马子禄、大众巷及城区正规牛肉面馆|10,30
niangpi|兰州酿皮|Lanzhou niangpi|厚薄不同的面皮配蒜汁、醋与辣椒，常配面筋，作为小食或简餐。|Niangpi|正宁路、大众巷正规小吃店|8,18
grey-peas|灰豆子|Huidouzi sweet pea soup|豌豆与枣等熬成绵软甜汤，热食口感厚润，糖量与份量向店家确认。|Huidouzi|大众巷灰豆子店及木塔巷小吃店|6,18
milk-egg|牛奶鸡蛋醪糟|Milk egg and fermented rice pudding|牛奶、鸡蛋和发酵米制成热甜品，常加坚果果干，点餐时先问过敏原。|Milk egg fermented rice Lanzhou|正宁路夜市正规甜品摊|10,25
sanpaotai|三泡台盖碗茶|Sanpaotai tea|盖碗里搭配茶叶、糖和干果等配料，适合河岸茶座慢饮，按杯或席位计价先问清。|Sanpaotai tea|黄河岸边正规茶摊|15,45
''',
'zhangye': '''
saozi|张掖臊面|Zhangye saozi noodles|细长面条搭配热汤臊子，常作早餐，配料随店家变化，按单碗预算。|Zhangye saozi noodles|甘州市场及老城面馆|8,20
fish-noodle|搓鱼面|Fish-shaped hand-rolled noodles|面团搓成两头尖的小条，因形似小鱼得名，通常并不含鱼，荤素浇头先询问。|Cuoyu noodles|甘州老城面馆|15,35
chaobola|炒拨拉|Chaobola stir-fry|在铁板上炒制肉类或杂碎并配蔬菜，份量和食材先问清，选择正规熟制餐馆。|Chaobola|甘州市场与张掖正规夜间餐饮区|25,65
juanzi-chicken|卷子鸡|Chicken with dough rolls|鸡肉与面卷同炖，让面卷吸收汤汁，常按锅分享，先确认适合人数和鸡肉份量。|Zhangye juanzi chicken|甘州城区地方菜馆|70,150
beef-rice|牛肉小饭|Beef tiny-noodle soup|名称中的小饭实际多为小面粒，配牛肉汤作早餐，点餐可问清配料和辣度。|Zhangye beef small rice|张掖老城牛肉小饭店|10,25
''',
'urumqi': '''
dapanji|大盘鸡|Dapanji|鸡块与土豆、辣椒炖炒，常配宽面分享，半份整份和追加面条分别询价。|Dapanji|乌鲁木齐正规新疆菜馆|70,180
laghman|过油肉拌面|Laghman with stir-fried lamb|拉条子配炒肉蔬菜，面与菜份量不同，是否可免费加面以店家规则为准。|Laghman|二道桥与城区拌面馆|25,50
polo|抓饭|Uyghur polo|米饭与羊肉、胡萝卜等同焖，碎肉、肉块和羊排版本价差明显。|Uyghur polo|城区正规抓饭馆|25,55
samsa|烤包子|Samsa|面皮包肉丁与洋葱烤制，外皮焦香，现烤热食要注意内馅温度。|Samsa (food)|二道桥及营业馕店|4,10
kebab|新疆烤肉|Kawap · Lamb skewers|羊肉串现烤撒调料，大小与按串计价因店而异，先问清数量和肥瘦比例。|Chuan (food)|二道桥及正规烤肉店|5,15
''',
'kashgar': '''
samsa|喀什烤包子|Samsa|羊肉洋葱馅包入方形面皮烤制，适合与茶搭配，单个和一份的数量要问清。|Samsa (food)|古城营业烤包子店及艾提尕尔周边|4,10
polo|喀什抓饭|Uyghur polo|羊肉、胡萝卜与米饭同焖，不同肉块和加配价格不同，一盘可作一餐。|Uyghur polo|喀什古城及艾提尕尔周边抓饭馆|25,60
nan|馕|Uyghur nan|馕坑烤制面饼，洋葱、芝麻等配料随品种变化，按个或重量购买，适合当主食。|Uyghur nan|古城营业馕铺及正规食品市场|3,15
lung-sausage|面肺子与米肠子|Stuffed lung and rice sausage|地方熟食以羊肺、肠及谷物制作，配辣醋调味，内脏食材接受度因人而异，选择卫生摊店。|Mianfeizi|喀什正规熟食店及古城餐饮区|15,40
kebab|喀什烤羊肉|Kawap|炭烤羊肉适合搭配馕与蔬菜，按串或重量报价需事先确认，点餐问清肥瘦。|Chuan (food)|古城夜间营业烤肉店|5,18
''',
'yining': '''
ice-cream|伊宁手工冰淇淋|Yining handmade ice cream|以乳香和绵密口感见长，店家常提供不同口味，坚果和果干配料需问清。|Yining ice cream|六星街古兰丹姆等营业冰淇淋店|10,30
leba|俄罗斯列巴|Russian rye bread|大块烘焙面包可切片配茶，原味、果仁和乳制配方不同，按份或重量询价。|Russian rye bread|六星街柳芭俄罗斯列巴房等营业面包店|15,45
kvass|格瓦斯|Kvass|谷物发酵饮品带麦香与轻微酸甜，可能含微量酒精，成分以商家说明为准。|Kvass|六星街营业饮品店|8,20
fentang|伊宁粉汤|Yining fentang|热汤里搭配粉块、肉与蔬菜，酸辣口味依店家做法，适合早餐或简餐。|Yining fentang|汉人街及喀赞其粉汤店|15,35
laghman|伊犁拌面|Ili laghman|手工拉条子配炒肉与时令蔬菜，过油肉、碎肉等浇头按店家菜单选择。|Laghman|汉人街与喀赞其营业面馆|25,50
'''}
FOODS=[]
for cid, block in FOOD_ROWS.items():
    for line in block.strip().splitlines():
        slug,name,en,desc,article,area,amount=line.split('|'); low,high=map(float,amount.split(','))
        f=food(BY_ID[cid],slug,name,en,desc,article,area,low,high,SOURCES[cid][0]); f['nameEn']=en
        f['sourceCheckedAt']=None; f['editorialReviewedAt']=DAY
        f['sourceScope']='regional-context; individual merchant menus and prices not checked'
        f['price']['note']='一份、单个或描述所列分享份量的编辑预算，非商家菜单报价；实际价格取决于配料、重量、餐馆和日期。'
        f['sourceReferences']=BASE['refs'](SOURCES[cid][0],'地域饮食背景；商家菜单、单品配方和价格需另核实')
        f['whereByCity'][cid][0]['note']='具体找店起点；不表示名单内每家每天都有此菜。请进入商家页面确认当前营业、菜单、份量和价格。'
        FOODS.append(f)
        MEDIA.append({'entityId':f['id'],'cityId':cid,'kind':'food','name':name,'query':article,'article':article,'requiredMatch':'exact-dish','status':'research-candidate','reuseRequired':True})

# slug | zh | en | coordinates | low,high | source/booking | description
HOTEL_ROWS={
'kunming': '''
green-lake|昆明翠湖宾馆|Green Lake Hotel Kunming|25.0475,102.7047|650,1600|https://www.greenlakehotel.com/|翠湖东侧的城市酒店，适合把公园、讲武堂与老城串联，早餐和景观房按房价方案确认。
sofitel|昆明索菲特大酒店|Sofitel Kunming|25.0265,102.6990|650,1800|https://all.accor.com/hotel/8529/index.en.shtml|位于南城的高层城市酒店，可将市区观光与酒店餐饮结合，具体视野取决于房型。
intercontinental|昆明洲际酒店|InterContinental Kunming|24.9740,102.6610|850,2200|https://www.ihg.com/intercontinental/hotels/us/en/kunming/kmgic/hoteldetail|滇池度假片区的园林酒店，适合湖岸慢住，前往老城需另留接驳。
grand-hyatt|昆明君悦酒店|Grand Hyatt Kunming|25.0392,102.7240|1000,2600|https://www.hyatt.com/grand-hyatt/zh-CN/kmggh-grand-hyatt-kunming|恒隆广场内的市中心酒店，餐饮购物方便，适合艺术与城市生活路线。
holiday-inn|昆明中心假日酒店|Holiday Inn Kunming City Centre|25.0380,102.7320|350,850|https://www.ihg.com/holidayinn/hotels/us/en/kunming/kmgdf/hoteldetail|市中心连锁酒店，可用公共交通探索城市，房价是否含早和取消条件按日期核对。
''',
'jinghong': '''
intercontinental|西双版纳洲际度假酒店|InterContinental Xishuangbanna Resort|21.9620,100.8030|800,2400|https://www.ihg.com.cn/intercontinental/hotels/cn/zh/jing-hong/jhgxa/hoteldetail|曼弄枫片区园林度假酒店，适合留出泳池和园区休息时间，出入城区需接驳。
pullman|西双版纳融创铂尔曼度假酒店|Pullman Resort Xishuangbanna|22.0360,100.7440|550,1500|https://pullman.accor.com/zh/hotels/xishuangbanna/B839.html|融创度假区的园林酒店，住宿与游乐演艺分别核价，不能把度假区全部服务视为房价包含。
sheraton|西双版纳云投喜来登大酒店|Sheraton Grand Xishuangbanna Hotel|21.9300,100.7200|550,1800|https://www.marriott.com.cn/hotels/jhgsi-sheraton-grand-xishuangbanna-hotel/overview/|嘎洒方向的度假酒店，适合安静慢住；夜间逛告庄需另安排返程。
four-points|西双版纳福朋喜来登酒店|Four Points by Sheraton Xishuangbanna|22.0150,100.7940|350,1000|https://www.marriott.com.cn/hotels/jhgxp-four-points-xishuangbanna/overview/|清泉路上的城市度假型酒店，适合城区与近郊组合，接站接机服务按实际政策确认。
anantara|西双版纳安纳塔拉度假酒店|Anantara Xishuangbanna Resort|21.9160,101.2600|900,2800|https://www.anantara.com/en/xishuangbanna|位于勐仑附近而非景洪市中心，适合植物园与雨林方向单独住宿段，城区往返交通另计。
''',
'tengchong': '''
banyan|腾冲玛御谷悦榕庄|Banyan Tree Tengchong|25.0920,98.5270|1500,4500|https://www.banyantree.com/cn/china/tengchong|玛御谷的温泉别墅与汤屋度假选择，温泉、餐食与活动包含范围随套餐不同。
bolian|腾冲和顺柏联酒店|Brilliant Resort and Spa Tengchong|25.0000,98.4480|1800,5200|https://www.brilliantresorts.com/|和顺田园旁的高端温泉度假选择，预订时明确腾冲物业及房型，独立餐饮和疗程另核价。
lost-stone|腾冲石头纪温泉度假酒店|The Lost Stone Villas and Spa|25.4300,98.4070|1300,4200|https://www.hyatt.com/unbound-collection/en-US/tczub-the-lost-stone-villas-and-spa|云峰山方向的别墅酒店，远离市区，适合把周边景观与度假合并，房型和温泉套餐分别核价。
vinetree|腾冲康藤高黎贡帐篷营地|Vinetree Gaoligong Tented Resort|25.3530,98.6430|1800,4500|https://www.vinetreetents.com/|山地帐篷营地，需提前核对接驳、套餐与道路条件，不能按市中心酒店安排晚间往返。
ji-rehai|全季酒店（腾冲热海路店）|JI Hotel Tengchong Rehai Road|24.9970,98.5020|220,650|https://m.ctrip.com/webapp/hotel/tengchong1819/h49|热海路城区连锁酒店，靠近绮罗古镇方向，温泉和接机等服务是否包含须按实际房价方案确认。
''',
'lhasa': '''
shangri-la|拉萨香格里拉|Shangri-La Lhasa|29.6510,91.0880|850,2200|https://www.shangri-la.com/lhasa/shangrila/|靠近罗布林卡与博物馆的城市酒店，适合文化场馆组合，供氧等设施以实际房型说明为准。
st-regis|拉萨瑞吉度假酒店|The St. Regis Lhasa Resort|29.6440,91.1390|1100,3200|https://www.marriott.com/en-us/hotels/lxaxr-the-st-regis-lhasa-resort/overview/|老城东南侧高端酒店，藏式设计与庭院适合慢住，接送和餐饮依套餐分别确认。
intercontinental|拉萨圣地天堂洲际大饭店|InterContinental Lhasa Paradise|29.6500,91.1940|650,1800|https://www.ihg.com/intercontinental/hotels/us/en/lhasa/lxaha/hoteldetail|城东的大型酒店，距老城需乘车，适合希望酒店内有较多休息空间的旅客。
home2-museum|拉萨西藏博物馆希尔顿惠庭酒店|Home2 Suites by Hilton Lhasa Tibet Museum|29.6450,91.0890|350,1000|https://www.hilton.com/en/locations/china/lhasa/|西藏博物馆片区的连锁套房型选择，查品牌城市页中同名物业，早餐与洗衣设施按实际确认。
four-points|拉萨福朋喜来登酒店|Four Points by Sheraton Lhasa|29.6450,91.1420|300,850|https://www.marriott.com/en-us/hotels/lxasi-four-points-by-sheraton-lhasa/overview/|老城东侧的连锁酒店，适合城市参观与茶馆休息交替安排，进出城交通另计。
''',
'nyingchi': '''
hilton|林芝工布庄园希尔顿酒店|Hilton Linzhi Resort|29.2640,94.3500|650,2000|https://www.hilton.com.cn/zh-cn/hotels/hghlihi-hilton-linzhi-resort|靠近米林机场、距八一城区较远的河谷度假酒店，适合抵达或离开日前后慢住，不能当作城区落脚点。
poly|林芝保利雅途酒店|Artel Linzhi Poly Hotel|29.7870,94.7310|600,1800|https://www.polyhotels.com/zh-CN/hotels/lzyt/hotel_details|位于鲁朗旅游小镇的湖景与园景酒店，适合鲁朗住宿段，前往八一城区约需一段山路接驳。
songtsam-namcha|松赞南迦巴瓦山居|Songtsam Namcha Barwa Lodge|29.5420,94.9090|2200,5500|https://www.songtsam.com/|峡谷与索松方向的山居选择，须按酒店确认的接驳与套餐安排，雪山可见度受天气影响。
songtsam-lulang|松赞林芝巴松措林卡|Songtsam Basong Tso Linka|30.0210,93.9920|2000,5500|https://www.songtsam.com/|巴松措方向度假选择，远离八一城区，应纳入湖区住宿段，确认具体物业名称与当前营业。
bayi-budget|林芝岷山大酒店|Minshan Hotel Nyingchi|29.6620,94.3600|250,750|https://hotels.ctrip.com/hotels/list?keyword=%E6%9E%97%E8%8A%9D%E5%B2%B7%E5%B1%B1%E5%A4%A7%E9%85%92%E5%BA%97|八一城区的城市酒店选择，适合从市区分日出发，房型与早餐安排按预订页面核实。
''',
'xining': '''
sofitel|西宁新华联索菲特大酒店|Sofitel Xining|36.643311,101.719553|650,1600|https://all.accor.com/hotel/9567/index.en.shtml|海湖新区高层酒店，适合现代商业配套与休整日，去老城餐饮区另留接驳。
wanda|西宁富力万达文华酒店|Wanda Vista Xining|36.6400,101.7150|550,1500|https://www.wandahotels.com/hotel/xining|海湖新区酒店，可与周边商业休闲组合，夏季房价和早餐人数按实际方案确认。
holiday-express|西宁火车站智选假日酒店|Holiday Inn Express Xining Railway Station|36.6210,101.8180|250,750|https://www.ihg.com/xining-mainland-china|靠近西宁站方向的连锁酒店，适合铁路中转与城东美食路线，步行入口距离以物业地址确认。
fairfield|西宁城北万枫酒店|Fairfield by Marriott Xining North|36.7030,101.7500|300,800|https://www.marriott.com/en-us/hotels/xnnfi-fairfield-xining-north/overview/|城北片区连锁酒店，适合藏文化博物院等北线活动，与老城并非同一片步行区。
holiday-hot-spring|西宁温泉假日酒店|Holiday Inn Xining Hot-Spring|36.5260,101.7490|350,1000|https://www.ihg.com/holidayinn/hotels/us/en/xining/xnnht/hoteldetail|城南临河路酒店，温泉及水上乐园是否包含按套餐确认，城区观光需另留交通。
''',
'lanzhou': '''
hyatt|兰州凯悦酒店|Hyatt Regency Lanzhou|36.0620,103.8460|650,1800|https://www.hyatt.com/hyatt-regency/en-US/lhwrl-hyatt-regency-lanzhou|黄河沿岸的城市高层酒店，可结合河岸文化线路，河景房型和餐食单独核对。
crowne|兰州皇冠假日酒店|Crowne Plaza Lanzhou|36.0850,103.8420|550,1500|https://www.ihg.com/crowneplaza/hotels/us/en/lanzhou/lhwcp/hoteldetail|黄河北岸会展片区酒店，房价包含服务按日期确认，往返老城需跨河接驳。
hilton|兰州盛达希尔顿酒店|Hilton Lanzhou City Center|36.0520,103.8440|600,1600|https://www.hilton.com/en/hotels/lhwtrhi-hilton-lanzhou-city-center/|市中心高层酒店，适合城市观光与餐饮，车站和机场交通按出发时段另算。
sheraton|兰州众邦喜来登酒店|Sheraton Lanzhou Anning|36.0960,103.7140|450,1200|https://www.marriott.com.cn/hotels/lhwas-sheraton-lanzhou-anning/overview/|安宁区万新南路的酒店，适合安宁与奥体方向住宿，不把安宁与城关区当作相邻步行范围。
holiday-express|兰州建兰智选假日酒店|Holiday Inn Express Lanzhou Jianlan|36.0680,103.7750|280,750|https://www.ihg.com/holidayinnexpress/hotels/us/en/lanzhou/lhwlj/hoteldetail|七里河区酒店，适合西站与甘肃省博物馆方向行程，早餐人数和停车政策按实际预订确认。
''',
'zhangye': '''
holiday-express|张掖智选假日酒店|Holiday Inn Express Zhangye|38.9460,100.4310|250,650|https://www.ihg.com/holidayinnexpress/hotels/us/en/zhangye/yzysp/hoteldetail|环城西路酒店，适合湿地与城内参观，车站与机场不在步行范围，接驳另留。
hampton|张掖西站希尔顿欢朋酒店|Hampton by Hilton Zhangye West Railway Station|38.9240,100.4370|300,800|https://www.hilton.com/zh-hans/hotels/yzyhnhx-hampton-zhangye-west-railway-station/|丹霞东路连锁酒店，适合高铁到达后落脚，站名不表示紧邻站台，实际车程向酒店确认。
huachen|张掖华辰国际大酒店|Huachen International Hotel Zhangye|38.9384,100.4675|220,650|https://hotels.ctrip.com/hotels/1426775.html|老城东大街酒店，步行探索老城较方便，房间风格与装修批次按实际房型确认。
zhangye-hotel|张掖宾馆|Zhangye Hotel|38.9660,100.4330|450,1200|https://hotels.ctrip.com/hotels/list?keyword=%E5%BC%A0%E6%8E%96%E5%AE%BE%E9%A6%86|滨河新区湖畔园林酒店，适合休息和度假，城区餐饮与景区接送另外安排。
tianyu|张掖天域绿尔佳酒店|Tianyu Lverjia Hotel Zhangye|38.9320,100.4510|180,550|https://www.zhangye.gov.cn/chzy/zyly/lyzn/202303/t20230318_1008031.html|甘泉巷的城市酒店，官方名录可核实身份，当前营业、房型与预订价格需联系具体商家。
''',
'urumqi': '''
hilton|乌鲁木齐希尔顿酒店|Hilton Urumqi|43.9050,87.6270|650,1700|https://www.hilton.com/en/hotels/urchhhi-hilton-urumqi/|红光山会展片区的酒店，适合北部文化中心与休息日，去大巴扎等南城活动另留交通。
conrad|乌鲁木齐康莱德酒店|Conrad Urumqi|43.8270,87.5850|1000,2600|https://www.hilton.com/en/hotels/urccici-conrad-urumqi/|友好路商业片区高端酒店，适合博物馆与城市餐饮组合，景观和行政礼遇按房型确认。
universal|乌鲁木齐环球国际大酒店|Universal Hotel Urumqi|43.8610,87.5720|450,1200|https://hotels.ctrip.com/hotels/list?keyword=%E4%B9%8C%E9%B2%81%E6%9C%A8%E9%BD%90%E7%8E%AF%E7%90%83%E5%9B%BD%E9%99%85|城区商务酒店，适合城市观光与长途前后休整，接送、房型与当前地址在商家页面核实。
jinjiang|乌鲁木齐锦江国际酒店|Jin Jiang International Hotel Urumqi|43.8110,87.6150|450,1200|https://hotels.ctrip.com/hotels/list?keyword=%E4%B9%8C%E9%B2%81%E6%9C%A8%E9%BD%90%E9%94%A6%E6%B1%9F%E5%9B%BD%E9%99%85|城市中心片区酒店，适合红山与餐饮线路，房价是否含早、停车以具体日期为准。
holiday-express|乌鲁木齐站智选假日酒店|Holiday Inn Express Urumqi Station|43.8460,87.5010|280,850|https://www.ihg.com/holidayinnexpress/hotels/cn/zh/urumqi/urcqi/hoteldetail|高铁南四路99号的连锁酒店，适合乌鲁木齐站中转，不能把该站与乌鲁木齐南站混用。
''',
'kashgar': '''
radisson|喀什深业丽笙酒店|Radisson Blu Hotel Kashgar|39.4470,75.9900|500,1500|https://www.radissonhotels.com/en-us/hotels/radisson-blu-kashgar|城市南侧的国际品牌酒店，适合长途旅行前后休息，古城游览需另算接驳。
hampton|喀什希尔顿欢朋酒店|Hampton by Hilton Kashgar|39.4460,76.0140|300,950|https://www.hilton.com/zh-hans/hotels/khgkihx-hampton-kashgar/|和平路110号的连锁城市酒店，适合铁路或机场前后休整，古城与酒店之间仍需接驳。
holiday-express|喀什古城智选假日酒店|Holiday Inn Express Kashgar Downtown|39.4620,75.9720|250,850|https://www.ihg.com/kashgar-mainland-china|市区智选假日物业，预订以英文 Downtown 与品牌当前中文名称核对，不默认就在古城步行巷内。
seman|喀什色满宾馆|Seman Hotel Kashgar|39.4750,75.9710|220,750|https://hotels.ctrip.com/hotels/list?keyword=%E5%96%80%E4%BB%80%E8%89%B2%E6%BB%A1%E5%AE%BE%E9%A6%86|与近代领事馆历史相关的庭院酒店，房间楼栋与装修条件差异应查看具体房型。
qiniwak|喀什其尼瓦克国际酒店|Qinibagh Hotel Kashgar|39.4800,75.9770|280,950|https://hotels.ctrip.com/hotels/list?keyword=%E5%96%80%E4%BB%80%E5%85%B6%E5%B0%BC%E7%93%A6%E5%85%8B|老城西北侧历史酒店片区，旧建筑与客房楼栋不同，预订明确所住楼栋及接送政策。
''',
'yining': '''
hampton|伊宁希尔顿欢朋酒店|Hampton by Hilton Yining|43.9310,81.2910|300,900|https://www.hilton.com/en/hotels/yindehx-hampton-yining/|西环路连锁酒店，适合机场或火车站前后落脚，去喀赞其与河滨仍需接驳。
intercontinental|伊宁洲际酒店|InterContinental Yining|43.8790,81.2650|1000,2800|https://www.ihg.com/intercontinental/hotels/gb/en/yining/yinng/hoteldetail|滨河大道高端酒店，适合把酒店休息与河谷旅行结合，园区与市区交通按实际地址确认。
even|伊宁逸衡酒店|EVEN Hotel Yining|43.8790,81.2650|500,1500|https://www.ihg.com/yining-mainland-china|滨河大道997号的运动健康主题连锁酒店，与洲际为不同物业，按品牌城市页核对预订。
home2|伊宁希尔顿惠庭酒店|Home2 Suites by Hilton Yining|43.9510,81.2800|280,850|https://www.hilton.com/en/locations/china/ili-kazakh-autonomous-prefecture/|伊宁市连锁套房型酒店，适合连续住几晚，具体地址、洗衣和早餐服务在品牌物业页确认。
ili-hotel|伊犁宾馆|Yili Hotel|43.9160,81.3200|350,1100|https://hotels.ctrip.com/hotels/list?keyword=%E4%BC%8A%E7%8A%81%E5%AE%BE%E9%A6%86|城区园林与庭院风格酒店，适合多日河谷行程前后休息，房价和所在楼栋以预订确认单为准。
'''}
HOTELS=[]
for cid,block in HOTEL_ROWS.items():
    for line in block.strip().splitlines():
        slug,name,en,coord,amount,url,desc=line.split('|'); lat,lng=map(float,coord.split(',')); low,high=map(float,amount.split(','))
        h=hotel(BY_ID[cid],slug,name,url,lat,lng,low,high,desc); h['nameEn']=en
        h['article']=en; h['image']={'url':'','sourceUrl':url}; h['imageScope']='exact-property'; h.pop('imageContextNote',None)
        h['coordinateAccuracy']='approximate-neighbourhood'; h['checkedAt']=None; h['editorialReviewedAt']=DAY
        h['sourceReferences']=BASE['refs'](url,'具体住宿身份与预订入口；当前房态、价格、坐标和图片转载权需另核验')
        if 'ctrip.com' in url: h['sourceReferences'][0]['kind']='travel-platform'
        if '/locations/' in url or '-mainland-china' in url: h['sourceReferences'][0]['scope']='品牌城市目录中的具体物业；须点击同名酒店确认地址、房态和价格'
        HOTELS.append(h)
        MEDIA.append({'entityId':h['id'],'cityId':cid,'kind':'hotel','name':name,'query':en,'article':en,'propertySourceUrl':url,'requiredMatch':'exact-property','status':'research-candidate','reuseRequired':True,'permissionStatus':'not-yet-confirmed'})

for c in CITIES:
    c['guide']['foodHighlights']=[{'name':f['name'],'description':f['description']} for f in FOODS if c['id'] in f['cityIds']]
    # Do not ship guessed Wikidata identifiers: identity resolution is a separate reviewed step.
    c.pop('wikidataId',None)
    MEDIA.append({'entityId':'city:'+c['id'],'cityId':c['id'],'kind':'city','name':c['name'],'query':c['nameEn'],'article':c['nameEn'].split(',')[0],'requiredMatch':'exact-city','status':'research-candidate','reuseRequired':True})
    assert len(c['attractions'])==20
    assert len([x for x in ALL_EXPERIENCES if x['cityId']==c['id']])==5
    assert len([x for x in HOTELS if x['cityId']==c['id']])==5
    assert len([x for x in FOODS if c['id'] in x['cityIds']])==5

for folder,rows in [('expansion',CITIES),('experience-expansion',ALL_EXPERIENCES+HOTELS),('food-expansion',FOODS)]:
    (ROOT/'data'/folder/'china-west-20261007.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
photo_dir=ROOT/'data'/'photo-research'; photo_dir.mkdir(exist_ok=True)
photo_path=photo_dir/'china-west-20261007.json'
old_photos={r['entityId']:r for r in json.loads(photo_path.read_text(encoding='utf-8')).get('entries',[])} if photo_path.exists() else {}
for r in MEDIA:
    old=old_photos.get(r['entityId'],{})
    if old.get('candidates'): r['candidates']=old['candidates']; r['status']=old['status']
photo_path.write_text(json.dumps({'updatedAt':DAY,'note':'Candidates require subject review and reusable-license confirmation; not completed assets.','entries':MEDIA},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'cities':len(CITIES),'attractions':sum(len(c['attractions']) for c in CITIES),'experiences':len(ALL_EXPERIENCES),'foods':len(FOODS),'hotels':len(HOTELS),'photoCandidates':len(MEDIA)}))
