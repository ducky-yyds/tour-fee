"""Curated China east/south destination pack. Only writes owned expansion packs.

All unspecified prices, coordinates and durations are editorial planning estimates.
Source URLs establish identity/cultural context, never a claim of live availability.
"""
import json
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DAY = '2026-10-07'
CITIES, EXPERIENCES, FOODS, PHOTOS = [], [], [], {}

SOURCES = {
 'huangshan': ['https://whc.unesco.org/en/list/547/', 'https://whc.unesco.org/en/list/1002/', 'https://www.huangshan.gov.cn/', 'https://www.banyantree.com/china/huangshan/experiences/local-activities'],
 'hefei': ['https://www.mct.gov.cn/whzx/qgwhxxlb/ah/202602/t20260224_964785.htm','https://www.mct.gov.cn/whzx/qgwhxxlb/ah/202308/t20230817_946688.htm','https://www.shucheng.gov.cn/group3/M00/2D/8D/wKgSG2I2smGAH_riAAXwzEuxA3w203.pdf'],
 'fuzhou': ['https://www.fuzhou.gov.cn/zwgk/gzdt/tpxw/202310/t20231004_4690570.htm','https://www.fuzhou.gov.cn/zwgk/gzdt/rcyw/202602/t20260219_5286941.htm','https://www.fuzhou.gov.cn/zwgk/ghjh/zxgh/202411/P020251226686285979225.pdf'],
 'wuyishan': ['https://www.forestry.gov.cn/c/www/zrgjgy/582347.jhtml','https://zhuanti.mct.gov.cn/xcss2024_shjlzzxc/fujian/detail/6822.html','https://gjcr.moa.gov.cn/cty/202005/t20200518_6344449.htm'],
 'jingdezhen': ['https://www.jdz.gov.cn/zjcd/mljdz/lylx/t933723.shtml','https://jdz.gov.cn/zwgk/zfgb/2024n/d3q/szfwj_3307/t958190.shtml','https://www.jdz.gov.cn/zjcd/mljdz/sj/t932854.shtml','https://www.jdz.gov.cn/zjcd/mljdz/tscd/t995407.shtml'],
 'yangzhou': ['https://www.yangzhou.gov.cn/','https://en.wikipedia.org/wiki/Yangzhou','https://www.yzmuseum.com/'],
 'shaoxing': ['https://www.sx.gov.cn/art/2024/10/17/art_1229354839_59563128.html','https://sxwg.sx.gov.cn/art/2021/8/27/art_1647996_58941849.html','https://sxwg.sx.gov.cn/art/2024/4/1/art_1229454477_4143816.html'],
 'chaozhou': ['https://www.chaozhou.gov.cn/ywdt/czyw/content/post_3707534.html','https://www.chaozhou.gov.cn/czwgltj/gkmlpt/content/3/3844/mpost_3844279.html','https://www.chaozhou.gov.cn/ywdt/czyw/content/mpost_3843973.html'],
 'macau': ['https://www.macaotourism.gov.mo/en/sightseeing/macao-world-heritage','https://www.macaotourism.gov.mo/en/sightseeing/museums-and-galleries','https://www.macaotourism.gov.mo/en/'],
 'leshan': ['https://www.leshan.gov.cn/lsswszf/zjls/index.html','https://whc.unesco.org/en/list/779/','https://www.lsszq.gov.cn/szq/zxta/2023081715395732326300000.shtml'],
 'guiyang': ['https://english.guiyang.gov.cn/','https://yunyan.english.guiyang.gov.cn/2026-07/22/c_1199267.htm','https://english.guiyang.gov.cn/2024-12/23/c_1055734.htm','https://english.guiyang.gov.cn/kaiyang/2026-07/24/c_1199871.htm'],
}
PLACE_GUIDES={
 'huangshan':'https://www.huangshan.gov.cn/',
 'hefei':'https://www.mct.gov.cn/whzx/qgwhxxlb/ah/202308/t20230817_946688.htm',
 'fuzhou':'https://www.fuzhou.gov.cn/zwgk/gzdt/tpxw/202310/t20231004_4690570.htm',
 'wuyishan':'https://zhuanti.mct.gov.cn/xcss2024_shjlzzxc/fujian/detail/6822.html',
 'jingdezhen':'https://www.jdz.gov.cn/zjcd/mljdz/lylx/t933723.shtml',
 'yangzhou':'https://en.wikipedia.org/wiki/Yangzhou',
 'shaoxing':'https://www.sx.gov.cn/art/2024/10/17/art_1229354839_59563128.html',
 'chaozhou':'https://www.chaozhou.gov.cn/ywdt/czyw/content/post_3707534.html',
 'macau':'https://www.macaotourism.gov.mo/en/sightseeing',
 'leshan':'https://www.leshan.gov.cn/lsswszf/zjls/index.html',
 'guiyang':'https://english.guiyang.gov.cn/',
}

def wiki(name):
    return 'https://zh.wikipedia.org/wiki/' + quote(name.replace(' ', '_'))

def refs(urls, scope='地点身份、背景及参观范围；预算与用时为编辑估算'):
    if isinstance(urls, str): urls = [urls]
    return [{'name': u.split('/')[2], 'url': u, 'kind': 'encyclopedia' if 'wikipedia.org' in u else 'primary-source' if any(x in u for x in ['.gov.', 'unesco.org', 'hyatt.com', 'ihg.com', 'shangri-la.com', 'hilton.com', 'marriott.com', 'banyantree.com']) else 'reference', 'scope': scope, 'checkedAt': DAY} for u in dict.fromkeys(urls)]

def image(name, scope='exact-place'):
    return {'url':'', 'sourceUrl':wiki(name), 'scope':scope}

def price(c, low, high, source, unit='person'):
    return {'low':low,'high':high,'currency':c['currency'],'unit':unit,'type':'estimate','sourceUrl':source,'checkedAt':None,
            'note':'编辑规划预算，并非指定日期的报价。'+('零门票仅指描述中的公共参观范围，不含消费、接驳、讲解及另售项目。' if low==0 and high==0 else '实际服务范围、数量及税费以所选日期的商家说明为准。')}

def city(cid, name, en, province, lat, lng, iata, days, intro, transport, article=None, currency='CNY', daily=None, monthly=None):
    c={'id':cid,'name':name,'nameEn':en,'countryCode':'MO' if cid=='macau' else 'CN','country':'中国澳门' if cid=='macau' else '中国','region':'亚洲','currency':currency,'isoRegion':province,'lat':lat,'lng':lng,'iata':iata,
       'article':article or en,'aliases':[name,en], 'contentTier':'priority','tierReason':'全国均衡补齐详细目的地，重点覆盖地方文化与可参与体验','image':image(name),
       'tagline':intro,'description':intro,'tags':['地方文化','特色饮食','慢游体验'],'sourceReferences':refs(SOURCES[cid]),'sourceCheckedAt':DAY,'officialTourismUrl':SOURCES[cid][0],
       'daily':dict(zip(['lodging','food','transport','misc'], daily or [[160,380,1000],[45,110,260],[20,60,180],[15,40,100]])),
       'monthly':dict(zip(['rent','utilities'], monthly or [[1300,2800,6000],[160,320,650]])),
       'budgetBasis':{'type':'editorial-estimate','updatedAt':DAY,'note':'三档规划预留，非实时商家报价。住宿按每间每晚；饮食、交通及杂项按每成人每天；月租和水电按每间每月。节假日另行核价。'},
       'planningProfile':'balanced','tripDuration':{'min':max(2,days-1),'days':days,'max':days+2,'reason':transport},'transportNote':transport,'attractions':[],
       'guide':{'cityId':cid,'intro':intro,'foodHighlights':[],'neighborhoods':[],'experienceIntro':'选择真正感兴趣的体验，并为预约、季节变化和城外接驳留出时间。'}}
    CITIES.append(c); return c

def places(c, text):
    # slug | Chinese | English | latitude | longitude | minutes | low | high | type | prose | remote
    for raw in text.strip().splitlines():
        r=raw.strip().split('|'); slug, name, en, lat,lng,minutes,low,high,category,desc=r[:10]; remote=len(r)>10 and r[10]=='R'
        source=PLACE_GUIDES[c['id']]; mins=int(minutes)
        p={'id':f'{c["id"]}-{slug}','name':name,'nameEn':en,'lat':float(lat),'lng':float(lng),'coordinateAccuracy':'approximate','coordinateNote':'规划用近似位置；实际入口以官方导览与预约地址为准。',
           'durationHours':mins/60,'durationRange':{'min':max(20,int(mins*.6)),'recommended':mins,'max':int(mins*1.5)},'durationBasis':'editorial-estimate','category':category,
           'activityType':'nature' if any(x in category for x in ['自然','山地','公园','湿地']) else 'culture','description':desc,'article':en,'image':image(name),'priority':70 if remote else 85,
           'visitRole':'optional' if remote else 'essential','automaticPlanning':not remote,'features':[category,'需安排城外往返' if remote else '可调整停留时间'],
           'sourceUrl':source,'sourceCheckedAt':DAY,'sourceReferences':refs([source,SOURCES[c['id']][0]],'目的地文化与游览区域参考；坐标、时长与预算为编辑规划参数，开放及票种需另核'),'price':price(c,int(low),int(high),source),
           'bestTime':'按具体日期确认开放与预约；推荐用时仅计游览，未含接驳、排队。'}
        if remote: p['accessNote']='位于远郊或周边县区，需单独安排往返；不与市中心项目按步行衔接。'
        c['attractions'].append(p)

def experiences(c,text):
    # slug|name|english|lat|lng|minutes|low|high|theme|description|photo subject|source index|months|flags
    for raw in text.strip().splitlines():
        r=raw.strip().split('|');slug,name,en,lat,lng,minutes,low,high,theme,desc,subject,src=r[:12]
        months=[int(n) for n in r[12].split(',')] if len(r)>12 and r[12] else list(range(1,13));flags=r[13] if len(r)>13 else '';source=SOURCES[c['id']][int(src)];mins=int(minutes)
        theme={'water':'nature','heritage':'local-life'}.get(theme,theme)
        e={'id':f'ex-{c["id"]}-{slug}','cityId':c['id'],'kind':'experience','name':name,'nameEn':en,'lat':float(lat),'lng':float(lng),'coordinateAccuracy':'approximate','coordinateNote':'活动片区近似定位，实际集合点以预约说明为准。',
           'durationMinutes':mins,'durationRange':{'min':max(20,int(mins*.6)),'recommended':mins,'max':int(mins*1.5)},'experienceType':theme,'description':desc,'tagline':en,'localContext':desc.split('；')[0],
           'features':[{'craft':'传统手艺','food-life':'地方餐桌','performance':'现场演出','nature':'自然体验','festival':'季节民俗','water':'水上生活','wildlife':'自然观察'}.get(theme,'地方文化')],
           'provider':'以来源中的场馆或当地经营者为咨询入口','address':name,'sourceUrl':source,'bookingUrl':source,'checkedAt':DAY,'sourceReferences':refs(source),
           'article':subject,'image':image(subject,'related-theme'),'imageScope':'related-theme','imageContextNote':f'{subject}相关实景主题，具体参与内容以预约说明为准。',
           'automaticPlanning':not ('R' in flags or 'D' in flags),'requirements':['活动日期、余位、集合地点及费用包含内容须先确认。'],'seasonality':{'months':months,'dateSpecific':'D' in flags,'note':'仅在当年公布的活动日期参与，不代表列出的月份每天举办。' if 'D' in flags else '天气、场地开放与运营安排可能影响参与。'},
           'availabilityNote':'选择不等于预约成功；山地与远郊体验需另留往返。','priceOptions':[{'id':'planning','name':'活动预算',**price(c,int(low),int(high),source),'includes':['所述体验的预算预留'],'excludes':['城外接驳','未注明的餐饮和材料邮寄']} ]}
        if 'R' in flags: e['accessNote']='远郊体验，需单独预留往返车程，建议作为半日或整日路线。'
        EXPERIENCES.append(e)

def foods(c,text):
    # slug|name|english|description|where|low|high|article
    for raw in text.strip().splitlines():
        slug,name,en,desc,where,low,high,article=raw.strip().split('|');source=SOURCES[c['id']][min(1,len(SOURCES[c['id']])-1)]
        f={'id':f'food-{c["id"]}-{slug}','cityIds':[c['id']],'name':name,'nameEn':en,'localName':name+' · '+en,'description':desc,'article':article,'articleScope':'dish','image':image(article),
           'imageQuery':name+' food '+en,'sourceUrl':source,'sourceReferences':refs(source,'地方饮食文化参考，预算非店家报价；用餐地点为检索起点，菜单需当日核对'),'sourceCheckedAt':DAY,'sourceStatus':'reference','sourceScope':'regional-food-context','catalogOrigin':'maintained-definition',
           'price':price(c,int(low),int(high),source,'serving'),'servingNote':'按一份或介绍中的份量预留；替代当天餐饮选择，不与每日饮食预算重复累加。',
           'whereByCity':{c['id']:[{'name':where,'kind':'area','sourceUrl':'https://www.google.com/maps/search/?api=1&query='+quote(c['name']+' '+where+' '+name),'note':'具体店铺与在售菜单以当日信息为准；市场和街区是寻味起点。'}]}}
        FOODS.append(f); c['guide']['foodHighlights'].append({'name':name,'description':desc})

def hotels(c,text):
    # slug|Chinese|English|lat|lng|low|high|description|official or listing URL
    for raw in text.strip().splitlines():
        slug,name,en,lat,lng,low,high,desc,url=raw.strip().split('|')
        e={'id':f'hotel-{c["id"]}-{slug}','cityId':c['id'],'kind':'hotel','name':name,'nameEn':en,'lat':float(lat),'lng':float(lng),'coordinateAccuracy':'approximate','coordinateNote':'规划位置，请按所订房型页面确认实际地址。',
           'durationMinutes':0,'description':desc,'tagline':desc,'features':['每间每晚','按日期核价'],'sourceUrl':url,'bookingUrl':url,'sourceReferences':refs(url,'物业身份与位置；价格是编辑预算'),'checkedAt':DAY,
           'article':en,'image':{'url':'','sourceUrl':url},'imageQuery':en+' '+c['nameEn']+' hotel exterior','imageScope':'exact-place',
           'priceOptions':[{'id':'room','name':'每间每晚规划预算',**price(c,int(low),int(high),url,'room-night'),'includes':['客房预算'],'excludes':['房价未包含的早餐','接送','税费及附加服务']} ]}
        EXPERIENCES.append(e)

