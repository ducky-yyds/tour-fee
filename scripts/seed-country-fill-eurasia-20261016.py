"""Country-coverage editorial pack, researched 2026-10-16.

Rebuilds only this pack. USD figures are planning estimates, never live offers.
Sources are identity/cultural references, not evidence for the estimated prices.
"""
import json
from pathlib import Path
from urllib.parse import quote, urlparse

ROOT = Path(__file__).resolve().parents[1]
DAY = '2026-10-16'
PACK = 'country-fill-eurasia-20261016.json'
CITIES, EXPERIENCES, FOODS = [], [], []

# Only the following pages were actually read (including readable search excerpts).
# Other links remain useful follow-up references, but must not claim verification.
REVIEWED_URLS = {u.rstrip('/') for u in '''https://whc.unesco.org/en/list/545/
https://whc.unesco.org/en/list/540/
https://www.visit-ulaanbaatar.com/EN
https://tourism.ub.gov.mn/wp-content/uploads/Ulaanbaatar-english-2025-hewleh_compressed.pdf
https://kazakhstan.travel/ru/attractions/404
https://alriyadh.gov.sa/en/content/tourism
https://www.visitsaudi.com/en/diriyah
https://www.visitsaudi.com/en/riyadh/attractions/al-masmak-palace-in-riyadh
https://whc.unesco.org/en/list/1422/
https://tdap.gov.pk/lahore-district/
https://visitlahore.com/attractions/
https://lahore.punjab.gov.pk/places_to_visit
https://punjab.gov.pk/historical-landmarks
https://tourism.gov.mm/en/regions/yangon
https://whc.unesco.org/en/tentativelists/5469/
https://guide.kyivcity.gov.ua/en/faq/yaki-osnovni-turystychni-vyznachni-mistsya-varto-vidvidaty-v-kyyevi
https://museum.gov.tm/en
https://uzbekistan.travel/en/i/samarkand/
https://uzbekistan.travel/en/r/samarkand-region/
https://uzbekistan.travel/en/v/food-tourism/
https://whc.unesco.org/fr/list/385
https://whc.unesco.org/fr/soc/4966
https://www.unesco.org/sites/default/files/medias/fichiers/2025/04/Baghdad_Monitoring_Report_2024.pdf
https://experienceoman.om/en/destinations
https://experienceoman.om/destinations/muscat/al-mirani-fort
https://romaniatourism.com/bucharest.html
https://www.visit-belarus.com/en/visit-minsk/
https://www.visitkyrgyzstan.org/bazaars-kyrgyzstan/
https://traveltajikistan.tj/en/historical-and-cultural-tourism/
https://osorkhonaimilliidip.tj/en/home-en/
https://www.beautifulbangladesh.gov.bd/index.php/loc/dhaka
https://www.beautifulbangladesh.gov.bd/frontend/assets/pdf/Dhaka.pdf
https://koryogroup.com/blog/pyongyang-hotels-guide-de02b24b-0bcb-4831-9c33-d38b40b9b81d
https://koryogroup.com/travel-guide/koryo-hotel-north-korea-travel-guide
https://www.visitsofia.bg/en/places-to-see/index.php
https://visitsofia.bg/en/accommodation-en/hotels
https://metropol-moscow.ru/en/
https://lottehotelmoscow.ru/en/
https://angleterrehotel.com/en/
https://corinthia-stpetersburg.com/en/
https://www.corinthia.com/en-gb/st-petersburg/
https://www.bestwestern.com/en-us/book/hotel/ulaanbaatar/best-western-premier-tuushin-hotel/78695
https://www.novotelalmaty.com/
https://www.rixos.com/hotel-resort/rixos-almaty
https://rahatpalace.com/
https://ssa.gov.sa/sdc26/assets/SDC26Guide.pdf
https://www.fourseasons.com/riyadh/
https://www.ritzcarlton.com/en/hotels/ruhrz-the-ritz-carlton-riyadh/overview/
https://www.infobusiness.bcci.bg/content/file/Iran_Reference_Book.pdf
https://pchotels.com/public/hotel-and-resort/pearl-continental-hotel-lahore
https://nishathotels.com/
https://visitlahore.com/hotels-in-lahore/
https://walledcitylahore.gop.pk/hotel2/
https://dts.punjab.gov.pk/system/files/registered-hotels.pdf
https://www.panpacific.com/en/hotels-and-resorts/pp-yangon.html
https://www.parkstarhotel.af/
https://www.daryavillage.af/darya-village-hotel-and-business-park/
https://visit.kyiv.ua/en/where-to-stay
https://visitkyiv.com/accommodations/hotels/
https://sustainabledevelopment.un.org/content/documents/11256Information%20Note_1711.pdf
https://yyldyzhotel.gov.tm/en/services
https://www.hotelbibikhanum.com/
https://malikahotel.com/en-gb/
https://hyperlinkhotels.com/y_pages/Yemen.pdf
https://shahranhotel.com/en
https://www.rotana.com/rotanahotelandresorts/iraq/baghdad/babylonrotana
https://www.ihg.com/intercontinental/hotels/us/en/muscat/mscha/hoteldetail
https://atheneepalace.intercontinental.com/
https://grand-hotel-continental-bucuresti.continentalhotels.ro/en
https://www.belarushotels.by/en/hotels/minsk/renaissance
https://www.serenahotels.com/dushanbe
https://www.advantour.com/tajikistan/hotels/dushanbe.htm
https://beitalwali.com/about-us/
https://www.beit-zaman.com/about.php
https://damarose.sy/
https://www.sarinahotel.com/
https://www.ihg.com/intercontinental/hotels/us/en/dhaka/dachb/hoteldetail
https://hil.gov.bd/pages/static-pages/6922dca9933eb65569e1178b
https://www.grandhotelsofia.bg/
https://www.artotel.bg/
https://sensehotel.com/en/index.html
https://sensehotel.com/en/about-us.html
https://www.sofiabalkan.com/
https://www.tretyakovgallery.ru/en/
https://vision.kreml.ru/en-Us/visit-to-kremlin/
https://www.hermitagemuseum.org/visitus
https://www.spbmuseum.ru/themuseum/visitors/regis.php
https://en.rusmuseum.ru/museums/summer-garden/
https://artmuseum.by/en
https://pushkinmuseum.art/?lang=en
https://www.warmuseum.by/en/
https://www.mos.ru/upload/documents/files/bbbe5cdf989015adf1172b035c8363e6/KartaMoskvinaanglyazike2025.pdf
https://www.iata.org/en/publications/directories/code-search/?airport.search=BSZ
https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.pr260101~c830245e42.en.html
https://whc.unesco.org/en/list/20/
https://en.rusmuseum.ru/museums/mikhailovsky-palace/
https://cathedral.ru/en/visitors/time
https://mdn.gov.mm/en/traditional-myanmar-cuisine-3
https://en.wikipedia.org/wiki/List_of_Burmese_dishes
https://en.wikipedia.org/wiki/Cendol
https://en.wikipedia.org/wiki/Mongolian_cuisine
https://en.wikipedia.org/wiki/Kazakh_cuisine
https://en.wikipedia.org/wiki/Russian_cuisine
https://en.wikipedia.org/wiki/Burmese_cuisine
https://en.wikipedia.org/wiki/Persian_cuisine
https://en.wikipedia.org/wiki/Saudi_Arabian_cuisine
https://en.wikipedia.org/wiki/Afghan_cuisine
https://en.wikipedia.org/wiki/Pakistani_cuisine
https://en.wikipedia.org/wiki/Belarusian_cuisine
https://all.accor.com/hotel/A145/index.en.shtml
https://romaniatourism.com/romanian-food-wine.html
https://www.gov.kz/article/64578?lang=en
https://www.euraxess.gov.ro/romania/information-assistance/daily-life/romanian-cuisine'''.splitlines()}

def wiki(article):
    return 'https://en.wikipedia.org/wiki/' + quote(article.replace(' ', '_'))

def ref(url, scope='地点身份及文化背景；不证明当前开放、可预订或所列估算价格'):
    reviewed = url.rstrip('/') in REVIEWED_URLS
    return {'name': urlparse(url).netloc, 'url': url, 'kind': 'encyclopedia' if 'wikipedia.org' in url else 'reference', 'scope': scope, 'checkedAt': DAY if reviewed else None, 'verificationStatus':'reviewed' if reviewed else 'unverified'}

def image(article):
    return {'url': '', 'sourceUrl': wiki(article)}

def price(low, high, url, unit='person'):
    return {'low': low, 'high': high, 'currency': 'USD', 'type': 'estimate', 'unit': unit, 'sourceUrl': url, 'checkedAt': None,
            'note': '美元规划预留，非当地货币金额、实时报价或市场最低最高价；以日期、票种、税费及服务范围核价。'}

ADVISORIES = {
    'RU': ('russia', 'avoid-all-travel', '英国 FCDO 当前建议避免前往俄罗斯；存在无人机、航空中断及拘留等风险。本页收录文化资料，暂不自动安排活动。', 'The UK FCDO advises against all travel to Russia. Cultural reference only; activities are excluded from automatic planning.'),
    'IR': ('iran', 'avoid-all-travel', '英国 FCDO 当前建议避免前往伊朗；局势、交通与遗产开放情况可能突然变化。本页为文化资料，暂不自动安排活动。', 'The UK FCDO advises against all travel to Iran. Access and transport may change; automatic activities are disabled.'),
    'AF': ('afghanistan', 'avoid-all-travel', '英国 FCDO 当前建议避免前往阿富汗；女性活动、场馆准入及出行受严格限制。本页为文化资料，不确认场所当前开放。', 'The UK FCDO advises against all travel to Afghanistan. Access, especially for women, is restricted; listings do not confirm current opening.'),
    'UA': ('ukraine', 'avoid-all-travel', '英国 FCDO 对基辅建议避免一切旅行；战争、空袭及宵禁影响交通和参观。不能按日常旅游行程直接执行。', 'The UK FCDO advises against all travel to Kyiv. War, air raids and curfews affect access; this is not an executable leisure itinerary.'),
    'YE': ('yemen', 'avoid-all-travel', '英国 FCDO 当前建议避免前往也门。萨那旧城与住宿信息作为文化资料保留，不确认当前可抵达、开放或营业。', 'The UK FCDO advises against all travel to Yemen. Sanaa listings are cultural references, with access and operation unconfirmed.'),
    'SY': ('syria', 'avoid-all-travel', '英国 FCDO 当前建议避免前往叙利亚；安全与开放情况难以预测。本页为文化资料，暂不自动安排活动。', 'The UK FCDO advises against all travel to Syria. Security and opening are unpredictable; automatic planning is disabled.'),
    'BY': ('belarus', 'avoid-all-travel', '英国 FCDO 当前建议避免前往白俄罗斯，提示拘留及地区冲突风险。本页保留城市资料，暂不自动安排活动。', 'The UK FCDO advises against all travel to Belarus, citing detention and regional conflict risks. Automatic activities are disabled.'),
    'IQ': ('iraq', 'restricted', '英国 FCDO 对巴格达大部分地区建议仅限必要旅行，对萨德尔城建议避免一切旅行。此处不提供自动观光路线，场馆和交通另行确认。', 'The UK FCDO advises against all but essential travel to most of Baghdad and all travel to Sadr City. Automatic sightseeing is disabled.'),
    'KP': ('north-korea', 'restricted', '朝鲜入境、国籍资格、住宿和游览均须经授权安排，不能自由行；有限旅游恢复不等于平壤普遍开放。英国 FCDO 建议仅限必要旅行。', 'Entry, nationality eligibility, hotels and visits require authorised arrangements; independent travel is not available. Limited tourism does not establish general access to Pyongyang. FCDO advises essential travel only.'),
    'TM': ('turkmenistan/entry-requirements', 'restricted', '土库曼斯坦旅游通常须提前办理签证和授权旅行社邀请；路线、接待和拍摄限制需逐项确认，未核实前不自动排程。', 'Tourist entry usually requires an advance visa and invitation through an authorised agency; route and access restrictions must be confirmed before planning.'),
    'MM': ('myanmar', 'restricted', '缅甸多地存在避免旅行建议，局势、交通及营业情况不稳定；仰光资料不代表全国可通行，暂不自动安排活动。', 'Myanmar has extensive regional travel warnings and unstable access. Yangon listings do not imply unrestricted travel across the country; automatic planning is disabled.'),
}