# Huangshan is based in Tunxi; scenic mountain and county routes are explicitly remote.
c=city('huangshan','黄山','Huangshan','CN-AH',29.715,118.337,'TXN',4,'在屯溪老街尝徽州滋味，再把整日交给黄山石峰或皖南古村；山上、汤口和屯溪是不同的住宿基地。','屯溪步行与公交结合；黄山北站接驳市区另留时间。黄山风景区、黟县古村和歙县各成一条线路，不把全域按市内路线串接。','Huangshan City')
places(c,'''mountain|黄山风景区|Huangshan Scenic Area|30.133|118.166|420|190|400|山地自然|选择前山或后山的适合体力路线，松树、花岗岩峰与云海需要慢慢看；预算含门票及部分接驳预留，缆车和山上住宿另核。|R
tunxi|屯溪老街|Tunxi Old Street|29.708|118.301|100|0|0|历史街区|沿店铺与马头墙观察徽商留下的城市肌理，老字号茶庄和小吃可以穿插休息，购物另计。
liyang|黎阳水街|Liyang Water Street|29.702|118.290|75|0|0|滨水街区|跨桥看老宅与新店共处的水街，适合把晚餐和夜景连在一起，酒吧与演出按具体消费选择。
museum|中国徽州文化博物馆|China Huizhou Culture Museum|29.719|118.280|120|0|0|地方博物馆|从徽商、宗族和民居构件理解徽州文化，参观前核对预约与闭馆日。
cheng-houses|程氏三宅|Three Cheng Family Houses|29.711|118.314|70|20|40|徽州民居|在明代民居的厅堂与天井间读懂住宅结构，保护建筑开放范围和联票内容需现场确认。
daizhen|戴震纪念馆|Dai Zhen Memorial Hall|29.709|118.303|50|0|20|人物纪念馆|通过戴震生平与学术陈列认识徽州学风，可和屯溪老街搭配，避免在狭小展厅匆忙穿行。
xixinan|西溪南古村|Xixinan Village|29.824|118.273|150|0|0|古村与湿地|在公开村道和枫杨林步道看水边聚落，不踩踏湿地；雨后木桥湿滑，商业院落项目另计。|R
chengkan|呈坎|Chengkan Village|29.924|118.290|180|80|120|徽州古村|围绕宗祠、巷道和池塘认识徽州村落，不把整个村子只当作拍照背景，距离屯溪需单独接驳。|R
tangmo|唐模古村|Tangmo Village|29.861|118.304|120|50|90|古村园林|沿溪看水口园林与石桥，村民生活空间和经营场所分开参观，适合与同方向的潜口择一组合。|R
qiankou|潜口民宅|Qiankou Dwellings|29.861|118.277|90|0|40|民居建筑|明清民居建筑群展示徽州木作、砖雕和天井结构，先确认实际开放馆区。|R
huizhou-oldtown|徽州古城|Huizhou Ancient City|29.870|118.434|180|0|100|历史古城|以斗山街和古城街巷为主看徽州府城，公共街巷与徽州府衙等收费展馆分开选择。|R
tangyue|棠樾牌坊群与鲍家花园|Tangyue Memorial Arches and Bao Family Garden|29.865|118.361|150|80|120|历史建筑与园林|从牌坊题额读家族与社会历史，再看盆景园；乡村散步和套票范围需区分。|R
hongcun|宏村|Hongcun|30.003|117.990|180|80|110|世界遗产古村|顺水渠、南湖与月沼理解村落的水系，居民宅院只进入开放部分，清晨和傍晚适合慢看。|R
xidi|西递|Xidi|29.903|117.997|180|80|110|世界遗产古村|看宅院的雕刻、巷道与祠堂如何组成徽州聚落，与宏村不是同一个村落，交通要另留。|R
lucun|卢村木雕楼|Lucun Woodcarving Houses|30.019|117.977|120|35|60|古村与木作|重点观察木雕楼中的人物、花鸟与结构细节，室内采光较暗，尊重文保拍摄要求。|R
tachuan|塔川|Tachuan|30.022|118.009|100|30|60|乡村自然|在开放村道与观景点看乌桕树和田园，秋色随天气变化；未经允许不进入农田与住户。|R
bishan|碧山村|Bishan Village|29.947|117.922|120|0|0|乡村文化|祠堂、书店与田野构成另一种徽州日常，适合带一本书停留，院落消费不等于村落门票。|R
qiyun|齐云山|Mount Qiyun|29.809|118.032|240|60|160|山地与道教文化|沿丹霞岩壁与月华街认识山中道教社区，登山、索道和山下接驳分别核对。|R
huashan|花山谜窟|Huashan Mysterious Grottoes|29.725|118.431|120|60|120|石窟与地质|在开放洞窟看采石空间与岩壁，台阶潮湿，景区活动套餐与基础参观票分开预算。|R
xin-anjiang|新安江山水画廊|Xin'an River Landscape Gallery|29.860|118.588|240|80|180|河流自然|从深渡镇选择合法运营的游船或岸线游览，沿江村落和山色适合半日至一日，不与黄山登山硬拼一天。|R''')
experiences(c,'''huizhou-ink|徽墨描金与制墨观摩|Huizhou Ink Craft|29.709|118.301|100|60|180|craft|在屯溪老街正规制墨展示工坊了解烟料、胶与模具，再咨询描金课程；材料、带走作品及授课语言提前确认。|徽墨|3||
maofeng-tea|黄山毛峰冲泡与品鉴|Huangshan Maofeng Tea Tasting|29.709|118.303|90|40|150|food-life|在有明码标价的茶庄比较毛峰的香气与冲泡温度；体验费和购茶分开，不必购买高价茶叶。|黄山毛峰|3||
fish-lanterns|徽州鱼灯民俗夜|Huizhou Fish Lantern Festival|29.769|118.494|120|0|100|festival|到歙县汪满田等公布活动的村落观察鱼灯巡游，先核对当年农历日期、交通管制和公共观看区域；不把节庆当作每日演出。|鱼灯|2|1,2,3|RD
sunrise|黄山山上日出与摄影|Huangshan Sunrise Stay|30.140|118.164|90|0|0|nature|已安排山上住宿时，按工作人员指引步行到开放观景点等日出；云海和晴天都不保证，此项不另计已购买的景区票，住宿另计。|黄山|0||R
hui-cuisine|徽菜小桌与发酵风味|Huizhou Cuisine Tasting|29.708|118.301|90|70|180|food-life|选择有清晰菜单的徽菜馆，小份尝臭鳜鱼、毛豆腐和时令笋；先说明对发酵气味的接受程度，本项替代一顿正餐。|臭鳜鱼|3||''')
foods(c,'''mandarin-fish|徽州臭鳜鱼|Huizhou Fermented Mandarin Fish|轻度腌渍后烹制，气味与鲜味并存；按整条或小份询价，适合多人分享。|屯溪老街徽菜馆|80|180|臭鳜鱼
hairy-tofu|徽州毛豆腐|Huizhou Hairy Tofu|经过发酵的豆腐常煎烤后蘸酱，外层与内部口感不同，初尝可选小份。|屯溪老街与黎阳水街|12|30|毛豆腐
shaobing|黄山烧饼|Huangshan Shaobing|梅干菜和肉馅的小酥饼，通常按个或袋售卖；现烤与包装品口感不同。|屯溪老街烧饼铺|5|20|黄山烧饼
knife-board|徽州刀板香|Huizhou Cured Pork|风干腌肉蒸后切片，咸香浓郁，适合配米饭与蔬菜分享。|屯溪徽菜馆|45|90|腊肉
bamboo-shoots|问政山笋|Wenzheng Mountain Bamboo Shoots|春笋配火腿或肉汤慢炖，鲜笋季与笋干做法不同，点菜前问清原料。|屯溪与歙县徽菜馆|35|80|笋''')
hotels(c,'''hyatt-place|黄山高铁站凯悦嘉轩酒店|Hyatt Place Huangshan Train Station|29.822|118.280|300|650|适合高铁抵达后住宿，去屯溪老街和山地景区仍需接驳。|https://www.hyatt.com/hyatt-place/en-US/txnzt-hyatt-place-huangshan-train-station
crowne|黄山昱城皇冠假日酒店|Crowne Plaza Huangshan Yucheng|29.703|118.330|450|1000|新安江畔的城市酒店，适合作为屯溪和周边村落路线基地。|https://www.ihg.com/crowneplaza/hotels/gb/en/huangshan/txncp/hoteldetail
hyatt-regency|黄山横江湾凯悦酒店|Hyatt Regency Huangshan Hengjiangwan|29.763|118.260|700|1800|横江一带的度假酒店，环境与屯溪闹市不同，晚餐和出游接驳应提前安排。|https://www.hyatt.com/hyatt-regency/zh-CN/txnrh-hyatt-regency-huangshan-hengjiangwan
banyan|黄山悦榕庄|Banyan Tree Huangshan|30.017|117.974|1500|3800|宏村镇卢村附近的徽派度假酒店，适合慢游黟县，距离黄山市区较远。|https://www.banyantree.com/china/huangshan
baiyun|黄山白云宾馆|Huangshan Baiyun Hotel|30.130|118.157|800|2200|山上住宿基地，可为天气合适时的日出预留一晚；需徒步抵达，行李和山上餐饮另作准备。|https://www.trip.com/hotels/huangshan-city-hotel-detail-434484/huangshan-bai-yun-hotel/''')

c=city('hefei','合肥','Hefei','CN-AH',31.863,117.283,'HFE',3,'包河边的旧城、安徽文博馆与旧机场改造的大公园，让合肥适合用博物馆、湖岸和江淮小吃安排几天。','旧城与政务区以地铁衔接；三河古镇、巢湖岸线和三十岗方向单独安排半日至一日。合肥南站和新桥机场接驳分开核算。')
places(c,'''bao-park|包公园|Bao Gong Park|31.857|117.298|120|0|60|历史公园|沿包河看包公文化与园林，公共湖岸和包公祠、清风阁等内部场馆的门票分开确认。
li-hongzhang|李鸿章故居|Former Residence of Li Hongzhang|31.867|117.292|90|0|30|历史民居|在合肥旧城的家族宅院认识晚清人物与江淮建筑，展厅预约和开放范围以馆方为准。
xiaoyaojin|逍遥津公园|Xiaoyaojin Park|31.870|117.299|90|0|0|城市公园|三国历史记忆与市民公园相遇，可看水岸与传统园林，游乐设施单独付费。
mingjiao|明教寺|Mingjiao Temple|31.868|117.300|50|0|20|宗教建筑|登上旧城中的寺院平台，感受寺院与淮河路商业街的尺度变化，礼佛与参观都保持安静。
huaihe|淮河路步行街|Huaihe Road Pedestrian Street|31.866|117.291|75|0|0|商业与老字号|老字号饮食与当代商店集中，适合在两个场馆之间吃一顿江淮小食。
anhui-museum|安徽博物院蜀山馆|Anhui Museum Shushan Branch|31.794|117.223|180|0|0|历史博物馆|围绕安徽文明、徽州建筑和文房四宝选择展线，馆藏体量较大，预留完整半天更从容。
art-museum|安徽省美术馆|Anhui Art Museum|31.793|117.219|120|0|40|艺术博物馆|结合建筑空间和当期展览安排，常设与特展的预约规则可能不同。
geological|安徽省地质博物馆|Anhui Geological Museum|31.795|117.220|120|0|0|科学博物馆|岩矿标本、古生物与地球演变适合亲子参观，与邻近省博择一深入。
swan-lake|天鹅湖公园|Swan Lake Park Hefei|31.815|117.230|90|0|0|滨水公园|湖岸与城市天际线适合黄昏停留，只在开放步道活动，不下水游泳。
hechai|合柴1972|Hechai 1972|31.803|117.257|120|0|60|工业艺术空间|旧柴油机厂穹顶与展览、设计商店并存，室外空间和收费展览分别选择。
luogang|骆岗公园|Luogang Park|31.775|117.295|180|0|0|城市公园|旧机场转型的大型公园面积很广，先选择一个园区片段；园内交通与活动消费另计。
science|合肥科技馆蜀西湖馆|Hefei Science and Technology Museum Shuxi Lake Branch|31.819|117.121|180|0|0|科学体验|选择常设展和互动项目，需按场馆要求预约；热门假日排队不能忽略。
dashushan|大蜀山森林公园|Dashu Mountain Forest Park|31.839|117.173|180|0|0|山地公园|从城市西部登缓坡看林地与城景，准备饮水，雨天台阶和夏季闷热会影响速度。
botanical|合肥植物园|Hefei Botanical Garden|31.886|117.213|120|0|40|植物公园|围绕当季开花区域选择路线，春季花展与常规入园的收费规则需核对。
crossing-memorial|渡江战役纪念馆|Crossing-the-Yangtze Campaign Memorial|31.727|117.330|120|0|0|历史教育|通过渡江战役展陈理解区域近现代历史，结合滨湖方向独立安排，勿压缩阅读时间。
anhui-notables|安徽名人馆|Anhui Hall of Fame|31.729|117.328|100|0|0|人物与地方历史|从安徽历史人物认识不同年代的思想、艺术与科技，适合在雨天慢慢看。
binhu-forest|滨湖国家森林公园|Hefei Binhu National Forest Park|31.734|117.391|180|0|0|湿地森林|沿南淝河与巢湖畔开放林道散步，租车和观光项目另计，夏季准备防蚊。|R
sanhe|三河古镇|Sanhe Ancient Town|31.513|117.246|240|0|100|水乡古镇|沿三水交汇的街巷看桥与民居，公共古镇和人物故居等内部景点分开预算。|R
san-guo|三国遗址公园|Three Kingdoms Heritage Park Hefei|31.964|117.126|120|20|40|考古与历史公园|从城垣遗址和展示认识合肥的三国故事，不把重建景观当作原存建筑。|R
liujiafan|六家畈古民居|Liujiafan Historic Dwellings|31.634|117.558|180|0|80|侨乡民居|巢湖东岸的聚落适合看江淮民居与侨乡展陈，村落、民宿和收费室内项目分别选择。|R''')
experiences(c,'''opera|逍遥津花戏楼听一折戏|Traditional Opera at Xiaoyaojin|31.870|117.299|90|0|100|performance|按花戏楼或当地剧场公布场次选择黄梅戏、徽剧等演出；先确认剧种、时长和座位，公共展演并非天天都有。|黄梅戏|0||D
jianghuai-breakfast|江淮老字号早餐桌|Jianghuai Breakfast Tasting|31.866|117.290|75|25|65|food-life|在刘鸿盛、庐州烤鸭店等老字号选择鸡饺、汤包或烧饼，少量组合代替一顿早餐，不另叠加餐费。|汤包|2||
chaohu-cycling|巢湖岸线轻骑行|Chaohu Lakeside Cycling|31.732|117.385|150|30|100|nature|在滨湖开放绿道选择短段租车骑行，先检查车辆与天气；不横穿机动车道，长途环湖不作为入门行程。|巢湖|1|3,4,5,9,10,11|R
sanhe-rice|三河米饺与米酒寻味|Sanhe Rice Dumpling Tasting|31.513|117.246|90|25|70|food-life|在古镇有标价的米饺铺看现炸出锅，再尝当地米酒或无酒精饮品；不安排饮酒后的驾驶。|三河米饺|2||R
hechai-art|合柴工厂建筑与手作午后|Hechai Industrial Art Afternoon|31.803|117.257|120|60|220|craft|先看旧厂房的结构与展览，再向园内公开营业的工作室预约陶艺或绘画课程；课程、材料和作品邮寄分别核价。|合柴1972|0||''')
foods(c,'''rice-dumpling|三河米饺|Sanhe Rice Dumpling|米粉外皮包馅油炸，趁热吃外脆内软；按个购买能与其他小吃搭配。|三河古镇米饺铺|5|15|三河米饺
chicken-dumpling|冬菇鸡饺|Mushroom and Chicken Dumplings|鸡肉与冬菇做馅的江淮汤饺，适合作为一碗清鲜早餐。|刘鸿盛淮河路一带门店|15|35|饺子
duck-shaobing|庐州鸭油烧饼|Luzhou Duck-fat Shaobing|鸭油带来酥香，通常搭配汤包或鸭汤，按个询价。|庐州烤鸭店|4|12|烧饼
wushan-goose|吴山贡鹅|Wushan Braised Goose|鹅肉卤制后切盘，口感较紧实，可按小份搭配米饭分享。|淮河路与罍街安徽菜馆|35|80|卤鹅
hotchpotch|李鸿章大杂烩|Li Hongzhang Hotchpotch|多种荤素原料合烩，具体版本随餐馆变化，点菜前确认食材与份量。|合肥老城徽菜馆|50|120|李鸿章杂碎''')
hotels(c,'''express|合肥淮河路智选假日酒店|Holiday Inn Express Hefei Huaihe Road|31.862|117.279|220|450|旧城区经济连锁选择，适合步行结合地铁游淮河路和包河。|https://www.ihg.com/holidayinnexpress/hotels/us/en/hefei/hfeex/hoteldetail
holiday|合肥古井假日酒店|Holiday Inn Hefei|31.866|117.308|350|700|靠近大东门交通节点，适合旧城观光；名称与其他假日品牌物业需区分。|https://www.ihg.com/holidayinn/hotels/us/en/hefei/hfech/hoteldetail
shangrila|合肥香格里拉|Shangri-La Hefei|31.884|117.264|600|1300|濉溪路的完整服务酒店，徽文化设计与餐饮适合城市休息日。|https://www.shangri-la.com/hefei/shangrila/
hyatt|合肥君悦酒店|Grand Hyatt Hefei|31.793|117.227|800|1800|华润大厦高层的城市酒店，适合政务区、美术馆和天鹅湖方向。|https://www.hyatt.com/grand-hyatt/en-US/hfegh-grand-hyatt-hefei
hightech|合肥高新智选假日酒店|Holiday Inn Express Hefei High Tech|31.828|117.119|230|500|靠近蜀西湖与高新区，适合科技馆方向，去淮河路旧城需地铁接驳。|https://www.ihg.com/holidayinnexpress/hotels/us/en/hefei/hfeht/hoteldetail''')

c=city('fuzhou','福州','Fuzhou','CN-FJ',26.075,119.296,'FOC',4,'榕树、古厝、茉莉花茶与闽江江风组成福州的日常，老城、烟台山和马尾船政适合分片慢游。','中心城区步行与地铁组合；马尾、鼓岭和长乐海岸各留独立半日至一日。长乐机场距老城较远，需单算接驳时间与费用。')
places(c,'''lanes|三坊七巷|Three Lanes and Seven Alleys|26.086|119.296|180|0|100|历史街区|在坊巷中看宅院格局与榕城名人故事，公共街巷和需预约的故居分别选择。
linzexu|林则徐纪念馆|Lin Zexu Memorial Hall|26.078|119.296|90|0|0|人物纪念馆|通过林则徐生平、禁烟与治水展陈认识近代史，院落与展厅值得留出安静阅读时间。
zhuzifang|朱紫坊|Zhuzifang Historic Quarter|26.079|119.304|70|0|0|历史街区|沿河与旧宅外观认识老城另一片较小街区，可与于山组合而不另作长距离绕行。
westlake|福州西湖公园|Fuzhou West Lake Park|26.101|119.291|100|0|0|城市公园|沿湖、榕荫与亭桥慢走，适合在博物院前后休息，游船按运营情况另计。
fujian-museum|福建博物院|Fujian Museum|26.104|119.286|150|0|0|历史博物馆|从福建历史、海洋联系与地方工艺挑选展线，闭馆日和预约以馆方信息为准。
hualin|华林寺|Hualin Temple Fuzhou|26.110|119.295|60|0|0|古代木构|以大殿结构与时代背景为重点看福州古建筑，院落较小，参观时保持安静。
wushan|乌山|Wushan Hill Fuzhou|26.075|119.294|90|0|0|城市山地|沿开放步道看摩崖石刻、榕荫与城景，台阶高低不一，适合放慢速度。
yushan|于山|Yushan Hill Fuzhou|26.075|119.305|90|0|0|城市山地与古迹|白塔周边的古迹和林荫路适合短段登高，宗教场所与纪念馆按开放安排选择。
shangxiahang|上下杭|Shangxiahang Historic Quarter|26.053|119.302|120|0|0|商贸历史街区|看会馆、河道与店铺如何形成闽商街区，夜间餐饮热闹，消费与公共参观分开算。
yantaishan|烟台山|Yantai Mountain Fuzhou|26.042|119.312|150|0|0|近代建筑街区|沿坡路辨认学校、教堂和近代住宅，外观散步与进入经营空间分开选择。
fanchuanpu|泛船浦天主堂|Fanchuanpu Cathedral|26.040|119.320|40|0|0|宗教建筑|从公开范围看沿江教堂的建筑，礼拜和宗教活动优先，入内与拍照遵守现场要求。
minjiang-heart|闽江之心|Heart of Minjiang River|26.052|119.313|75|0|0|滨江空间|青年广场与解放大桥附近适合傍晚停留，沿江夜景和商业活动随日期变化。
shipyard|中国船政文化博物馆|China Shipbuilding Culture Museum|25.997|119.451|150|0|0|工业历史博物馆|以船政教育、造船与近代海军为线索参观，马尾方向需要独立接驳时间。|R
luoxing|罗星塔公园|Luoxing Pagoda Park|25.986|119.452|75|0|0|航海地标|在闽江口岸边观察航标与港口地景，登塔是否开放以现场安排为准。|R
gushan|鼓山与涌泉寺|Gushan and Yongquan Temple|26.055|119.388|240|0|100|山地与寺院|登山步道、索道和涌泉寺可以按体力择选，套票与寺院参观费用分别核对。|R
guling|鼓岭|Kuliang|26.092|119.394|240|0|60|山地避暑与历史|围绕柳杉王公园和历史建筑看避暑地的跨文化故事，山路和天气使接驳不能按市区计算。|R
forest|福州国家森林公园|Fuzhou National Forest Park|26.157|119.293|180|0|0|森林公园|大榕树、林道与季节花木适合半日自然休息，园内项目和接驳另计。
fudao|福道|Fudao Forest Walkway|26.094|119.259|120|0|0|城市自然步道|选择一个入口到出口的短段体验架空林间步道，先查出口与公交，避免在高温里走完整线。
jinniushan|金牛山公园|Jinniushan Park|26.086|119.269|90|0|0|城市公园|以山脚公园和林荫步道休息，可与福道择一组合，避免把同段路线重复计算。
tanshishan|昙石山遗址博物馆|Tanshishan Site Museum|26.147|119.143|120|0|0|考古博物馆|用遗址和出土器物认识福建史前文化，位于闽侯方向，交通另留。|R''')
experiences(c,'''jasmine|茉莉花茶窨制文化与品茶|Fuzhou Jasmine Tea Tasting|26.086|119.296|90|40|160|food-life|在三坊七巷公开营业的茶馆比较茉莉花茶香气，询问窨制工序与不同花次；制茶演示需预约，不将品茶承诺为完整窨制课程。|茉莉花茶|2||
min-opera|闽剧与伬唱小剧场|Min Opera and Fuzhou Story Singing|26.084|119.295|100|30|180|performance|按福建省实验闽剧院等公布场次挑选演出，先了解唱腔与故事梗概，字幕、座位和时长以剧场为准。|闽剧|1||D
l lacquer|脱胎漆器工艺观摩|Fuzhou Lacquerware Workshop|26.086|119.295|100|80|220|craft|向古厝街区的漆艺展馆或工坊预约观摩与小件体验，了解胎体与髹饰；漆器制作周期长，成品寄送和材料另确认。|福州脱胎漆器|2||
river-cruise|闽江夜游|Minjiang Evening Cruise|26.049|119.311|90|90|180|water|从官方运营码头按当天航班看两岸灯光与桥梁，船程、码头和停航规则先确认，暴雨大风不安排。|闽江|0||D
hot-spring|榕城温泉休息时段|Fuzhou Urban Hot Spring Visit|26.102|119.314|150|80|240|nature|在有明确营业信息的温泉场馆安排泡汤休息，询问公共池与私汤收费、用品和开放时间；与登山行程错开，按自身身体状况选择。|福州温泉|2||'''.replace('l lacquer','lacquer'))
foods(c,'''fishballs|福州鱼丸|Fuzhou Stuffed Fish Balls|鱼浆包肉馅制成，清汤最能表现弹性与鲜味；鱼类与肉馅过敏者先询问。|南后街永和鱼丸等门店|18|40|福州鱼丸
rouyan|福州肉燕|Fuzhou Rouyan|捶打猪肉制成薄燕皮再包馅，口感不同于普通面皮馄饨。|同利肉燕南后街店|18|40|肉燕
lizhi-pork|荔枝肉|Lychee Pork|猪肉改刀炸后挂酸甜芡，名字来自外形，通常并不加入荔枝果肉。|老福州徐记与闽菜馆|35|80|荔枝肉
buddha|佛跳墙|Buddha Jumps Over the Wall|多种海味与肉类煨成的汤菜，材料等级和份量差异很大，优先按位询价。|聚春园闽菜餐厅|100|450|佛跳墙
dingbian|福州锅边糊|Fuzhou Dingbianhu|米浆沿热锅边形成薄片，再入鲜汤，适合作为早餐或小食。|老城区早餐铺与达明美食街|8|20|鼎边糊''')
hotels(c,'''shangrila|福州香格里拉|Shangri-La Fuzhou|26.072|119.305|550|1200|五一广场附近，适合旧城与于山方向，具体景观依房型选择。|https://www.shangri-la.com/fuzhou/shangrila/
hyatt|福州仓山凯悦酒店|Hyatt Regency Fuzhou Cangshan|26.005|119.272|550|1100|乌龙江畔的仓山酒店，适合把江景休息和城市游览结合，距老城有接驳。|https://www.hyatt.com/hyatt-regency/en-US/fochr-hyatt-regency-fuzhou-cangshan
westin|福州富力威斯汀酒店|The Westin Fuzhou Minjiang|26.047|119.340|550|1300|位于闽江北岸，适合江滨与商务区活动，过江去烟台山应留车程。|https://www.marriott.com/en-us/hotels/focfi-the-westin-fuzhou-minjiang/overview/
intercontinental|福州世茂洲际酒店|InterContinental Fuzhou|26.060|119.309|650|1600|茶亭片区高层酒店，可结合上下杭和旧城，景观及早餐依房型条款。|https://www.ihg.com/intercontinental/hotels/us/en/fuzhou/focha/hoteldetail
express|福州泰禾智选假日酒店|Holiday Inn Express Fuzhou Downtown|26.087|119.328|280|600|东二环片区的连锁住宿选择，前往三坊七巷仍需城市交通；预订时以官方物业名称和地址为准。|https://www.ihg.com/holidayinnexpress/hotels/us/en/fuzhou/fochr/hoteldetail''')

c=city('wuyishan','武夷山','Wuyishan','CN-FJ',27.648,117.974,'WUS',4,'九曲溪竹筏、丹霞山路与岩茶香气让武夷山适合慢住，三姑度假区是进入山水的常用基地。','以三姑度假区为住宿中心；景区内换乘观光车，竹筏按预约时间衔接。南平市站在建阳方向，与武夷山北站不是同站；下梅、五夫和桐木各留往返。','Wuyishan, Fujian')
places(c,'''tianyou|天游峰|Tianyou Peak|27.647|117.952|180|70|160|丹霞山地|沿台阶登高俯看九曲溪，坡度与排队会影响用时；体力不足可在山脚茶洞一带择短线。
yixiantian|一线天|One-Line-Sky Wuyishan|27.619|117.964|80|70|160|丹霞地貌|穿行狭窄岩隙观察崖壁，部分通道窄且潮湿；怕密闭空间者可选择外围观景。
huxiaoyan|虎啸岩|Huxiao Rock|27.628|117.955|150|70|160|山地自然|陡阶、岩壁与观景平台需要一定体力，不与天游峰连续安排成赶路登山日。
dahongpao|大红袍母树景区|Dahongpao Mother Tea Trees|27.674|117.958|120|70|160|茶文化与山谷|沿九龙窠谷地看茶树与岩壁环境，只在步道观察，不采摘或触摸保护茶树。
shuiliandong|水帘洞|Water Curtain Cave Wuyishan|27.694|117.958|120|70|160|山谷自然|岩壁高悬与茶园形成山谷景观，水帘强弱随降雨变化，步道距离应纳入用时。
wuyi-palace|武夷宫|Wuyi Palace|27.640|117.974|75|0|40|历史与宗教建筑|以宫观遗迹、古树与周边文化展示认识武夷山的历史，不把仿古商业街当作全部内容。
zhuxi-garden|朱熹园|Zhu Xi Garden Wuyishan|27.650|117.946|90|0|40|思想文化|沿武夷精舍相关展陈理解朱子理学与山水书院，开放展馆与景区交通须分别确认。
xiamei|下梅古民居|Xiamei Ancient Village|27.688|118.025|150|40|80|茶贸古村|沿当溪与古宅雕刻认识万里茶道起点之一，居民门前不是随意入内的展馆。|R
wufu|五夫古镇|Wufu Ancient Town|27.584|118.183|180|0|60|古镇与书院|朱熹相关遗迹、莲田与乡村街巷适合独立半日，夏季赏莲以当年花期为准。|R
han-city|城村汉城遗址|Chengcun Han City Site|27.541|118.030|120|0|80|考古遗址|通过遗址与展馆了解闽越文化，土台与考古说明比重建想象更值得细看。|R
xiamei-tea|下梅邹氏家祠|Zou Family Ancestral Hall Xiamei|27.687|118.023|60|0|0|宗祠与木雕|作为下梅古村内的细看项目，重点看雕刻与宗族空间；若已购村落票不重复预留门票。|R
xiangjiang|香江茗苑|Xiangjiang Tea Garden|27.670|117.989|120|0|80|茶文化展馆|在公开茶文化展示区域了解岩茶制作，制茶课程、茶品和表演依具体服务核价。
yanzike|燕子窠生态茶园|Yanzike Ecological Tea Garden|27.620|117.911|120|0|80|茶园自然|在开放参观区域看茶树与生态种植方式，不越入生产区，需先确认当日接待与交通。|R
xiamei-river|赤石古渡|Chishi Ancient Ferry|27.669|117.974|60|0|0|茶路历史|从公开河岸观察古渡相关遗迹，结合茶叶运输史理解崇阳溪，不能将摆渡视为固定运营项目。
chongyang-river|崇阳溪滨水步道|Chongyang River Promenade|27.650|117.983|75|0|0|滨水公园|把一个傍晚留给度假区河岸，选短段看山影与晚风，骑行时避让行人。
chishi-memorial|赤石暴动烈士陵园|Chishi Uprising Memorial|27.679|117.978|60|0|0|历史教育|通过纪念设施认识当地近现代历史，庄重参观，开放与集体活动安排需先确认。
yulin|遇林亭窑址|Yulinting Kiln Site|27.708|117.954|90|0|60|古窑与考古|窑址展示武夷地区陶瓷生产与茶器联系，具体展陈和进入范围以文保管理为准。|R
baiyun-temple|白云禅寺|Baiyun Temple Wuyishan|27.637|117.907|150|0|30|山地寺院|山路与石阶通往寺院，适合体力允许时选择；清晨出行需照明与回程安排，不保证云海。|R
qinglong|青龙大瀑布|Qinglong Waterfall Wuyishan|27.738|117.730|180|60|120|瀑布森林|沿景区开放步道看峡谷和瀑布，雨季先确认通行，山区往返另留半日以上。|R
longchuan|龙川大峡谷|Longchuan Grand Canyon|27.770|117.790|150|50|100|森林峡谷|在合法开放栈道看山溪与林地，湿滑台阶和天气会影响速度，远离未开放水域。|R''')
for p in c['attractions'][:5]:
    p['price'].update({'passGroup':'wuyishan-scenic-day','passValidityDays':1,'passLabel':'武夷山景区及观光车日预算','note':'景区优惠与门票政策按出行日核对；本区间为景区及观光交通预留，同一日只计一次。竹筏、演出与特色项目另计。'})