def add(meta, intro, transport, source, sights, experiences, foods, hotels, daily=None, days=3):
    cid, zh, en, cc, country, region, local_currency, lat, lng, iata, article = meta
    restricted = cc in ADVISORIES
    daily = daily or [[25,65,150],[10,22,55],[5,15,40],[5,10,25]]
    c = {'id':cid, 'name':zh, 'nameEn':en, 'countryCode':cc, 'country':country, 'region':region, 'currency':'USD', 'localCurrency':local_currency,
         'lat':lat, 'lng':lng, 'iata':iata, 'article':article, 'aliases':[zh,en], 'contentTier':'standard',
         'image':image(article), 'tagline':intro, 'description':intro, 'tags':['城市文化','特色饮食','地方体验'],
         'daily':dict(zip(['lodging','food','transport','misc'],daily)), 'monthly':{'rent':[350,850,1800], 'utilities':[50,110,220]},
         'budgetBasis':{'type':'editorial-estimate','updatedAt':DAY,'note':'所有金额以美元 USD 表示，仅为经济、舒适、高端三档编辑预算，并非当地货币或实时报价。住宿按每间每晚，饮食交通杂项按每成人每天；月租水电按每间每月。机票、签证、向导、许可及专门接送另计。'},
         'planningProfile':'balanced', 'tripDuration':{'min':max(2,days-1),'days':days,'max':days+2,'reason':transport}, 'transportNote':transport,
         'officialTourismUrl':source, 'sourceReferences':[ref(source)], 'attractions':[],
         'guide':{'cityId':cid,'intro':intro,'foodHighlights':[],'neighborhoods':[],'experienceIntro':'按兴趣选择文化、市场或自然体验；活动场次与接待条件须另行确认。'}}
    if restricted:
        slug,level,note,note_en=ADVISORIES[cc]
        c['travelAdvisory']={'url':'https://www.gov.uk/foreign-travel-advice/'+slug,'level':level,'note':note,'noteEn':note_en,'checkedAt':DAY,'authority':'UK FCDO','scope':'city-access-context'}
        c['automaticPlanning']=False
    for line in sights.strip().splitlines():
        slug,name,english,slat,slng,minutes,low,high,desc,art = line.split('|')
        minutes=int(minutes); slat=float(slat); slng=float(slng)
        distant = abs(slat-lat)+abs(slng-lng)>.25
        p={'id':cid+'-'+slug,'name':name,'nameEn':english,'lat':slat,'lng':slng,'coordinateAccuracy':'approximate','coordinateNote':'地点近似坐标，入口以现场及预约指引为准。',
           'durationHours':minutes/60,'durationRange':{'min':max(20,minutes//2),'recommended':minutes,'max':int(minutes*1.5)},'durationBasis':'editorial-estimate',
           'category':'文化与自然','activityType':'culture','description':desc,'article':art,'image':image(art),'priority':85 if not distant else 65,
           'visitRole':'optional' if distant or restricted else 'essential','automaticPlanning':not (restricted or distant),'features':['自行选择停留时间'],
           'bestTime':'推荐用时不含往返交通；预约、宗教活动和临时关闭以场馆公告为准。',
           'sourceUrl':wiki(art),'sourceCheckedAt':DAY,'sourceReferences':[ref(wiki(art)),ref(source)],'price':price(float(low),float(high),wiki(art))}
        if distant: p['accessNote']='位于较远片区，须额外预留往返交通，默认不自动安排。'
        if restricted: p['accessNote']=c['travelAdvisory']['note']
        c['attractions'].append(p)
    for line in experiences.strip().splitlines():
        slug,name,en_name,slat,slng,minutes,low,high,kind,desc,art,url,mode=line.split('|')
        url=url or wiki(art)
        e={'id':'ex-'+cid+'-'+slug,'cityId':cid,'kind':'experience','name':name,'nameEn':en_name,'lat':float(slat),'lng':float(slng),
           'coordinateAccuracy':'approximate','coordinateNote':'活动片区参考点，非保证的集合地点。','durationMinutes':int(minutes),'description':desc,'tagline':desc,
           'experienceType':{'culture':'local-life','food':'food-life','wellness':'local-life','water':'local-life'}.get(kind,kind),'localContext':desc,'features':['地方文化体验'],'requirements':['参加前确认开放、预约、场次与包含服务。'],'automaticPlanning':not restricted and mode=='auto',
           'sourceUrl':url,'bookingUrl':url,'checkedAt':DAY,'sourceReferences':[ref(url)],'article':art,'image':image(art),
           'availabilityNote':'选择条目不代表预订成功；接送、额外餐饮和购物另计。',
           'seasonality':{'months':list(range(1,13)),'dateSpecific':mode=='event','note':'节庆与演出须核对当年确切日期。' if mode=='event' else '开放与天气另行确认。'},
           'priceOptions':[{'id':'planning','name':'每人活动预算',**price(float(low),float(high),url),'includes':['说明所列活动范围'],'excludes':['往返交通','额外餐饮','购物']}]}
        if restricted: e['availabilityNote']=c['travelAdvisory']['note']
        EXPERIENCES.append(e)
    for line in foods.strip().splitlines():
        slug,name,local,desc,art,area,low,high=line.split('|')
        url=wiki(art)
        f={'id':'food-'+cid+'-'+slug,'cityIds':[cid],'name':name,'nameEn':local,'localName':local,'description':desc,'article':art,'articleScope':'dish',
           'image':image(art),'sourceUrl':url,'sourceReferences':[ref(url,'菜品身份与制作方式；用餐区域为检索起点，不承诺店铺菜单')],'sourceCheckedAt':DAY,
           'sourceScope':'regional-food-context','sourceStatus':'reference','catalogOrigin':'maintained-definition','price':price(float(low),float(high),url,'serving'),
           'servingNote':'按一份或注明份量预留，计入日常餐饮预算，不重复叠加固定成本。',
           'whereByCity':{cid:[{'name':area,'kind':'area','sourceUrl':'https://www.google.com/maps/search/?api=1&query='+quote(en+' '+area+' '+local),'note':'区域检索入口，具体供应、份量和价格向商家确认。'}]}}
        FOODS.append(f); c['guide']['foodHighlights'].append({'name':name,'description':desc})
    for line in hotels.strip().splitlines():
        slug,name,url,low,high,desc,art=line.split('|')
        url=url or wiki(art)
        exact=art!=article
        h={'id':'hotel-'+cid+'-'+slug,'cityId':cid,'kind':'hotel','name':name,'nameEn':name,'durationMinutes':0,
           'description':desc+(' 当前营业、准入及接待条件未逐项确认，不能据此直接预订。' if restricted else ' 依所选日期核对房型、税费和早餐。'),
           'tagline':desc,'features':['独立房预算','按日期核价'],'sourceUrl':url,'bookingUrl':url,'sourceReferences':[ref(url,'酒店身份与所在城市；非实时房价或空房确认')],
           'checkedAt':DAY,'article':art,'image':image(art),'imageScope':'property' if exact else 'nearby',
           'imageContextNote':'酒店建筑资料图，非所订房型。' if exact else '所在城市环境示意，非酒店客房或设施照片。',
           'automaticPlanning':False,'priceOptions':[{'id':'room','name':'每间每晚美元预算',**price(float(low),float(high),url,'room-night'),'includes':['房间预算预留'],'excludes':['未明确包含的早餐','接送','税费','附加服务']}]}
        if restricted: h['availabilityNote']=c['travelAdvisory']['note']
        EXPERIENCES.append(h)
    assert len(c['attractions'])>=5
    CITIES.append(c)

add(('moscow','莫斯科','Moscow','RU','俄罗斯','欧洲','RUB',55.7558,37.6173,'SVO','Moscow'),
'红砖城墙、画廊与地铁站建筑串起俄罗斯首都的历史；冬季与夏季的城市节奏迥异。',
'市区分片结合地铁与步行；机场和跨城列车另留接驳。当前旅行建议与航空安排须先核实。','https://whc.unesco.org/en/list/545/',
'''red-square|红场|Red Square|55.7539|37.6208|60|0|0|从广场外部观察克里姆林宫城墙、国家历史博物馆与圣瓦西里教堂的不同年代。|Red Square
kremlin|克里姆林宫博物馆|Moscow Kremlin museums|55.7517|37.6178|150|12|35|教堂广场与军械库分区售票，不能把政府办公区域视为可自由进入的景点。|Moscow Kremlin
basil|圣瓦西里主教座堂|Saint Basil's Cathedral|55.7525|37.6231|75|10|25|彩色穹顶之下由多个小礼拜堂相连，内部参观与红场外观应分开计时。|Saint Basil's Cathedral
tretyakov|特列季亚科夫画廊|Tretyakov Gallery|55.7414|37.6208|150|8|22|从圣像到俄罗斯绘画理解当地艺术；旧馆与新馆不在同一地点。|Tretyakov Gallery
gorky|高尔基公园|Gorky Park|55.7299|37.6016|90|0|0|莫斯科河旁的公共公园，适合在博物馆之间留一段户外休息时间。|Gorky Park (Moscow)''',
'''metro|地铁车站建筑观察|Moscow Metro architecture|55.7768|37.6559|90|1|5|culture|以共青团站等站厅观察马赛克、灯饰与大理石，遵守现场拍摄规则并避开通勤高峰。|Komsomolskaya (Koltsevaya line)||auto
banya|桑杜内俄式浴场|Sanduny banya|55.7655|37.6218|150|35|100|wellness|了解俄式蒸汽浴的冷热交替与桦枝传统；按分区、时段和服务收费，先确认身体适应情况。|Sanduny|https://sanduny.ru/|manual
bolshoi|莫斯科大剧院芭蕾或歌剧|Bolshoi performance|55.7602|37.6186|180|30|180|performance|选择真实演出场次体验舞台艺术；历史剧场与新舞台须核对，未含门票前不自动安排。|Bolshoi Theatre|https://bolshoi.ru/en|event''',
'''pelmeni|俄式饺子|Pelmeni|肉馅小饺子常配酸奶油或黄油，适合一份主餐。|Pelmeni|Arbat / Tverskaya 俄式餐馆|6|18
blini|俄式薄饼|Blini|可选酸奶油、果酱或咸馅；鱼子酱版本单独核价。|Blini|市中心薄饼店|3|12
stroganoff|斯特罗加诺夫牛肉|Beef Stroganoff|牛肉条与酸奶油酱搭配米饭或土豆，是常见餐厅主菜。|Beef Stroganoff|市中心俄式餐馆|12|30
syrniki|凝乳奶酪煎饼|Syrniki|凝乳做的小煎饼常在早餐供应，搭配浆果或酸奶油。|Syrniki|Patriarshiye Prudy 咖啡馆|5|13
borscht|甜菜汤|Borscht|东欧广泛流行的甜菜汤，各家肉汤与蔬菜配方不同，不将其标为单一国家独有。|Borscht|传统餐馆|5|13''',
'''metropol|Hotel Metropol Moscow|https://metropol-moscow.ru/en/|180|500|剧院广场附近的历史酒店，外墙艺术与公共空间有鲜明年代特色。|Hotel Metropol Moscow
national|Hotel National Moscow|https://national.ru/en/|150|400|位于马涅日广场一侧的历史酒店，便于分片认识中心城区。|Hotel National, Moscow
baltschug|Hotel Baltschug Kempinski Moscow|https://www.kempinski.com/en/baltschug|180|450|莫斯科河南岸的酒店选择，河景房型与普通房价分开核对。|Hotel Baltschug Kempinski Moscow
savoy|Savoy Hotel Moscow|https://savoy.ru/en/|130|350|靠近库兹涅茨克桥街区的历史风格酒店。|Savoy Hotel (Moscow)
lotte|Lotte Hotel Moscow|https://lottehotelmoscow.ru/en/|250|650|新阿尔巴特一带的现代高端酒店。|Lotte Hotel Moscow''',daily=[[40,110,270],[18,40,100],[5,15,45],[6,15,35]],days=4)

add(('saint-petersburg','圣彼得堡','Saint Petersburg','RU','俄罗斯','欧洲','RUB',59.9343,30.3351,'LED','Saint Petersburg'),
'涅瓦河、运河桥梁和宫殿构成开阔的城市景观，冬宫艺术与剧院传统值得分日慢看。',
'涅瓦大街与历史核心区步行结合地铁；彼得宫等城外地点另设整段交通时间，夜间开桥会影响过河。','https://whc.unesco.org/en/list/540/',
'''hermitage|冬宫与艾尔米塔什博物馆|Hermitage Museum|59.9398|30.3146|240|12|35|馆藏体量很大，选择少量主题展厅；不要在同一天强塞完整冬宫与多座大型博物馆。|Hermitage Museum
isaac|圣以撒主教座堂|Saint Isaac's Cathedral|59.9342|30.3061|90|6|20|内部装饰与柱廊登高通常分票，台阶较多，外观可单独短停。|Saint Isaac's Cathedral
saviour|滴血救世主教堂|Church of the Savior on Spilled Blood|59.9401|30.3289|75|6|18|沿运河看彩色穹顶，内部以马赛克装饰见长。|Church of the Savior on Spilled Blood
fortress|彼得保罗要塞|Peter and Paul Fortress|59.9500|30.3165|150|0|25|岛上的城防空间、教堂与展馆分别计时计费。|Peter and Paul Fortress
russian-museum|俄罗斯博物馆|Russian Museum|59.9386|30.3324|150|8|25|以俄罗斯艺术为主，可与冬宫的国际馆藏形成不同主题。|Russian Museum''',
'''canal|运河与涅瓦河游船|Canal and Neva cruise|59.9345|30.3276|90|15|45|water|从低矮桥梁和河岸立面理解城市格局；季节、天气、开航码头与桥高决定线路。|Rivers and canals in Saint Petersburg||manual
mariinsky|马林斯基剧院演出|Mariinsky performance|59.9256|30.2960|180|25|160|performance|按当日舞台和节目体验歌剧或芭蕾，剧院不同场地间不能按同一地址处理。|Mariinsky Theatre|https://www.mariinsky.ru/en/|event
new-holland|新荷兰岛创意公共空间|New Holland Island|59.9294|30.2886|90|0|0|culture|在修复的历史工业建筑间看公共艺术和水岸空间；展演、餐饮与季节项目另计。|New Holland Island|https://www.newhollandsp.ru/en/|auto''',
'''pyshki|彼得堡糖粉炸圈|Pyshki|小巧的酵母炸圈撒糖粉，常搭配热饮，按几只小食预留。|Doughnut|Bolshaya Konyushennaya 传统炸圈店|2|6
smelt|香煎胡瓜鱼|Koryushka|涅瓦河流域的春季时令小鱼，常整条煎制；供应随季节变化。|European smelt|市中心俄式海鲜餐馆|10|25
pelmeni|俄式饺子|Pelmeni|肉馅饺子配酸奶油，份量适合午间主餐。|Pelmeni|Nevsky Prospekt 餐馆|6|16
blini|俄式薄饼|Blini|甜咸馅均常见，搭配一杯热茶作为简餐。|Blini|市中心薄饼店|3|12
ukha|俄式鱼汤|Ukha|以鱼和蔬菜熬成清汤，各家鱼种与配菜不同。|Ukha|河岸俄式餐馆|6|16''',
'''astoria|Hotel Astoria|https://www.roccofortehotels.com/hotels-and-resorts/hotel-astoria/|180|500|圣以撒广场附近的历史酒店。|Hotel Astoria (Saint Petersburg)
angleterre|Angleterre Hotel|https://angleterrehotel.com/en/|110|280|邻近圣以撒教堂，传统城市酒店格局。|Angleterre Hotel
europe|Grand Hotel Europe|https://grandhoteleurope.com/|170|450|涅瓦大街旁的历史酒店，公共空间有新艺术风格装饰。|Grand Hotel Europe
corinthia|Corinthia St Petersburg|https://corinthia-stpetersburg.com/en/|130|330|涅瓦大街修复建筑群内的酒店。|Corinthia Hotel St. Petersburg
helvetia|Helvetia Hotel|https://helvetiahotel.ru/en/|110|280|马拉塔街院落式精品酒店，适合以中心街区为活动基地。|Saint Petersburg''',days=4)

add(('ulaanbaatar','乌兰巴托','Ulaanbaatar','MN','蒙古','亚洲','MNT',47.9185,106.9170,'UBN','Ulaanbaatar'),
'寺院、现代博物馆与奶茶馆让人认识草原文化进入城市后的样貌；民间音乐和那达慕为行程增加不同节奏。',
'市中心分片步行，跨区乘车并预留拥堵；新机场距离市区较远。特勒吉与草原营地另留全天往返，冬季关注严寒与空气质量。','https://www.visit-ulaanbaatar.com/EN',
'''gandan|甘丹寺|Gandantegchinlen Monastery|47.9225|106.8944|90|3|12|城市里的藏传佛教寺院，尊重诵经、衣着与室内拍照规定。|Gandantegchinlen Monastery
chinggis-museum|成吉思汗国家博物馆|Chinggis Khaan National Museum|47.9232|106.9153|150|10|25|通过游牧帝国与蒙古历史展览理解草原国家的发展，展厅内容较多。|Chinggis Khaan National Museum
square|苏赫巴托广场|Sükhbaatar Square|47.9189|106.9176|45|0|0|从纪念雕像和政府宫外部认识首都中心的公共空间。|Sükhbaatar Square
bogd|博格多汗冬宫博物馆|Winter Palace of the Bogd Khan|47.8970|106.9060|90|5|15|宫殿、寺庙和藏品展示近代蒙古宗教与宫廷生活。|Winter Palace of the Bogd Khan
choijin|乔金喇嘛庙博物馆|Choijin Lama Temple|47.9131|106.9186|75|5|15|高楼之间保留的寺院建筑群，可关注面具、雕塑和木构装饰。|Choijin Lama Temple''',
'''naadam|那达慕传统体育节|Naadam festival|47.9020|106.9158|240|20|100|festival|摔跤、射箭与赛马是不同项目，开幕式和远郊赛马不在同一地点；须核对当年日期及票务。|Naadam|https://www.visit-ulaanbaatar.com/EN|event
tumen|马头琴与呼麦演出|Morin khuur and throat singing|47.9110|106.9180|75|12|35|performance|寻找正式公布的民间歌舞演出，先确认演出团、场馆和场次，了解马头琴与呼麦的声响特点。|Morin khuur|https://www.visit-ulaanbaatar.com/EN|event
narantuul|纳兰图勒市场手工艺观察|Narantuul market crafts|47.9060|106.9440|120|0|0|culture|辨认蒙古袍、毡制品与日常生活用品；购物自选，照片先征得摊主同意。|Narantuul||auto''',
'''buuz|蒙古包子|Buuz|肉馅蒸包以羊肉或牛肉为主，按一份简餐估算。|Buuz|Peace Avenue 蒙古餐馆|4|10
khuushuur|蒙古炸肉饼|Khuushuur|薄面皮包肉后油炸，那达慕期间也常见；注意现炸烫口。|Khuushuur|市中心餐馆与节庆摊位|3|9
tsuivan|蒙古焖炒面|Tsuivan|面条与肉、蔬菜同焖，份量较足。|Tsuivan|Sukhbaatar 区蒙古餐馆|5|12
suutei|咸奶茶|Suutei tsai|加盐的奶茶常配早餐或主食，不同店铺浓淡有别。|Suutei tsai|传统茶馆|1|4
aaruul|蒙古干奶酪|Aaruul|风干乳制品口感较硬、酸甜程度不同，适合少量尝试。|Aaruul|Narantuul 食品摊与超市|2|6''',
'''shangrila|Shangri-La Ulaanbaatar|https://www.shangri-la.com/ulaanbaatar/shangrila/|220|450|市中心商业综合体内的高端酒店。|Shangri-La Ulaanbaatar Complex
kempinski|Kempinski Hotel Khan Palace|https://www.kempinski.com/en/ulaanbaatar/hotel-khan-palace|100|240|和平大道东段的国际酒店，前往广场需留接驳。|Ulaanbaatar
tuushin|Best Western Premier Tuushin Hotel|https://www.bestwestern.com/en-us/book/hotel/ulaanbaatar/best-western-premier-tuushin-hotel/78695|120|260|苏赫巴托广场附近的高层酒店。|Ulaanbaatar
bluesky|The Blue Sky Hotel and Tower|https://hotelbluesky.mn/|100|240|广场南侧标志性的弧形高层酒店。|Blue Sky Tower
bayangol|Bayangol Hotel|https://bayangolhotel.mn/|65|170|成吉思汗大道上的城市酒店，可比较独立房和早餐方案。|Bayangol Hotel''',days=3)

add(('almaty','阿拉木图','Almaty','KZ','哈萨克斯坦','亚洲','KZT',43.2389,76.8897,'ALA','Almaty'),
'天山山麓的林荫街道连接木教堂、集市和咖啡馆，城市生活与山地景色可以分开安排。',
'老城步行结合地铁与出租车；科克托别缆车看天气，麦迪奥和奇姆布拉克属山地半日至全天路线。','https://kazakhstan.travel/ru/attractions/404',
'''ascension|升天大教堂|Ascension Cathedral|43.2587|76.9532|60|0|0|潘菲洛夫公园中的彩色木构教堂，礼拜期间保持安静。|Ascension Cathedral, Almaty
museum|哈萨克斯坦中央国家博物馆|Central State Museum|43.2350|76.9506|120|3|12|以历史、考古和民族文化展品认识哈萨克斯坦。|Central State Museum of Kazakhstan
koktobe|科克托别山|Kok Tobe|43.2220|76.9750|120|10|25|从城市东南侧山丘眺望群山和街区，缆车运营受天气影响。|Kok Tobe
panfilov|潘菲洛夫公园|Park of 28 Panfilov Guardsmen|43.2583|76.9550|60|0|0|树荫步道、纪念空间与周边博物馆可组成轻松一段。|Park of 28 Panfilov Guardsmen
kasteyev|卡斯捷耶夫美术馆|Kasteev State Museum of Arts|43.2352|76.9212|120|3|12|比较哈萨克斯坦绘画、雕塑与装饰艺术，适合不赶时间的下午。|Kasteev State Museum of Arts''',
'''greenbazaar|绿色巴扎食材巡游|Green Bazaar tasting walk|43.2632|76.9552|90|0|0|food|观察干果、乳制品、香料和当地食品，先询问价格再试吃；购买食物计入餐饮预算。|Green Bazar|https://kazakhstan.travel/ru/attractions/404|auto
arasan|阿拉桑传统浴场|Arasan bathhouse|43.2583|76.9497|150|15|45|wellness|体验城市公共浴场文化，按浴区与时段核价，按摩等服务通常另收。|Arasan Baths||manual
medeu|麦迪奥山谷与高山冰场|Medeu valley and rink|43.1577|77.0592|180|10|35|nature|高海拔山谷适合眺望山景；滑冰依季节和开放场次，必须另预留城市往返。|Medeu||manual''',
'''beshbarmak|手抓肉宽面|Beshbarmak|煮肉、宽面和洋葱汤组合，传统共享菜可询问小份。|Beshbarmak|市中心哈萨克餐馆|8|22
baursak|包尔萨克炸面团|Baursak|松软炸面块可配茶或主餐，按一小份预留。|Boortsog|Green Bazaar 周边|2|6
kazy|马肉肠|Qazy|常切片冷食或与主餐搭配，点餐时确认肉类与份量。|Qazy|传统哈萨克餐馆|6|16
lagman|拉条子|Lagman|手拉面配肉和蔬菜，有汤面与炒面版本。|Lagman (food)|市中心维吾尔及中亚餐馆|5|12
kumis|马奶酒|Kumis|发酵马奶带酸味并含酒精，供应与口味随季节变化。|Kumis|Green Bazaar 奶制品区|2|6''',
'''kazakhstan|Hotel Kazakhstan|https://kazakhstanhotel.kz/|70|170|城市经典高层酒店，靠近共和国宫一带。|Kazakhstan Hotel
rixos|Rixos Almaty|https://www.rixos.com/hotel-resort/rixos-almaty|180|400|市中心林荫街区的高端酒店。|Almaty
rahat|Rahat Palace Hotel|https://rahatpalace.com/|100|240|萨特帕耶夫街一带，适合以出租车衔接各区。|Almaty
kazzhol|Kazzhol Hotel Almaty|https://kazzhol.com/|70|170|中心城区的商务酒店选择。|Almaty
novotel|Novotel Almaty City Center|https://www.novotelalmaty.com/|100|230|靠近科克托别缆车下站和共和国宫。|Almaty''')

add(('riyadh','利雅得','Riyadh','SA','沙特阿拉伯','亚洲','SAR',24.7136,46.6753,'RUH','Riyadh'),
'土坯城堡、纳季德饮食与现代天际线构成鲜明对照；把古城片区和北部商业区分开安排。',
'城市跨度大，地铁结合出租车；正午炎热时安排室内活动。德拉伊耶需单独核算车程和预约。','https://alriyadh.gov.sa/en/content/tourism',
'''masmak|马斯马克堡|Masmak Fort|24.6310|46.7134|90|0|8|厚实土墙与院落介绍沙特近代历史，开放以博物馆公告为准。|Masmak Fort
national|沙特国家博物馆|National Museum of Saudi Arabia|24.6470|46.7108|150|0|15|从半岛自然、人类历史到国家形成，适合分主题观看。|National Museum of Saudi Arabia
kingdom|王国中心空中桥|Kingdom Centre Sky Bridge|24.7113|46.6744|75|15|30|高空连桥眺望城市路网，需单独购票并确认电梯安排。|Kingdom Centre
diriyah|德拉伊耶图赖夫街区|At-Turaif District|24.7335|46.5727|150|0|35|纳季德土坯建筑集中保存的遗产区，票务与餐饮抵扣方案需核对。|At-Turaif District
murabba|穆拉巴宫|Murabba Palace|24.6472|46.7093|75|0|10|国家历史中心内的宫殿建筑，与国家博物馆可分段衔接。|Murabba Palace''',
'''coffee|沙特咖啡与椰枣待客文化|Saudi coffee and dates|24.6317|46.7125|60|5|20|food|在传统咖啡馆认识小杯咖啡、香料与椰枣搭配，点单说明按杯还是按壶收费。|Arabic coffee|https://www.visitsaudi.com/en/riyadh|auto
souq|宰勒集市香氛与织物|Souq Al Zal crafts|24.6294|46.7121|90|0|0|culture|观察香料、香氛、地毯与传统服饰，购物自选且不计入门票。|Riyadh|https://www.visitsaudi.com/en/riyadh|auto
season|利雅得季文化演出|Riyadh Season events|24.7667|46.6045|180|20|100|festival|只在当年公布的活动日期选择演出或体验，多个会场相距较远，不把整个节庆当作每日开放景点。|Riyadh Season|https://riyadhseason.com/|event''',
'''kabsa|卡布萨香料饭|Kabsa|长粒米与鸡肉或羊肉同烹，适合多人分享。|Kabsa|Najd Village 等纳季德餐馆|8|25
jareesh|贾里什碎麦粥|Jareesh|碎麦与乳制品慢炖成绵稠主食，常配洋葱。|Jareesh|传统沙特餐馆|5|15
mutabbaq|穆塔巴克馅饼|Mutabbaq|薄饼包肉蛋或其他馅料煎制，按一份小食。|Murtabak|市区小食店|3|9
saleeg|萨利格奶香米饭|Saleeg|奶香米饭常搭配烤鸡，源于汉志地区且在首都可找到。|Saleeg|沙特地方菜餐馆|8|22
qahwa|阿拉伯咖啡|Qahwa|浅焙咖啡加入豆蔻等香料，常与椰枣同上。|Arabic coffee|传统咖啡馆|3|10''',
'''four-seasons|Four Seasons Hotel Riyadh at Kingdom Centre|https://www.fourseasons.com/riyadh/|300|750|王国中心内的高层酒店。|Kingdom Centre
ritz|The Ritz-Carlton Riyadh|https://www.ritzcarlton.com/en/hotels/ruhrz-the-ritz-carlton-riyadh/overview/|250|650|宫殿式建筑与园林空间，离老城需乘车。|Ritz-Carlton, Riyadh
mandarin|Mandarin Oriental Al Faisaliah Riyadh|https://www.mandarinoriental.com/en/riyadh/olaya|250|650|费萨利亚片区的城市高端酒店。|Mandarin Oriental Al Faisaliah, Riyadh
narcissus|Narcissus Riyadh Hotel and Spa|https://www.narcissushotels.com/|180|450|奥拉亚片区的酒店与水疗选择。|Riyadh
hyatt|Hyatt Regency Riyadh Olaya|https://www.hyatt.com/hyatt-regency/en-US/ruhro-hyatt-regency-riyadh-olaya|180|450|奥拉亚商务区的酒店，适合市区多片区接驳。|Riyadh''',daily=[[65,150,350],[20,45,110],[10,30,75],[8,20,45]])

add(('tehran','德黑兰','Tehran','IR','伊朗','亚洲','IRR',35.6892,51.3890,'IKA','Tehran'),
'卡扎尔宫殿、现代公共桥梁和大巴扎体现波斯文化的不同层次；此处保留文化资料，参观须以局势与开放公告为前提。',
'城市南北距离较大，地铁与可靠接驳结合；机场远离中心。受当前旅行建议影响，不自动生成可执行观光安排。','https://whc.unesco.org/en/list/1422/',
'''golestan|古列斯坦宫|Golestan Palace|35.6804|51.4205|150|8|30|花园、镜厅与瓷砖体现卡扎尔艺术；损害修复与开放范围需查官方公告。|Golestan Palace
national|伊朗国家博物馆|National Museum of Iran|35.6863|51.4147|120|5|20|古代伊朗与伊斯兰时期馆区可按兴趣分别参观。|National Museum of Iran
azadi|自由纪念塔|Azadi Tower|35.6997|51.3381|60|0|10|现代纪念建筑融合传统元素，外部广场和内部展馆应分开确认。|Azadi Tower
tabiat|塔比阿特桥|Tabiat Bridge|35.7549|51.4205|75|0|0|步行桥连接两侧公园，以多层公共空间观察城市生活。|Tabiat Bridge
carpet|伊朗地毯博物馆|Carpet Museum of Iran|35.7187|51.3908|90|5|15|看地域纹样、织法与色彩，展品与开放时间可能调整。|Carpet Museum of Iran''',
'''bazaar|大巴扎织物与商队院落|Grand Bazaar crafts|35.6755|51.4234|120|0|0|culture|了解旧城商业布局和传统织物，宗教日与休市日会影响街巷可达性。|Grand Bazaar, Tehran||auto
tea|波斯茶与藏红花点心|Persian tea and sweets|35.7060|51.4250|60|3|10|food|认识茶杯、糖块和藏红花甜点搭配，消费计入餐饮预算。|Iranian cuisine||auto
nowruz|诺鲁孜节文化观察|Nowruz traditions|35.6804|51.4205|120|0|20|festival|以当年公开活动认识新年七鲜桌与春日风俗，不承诺每个场馆举办节庆。|Nowruz|https://ich.unesco.org/en/RL/nowruz-01161|event''',
'''kebab|波斯烤肉饭|Chelow kebab|烤肉与米饭、黄油、烤番茄搭配，点餐确认肉类。|Chelow kebab|Grand Bazaar 周边传统餐馆|5|15
dizi|迪兹炖肉|Abgoosht|羊肉、豆类和土豆慢炖，汤汁与捣碎食材分阶段食用。|Abgoosht|传统 dizi 餐馆|4|12
ash|香草豆面汤|Ash reshteh|豆类、面条和香草形成浓汤，常加乳清酱。|Ash reshteh|市中心汤铺|2|6
tahchin|藏红花锅巴饭|Tahchin|酸奶、鸡肉与米饭形成金黄锅巴，常切块上桌。|Tahchin|波斯家常菜餐馆|4|12
faloodeh|玫瑰水冰粉|Faloodeh|细淀粉丝与玫瑰水冰糖浆搭配，常加青柠汁。|Faloodeh|甜品和冰淇淋店|1|5''',
'''espinas|Espinas Palace Hotel|https://espinashotels.com/|100|280|北部山麓区域的高层酒店。|Espinas Palace Hotel
azadi|Parsian Azadi Hotel|https://azadihotel.com/|70|180|埃文片区的高层酒店，距南部历史核心较远。|Parsian Azadi Hotel
esteghlal|Parsian Esteghlal International Hotel|https://esteghlalhotel.com/|70|180|北部瓦利阿斯尔街一带的大型酒店。|Parsian Esteghlal International Hotel
laleh|Laleh International Hotel Tehran|https://lalehhotels.com/|45|130|拉勒公园附近的城市酒店。|Laleh International Hotel
ferdowsi|Ferdowsi International Grand Hotel|https://www.ferdowsihotel.com/|45|130|靠近国家博物馆与旧城核心的酒店。|Tehran''')

add(('lahore','拉合尔','Lahore','PK','巴基斯坦','亚洲','PKR',31.5204,74.3587,'LHE','Lahore'),
'莫卧儿城堡与清真寺之外，老城门、旁遮普饮食和手工艺让拉合尔适合放慢脚步。',
'老城适合步行结合正规接驳，外围陵墓和花园分别计车程；炎热时段减少户外连排。边境仪式须先核对限制。','https://tdap.gov.pk/lahore-district/',
'''fort|拉合尔堡|Lahore Fort|31.5880|74.3152|150|5|18|宫殿、镜宫与庭院叠加多个历史时期，可选择专题导览。|Lahore Fort
badshahi|巴德夏希清真寺|Badshahi Mosque|31.5883|74.3107|75|0|3|红砂岩与白色大理石构成宏大庭院，礼拜时段及衣着遵守现场要求。|Badshahi Mosque
wazir|瓦齐尔汗清真寺|Wazir Khan Mosque|31.5833|74.3237|75|0|5|釉砖和壁画细节丰富，与老城巷道步行衔接。|Wazir Khan Mosque
museum|拉合尔博物馆|Lahore Museum|31.5684|74.3077|120|3|12|从犍陀罗艺术到旁遮普近代文化，可按主题慢看。|Lahore Museum
shalimar|夏利马尔花园|Shalimar Gardens, Lahore|31.5859|74.3824|90|3|12|台地、水池与几何布局体现莫卧儿园林，远离城堡需单独接驳。|Shalimar Gardens, Lahore''',
'''foodstreet|堡垒路旁遮普晚餐|Fort Road Food Street|31.5868|74.3119|90|8|25|food|用一顿烤肉、炖菜与烤饼认识旁遮普饮食；景观席位和普通店铺价格不同。|Fort Road Food Street|https://visitlahore.com/attractions/|auto
hammam|沙希浴场建筑与修复|Shahi Hammam heritage visit|31.5813|74.3265|60|3|12|culture|了解莫卧儿公共浴场的供热、水道与修复壁画，属于遗产参观而非洗浴服务。|Shahi Hammam|https://walledcitylahore.gop.pk/|auto
festival|拉合尔文学节|Lahore Literary Festival|31.5588|74.3292|150|0|15|festival|按当年公布的讲座、讨论和语言选择参加，座位与入场条件另行确认。|Lahore Literary Festival|https://www.lahorelitfest.com/|event''',
'''nihari|尼哈里炖牛肉|Nihari|长时间炖煮的肉汤菜常搭配烤饼，味道浓郁。|Nihari|老城传统餐馆|3|10
karahi|卡拉伊锅鸡|Chicken karahi|鸡肉、番茄与香料现炒炖制，半只或整只需确认份量。|Chicken karahi|Lakshmi Chowk|5|18
halwa|哈勒瓦普里早餐|Halwa puri|炸面饼搭配鹰嘴豆与甜粗麦粉，适合分享。|Halwa puri|Gawalmandi 早餐店|2|6
lassi|拉西酸奶饮|Lassi|甜咸酸奶饮均有，传统杯份较大。|Lassi|老城奶品店|1|4
chargha|拉合尔香料鸡|Chargha|整鸡腌渍、蒸炸而成，宜多人分食。|Chargha|传统旁遮普餐馆|6|18''',
'''pearl|Pearl Continental Hotel Lahore|https://pchotels.com/public/hotel-and-resort/pearl-continental-hotel-lahore|90|220|Mall Road 一带的大型城市酒店。|Lahore
avari|Avari Lahore|https://www.avari.com/|80|200|Mall Road 历史城区附近的酒店。|Lahore
faletti|Faletti's Hotel Lahore|https://falettishotel.com/|65|170|埃格顿路的历史酒店建筑，勿与其他同名分店混淆。|Faletti's Hotel
nishat|The Nishat Hotel Gulberg|https://nishathotels.com/|90|220|古尔伯格商业区的现代酒店。|Lahore
luxus|Luxus Grand Hotel|https://luxusgrand.com/|65|160|埃格顿路附近的城市酒店，可比较家庭房方案。|Lahore''')

add(('yangon','仰光','Yangon','MM','缅甸','亚洲','MMK',16.8409,96.1735,'RGN','Yangon'),
'金塔、湖泊与老城骑楼展现港口城市的多层文化；茶馆日常和纺织市场也值得了解。',
'老城区按片步行，跨区和机场使用可靠接驳；当前交通、营业和旅行建议须逐次核实。','https://tourism.gov.mm/en/regions/yangon',
'''shwedagon|仰光大金塔|Shwedagon Pagoda|16.7983|96.1496|120|8|20|佛塔平台是活跃宗教空间，入内脱鞋并遵守衣着要求。|Shwedagon Pagoda
sule|苏雷宝塔|Sule Pagoda|16.7740|96.1588|60|3|8|老城路网中心的佛塔，可结合周边建筑外观理解城市格局。|Sule Pagoda
national|缅甸国家博物馆|National Museum of Myanmar|16.7883|96.1424|120|4|12|王座、民族服饰和历史展品介绍缅甸不同地区。|National Museum of Myanmar (Yangon)
kandawgyi|皇家湖|Kandawgyi Lake|16.7944|96.1668|90|0|5|湖岸绿地与远处佛塔组成城市景观，步道可达性随维护变化。|Kandawgyi Lake
chaukhtatgyi|乔达基卧佛寺|Chaukhtatgyi Buddha Temple|16.8124|96.1641|60|0|5|巨大卧佛与脚底纹样是主要看点，保持宗教场所礼仪。|Chaukhtatgyi Buddha Temple''',
'''market|昂山市场织物与漆器|Bogyoke Aung San Market|16.7806|96.1555|90|0|0|culture|认识隆基面料、漆器和宝石柜台；购买高价商品需自行核验来源。|Bogyoke Aung San Market|https://tourism.gov.mm/en/regions/yangon|auto
teashop|仰光茶馆早餐|Yangon teashop breakfast|16.7760|96.1590|75|3|10|food|奶茶配小食的茶馆是城市日常交流场景，按实际点单计费。|Burmese tea culture||auto
thingyan|泼水节与新年文化|Thingyan traditions|16.7745|96.1586|120|0|20|festival|关注当年公开节庆与当地参与规则，活动地点、举行与否及交通管制不能按历史安排推定。|Thingyan||event''',
'''mohinga|鱼汤米线|Mohinga|鱼汤、米线和香料构成常见早餐，炸物配料另计。|Mohinga|老城茶馆|2|6
lahpet|茶叶沙拉|Lahpet thoke|发酵茶叶与豆类、坚果拌食，坚果过敏者先询问。|Lahpet|缅甸菜餐馆|3|8
ohnno|椰奶鸡汤面|Ohn no khao swe|椰奶鸡汤配面条，常加煮蛋与酸味配料。|Ohn no khao swe|老城茶馆|3|8
shan|掸邦米线|Shan noodles|鸡肉或猪肉酱配米线，汤面与拌面版本不同。|Shan noodles|掸邦面馆|2|6
mont|椰奶米粉冻甜品|Mont let saung|米粉制成柔软条状冻，配椰奶或棕榈糖浆，常冰凉享用；配料随店铺版本变化。|List of Burmese dishes|传统甜品店|1|4''',
'''strand|The Strand Yangon|https://www.hotelthestrand.com/|180|400|河岸历史建筑内的精品酒店。|Strand Hotel
panpacific|Pan Pacific Yangon|https://www.panpacific.com/en/hotels-and-resorts/pp-yangon.html|80|200|Junction City 综合体内，靠近昂山市场。|Yangon
chatrium|Chatrium Hotel Royal Lake Yangon|https://www.chatrium.com/royallakeyangon|65|170|皇家湖一带的酒店选择。|Yangon
sedona|Sedona Hotel Yangon|https://www.sedonahotels.com.sg/yangon/|65|180|茵雅湖片区的城市酒店，距老城需乘车。|Yangon
inlay|Inya Lake Hotel|https://www.inyalakehotel.com/|50|140|茵雅湖边的园林式酒店。|Inya Lake Hotel''')

add(('kabul','喀布尔','Kabul','AF','阿富汗','亚洲','AFN',34.5553,69.2075,'KBL','Kabul'),
'山谷里的历史花园、宫殿与手工艺承载着复杂的城市记忆；本页用于文化认识，不确认当前可自由参观。',
'当前不自动安排活动；交通与场馆准入须由具备当地资质的接待方核实，女性尤其受严格限制。','https://whc.unesco.org/en/tentativelists/5469/',
'''babur|巴布尔花园|Gardens of Babur|34.5033|69.1581|120|2|12|台地、水轴与陵墓体现早期莫卧儿园林传统，准入限制需另核。|Gardens of Babur
museum|阿富汗国家博物馆|National Museum of Afghanistan|34.4675|69.1207|120|3|15|考古藏品见证跨文化交流，展厅及开放内容不能按旧资料推定。|National Museum of Afghanistan
darul|达鲁拉曼宫|Darul Aman Palace|34.4659|69.1191|60|0|10|宫殿外观体现二十世纪国家建设历史，仅在允许范围观察。|Darul Aman Palace
chehel|四十柱宫花园|Chihil Sutun|34.4866|69.1797|90|2|12|历史宫殿与山谷花园，当前公共准入须确认。|Chihil Sutun
bala|巴拉希萨尔城堡|Bala Hissar|34.5045|69.1931|60|0|10|山坡堡垒是城市历史地标，禁止自行进入受限区域。|Bala Hissar, Kabul''',
'''crafts|穆拉德汗传统工艺认识|Murad Khane craft heritage|34.5178|69.1800|90|5|25|culture|了解木雕、书法与陶艺的历史，工作坊只有经授权接待并确认开放后方可安排。|Murad Khane|https://www.turquoisemountain.org/|manual
food|阿富汗共享餐桌文化|Afghan shared-table traditions|34.5330|69.1670|90|5|20|food|通过米饭、面饼和饺子认识地区饮食，不将文化条目视为可自由前往的餐馆预约。|Afghan cuisine||manual
bazaar|鸡街手工地毯与织物|Chicken Street crafts|34.5330|69.1674|90|0|0|culture|认识地毯、刺绣和旧物贸易，拍摄与购物须遵守现场限制，不保证当前店铺营业。|Chicken Street||manual''',
'''qabuli|喀布尔抓饭|Kabuli pulao|长粒米搭配肉、胡萝卜和葡萄干，常见于家庭宴席。|Kabuli pulao|传统阿富汗餐馆，准入先核实|3|12
mantu|阿富汗蒸饺|Mantu|肉馅蒸饺配酸奶和豆类酱汁。|Manti (food)|传统阿富汗餐馆，准入先核实|3|10
ashak|韭菜饺子|Aushak|韭葱类蔬菜馅饺子搭配酸奶与肉酱，可询问素食版本。|Aushak|传统阿富汗餐馆，准入先核实|3|10
bolani|阿富汗蔬菜馅饼|Bolani|薄面皮包土豆或绿叶菜煎制，适合小食。|Bolani|当地面食铺，准入先核实|1|5
sheeryakh|阿富汗奶冰|Sheer yakh|奶制冰品常加入豆蔻与坚果，配方因店铺而异。|Sheer yakh|甜品店，准入先核实|1|5''',
'''intercontinental|Hotel Inter-Continental Kabul|https://www.intercontinentalkabul.com/|70|180|山坡上的历史酒店；不属于 IHG 现行连锁管理的保证。|Hotel Inter-Continental Kabul
star|Kabul Star Hotel|https://kabulstarhotel.com/|70|180|市区商务接待酒店资料。|Kabul
grand|Kabul Grand Hotel|https://kabulgrandhotel.com/|60|150|喀布尔城市酒店资料，接待资格和安保另核。|Kabul Grand Hotel
darya|Darya Village Hotel|https://www.daryavillage.af/darya-village-hotel-and-business-park/|80|200|酒店园区型接待资料，不保证目前营业。|Kabul
parkstar|Park Star Hotel|https://www.parkstarhotel.af/|50|140|喀布尔商务酒店资料，不能直接视为可订房源。|Kabul''')

def write_pack():
    for folder,items in [('expansion',CITIES),('experience-expansion',EXPERIENCES),('food-expansion',FOODS)]:
        (ROOT/'data'/folder/PACK).write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(f'{len(CITIES)} cities, {sum(len(c["attractions"]) for c in CITIES)} attractions, {len(EXPERIENCES)} experiences/hotels, {len(FOODS)} foods')

add(('kyiv','基辅','Kyiv','UA','乌克兰','欧洲','UAH',50.4501,30.5234,'KBP','Kyiv'),
'金顶教堂、山坡街巷和第聂伯河见证城市的悠久历史；此处保留文化资料，不能忽略战争、空袭与宵禁。',
'战时航空、铁路、宵禁和场馆安排须查询实时公告；本页不自动排定观光活动。','https://guide.kyivcity.gov.ua/en/faq/yaki-osnovni-turystychni-vyznachni-mistsya-varto-vidvidaty-v-kyyevi',
'''sophia|圣索菲亚主教座堂|Saint Sophia Cathedral|50.4529|30.5144|120|3|15|马赛克、壁画与钟楼属于不同参观范围，保护和开放安排须核实。|Saint Sophia Cathedral, Kyiv
lavra|基辅洞窟修道院|Kyiv Pechersk Lavra|50.4346|30.5578|150|3|20|山坡修道院建筑群兼具宗教与博物馆空间，洞窟准入不可自行推定。|Kyiv Pechersk Lavra
goldengate|基辅金门|Golden Gate, Kyiv|50.4488|30.5133|60|2|10|中世纪城门遗址与保护建筑，帮助理解历史城界。|Golden Gate, Kyiv
andrew|圣安德烈教堂|Saint Andrew's Church|50.4590|30.5184|75|2|10|山坡巴洛克建筑与周边街巷，台阶与坡度较大。|Saint Andrew's Church, Kyiv
khanenko|哈年科博物馆|Khanenko Museum|50.4406|30.5136|120|3|12|艺术收藏反映跨文化交流；战时展陈与建筑可达性须向馆方确认。|Khanenko Museum''',
'''descent|安德烈斜坡工艺与城市记忆|Andriivskyi Descent culture|50.4597|30.5166|90|0|0|culture|历史坡道连着画廊与手工艺店，开放状态和步行条件不能据旧资料判断。|Andriivskyi Descent||auto
opera|乌克兰国家歌剧院演出|National Opera performance|50.4466|30.5120|180|10|70|performance|仅在剧院明确公布场次、警报处置与入场规则后考虑参加。|National Opera of Ukraine|https://opera.com.ua/en|event
food|乌克兰饺子与家常餐桌|Ukrainian home-style meal|50.4660|30.5160|90|8|25|food|认识饺子不同馅料和酸奶油搭配，作为文化与饮食参考，不承诺可执行餐馆路线。|Ukrainian cuisine||manual''',
'''borscht|乌克兰甜菜汤|Borscht|甜菜与蔬菜、肉汤组成家常汤，各家风味不同。|Borscht|Podil 乌克兰餐馆|3|9
varenyky|乌克兰饺子|Varenyky|土豆、奶酪、肉或樱桃馅均常见，甜咸版本分开选择。|Pierogi|传统乌克兰餐馆|4|12
kyiv|基辅鸡排|Chicken Kyiv|鸡胸包香草黄油后裹粉炸制，切开时注意热汁。|Chicken Kiev|市中心乌克兰餐馆|6|18
syrnyky|凝乳奶酪煎饼|Syrnyky|软奶酪煎饼常配果酱和酸奶油，作为早餐或甜品。|Syrniki|咖啡馆|3|9
pampushky|蒜香小面包|Pampushky|小面包常以蒜香油调味，搭配汤食用。|Pampushka|传统餐馆与面包店|2|5''',
'''fairmont|Fairmont Grand Hotel Kyiv|https://ua.fairmont.com/kyiv/|150|350|波迪尔河岸附近的城市酒店。|Kyiv
intercontinental|InterContinental Kyiv|https://www.ihg.com/intercontinental/hotels/gb/en/kiev/kbpha/hoteldetail|150|350|靠近圣迈克尔修道院片区。|Kyiv
mirrors|11 Mirrors Design Hotel|https://11mirrors-hotel.com/|150|350|歌剧院附近的设计酒店。|Kyiv
senator|Senator Maidan|https://senator-apartments.com/|80|180|独立广场一带的公寓式住宿。|Kyiv
dream|DREAM Hostel Kyiv|https://dream-hostels.com/|30|80|波迪尔片区青年旅舍，本项按独立房而非床位预留。|Kyiv''')

add(('ashgabat','阿什哈巴德','Ashgabat','TM','土库曼斯坦','亚洲','TMT',37.9601,58.3261,'ASB','Ashgabat'),
'白色大理石城市、织毯文化与帕提亚遗址形成鲜明组合；旅行需先解决邀请、签证与授权接待。',
'市区景点分散，通常由授权接待方安排车辆；尼萨遗址需另留往返时间。拍摄和公共区域准入遵守当地规定。','https://museum.gov.tm/en',
'''museum|土库曼斯坦国家博物馆|State Museum of Turkmenistan|37.8836|58.3282|120|8|30|历史、民族文化与自然收藏，外籍票种和摄影收费先核对。|State Museum of the State Cultural Center of Turkmenistan
carpet|土库曼地毯博物馆|Turkmen Carpet Museum|37.9294|58.3778|90|8|25|不同部族织纹和大型地毯展示手工织造传统。|Turkmen Carpet Museum
nisa|尼萨帕提亚要塞|Parthian Fortresses of Nisa|37.9526|58.2112|120|5|20|城西考古遗址保留帕提亚王朝痕迹，无遮阴区域较多，需车辆往返。|Nisa, Turkmenistan
ertugrul|埃尔图鲁尔加齐清真寺|Ertuğrul Gazi Mosque|37.9166|58.3788|60|0|0|奥斯曼风格宗教建筑，参观范围与拍照先征询。|Ertuğrul Gazi Mosque
independence|独立纪念碑|Independence Monument|37.8845|58.3790|60|0|0|城市纪念性规划的一部分，仅在开放区域观看建筑与雕塑。|Independence Monument (Turkmenistan)''',
'''carpetcraft|土库曼地毯纹样认识|Turkmen carpet patterns|37.9294|58.3778|90|10|35|craft|围绕重复纹样、染色和手织工序安排讲解；不是承诺现场每天都有编织表演。|Turkmen rug|https://ich.unesco.org/en/RL/traditional-turkmen-carpet-making-art-in-turkmenistan-01486|manual
bazaar|阿尔滕阿瑟尔市场|Altyn Asyr market|38.0510|58.4770|150|0|0|culture|市场可见织物和日常用品，距离市区较远且营业日需先核对。|Altyn Asyr bazaar||manual
tea|土库曼茶与烤饼|Turkmen tea and bread|37.9601|58.3261|60|4|12|food|在授权接待安排的餐馆了解茶、烤饼与待客习惯，选择份量时避免重复主餐。|Turkmen cuisine||manual''',
'''plov|土库曼抓饭|Palaw|肉、胡萝卜与米饭组合，常在共享餐桌出现。|Pilaf|传统土库曼餐馆|5|15
dograma|碎饼羊肉汤|Dograma|面饼、肉和洋葱拌合后加入热汤，是具有地方特色的主食。|Dograma|传统土库曼餐馆|5|14
ichlekli|土库曼肉馅饼|Ishlekli|面皮包肉与洋葱烘烤，通常适合分食。|Ishlekli|传统面食餐馆|4|12
manty|中亚蒸饺|Manti|肉与洋葱馅的较大蒸饺，常按数只一份。|Manti (food)|当地面食店|4|12
shashlik|炭烤肉串|Shashlik|羊肉或其他肉类炭烤，确认按串还是按重量计价。|Shashlik|市区烤肉餐馆|5|15''',
'''oguzkent|Oguzkent Hotel|https://www.oguzkenthotel.com/|180|350|城市中心的大型接待酒店。|Oguzkent Hotel
yyldyz|Yyldyz Hotel|https://yyldyzhotel.gov.tm/en/services|180|350|山坡玻璃塔楼酒店，需车辆接驳。|Yyldyz Hotel
nusay|Nusay Hotel|https://sustainabledevelopment.un.org/content/documents/11256Information%20Note_1711.pdf|100|220|政府会议资料中列出的市区酒店，现行接待须由授权方确认。|Ashgabat
ashgabat|Ashgabat Hotel|https://sustainabledevelopment.un.org/content/documents/11256Information%20Note_1711.pdf|100|230|城市酒店资料，不能将历史会议名单视为当日空房。|Ashgabat
akaltyn|Ak Altyn Hotel|https://sustainabledevelopment.un.org/content/documents/11256Information%20Note_1711.pdf|70|170|马赫图姆库里大道一带的酒店资料。|Ashgabat''')

add(('samarkand','撒马尔罕','Samarkand','UZ','乌兹别克斯坦','亚洲','UZS',39.6542,66.9597,'SKD','Samarkand'),
'蓝色穹顶与帖木儿建筑之外，集市馕饼、纸作坊和茶馆让丝路古城更有日常温度。',
'核心古迹可分组步行，其余乘出租车；火车站距老城有距离，阿夫罗西阿卜高铁须另查日期和余票。','https://uzbekistan.travel/en/i/samarkand/',
'''registan|雷吉斯坦广场|Registan|39.6548|66.9758|150|5|18|三座经学院构成广场，室内装饰和外部立面可分别慢看。|Registan
shahizinda|沙伊辛达陵墓群|Shah-i-Zinda|39.6627|66.9870|120|3|12|沿阶梯比较蓝釉砖、几何纹样与不同年代的陵墓。|Shah-i-Zinda
guremir|古尔埃米尔陵|Gur-e-Amir|39.6485|66.9692|75|3|12|帖木儿家族陵墓以穹顶和内部装饰著称。|Gur-e-Amir
bibi|比比哈努姆清真寺|Bibi-Khanym Mosque|39.6606|66.9809|90|3|12|大型院落与修复建筑体现帝国都城尺度，避免在正午久晒。|Bibi-Khanym Mosque
observatory|兀鲁伯天文台|Ulugh Beg Observatory|39.6748|67.0056|90|3|12|遗存与博物馆解释中世纪天文测量，与老城有车程。|Ulugh Beg Observatory''',
'''siab|西亚布集市与撒马尔罕馕|Siyob Bazaar bread culture|39.6620|66.9804|90|0|0|food|看烤馕、干果与香料摊位，食物消费计入餐饮预算，拍摊位前征得同意。|Siyob Bazaar|https://uzbekistan.travel/en/i/samarkand/|auto
paper|科尼吉尔桑皮造纸|Konigil paper workshop|39.6680|67.0430|120|5|20|craft|了解桑皮纸浸泡、捣浆和成纸过程，需确认作坊接待与往返车辆。|Samarkand|https://uzbekistan.travel/en/i/samarkand/|manual
music|东方旋律音乐节|Sharq Taronalari|39.6548|66.9758|180|0|50|festival|按官方当届日期认识不同地区的传统音乐，不把往届节庆当作每天演出。|Sharq Taronalari|https://uzbekistan.travel/en/i/samarkand/|event''',
'''plov|撒马尔罕抓饭|Samarkand plov|米、肉与胡萝卜分层烹煮，通常午间供应更集中。|Pilaf|市区 osh 中心|3|9
non|撒马尔罕圆馕|Samarkand non|厚边圆馕具有压印纹样，可配茶与主餐分食。|Tandyr nan|Siyob Bazaar|1|4
samsa|烤包子|Samsa|酥皮或面皮包肉洋葱，出炉时肉汁较烫。|Samsa (food)|Siyob Bazaar 周边|1|4
manti|中亚蒸饺|Manti|肉与洋葱的大蒸饺，常配酸奶油类酱汁。|Manti (food)|传统乌兹别克餐馆|3|9
shashlik|乌兹别克烤肉串|Shashlik|炭火肉串配洋葱和面饼，按串计价需确认份量。|Shashlik|市区烤肉餐馆|3|10''',
'''bibikhanum|Bibikhanum Hotel|https://www.hotelbibikhanum.com/|60|130|比比哈努姆清真寺附近的院落酒店。|Samarkand
malika|Malika Prime Hotel|https://malikahotel.com/en-gb/|50|110|古尔埃米尔陵附近，新旧城交界的精品酒店。|Samarkand
emirhan|Emir Han Hotel|https://emirhanhotel.com/|60|140|城市酒店，可比较前往古迹的实际接驳时间。|Samarkand
dilimah|DiliMah Premium Luxury Hotel|https://dilimahhotel.com/|65|160|老城外的现代酒店，交通需另留时间。|Samarkand
silkroad|Silk Road by Minyoun|https://www.silkroad-samarkand.com/|100|250|划船运河旁旅游综合体内的高层酒店，距雷吉斯坦较远。|Samarkand''')

add(('sanaa','萨那','Sanaa','YE','也门','亚洲','YER',15.3694,44.1910,'SAH','Sanaa'),
'多层塔楼、白色石膏窗饰与传统市场让萨那旧城独具辨识度；本页作为文化资料保存，不确认当前旅游可达性。',
'当前安全与准入条件不适合生成常规自助行程；交通、住宿及遗产保护状态均需独立核实。','https://whc.unesco.org/en/list/385/',
'''oldcity|萨那旧城|Old City of Sanaa|15.3555|44.2142|150|0|0|砖石塔楼与白色纹饰展示高地城市建筑传统；部分建筑存在损毁风险。|Old City of Sanaa
babalyemen|也门门|Bab al-Yaman|15.3485|44.2134|45|0|0|旧城南侧的城门地标，仅作为历史地理识别点。|Bab al-Yaman
greatmosque|萨那大清真寺|Great Mosque of Sanaa|15.3548|44.2141|60|0|0|早期伊斯兰宗教建筑，内部不应视为面向所有游客开放。|Great Mosque of Sanaa
museum|也门国家博物馆|National Museum of Yemen|15.3551|44.2083|90|2|10|宫殿建筑内的历史馆藏资料，当前展陈和开放未确认。|National Museum of Yemen
daralhajar|达尔哈贾尔岩石宫|Dar al-Hajar|15.4440|44.1251|90|3|15|瓦迪达赫尔岩石上的宫殿，位于城外，不能按市区步行项目安排。|Dar al-Hajar''',
'''souq|穆尔赫集市文化|Souq al-Milh heritage|15.3507|44.2152|90|0|0|culture|传统市场与塔楼街巷构成旧城日常历史，当前营业状态未确认。|Souk Al-Milh||manual
qamariya|卡马里耶彩色窗工艺|Qamariya window craft|15.3555|44.2142|90|0|20|craft|认识石膏花窗和有色玻璃如何把光引入塔楼，不承诺现场工作坊接待。|Old City of Sanaa|https://whc.unesco.org/en/list/385/|manual
coffee|也门咖啡与咖啡壳茶|Yemeni coffee and qishr|15.3555|44.2142|60|2|10|food|从咖啡与咖啡果皮饮品认识高地饮食文化，作为文化资料而非当前餐饮预约。|Qishr||manual''',
'''saltah|萨勒塔炖菜|Saltah|热石碗中的炖菜与胡芦巴泡沫，常配面饼。|Saltah|传统萨那餐馆，营业先核实|3|10
fahsa|法赫萨肉炖菜|Fahsa|以炖肉为主体的热锅，配面饼分享。|Fahsa|传统萨那餐馆，营业先核实|4|12
bint|蜂蜜千层饼|Bint al-sahn|层叠面饼淋蜂蜜，适合多人分享。|Bint al-sahn|家庭式也门餐馆，营业先核实|3|10
aseed|阿西德面团|Aseeda|以谷粉制成主食团，搭配汤汁或酱料。|Asida|传统也门餐馆，营业先核实|2|8
qishr|咖啡壳姜茶|Qishr|咖啡果皮与姜等香料煮成饮品。|Qishr|旧城茶铺，营业先核实|1|4''',
'''burj|Burj Al Salam Hotel|https://www.tripadvisor.com/Search?q=Burj%20Al%20Salam%20Sanaa|35|100|旧城塔楼型酒店历史资料，当前营业未核实。|Sanaa
arabia|Arabia Felix Hotel|https://www.tripadvisor.com/Search?q=Arabia%20Felix%20Hotel%20Sanaa|25|80|旧城传统建筑住宿资料，当前营业未核实。|Sanaa
sheba|Sheba Hotel Sanaa|https://www.tripadvisor.com/Search?q=Sheba%20Hotel%20Sanaa|70|180|城市大型酒店资料，当前接待未确认。|Sanaa
shahran|Shahran Hotel|https://www.tripadvisor.com/Search?q=Shahran%20Hotel%20Sanaa|50|150|城市酒店身份资料，当前营业未核实。|Sanaa
sheraton|Sheraton Sanaa Hotel（历史名称）|https://en.wikipedia.org/wiki/Sheraton_Sanaa_Hotel|60|180|仅作酒店建筑历史资料，不表示仍属该品牌或可以预订。|Sheraton Sanaa Hotel''')

add(('baghdad','巴格达','Baghdad','IQ','伊拉克','亚洲','IQD',33.3152,44.3661,'BGW','Baghdad'),
'两河文明收藏、底格里斯河与书市体现巴格达的文化厚度；当前访问条件必须独立确认。',
'各区间采用可靠车辆和当地接待；安全检查、开放限制及旅行建议会改变可达性，不自动生成观光路线。','https://www.unesco.org/sites/default/files/medias/fichiers/2025/04/Baghdad_Monitoring_Report_2024.pdf',
'''museum|伊拉克国家博物馆|Iraq Museum|33.3282|44.3853|150|5|25|两河文明考古馆藏，须先确认当前开放、预约和外籍入场条件。|Iraq Museum
abbasid|阿拔斯宫|Abbasid Palace|33.3434|44.3841|75|3|15|砖拱、院落与河岸位置展现中世纪建筑传统。|Abbasid Palace
mustansiriya|穆斯坦绥里亚学院|Mustansiriya Madrasa|33.3377|44.3894|75|3|15|历史学院的砖砌院落体现巴格达学术传统，开放范围另核。|Mustansiriya Madrasa
martyr|烈士纪念碑|Al-Shaheed Monument|33.3431|44.4457|75|0|15|分裂蓝色穹顶是现代纪念建筑，内部与外围可能有不同准入。|Al-Shaheed Monument
qushla|库什拉钟楼与院落|Qushla|33.3416|44.3865|60|0|5|奥斯曼时期建筑群与书市相邻，是理解旧城公共生活的空间。|Qushla''',
'''books|穆塔纳比街书市|Al-Mutanabbi book market|33.3422|44.3884|90|0|0|culture|书店和文学交流承载城市阅读文化；只在当地接待确认可达与开放后前往。|Mutanabbi Street|https://www.unesco.org/sites/default/files/medias/fichiers/2025/04/Baghdad_Monitoring_Report_2024.pdf|manual
tea|沙班达尔咖啡馆文化|Shabandar literary cafe|33.3425|44.3882|60|2|10|culture|了解照片、茶与文人聚会的城市记忆，不保证当前座位或营业。|Shabandar Café||manual
masgouf|底格里斯烤鱼传统|Masgouf cooking tradition|33.2860|44.3820|120|15|45|food|鱼架在火旁慢烤，按重量和人数点单，等待时间较长。|Masgouf||manual''',
'''masgouf|伊拉克烤鱼|Masgouf|鱼身展开后慢烤，通常整鱼共享，预算按一人分摊。|Masgouf|Abu Nuwas / Jadriya 餐馆，准入先核实|10|30
dolma|伊拉克酿菜|Dolma|蔬菜或葡萄叶包米肉馅，酸味和香料较鲜明。|Dolma|伊拉克传统餐馆|5|15
quzi|库齐羊肉饭|Quzi|羊肉与米饭、坚果组成宴席主菜。|Quzi|传统伊拉克餐馆|8|22
kubba|伊拉克肉馅团|Kubba|谷物外皮包肉馅，可油炸、炖汤或煮制。|Kibbeh|市区传统餐馆|3|10
kleicha|椰枣馅饼干|Kleicha|带椰枣或坚果馅的节庆饼干，适合配茶。|Kleicha|传统糕点店|2|6''',
'''babylon|Babylon Rotana Baghdad|https://www.rotana.com/rotanahotelandresorts/iraq/baghdad/babylonrotana|180|400|阶梯形酒店建筑临近底格里斯河。|Babylon Rotana Baghdad Hotel
baghdad|Baghdad Hotel|https://www.baghdadhotel.com/|90|220|市中心历史酒店，接驳与安保须单独确认。|Baghdad Hotel
coral|Coral Baghdad Hotel|https://www.hmhhotelgroup.com/coral-baghdad-hotel|100|240|贾德里亚片区商务酒店。|Baghdad
cristal|Cristal Grand Ishtar Hotel|https://www.cristalhotelsandresorts.com/|100|240|市中心高层酒店建筑资料。|Ishtar Hotel
palestine|Palestine Hotel|https://en.wikipedia.org/wiki/Palestine_Hotel|70|180|菲尔多斯广场附近历史酒店，当前接待条件先核实。|Palestine Hotel''')

add(('muscat','马斯喀特','Muscat','OM','阿曼','亚洲','OMR',23.5880,58.3829,'MCT','Muscat'),
'山海之间的港口、乳香集市与阿曼建筑构成从容的海湾城市，海上观察与文化场馆可交替安排。',
'老马斯喀特、马特拉、库鲁姆和大清真寺相距较远，公交结合出租车；出海项目按码头另计接驳与天气。','https://experienceoman.om/en/destinations',
'''mosque|苏丹卡布斯大清真寺|Sultan Qaboos Grand Mosque|23.5835|58.3890|90|0|10|庭院、石雕与祈祷大厅展示阿曼宗教建筑，非穆斯林参观时段和衣着须核对。|Sultan Qaboos Grand Mosque
national|阿曼国家博物馆|National Museum of Oman|23.6086|58.5922|120|5|18|海洋贸易、工艺与国家历史展陈，适合炎热时段。|National Museum of Oman
zubair|拜特祖拜尔博物馆|Bait Al Zubair|23.6125|58.5898|90|5|15|服饰、武器与家庭生活藏品帮助认识阿曼地方文化。|Bait Al Zubair
fort|马特拉堡|Muttrah Fort|23.6226|58.5672|75|3|12|登上港口附近堡垒看海湾轮廓，台阶与阳光需考虑。|Muttrah
palace|阿拉姆王宫外观|Al Alam Palace exterior|23.6156|58.5947|45|0|0|蓝金立面的礼仪宫殿只能在允许公共区域看外观，不包含入内。|Al Alam Palace''',
'''souq|马特拉集市乳香与银饰|Mutrah Souq|23.6209|58.5640|90|0|0|culture|辨认乳香、香炉、织物与银饰，市场本身不收统一门票，购物另算。|Muttrah|https://experienceoman.om/en/destinations|auto
dolphin|近海海豚观察|Muscat dolphin watching|23.5800|58.6070|150|40|90|wildlife|从持证运营方出海观察海豚，野生动物不保证出现；不追逐、投喂或强行下水接近。|Gulf of Oman|https://experienceoman.om/en/|manual
opera|皇家歌剧院演出|Royal Opera House performance|23.6138|58.4686|180|25|150|performance|音乐、歌剧和舞蹈按具体场次售票，建筑参观与晚间演出是不同项目。|Royal Opera House Muscat|https://rohmuscat.org.om/|event''',
'''shuwa|阿曼慢烤羊肉|Shuwa|香料腌肉慢烤，传统节庆料理不一定每日供应。|Shuwa|阿曼传统餐馆|10|28
majboos|阿曼香料饭|Majboos|米饭搭配鸡肉或羊肉与干柠檬香气。|Kabsa|Mutrah / Qurum 餐馆|6|18
halwa|阿曼哈勒瓦|Omani halwa|香料、糖与淀粉熬成浓稠甜点，常配咖啡。|Omani halwa|Mutrah 甜品店|3|10
mashuai|烤鱼与柠檬饭|Mashuai|烤鱼搭配柠檬米饭，鱼种与份量先确认。|Omani cuisine|海鲜与阿曼菜餐馆|10|28
khubz|阿曼薄饼|Khubz ragag|薄脆面饼可配奶酪、蜂蜜或蛋，适合小食。|Khubz|市区早餐店|2|6''',
'''chedi|The Chedi Muscat|https://www.ghmhotels.com/en/muscat/|250|650|古布拉海岸的简约园林度假酒店。|Muscat
intercontinental|InterContinental Muscat|https://www.ihg.com/intercontinental/hotels/us/en/muscat/mscha/hoteldetail|150|350|库鲁姆海岸附近的城市度假酒店。|Muscat
w|W Muscat|https://www.marriott.com/en-us/hotels/mctwh-w-muscat/overview/|200|480|皇家歌剧院附近的海岸设计酒店。|Muscat
mutrah|Mutrah Hotel|https://www.mutrahotel.com/|40|100|马特拉片区的较经济城市住宿。|Muscat
jumeirah|Jumeirah Muscat Bay|https://www.jumeirah.com/en/stay/oman/jumeirah-muscat-bay|250|650|班达尔吉萨海湾度假酒店，距市区需单独接驳。|Muscat''',daily=[[45,120,300],[15,35,85],[10,30,75],[8,18,40]])

add(('bucharest','布加勒斯特','Bucharest','RO','罗马尼亚','欧洲','RON',44.4268,26.1025,'OTP','Bucharest'),
'法式大道、东正教小院和二十世纪巨型建筑并置，咖啡馆、书店与音乐厅让城市不止于地标。',
'中心城区步行结合地铁，乡村博物馆在北部；机场铁路衔接北站，议会宫需核对预约与证件。','https://romaniatourism.com/bucharest.html',
'''parliament|议会宫|Palace of the Parliament|44.4275|26.0874|120|10|25|大型政治建筑通常按导览与预约开放，证件和集合入口须确认。|Palace of the Parliament
athenaeum|罗马尼亚雅典娜音乐厅|Romanian Athenaeum|44.4413|26.0971|60|3|10|圆形音乐厅的建筑参观与音乐会分开售票。|Romanian Athenaeum
village|迪米特里耶古斯蒂乡村博物馆|Dimitrie Gusti National Village Museum|44.4731|26.0765|150|5|15|露天展示不同地区的木屋、农舍与生活器具。|Dimitrie Gusti National Village Museum
stavropoleos|斯塔夫罗波莱奥斯修道院|Stavropoleos Monastery|44.4312|26.0987|45|0|0|老城中的小型院落和石雕柱廊，礼拜时保持安静。|Stavropoleos Monastery
art|罗马尼亚国家艺术博物馆|National Museum of Art of Romania|44.4402|26.0959|150|5|18|旧王宫内的罗马尼亚与欧洲艺术可选不同馆区。|National Museum of Art of Romania''',
'''bookshop|旋转木马书店与阅读空间|Cărturești Carusel|44.4315|26.1008|60|0|0|culture|旧城修复建筑中的书店，观赏楼梯和采光，购物及咖啡另计。|Cărturești Carusel||auto
concert|雅典娜音乐厅古典音乐会|Athenaeum concert|44.4413|26.0971|150|12|70|performance|按爱乐乐团当期节目选择音乐会，演出不等同于白天建筑参观。|Romanian Athenaeum|https://www.fge.org.ro/|event
cafe|胜利大道咖啡与城市建筑|Calea Victoriei cafe culture|44.4390|26.0960|90|5|18|culture|沿胜利大道观察不同时期立面，用咖啡或糕点作为中途休息。|Calea Victoriei|https://romaniatourism.com/bucharest.html|auto''',
'''sarmale|罗马尼亚卷心菜卷|Sarmale|酸菜叶包米肉馅慢炖，常搭配玉米粥。|Sarma (food)|Lipscani 传统餐馆|7|18
mici|无皮烤肉肠|Mici|混合绞肉烤制，常配芥末与面包。|Mititei|市中心烤肉餐馆|5|14
mamaliga|玉米粥|Mămăligă|玉米粉煮成主食，可配奶酪、酸奶油或炖肉。|Mămăligă|罗马尼亚家常菜餐馆|4|12
ciorba|酸汤|Ciorbă|蔬菜、肉类与酸味调料组成汤品，点单确认具体种类。|Ciorbă|传统午餐餐馆|4|10
papanasi|奶酪甜甜圈|Papanași|奶酪面团炸制后配酸奶油和果酱，份量较大可分享。|Papanași|罗马尼亚餐馆|5|13''',
'''marmorosch|The Marmorosch Bucharest|https://www.themarmorosch.com/|140|330|历史银行建筑改造的老城酒店。|Bucharest
athenee|InterContinental Athénée Palace Bucharest|https://atheneepalace.intercontinental.com/|150|350|雅典娜音乐厅旁的历史酒店。|InterContinental Athenee Palace Bucharest
continental|Grand Hotel Continental|https://grand-hotel-continental-bucuresti.continentalhotels.ro/en|100|240|胜利大道上的历史建筑酒店。|Bucharest
cismigiu|Hotel Cișmigiu|https://www.hotelcismigiu.ro/|80|180|靠近西斯米久公园的套房型城市酒店。|Hotel Cișmigiu
grand|Grand Hotel Bucharest|https://www.grandhotelbucharest.ro/|100|250|大学广场旁的标志性高层酒店。|Grand Hotel Bucharest''')

add(('minsk','明斯克','Minsk','BY','白俄罗斯','欧洲','BYN',53.9006,27.5590,'MSQ','Minsk'),
'河岸老街、战后大道与剧院组成明斯克的城市层次，博物馆和日常市场适合从文化角度认识。',
'市区地铁和步行可连接多处场馆，机场在城外；进入场馆和购票按所选日期核对，旅行建议与实际准入分别查看。','https://www.visit-belarus.com/en/visit-minsk/',
'''library|白俄罗斯国家图书馆|National Library of Belarus|53.9314|27.6463|90|2|10|多面体建筑与阅读文化结合，观景与读者区域分开确认。|National Library of Belarus
trinity|三一郊区|Trinity Suburb|53.9092|27.5546|75|0|0|沿斯维斯洛奇河观察重建街区和旧城轮廓。|Trinity Suburb
war|卫国战争历史博物馆|Belarusian Great Patriotic War Museum|53.9150|27.5377|150|4|15|战争历史展陈，留意不同历史叙述与纪念语境。|Belarusian Great Patriotic War Museum
art|白俄罗斯国家美术馆|National Art Museum of Belarus|53.8970|27.5571|120|4|15|可看白俄罗斯与地区艺术，临展范围依当期安排。|National Art Museum of the Republic of Belarus
loshitsa|洛希察庄园公园|Loshitsa Park|53.8569|27.5770|90|0|8|庄园建筑和林荫园路位于南部，室内参观与公园分开计费。|Loshitsa Park''',
'''opera|白俄罗斯国家歌剧芭蕾剧院|Bolshoi Theatre of Belarus|53.9104|27.5619|180|10|70|performance|按当期歌剧或芭蕾节目选择场次，不能用建筑开放时间代替演出安排。|National Academic Bolshoi Opera and Ballet Theatre of the Republic of Belarus|https://bolshoibelarus.by/eng/|event
komarovka|科马罗夫市场食材观察|Komarovsky Market|53.9214|27.5781|90|0|0|food|观察奶酪、面包和季节蔬果，购买与品尝另计。|Komarovsky Market||auto
river|斯维斯洛奇河城市生活|Svislach riverside|53.9092|27.5546|90|0|0|culture|从河岸公共空间观察城市日常，活动和夜间通行以现行规定为准。|Svislach||auto''',
'''draniki|土豆煎饼|Draniki|磨碎土豆煎至酥脆，常配酸奶油。|Potato pancake|传统白俄罗斯餐馆|4|12
machanka|马昌卡肉汁炖菜|Machanka|浓稠肉汁配煎饼蘸食，属于共享家常菜。|Machanka|传统白俄罗斯餐馆|6|16
kolduny|肉馅土豆团|Kolduny|土豆或面皮包肉，烹制方式因地区与餐馆不同。|Kalduny|传统餐馆|5|13
nalistniki|凝乳馅薄饼|Nalistniki|薄饼包凝乳奶酪，可加果酱作为甜食。|Blintz|早餐咖啡馆|3|9
kvas|克瓦斯|Kvass|面包或谷物发酵饮品，可能含少量酒精。|Kvass|市场与传统餐馆|1|4''',
'''beijing|Beijing Hotel Minsk|https://beijinghotel.by/en/|90|220|河边园区式城市酒店。|Minsk
europe|Europe Hotel Minsk|https://hoteleurope.by/en/|100|250|历史中心附近的古典风格酒店。|Minsk
minsk|Hotel Minsk|https://hotelminsk.by/en/|60|150|独立大道上的城市酒店。|Minsk
belarus|Belarus Hotel Minsk|https://hotel-belarus.com/en/|45|120|河岸公园附近的高层酒店。|Belarus Hotel
renaissance|Renaissance Minsk Hotel|https://www.belarushotels.by/en/hotels/minsk/renaissance|100|240|捷尔任斯基大道的酒店资料，品牌与接待状态须核实。|Minsk''')

add(('bishkek','比什凯克','Bishkek','KG','吉尔吉斯斯坦','亚洲','KGS',42.8746,74.5698,'BSZ','Bishkek'),
'雪山背景、树荫大道与中亚市场让首都适合慢节奏停留；毡艺、奶制品与山谷户外提供不同体验。',
'市区步行结合公交或出租车；阿拉阿尔恰山谷是城外半日至全天项目，不能当作市区短停。','https://www.visitkyrgyzstan.org/bazaars-kyrgyzstan/',
'''alatoo|阿拉套广场|Ala-Too Square|42.8760|74.6037|60|0|0|市中心广场与雕像展示国家公共空间，活动期间可能封闭部分区域。|Ala-Too Square
history|吉尔吉斯国家历史博物馆|State History Museum|42.8775|74.6037|120|3|12|从考古到游牧文化了解国家历史。|Kyrgyz State History Museum
finearts|阿伊季耶夫美术馆|Gapar Aitiev Museum of Fine Arts|42.8790|74.6104|90|2|10|绘画、雕塑和装饰艺术展示地区视觉文化。|Kyrgyz National Museum of Fine Arts
oak|橡树公园|Oak Park|42.8782|74.6076|60|0|0|树荫、公共雕塑与邻近艺术场馆组成轻松停留。|Oak Park (Bishkek)
victory|胜利广场|Victory Square, Bishkek|42.8787|74.6174|45|0|0|以蒙古包结构意象构成战争纪念空间，保持安静。|Victory Square, Bishkek''',
'''osh|奥什巴扎与奶制品摊|Osh Bazaar culture|42.8763|74.5688|90|0|0|food|寻找干酪球、蜂蜜和面食，不要与奥什市的巴扎混淆，市场迁移或营业变化须核对。|Osh Bazaar|https://www.visitkyrgyzstan.org/bazaars-kyrgyzstan/|auto
felt|吉尔吉斯毡毯工艺|Kyrgyz felt carpet craft|42.8746|74.6030|120|15|45|craft|预约工艺课程认识毡毯剪拼纹样与羊毛处理，需确认工作坊和语言。|Shyrdak|https://ich.unesco.org/en/USL/ala-kiyiz-and-shyrdak-art-of-kyrgyz-traditional-felt-carpets-00693|manual
alaarcha|阿拉阿尔恰山谷轻徒步|Ala Archa valley walk|42.5588|74.4890|240|20|70|nature|选择适合体能的河谷路线，远离城市且海拔上升，另留往返车程并根据天气折返。|Ala Archa National Park||manual''',
'''besh|手抓肉宽面|Beshbarmak|煮肉与薄宽面组成共享菜，传统上常用于待客。|Beshbarmak|传统吉尔吉斯餐馆|6|18
lagman|拉条子|Lagman|手拉面配肉和蔬菜，可选汤面或炒面。|Lagman (food)|奥什巴扎周边餐馆|4|10
manty|中亚蒸饺|Manti|较大的肉馅蒸饺，常有南瓜等季节馅料。|Manti (food)|市中心面食店|4|10
boorsok|炸面团|Boorsok|小块炸面团配茶或主餐，一份可多人分享。|Boortsog|传统餐馆|2|5
kurut|干酪球|Kurut|咸酸风干乳制品，质地较硬，适合少量品尝。|Kashk|奥什巴扎奶制品区|1|4''',
'''hyatt|Hyatt Regency Bishkek|https://www.hyatt.com/hyatt-regency/en-US/bishk-hyatt-regency-bishkek|150|320|靠近市中心公园与文化场馆的酒店。|Bishkek
orion|Orion Hotel Bishkek|https://www.orionbishkek.com/|120|260|市中心高端城市酒店。|Bishkek
novotel|Novotel Bishkek City Center|https://all.accor.com/hotel/A145/index.en.shtml|90|210|中心城区现代酒店，价格按日期核对。|Bishkek
plaza|Plaza Hotel Bishkek|https://plazahotel.kg/|60|150|市中心商务酒店。|Bishkek
garden|Garden Hotel Bishkek|https://gardenhotel.kg/|45|120|市区较经济的独立房选择，核对具体分店地址。|Bishkek''')

add(('damascus','大马士革','Damascus','SY','叙利亚','亚洲','SYP',33.5138,36.2765,'DAM','Damascus'),
'老城直街、清真寺、庭院和工艺市场积累了跨越千年的文化；此处保存文化资料，当前访问受局势影响。',
'当前不生成自动观光路线。老城巷道、场馆、城市道路和外籍准入均须在实际出行前独立确认。','https://whc.unesco.org/en/list/20/',
'''umayyad|倭马亚大清真寺|Umayyad Mosque|33.5118|36.3066|90|0|10|大型庭院与宗教建筑反映城市多层历史，服饰、礼拜和准入遵守现场规定。|Umayyad Mosque
azem|阿泽姆宫|Azm Palace|33.5102|36.3060|90|3|15|庭院、石材与室内木作体现奥斯曼时期住宅传统。|Azm Palace
museum|大马士革国家博物馆|National Museum of Damascus|33.5125|36.2898|120|5|20|考古收藏跨越多个文明，实际开放展区须另查。|National Museum of Damascus
khan|阿萨德帕夏商队旅馆|Khan As'ad Pasha|33.5082|36.3058|60|2|10|穹顶与中央庭院展示旧城商旅建筑，展览安排可能变化。|Khan As'ad Pasha
anania|圣亚拿尼亚教堂|House of Saint Ananias|33.5107|36.3178|60|0|5|老城基督教历史的一处宗教空间，参观须尊重礼拜与接待限制。|House of Saint Ananias''',
'''hamidiya|哈米迪亚集市工艺|Al-Hamidiyah Souq|33.5114|36.3028|90|0|0|culture|有顶街市连接传统工艺与旧城生活，当前营业和可达范围先确认。|Al-Hamidiyah Souq|https://whc.unesco.org/en/list/20/|manual
damask|大马士革织锦与镶嵌木作|Damascene craft traditions|33.5100|36.3100|120|10|40|craft|通过经授权的店铺或讲解认识织锦与木作纹样，不假设每天开放工坊。|Damask||manual
icecream|敲打冰淇淋文化|Booza ice cream tradition|33.5114|36.3028|45|2|8|food|认识乳香胶与兰茎粉带来的延展口感，只作为当地饮食文化资料。|Booza||manual''',
'''kibbeh|叙利亚肉馅谷物团|Kibbeh|碎麦外皮与肉馅可烤、炸或煮制，生肉版本需谨慎选择。|Kibbeh|传统叙利亚餐馆，营业先核实|4|12
fatteh|酸奶脆饼鹰嘴豆|Fatteh|鹰嘴豆、脆饼和酸奶酱分层，常作早餐。|Fatteh|老城早餐店，营业先核实|3|9
fattoush|脆饼蔬菜沙拉|Fattoush|蔬菜与烤脆面饼搭配酸味调料，口感清爽。|Fattoush|叙利亚餐馆，营业先核实|3|8
shawarma|沙瓦玛卷饼|Shawarma|旋转烤肉切片卷入面饼，酱料与肉类依店铺。|Shawarma|市区小食店，营业先核实|2|6
booza|大马士革弹性冰淇淋|Booza|乳香胶和兰茎粉形成独特弹性，常配开心果。|Booza|Al-Hamidiyah 甜品店，营业先核实|2|6''',
'''wali|Beit Al Wali Hotel|https://beitalwali.com/about-us/|90|230|旧城传统院落住宅组成的精品酒店。|Damascus
zaman|Beit Zaman Hotel|https://www.beit-zaman.com/about.php|80|210|直街与巴卜图马片区的院落酒店。|Damascus
damarose|Dama Rose Hotel|https://damarose.sy/|170|350|市中心大型接待酒店。|Dama Rose Hotel
mamlouka|Beit al-Mamlouka Hotel|https://en.wikipedia.org/wiki/Beit_al-Mamlouka_Hotel|80|200|旧城院落精品酒店资料。|Beit al-Mamlouka Hotel
cham|Cham Palace Damascus|https://en.wikipedia.org/wiki/Cham_Palaces_and_Hotels|90|240|大马士革城市酒店资料，现行品牌与接待须核实。|Cham Palaces and Hotels''')

add(('dushanbe','杜尚别','Dushanbe','TJ','塔吉克斯坦','亚洲','TJS',38.5598,68.7870,'DYU','Dushanbe'),
'林荫大道、诗人公园与中亚考古收藏让首都成为认识塔吉克文化的起点，茶馆和集市补上日常生活。',
'市中心分片步行结合出租车；希萨尔要塞需城外往返，山区行程另查道路、天气与许可。','https://traveltajikistan.tj/en/historical-and-cultural-tourism/',
'''national|塔吉克斯坦国家博物馆|National Museum of Tajikistan|38.5820|68.7849|150|3|12|自然、历史与现代文化展陈集中，适合初到城市建立认识。|National Museum of Tajikistan
antiquities|塔吉克国家古物博物馆|National Museum of Antiquities of Tajikistan|38.5658|68.7995|120|3|12|中亚考古与佛教遗存展示丝路交流。|National Museum of Antiquities of Tajikistan
rudaki|鲁达基公园|Rudaki Park|38.5764|68.7830|75|0|0|以诗人命名的公共园林，喷泉、林荫与雕像组成城市休息空间。|Rudaki Park
somoni|伊斯梅尔索莫尼纪念碑|Ismoil Somoni Monument|38.5730|68.7847|45|0|0|杜斯蒂广场上的国家历史象征，可与周边公园外观衔接。|Ismoil Somoni Monument
navruz|纳乌鲁兹宫|Kokhi Navruz|38.5851|68.7721|90|5|20|木雕、石作与镜面装饰体现当代对传统工艺的表达，需确认导览开放。|Kokhi Navruz''',
'''qurutob|库鲁托布共享餐桌|Qurutob shared meal|38.5700|68.8000|90|4|12|food|在专门餐馆认识面饼、乳酪汁与蔬菜组成的共享菜，分量可供多人。|Qurutob||auto
mehrgon|梅赫尔贡集市食材|Mehrgon Bazaar|38.5920|68.7980|90|0|0|culture|干果、烤馕与香料展示山地和绿洲饮食的联系。|Dushanbe|https://traveltajikistan.tj/en/|auto
hissar|希萨尔要塞与山谷历史|Hisor Fortress|38.4885|68.6190|150|10|40|culture|城外要塞及邻近历史建筑需车辆往返，不能当成市区顺路短停。|Hisor Fortress|https://traveltajikistan.tj/en/historical-and-cultural-tourism/|manual''',
'''qurutob|库鲁托布|Qurutob|酥面饼配乳酪汁、洋葱和蔬菜，传统上共享。|Qurutob|市区 qurutob 餐馆|3|9
osh|塔吉克抓饭|Oshi palav|米饭、肉与胡萝卜结合，可按个人份点单。|Pilaf|传统塔吉克餐馆|3|10
shurbo|羊肉蔬菜汤|Shurbo|肉与土豆、胡萝卜等蔬菜炖成汤，配面饼。|Shorba|市中心传统餐馆|3|9
sambusa|烤包子|Sambusa|面皮包肉或蔬菜烘烤，馅料按季节变化。|Samsa (food)|Mehrgon Bazaar 周边|1|4
non|塔吉克圆馕|Non|圆形压印烤饼常与汤和茶搭配。|Tandyr nan|市场与面包店|1|3''',
'''serena|Dushanbe Serena Hotel|https://www.serenahotels.com/dushanbe|120|280|鲁达基大道上的酒店，装饰融入地方工艺。|Dushanbe
hyatt|Hyatt Regency Dushanbe|https://www.hyatt.com/hyatt-regency/en-US/dushr-hyatt-regency-dushanbe|140|300|湖区附近的高端城市酒店。|Dushanbe
hilton|Hilton Dushanbe|https://www.hilton.com/en/hotels/dyuhihi-hilton-dushanbe/|120|270|机场与市区之间的商务酒店。|Dushanbe
rumi|Hotel Rumi Dushanbe|https://www.advantour.com/tajikistan/hotels/dushanbe.htm|65|160|市中心城市酒店，按独立房核价。|Dushanbe
atlas|Atlas Hotel Dushanbe|https://www.advantour.com/tajikistan/hotels/dushanbe.htm|60|150|带地方装饰特色的城市酒店。|Dushanbe''')

add(('dhaka','达卡','Dhaka','BD','孟加拉国','亚洲','BDT',23.8103,90.4125,'DAC','Dhaka'),
'莫卧儿古迹、河港与密集街巷构成达卡的鲜活面貌，织物、美食和新年艺术展现当地文化。',
'城区拥堵显著，老达卡与北部住宿区分日安排；地铁可覆盖部分路线，河港观察不等于可任意乘船。','https://www.beautifulbangladesh.gov.bd/index.php/loc/dhaka',
'''lalbagh|拉尔巴格堡|Lalbagh Fort|23.7188|90.3882|120|2|10|莫卧儿城堡遗存与庭院，适合早间避开炎热。|Lalbagh Fort
ahsan|阿赫桑曼济勒宫|Ahsan Manzil|23.7086|90.4060|90|2|10|河岸粉色宫殿博物馆介绍达卡纳瓦布家族历史。|Ahsan Manzil
national|孟加拉国家博物馆|Bangladesh National Museum|23.7373|90.3945|150|2|10|历史、自然与民族文化展陈，适合按兴趣选馆。|Bangladesh National Museum
star|星清真寺|Star Mosque|23.7154|90.4019|45|0|0|星形装饰和瓷片细节丰富，礼拜与参观空间须尊重。|Star Mosque
liberation|解放战争博物馆|Liberation War Museum|23.7758|90.3665|120|2|10|了解国家独立过程与个人历史，部分内容较沉重。|Liberation War Museum''',
'''sadarghat|萨达尔加特河港观察|Sadarghat riverfront|23.7045|90.4095|90|0|5|culture|从允许的公共岸边看轮船与河运生活，不将拥挤码头和任意渡船视为标准安全观光项目。|Port of Dhaka||manual
jamdani|贾姆达尼纱丽织造|Jamdani weaving|23.7310|90.5120|180|10|40|craft|预约索纳尔冈方向的织造村接待，了解手工提花与织物文化，另留城外交通。|Jamdani|https://ich.unesco.org/en/RL/traditional-art-of-jamdani-weaving-00879|manual
newyear|孟加拉新年艺术游行|Pahela Baishakh traditions|23.7348|90.3955|150|0|10|festival|看当年公开活动安排及艺术面具传统，人群、交通和安保条件须先确认。|Mangal Shobhajatra|https://ich.unesco.org/en/RL/mangal-shobhajatra-on-pahela-baishakh-01091|event''',
'''kacchi|卡奇比里亚尼|Kacchi biryani|腌肉与米饭同锅烹熟，香料浓郁，常在庆典和餐馆供应。|Biryani|Old Dhaka / Dhanmondi 餐馆|3|10
bhuna|布纳基丘里|Bhuna khichuri|米与豆和香料同煮，通常搭配肉或蛋。|Khichdi (dish)|孟加拉餐馆|3|9
fuchka|富奇卡脆球|Fuchka|中空脆球填豆类土豆并配酸甜汁，选择卫生条件好的店。|Panipuri|Dhanmondi 小食店|1|4
bhorta|孟加拉拌泥菜|Bhorta|鱼、蔬菜或豆类捣碎拌芥末油与辣椒，常配白饭。|Bhorta|传统孟加拉套餐餐馆|2|7
mishti|甜酸奶|Mishti doi|发酵甜奶制品常以陶杯供应，适合作餐后甜品。|Mishti doi|传统甜品店|1|4''',
'''intercontinental|InterContinental Dhaka|https://www.ihg.com/intercontinental/hotels/us/en/dhaka/dachb/hoteldetail|130|300|沙赫巴格一带的历史城市酒店。|InterContinental Dhaka
panpacific|Pan Pacific Sonargaon Dhaka|https://www.panpacific.com/en/hotels-and-resorts/pp-dhaka.html|110|270|卡尔万巴扎一带的大型城市酒店。|Pan Pacific Sonargaon
westin|The Westin Dhaka|https://www.marriott.com/en-us/hotels/dacwi-the-westin-dhaka/overview/|150|330|古尔山商务区的高层酒店。|The Westin Dhaka
meridien|Le Méridien Dhaka|https://www.marriott.com/en-us/hotels/dacmd-le-meridien-dhaka/overview/|150|330|机场大道附近酒店，前往老城需较长接驳。|Le Méridien Dhaka
sarina|Hotel Sarina Dhaka|https://www.sarinahotel.com/|65|160|巴纳尼商业区的城市酒店。|Dhaka''')

add(('pyongyang','平壤','Pyongyang','KP','朝鲜','亚洲','KPW',39.0392,125.7625,'FNJ','Pyongyang'),
'纪念性城市规划、地铁艺术与朝鲜饮食具有鲜明辨识度；收录不代表目前可入境或自由参观。',
'不得以自由行逻辑安排；国籍资格、入境、接待、住宿、交通和每处参观须由授权旅行社逐项确认，团费包含范围另核。','https://koryogroup.com/travel-guide',
'''juche|主体思想塔|Juche Tower|39.0177|125.7635|60|0|15|河岸纪念建筑与观景设施仅在获准行程中参观，不能保证可登塔。|Juche Tower
arch|凯旋门|Arch of Triumph|39.0443|125.7521|45|0|10|以纪念性尺度构成城市地标，外观与内部展望分开确认。|Arch of Triumph (Pyongyang)
kimilsung|金日成广场|Kim Il Sung Square|39.0194|125.7522|45|0|0|城市公共与仪式空间，通行和拍摄严格服从现场规则。|Kim Il Sung Square
victorious|祖国解放战争胜利纪念馆|Victorious Fatherland Liberation War Museum|39.0411|125.7403|120|0|20|在授权讲解中了解朝鲜官方的战争历史叙述，实际开放与拍照范围需确认。|Victorious Fatherland Liberation War Museum
moran|牡丹峰|Moranbong|39.0487|125.7589|90|0|10|丘陵公园与亭台构成城市绿地，不代表可脱离获准路线自行活动。|Moranbong''',
'''metro|平壤地铁艺术|Pyongyang Metro art|39.0445|125.7530|75|0|10|culture|获准情况下观察站厅壁画、吊灯与纪念艺术，不能保证全部车站开放参观。|Pyongyang Metro|https://koryogroup.com/travel-guide|manual
coldnoodles|平壤冷面文化|Pyongyang cold noodle culture|39.0300|125.7580|60|5|20|food|认识荞麦面与清冷汤汁的饮食传统；餐厅由授权接待确认，不能自行承诺预订。|Naengmyeon|https://koryogroup.com/travel-guide|manual
taedong|大同江岸城市观察|Taedong riverside culture|39.0240|125.7600|60|0|10|culture|从获准路线认识江岸城市空间，拍照、活动范围与是否允许步行必须逐项确认。|Taedong River|https://koryogroup.com/travel-guide|manual''',
'''naengmyeon|平壤冷面|Pyongyang naengmyeon|荞麦面配清冷汤汁，配料和汤底依接待餐馆。|Naengmyeon|授权接待安排的冷面餐馆|5|15
kimchi|朝鲜泡菜|Kimchi|发酵蔬菜常作为配菜，辣度与季节配方不同。|Kimchi|授权接待餐馆|1|5
mandu|朝鲜饺子|Mandu|面皮包肉菜馅，可蒸、煮或炸制。|Mandu|授权接待餐馆|4|12
jeon|朝鲜煎饼|Jeon|蔬菜、肉或海鲜裹面糊煎制，食材需确认。|Jeon (food)|授权接待餐馆|4|12
tteok|米糕|Tteok|蒸制或捶打的米糕有多种馅料，常用于节庆。|Tteok|授权接待安排的商店或餐馆|2|8''',
'''yanggakdo|Yanggakdo International Hotel|https://koryogroup.com/blog/pyongyang-hotels-guide-de02b24b-0bcb-4831-9c33-d38b40b9b81d|70|180|羊角岛上的接待酒店，必须由授权行程安排。|Yanggakdo International Hotel
koryo|Koryo Hotel|https://koryogroup.com/travel-guide/koryo-hotel-north-korea-travel-guide|80|200|车站附近双塔酒店，仅为获准接待参考。|Koryo Hotel
sosan|Sosan Hotel|https://koryogroup.com/travel-guide|50|140|体育街区域酒店，能否接待依获准行程。|Sosan Hotel
potonggang|Potonggang Hotel|https://koryogroup.com/travel-guide|70|180|普通江一带的接待酒店资料。|Potonggang Hotel
chongnyon|Chongnyon Hotel|https://koryogroup.com/travel-guide|50|140|青年酒店资料，入住需授权旅行社安排。|Chongnyon Hotel''',daily=[[60,110,180],[15,30,50],[10,25,60],[10,25,50]])

add(('sofia','索非亚','Sofia','BG','保加利亚','欧洲','EUR',42.6977,23.3219,'SOF','Sofia'),
'罗马遗迹、东正教教堂和维托沙山脚下的生活交织在紧凑市中心，市场、矿泉与音乐为探索增加细节。',
'市中心多数地点可步行和地铁串联；博雅纳教堂与维托沙山单独留接驳，机场地铁线路按航站楼确认。','https://www.visitsofia.bg/en/places-to-see/index.php',
'''nevsky|亚历山大涅夫斯基主教座堂|Alexander Nevsky Cathedral|42.6961|23.3320|75|0|10|金色穹顶与大尺度室内空间，地穴博物馆和摄影收费另核。|Alexander Nevsky Cathedral, Sofia
boyana|博雅纳教堂|Boyana Church|42.6447|23.2662|90|6|15|以中世纪壁画闻名，入内人数与时段有限，需单独往返。|Boyana Church
serdica|塞尔迪卡古城遗址|Ancient Serdica complex|42.6979|23.3224|75|0|10|现代城市中心下保留罗马街道和建筑遗存，室内展区可能另售票。|Serdica
george|圣乔治圆形教堂|Church of Saint George|42.6964|23.3227|45|0|5|庭院中的古代圆形建筑与壁画，礼拜时段尊重现场安排。|Church of Saint George, Sofia
archaeology|国家考古博物馆|National Archaeological Museum|42.6963|23.3248|120|5|15|色雷斯、罗马与中世纪收藏，适合按时代了解地区历史。|National Archaeological Museum (Bulgaria)''',
'''mineral|城市矿泉与中央浴场建筑|Sofia mineral springs|42.7000|23.3236|60|0|8|culture|观察矿泉水取水点和历史浴场建筑；建筑现作城市历史博物馆，不是公众泳池。|Sofia Central Mineral Baths|https://www.visitsofia.bg/en/places-to-see/index.php|auto
opera|索非亚歌剧芭蕾|Sofia Opera and Ballet|42.6993|23.3290|180|12|70|performance|按具体节目选择歌剧或芭蕾，演出日与语言字幕另核。|Sofia Opera and Ballet|https://www.operasofia.bg/en|event
market|女士市场食材与香料|Women's Market food culture|42.7043|23.3202|90|0|0|food|认识地方蔬果、奶酪与巴尔干香料，购买食物纳入日常餐饮预算。|Women's Market (Sofia)|https://www.visitsofia.bg/en/places-to-see/index.php|auto''',
'''banitsa|奶酪千层饼|Banitsa|薄面皮与白奶酪、鸡蛋烘烤，常作早餐。|Banitsa|市中心面包店|2|6
shopska|绍普斯卡沙拉|Shopska salad|番茄、黄瓜、椒类配白奶酪，适合餐前共享。|Shopska salad|保加利亚传统餐馆|4|10
tarator|酸奶黄瓜冷汤|Tarator|酸奶、黄瓜、莳萝与核桃组成夏季冷汤。|Tarator|传统餐馆|3|7
kebapche|巴尔干烤肉条|Kebapche|调味绞肉烤成条状，常搭配蔬菜和薯条。|Kebapche|市区烤肉餐馆|4|12
lyutenitsa|烤椒番茄酱|Lyutenitsa|烤红椒与番茄制成抹酱，可搭面包和烤肉。|Ljutenica|传统餐馆与市场|2|6''',
'''grand|Grand Hotel Sofia|https://www.grandhotelsofia.bg/|120|280|国家剧院与城市花园附近的酒店。|Grand Hotel Sofia
balkan|Sofia Balkan Palace|https://www.sofiabalkan.com/|100|240|塞尔迪卡遗址旁的纪念性建筑酒店。|Sofia Hotel Balkan
sense|Sense Hotel Sofia|https://sensehotel.com/en/index.html|140|320|沙皇解放者大道上的设计酒店。|Sofia
artotel|Art'Otel Sofia|https://www.artotel.bg/|70|170|维托沙大道附近历史建筑内的精品酒店。|Sofia
centralpark|Rosslyn Central Park Hotel Sofia|https://www.centralparkhotel.bg/|80|190|国家文化宫附近的城市酒店。|Sofia''')

EXTRA_SIGHTS = '''moscow|novodevichy|新圣女修道院|Novodevichy Convent|55.7262|37.5563|120|5|18|城西南的修道院与城防历史有关，宗教区域和展馆分别核对开放。|Novodevichy Convent
moscow|pushkin|普希金美术馆|Pushkin Museum|55.7472|37.6052|150|8|22|欧洲艺术与古代收藏可按展馆选择，不应与特列季亚科夫画廊混为同馆。|Pushkin Museum
saint-petersburg|summer|夏园|Summer Garden|59.9454|30.3356|90|0|0|规则园路、雕塑与河岸视线组成城市历史花园，季节维护可能限制部分入口。|Summer Garden
saint-petersburg|kazan|喀山主教座堂|Kazan Cathedral|59.9344|30.3248|60|0|5|柱廊面向涅瓦大街，是仍承担宗教活动的教堂。|Kazan Cathedral, Saint Petersburg
ulaanbaatar|national|蒙古国家博物馆|National Museum of Mongolia|47.9212|106.9146|120|5|15|民族服饰、历史文物与游牧生活展品适合初次认识蒙古。|National Museum of Mongolia
ulaanbaatar|zanabazar|扎那巴扎尔美术馆|Zanabazar Museum of Fine Arts|47.9204|106.9050|90|5|15|佛教造像、唐卡与蒙古美术体现地方艺术传统。|Zanabazar Museum of Fine Arts
almaty|instruments|民间乐器博物馆|Museum of Folk Musical Instruments|43.2589|76.9566|75|3|10|木建筑内展示冬不拉等民间乐器，与公园步行串联。|Kazakh Museum of Folk Musical Instruments
almaty|presidentpark|第一总统公园|First President's Park|43.1943|76.8849|90|0|0|南部城市公园可看天山背景，距离老城需另留车程。|First President's Park
riyadh|abdullahpark|阿卜杜拉国王公园|King Abdullah Park|24.6666|46.7375|90|2|10|草地和步道适合气温较低时停留，喷泉表演不保证每日举行。|King Abdullah Park
riyadh|faisaliyah|费萨利亚中心|Al Faisaliyah Centre|24.6902|46.6853|75|10|25|球形顶部是城市天际线标志，观景与餐厅消费分开确认。|Al Faisaliyah Centre
tehran|saadabad|萨阿德阿巴德宫殿群|Sa'dabad Complex|35.8170|51.4227|180|8|30|北部山麓的宫殿花园，多个馆区分别计票，不宜一概按单馆停留。|Sa'dabad Complex
tehran|niavaran|尼亚瓦兰宫|Niavaran Complex|35.8120|51.4720|120|6|25|宫殿、花园与近代王室生活展陈，当前开放与修复另核。|Niavaran Complex
lahore|jahangir|贾汉吉尔陵|Tomb of Jahangir|31.6225|74.3033|120|3|12|沙赫达拉花园陵墓以红砂岩与镶嵌装饰著称，跨河需另留交通。|Tomb of Jahangir
lahore|minar|巴基斯坦决议纪念塔|Minar-e-Pakistan|31.5925|74.3095|60|0|5|公园内的纪念塔关联建国历史，是否可登塔须确认。|Minar-e-Pakistan
yangon|botataung|波特涛塔|Botataung Pagoda|16.7682|96.1713|75|3|10|河岸附近的佛塔有不同于大金塔的参观空间，宗教礼仪仍须遵守。|Botataung Pagoda
yangon|stmary|圣玛丽主教座堂|Saint Mary's Cathedral|16.7798|96.1667|60|0|0|红砖哥特式教堂体现城市多宗教历史，礼拜时间以外再询问参观。|Saint Mary's Cathedral, Yangon
kabul|shamshira|沙赫杜沙姆希拉清真寺|Shah-Do Shamshira Mosque|34.5157|69.1697|45|0|0|河岸黄色外墙宗教建筑，仅在获准公共区域观察，不保证可入内。|Shah-Do Shamshira Mosque
kabul|rahman|阿卜杜勒拉赫曼清真寺|Abdul Rahman Mosque|34.5233|69.1736|60|0|0|大型城市清真寺，严格遵守准入、服饰与拍照规定。|Abdul Rahman Mosque
kyiv|michael|圣迈克尔金顶修道院|Saint Michael's Golden-Domed Monastery|50.4557|30.5225|75|0|5|重建的金顶建筑与纪念空间承载城市宗教和现代历史。|St. Michael's Golden-Domed Monastery
kyiv|volodymyr|弗拉基米尔山|Volodymyrska Hill|50.4560|30.5270|75|0|0|河岸山坡公园可认识城市地形，战时通行与警报安排须另核。|Volodymyrska Hill
ashgabat|neutrality|中立纪念碑|Neutrality Monument|37.8908|58.3060|60|0|15|城南纪念性建筑，观景设施与周边拍摄限制由接待方确认。|Neutrality Monument
ashgabat|earthquake|人民记忆纪念园|Halk Hakydasy Memorial Complex|37.9688|58.3020|90|0|15|纪念地震与战争的公共空间，讲解与展馆准入先核实。|Halk Hakydasy Memorial Complex
samarkand|afrasiab|阿夫罗西阿卜博物馆|Afrasiab Museum|39.6690|66.9930|90|3|12|粟特壁画与古城考古资料有助于认识帖木儿时代之前的撒马尔罕。|Afrasiab Museum of Samarkand
samarkand|khizr|哈兹拉特希兹尔清真寺|Hazrat Khizr Mosque|39.6650|66.9845|60|0|5|高地上的宗教建筑可看老城方向，尊重参拜和限制区域。|Hazrat Khizr Mosque
sanaa|saleh|萨利赫清真寺|Saleh Mosque|15.3253|44.2070|75|0|10|大型近代宗教建筑，仅作城市文化与建筑资料，当前入内条件不明。|Saleh Mosque
sanaa|bakiriyya|巴基里耶清真寺|Al-Bakiriyya Mosque|15.3551|44.2200|60|0|0|奥斯曼时期建筑展示萨那宗教空间的另一种形态，参观资格需确认。|Al-Bakiriyya Mosque
baghdad|kazimiyya|卡济米耶清真寺|Al-Kadhimiya Mosque|33.3807|44.3386|90|0|0|重要宗教圣地，衣着、安检与非穆斯林准入须向当地接待核实。|Al-Kadhimiya Mosque
baghdad|baghdadi|巴格达民俗博物馆|Baghdadi Museum|33.3382|44.3903|90|2|10|以传统生活场景呈现旧城职业与家庭日常，当前开放先核实。|Baghdadi Museum
muscat|qurum|库鲁姆海滩|Qurum Beach|23.6280|58.4717|120|0|0|公共沙滩适合晚些时候看海和休息，游泳需自行确认海况与允许区域。|Qurum
muscat|mirani|米拉尼堡|Al Mirani Fort|23.6171|58.5930|75|5|15|老马斯喀特港口堡垒，登高可见宫殿与海湾，台阶和开放时间需考虑。|Al-Mirani Fort
bucharest|cismigiu|西斯米久公园|Cișmigiu Gardens|44.4373|26.0906|90|0|0|湖泊、花坛与树荫适合在城市博物馆之间休息，划船另计且有季节性。|Cișmigiu Gardens
bucharest|antipa|安蒂帕自然历史博物馆|Grigore Antipa National Museum of Natural History|44.4530|26.0844|120|5|15|自然历史与生物多样性展品适合亲子和雨天活动。|Grigore Antipa National Museum of Natural History
minsk|holyspirit|圣灵主教座堂|Holy Spirit Cathedral|53.9050|27.5560|60|0|0|上城区宗教地标，内部礼拜与拍摄规则先询问。|Holy Spirit Cathedral, Minsk
minsk|victory|胜利广场|Victory Square, Minsk|53.9087|27.5750|45|0|0|独立大道上的战争纪念空间，适合结合城市轴线认识。|Victory Square, Minsk
bishkek|centralmosque|伊玛目萨拉赫西中央清真寺|Bishkek Central Mosque|42.8884|74.6112|60|0|0|大型奥斯曼风格清真寺，访问以礼拜、服饰和访客规定为准。|Bishkek Central Mosque
bishkek|philharmonic|吉尔吉斯国家爱乐乐团建筑|Kyrgyz National Philharmonic|42.8770|74.5875|45|0|0|托克托古尔命名的音乐厅外部与广场可观察城市音乐文化，演出另查场次。|Kyrgyz National Philharmonic
damascus|saladin|萨拉丁陵|Mausoleum of Saladin|33.5126|36.3067|45|0|5|清真寺附近的陵墓空间，遗产状态和准入需逐项核实。|Mausoleum of Saladin
damascus|citadel|大马士革城堡|Citadel of Damascus|33.5134|36.3011|90|3|15|旧城西北侧防御建筑，不能默认内部或修复区域开放。|Citadel of Damascus
dushanbe|yaqub|哈吉雅库布清真寺|Haji Yaqub Mosque|38.5853|68.7924|60|0|0|彩色瓷砖与宗教建筑群体现城市信仰生活，访客准入需询问。|Haji Yaqub Mosque
dushanbe|flagpole|杜尚别旗杆与湖畔公园|Dushanbe Flagpole|38.5789|68.7822|60|0|0|国家纪念轴线旁的公共空间，可与国家博物馆和鲁达基公园分段结合。|Dushanbe Flagpole
dhaka|dhakeshwari|达克什瓦里神庙|Dhakeshwari Temple|23.7230|90.3901|60|0|0|印度教寺庙是城市多元信仰的一部分，参访需尊重仪式和拍照规定。|Dhakeshwari Temple
dhaka|armenian|达卡亚美尼亚教堂|Armenian Church, Dhaka|23.7151|90.4010|60|0|5|旧城中保留商贸移民历史的教堂，需提前确认接待开放。|Armenian Church, Dhaka
pyongyang|party|建党纪念塔|Monument to Party Founding|39.0265|125.7741|45|0|10|纪念性城市建筑，仅在获准路线内参观并服从拍摄要求。|Monument to Party Founding
pyongyang|studyhouse|人民大学习堂|Grand People's Study House|39.0209|125.7510|75|0|15|大型公共学习建筑的参观必须列入获准接待行程，不保证室内开放。|Grand People's Study House
sofia|saintsofia|圣索菲亚教堂|Saint Sofia Church|42.6969|23.3310|60|0|10|早期基督教建筑与地下考古层，地下部分可能另售票。|Saint Sofia Church, Sofia
sofia|borisova|鲍里斯花园|Borisova gradina|42.6804|23.3377|90|0|0|城市林荫公园和湖边步道适合放松，季节游乐项目另计。|Borisova gradina'''

for line in EXTRA_SIGHTS.splitlines():
    cid,slug,name,english,lat,lng,minutes,low,high,desc,art=line.split('|')
    c=next(x for x in CITIES if x['id']==cid)
    lat,lng,minutes=float(lat),float(lng),int(minutes)
    remote=abs(lat-c['lat'])+abs(lng-c['lng'])>.25
    restricted='travelAdvisory' in c
    c['attractions'].append({'id':cid+'-'+slug,'name':name,'nameEn':english,'lat':lat,'lng':lng,
        'coordinateAccuracy':'approximate','coordinateNote':'地点近似位置，实际入口以现场与预约指引为准。',
        'durationHours':minutes/60,'durationRange':{'min':max(20,minutes//2),'recommended':minutes,'max':int(minutes*1.5)},
        'durationBasis':'editorial-estimate','category':'城市文化','activityType':'culture','description':desc,
        'article':art,'image':image(art),'priority':70,'visitRole':'optional','automaticPlanning':not(remote or restricted),
        'sourceUrl':wiki(art),'sourceCheckedAt':DAY,'sourceReferences':[ref(wiki(art))],
        'price':price(float(low),float(high),wiki(art)),
        'accessNote':c['travelAdvisory']['note'] if restricted else '推荐用时不含交通，先确认开放与预约。'})

# A UK nationality-specific advisory is not a declaration that local venues close.
# These entries have visitor information or documented public-space access.
MOSCOW_GUIDE='https://www.mos.ru/upload/documents/files/bbbe5cdf989015adf1172b035c8363e6/KartaMoskvinaanglyazike2025.pdf'
MINSK_GUIDE='https://www.visit-belarus.com/en/visit-minsk/'
VISITOR_SOURCES={
    'moscow-red-square':MOSCOW_GUIDE,
    'moscow-gorky':MOSCOW_GUIDE,
    'moscow-tretyakov':'https://www.tretyakovgallery.ru/en/',
    'moscow-kremlin':'https://vision.kreml.ru/en-Us/visit-to-kremlin/',
    'moscow-pushkin':'https://pushkinmuseum.art/?lang=en',
    'saint-petersburg-hermitage':'https://www.hermitagemuseum.org/visitus',
    'saint-petersburg-fortress':'https://www.spbmuseum.ru/themuseum/visitors/regis.php',
    'saint-petersburg-summer':'https://en.rusmuseum.ru/museums/summer-garden/',
    'saint-petersburg-russian-museum':'https://en.rusmuseum.ru/museums/mikhailovsky-palace/',
    'saint-petersburg-isaac':'https://cathedral.ru/en/visitors/time',
    'saint-petersburg-saviour':'https://cathedral.ru/en/visitors/time',
    'minsk-trinity':MINSK_GUIDE,
    'minsk-art':'https://artmuseum.by/en',
    'minsk-war':'https://www.warmuseum.by/en/',
    'minsk-victory':MINSK_GUIDE,
    'minsk-loshitsa':MINSK_GUIDE,
    'minsk-holyspirit':MINSK_GUIDE,
    'ex-minsk-river':MINSK_GUIDE,
}
for c in CITIES:
    if 'travelAdvisory' in c:
        c['travelAdvisory']['audience']='British nationals; other travellers should also consult their own government advice'
        if c['countryCode'] in ['RU','BY']:
            c['automaticPlanning']=True
            name=c['country']
            c['travelAdvisory']['note']=f'英国 FCDO 针对英国公民建议避免前往{name}；该建议不等于当地场馆关闭或所有国籍均被禁止入境。另核本国旅行建议、签证及交通；已核实有访客资料的场所可作为行程候选。'
            c['travelAdvisory']['noteEn']=f'The UK FCDO advises British nationals against all travel to {"Russia" if c["countryCode"]=="RU" else "Belarus"}. This is not a declaration of venue closure or an entry ban for all nationalities. Check advice applicable to you, entry and transport; places with visitor information remain itinerary candidates.'
    if c['id']=='bishkek':
        c['legacyIata']=['FRU']
        c['sourceReferences'].append(ref('https://www.iata.org/en/publications/directories/code-search/?airport.search=BSZ','现行比什凯克玛纳斯机场 IATA 为 BSZ；FRU 为历史代码'))
    if c['id']=='sanaa':
        c['officialTourismUrl']='https://whc.unesco.org/fr/list/385'
        c['sourceReferences']=[ref(c['officialTourismUrl'])]
    if c['id']=='pyongyang':
        c['officialTourismUrl']='https://koryogroup.com/blog/pyongyang-hotels-guide-de02b24b-0bcb-4831-9c33-d38b40b9b81d'
        c['sourceReferences']=[ref(c['officialTourismUrl'],'授权旅行商的接待酒店与城市文化资料；不确认目前可入境')]
        c['budgetBasis']['note']+=' 平壤费用只能作为获准团队方案的预留分项，不代表可独立购买；月租水电不是可供外国游客直接签约的市场报价。'
    for p in c['attractions']:
        if c['countryCode'] in ['RU','BY']:
            p['accessNote']='当前条目的开放条件尚待逐项复核，可先作为手动候选；国家旅行建议与场馆实际开放分别查看。'
        if p['id'] in VISITOR_SOURCES:
            p['automaticPlanning']=True
            p['sourceReferences'].append(ref(VISITOR_SOURCES[p['id']],'公开访客资料或公共空间说明；预约、临时关闭和实际入境仍须另核'))
            p['accessNote']='按场馆访客规则及所选日期确认预约与开放；国家旅行建议另见城市提示。'

# Do not present a city, ingredient or broad cuisine photograph as a precise item.
for c in CITIES:
    for p in c['attractions']:
        if p['article'] in ['Muttrah','Qurum']:
            p['imageScope']='nearby'
            p['imageContextNote']='展示所在片区的真实环境，并非该条目具体入口或设施。'
for e in EXPERIENCES:
    c=next(c for c in CITIES if c['id']==e['cityId'])
    if e['kind']=='hotel' and (e['article']==c['article'] or e['article']=='Cham Palaces and Hotels'):
        e['article']=''
        e['image']={'url':'','sourceUrl':e['sourceUrl']}
        e['imageScope']='nearby'
        e['imageContextNote']='尚无已确认的酒店物业照片，不以集团或其他酒店代替。'
    if e['id']=='hotel-riyadh-four-seasons':
        e['imageScope']='nearby'
        e['imageContextNote']='王国中心大楼外观，酒店位于楼内；不是所订客房或酒店设施照片。'
    if e['article']==c['article'] or 'cuisine' in e['article'].lower() or e['article'] in ['Gulf of Oman','Rivers and canals in Saint Petersburg','Taedong River','Svislach']:
        e['imageScope']='nearby'
        e['imageContextNote']='展示相关地区或文化环境，不是特定商家、场次或所订服务的照片。'
    if e['id'] in VISITOR_SOURCES:
        e['automaticPlanning']=True
        e['sourceReferences'].append(ref(VISITOR_SOURCES[e['id']],'公共空间的城市文化资料，现场通行规则另核'))
    if e['cityId'] in ['moscow','saint-petersburg','minsk']:
        e['availabilityNote']='选择条目不代表已预约；查看场次、服务范围与适用于本人的旅行建议。'
    if e['kind']=='experience':
        festival_months={'ex-ulaanbaatar-naadam':[7],'ex-tehran-nowruz':[3,4],'ex-yangon-thingyan':[4],'ex-dhaka-newyear':[4],'ex-riyadh-season':[],'ex-lahore-festival':[],'ex-samarkand-music':[]}
        if e['id'] in festival_months:
            e['seasonality']['months']=festival_months[e['id']]
    if e['cityId']=='pyongyang' and e['sourceUrl']=='https://koryogroup.com/travel-guide':
        e['sourceUrl']='https://koryogroup.com/blog/pyongyang-hotels-guide-de02b24b-0bcb-4831-9c33-d38b40b9b81d'
        e['bookingUrl']=e['sourceUrl']
        e['sourceReferences']=[ref(e['sourceUrl'],'授权旅行商的城市接待背景，不确认各项活动目前获准或开放')]
for f in FOODS:
    if f['id']=='food-yangon-mont':
        f['photoStatus']='needs-food-photo'
        f['articleScope']='regional-context'
        f['sourceReferences'].append(ref('https://mdn.gov.mm/en/traditional-myanmar-cuisine-3','Mont Let Saung 米粉冻在缅甸椰奶甜品中的用法'))
    if f['id']=='food-pyongyang-mandu':
        f['article']='Mandu (food)'
        f['sourceUrl']=wiki(f['article'])
        f['price']['sourceUrl']=f['sourceUrl']
        f['sourceReferences']=[ref(f['sourceUrl'],'朝鲜饺子的菜品身份及制作方式')]
        f['image']=image(f['article'])
    if f['id']=='food-muscat-shuwa':
        f['article']='Omani cuisine'
        f['sourceUrl']=wiki(f['article'])
        f['price']['sourceUrl']=f['sourceUrl']
        f['sourceReferences']=[ref(f['sourceUrl'],'阿曼饮食文化背景，不能用区域菜系配图冒充 Shuwa 成品')]
    if f['article'] in ['Omani cuisine','Khubz','European smelt','Doughnut','List of Burmese dishes']:
        f['photoStatus']='needs-food-photo'
        f['articleScope']='regional-context'
        f['image']={'url':'','sourceUrl':f['sourceUrl']}

FOOD_CONTEXT={
    'moscow':'https://en.wikipedia.org/wiki/Russian_cuisine',
    'saint-petersburg':'https://en.wikipedia.org/wiki/Russian_cuisine',
    'ulaanbaatar':'https://en.wikipedia.org/wiki/Mongolian_cuisine',
    'almaty':'https://en.wikipedia.org/wiki/Kazakh_cuisine',
    'riyadh':'https://en.wikipedia.org/wiki/Saudi_Arabian_cuisine',
    'tehran':'https://en.wikipedia.org/wiki/Persian_cuisine',
    'lahore':'https://en.wikipedia.org/wiki/Pakistani_cuisine',
    'yangon':'https://en.wikipedia.org/wiki/Burmese_cuisine',
    'kabul':'https://en.wikipedia.org/wiki/Afghan_cuisine',
    'samarkand':'https://uzbekistan.travel/en/v/food-tourism/',
    'bucharest':'https://romaniatourism.com/romanian-food-wine.html',
    'minsk':'https://en.wikipedia.org/wiki/Belarusian_cuisine',
}
for f in FOODS:
    for cid in f['cityIds']:
        if cid in FOOD_CONTEXT:
            f['sourceReferences'].append(ref(FOOD_CONTEXT[cid],'地区饮食文化交叉参考；具体菜品的门店、供应与价格未逐家核验'))

# Entity review dates must match an actually read primary reference, not the
# generation date. Editorial price estimates deliberately retain checkedAt:null.
for item in CITIES+[a for c in CITIES for a in c['attractions']]+EXPERIENCES+FOODS:
    item['imagePolicy']='photograph-only'
    reviewed=any(r.get('checkedAt')==DAY for r in item.get('sourceReferences',[]))
    for key in ['checkedAt','sourceCheckedAt']:
        if key in item:
            item[key]=DAY if reviewed else None
    if not reviewed:
        item['verificationStatus']='unverified'

assert len(CITIES)==23
assert all(len(c['attractions'])==7 for c in CITIES)
assert len({c['countryCode'] for c in CITIES})==22
assert len({x['id'] for x in EXPERIENCES})==len(EXPERIENCES)
assert all(' ' not in a['id'] for c in CITIES for a in c['attractions'])
write_pack()