experiences(c,'''bamboo-raft|九曲溪竹筏漂流|Jiuqu Stream Bamboo Rafting|27.634|117.919|150|130|200|water|从指定码头按预约场次乘坐有资质竹筏，沿九曲溪看丹霞山体；本项预算为竹筏，不含景区外接驳，雨水与水位可能停航。|九曲溪|0||D
rock-tea|武夷岩茶品鉴|Wuyi Rock Tea Tasting|27.646|117.979|100|50|200|food-life|在三姑茶馆比较水仙、肉桂等岩茶香型，学习水温与冲泡；购茶与课程分开核价，不把品鉴等同强制购物。|武夷岩茶|1||
tea-making|岩茶采制工艺体验|Wuyi Tea-making Workshop|27.670|117.989|150|100|300|craft|向香江茗苑等公开茶旅机构预约基础制茶课；春季采茶是否开放取决于茶园生产，炒制与焙火由工作人员指导。|武夷岩茶|2|4,5|D
impression|印象大红袍山水演出|Impression Dahongpao Show|27.625|117.977|100|180|350|performance|按实际场次看以岩茶为主题的山水实景演出，预算随座位不同；先确认天气、退改规则和散场接驳。|印象大红袍|2||D
tea-path|岩骨花香山谷漫游|Rock Tea Valley Nature Walk|27.680|117.958|150|0|0|nature|已安排大红袍区域游览时，选择通往水帘洞的开放步道看岩壁、茶园与溪流；不要重复计算已购景区票，需确认终点接驳。|武夷山|1||''')
foods(c,'''smoked-goose|武夷熏鹅|Wuyishan Smoked Goose|鹅肉经熏制后带烟香，常偏咸辣，点小份便于搭配茶香与米饭。|三姑度假区闽北菜馆|35|80|熏鹅
guangbing|武夷光饼|Wuyi Guangbing|传统烘烤面饼可作小食或配菜，现烤的酥香与袋装饼不同。|三姑市场与崇安老城饼铺|4|12|光饼
tea-eggs|大红袍茶叶蛋|Dahongpao Tea Eggs|茶汤与香料卤制鸡蛋，是茶旅地区常见简便小食，香气随配方不同。|三姑茶餐与景区正规小吃铺|5|12|茶叶蛋
lotus-soup|五夫莲子羹|Wufu Lotus Seed Soup|莲子煮成甜羹，夏季鲜莲与干莲做法不同，可作为一份清淡甜点。|五夫古镇餐馆|12|30|莲子羹
bamboo-shoot|武夷笋饼|Wuyi Bamboo Shoot Pancake|将笋馅包入薄饼煎烤，外皮和笋香相配，询问是否含肉馅。|三姑市场和武夷山老城小吃铺|6|18|笋饼''')
hotels(c,'''ancient-five|旧街五号云起时客栈|Ancient Street No.5 Youth Chic Hotel|27.643|117.980|180|500|三姑度假区的小型客栈，适合重视步行餐饮的旅客；房间面积和隔音依具体房型确认。|https://www.booking.com/hotel/cn/ancient-street-no-5-youth-chic.html
cd-resort|武夷山悦华酒店|C and D Resort Wuyi Mountain|27.639|117.982|650|1500|三姑度假区的完整服务度假酒店，去主景区仍需接驳；以建发酒店官方预订入口核价。|https://www.cndhotels.com/
dahongpao|武夷山大红袍山庄|Dahongpao Resort Wuyi Mountain|27.587|117.990|900|2500|兴田方向的山水度假物业，适合留在酒店慢住，与三姑和市区不应按步行衔接。|https://www.trip.com/hotels/wuyishan-hotel-detail-436748/wuyi-mountain-dahongpao-resort/
wuyi-villa|武夷山庄|Wuyi Mountain Villa|27.642|117.975|400|1000|武夷宫附近传统度假酒店，适合山水线路；具体入口、景观和客房翻新情况先核对。|https://www.booking.com/searchresults.html?ss=Wuyi+Mountain+Villa+Wuyishan
fliport|武夷山佰翔花园酒店|Fliport Garden Hotel Wuyishan|27.708|117.997|280|650|机场方向的花园酒店，适合偏安静的住宿选择，往返三姑景区另留交通。|https://www.booking.com/searchresults.html?ss=Fliport+Garden+Hotel+Wuyishan''')

c=city('jingdezhen','景德镇','Jingdezhen','CN-JX',29.269,117.180,'JDZ',4,'从御窑遗址到仍在创作的工作室，景德镇最值得留下的是看懂一件瓷器如何从泥土变成日常器物。','御窑、陶溪川和三宝分属不同片区，用步行结合公交或出租车。瑶里、浮梁茶村和高岭方向需独立半日至一日，陶艺烧制可能需要邮寄。')
places(c,'''imperial|陶阳里御窑景区|Taoyangli Imperial Kiln Site|29.296|117.204|180|50|120|工业考古与古城|以御窑遗址与陶阳里街巷串起烧瓷历史，御窑博物馆和景区的预约、票种需分别确认。
ceramic-museum|景德镇中国陶瓷博物馆|China Ceramics Museum Jingdezhen|29.280|117.155|180|0|0|陶瓷博物馆|从古代器物看到现代陶瓷，优先选择感兴趣的年代，热门展区排队和预约都要预留。
ancient-kiln|古窑民俗博览区|Ancient Kiln Folk Customs Museum|29.270|117.170|180|80|120|传统制瓷|在窑炉与工序展示中理解传统制瓷，不把所有工艺演示默认成可亲手体验课程。
taoxichuan|陶溪川文创街区|Taoxichuan Ceramic Art Avenue|29.286|117.243|150|0|0|工业更新与设计|旧宇宙瓷厂的厂房、烟囱和创意店铺适合慢逛，市集按公布日期开放，作品价格另询。
industrial-museum|陶溪川陶瓷工业遗产博物馆|Taoxichuan Industrial Heritage Museum|29.286|117.242|100|0|60|工业历史|从工人的口述与工具看近现代瓷业，不同于御窑中的宫廷瓷历史，适合挑一个展线细看。
sanbao|三宝国际陶艺村|Sanbao International Ceramic Village|29.245|117.248|150|0|0|乡村艺术|溪谷中散布工作室与展馆，先选开放地点再走，不把私人创作空间当作随意进入的景点。
sanbaopeng|三宝蓬艺术聚落|Sanbaopeng Art Center|29.229|117.256|100|30|100|当代艺术与建筑|夯土与山谷中的艺术空间适合看展和建筑，展览、咖啡和课程分别计价。
sculpture|雕塑瓷厂|Sculpture Porcelain Factory|29.289|117.248|120|0|0|陶瓷市集|创作小店与市集展示当代陶瓷的多样面貌，易碎品打包寄送费用先问清。
hutian|湖田古窑遗址|Hutian Ancient Kiln Site|29.255|117.235|100|0|40|考古遗址|从窑业遗存理解青白瓷生产历史，遵守保护边界，不触碰或捡取碎瓷。
fudao|浮梁古县衙|Fuliang Ancient County Office|29.391|117.247|150|40|80|历史官署|通过建筑与展陈认识县治制度，距离市区需车程，可与同方向短线组合。|R
red-tower|浮梁红塔|Fuliang Red Pagoda|29.391|117.244|45|0|0|古塔外观|在公开区域看宋代砖塔外观，作为浮梁路线的小停留点；不默认内部开放登塔。|R
yaoli|瑶里古镇|Yaoli Ancient Town|29.548|117.589|180|0|100|古镇与瓷茶文化|沿瑶河看徽派民居和古镇生活，公共街巷与联票场馆分别核对，距市区较远。|R
gaoling|高岭国家矿山公园|Gaoling National Mine Park|29.509|117.582|150|0|80|矿业遗产|沿开放线路了解高岭土与瓷器原料，矿坑和遗址只在管理允许范围参观。|R
dongbu|东埠古码头|Dongbu Ancient Wharf|29.508|117.565|90|0|30|水运与古村|码头和旧街体现瓷土、茶叶运输历史，适合与高岭择一深入，汛期河边需谨慎。|R
hanxi|寒溪村与大地之灯|Hanxi Village Tea Landscapes|29.489|117.385|150|0|50|乡村茶园|在开放茶园道路看丘陵与艺术装置，展览活动不保证全年存在，不踩入生产茶垄。|R
bingding|丙丁柴窑|Bingding Wood Kiln|29.386|117.513|120|30|100|窑炉建筑|围绕现代柴窑建筑理解火与制瓷空间，开窑不是固定每日活动，先预约确认。|R
mingfang|名坊园|Mingfang Ceramic Workshops|29.237|117.155|120|0|60|陶瓷工坊|公开营业的制瓷工作室集中，可咨询一项工艺而非匆忙浏览全部，课程另计。
ceramics-art|陶溪川美术馆|Taoxichuan Art Museum|29.286|117.244|100|0|80|当代艺术馆|按当期展览认识陶瓷与当代艺术的交叉，常设场地和特展收费需确认。
sanlv|三闾庙古街|Sanlu Temple Historic Street|29.298|117.195|90|0|0|古街与航运文化|看古街、会馆与昌江的联系，公共外观可慢走，住宅和未开放建筑不进入。
changjiang|昌江河滨步道|Changjiang Riverside Jingdezhen|29.294|117.195|75|0|0|滨水公园|在开放江岸留一个轻松傍晚，理解瓷器随水路出城的历史，洪水或施工时改变路线。''')
experiences(c,'''wheel|拉坯与修坯初体验|Wheel Throwing Workshop|29.289|117.249|150|100|300|craft|向乐天陶社等公开教学机构或雕塑瓷厂工坊预约入门课，确认拉坯、修坯、上釉、烧制和邮寄分别包含什么。|陶轮|2||
painting|青花瓷绘入门|Blue-and-white Porcelain Painting|29.286|117.243|120|100|280|craft|在正式工作室学习用钴料画线与留白，坯体规格、烧成色差及寄送周期先了解，不承诺当天带走烧好的作品。|青花瓷|1||
tea-landscape|浮梁茶乡品茶午后|Fuliang Tea Countryside Afternoon|29.489|117.385|180|60|180|food-life|结合寒溪或浮梁公开接待的茶庄品茶，询问当地绿茶与红茶的制作，春季采茶体验需按生产安排预约。|浮梁茶|1||R
china-show|大型实景演出《china》|China Porcelain-history Show|29.303|117.242|120|160|300|performance|依据运营方当期场次看以瓷都历史为线索的演出，座位、天气影响和散场接驳先确认。|景德镇陶瓷|0||D
night-market|陶溪川周末创作市集|Taoxichuan Weekend Makers Market|29.286|117.243|120|0|0|festival|按公布的周末或节庆市集日期，与摊主交流器物的釉色和用途；入场与买作品分开，非市集日改为普通街区参观。|陶溪川|2||D''')
foods(c,'''alkaline-cake|景德镇碱水粑|Jingdezhen Alkaline Rice Cake|米浆经碱水处理形成弹韧米粑，常与鸡蛋、腌菜或肉同炒，辣度可以先商量。|抚州弄与珠山中路小吃店|15|35|碱水粑
lengfen|景德镇冷粉|Jingdezhen Cold Rice Noodles|粗米粉拌橘皮等调味料，鲜辣而有地方香气，先点小份了解辣度。|抚州弄小吃街|8|18|景德镇冷粉
dumpling-cake|景德镇饺子粑|Jingdezhen Jiaozi Ba|米皮包萝卜丝或其他馅料蒸制，外形像饺子但口感不同。|抚州弄早餐铺|6|20|饺子粑
porcelain-pork|瓷泥煨鸡|Clay-baked Chicken|鸡用包裹方式慢烤，景德镇餐馆有地方化做法；整只适合多人分享，预订时问清等待时间。|景德镇地方菜馆|80|160|叫花鸡
rice-steam|粉蒸肉|Jiangxi Rice-flour Steamed Pork|米粉裹肉蒸熟，景德镇街区餐馆常见，注意一份肉与配菜的比例。|抚州弄及珠山地方菜馆|25|55|粉蒸肉''')
hotels(c,'''express-center|景德镇陶溪川智选假日酒店|Holiday Inn Express Jingdezhen City Center|29.286|117.239|260|600|陶溪川附近的连锁住宿选择，适合晚逛市集，节庆期间房价波动较大。|https://www.ihg.com/holidayinnexpress/hotels/us/en/jingdezhen/jdztc/hoteldetail
express-old|景德镇古镇智选假日酒店|Holiday Inn Express Jingdezhen Ancient Town|29.311|117.199|230|550|御窑方向的城市酒店，适合作为老城路线基地，不在瑶里古镇。|https://www.ihg.com/holidayinnexpress/hotels/us/en/jingdezhen/jdzja/hoteldetail
holiday|景德镇假日酒店|Holiday Inn Jingdezhen|29.303|117.242|400|850|昌江大道陶溪川孵化中心的完整服务酒店，前往创意街区仍按实际入口确认距离。|https://www.ihg.com/holidayinn/hotels/us/en/jingdezhen/jdzjd/hoteldetail
hyatt-place|景德镇陶溪川凯悦嘉轩酒店|Hyatt Place Jingdezhen Taoxichuan|29.287|117.246|450|1000|陶溪川二期的现代酒店，适合将展览、创作市集与住宿安排在同一片区。|https://www.hyatt.com/hyatt-place/en-US/jdzzj-hyatt-place-jingdezhen-taoxichuan
unbound|景德镇陶溪川酒店|Taoxichuan Hotel|29.288|117.246|1000|2600|以陶瓷工业文脉为设计主题的高端酒店，适合建筑与艺术兴趣旅客。|https://www.hyatt.com/unbound-collection/en-US/jdzub-taoxichuan-hotel''')

c=city('yangzhou','扬州','Yangzhou','CN-JS',32.394,119.413,'YTY',3,'早茶、园林、运河和扬州手艺最适合慢慢安排，一天不必塞满园子，午后留给茶馆或一段河岸。','古城以步行、公交和短途出租车组合；瘦西湖、东关街、大运河博物馆分片安排。扬州东站与扬州站、扬泰机场接驳不同；高邮与邵伯另留半日。')
places(c,'''slender-lake|瘦西湖|Slender West Lake|32.414|119.413|240|60|120|园林湖泊|沿湖串联桥、亭与园林，按入口出口选一段主线，游船和夜游票种不与日间参观混为一谈。
ge-garden|个园|Geyuan Garden|32.402|119.439|120|40|60|盐商园林|以四季假山、竹景和住宅关系理解盐商园林，别只在入口拍照便离开。
he-garden|何园|Heyuan Garden|32.384|119.446|120|40|60|近代园林|复道回廊将住宅与庭园连接起来，木作与中西建筑细节值得慢看。
daming|大明寺|Daming Temple Yangzhou|32.430|119.407|120|40|80|宗教与文化|看寺院、鉴真纪念堂与周边园林，塔与其他附加项目是否含票先确认。
canal-museum|扬州中国大运河博物馆|China Grand Canal Museum|32.355|119.427|180|0|0|运河博物馆|从交通、水工到市民生活选择展厅，互动展预约及特殊展览另核，适合完整半天。
shuangbo|扬州双博馆|Yangzhou Museum and Block Printing Museum|32.396|119.369|150|0|0|地方历史与印刷|将扬州文物与雕版印刷两条展线结合，避免只追逐单件热门藏品。
dongguan|东关街|Dongguan Street|32.400|119.445|120|0|0|历史商业街|盐商故居与老字号交错，适合点几样小食慢走，院落和商家消费另计。
dongquan|东圈门历史街区|Dongquanmen Historic Quarter|32.401|119.434|75|0|0|历史街巷|比主商业街更适合看巷道与民居外观，注意居民出入，不进入未开放院落。
pishi|皮市街|Pishi Street|32.390|119.444|90|0|0|街区与书店|从小书店、地方餐饮与旧巷认识当代扬州，适合园林之后留一个不用赶时间的下午。
wudao|吴道台宅第|Wu Daotai Mansion|32.389|119.459|90|20|40|近代民居|比较宅院的江南与宁绍建筑细节，室内展陈和维护开放以现场安排为准。
lu-shaoxu|卢氏盐商住宅|Lu Family Salt Merchant Residence|32.382|119.431|90|0|30|盐商宅院|围绕厅堂与盐商生活认识城南历史，餐饮经营区域与文保参观范围分开确认。
eight-eccentrics|扬州八怪纪念馆|Eight Eccentrics Memorial Hall|32.401|119.425|90|20|40|艺术纪念馆|在古寺空间中看扬州画派与书画故事，适合有兴趣细看而非与多个博物馆赶场。
zhushi|朱自清故居|Zhu Ziqing Former Residence|32.392|119.451|60|0|20|文学纪念馆|小院与生平陈列把散文中的生活带回具体街巷，可与皮市街顺路组合。
shikefa|史可法纪念馆|Shi Kefa Memorial Hall|32.407|119.431|90|0|20|历史纪念馆|用史可法相关史料与园林纪念空间了解明清之际扬州历史，保留阅读时间。
wenchang|文昌阁|Wenchang Pavilion Yangzhou|32.396|119.429|30|0|0|城市地标|在道路公共观景处看古城地标，不横穿车流进入交通岛，适合作为短暂停留。
songjiacheng|宋夹城遗址公园|Songjiacheng Archaeological Park|32.425|119.425|120|0|0|历史与城市公园|城址轮廓、湖面与公共运动空间组合成轻松半日，遗址和现代景观需要区分。
guanyin|观音山禅寺|Guanyin Mountain Temple Yangzhou|32.434|119.412|75|0|20|宗教建筑|沿山路看寺院与扬州北部城景，可与大明寺择一深入，尊重宗教活动。
zhuyuwan|茱萸湾风景区|Zhuyuwan Scenic Area|32.429|119.497|180|30|80|自然公园|沿水岸和园区看自然环境，动物展示区域按兴趣选择，和古城区之间需交通。
shaobo|邵伯古镇|Shaobo Ancient Town|32.534|119.506|180|0|50|运河古镇|从老街、码头与运河设施理解水运生活，距市区较远，适合单独半日。|R
gaoyou-post|盂城驿|Yucheng Postal Station Gaoyou|32.777|119.436|120|25|50|驿站历史|在高邮看古代驿传建筑与运河关系，需安排城际交通，不能当作扬州市内小景点。|R''')
experiences(c,'''morning-tea|扬州早茶与烫干丝|Yangzhou Morning Tea|32.400|119.439|100|50|150|food-life|在富春、冶春或趣园等具体茶社按预约或排队规则吃早茶，小份点三丁包、烧卖与干丝，本项替代早餐。|扬州早茶|1||
storytelling|扬州评话听书|Yangzhou Storytelling Performance|32.400|119.432|90|30|100|performance|按扬州曲艺场所的当期节目选择评话或清曲，方言理解有门槛，可先看剧情介绍再入场。|扬州评话|0||D
woodblock|扬州雕版印刷体验|Yangzhou Woodblock Printing|32.396|119.369|100|30|150|craft|向双博馆或官方研学活动咨询拓印与雕版体验，先了解刀具、版材和工作人员指导；开放课不保证每天举办。|雕版印刷|2||D
canal-boat|古运河夜游船|Yangzhou Ancient Canal Cruise|32.401|119.450|90|60|150|water|按公开运营码头与航班登船看运河两岸，预算随船型和路线变化，散场到住宿的交通另留。|扬州古运河|0||D
paper-cut|扬州剪纸入门|Yangzhou Paper-cutting Workshop|32.400|119.439|100|60|180|craft|向非遗展示馆或正规手作机构预约，了解花鸟纹样和折剪技巧；课程价格与作品装裱分开。|扬州剪纸|0||''')
foods(c,'''sanding|三丁包|Sand­ing Steamed Bun|以笋、鸡肉和猪肉等切丁作馅的包子，茶社常按笼或份供应。|富春茶社或冶春茶社|12|35|三丁包
gansi|大煮干丝|Huaiyang Boiled Tofu Shreds|豆腐干切细丝入鲜汤，配料因店而异，软嫩口感与早餐烫干丝不同。|富春茶社与淮扬菜馆|30|80|大煮干丝
lion-head|清炖狮子头|Clear-braised Lion's Head Meatball|细切猪肉团慢炖，松软而非弹牙，通常按位或盅点单。|趣园茶社与淮扬菜馆|25|70|狮子头
fried-rice|扬州炒饭|Yangzhou Fried Rice|米饭配蛋、虾仁与蔬菜等翻炒，传统与餐馆版本用料各有不同。|扬州古城淮扬菜馆|20|55|扬州炒饭
jade-shaomai|翡翠烧卖|Jade Shaomai|青菜馅形成翠绿色，小巧烧卖常作为茶点，甜咸口味先问清。|富春茶社与冶春茶社|12|35|翡翠烧卖'''.replace('Sand­ing','Sanding'))
hotels(c,'''hampton|扬州瘦西湖希尔顿欢朋酒店|Hampton by Hilton Yangzhou Slender West Lake|32.395|119.412|350|850|文昌中路的连锁酒店，适合兼顾古城与瘦西湖，节假日早茶需另排队。|https://www.hilton.com/en/hotels/ytyyahx-hampton-yangzhou-slender-west-lake/
fairfield|扬州瘦西湖万枫酒店|Fairfield Yangzhou Slender West Lake|32.419|119.398|280|650|瘦西湖西侧方向的舒适连锁选择，具体入口与公交距离先确认。|https://www.marriott.com/en-us/hotels/ytysf-fairfield-yangzhou-slender-west-lake/overview/
shangrila|扬州香格里拉|Shangri-La Yangzhou|32.403|119.355|550|1300|西区完整服务酒店，房间较宽敞，去东关街与老城需要交通。|https://www.shangri-la.com/yangzhou/shangrila/
doubletree|扬州三盛希尔顿逸林酒店|DoubleTree by Hilton Yangzhou|32.369|119.401|500|1200|城市商业区的完整服务酒店，适合大运河博物馆方向与城市休息日。|https://www.hilton.com/en/hotels/ytydtdi-doubletree-yangzhou/
express|扬州文昌阁智选假日酒店|Holiday Inn Express Yangzhou City Center|32.399|119.421|230|550|古城外围的较经济连锁住宿，适合以公交和步行连接文昌阁附近街区。|https://www.ihg.com/holidayinnexpress/hotels/us/en/yangzhou/nkgyc/hoteldetail''')

c=city('shaoxing','绍兴','Shaoxing','CN-ZJ',29.996,120.586,'HGH',3,'课本中的院落、黄酒气息、石桥与乌篷船，让绍兴适合沿水慢走，再留一晚听戏或品地方菜。','古城可步行与公交、地铁衔接；兰亭、安昌和柯岩各是不同方向。杭州萧山机场是外部门户，绍兴北站距老城仍需接驳。')
places(c,'''luxun|鲁迅故里|Lu Xun Native Place|29.991|120.581|180|0|0|文学与历史街区|结合故居、祖居与纪念馆理解鲁迅作品里的日常，按预约规定进入，不把多个院落重复当作不同必去景点。
shen-garden|沈园|Shen Garden|29.989|120.588|90|30|60|古典园林|白天看池石与题刻，了解陆游与唐琬故事；夜间演出另售，不与日票混算。
l ant ing|兰亭|Orchid Pavilion|29.901|120.535|150|60|100|书法与园林|以兰亭集序、曲水与书法展陈为线索参观，距古城有车程，适合单独半日。|R
east-lake|东湖|East Lake Shaoxing|30.009|120.641|150|45|80|采石湖泊|崖壁与水面由历史采石形成，岸线游览和乌篷船分别选择，船程与排队另留。
dayu|大禹陵|Mausoleum of Yu the Great|29.964|120.619|150|40|70|历史祭祀建筑|从祭祀空间与展陈理解大禹文化，台阶较多，典礼日期会影响参观区域。
cangqiao|仓桥直街|Cangqiao Straight Street|29.998|120.574|100|0|0|水乡街区|沿河看民居、石桥和餐馆，居民生活与商业并存，不将宅院门口当作拍摄布景。
shusheng|书圣故里|Sage of Calligraphy Historic Quarter|30.010|120.585|120|0|30|书法与街巷|沿题扇桥、墨池与小巷了解王羲之文化，纪念场馆和公共街巷分开安排。
bazi|八字桥|Bazi Bridge|30.003|120.594|50|0|0|古桥与水巷|站在公共桥面观察多条水路和道路的衔接，桥边为居民区，轻声通行。
zhouenlai|周恩来祖居|Zhou Enlai Ancestral Residence|30.007|120.586|75|0|0|历史教育|以家族和绍兴联系的展陈认识周恩来早年背景，闭馆与团体预约需先核对。
qiujin|秋瑾故居|Qiu Jin Former Residence|29.983|120.576|70|0|0|历史教育|在故居展厅了解秋瑾的思想与革命活动，适合与塔山一带历史路线组合。
datong|大通学堂|Datong School|30.006|120.573|60|0|0|近代教育遗址|理解清末新式教育与革命活动的联系，室内开放和讲解按管理要求确认。
museum|绍兴博物馆|Shaoxing Museum|30.001|120.568|120|0|0|地方历史博物馆|从越地文化到水城发展选择展线，为之后古城散步补充背景。
xuwei|徐渭艺术馆与青藤书屋|Xu Wei Art Museum and Green Vine Study|29.993|120.575|120|0|40|艺术与文学|将现代展馆与青藤书屋结合认识徐渭，预约和特别展览可能不同，优先看同一主题。
huangjiu|中国黄酒博物馆|China Yellow Wine Museum|30.012|120.570|100|20|50|饮食文化博物馆|了解稻米、酒曲与绍兴酿造工序，品酒与商品销售不等于基础展馆门票。
dongpu|东浦黄酒小镇|Dongpu Yellow Wine Town|30.062|120.539|150|0|60|酿造古镇|看水巷、酒坊与黄酒日常，生产区只有获准时进入，餐饮与体验分别核价。|R
anchang|安昌古镇|Anchang Ancient Town|30.143|120.490|180|0|80|水乡古镇|沿河看腊味、老店和石桥，公共街巷与展馆联票分开，冬季风味最鲜明但并非全年晒酱肉。|R
keyan|柯岩风景区|Keyan Scenic Area|30.053|120.482|210|70|120|采石遗迹与水乡|石佛、云骨与鉴湖各有不同游线，按体力选主线，景区间船程和票种需要核对。|R
fushan|府山公园|Fushan Park Shaoxing|29.999|120.564|90|0|0|城市山地|登缓坡看古城屋顶与越地历史相关遗迹，适合作为不赶场的短段休息。
tashan|塔山公园|Tashan Park Shaoxing|29.987|120.577|75|0|0|城市山地与古塔|围绕应天塔外观和林荫步道轻松登高，塔身内部是否开放以现场为准。
yangming|阳明故里|Wang Yangming Native Place|30.011|120.568|100|0|60|思想与历史街区|通过故里相关展陈认识王阳明与绍兴的关系，公共空间和主题场馆按实际开放选择。'''.replace('l ant ing','lanting'))
experiences(c,'''wupeng|乌篷船水巷体验|Shaoxing Wupeng Boat Ride|29.991|120.584|60|60|180|water|在官方运营码头确认路线、每船人数和往返方式，慢看水巷与桥洞；按船或人数报价不能混淆，遇恶劣天气停航。|乌篷船|1||
huangjiu-tasting|黄酒品鉴与花雕文化|Shaoxing Rice Wine Tasting|30.012|120.570|90|50|160|food-life|在黄酒博物馆或正规酒坊预约品鉴，比较酒龄和甜度，少量品尝或选择无酒精介绍；饮酒后不驾驶。|绍兴酒|0||
opera|沈园之夜越地戏曲|Shen Garden Evening Performance|29.989|120.588|100|100|200|performance|按当日节目观看结合园林与地方戏曲的夜间演出，票价与日间园林参观分开，预约具体场次后加入行程。|越剧|2||D
calligraphy|兰亭书法与扇面课|Lanting Calligraphy Workshop|29.901|120.535|120|80|240|craft|向兰亭正规研学机构咨询基础书法或扇面体验，先确认场地、材料和授课时长，景区门票是否包含需单独核对。|中国书法|2||R
winter-town|安昌腊月年俗寻味|Anchang Winter Food Traditions|30.143|120.490|150|30|100|festival|冬季在安昌公开街巷观察酱货晾晒与传统小吃，逛当年公布的年俗活动；不保证每个冬日都有表演，食品消费另计。|安昌古镇|0|12,1,2|RD''')
foods(c,'''fennel-beans|茴香豆|Fennel-seasoned Broad Beans|蚕豆以茴香等香料煮制，咸鲜软糯，常作为小碟佐餐。|咸亨酒店餐厅|8|25|茴香豆
preserved-pork|梅干菜扣肉|Pork with Preserved Mustard Greens|梅干菜吸收蒸肉汤汁，味道浓厚，适合配米饭分享。|寻宝记绍兴菜与古城菜馆|45|95|梅菜扣肉
stinky-tofu|绍兴臭豆腐|Shaoxing Stinky Tofu|地方卤水发酵豆腐后油炸，外脆内软，酱料和辣度按店家做法不同。|鲁迅故里与仓桥直街小吃铺|10|25|臭豆腐
drunken-chicken|花雕醉鸡|Huadiao Drunken Chicken|熟制鸡肉浸入含黄酒的卤汁，冷食带酒香；含酒精，按个人偏好选择。|咸亨酒店餐厅与绍兴菜馆|35|80|醉鸡
cream-xiaopan|奶油小攀|Shaoxing Cream Xiaopan|杯状烤点心带蓬松蛋白层，是绍兴常见甜点，现制与包装版本口感不同。|鲁迅故里传统点心铺|5|15|奶油小攀''')
hotels(c,'''crowne|绍兴世茂皇冠假日酒店|Crowne Plaza Shaoxing|30.013|120.604|500|1100|迪荡梅龙湖旁的高层酒店，去老城需短途交通，湖景依所订房型。|https://www.ihg.com/crowneplaza/hotels/cn/zh/shaoxing/hghsx/hoteldetail
dayu|绍兴大禹开元观堂|Dayu New Century Grand House Shaoxing|29.967|120.616|850|2400|大禹陵附近的村落式度假酒店，适合慢住与文化路线，距老城有接驳。|https://hotels.ctrip.com/hotels/433096.html
xianheng|绍兴咸亨酒店|Shaoxing Xianheng Hotel|29.991|120.583|600|1500|鲁迅故里附近的文化酒店，预订时区分客房物业与历史咸亨餐馆。|https://www.booking.com/searchresults.html?ss=Shaoxing+Xianheng+Hotel
holiday|绍兴袍江智选假日酒店|Holiday Inn Express Shaoxing Paojiang|30.061|120.624|230|550|袍江片区的经济连锁住宿，适合自驾或商务结合旅行，去古城应计入交通。|https://www.ihg.com/holidayinnexpress/hotels/us/en/shaoxing/rnxsp/hoteldetail
shaoxing-hotel|绍兴饭店|Shaoxing Hotel|30.000|120.569|500|1400|府山附近的园林式城市酒店，适合古城步行路线，庭园与房型位置需确认。|https://www.booking.com/searchresults.html?ss=Shaoxing+Hotel''')

c=city('chaozhou','潮州','Chaozhou','CN-GD',23.656,116.623,'SWA',3,'在潮州，一杯工夫茶可以连接木雕、潮剧、韩江与一桌小菜；古城之外还有古寨和凤凰山茶乡。','古城适合步行，广济桥两岸可组合；龙湖古寨、凤凰茶乡和饶平各另安排交通。揭阳潮汕机场与潮汕高铁站均在古城外，不能按步行接驳。')
places(c,'''guangji|广济桥|Guangji Bridge|23.665|116.655|90|20|40|历史桥梁|观察石梁与浮桥的组合，开合与灯光安排以当日公告为准；到达前先确认是否能步行过桥。
han-yu|韩文公祠|Han Yu Memorial Temple|23.666|116.662|100|0|30|历史纪念建筑|沿台阶看纪念韩愈的祠宇、碑刻与韩江视野，适合在安静时段阅读历史背景。
kaiyuan|潮州开元寺|Kaiyuan Temple Chaozhou|23.662|116.646|75|0|0|宗教建筑|在古城寺院观察殿宇与传统工艺，礼拜活动优先，遵守现场摄影与参观要求。
paifang|牌坊街|Paifang Street Chaozhou|23.659|116.647|120|0|0|历史商业街|沿太平路辨认牌坊题额和商铺，想吃的店可先选几家，避免一路只排队。
xu-mansion|许驸马府|Xu Imperial Son-in-law Mansion|23.665|116.643|90|20|40|宋代民居|以木构、院落和居住布局认识古城民居，不同年代修缮痕迹也是参观的一部分。
jilue|己略黄公祠|Ji Lue Huang Ancestral Hall|23.661|116.644|60|10|30|潮州木雕|木雕与梁架细节密集，适合停下来观察人物和纹样，馆内拍摄遵守保护规定。
westlake|潮州西湖公园|Chaozhou West Lake Park|23.671|116.637|100|0|0|城市公园|沿湖与山坡留一段轻松时间，历史小展馆、游船或娱乐项目另核价。
rao-museum|饶宗颐学术馆|Jao Tsung-I Petite Ecole Chaozhou|23.663|116.648|75|0|0|学术与艺术|通过书画和学术陈列认识饶宗颐，适合对潮州文化有兴趣的慢游者。
guangji-gate|广济门城楼|Guangji Gate Tower|23.664|116.652|50|0|20|城门建筑|从公共广场看城门与韩江的关系，登楼或内部展览按实际开放范围预算。
city-wall|潮州古城墙滨江段|Chaozhou Riverside City Wall|23.668|116.652|60|0|0|城墙与滨水|沿可进入的城墙和滨江长廊看江景，部分墙段不可攀爬，与过桥路线可顺接。
beige|北阁佛灯|Beige Scenic Area|23.673|116.653|90|10|30|山地古迹|沿北阁台阶看韩江与寺阁，雨天石阶湿滑，适合轻量登高。
haiyang-school|海阳县儒学宫|Haiyang Confucian Academy|23.663|116.649|75|0|20|儒学建筑|从院落和展陈了解潮州教育与礼制，校舍和文保空间以实际开放安排为准。
qinglong|青龙古庙|Qinglong Ancient Temple Chaozhou|23.649|116.647|60|0|0|民俗信仰|韩江岸边的庙宇连接地方水运与民俗，参观尊重祭祀，不将仪式视为固定游客表演。
fenghuangzhou|凤凰洲公园|Fenghuangzhou Park|23.645|116.652|90|0|20|江洲公园|从江洲看韩江桥梁与古城轮廓，汛期开放可能调整，水边不越护栏。
longhu|龙湖古寨|Longhu Ancient Village|23.560|116.630|180|0|60|古寨与民居|沿寨中街巷看宗祠和传统民居，开放宅院与居民生活空间分开，距市区有接驳。|R
congxi|从熙公祠|Congxi Ancestral Hall|23.579|116.602|90|10|30|石雕与祠堂|以精细石雕、木作和侨乡家族史为重点，拍照不可触碰构件，交通与龙湖方向协调。|R
danfu|淡浮院|Danfu Courtyard|23.643|116.710|120|20|50|艺术与园林|书法碑刻与园林山景结合，坡道与台阶较多，安静慢看比匆忙打卡更合适。|R
fenghuang-tea|凤凰山乌岽茶乡|Wudong Tea Village Phoenix Mountain|23.930|116.639|240|0|100|山地茶乡|在开放村路和茶园参观点认识单丛茶环境，山路较长，茶农生产区先征求许可。|R
daoyun|道韵楼|Daoyun Earthen Building|23.995|116.917|150|20|50|围楼建筑|在饶平看八角围楼与居民生活，房间和楼层是否开放需现场询问，安排完整往返。|R
huiru|慧如公园|Huiru Park|23.651|116.678|100|0|30|城市山地公园|韩江东岸的林荫步道适合安静休息，园中具体游乐设施按兴趣另计。''')
experiences(c,'''gongfu|潮州工夫茶席|Chaozhou Gongfu Tea Session|23.660|116.645|100|40|160|food-life|在古城有明码标价的茶馆看温杯、投茶与分杯，品尝凤凰单丛；茶席与购茶分开，不因参加就必须购买茶叶。|工夫茶|1||
woodcarving|潮州木雕工艺观摩|Chaozhou Woodcarving Visit|23.661|116.644|100|50|200|craft|经正规工坊预约观察多层镂雕与贴金工序，初学手作应在师傅指导下进行，工具和材料需确认。|潮州木雕|1||
opera|潮剧与潮州音乐现场|Teochew Opera Evening|23.660|116.646|120|30|200|performance|按潮州影剧院等公布场次看潮剧或潮州音乐，先阅读故事梗概，社区庙会演出不能默认每天都有。|潮剧|2||D
lantern-festival|青龙庙会民俗观察|Qinglong Temple Festival|23.649|116.647|150|0|0|festival|在官方公布的农历节庆日期从公共区域观察巡游与锣鼓，保持通道畅通，不进入仪式封控范围，交通另留。|青龙古庙|2|2,3|D
phoenix-tea|凤凰单丛茶乡品鉴|Phoenix Dancong Tea Countryside|23.930|116.639|180|80|250|nature|预约凤凰山公开接待茶庄，了解茶树品种、海拔与香型，采茶体验取决于生产季和接待安排，不能自行进入茶园。|凤凰单丛|1||R''')
foods(c,'''beef-balls|潮州牛肉丸|Teochew Beef Balls|手打或机械捶打方式与肉含量不同，汤煮或火锅皆常见，先按小份尝弹性与肉香。|牌坊街及西马路牛肉店|20|45|牛肉丸
oyster|潮州蚝烙|Teochew Oyster Omelette|蚝仔配粉浆煎至边缘酥脆，鱼露蘸味；海鲜过敏者需避开。|西马路潮州小吃店|25|60|蚝烙
rice-roll|潮州肠粉|Chaozhou Rice Noodle Roll|米皮包蛋肉或蔬菜，淋地方做法的酱汁，早餐店常按份现蒸。|开元路与西马路早餐铺|10|25|潮汕肠粉
sweet-taro|反沙芋头|Sugar-crusted Taro|炸熟芋块裹细白糖砂，外层甜脆内部粉糯，适合少量分享。|胡荣泉及古城小吃店|15|35|反沙芋
peach-kueh|红桃粿|Red Peach-shaped Rice Cake|粉红米皮压桃形，常见糯米等馅料，祭祀与日常小吃各有用途。|西马路传统粿品铺|5|15|红桃粿''')
hotels(c,'''crowne|潮州腾瑞皇冠假日酒店|Crowne Plaza Chaozhou Riverside|23.644|116.665|700|1800|韩江东岸的高层江景酒店，往返古城需过桥，江景房型与早餐分别确认。|https://www.ihg.com/crowneplaza/hotels/us/en/chaozhou/swacg/hoteldetail
hampton|潮州财富中心希尔顿欢朋酒店|Hampton by Hilton Chaozhou Fortune Center|23.644|116.610|350|850|财富中心的舒适连锁住宿，适合交通接驳与城市餐饮，去牌坊街仍需车程。|https://www.hilton.com/en/hotels/swagghx-hampton-chaozhou-fortune-center/
chaozhou-hotel|潮州宾馆|Chaozhou Hotel|23.658|116.634|280|700|靠近西湖与古城方向的城市酒店，适合传统观光路线，房型装修差异需核对。|https://www.booking.com/searchresults.html?ss=Chaozhou+Hotel
han-ting|韩思·悦酒店潮州古城人民广场店|Hansiyue Hotel Chaozhou Ancient City People Square|23.659|116.624|230|600|古城外围的中档住宿选择，预订时核对具体门店、停车与步行入口。|https://hotels.ctrip.com/hotels/1732553.html
linjiang|潮州临江酒店|Chaozhou Linjiang Hotel|23.677|116.662|300|800|金山大桥东侧的城市酒店，适合江景休息，过江前往古城需交通，房间朝向与隔音按房型确认。|https://hotels.ctrip.com/hotels/69475016.html''')

c=city('macau','澳门','Macao','MO',22.194,113.541,'MFM',3,'葡式铺石路、岭南庙宇、土生葡菜和离岛海风构成澳门，半岛古城与路氹度假区值得分天体验。','半岛古城以步行为主，巴士和轻轨连接氹仔、路氹、路环与机场。珠海高铁到站后仍有口岸步行、通关和澳门段交通，不按澳门机场到达计费。','Macau','MOP',[[450,1000,2400],[120,280,650],[30,80,250],[30,80,180]],[[5000,9000,18000],[500,850,1400]])
c['aliases']+=['Macao','澳門']
c['photoFile']="Ruins of Saint Paul's (Ruínas de São Paulo) , Macau (2).jpg"
c['imageContextNote']='澳门大三巴牌坊与通往古城的石阶实景，拍摄于2019年。'
places(c,'''st-pauls|大三巴牌坊|Ruins of Saint Paul's|22.1987|113.5409|60|0|0|世界遗产建筑|从立面雕刻读中西宗教与工艺交流，地下展区按实际开放选择，阶梯上避让人流。
senado|议事亭前地|Senado Square|22.1934|113.5397|60|0|0|历史广场|葡式铺石与街道两侧建筑形成古城中心，日间和夜间气氛不同，雨后石路较滑。
ama|妈阁庙|A-Ma Temple|22.1862|113.5312|70|0|0|宗教与海洋文化|沿台阶看庙宇与海上信仰的联系，香火区尊重礼仪，避免把祭祀者当拍摄对象。
mandarin|郑家大屋|Mandarin's House|22.1889|113.5343|90|0|0|历史民居|在庭院、门窗与生活空间中认识郑观应及岭南民居，按预约和限流要求参观。
lou-kau|卢家大屋|Lou Kau Mansion|22.1941|113.5410|50|0|0|历史民居|紧凑宅院展示中式建筑与西式装饰的相遇，适合作为古城半日线的小停留。
dominic|玫瑰堂|Saint Dominic's Church Macau|22.1949|113.5407|50|0|0|宗教与艺术|在礼拜允许时段进入教堂或圣物宝库，观察巴洛克外观与宗教艺术，避免喧哗。
fortress|大炮台|Mount Fortress|22.1975|113.5421|75|0|0|军事历史与城市景观|沿城墙看澳门半岛轮廓，烈日时缺遮荫，可与澳门博物馆组合安排。
museum|澳门博物馆|Macao Museum|22.1975|113.5418|120|10|20|地方历史博物馆|从民居、商贸与社群生活理解城市形成，入馆票与大炮台免费区域分开计算。
guia|东望洋炮台与灯塔|Guia Fortress and Lighthouse|22.1964|113.5501|120|0|0|军事与航海地标|沿山路看灯塔、炮台和圣母雪地殿，灯塔内部并非每日开放，步行上下坡另留。
maritime|海事博物馆|Maritime Museum Macau|22.1859|113.5311|100|0|20|海洋博物馆|在妈阁附近认识渔业、航海与水上生活，适合炎热午间或雨天参观。
grand-prix|澳门大赛车博物馆|Macao Grand Prix Museum|22.1964|113.5536|150|60|100|运动与城市文化|赛车实物、赛事历史与互动装置展示城市街道赛文化，模拟器和特殊活动可能另有规则。
art|澳门艺术博物馆|Macao Museum of Art|22.1883|113.5543|120|0|0|艺术博物馆|按当期展览看澳门与中外艺术，文化中心周边可步行休息，先确认闭馆日。
taipa-houses|龙环葡韵住宅式博物馆|Taipa Houses Museum|22.1545|113.5587|100|0|0|历史住宅与湿地|绿色住宅与湿地相邻，展馆和户外空间各有开放安排，适合了解离岛旧生活。
taipa-village|氹仔旧城区与官也街|Taipa Village and Rua do Cunha|22.1533|113.5549|120|0|0|社区与饮食街区|从窄街、庙宇和土生葡菜餐馆认识旧氹仔，官也街之外留时间看周边住宅街道。
coloane|路环市区|Coloane Village|22.1170|113.5510|150|0|0|离岛村落|沿海边与小街看彩色屋舍和村落日常，教堂、咖啡与小吃适合慢慢停留。
hacsa|黑沙海滩|Hac Sa Beach|22.1163|113.5720|150|0|0|海岸自然|在沙滩与岸线休息，游泳取决于水质、天气和救生开放，餐饮与设备租用另计。
seacpai|石排湾郊野公园|Seac Pai Van Park|22.1282|113.5640|150|0|20|自然公园|按兴趣选择步道和大熊猫馆等场馆，公共公园与付费展馆范围分开核对。
loulim|卢廉若公园|Lou Lim Ieoc Garden|22.2010|113.5461|70|0|0|岭南园林|湖石、曲桥与竹影构成紧凑园林，适合在半岛行程中留一段安静休息。
st-lazarus|望德堂坊|Saint Lazarus Quarter|22.1988|113.5446|75|0|0|历史艺术街区|彩色建筑与小型文化空间值得走进街巷观察，画廊和活动按实际开放选择。
tower|澳门旅游塔观光层|Macau Tower Observation Deck|22.1795|113.5375|120|160|230|城市观景|从高处看半岛、跨海桥梁与珠海方向，观光层门票不含高空项目和餐厅套餐。''')
experiences(c,'''macanese|土生葡菜风味餐桌|Macanese Cuisine Meal|22.153|113.555|120|180|450|food-life|选择有明确菜单的土生葡菜餐馆，比较非洲鸡、免治与香料米饭；菜单可能以澳门元或港元标价，结账前确认币种。|土生葡菜|2||
dragonboat|南湾湖龙舟赛观赛|Nam Van Lake Dragon Boat Races|22.185|113.542|180|0|0|festival|按当年澳门国际龙舟赛公告选择公众观赛区域，留出拥挤时段的步行与返程；并非普通日期常设活动。|澳门国际龙舟赛|2|5,6|D
fado|葡语音乐与法朵晚间场|Portuguese Music and Fado Evening|22.191|113.539|120|150|450|performance|按文化场馆或餐厅公布场次听葡语音乐，核对是否真正有现场法朵、餐饮是否含在票价中，不能把背景音乐当演出。|法朵|2||D
coloane-trail|路环山海轻徒步|Coloane Coastal Hiking|22.113|113.574|150|0|0|nature|选择黑沙龙爪角海岸径等开放短线看岩岸，携带饮水并避开正午、台风和强降雨，不翻越护栏。|路环|2|1,2,3,4,10,11,12|
portuguese-baking|葡式蛋挞与旧村下午茶|Portuguese Egg Tart Afternoon|22.117|113.551|75|35|90|food-life|在路环安德鲁饼店等实际门店买现烤蛋挞，找公开休息区或有座咖啡店慢慢吃，座位与饮品单独确认。|葡式蛋挞|2||''')
foods(c,'''egg-tart|澳门葡式蛋挞|Macau Portuguese Egg Tart|酥皮与表面焦糖斑是常见特色，现烤蛋香浓，按个购买方便分享。|路环安德鲁饼店或澳门半岛玛嘉烈饼店|10|18|葡式蛋挞
minchi|免治|Minchi|碎肉与薯粒搭配米饭，常加煎蛋，是土生葡菜里的家常味道。|氹仔旧城土生葡菜餐馆|75|140|免治
african-chicken|非洲鸡|African Chicken Macanese Style|澳门版本常用香料、椰香或花生酱等组合，做法随餐厅变化，并非一道固定的非洲菜谱。|氹仔旧城与澳门半岛土生葡菜馆|110|220|非洲鸡
pork-bun|猪扒包|Pork Chop Bun|香煎或炸猪扒夹入面包，骨头与调味随店不同，趁热吃外皮口感更好。|氹仔大利来记|40|75|猪扒包
serradura|木糠布丁|Serradura|奶油层与饼干碎叠成的冷甜点，名称来自碎屑外观，份量通常较小。|氹仔葡式甜品店与土生葡菜餐厅|25|55|木糠布丁''')
hotels(c,'''sofitel|澳门十六浦索菲特大酒店|Sofitel Macau at Ponte 16|22.196|113.535|850|1900|内港历史街区旁的完整服务酒店，适合半岛步行线，距路氹娱乐区较远。|https://all.accor.com/hotel/6480/index.en.shtml
lisboa|澳门葡京酒店|Hotel Lisboa Macau|22.189|113.544|650|1600|半岛老牌城市酒店，靠近南湾与古城交通节点，具体翼楼与房型差异较大。|https://www.hotelisboa.com/
venetian|澳门威尼斯人|The Venetian Macao|22.147|113.559|1500|3500|路氹大型度假综合体，适合演出、购物和酒店休闲，往半岛需单独交通。|https://www.venetianmacao.com/hotel.html
grand-coloane|澳门鹭环海天度假酒店|Grand Coloane Resort|22.117|113.578|700|1800|黑沙海岸方向的度假酒店，适合海边休息与徒步，去古城和餐馆需提前安排。|https://www.grandcoloane.com/
caravel|澳门卡爾酒店|Caravel Hotel Macau|22.198|113.535|450|1000|内港一带的小型城市酒店，适合以古城为主的行程，房间面积和电梯位置先看房型说明。|https://www.caravelhotelmacau.com/''')

c=city('leshan','乐山','Leshan','CN-SC',29.552,103.766,'CTU',3,'三江汇流与大佛石刻之外，乐山的午后常在茶馆和小吃店之间展开；苏稽、嘉阳与峨眉方向值得另留整日。','城区公交与出租车结合，高铁乐山站距大佛景区仍需接驳。成都机场是外部门户；峨眉山、嘉阳、罗城和夹江均为城外路线，不能直接按市区相连。')
places(c,'''giant-buddha|乐山大佛|Leshan Giant Buddha|29.545|103.773|240|80|100|世界遗产石刻|从山上与开放栈道看唐代大佛，热门时段排队较长，游船观佛另售且不代替登山参观。
oriental-buddha|东方佛都|Oriental Buddha Park|29.535|103.779|180|70|100|当代佛教雕塑|现代营建的雕塑园与乐山大佛是不同景区，洞窟和户外造像较多，不将其误认为唐代原存石刻。
mahao|麻浩崖墓|Mahao Cliff Tombs|29.536|103.775|100|0|40|汉代考古|通过开放崖墓与展陈认识汉代墓葬形制，票种与大佛景区关系现场确认。
leshan-museum|乐山博物馆|Leshan Museum|29.552|103.774|100|0|0|地方历史博物馆|在进入大佛区域前了解嘉州历史与地方文物，闭馆日及预约须提前核对。
confucian|乐山文庙|Leshan Confucian Temple|29.563|103.768|75|0|0|儒学建筑|看嘉州旧城中的庙学空间与建筑，开放展陈以当日管理为准。
wuyou|乌尤寺|Wuyou Temple|29.530|103.773|120|0|30|山地寺院|登乌尤山看三江与寺院建筑，台阶较多，与大佛组合时避免压缩体力和返程。
jiading-wall|嘉州古城墙|Jiading Ancient City Wall|29.557|103.770|75|0|0|历史城墙|在保留墙段与公开滨江步道看江城关系，部分城门与墙体只适合外观参观。
shangzhongshun|上中顺特色街区|Shangzhongshun Historic Quarter|29.552|103.765|90|0|0|街区与地方饮食|小吃、老城街道与文创空间相邻，挑几样想吃的食物边走边休息，消费另计。
zhang-gongqiao|张公桥美食街|Zhanggongqiao Food Street|29.577|103.769|90|0|0|夜市与地方餐桌|以钵钵鸡、甜皮鸭和小吃认识嘉州夜生活，按实际店家标价消费，避免重复正餐预算。
lvxin|嘉州绿心公园|Jiazhou Green Heart Park|29.585|103.748|150|0|0|城市自然公园|林荫道适合散步与轻骑行，先选短线，秋季与春季植物景观各有特点。
haitang|海棠公园|Haitang Park Leshan|29.570|103.746|90|0|0|城市公园|在城中绿地和步道安排轻松休息，春季花期受天气影响，夜间留意开放时段。
suji|苏稽古镇|Suji Ancient Town|29.591|103.669|180|0|0|古镇与饮食文化|沿峨眉河看老街和石桥，将跷脚牛肉午餐与镇中散步结合，距城区需接驳。|R
luocheng|罗城古镇|Luocheng Ancient Town|29.346|104.005|180|0|0|川南古镇|船形街的檐廊、茶馆与日常商铺是重点，尊重当地人的休息空间，往返乐山另留。|R
qianfo|夹江千佛岩|Jiajiang Thousand Buddha Cliff|29.768|103.549|150|30|60|石刻与江景|沿青衣江岸开放路线看摩崖造像，雕刻年代与修缮痕迹可配讲解理解，别触摸石刻。|R
dongfeng|东风堰|Dongfeng Weir|29.770|103.549|90|0|30|水利遗产|从公开观景区域认识引水工程和沿江生活，可与千佛岩结合，不进入运行设施。|R
jiajiang-paper|夹江手工造纸博物馆|Jiajiang Handmade Paper Museum|29.772|103.552|100|0|40|传统工艺|通过纸料、竹帘和工序展示了解川纸，现场体验需另约，开放时间先确认。|R
jiayang|嘉阳矿山与芭沟古镇|Jiayang Mining Heritage and Bagou Town|29.238|103.824|240|0|80|工业遗产|在公开矿区展示与芭沟街巷看铁路和矿业社区，小火车与矿井体验另行预约付费。|R
qianwei-confucian|犍为文庙|Qianwei Confucian Temple|29.210|103.952|100|20|40|儒学建筑|看布局完整的文庙院落与装饰，和嘉阳可按交通情况组合，但不挤成市内半日。|R
emei|峨眉山风景区|Mount Emei Scenic Area|29.549|103.335|480|160|400|世界遗产山地|选择山脚寺院或金顶方向之一作整日路线，接驳车、索道与高山天气都需准备，乐山往返另算。|R
baoguo|峨眉山报国寺|Baoguo Temple Mount Emei|29.563|103.433|120|10|30|宗教建筑|山脚寺院适合寺院文化半日线，不能把报国寺与金顶间的山路当作短步行，保持宗教空间安静。|R''')
experiences(c,'''buddha-boat|三江游船远观大佛|Three Rivers Buddha-viewing Cruise|29.552|103.769|100|70|150|water|从正规码头按运营航线在江面远看大佛，受水位与天气影响；船票不包含大佛景区入园，若只选一种观佛方式可减少重复。
jiayang-steam|嘉阳蒸汽小火车|Jiayang Steam Railway|29.259|103.821|180|80|200|heritage|按官方班次体验窄轨蒸汽铁路与矿区风景，摄影停站、单程往返和座位票种先确认，接驳另留。
tea-house|嘉州茶馆一壶茶|Leshan Local Teahouse Afternoon|29.557|103.768|120|15|60|food-life|在滨江或老城茶馆按明码标价点茶，看当地人的日常节奏；休息本身就是这段行程，不强行再安排打卡。
paper-making|夹江竹纸抄纸体验|Jiajiang Bamboo Papermaking Workshop|29.772|103.552|120|60|200|craft|向夹江手工造纸展示机构预约，观察打浆、捞纸和晾晒，参与范围、带走纸张和接驳费用先确认。
food-crawl|乐山小份小吃巡礼|Leshan Small-portion Food Tasting|29.577|103.769|120|50|130|food-life|在张公桥选择钵钵鸡、甜皮鸭或豆腐脑小份分享，按一顿正餐预算组合，冷锅串签数和蘸料费用先问。'''.replace('water|从正规码头按运营航线在江面远看大佛，受水位与天气影响；船票不包含大佛景区入园，若只选一种观佛方式可减少重复。','water|从正规码头按运营航线在江面远看大佛，受水位与天气影响；船票不包含大佛景区入园，若只选一种观佛方式可减少重复。|乐山大佛|0||D').replace('heritage|按官方班次体验窄轨蒸汽铁路与矿区风景，摄影停站、单程往返和座位票种先确认，接驳另留。','heritage|按官方班次体验窄轨蒸汽铁路与矿区风景，摄影停站、单程往返和座位票种先确认，接驳另留。|嘉阳小火车|0||RD').replace('food-life|在滨江或老城茶馆按明码标价点茶，看当地人的日常节奏；休息本身就是这段行程，不强行再安排打卡。','food-life|在滨江或老城茶馆按明码标价点茶，看当地人的日常节奏；休息本身就是这段行程，不强行再安排打卡。|四川茶馆|2||').replace('craft|向夹江手工造纸展示机构预约，观察打浆、捞纸和晾晒，参与范围、带走纸张和接驳费用先确认。','craft|向夹江手工造纸展示机构预约，观察打浆、捞纸和晾晒，参与范围、带走纸张和接驳费用先确认。|手工造纸|0||R').replace('food-life|在张公桥选择钵钵鸡、甜皮鸭或豆腐脑小份分享，按一顿正餐预算组合，冷锅串签数和蘸料费用先问。','food-life|在张公桥选择钵钵鸡、甜皮鸭或豆腐脑小份分享，按一顿正餐预算组合，冷锅串签数和蘸料费用先问。|钵钵鸡|2||'))
foods(c,'''bobo|钵钵鸡|Bobo Chicken Skewers|熟制荤素串放入冷汤钵中浸味，红油与藤椒口味常见，按签或盘计费。|叶婆婆钵钵鸡与张公桥门店|30|70|钵钵鸡
qiaojiao|跷脚牛肉|Qiaojiao Beef Soup|牛肉与牛杂在清汤中烫煮，配蘸碟和米饭，先按人数选份量。|苏稽古镇跷脚牛肉馆|35|80|跷脚牛肉
sweet-duck|乐山甜皮鸭|Leshan Sweet-skinned Duck|卤鸭再处理成带甜味脆皮，常按半只或称重外带。|纪六孃等乐山甜皮鸭门店|35|85|甜皮鸭
tofu-pudding|乐山豆腐脑|Leshan Savory Tofu Pudding|豆花配粉条、酥肉或牛肉等做成咸鲜小碗，具体浇头和辣度可选。|九九豆腐脑与张公桥小吃店|10|25|豆腐脑
ka-bing|夹丝豆腐干|Shredded Radish Stuffed Tofu|豆腐干夹萝卜丝等配料再蘸汁，是乐山常见街头小食，可少量尝味。|老城与苏稽小吃铺|5|18|夹丝豆腐干''')
hotels(c,'''express|乐山广场智选假日酒店|Holiday Inn Express Leshan City Square|29.600|103.746|230|550|城市商业区经济连锁住宿，适合高铁抵达，往大佛需单独交通。|https://www.ihg.com/holidayinnexpress/hotels/us/en/leshan/ctuls/hoteldetail
hampton-center|乐山市中区希尔顿欢朋酒店|Hampton by Hilton Leshan Shizhong District|29.611|103.747|300|650|文星后街的城市酒店，适合城区与苏稽方向，注意与高铁站欢朋分店区分。|https://www.hilton.com/en/hotels/ctulwhx-hampton-leshan-shizhong-district/
hampton-station|乐山高铁站希尔顿欢朋酒店|Hampton by Hilton Leshan Railway Station|29.602|103.724|300|700|瑞祥路靠近高铁站，便于乘车抵离，游览大佛与老城需要接驳。|https://www.hilton.com/en/hotels/ybpbphx-hampton-leshan-railway-station/
jinjiang|乐山锦江嘉州宾馆|Leshan Jinjiang Jiazhou Hotel|29.555|103.768|450|1100|老城滨江一带的完整服务酒店，适合江景、茶馆与传统餐饮路线。|https://www.booking.com/searchresults.html?ss=Leshan+Jinjiang+Jiazhou+Hotel
chanyi|乐山禅驿嘉定院子酒店|Chanyi Jiading Yuanzi Hotel|29.557|103.777|650|1800|大佛嘉定坊方向的院落式住宿，适合清晨前往景区，具体入口与停车需确认。|https://hotels.ctrip.com/hotels/8514712.html''')

c=city('guiyang','贵阳','Guiyang','CN-GZ',26.579,106.713,'KWE',4,'山林就在城里，酸汤、丝娃娃和夜市让贵阳适合边走边吃；花溪、青岩与喀斯特水景又是另一种节奏。','旧城与观山湖以地铁连接；花溪、青岩、天河潭要分方向安排。南江峡谷、息烽与红枫湖独立成日，贵阳北站、东站与机场接驳不能混用。')
places(c,'''qianling|黔灵山公园|Qianling Mountain Park|26.608|106.692|240|0|0|城市山林|在开放步道看山林、湖水与寺院，免费入园仍需按官方要求预约；不投喂、不接近猕猴，保护随身食物。
jiaxiu|甲秀楼与翠微园|Jiaxiu Tower and Cuiwei Garden|26.570|106.720|100|0|0|历史建筑与水岸|从南明河岸看楼阁与桥梁，再按开放安排进入园林，夜景和日间展陈可以择一重点。
province-museum|贵州省博物馆|Guizhou Provincial Museum|26.647|106.644|180|0|0|地方历史博物馆|民族文化、历史文物与自然展陈适合选择性细看，位于观山湖方向，不与老城按步行相连。
geological|贵州省地质博物馆|Guizhou Geological Museum|26.647|106.627|150|0|0|地质与古生物|从喀斯特和古生物展览认识贵州山水的形成，预约和特展按馆方要求安排。
w enchang|文昌阁|Wenchang Pavilion Guiyang|26.581|106.723|60|0|0|历史建筑|看老城阁楼外观与开放展陈，周边小巷适合顺路走，不在宗教或文化空间喧哗。
yangming|阳明祠|Wang Yangming Memorial Temple Guiyang|26.589|106.725|90|0|0|思想文化|在山坡祠院认识王阳明与贵州的联系，台阶与小展厅需要放慢速度。
qianming|黔明寺|Qianming Temple|26.568|106.714|60|0|0|宗教建筑|南明河附近的城市寺院适合安静短访，开放和摄影要求以现场为准。
qingyun|青云市集|Qingyun Market Guiyang|26.564|106.714|120|0|0|夜间市集|地方小吃与当代摊店集中，按实际店铺标价消费，可直接替代当天晚餐安排。
minsheng|民生路菜场与小吃街|Minsheng Road Food Quarter|26.580|106.714|90|0|0|市场与街头饮食|从早餐摊、卤味与时令蔬菜看本地日常，不堵住居民买菜通道，消费另计。
taiping|太平路|Taiping Road Guiyang|26.586|106.712|75|0|0|城市街区|沿更新后的街巷找小店、咖啡与夜间餐饮，适合作为吃饭前后的自由活动。
guanshanhu|观山湖公园|Guanshanhu Park|26.645|106.629|150|0|0|城市湿地|湖岸和林地适合慢走或自然观察，具体步道和出口先规划，避免绕湖后找不到接驳。
huaxi-park|花溪公园|Huaxi Park|26.430|106.673|150|0|30|河流与园林|花溪河、桥与林荫形成悠闲半日，水边观景与游船等项目分开预算。|R
shilihetan|花溪十里河滩|Huaxi Shilihetan Wetland|26.470|106.678|150|0|0|湿地与自然|在开放栈道看河滩、荷塘与季节植被，可选择短段骑行，水上活动必须另找正规运营者。|R
qingyan|青岩古镇|Qingyan Ancient Town|26.334|106.675|210|10|80|山地古镇|在石板巷与城墙之间了解屯堡、商贸与宗教遗迹，基础票、联票和餐饮分开确认。|R
tianhetan|天河潭|Tianhetan Scenic Area|26.422|106.576|240|10|100|喀斯特水景|地面瀑布、溶洞与水上游线是不同票种，先选适合体力的一条，景区接驳和洞内排队需另留。|R
zhen-shan|镇山村|Zhenshan Village|26.392|106.604|150|0|30|布依族石板村|沿公开村道看石板房和湖岸聚落，尊重住户与宗教空间，村中活动需获邀请后参与。|R
gaopo|高坡云顶草原|Gaopo Yunding Grassland|26.271|106.834|240|0|80|高地自然|在开放观景与营地区域看山风和草地，日落或露营需确认天气、道路与经营资质，返程另留。|R
nanjiang|南江大峡谷|Nanjiang Grand Canyon|26.944|106.900|300|70|200|喀斯特峡谷|选择栈道观景或有资质的漂流产品，两者不是同一票种，暴雨水位不合适时取消。|R
xifeng|息烽集中营革命历史纪念馆|Xifeng Concentration Camp Memorial|27.061|106.749|150|0|0|历史教育|通过监禁遗址与展陈认识抗战时期政治迫害与革命历史，庄重参观，城际交通单独安排。|R
hongfeng|红枫湖|Hongfeng Lake|26.500|106.425|180|0|100|湖泊自然|选择合法开放岸线或运营游船看湖湾，不能随意进入水源保护区域，具体项目和交通先确认。|R'''.replace('w enchang','wenchang'))
experiences(c,'''sour-soup|酸汤与贵州蘸水餐桌|Guizhou Sour Soup Tasting|26.580|106.714|120|60|180|food-life|在正规贵州菜馆比较红酸汤和蘸水组合，鱼、牛肉等按份量询价，折耳根可分开放，本项替代正餐。|酸汤鱼|0||
batik|贵州蜡染手作入门|Guizhou Batik Workshop|26.579|106.713|150|100|280|craft|向市区非遗展示空间或正规工作室预约，学习蜡刀与防染图案；传统技法和当代旅游课程区分说明，染布完成时间先确认。|蜡染|0||
wetland-birds|花溪湿地远距观鸟|Huaxi Wetland Birdwatching|26.470|106.678|150|0|100|wildlife|在十里河滩公开步道用望远镜观察水鸟与季节变化，不投喂、不播放诱鸟声音，不保证遇见特定鸟种。|湿地水鸟|0|1,2,3,10,11,12|R
ethnic-performance|贵州民族歌舞舞台演出|Guizhou Ethnic Music and Dance Show|26.578|106.713|120|100|280|performance|按贵州大剧院等公开节目选择歌舞演出，了解编舞呈现与社区真实仪式的区别，座位和场次先确认。|贵州民族歌舞|0||D
market-breakfast|贵阳菜场早餐巡礼|Guiyang Market Breakfast Tasting|26.580|106.714|90|25|70|food-life|在民生路早餐铺挑肠旺面、糯米饭或豆腐圆子，小份组合感受不同口感，不重复叠加当天早餐预算。|贵阳小吃|0||''')
foods(c,'''changwang|肠旺面|Changwang Noodles|猪肠、血旺与面条组成的红油汤面，可按喜好调整辣度和配料。|金牌罗记肠旺面等老城面馆|15|30|肠旺面
siwawa|丝娃娃|Siwawa Vegetable Wraps|薄面皮包多种蔬菜丝再配酸汤或蘸水，桌上组合份量依店家不同。|丝恋等贵阳本地餐厅|25|60|丝娃娃
tofu-balls|雷家豆腐圆子|Guiyang Fried Tofu Balls|豆腐制成圆子炸至外壳酥脆，切开配蘸水，现炸时注意烫口。|雷家豆腐圆子|8|20|豆腐圆子
qingyan-trotter|青岩卤猪脚|Qingyan Braised Pork Trotter|卤猪脚配酸辣蘸水，通常按只或称重计费，适合分享。|青岩古镇卤猪脚店|30|65|卤猪蹄
sticky-rice|贵阳糯米饭|Guiyang Breakfast Sticky Rice|蒸糯米配油辣椒、脆哨和腌菜等，是常见早餐，具体配料可商量。|民生路与老城早餐摊|8|18|贵阳糯米饭''')
hotels(c,'''novotel-center|贵阳诺富特酒店|Novotel Guiyang Downtown|26.578|106.714|350|800|中华南路的城市酒店，便于吃小吃与游老城，交通噪声和景观依楼层房型。|https://all.accor.com/hotel/8032/index.en.shtml
novotel-panjiang|贵阳盘江诺富特饭店|Novotel Guiyang Panjiang|26.650|106.627|350|800|观山湖临城西路一带，适合省博与观山湖路线，去旧城需地铁或出租车。|https://all.accor.com/hotel/B1R1/index.en.shtml
hyatt|贵阳中天凯悦酒店|Hyatt Regency Guiyang|26.645|106.658|600|1400|观山湖的完整服务酒店，园林与会展区环境适合休息日，距老城有接驳。|https://www.hyatt.com/hyatt-regency/en-US/guihr-hyatt-regency-guiyang
sofitel|贵阳亨特索菲特酒店|Sofitel Guiyang Hunter|26.574|106.719|750|1800|亨特城市商业区的高层酒店，适合甲秀楼与旧城线路，景观与早餐按房型确认。|https://all.accor.com/hotel/8873/index.en.shtml
express-qingyan|贵阳青岩智选假日酒店|Holiday Inn Express Guiyang Qingyan|26.341|106.677|230|550|青岩古镇方向的经济连锁选择，适合花溪与古镇慢游，不能当作贵阳老城酒店安排。|https://www.ihg.com/holidayinnexpress/hotels/us/en/guiyang/kwegq/hoteldetail''')

def write_packs():
    meal_sessions={
      'ex-huangshan-hui-cuisine':('lunch','12:00','屯溪老街 徽菜馆'),
      'ex-hefei-jianghuai-breakfast':('breakfast','08:00','刘鸿盛'),
      'ex-yangzhou-morning-tea':('breakfast','08:00','富春茶社'),
      'ex-macau-macanese':('dinner','18:00','氹仔 葡国餐厅'),
      'ex-leshan-food-crawl':('dinner','18:00','张公桥 钵钵鸡'),
      'ex-guiyang-sour-soup':('dinner','18:00','老凯俚酸汤鱼'),
      'ex-guiyang-market-breakfast':('breakfast','08:00','民生路 菜场 早餐'),
    }
    consultation={
      'ex-huangshan-huizhou-ink':'胡开文墨厂', 'ex-huangshan-maofeng-tea':'屯溪老街 茶庄',
      'ex-hefei-hechai-art':'合柴1972 手作','ex-hefei-sanhe-rice':'三河古镇 米饺',
      'ex-fuzhou-jasmine':'三坊七巷 茉莉花茶 茶馆','ex-fuzhou-lacquer':'福州 漆艺 展示馆','ex-fuzhou-hot-spring':'源脉温泉园',
      'ex-wuyishan-rock-tea':'三姑度假区 岩茶 茶馆','ex-wuyishan-tea-making':'香江茗苑',
      'ex-jingdezhen-wheel':'乐天陶社','ex-jingdezhen-painting':'陶溪川 青花 瓷绘','ex-jingdezhen-tea-landscape':'浮梁 寒溪村 茶庄',
      'ex-yangzhou-paper-cut':'扬州剪纸博物馆','ex-yangzhou-woodblock':'扬州双博馆',
      'ex-shaoxing-huangjiu-tasting':'中国黄酒博物馆','ex-shaoxing-calligraphy':'兰亭 书法 研学',
      'ex-chaozhou-gongfu':'潮州古城 工夫茶 茶馆','ex-chaozhou-woodcarving':'潮州木雕 传习所','ex-chaozhou-phoenix-tea':'凤凰镇 单丛茶 茶庄',
      'ex-macau-portuguese-baking':'安德鲁饼店 路环','ex-leshan-tea-house':'乐山 滨江 茶馆','ex-leshan-paper-making':'夹江 手工造纸 博物馆',
      'ex-guiyang-batik':'贵阳 蜡染 非遗 展示馆',
    }
    city_by_id={c['id']:c for c in CITIES}
    for e in EXPERIENCES:
        if e['kind']!='experience':continue
        if e['id'] in meal_sessions:
            meal,clock,query=meal_sessions[e['id']]
            e.update({'includedMeals':[meal],'preferredStartTime':clock})
            option=e['priceOptions'][0]
            option.update({'includedMeals':[meal],'preferredStartTime':clock,'includes':[{'breakfast':'一顿早餐','lunch':'一顿午餐','dinner':'一顿晚餐'}[meal]+'的规划预算'],'excludes':['交通','额外点单和购物'],'note':'一餐编辑预算，替代当天相应的日常餐饮份额；实际菜单、份量和价格以店家当日信息为准。'})
            consultation[e['id']]=query
        elif e['experienceType']=='food-life':
            e['priceOptions'][0].update({'includes':['说明中的小食、品茶或品鉴预算'],'excludes':['其他正餐','额外购物','交通'],'note':'品鉴或小食的编辑预算，不默认包含一顿正餐。实际份量和收费需向店家确认。'})
        if e['id'] in consultation:
            query=consultation[e['id']]
            e['bookingUrl']='https://www.google.com/maps/search/?api=1&query='+quote(city_by_id[e['cityId']]['name']+' '+query)
            e['provider']=query+'（地点检索入口，非已确认预约）'
            e['availabilityNote']='链接用于查找场馆或商家；请确认营业、菜单或课程后再预约。预算为编辑估算。'
    for c in CITIES:
        c['guide']['neighborhoods']=[{'name':c['name']+'中心与周边','description':c['transportNote']}]
        assert len(c['attractions'])>=20,(c['id'],len(c['attractions']))
        assert len([e for e in EXPERIENCES if e['cityId']==c['id'] and e['kind']=='experience'])>=5,c['id']
        assert len([e for e in EXPERIENCES if e['cityId']==c['id'] and e['kind']=='hotel'])>=5,c['id']
        assert len([f for f in FOODS if c['id'] in f['cityIds']])>=5,c['id']
    for folder,rows in [('expansion',CITIES),('experience-expansion',EXPERIENCES),('food-expansion',FOODS)]:
        path=ROOT/'data'/folder/'china-east-20261007.json'
        path.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'cities':len(CITIES),'attractions':sum(len(c['attractions']) for c in CITIES),'experiences':sum(e['kind']=='experience' for e in EXPERIENCES),'hotels':sum(e['kind']=='hotel' for e in EXPERIENCES),'foods':len(FOODS)}))

if __name__=='__main__':
    write_packs()
