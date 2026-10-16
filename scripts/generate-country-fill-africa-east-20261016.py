"""Reproducible, editorial country coverage pack; prices are USD planning estimates.

Checked destination references: 2026-10-16. Source scope is deliberately narrower
than a live opening-hours, hotel availability or tariff verification.
"""
import json
import re
from pathlib import Path
from urllib.parse import quote, urlparse

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-10-16'
PACK = 'country-fill-africa-east-20261016'
CITIES, EXPERIENCES, FOODS = [], [], []
NOTE = '美元规划估算，非实时报价；不代表市场最低和最高价。实际日期、税费、票种与包含服务须向经营者核对。'
SOURCES = {
 'port-sudan': 'https://whc.unesco.org/en/list/262',
 'addis-ababa': 'https://visitethiopia.travel/downloads/AU_2025%20Brochure_English.pdf',
 'windhoek': 'https://www.windhoekcc.org.na/independence-memorial-museum/',
 'maputo': 'https://www.visitmozambique.gov.mz/onde-ir/provincias/maputo/',
 'livingstone': 'https://www.zambiatourism.com/activities/livingstone/',
 'juba': 'https://strapi.eacgermany.org/uploads/e_Catalogue_23_24_61b590223e.pdf',
 'maun': 'https://botswanatourism.co.bw/explore/maun',
 'antananarivo': 'https://madagascar-tourisme.com/fr/destination/antananarivo/',
 'mogadishu': 'https://www.somalia.gov.so/about-somalia/tourism',
 'victoria-falls': 'https://zimbabwetourism.net/portfolios/victoria-falls/',
 'kampala': 'https://utb.go.ug/matt-b-donates-grammy-awards-to-uganda/',
 'accra': 'https://visitghana.com/attractions/greater-accra-region/',
 'tunis': 'https://discovertunisia.com/en/discover/around-tunis',
 'asmara': 'https://whc.unesco.org/en/list/1550',
 'lilongwe': 'https://www.malawitourism.com/regions/central-malawi/lilongwe/',
 'la-paz': 'https://lapaz.bo/turismo/mallasa-valle-de-la-luna/',
 'asuncion': 'https://visitparaguay.travel/city/asuncion',
 'georgetown': 'https://guyanatourism.com/georgetown-city-tour/',
 'paramaribo': 'https://suriname.travel/paramaribo/',
 'montevideo': 'https://www.descubrimontevideo.uy/casco-historico',
 'caracas': 'https://whc.unesco.org/en/list/986',
}
ADVISORIES = {
 'port-sudan': ('sudan','avoid-all-travel','FCDO建议避免前往苏丹港所在地区。此页保留红海与城市文化资料，场馆、住宿及活动是否运营均需重新确认，不自动生成休闲行程。','FCDO advises against all travel to this area. This is a cultural reference entry; current access and operations are unconfirmed.'),
 'juba': ('south-sudan','avoid-all-travel','FCDO建议避免前往南苏丹。此页为城市文化资料，交通、住宿和参观均需专业机构重新核实，不自动生成休闲行程。','FCDO advises against all travel to South Sudan. Transport, accommodation and access require specialist confirmation.'),
 'mogadishu': ('somalia','avoid-all-travel','FCDO建议避免前往摩加迪沙。此页用于了解当地文化，不代表旅游活动可安全开展；所有地点与经营状态需重新核实。','FCDO advises against all travel to Mogadishu. Cultural listings do not establish safe access or current operations.'),
 'caracas': ('venezuela','restricted','FCDO建议非必要不前往加拉加斯所在地区。请先核实入境、航班及场馆状态，此页项目不自动加入行程。','FCDO advises against all but essential travel to this area. Check entry, flights and venue access before considering a visit.'),
 'asmara': ('eritrea/safety-and-security','restricted','离开阿斯马拉通常需办理旅行许可；摄影、宗教场所和建筑内部访问可能受限制。请按官方建议与当地许可安排。','Travel outside Asmara generally requires a permit. Photography and access to religious or other buildings may be restricted.'),
}

def wiki(article):
    return 'https://en.wikipedia.org/wiki/' + quote(article.replace(' ', '_'), safe='')

def slug(value):
    return re.sub(r'[^a-z0-9]+','-',value.lower()).strip('-')

def ref(url, scope, kind='primary-source', checked=DATE):
    return {'name':urlparse(url).netloc,'url':url,'kind':kind,'scope':scope,'checkedAt':checked,
      'verificationStatus':'unverified' if checked is None else 'scope-checked'}

def price(lo, hi, url, unit=None):
    p={'low':lo,'high':hi,'currency':'USD','type':'estimate','sourceUrl':url,'checkedAt':None,'note':NOTE}
    if unit:p['unit']=unit
    return p

def lines(value):
    return [x.split('|') for x in value.strip().splitlines() if x.strip()]

def add(meta, sights, experiences, foods, hotels):
    cid, name, en, code, country, local, lat, lng, iata, days, tagline, transport = meta
    source=SOURCES[cid]
    unsafe=cid in {'port-sudan','juba','mogadishu','caracas'}
    lodging=[35,90,230] if code not in {'GY','SS','SO','BW','NA','UY'} else [65,155,340]
    city={'id':cid,'name':name,'nameEn':en,'countryCode':code,'country':country,
      'region':'美洲' if code in {'BO','PY','GY','SR','UY','VE'} else '非洲',
      'continent':'SA' if code in {'BO','PY','GY','SR','UY','VE'} else 'AF',
      'currency':'USD','localCurrency':local,'lat':lat,'lng':lng,'iata':iata,'article':en,
      'aliases':[name,en], 'contentTier':'standard','tierReason':'国家覆盖与地方文化补充',
      'image':{'url':'','sourceUrl':wiki(en)}, 'tagline':tagline,'description':tagline,
      'tags':['地方文化','城市生活','特色饮食'],
      'daily':{'lodging':lodging,'food':[12,30,65],'transport':[7,22,65],'misc':[5,12,30]},
      'monthly':{'rent':[400,850,1800],'utilities':[65,130,250]},
      'budgetBasis':{'type':'editorial-estimate','updatedAt':DATE,
       'note':f'以美元USD作为跨城市预算基准；当地货币为{local}，并非把当地金额标作美元。住宿按每间每晚，餐饮交通杂项按每成人每天；月租与水电为每间每月的粗略预留。'+NOTE},
      'planningProfile':'balanced','automaticPlanning':not unsafe,
      'tripDuration':{'min':max(1,days-1),'days':days,'max':days+2,'reason':transport},
      'transportNote':transport,'attractions':[],
      'officialTourismUrl':source,
      'sourceReferences':[ref(source,'城市、地方文化或指定遗产背景；不核验所有商户、实时开放、预算或活动库存。')],
      'guide':{'cityId':cid,'intro':tagline,'transportNote':transport,'foodNotes':[],'neighborhoods':[]}}
    if cid in ADVISORIES:
      path,level,note,note_en=ADVISORIES[cid]
      city['travelAdvisory']={'url':'https://www.gov.uk/foreign-travel-advice/'+path,'level':level,'note':note,'noteEn':note_en,'checkedAt':DATE,'publisher':'UK FCDO'}
    for i,row in enumerate(lines(sights)):
      title,title_en,article,alat,alng,minutes,lo,hi,desc=row
      mins=int(minutes)
      item={'id':cid+'-'+slug(title_en),'name':title,'nameEn':title_en,
        'lat':float(alat),'lng':float(alng),'coordinateAccuracy':'approximate',
        'coordinateNote':'近似位置用于行程距离估算；实际入口与允许通行区域须核对。',
        'durationHours':mins/60,'durationRange':{'min':max(15,mins//2),'recommended':mins,'max':round(mins*1.5)},
        'durationBasis':'editorial-estimate','category':'城市与文化','activityType':'culture',
        'description':desc+(' 仅作文化资料，目前不确认开放或可达。' if unsafe else ''),
        'article':article,'image':{'url':'','sourceUrl':wiki(article)},
        'priority':90-i*5,'visitRole':'essential' if i<3 else 'optional','automaticPlanning':not unsafe,
        'features':['地方特色','可调整游览时长'],'bestTime':'出发前核对开放、预约、天气与当地通行安排。',
        'sourceUrl':wiki(article),'sourceCheckedAt':None,
        'sourceReferences':[ref(wiki(article),'地点身份与图片检索线索；百科页面不代表本次逐项核验即时开放。','encyclopedia-reference',None),ref(source,'城市或遗产主题背景，非该项目实时服务核验。')],
        'price':price(float(lo),float(hi),source)}
      city['attractions'].append(item)
    CITIES.append(city)
    for row in lines(experiences):
      title,title_en,article,elat,elng,minutes,lo,hi,etype,desc=row
      EXPERIENCES.append({'id':'ex-'+cid+'-'+slug(title_en),'cityId':cid,'kind':'experience',
        'name':title,'nameEn':title_en,'provider':'当地运营者，预订前确认','address':en,
        'lat':float(elat),'lng':float(elng),'coordinateAccuracy':'approximate',
        'coordinateNote':'体验片区近似位置；实际集合点向经营者确认。','durationMinutes':int(minutes),
        'description':desc+(' 仅作文化资料，不确认当前可开展。' if unsafe else ''),
        'tagline':title,'experienceType':etype,'features':[title],
        'requirements':['活动日期、许可、人员资质、集合点与包含服务需要单独确认。'],
        'automaticPlanning':False,'sourceUrl':source,'bookingUrl':source,'checkedAt':DATE,
        'sourceReferences':[ref(source,'区域文化或旅游主题背景；活动建议为编辑设计，未核验特定经营者档期。')],
        'article':article,'image':{'url':'','sourceUrl':wiki(article)},
        'availabilityNote':'按需选择的体验；预算不含往返交通，季节性活动不保证每天可参加。',
        'priceOptions':[{'id':'activity-budget','name':'体验规划预算',**price(float(lo),float(hi),source,'person'),
          'includes':['说明中的体验预算'],'excludes':['城外接驳','未列明的装备、餐饮与保险']}]})
    for row in lines(foods):
      title,local_name,article,lo,hi,where,desc=row
      food_url=wiki(article)
      FOODS.append({'id':'food-'+cid+'-'+slug(local_name),'cityIds':[cid],'name':title,'nameEn':local_name,
        'localName':local_name,'description':desc,'article':article,'articleScope':'dish',
        'image':{'url':'','sourceUrl':food_url},'sourceUrl':food_url,'sourceCheckedAt':None,
        'sourceReferences':[ref(food_url,'菜品名称、食材与主题图片线索；未核验具体餐馆当日菜单。','encyclopedia-reference',None)],
        'sourceScope':'regional-food-context','sourceStatus':'editorial-reference','catalogOrigin':'maintained-definition',
        'price':price(float(lo),float(hi),food_url,'serving'),
        'servingNote':'按单份或一人份规划；计入日常餐费，不额外叠加成门票。',
        'whereByCity':{cid:[{'name':where,'kind':'area','sourceUrl':'https://www.google.com/maps/search/?api=1&query='+quote(en+' '+where+' '+local_name),
          'note':'餐饮检索区域，具体商家是否供应及当日价格请查看菜单。'}]}})
    for row in lines(hotels):
      hotel,zone,lo,hi,url,desc=row
      EXPERIENCES.append({'id':'ex-'+cid+'-'+slug(hotel),'cityId':cid,'kind':'hotel','name':hotel,'nameEn':hotel,
        'provider':hotel,'address':zone+', '+en,'durationMinutes':0,
        'description':desc+(' 当前营业和接待条件未经确认。' if unsafe else ''),
        'tagline':zone,'features':[zone,'按日期查询房型'],'automaticPlanning':False,
        'sourceUrl':url,'bookingUrl':url,'sourceCheckedAt':None,
        'sourceReferences':[ref(url,'酒店身份与预订查询入口；本轮不确认房态、所有设施或房价。','operator-or-listing-reference',None)],
        'image':{'url':'','sourceUrl':url,'pendingReason':'需取得该酒店真实照片；禁止以城市照片冒充商户。'},
        'requirements':['核对实际营业、房型人数、税费、接送与取消条款。'],
        'availabilityNote':'酒店检索候选，不表示当前房型可订或所示区间为商户报价。',
        'priceOptions':[{'id':'room-budget','name':'每间每晚规划预算',**price(float(lo),float(hi),url,'room-night'),
          'includes':['一间基础客房一晚的编辑预算'],'excludes':['早餐、税费、加床和接送，除非所订房价明确包含']}]})

add(('port-sudan','苏丹港','Port Sudan','SD','苏丹','SDG',19.6158,37.2164,'PZU',3,
 '红海港城承载贝贾文化、珊瑚海域与跨海贸易历史；这里先作为文化目的地资料收录。',
 '不自动安排市内或海上交通；当地冲突、港口及机场状态需依官方建议逐次确认。'),
 '''苏丹港滨海地带|Port Sudan waterfront|Port Sudan|19.615|37.222|60|0|0|港湾与滨海街道体现城市依海而生的格局，不进入港口作业区。
萨瓦金珊瑚古港|Suakin old port|Suakin|19.105|37.335|120|5|20|苏丹港以南约60公里的历史港口，珊瑚石建筑讲述红海贸易与朝觐交通历史。
桑加奈布海洋国家公园|Sanganeb Marine National Park|Sanganeb|19.74|37.44|360|150|400|离岸珊瑚礁与灯塔构成海洋遗产，船程、许可和潜水条件均必须独立确认。
栋戈纳卜湾|Dungonab Bay|Dungonab Bay|21.08|37.13|480|150|400|北部海湾与海草床具有重要生态价值，离市区较远，不能作为市内短暂停留点。
苏丹港市场街区|Port Sudan market quarter|Port Sudan|19.612|37.214|60|0|0|通过粮食、香料与日用摊位认识港城生活；不将市场当作未经许可的摄影场地。''',
 '''贝贾咖啡与姜香待客文化|Beja coffee traditions|Jebena|19.615|37.216|60|4|12|food|认识用小壶冲煮咖啡、添加姜香的待客方式，只有在主人邀请和条件允许时参与。
红海珊瑚生态解说|Red Sea reef interpretation|Sanganeb|19.74|37.44|90|10|35|nature|以桑加奈布珊瑚、海草床和海洋保护为主题，可选择岸上讲解，不默认安排下水。
萨瓦金港口建筑解读|Suakin coral architecture|Suakin|19.105|37.335|120|20|60|culture|围绕珊瑚石屋、通风窗与红海商贸讲述港口历史，遗址进入条件须先确认。''',
 '''苏丹蚕豆泥|Ful medames|Ful medames|2|6|市区早餐铺|炖软蚕豆配油、调味与面包，是可按一份早餐预算的日常食物。
基斯拉薄饼|Kisra|Kisra|2|5|苏丹家常菜餐馆|用高粱等谷物发酵成薄饼，通常搭配炖菜食用，份量随餐馆组合变化。
阿西达谷物团|Asida|Asida|3|8|苏丹家常菜餐馆|谷物粉煮成较稠的主食，搭配咸味酱汁或炖菜，询问当天做法。
苏丹烤肉|Agashe|Agashe|4|12|市区烧烤餐馆|花生与香料调味的烤肉传统，点餐时确认肉类、辣度与配菜。
洛神花茶|Karkade|Hibiscus tea|1|4|茶铺与酒店餐厅|洛神花泡成酸甜饮品，可冷饮或热饮，糖量能够另行调整。''',
 '''Baasher Palace Hotel|Cornish Street|60|150|https://www.tripadvisor.co.uk/Hotel_Review-g677545-d1438485-Reviews-Baasher_Palace_Hotel-Port_Sudan_Red_Sea_State.html|滨海街附近的历史住宿名录，不能据既有名录推断当前营业。
Coral Port Sudan Hotel|港区周边|100|240|https://www.tripadvisor.com/Hotels-g677545-Port_Sudan_Red_Sea_State-Hotels.html|靠近海港的酒店候选，需重新核对实际接待情况。
Basiri Plaza Hotel|市中心|70|180|https://www.tripadvisor.com/Hotels-g677545-Port_Sudan_Red_Sea_State-Hotels.html|市区酒店名录候选，预算仅用来比较基础住宿支出。
Mirak Hotel Suites|Marine Command Road|80|200|https://www.tripadvisor.com/Hotels-g677545-Port_Sudan_Red_Sea_State-Hotels.html|套房型住宿候选；厨房、长住与接送等具体服务须直接询问。
Grand Hotel Elsahil|Transeet|50|150|https://www.tripadvisor.com/Hotels-g677545-Port_Sudan_Red_Sea_State-Hotels.html|港城住宿目录中的候选，当前房态与运营状态尚未确认。''')

add(('addis-ababa','亚的斯亚贝巴','Addis Ababa','ET','埃塞俄比亚','ETB',9.03,38.74,'ADD',3,
 '高原首都把人类起源展陈、咖啡仪式、教堂艺术和现代公园连接起来。',
 '市内使用预约车辆或出租车连接各片区；海拔较高，首日放缓，恩托托山单独留半天，机场往返另计。'),
 '''埃塞俄比亚国家博物馆|National Museum of Ethiopia|National Museum of Ethiopia|9.038|38.761|120|5|20|从古人类化石与考古展陈认识埃塞俄比亚，具体展厅与文物展出依现场安排。
圣三一大教堂|Holy Trinity Cathedral|Holy Trinity Cathedral (Addis Ababa)|9.03|38.761|75|5|15|彩绘玻璃、宗教艺术与纪念空间交织，礼拜时段遵循教堂参观要求。
恩托托山|Mount Entoto|Mount Entoto|9.082|38.758|180|5|25|高地林木与观景空间适合避开市区喧闹，步行强度应考虑海拔。
亚的斯梅尔卡托市场|Addis Mercato|Addis Mercato|9.033|38.738|90|0|0|按香料、咖啡与日用品分区理解商业网络，建议白天由熟悉街区者带领。
统一公园|Unity Park|Unity Park|9.024|38.764|180|15|60|宫苑历史与公共园区结合的参观点，票种、证件与可进入区域需提前核对。''',
 '''埃塞俄比亚咖啡仪式|Ethiopian coffee ceremony|Coffee ceremony|9.03|38.75|75|5|18|food|从烘豆、研磨到陶壶煮制，理解咖啡在待客中的节奏；选择明确包含讲解的体验。
传统音乐与肩舞晚餐|Eskista music evening|Eskista|8.995|38.787|120|20|55|culture|观察以肩部动作见长的舞蹈与现场音乐，节目时间和餐食是否包含要先确认。
梅斯克尔篝火节|Meskel festival|Meskel|9.01|38.762|180|0|20|festival|宗教节日有特定日期与礼仪，围绕梅斯克尔广场等活动区域安排，不能按普通日常演出预订。''',
 '''英吉拉酸面饼|Injera|Injera|3|8|Bole与Piazza埃塞餐馆|发酵面糊做成多孔酸面饼，常作为炖菜拼盘的底与取食工具。
多罗瓦特鸡肉炖菜|Doro wat|Doro wat|6|16|传统埃塞俄比亚餐馆|洋葱、香料与鸡肉慢炖，常配鸡蛋和英吉拉，辣度可先询问。
希罗豆粉炖菜|Shiro|Shiro (food)|3|9|素食与斋期菜餐馆|鹰嘴豆或豆类粉煮成浓稠酱汁，是常见的植物性餐食选择。
提布斯炒肉|Tibs|Ethiopian cuisine|5|15|Bole传统餐馆|肉块与洋葱等食材快炒，有不同辣度与油脂比例，点单时确认肉种。
埃塞咖啡|Buna|Coffee ceremony|1|5|Piazza咖啡店|浓香的小杯咖啡适合搭配短暂停留，完整咖啡仪式另需安排时长。''',
 '''Sheraton Addis|Taitu Street|220|500|https://www.marriott.com/en-us/hotels/addlc-sheraton-addis-a-luxury-collection-hotel-addis-ababa/overview/|市中心花园式高端酒店，适合希望把休息空间纳入住宿选择的人。
Hyatt Regency Addis Ababa|Meskel Square|150|320|https://www.hyatt.com/hyatt-regency/en-US/addra-hyatt-regency-addis-ababa|梅斯克尔广场附近的现代酒店，可作为公园与市中心参访的交通起点。
Hilton Addis Ababa|Menelik II Avenue|110|260|https://www.hilton.com/en/hotels/addhitw-hilton-addis-ababa/|首都中心长期经营的国际酒店，房型与公共设施使用条件按预订核对。
Radisson Blu Hotel Addis Ababa|Kazanchis|110|250|https://www.radissonhotels.com/en-us/hotels/radisson-blu-addis-ababa|Kazanchis区域的商务酒店，适合用车辆连接不同博物馆片区。
Ethiopian Skylight Hotel|Bole|120|300|https://www.ethiopianskylighthotel.com/|机场附近大型酒店，适合晚到早走或需衔接国内航段的住宿安排。''')

add(('windhoek','温得和克','Windhoek','NA','纳米比亚','NAD',-22.56,17.083,'WDH',2,
 '从独立历史、当代工艺到卡图图拉的街头烤肉，认识纳米比亚首都不同的生活层次。',
 '核心地标可短程步行；卡图图拉与近郊保护区使用车辆连接，国际机场在城外，另留接驳时间。'),
 '''独立纪念博物馆|Independence Memorial Museum|Independence Memorial Museum (Namibia)|-22.568|17.089|100|0|10|展陈聚焦反殖民与独立历程，适合先建立历史背景再去其他城区。
基督教堂|Christ Church Windhoek|Christ Church, Windhoek|-22.568|17.089|40|0|5|砂岩教堂与周边公共建筑呈现殖民时期城市空间，内部参观依开放安排。
议会花园|Parliament Gardens|Parliament Gardens|-22.565|17.09|45|0|0|在绿地与公共建筑之间短暂停留，不进入政府办公和限制区域。
纳米比亚国家美术馆|National Art Gallery of Namibia|National Art Gallery of Namibia|-22.562|17.087|90|0|10|关注纳米比亚当代创作与轮换展览，开馆时间和展览应提前查看。
丹维尔容保护区|Daan Viljoen Game Reserve|Daan Viljoen Game Reserve|-22.534|16.976|240|10|35|城市以西的自然保护区适合步道与观鸟，车辆与门票分别预算。''',
 '''卡图图拉Kapana烤肉市场|Katutura kapana tasting|Kapana|-22.524|17.061|90|8|25|food|以市场食摊为入口了解现切现烤的牛肉吃法，优先由当地讲解者带领并征求拍照同意。
纳米比亚工艺中心挑选手作|Namibia Craft Centre visit|Windhoek|-22.573|17.085|90|0|25|culture|浏览纺织、编篮与工艺品，和制作者或店员了解材料，购物金额由自己控制。
城市边缘观鸟与自然解说|Highland birding walk|Daan Viljoen Game Reserve|-22.534|16.976|180|30|80|nature|在允许步行的区域由向导辨识高地鸟类，保持距离，不喂食野生动物。''',
 '''卡帕纳烤肉|Kapana|Kapana|3|10|Katutura Single Quarters市场|现烤肉块搭配辣椒、盐与洋葱番茄调味，是市场常见的共享小食。
比尔通风干肉|Biltong|Biltong|3|10|市区熟食与肉铺|香料腌制后风干的肉食，口感和干度各异，注意出入境携带限制。
奥希芬玛谷物主食|Oshifima|Ugali|3|8|纳米比亚家常菜餐馆|用珍珠粟或玉米粉煮成的主食，通常与蔬菜或炖肉一起食用。
南部非洲烧烤|Braai|Regional variations of barbecue|10|28|Klein Windhoek餐馆|以炭火烤肉、香肠和配菜组成一餐，按具体拼盘份量比较预算。
油炸面包球|Vetkoek|Vetkoek|1|4|街头小吃与咖啡店|外层金黄、内里柔软的面团，可原味吃或夹咸馅，适合作为小点。''',
 '''Hilton Windhoek|市中心|130|280|https://www.hilton.com/en/hotels/wdhhihi-hilton-windhoek/|位于市区的现代酒店，方便以短程车辆前往博物馆与餐饮街区。
Avani Windhoek Hotel & Casino|Independence Avenue|100|230|https://www.avanihotels.com/en/windhoek|独立大道沿线酒店，适合希望靠近市中心服务的旅客。
Hotel Heinitzburg|Klein Windhoek|170|350|https://www.heinitzburg.com/|历史城堡建筑中的酒店，住宿地点本身具有城市建筑特色。
The Weinberg Windhoek|Klein Windhoek|140|300|https://gondwana-collection.com/accommodation/the-weinberg|Klein Windhoek的酒店选择，可结合较安静的住宿与餐饮空间。
Olive Grove Guesthouse|Eros|100|220|https://www.olivegrove-namibia.com/|Eros区域的小型住宿，适合希望减少大型酒店尺度的旅客。''')

add(('maputo','马普托','Maputo','MZ','莫桑比克','MZN',-25.966,32.583,'MPM',3,
 '铁路建筑、木雕与卡普拉纳花布，配上一顿印度洋海鲜，构成马普托的城市节奏。',
 '老城核心可短程步行，长距离用正规出租或预约车；渡轮与岛屿行程单独查询班次和天气，勿把海岛算作市内通勤。'),
 '''马普托火车站|Maputo Central Railway Station|Maputo Central Railway Station|-25.971|32.565|60|0|5|从站房与站台认识铁路港口城市的历史，铁路博物馆或活动票另核对。
马普托堡垒|Fortress of Maputo|Fortress of Maputo|-25.975|32.573|60|2|8|小型堡垒与纪念空间适合结合老城历史解说，开放区域以现场为准。
通杜鲁植物园|Tunduru Gardens|Tunduru Gardens|-25.97|32.574|60|0|0|在树荫与园路中休息，适合作为老城参访之间的缓冲段。
马普托自然历史博物馆|Natural History Museum of Maputo|Museu de História Natural de Maputo|-25.981|32.59|90|3|12|通过自然标本与建筑认识当地生态展陈，馆藏开放与拍摄条件须确认。
中央市场|Maputo Central Market|Maputo Central Market|-25.969|32.568|60|0|0|蔬果、香料、花布与城市采购交织，购买与拍照先询问商贩。''',
 '''卡普拉纳花布与图案故事|Capulana textile encounter|Capulana|-25.968|32.574|90|10|35|culture|认识花布在穿着、育儿和赠礼中的用途，购物或定制服务另行选择。
海鲜市场午餐|Maputo seafood lunch|Mozambican cuisine|-25.934|32.621|120|20|55|food|挑选当天供应的鱼虾前先确认重量、烹饪费与座位消费，不把采购价当整餐价。
马拉本塔现场音乐|Marrabenta live music|Marrabenta|-25.972|32.582|150|10|35|culture|在正式演出或音乐空间听本地节奏，先查节目表；不承诺每天都有演出。''',
 '''木薯叶花生炖菜|Matapa|Matapa|4|12|家常莫桑比克餐馆|木薯叶与花生等煮成浓稠炖菜，部分版本加入海鲜，素食者需询问配方。
辣椒烤鸡|Piri-piri chicken|Piri piri|5|16|市区烧烤餐馆|用辣椒与酸香调味烤鸡，辣度与配菜可以分别询价。
烤大虾|Grilled prawns|Mozambican cuisine|12|35|Costa do Sol与海鲜餐馆|按虾的大小、重量与烹饪方式计价，明确单份或整盘再下单。
西马玉米主食|Xima|Ugali|2|6|市区家常菜餐馆|玉米粉煮成的主食，搭配蔬菜、豆类或鱼肉酱汁食用。
巴吉亚豆饼|Badjia|Bhaji|1|4|市场与街头小吃铺|豆类磨浆油炸成小饼，适合早餐或下午小点，单份大小不同。''',
 '''Polana Serena Hotel|Sommerschield|180|400|https://www.serenahotels.com/polana|海湾附近历史酒店，适合将建筑氛围与休息时间纳入住宿预算。
Radisson Blu Hotel & Residence Maputo|Avenida Marginal|140|300|https://www.radissonhotels.com/en-us/hotels/radisson-blu-maputo|滨海大道上的现代酒店，房间与公寓类型需按日期区分。
Southern Sun Maputo|Avenida da Marginal|150|320|https://www.southernsun.com/southern-sun-maputo|滨海区域酒店，可结合海湾景观与市内车辆接驳。
Hotel Cardoso|Polana|110|260|https://www.cardoso-hotel.com/|老城东侧高地附近的酒店选择，适合兼顾城市景观与市区活动。
Montebelo Girassol Maputo Hotel|Polana Cimento|90|210|https://montebelohotels.com/montebelo-girassol-maputo-hotel/en/|城市酒店选择，具体客房、早餐及接送按预订条款比较。''')

add(('livingstone','利文斯通','Livingstone, Zambia','ZM','赞比亚','ZMW',-17.842,25.854,'LVI',3,
 '在赞比亚一侧看瀑布与峡谷，也为铁路历史、赞比西河和当地手艺留出时间。',
 '市区到瀑布约需短程车辆接驳；跨桥进入津巴布韦涉及边境手续，河上项目按集合点、水位与运营安排预留时间。'),
 '''维多利亚瀑布赞比亚步道|Victoria Falls Zambia trails|Victoria Falls|-17.924|25.861|180|20|35|沿赞比亚一侧步道看瀑布和峡谷，水位与喷雾影响视野，雨具和防滑鞋很有用。
利文斯通博物馆|Livingstone Museum|Livingstone Museum|-17.846|25.855|120|5|15|从考古、地方文化与城市历史认识瀑布之外的赞比亚。
利文斯通铁路博物馆|Railway Museum Livingstone|Railway Museum (Livingstone)|-17.862|25.854|90|5|15|在旧机车与铁路器物间理解南部非洲交通史，开放和展区状态须核对。
莫西奥图尼亚国家公园|Mosi-oa-Tunya National Park|Mosi-oa-Tunya National Park|-17.883|25.815|180|15|40|赞比西河岸的保护区可由持证向导组织观察，不能自行接近动物。
维多利亚瀑布大桥|Victoria Falls Bridge|Victoria Falls Bridge|-17.929|25.857|60|0|10|从边境大桥理解峡谷与铁路工程，通行证件和可达区域先核对。''',
 '''赞比西河日落游船|Zambezi sunset cruise|Zambezi|-17.869|25.825|150|45|100|nature|在上游平缓河段观察晚霞与岸边动物，野生动物出现不作保证，饮料与接送需查套餐。
莫库尼村社区文化导览|Mukuni community visit|Mukuni|-17.924|25.927|120|20|45|culture|在社区同意的路线了解生活、工艺与地方历史，拍摄人物和进入家庭需征得许可。
持证向导犀牛观察|Guided rhino walk|Mosi-oa-Tunya National Park|-17.883|25.815|180|80|150|nature|仅参加保护区批准并带专业人员的步行观察，遵守距离、年龄与体能条件。''',
 '''恩希玛玉米主食|Nshima|Nshima|3|8|Livingstone市区家常菜馆|玉米粉煮成团状主食，通常和叶菜、豆类或炖肉配成一餐。
卡彭塔小鱼|Kapenta|Kapenta|4|10|本地餐馆|小鱼可煎炸或炖煮，风干版本味道更浓，常作为主食配菜。
花生南瓜叶|Ifisashi|Ifisashi|3|9|赞比亚家常菜餐馆|叶菜与花生酱煮成的家常料理，食材随季节变化。
赞比西烤鱼|Zambezi bream|Zambian cuisine|7|20|河岸与市区餐馆|当地鱼料理可烤或煎，先确认按条、按重量还是套餐计费。
维图姆布瓦炸面点|Vitumbuwa|Mandazi|1|4|早餐铺与市区市场|油炸面点适合作为早餐或小食，与茶一起点单时另计饮品。''',
 '''Royal Livingstone Victoria Falls Zambia Hotel by Anantara|赞比西河岸|450|1100|https://www.anantara.com/en/royal-livingstone|河岸高端酒店，适合为瀑布周边停留预留较多休息时间。
Avani Victoria Falls Resort|瀑布周边|230|550|https://www.avanihotels.com/en/victoria-falls|瀑布区域的度假住宿，园区或门票权益以所订房价为准。
Protea Hotel Livingstone|市区南部|110|240|https://www.marriott.com/en-us/hotels/lvipr-protea-hotel-livingstone/overview/|连接市区与瀑布道路的酒店选择，适合车辆出行。
Maramba River Lodge|Maramba河岸|90|220|https://maramba-zambia.com/|河岸小屋与帐篷等住宿形式需分别比较，游猎项目并非自动包含。
Jollyboys Backpackers|市中心|60|130|https://backpackzambia.com/|背包客住宿中的独立房预算；宿舍床位需按每床另查，不能与每间客房混同。''')

add(('juba','朱巴','Juba','SS','南苏丹','SSP',4.8517,31.5825,'JUB',2,
 '白尼罗河、纪念地与多语言城市生活呈现南苏丹首都的文化面貌；目前以资料收录为主。',
 '不自动安排休闲行程；机场、车辆与市内移动需依官方建议并由熟悉当地情况的专业机构确认。'),
 '''约翰加朗纪念地|John Garang Mausoleum|John Garang|4.846|31.596|45|0|10|国家纪念与公共仪式空间，不能假定内部或活动现场对普通访客开放。
圣德肋撒主教座堂|St Theresa Cathedral Juba|St. Theresa Cathedral, Juba|4.835|31.607|45|0|5|认识宗教建筑与社区生活，访问、摄影和礼拜活动需得到许可。
尼亚库隆文化中心|Nyakuron Cultural Centre|Nyakuron Cultural Centre|4.834|31.578|75|0|15|与演出、电影和文化交流相关的城市空间，具体节目需核实。
科尼奥科尼奥市场|Konyo Konyo Market|Juba|4.84|31.612|60|0|0|市场反映城市日常交易与不同语言社群的往来，不作为自由摄影区。
白尼罗河朱巴河段|White Nile at Juba|White Nile|4.849|31.622|60|0|0|理解河流与城市交通、食物供应的关系，不默认安排河岸漫步或乘船。''',
 '''南苏丹社区音乐交流|South Sudanese music exchange|Music of South Sudan|4.834|31.578|90|10|30|culture|在获准的文化活动中了解节奏与歌唱，须确认组织方及参与条件。
尼罗河鱼类与食物故事|Nile food traditions|South Sudanese cuisine|4.851|31.605|90|10|25|food|以烹饪与饮食讲述河流生活，需由可靠接待方确认场所和餐食。
朱巴语言与市集文化|Juba market cultures|Juba Arabic|4.84|31.612|90|20|60|culture|了解朱巴阿拉伯语与城市贸易的联系，采用受邀讲解而非未经许可的探访。''',
 '''高粱阿西达|Aseeda|Asida|3|9|本地家常菜餐馆|高粱等谷物煮成主食，配蔬菜与酱汁；具体谷物和搭配按菜单确认。
基斯拉薄饼|Kisra|Kisra|2|6|苏丹与南苏丹餐馆|发酵谷物薄饼常搭炖菜，酸味与厚薄因做法不同。
花生炖菜|Groundnut stew|Peanut stew|4|12|朱巴家常菜餐馆|花生提供浓郁口感，可搭叶菜或肉类，注意花生过敏。
尼罗河鱼料理|Nile fish|South Sudanese cuisine|6|18|酒店与本地餐馆|鱼可煎、烤或炖，先确认当天来源、份量与烹饪方式。
秋葵炖菜|Bamia|Bamia|4|10|市区家常菜餐馆|秋葵与调味煮成稠汤，有素食或加肉版本，配主食构成一餐。''',
 '''Radisson Blu Hotel Juba|市中心|180|350|https://www.radissonhotels.com/en-us/hotels/radisson-blu-juba|国际连锁酒店，实际接待与机场接送需要直接确认。
Pyramid Continental Hotel|Nimule Street|140|300|https://www.pyramidcontinentalhotel.com/|市区酒店候选，预算不包含额外交通及保障安排。
Palm Africa Hotel Juba|机场附近|120|280|https://conferences.eahealth.org/venue-travel/accommodation|会议住宿目录列示的酒店，须核对当前接待情况。
Crown Hotel Juba|市区|110|250|https://strapi.eacgermany.org/uploads/e_Catalogue_23_24_61b590223e.pdf|东非旅游住宿目录中的酒店候选，房态与服务未经实时确认。
Juba Grand Hotel|Hai Cinema|90|220|https://www.jubagrandhotel.com/|城市酒店候选，直接询问实际营业、付款与接送安排。''')

add(('maun','马翁','Maun, Botswana','BW','博茨瓦纳','BWP',-19.983,23.417,'MUB',3,
 '奥卡万戈的门户也有河岸生活、编篮传统和地方博物馆；三角洲活动值得单独安排整天。',
 '城内与河岸住宿通常需车辆连接；莫雷米与三角洲出行需四驱、船或小飞机，路程不能并入普通市内交通。'),
 '''恩哈贝博物馆|Nhabe Museum|Nhabe Museum|-19.983|23.416|75|3|10|了解恩加米兰德地方历史与文化，展览和工作时间先查询。
塔马拉卡内河|Thamalakane River|Thamalakane River|-19.984|23.432|90|0|0|河流穿过城镇与住宿区域，观察水岸景观需遵守当地允许到访的区域。
莫雷米保护区南门|Moremi South Gate|Moremi Game Reserve|-19.428|23.675|480|120|300|由马翁出发的全天游猎入口，长距离路况与园费需要单列预算。
奥卡万戈三角洲南缘|Southern Okavango Delta|Okavango Delta|-19.7|23.35|360|100|250|湿地水道随水位变化，活动范围和接驳由合法经营者确认。
马翁旧桥河岸|Maun Old Bridge area|Maun, Botswana|-19.953|23.468|60|0|0|以桥与河岸聚落观察城镇发展，避免把私人营地和公共通行混同。''',
 '''Mokoro独木舟湿地体验|Mokoro wetland excursion|Mokoro|-19.7|23.35|300|90|220|nature|由当地船夫在允许的水道撑船，水位、救生装备与野生动物距离由运营者管理。
恩加米兰德编篮交流|Ngamiland basket weaving|Culture of Botswana|-19.984|23.416|90|15|45|culture|通过织物纹样与植物材料了解编篮工艺，课程与购买成品分开预算。
奥卡万戈观景飞行|Okavango scenic flight|Okavango Delta|-19.972|23.431|60|150|350|nature|从空中理解河道与岛屿分布，按人数、航程、天气及机型确认费用。''',
 '''塞斯瓦手撕炖肉|Seswaa|Seswaa|5|15|马翁本地餐馆|肉慢炖后捣碎，常配主食和叶菜，适合了解博茨瓦纳家常口味。
索戈姆酸粥|Bogobe|Ugali|3|8|家常菜餐馆|高粱等谷物做成粥或较稠主食，酸味与稠度随家庭做法变化。
豆类玉米杂粮|Dikgobe|Dikgobe|4|10|本地餐馆|豆类与谷物同煮，能作为较有饱腹感的主食或配菜。
莫罗戈叶菜|Morogo|Morogo|3|8|当地家常菜餐馆|不同叶菜清炒或炖煮，可询问是否加入动物油或肉汤。
马格文亚炸面包|Magwinya|Vetkoek|1|4|早餐摊与市场|油炸面团常作早餐或零食，可单吃也可夹馅。''',
 '''Cresta Riley's Hotel|马翁中心|90|210|https://www.crestahotels.com/hotels/botswana/cresta-rileys|镇上历史较久的酒店，可作为进入三角洲前的落脚点。
Cresta Maun Hotel|塔马拉卡内河沿岸|130|280|https://www.crestahotels.com/hotels/botswana/cresta-maun|河岸酒店，距镇中心的车辆时间需纳入安排。
Maun Lodge|塔马拉卡内河沿岸|90|220|https://www.maunlodge.com/|酒店及小屋类住宿，按实际房型比较空间和服务。
Thamalakane River Lodge|马翁东北河岸|150|350|https://www.thamalakane.com/|河边小屋型住宿，城外位置适合放慢节奏但需接驳。
Crocodile Camp Safari & Spa|Matapana|100|260|https://croccamp.com/|河岸营地与客房选择，露营和酒店客房不能使用同一个价格理解。''')

add(('antananarivo','塔那那利佛','Antananarivo','MG','马达加斯加','MGA',-18.879,47.508,'TNR',3,
 '层层山坡、王宫遗产与高地饮食，让塔那那利佛成为理解马达加斯加社会的起点。',
 '城区道路拥挤且坡度明显，按片区安排并用预约车辆接驳；安布希曼加在城外，应另留半天。'),
 '''塔那那利佛王宫|Rova of Antananarivo|Rova of Antananarivo|-18.923|47.532|120|10|25|山顶王宫空间呈现梅里纳王国历史，修复区与展馆开放依当日安排。
安布希曼加王室山丘|Royal Hill of Ambohimanga|Ambohimanga|-18.761|47.562|180|10|25|城外王室遗产与神圣景观，尊重场所禁忌并单列交通时间。
阿诺西湖|Lake Anosy|Lake Anosy|-18.917|47.519|45|0|0|从周边公共道路认识城市湖景与纪念地，不默认进入所有堤道或设施。
安达菲亚瓦拉特拉宫|Andafiavaratra Palace|Andafiavaratra Palace|-18.921|47.533|90|5|15|宫殿建筑与历史收藏提供理解高地政治文化的另一入口。
阿纳拉凯利街区|Analakely|Antananarivo|-18.908|47.526|75|0|0|下城市场、骑楼和街道连接市民日常采购，白天按实际通行情况安排。''',
 '''高地家常菜烹饪|Malagasy highland cooking|Malagasy cuisine|-18.91|47.526|180|25|60|food|在正规课程中认识米饭、叶菜与香草的搭配，先确认市场采购是否包含。
拉菲草编与刺绣|Raffia and embroidery encounter|Culture of Madagascar|-18.908|47.525|90|10|35|culture|了解拉菲草与纺织手作，挑选可追溯制作过程的工作室，购买单独预算。
高地音乐演出|Malagasy highland music|Music of Madagascar|-18.905|47.524|120|10|35|culture|寻找当日正式音乐节目，了解瓦利哈筒琴等传统与当代编曲的联系。''',
 '''罗马扎瓦肉菜汤|Romazava|Romazava|4|12|高地家常菜餐馆|肉与叶菜煮成清汤式料理，常配米饭，叶菜品种随季节变化。
拉维托托木薯叶|Ravitoto|Ravitoto|4|12|马达加斯加餐馆|木薯叶捣碎后炖煮，常与猪肉同做，素食者应先问配方。
库巴花生米糕|Koba|Koba (sweet)|1|4|市场糕点摊|米粉、花生等做成的甜点，通常切片售卖，留意花生过敏。
莫福加西米粉小点|Mofo gasy|Mofo gasy|1|4|早餐铺|米粉面糊在小圆模中煎烤，适合配咖啡或茶作早餐。
萨莫萨三角饺|Sambos|Samosa|1|5|市区小吃铺|薄皮包肉或蔬菜后油炸，按个或小份销售，辣酱另配。''',
 '''Hotel Carlton Madagascar|Anosy|110|260|https://www.carlton-madagascar.com/|阿诺西湖附近的大型酒店，可结合湖景与城市车辆出行。
Hotel Colbert Spa & Casino|Antaninarenina|80|200|https://www.hotel-restaurant-colbert.com/|上城与下城之间的酒店，适合比较市中心步行与车辆接驳。
Palissandre Hotel & Spa|Faravohitra|100|230|https://www.hotel-palissandre.com/|山坡区域住宿，可把城市观景与休息时间结合。
Radisson Blu Hotel Antananarivo Waterfront|Ambodivona|130|300|https://www.radissonhotels.com/en-us/hotels/radisson-blu-antananarivo-waterfront|现代酒店选择，往老城的拥堵时间应另行预留。
Novotel Convention & Spa Antananarivo|Alarobia|130|300|https://all.accor.com/|Alarobia区域现代酒店，查找具体酒店页和当日房型后再预订。''')

add(('mogadishu','摩加迪沙','Mogadishu','SO','索马里','SOS',2.046,45.318,'MGQ',2,
 '印度洋港城的白色建筑、班纳迪尔文化与诗歌传统具有独特性；当前以文化资料方式展示。',
 '不自动安排休闲交通或行程；市内移动、机场接送、海滩与历史区访问须专业评估与许可。'),
 '''哈马尔韦内历史街区|Hamar Weyne historic quarter|Hamar Weyne, Mogadishu|2.033|45.34|90|0|0|古老街区与沿海商业历史相连，保留文化介绍但不假设可以自由进入。
法赫尔丁清真寺|Fakhr al-Din Mosque|Fakhr al-Din Mosque|2.034|45.342|45|0|5|认识海岸伊斯兰建筑传统，非穆斯林进入及拍摄须得到明确许可。
利多海滩|Liido Beach|Lido Beach|2.056|45.359|90|0|0|海滩与城市社交生活相连，不能据海滨照片推断当前安全或可开放。
索马里青年联盟纪念地|Somali Youth League Memorial|Somali Youth League|2.041|45.341|30|0|0|从国家纪念设施理解独立运动历史，现场访问与摄影需许可。
无名战士纪念碑|Tomb of the Unknown Soldier Mogadishu|Tomb of the Unknown Soldier (Somalia)|2.04|45.344|30|0|0|公共纪念地承载战争与国家记忆，避免将仪式空间当普通娱乐景点。''',
 '''索马里诗歌与口述传统|Somali poetry traditions|Somali poetry|2.046|45.318|90|10|30|culture|通过受邀的文化交流理解诗歌与叙事，可优先选择室内或线上形式。
班纳迪尔饮食交流|Benadiri food traditions|Somali cuisine|2.04|45.334|120|15|40|food|认识印度洋贸易带来的香料、米饭与烘焙传统，由可靠接待方确认场所。
索马里织物与服饰|Somali textile traditions|Culture of Somalia|2.033|45.34|90|10|35|culture|了解布料、服装和社交场合的联系；需获邀请，不默认安排市场探访。''',
 '''卡内罗发酵薄饼|Canjeero|Lahoh|2|6|索马里早餐餐馆|发酵面糊制成带孔薄饼，可搭糖、茶或咸味配菜。
香料米饭|Bariis iskukaris|Bariis iskukaris|5|14|索马里家常菜餐馆|香料米饭常搭肉类与配菜，份量、肉种与饮品分开确认。
索马里桑布萨|Sambusa|Samosa|1|5|小吃餐馆|薄皮三角炸饺包肉或蔬菜，常作为开胃小食。
苏卡尔炖肉|Suqaar|Suqaar|5|14|家常菜餐馆|小块肉与蔬菜香料炒炖，通常搭面饼、米饭或意面。
索马里香料茶|Shaah|Somali cuisine|1|4|茶铺与酒店餐厅|红茶加入香料，奶与糖的做法不同，点单可先说明偏好。''',
 '''Jazeera Palace Hotel|Airport Road|180|380|https://jazeerapalace.com/|机场道路附近酒店候选，不代表对当前安全和营业的保证。
Decale Airport Hotel|机场区域|200|450|https://decalehotel.com/|机场区域住宿候选，实际进入、接送和接待要求需直接确认。
Peace Hotel Mogadishu|机场周边|150|350|https://peacehotel.so/|城市住宿资料候选，安保和其他附加服务不包含在编辑房费内。
Elite Hotel Mogadishu|Liido区域|150|320|https://daarmaal.com/hotel-booking/|旅游经营者目录中的海滨酒店，当前运营与接待未经核实。
Sahafi Hotel|KM4区域|120|300|https://www.tripadvisor.com/Hotels-g294440-Mogadishu_Banaadir_Region-Hotels.html|历史酒店名称与市区住宿资料，不能据既有名录认定现在可入住。''')

add(('victoria-falls','维多利亚瀑布镇','Victoria Falls, Zimbabwe','ZW','津巴布韦','ZWG',-17.931,25.831,'VFA',3,
 '从雨林步道看瀑布全景，再把赞比西河的傍晚与当地艺术加入行程。',
 '镇区与瀑布之间短程接驳；机场在城外，河上活动与国家公园游猎另列车辆时间，跨境项目需要证件核对。'),
 '''维多利亚瀑布雨林步道|Victoria Falls rainforest trail|Victoria Falls|-17.925|25.848|180|45|60|津巴布韦一侧步道连接多个观景点，水季喷雾大，按体能挑选停留点。
赞比西国家公园|Zambezi National Park|Zambezi National Park|-17.881|25.788|240|40|130|河岸与林地游猎需遵守园区管理，导游车辆和入园费分别确认。
维多利亚瀑布大桥|Victoria Falls Bridge Zimbabwe|Victoria Falls Bridge|-17.929|25.857|60|0|10|从津巴布韦侧了解跨峡谷铁路，通行许可与越境范围先核实。
大树猴面包树|Big Tree Victoria Falls|Big Tree at Victoria Falls|-17.911|25.839|45|0|5|古老猴面包树是近郊自然地标，前往路线与野生动物情况需当地确认。
维多利亚瀑布镇中心|Victoria Falls town centre|Victoria Falls, Zimbabwe|-17.931|25.831|60|0|0|工艺店与餐饮服务集中，适合在长时间户外活动后安排轻松采购。''',
 '''赞比西河晚霞巡游|Upper Zambezi cruise|Zambezi|-17.9|25.814|150|45|110|nature|在上游河段观察鸟类与岸线，费用是否含饮品和接送按经营者条款。
津巴布韦石雕工艺|Zimbabwean stone sculpture|Sculpture of Zimbabwe|-17.931|25.831|90|10|35|culture|通过工作室或画廊认识石材与雕刻方法，课程和购买作品分别预算。
瀑布直升机观景|Flight of Angels|Victoria Falls|-17.927|25.817|30|150|280|nature|短程观景飞行从空中理解瀑布与峡谷，实际飞行分钟、附加费和天气需确认。''',
 '''萨扎玉米主食|Sadza|Sadza|3|8|津巴布韦家常菜餐馆|玉米粉煮成主食，常配叶菜、豆类或肉汁。
花生叶菜|Muriwo une dovi|Zimbabwean cuisine|3|9|本地餐馆|叶菜配花生酱，浓稠程度随做法变化，花生过敏者应避开。
烤鲷鱼|Bream|Zimbabwean cuisine|8|22|河岸与镇区餐馆|整鱼或鱼排的计价不同，可先确认份量和配菜。
南部非洲烤肉|Nyama braai|Regional variations of barbecue|8|25|烧烤餐馆|炭烤肉搭主食和蔬菜，适合按实际肉种与人数分配预算。
奶油玉米豆类|Samp and beans|Samp|4|10|家常菜餐馆|碎玉米粒与豆类同煮，可作为主食或配菜，肉汤版本应先询问。''',
 '''The Victoria Falls Hotel|镇区南部|300|700|https://www.victoriafallshotel.com/|历史酒店建筑与花园具有目的地特色，可单独为酒店休闲留时间。
Ilala Lodge Hotel|瀑布入口周边|220|500|https://www.ilalalodge.com/|靠近镇区与瀑布区域的小型酒店，实际步行条件按当地指引。
Victoria Falls Safari Lodge|镇区西侧|250|600|https://victoria-falls-safari-lodge.com/|城外林地住宿，观景与游猎活动并非必然包含在基础房价。
Palm River Hotel|赞比西河岸|280|650|https://www.palmriverhotel.com/|河岸度假酒店，适合在瀑布参访之外留出半日休息。
Shearwater Explorers Village|镇区|60|180|https://www.explorersvillage.com/|营地与客房形式并存，按所选住宿类别确认卫浴和餐食。''')

add(('kampala','坎帕拉','Kampala','UG','乌干达','UGX',0.3476,32.5825,'EBB',3,
 '布干达王国遗产、山丘宗教建筑与Rolex街头小吃，让坎帕拉不只是进入国家公园前的中转。',
 '山丘之间宜用预约车辆，市区拥堵需留余量；恩德培机场在另一座城市，不能按市中心短程接驳估计。'),
 '''卡苏比王陵|Kasubi Tombs|Kasubi Tombs|0.329|32.553|100|5|20|布干达王室遗产与活态信仰空间，修复和参访范围以管理方为准。
乌干达国家清真寺|Uganda National Mosque|Uganda National Mosque|0.314|32.569|75|5|15|山丘上的宗教建筑与城市视野，服装要求、礼拜时段和导览需确认。
卡巴卡宫殿|Mengo Palace|Lubiri|0.303|32.57|90|10|25|了解布干达王国与近现代历史，宫苑和相关展区需区分许可范围。
乌干达博物馆|Uganda Museum|Uganda Museum|0.336|32.583|100|5|15|考古、乐器与文化展陈适合认识全国背景；翻修、展厅开放应先查询。
巴哈伊灵曦堂|Bahai House of Worship Kampala|Baháʼí House of Worship|0.365|32.589|60|0|5|安静的园地与宗教建筑适合短暂停留，参访尊重静默与礼仪。''',
 '''Rolex街头早餐|Rolex street-food breakfast|Rolex (food)|0.327|32.6|60|3|10|food|看鸡蛋蔬菜如何卷入薄饼，选择现做摊点，饮品另计。
传统舞乐晚间演出|Ugandan dance and music evening|Music of Uganda|0.352|32.615|180|20|55|culture|从正式节目了解不同社群的舞蹈与乐器，场次、餐食和交通分别确认。
奥维诺市场手作与布料|Owino textiles and crafts|Owino Market|0.306|32.572|90|10|30|culture|在熟悉市场的向导带领下辨识布料和二手交易文化，购物由自己选择。''',
 '''乌干达鸡蛋卷饼|Rolex|Rolex (food)|1|4|Kabalagala与市区早餐摊|煎蛋、蔬菜与chapati卷在一起，按蛋数和馅料调整预算。
马托凯蒸蕉|Matoke|Matoke|3|9|乌干达家常菜餐馆|未熟食蕉蒸熟或炖煮，可搭花生酱或肉类炖汁。
卢旺博蕉叶蒸菜|Luwombo|Luwombo|5|15|传统布干达餐馆|食材包入蕉叶烹调，常见鸡肉、牛肉或花生版本。
乌干达花生酱菜|Groundnut sauce|Ugandan cuisine|3|8|当地家常菜餐馆|浓稠花生酱与主食和蔬菜搭配，点餐时确认是否加鱼肉。
炸蕉小点|Gonja|Fried plantain|1|4|市区小吃铺|成熟食蕉烤或炸后带甜味，适合当配菜或小点。''',
 '''Kampala Serena Hotel|Nakasero|200|450|https://www.serenahotels.com/kampala|园林与城市中心结合的酒店，适合用车辆串联山丘景点。
Sheraton Kampala Hotel|Nakasero|150|340|https://www.marriott.com/en-us/hotels/ebbsi-sheraton-kampala-hotel/overview/|市中心国际酒店，具体早餐、接送和房型以预订为准。
Latitude 0 Degrees|Makindye|130|300|https://0.thelatitudehotels.com/|山丘区域的设计酒店，可将休息与城市观景纳入住宿选择。
Mestil Hotel & Residences|Nsambya|140|320|https://mestilhotels.com/|酒店与公寓型住宿，适合比较短住和稍长停留的空间需求。
Protea Hotel Kampala|Kololo|110|260|https://www.marriott.com/en-us/hotels/ebbka-protea-hotel-kampala/overview/|Kololo片区住宿，前往旧城仍需预留交通时间。''')

add(('accra','阿克拉','Accra','GH','加纳','GHS',5.56,-0.1969,'ACC',3,
 '泛非历史、加族社区、当代艺术与海岸音乐，让阿克拉适合慢慢认识而不只打卡纪念碑。',
 '不同街区以正规出租或预约车辆衔接，交通高峰需留余量；海岸与市场导览优先白天进行，远郊项目另列车程。'),
 '''恩克鲁玛纪念公园|Kwame Nkrumah Memorial Park|Kwame Nkrumah Mausoleum|5.543|-0.203|100|5|20|围绕独立运动与泛非思想认识首都历史，展馆票种先核对。
加纳国家博物馆|National Museum of Ghana|National Museum of Ghana|5.561|-0.208|100|5|15|器物、艺术与文化展陈为探索加纳各地建立背景。
独立广场|Independence Square Accra|Independence Square, Accra|5.549|-0.192|45|0|0|黑星纪念元素与大型公共广场连接国家仪式，活动时通行可能调整。
詹姆斯敦历史街区|Jamestown Accra|Jamestown/Usshertown, Accra|5.535|-0.211|90|0|0|渔业、拳击与老街建筑并存，社区内拍摄或探访需事先征求同意。
马科拉市场|Makola Market|Makola Market|5.548|-0.211|75|0|0|布料、食材与城市商业交织，可在熟悉路线者带领下挑选重点区域。''',
 '''加族Homowo节庆文化|Homowo festival traditions|Homowo|5.536|-0.209|180|0|25|festival|了解节庆与克服饥荒的集体记忆，按当年社区公告选择可公开参加的活动。
海岸鼓乐与舞蹈课|Ghanaian drumming workshop|Music of Ghana|5.543|-0.198|120|20|50|culture|由当地老师带领辨认节奏与合奏方式，课程不是对所有族群音乐的概括。
奥苏特色食物路线|Osu food tasting|Ghanaian cuisine|5.557|-0.183|150|20|45|food|用小份试吃比较发酵主食、烤鱼和香料，确认包含餐数及饮品。''',
 '''加纳乔洛夫饭|Ghanaian jollof|Jollof rice|4|12|Osu与市区加纳餐馆|番茄、香料与米饭同煮，可搭鸡肉、鱼或蔬菜。
瓦切豆米饭|Waakye|Waakye|3|9|早餐摊和家常餐馆|豆和米同煮，搭配酱料、鸡蛋或其他配菜，点单时逐项确认。
班库发酵主食|Banku|Banku|4|12|海岸与本地餐馆|发酵玉米和木薯做成的主食，常配烤鱼或汤。
凯莱韦莱辣炸蕉|Kelewele|Kelewele|2|6|Osu小吃铺|成熟食蕉切块用香料调味后炸制，常作为晚间小食。
富富与汤|Fufu|Fufu|5|14|加纳家常菜餐馆|捣制主食与浓汤组成一餐，主料和汤中肉类可分别询问。''',
 '''Kempinski Hotel Gold Coast City Accra|Ridge|260|600|https://www.kempinski.com/en/hotel-gold-coast-city|靠近城市文化与行政区的高端酒店。
Movenpick Ambassador Hotel Accra|中央商务区|180|400|https://movenpick.accor.com/en/africa/ghana/accra/moevenpick-ambassador-hotel-accra.html|市区酒店与花园空间结合，适合城市停留。
Labadi Beach Hotel|Labadi|180|420|https://labadibeachhotelgh.com/|海岸度假酒店，海滩与酒店设施使用条件须核对。
Accra Marriott Hotel|Airport City|200|450|https://www.marriott.com/en-us/hotels/accmc-accra-marriott-hotel/overview/|机场城片区的国际酒店，适合晚到或短停留。
La Villa Boutique Hotel|Osu|120|280|https://lavillaghana.com/|Osu周边小型酒店，便于连接餐饮与文化街区。''')

add(('tunis','突尼斯市','Tunis','TN','突尼斯','TND',36.8065,10.1815,'TUN',3,
 '老城集市、迦太基遗迹与蓝白山城互相补充，马赛克与辛香小吃让首都旅行更有层次。',
 '老城步行，巴尔杜、迦太基与西迪布赛义德以车辆或轨道交通衔接；遗址片区分散，不按一个短停留点计算。'),
 '''突尼斯麦地那|Medina of Tunis|Medina of Tunis|36.798|10.171|150|0|0|老城街巷连接工坊、庭院与市场，宗教和私人建筑须分别确认是否可进入。
巴尔杜国家博物馆|Bardo National Museum|Bardo National Museum (Tunis)|36.809|10.134|150|5|15|以罗马马赛克与考古收藏见长，展厅开放和门票按当日安排。
迦太基遗址|Carthage archaeological site|Carthage|36.853|10.323|240|5|20|多个遗址分散在城区，浴场、山丘和其他展区应按实际交通串联。
西迪布赛义德|Sidi Bou Said|Sidi Bou Said|36.87|10.347|150|0|0|蓝白街巷与海湾视角适合留出停坐时间，茶饮和付费建筑另计。
宰图纳清真寺周边|Al-Zaytuna Mosque exterior|Al-Zaytuna Mosque|36.797|10.172|45|0|5|从周边街巷认识老城宗教中心，内部进入依宗教规定与现场许可。''',
 '''哈里萨与突尼斯厨房|Harissa cooking workshop|Harissa|36.799|10.172|180|30|70|food|在烹饪课程中认识辣椒酱、橄榄油与香料的搭配，按个人耐辣度调整。
突尼斯麦地那工艺导览|Medina craft workshops|Medina of Tunis|36.799|10.172|120|15|40|culture|聚焦铜器、织物或帽饰工艺中的一两类，工坊访问需预约。
马卢夫音乐之夜|Tunisian malouf evening|Malouf|36.802|10.176|120|10|35|culture|在有正式节目表的场馆认识安达卢西亚音乐传统，不把季节演出当每天供应。''',
 '''布里克薄皮炸包|Brik|Brik|2|6|老城餐馆与小吃店|薄皮包鸡蛋、金枪鱼等油炸，蛋的熟度可先沟通。
拉布拉比鹰嘴豆汤|Lablabi|Lablabi|2|6|麦地那早餐铺|鹰嘴豆汤搭面包与调味，鸡蛋和金枪鱼等配料可另选。
突尼斯古斯米|Tunisian couscous|Couscous|6|16|传统突尼斯餐馆|蒸制粗粒面配蔬菜和鱼肉，辣酱与份量依餐馆版本不同。
梅什维亚烤菜沙拉|Mechouia salad|Mechouia salad|3|8|老城与市区餐馆|烤椒、番茄等切碎调味，常配橄榄油，部分会加鱼或蛋。
马格鲁德椰枣糕|Makroudh|Makroudh|1|5|传统糕点店|粗粒面包裹椰枣馅的甜糕，适合作为少量下午茶。''',
 '''Dar El Jeld Hotel & Spa|Medina|150|330|https://www.dareljeld.com/|麦地那内的庭院式酒店，适合把老城建筑作为住宿体验。
Hotel Carlton Tunis|Habib Bourguiba Avenue|65|150|https://www.hotelcarltontunis.com/|市中心大道沿线酒店，可衔接老城与其他城市区域。
Dar Ben Gacem|Medina|100|220|https://darbengacem.com/|历史宅邸型小型住宿，进入老城街巷需考虑行李搬运。
Movenpick Hotel du Lac Tunis|Les Berges du Lac|140|320|https://movenpick.accor.com/en/africa/tunisia/tunis/hotel-du-lac-tunis.html|湖区现代酒店，距老城需额外车辆接驳。
The Residence Tunis|Gammarth|220|500|https://www.cenizaro.com/theresidence/tunis|海滨度假住宿，位于首都外围，不应当作老城步行酒店。''')

add(('asmara','阿斯马拉','Asmara','ER','厄立特里亚','ERN',15.3229,38.9251,'ASM',3,
 '现代主义街景与高原咖啡文化相交，适合从日常尺度理解这座世界遗产城市。',
 '中心街道可按片区步行，出城需先核对许可；建筑内部、摄影与铁路活动不能默认开放。'),
 '''菲亚特塔列罗大楼|Fiat Tagliero Building|Fiat Tagliero Building|15.322|38.925|45|0|5|像机翼一样悬挑的建筑体现城市现代主义实验，以获准的外观参观为主。
帝国电影院|Cinema Impero|Cinema Impero|15.336|38.938|45|0|8|装饰艺术风格立面连接城市电影文化，内部和放映场次需另外确认。
玫瑰圣母教堂|Church of Our Lady of the Rosary Asmara|Church of Our Lady of the Rosary, Asmara|15.338|38.938|60|0|5|红砖建筑和钟楼构成城市地标，参观避开礼拜并遵守拍摄规则。
哈内特大街|Harnet Avenue|Harnet Avenue|15.335|38.937|90|0|0|街道两侧商业、咖啡馆与历史立面适合以步行阅读建筑。
恩达玛利亚姆主教座堂|Enda Mariam Cathedral|Enda Mariam Cathedral, Asmara|15.342|38.941|60|0|5|宗教建筑展示不同于主街现代建筑的传统，内部访问先征求许可。''',
 '''阿斯马拉咖啡馆文化|Asmara cafe culture|Asmara|15.335|38.938|90|4|12|food|以一杯咖啡和糕点观察街道生活，保留停坐时间而非赶路。
现代主义建筑导览|Asmara modernist architecture walk|Asmara|15.33|38.932|180|20|50|culture|从街道尺度和不同建筑类型理解城市遗产，路线与摄影权限由导游核对。
厄立特里亚咖啡仪式|Eritrean coffee ceremony|Coffee ceremony|15.336|38.938|90|5|18|culture|在受邀或正式安排的场所认识陶壶煮咖啡与分享礼仪。''',
 '''因吉拉薄饼|Injera|Injera|3|8|市中心厄立特里亚餐馆|发酵薄饼配多种酱汁与炖菜，是共享餐盘常见的主食。
齐格尼辣炖肉|Zigni|Zigni|5|14|传统餐馆|香料与肉慢炖，辣度通常明显，点单前可询问。
希罗豆粉炖菜|Shiro|Shiro (food)|3|9|本地家常菜餐馆|豆粉煮成浓稠料理，常作为斋期或植物性食物选择。
富尔早餐|Ful medames|Ful medames|3|8|早餐铺|蚕豆炖软后加油与调味，配面包组成简单早餐。
厄立特里亚意面|Pasta in Eritrea|Eritrean cuisine|5|13|Harnet Avenue餐馆|城市饮食保留意面传统，酱汁可带当地辛香，按具体菜单选择。''',
 '''Hotel Asmara Palace|机场方向|130|280|https://www.asmarapalace.com/|机场方向的大型酒店，前往中心街区需另计车辆时间。
Albergo Italia Asmara|Nakfa Avenue|90|200|https://www.albergoitaliaasmara.com/|历史酒店建筑具有老城气息，房间与设施状态须直接确认。
Crystal Hotel Asmara|Bihat Street|70|160|https://www.tripadvisor.com/Hotels-g293789-Asmara_Maekel_Region-Hotels.html|市中心附近的小型酒店候选，线上房态仍需与酒店复核。
Sunshine Hotel Asmara|Bidho Street|70|170|https://www.sunshinehotelasmara.com/|市中心街区住宿候选，需直接确认订单与接待。
Lion Hotel Asmara|Bakla Street|60|150|https://www.tripadvisor.com/Hotels-g293789-Asmara_Maekel_Region-Hotels.html|Bakla Street酒店候选，适合按实际客房条件比较。''')

add(('lilongwe','利隆圭','Lilongwe','MW','马拉维','MWK',-13.9626,33.7741,'LLW',2,
 '从城市自然保护、旧城市场与木雕工艺开始，利隆圭适合以生活节奏认识马拉维。',
 '旧城与新城分散，使用预约车辆衔接；机场在城外，湖区和森林活动需要独立安排整日往返。'),
 '''利隆圭野生动物中心|Lilongwe Wildlife Centre|Lilongwe Wildlife Centre|-13.978|33.77|150|10|25|救护与保护教育中心结合自然步道，不把动物照护区等同可随意接触的动物园。
卡穆祖纪念陵|Kamuzu Mausoleum|Kamuzu Mausoleum|-13.945|33.789|60|0|10|纪念国家独立后的重要政治人物，可结合讲解理解历史。
旧城市场|Lilongwe Old Town market|Lilongwe|-13.988|33.772|75|0|0|蔬果、日用品与街头交易体现城市生活，白天按实际允许路线探访。
第一次世界大战纪念塔|World War I Memorial Lilongwe|Lilongwe|-13.951|33.786|45|0|10|纪念建筑与周边空间适合作短暂停留，登塔或内部通行需现场确认。
利隆圭自然保护步道|Lilongwe Nature Sanctuary|Lilongwe Wildlife Centre|-13.974|33.773|90|5|15|城市林地适合观察植物与鸟类，选择开放步道，门票若已含中心参访应避免重复计费。''',
 '''马拉维木雕工艺交流|Malawian woodcarving encounter|Culture of Malawi|-13.986|33.771|90|10|30|culture|认识雕刻工具与当地制作主题，优先选择合法木材工艺品。
恩希玛家常烹饪|Nsima home-style cooking|Nsima|-13.985|33.773|150|20|50|food|学习主食与叶菜、豆类的组合，课程应明确食材和卫生安排。
达扎拉尼亚森林观鸟|Dzalanyama forest birding|Dzalanyama Forest Reserve|-14.24|33.49|420|80|180|nature|城外森林需向导与车辆，作为整日自然项目安排，具体鸟种出现不保证。''',
 '''恩西玛玉米主食|Nsima|Nshima|2|7|旧城家常菜餐馆|浓稠玉米主食配蔬菜、豆类和鱼肉，是日常一餐的核心。
昌博鱼|Chambo|Malawian cuisine|6|18|市区马拉维餐馆|常以烤或煎鱼形式配主食，鱼种、大小和供应按菜单确认。
恩迪沃叶菜|Ndiwo|Malawian cuisine|2|7|家常菜餐馆|为主食配上的叶菜或其他配菜，有花生等不同调味方式。
姆巴塔塔红薯点心|Mbatata|Mbatata cookies|1|4|糕点与咖啡店|红薯做成的小点心，适合寻找本地烘焙菜单，未必每家店供应。
曼达齐炸面点|Mandasi|Mandazi|1|4|旧城早餐铺|微甜炸面点常配茶，价格按个或份数区分。''',
 '''The President Hotel Umodzi Park|City Centre|160|350|https://www.umodzipark.co.mw/|会议中心附近的大型酒店，适合新城区活动。
Sunbird Capital|City Centre|110|250|https://www.sunbirdmalawi.com/|本地酒店集团在首都的住宿选择，核对具体酒店与房型。
Sunbird Lilongwe|Old Town|90|210|https://www.malawitourism.com/regions/central-malawi/lilongwe/sunbird-lilongwe/|旧城附近酒店，可与市场及其他市区地点组合。
Latitude 13 Degrees|Area 43|120|280|https://13.thelatitudehotels.com/|设计与庭院空间结合的小型酒店，前往旧城需车辆。
Crossroads Hotel Lilongwe|Mchinji Road|100|230|https://www.crossroadshotel.net/|城市酒店选择，餐饮、健身及其他服务按实际房价条款确认。''')

add(('la-paz','拉巴斯','La Paz','BO','玻利维亚','BOB',-16.4897,-68.1193,'LPB',3,
 '城市沿安第斯山谷层层展开，缆车、艾马拉文化与市场食物共同构成高原首都的日常。',
 '首日放缓以适应高海拔，市内可用缆车与车辆组合；月亮谷和埃尔阿尔托需单独留通勤，避免把高原徒步排得过满。'),
 '''穆里略广场|Plaza Murillo|Plaza Murillo|-16.496|-68.133|45|0|0|广场与周边公共建筑展现政治中心，示威或官方活动期间路线可能调整。
圣弗朗西斯科教堂|Basilica of San Francisco La Paz|Basilica of San Francisco, La Paz|-16.497|-68.138|90|3|10|雕刻立面与修道院博物馆呈现安第斯与殖民艺术交汇，内部票种另核对。
哈恩街|Calle Jaen|Calle Jaén|-16.492|-68.135|90|0|10|历史街巷与小型博物馆集中，可按兴趣选馆，避免将多馆算成一个零费用项目。
月亮谷|Valle de la Luna La Paz|Valle de la Luna (Bolivia)|-16.567|-68.094|120|3|10|侵蚀地貌形成狭窄步道与尖塔，遮阴少，按体能与天气选择路线。
女巫市场文化街区|Witches Market|Witches' Market|-16.496|-68.14|75|0|0|传统仪式用品与手工艺商铺并存，尊重信仰，不购买受限制动植物制品。''',
 '''Mi Teleferico城市缆车|Mi Teleferico city ride|Mi Teleférico|-16.501|-68.15|120|3|10|culture|以公共交通视角观察山谷与社区，不将缆车视为直达所有景点的观光包车。
艾马拉纺织与服饰交流|Aymara textile encounter|Aymara people|-16.495|-68.139|90|15|40|culture|在合作社或正式工作室了解纺织和服饰含义，人物摄影先征得同意。
高原市场食物路线|Andean market food tasting|Bolivian cuisine|-16.5|-68.137|150|15|40|food|用小份尝试汤、面点与谷物，安排足够休息，具体摊位按当日经营选择。''',
 '''萨尔特尼亚馅饼|Saltena|Salteña|1|4|市中心早餐面点铺|多汁肉馅包在微甜烤皮内，多在上午供应，吃时注意热汤。
帕塞尼奥拼盘|Plato paceno|Plato paceño|4|10|拉巴斯家常菜馆|玉米、豆类、土豆与奶酪组成高原风味餐盘，不同店可能加肉。
花生汤|Sopa de mani|Sopa de maní|3|8|本地午餐餐馆|花生磨碎煮汤，常搭蔬菜、肉或面，注意花生过敏。
丘纽汤|Chairo|Chairo|3|8|高原家常菜餐馆|以冻干土豆等食材煮成的汤，体现高原储粮与烹饪传统。
布努埃洛炸面饼|Bunuelos|Buñuelo|1|4|市集面点摊|炸面饼可配糖浆或热饮，按份量与配料计算。''',
 '''Casa Grande Hotel|Calacoto|120|280|https://www.casa-grande-hotel.com/|南部较低海拔区域的现代酒店，往老城需交通时间。
Atix Hotel|Calacoto|140|320|https://www.atixhotel.com/|结合设计与艺术的酒店，可作为南区慢节奏停留基地。
Hotel Europa La Paz|市中心|80|190|https://www.hoteleuropa.com.bo/|市中心酒店选择，可衔接老城和公共交通。
La Casona Hotel Boutique|San Francisco附近|70|170|https://www.lacasonahotelboutique.com/|历史街区的小型酒店，适合希望靠近老城步行线路的人。
Stannum Boutique Hotel & Spa|Sopocachi|100|240|https://www.stannumhotels.com/|Sopocachi片区酒店，适合结合餐饮与城市观景。''')

add(('asuncion','亚松森','Asunción','PY','巴拉圭','PYG',-25.2637,-57.5759,'ASU',3,
 '河岸、独立历史与瓜拉尼文化相连，花边工艺、冷饮特雷雷和家常玉米料理值得慢慢体验。',
 '老城可按小片区步行，长距离使用预约车辆；高温时将户外安排放早晚，机场接驳另计。'),
 '''独立之家博物馆|Casa de la Independencia Museum|Casa de la Independencia Museum|-25.28|-57.634|75|0|5|由住宅空间与历史物件认识巴拉圭独立进程，参观时间先核对。
英雄国家纪念堂|National Pantheon of the Heroes|National Pantheon of the Heroes|-25.282|-57.635|45|0|0|重要国家纪念与仪式空间，按现场秩序参观。
卡比尔多文化中心|Cabildo Cultural Center|El Cabildo|-25.278|-57.635|90|0|5|在老公共建筑中了解历史、艺术与文化展览，具体展厅可能轮换。
洛佩斯宫外观|Palacio de los Lopez exterior|Palacio de los López|-25.276|-57.639|40|0|0|沿获准公共区域欣赏宫殿建筑，政府内部不视为常规旅游开放区。
巴罗博物馆|Museo del Barro|Museo del Barro|-25.281|-57.565|120|0|10|原住民艺术、民间工艺与当代作品构成理解巴拉圭文化的重要线索。''',
 '''特雷雷冷泡草本文化|Terere sharing traditions|Tereré|-25.282|-57.633|90|5|15|food|认识马黛茶与草本冷泡饮法，使用个人饮具并尊重分享习惯。
尼安杜蒂花边工艺|Nanduti lace workshop|Ñandutí|-25.281|-57.565|120|20|50|culture|通过工作室了解蛛网状花边的结构与手工制作，课程地点与材料另核对。
亚松森河岸傍晚|Asuncion riverfront evening|Asunción|-25.273|-57.633|120|0|15|nature|在开放河岸公共空间看天色变化，避开高温并根据当地指引选择路线。''',
 '''巴拉圭玉米烤糕|Sopa paraguaya|Sopa paraguaya|2|6|老城家常餐馆|名字虽有汤，实际是奶酪、玉米等做成的咸味烤糕。
奇帕奶酪面包|Chipa|Chipa|1|4|面包店与早餐铺|木薯淀粉与奶酪做成的小面包，现烤时外香内韧。
奇帕瓜苏玉米焗糕|Chipa guasu|Chipa guasu|3|8|巴拉圭餐馆|鲜玉米与奶酪等烤成较湿润的菜肴，常作为配菜。
姆贝尤木薯饼|Mbeju|Mbejú|2|6|早餐与小吃餐馆|木薯淀粉和奶酪做成的煎饼，常配热饮或特雷雷。
博里博里汤|Vori vori|Vorí vorí|3|9|家常菜餐馆|玉米奶酪小团煮入汤中，常有鸡肉或蔬菜版本。''',
 '''Palmaroga Hotel|Palma老城|90|220|https://palmaroga.com/|老城历史建筑改造酒店，适合结合建筑与文化参观。
Gran Hotel del Paraguay|市中心外围|70|170|https://www.granhoteldelparaguay.com.py/|带历史背景的花园型酒店，前往核心老城需交通。
La Mision Hotel Boutique|Villa Morra|120|280|https://www.lamision.com.py/|Villa Morra的精品酒店，可结合现代餐饮街区。
Sheraton Asuncion Hotel|Aviadores del Chaco|130|300|https://www.marriott.com/en-us/hotels/asssi-sheraton-asuncion-hotel/overview/|现代商业区酒店，适合以车辆连接老城与购物区。
Factoria Hotel|Villa Morra|120|280|https://www.factoriahotel.com/|工业风设计酒店，住宿空间可作为城市体验的一部分。''')

add(('georgetown','乔治敦','Georgetown, Guyana','GY','圭亚那','GYD',6.8013,-58.1551,'GEO',3,
 '木构建筑、板球与加勒比和南亚风味交织，海堤与市场展示圭亚那首都的日常。',
 '城区以短程车辆与白天步行组合，国际机场在城外；凯厄图尔瀑布等需单独航班与整日安排，不算市内景点。'),
 '''圣乔治大教堂|St Georges Cathedral Georgetown|St. George's Cathedral, Georgetown|6.812|-58.163|60|0|5|木构教堂的空间与城市历史相连，礼拜和参观时间需区别。
斯塔布鲁克市场|Stabroek Market|Stabroek Market|6.809|-58.165|75|0|0|钟楼与市场建筑是市中心地标，按当地建议选择白天路线。
圭亚那国家博物馆|Guyana National Museum|Guyana National Museum|6.813|-58.164|90|0|5|从自然与历史展陈建立对国家的初步认识，具体展区依开放安排。
沃尔特罗斯人类学博物馆|Walter Roth Museum|Walter Roth Museum of Anthropology|6.816|-58.164|90|0|5|关注原住民文化与物质生活，避免将不同社群混为一种文化。
乔治敦植物园|Georgetown Botanical Gardens|Georgetown Botanical Gardens|6.803|-58.139|120|0|5|在公共园地观察热带植物与鸟类，不默认进入动物设施或限制区。''',
 '''乔治敦市场风味路线|Georgetown market food tour|Guyanese cuisine|6.812|-58.15|150|30|70|food|由熟悉当地食材者带领比较加勒比、印度和本地风味，试吃种类按市场供应。
德梅拉拉朗姆酒导览|Demerara rum distillery visit|El Dorado Rum|6.812|-58.179|120|30|65|culture|了解糖业与蒸馏历史，只参加正式预约参观；品酒为成年人自选并安排车辆。
海堤傍晚与城市生活|Georgetown seawall sunset|Georgetown seawall|6.829|-58.15|90|0|10|nature|在允许开放的海堤路段观察潮汐与居民休闲，按天气和当地安全建议调整。''',
 '''圭亚那胡椒锅|Guyanese pepperpot|Guyanese pepperpot|8|22|圭亚那家常菜餐馆|肉类与木薯制调味液慢炖，节庆常见，是否供应应提前问。
库克阿普米饭|Cook-up rice|Cook-up rice|5|14|市场与家常餐馆|米饭、豆类与椰奶等同煮，肉类和素食版本不同。
咖喱与罗蒂|Curry and roti|Guyanese cuisine|6|16|南亚风味餐馆|扁面饼配咖喱，馅料、辣度与份量可独立选择。
梅泰炸甜点|Mithai|Mithai|2|6|市区糕点与小吃铺|当地南亚传统甜点有多种形态，按店内具体品种试小份。
木薯面包|Cassava bread|Casabe|2|6|市场与本地食材店|木薯做成薄脆面饼，可搭餐食；选购现成安全加工产品。''',
 '''Guyana Marriott Hotel Georgetown|Kingston|240|520|https://www.marriott.com/en-us/hotels/geomc-guyana-marriott-hotel-georgetown/overview/|河口与海堤附近的国际酒店，会议季房价变化需另查。
Pegasus Hotel Guyana|Kingston|180|400|https://pegasushotelguyana.com/|海堤附近的地标住宿，旧楼和新楼房型需分别核对。
Cara Lodge|Quamina Street|140|300|https://www.caralodge.com/|木构历史宅邸改造酒店，适合偏爱老城建筑气息的旅客。
Herdmanston Lodge|Queenstown|120|260|https://www.herdmanstonlodge.com/|住宅街区的小型酒店，适合较安静的停留。
Kings Hotel & Residences|市中心|130|280|https://www.kingshotel.gy/|酒店与住宅型房间候选，按停留长度比较厨房和空间需求。''')

add(('paramaribo','帕拉马里博','Paramaribo','SR','苏里南','SRD',5.852,-55.204,'PBM',3,
 '木构老城、并列的宗教建筑与爪哇、印度和克里奥尔食物，让这座河港城市拥有多层文化。',
 '历史中心适合白天步行，外围以车辆连接；机场距市区较远，科默韦讷河岸与种植园参观需另留半天或一天。'),
 '''泽兰迪亚堡|Fort Zeelandia Paramaribo|Fort Zeelandia (Suriname)|5.825|-55.15|100|5|15|堡垒与博物馆将贸易、殖民与国家历史联系起来，参观时尊重纪念空间。
圣彼得圣保罗主教座堂|Saint Peter and Paul Cathedral|Saint Peter and Paul Cathedral, Paramaribo|5.829|-55.155|60|0|5|木构教堂展现热带城市建筑技艺，礼拜期间按指引参访。
独立广场|Independence Square Paramaribo|Independence Square (Paramaribo)|5.826|-55.152|45|0|0|广场与周边历史建筑适合认识城市布局，政府建筑内部不默认开放。
棕榈园|Palmentuin|Palmentuin|5.83|-55.151|60|0|0|城中心棕榈绿地适合日间休息，依当地开放和维护安排使用。
凯泽街宗教街景|Keizerstraat religious streetscape|Neveh Shalom Synagogue|5.83|-55.161|60|0|0|相邻宗教建筑反映多元城市传统，内部访问须分别向管理方申请。''',
 '''爪哇与印度风味试吃|Surinamese multicultural food tasting|Surinamese cuisine|5.83|-55.16|150|20|50|food|以罗蒂、绍托汤和米面料理认识迁徙与饮食融合，菜单按当日供应。
科默韦讷河岸历史骑行|Commewijne heritage cycling|Commewijne District|5.89|-55.09|300|45|95|culture|由正规运营者安排渡河与骑行，种植园历史包括劳工与殖民背景，不把全程当城市漫步。
Koto服饰文化交流|Koto dress traditions|Koto (clothing)|5.835|-55.16|90|10|25|culture|在博物馆或受邀讲解中认识服饰与头巾的社会含义，拍摄前征求许可。''',
 '''苏里南罗蒂|Surinamese roti|Roti|5|13|印度裔风味餐馆|扁面饼配咖喱、土豆与蔬菜，可询问鸡肉或素食版本。
绍托汤|Saoto|Soto (food)|4|10|爪哇风味餐馆|清汤搭鸡肉、豆芽等配料，米饭和额外配菜按店内点法。
波姆焗菜|Pom|Pom (dish)|6|16|克里奥尔家常菜餐馆|根茎食材与肉等烘焗，口感绵密，是否供应通常需查当日菜单。
巴米炒面|Bami|Mie goreng|4|12|爪哇风味餐馆|带当地调味的炒面，可搭鸡肉、蔬菜与辣酱。
博约椰香木薯糕|Bojo|Bojo cake|2|6|市区糕点店|木薯与椰子等烤制成的甜糕，适合作为小份下午点心。''',
 '''Torarica Resort|Waterkant周边|150|330|https://torarica.com/|靠近历史中心的度假酒店，餐饮与休闲设施按房价条件。
Royal Torarica|历史中心边缘|180|400|https://royaltorarica.com/|较高预算的城市酒店选择，适合在短程参访之间安排休息。
Eco Torarica|历史中心边缘|90|220|https://ecotorarica.com/|较小规模的酒店选择，具体房型与共享设施需确认。
Courtyard Paramaribo|Anton Dragtenweg|140|320|https://www.marriott.com/en-us/hotels/pbmcy-courtyard-paramaribo/overview/|河岸方向的国际酒店，往老城核心需短程接驳。
Queens Hotel Paramaribo|Van Roseveltkade|80|190|https://www.queenshotelsuriname.com/|市区酒店候选，适合按位置与实际房型比较预算。''')

add(('montevideo','蒙得维的亚','Montevideo','UY','乌拉圭','UYU',-34.9011,-56.1645,'MVD',3,
 '老城艺术、港口烤肉、马黛茶与Candombe鼓声，沿拉普拉塔河岸展开悠闲的城市生活。',
 '老城与中心区可步行，海岸各街区用公交或车辆衔接；河岸范围很长，不把整条Rambla按短距离计算。'),
 '''独立广场|Plaza Independencia Montevideo|Plaza Independencia|-34.906|-56.2|60|0|0|从城门遗存、纪念空间与周边建筑理解旧城和新城连接。
索利斯剧院|Solis Theatre|Solís Theatre|-34.908|-56.201|90|5|20|剧院导览与观看演出是不同项目，按开放场次单独安排。
托雷斯加西亚博物馆|Torres Garcia Museum|Torres García Museum|-34.907|-56.204|100|5|15|围绕乌拉圭艺术家的作品与观念展开参访，特展与开放时间先查。
港口市场|Mercado del Puerto|Mercado del Puerto|-34.906|-56.214|90|0|0|历史市场建筑中聚集烤肉餐馆，进入与用餐费用分开理解。
罗多公园|Parque Rodo|Parque Rodó|-34.916|-56.166|120|0|0|公园、湖与附近河岸适合留出轻松的半日，游乐设施另计。''',
 '''Candombe鼓乐文化|Candombe music encounter|Candombe|-34.912|-56.183|120|10|35|culture|在Barrio Sur或Palermo寻找公开演出或课程，排练和节庆日期需提前核对。
河岸马黛茶午后|Rambla mate afternoon|Mate (drink)|-34.92|-56.15|120|0|12|food|沿合适的河岸路段停坐，体验携带热水与马黛茶的日常习惯，租借或购买饮具另计。
乌拉圭丹娜葡萄酒|Tannat wine tasting|Tannat|-34.81|-56.22|240|45|100|food|预约近郊酒庄品鉴并安排往返车，酒款和午餐是否包含以套餐为准。''',
 '''奇维托牛肉三明治|Chivito|Chivito|8|18|市区快餐与咖啡馆|薄牛肉片搭多种配料的三明治，也有盘装版本，份量通常较大。
乌拉圭烤肉|Asado|Asado|15|35|Mercado del Puerto烤肉馆|按肉种、重量与拼盘人数比较费用，沙拉和饮料通常另点。
法伊纳鹰嘴豆饼|Faina|Farinata|3|8|披萨店与小餐馆|鹰嘴豆粉烤成薄饼，可单吃或与披萨搭配。
炸面饼|Tortas fritas|Torta frita|1|4|街头小吃与面包店|面团炸成扁饼，常配马黛茶，适合少量试吃。
焦糖奶酱饼干|Alfajores|Alfajor|1|5|面包糕点店|两片饼干夹焦糖奶酱，外层可裹巧克力或椰丝。''',
 '''Sofitel Montevideo Casino Carrasco & Spa|Carrasco|200|480|https://all.accor.com/hotel/7969/index.en.shtml|历史海滨建筑中的高端酒店，离老城较远需另计交通。
Alma Historica Boutique Hotel|Ciudad Vieja|130|280|https://www.almahistoricahotel.com/|老城Zabala广场附近的小型酒店，适合历史街区停留。
Don Boutique Hotel Montevideo|Mercado del Puerto附近|90|210|https://www.donhotelmontevideo.com.uy/|港口市场旁的小型酒店，适合搭配老城餐饮路线。
Hyatt Centric Montevideo|Pocitos|150|330|https://www.hyatt.com/hyatt-centric/en-US/mvdhy-hyatt-centric-montevideo|Pocitos河岸酒店，可结合散步与现代街区餐饮。
Hotel Montevideo|Pocitos|150|350|https://www.hotelmvd.com/|Pocitos区域设计酒店，适合偏爱街区生活和餐饮的人。''')

add(('caracas','加拉加斯','Caracas','VE','委内瑞拉','VES',10.4806,-66.9036,'CCS',3,
 '山谷城市兼具现代主义大学建筑、独立历史与玉米饮食文化；参访计划需先核对当前条件。',
 '不自动加入日常观光路线；机场接驳、场馆开放和城内移动需核对当前官方建议与运营状态。'),
 '''加拉加斯大学城|Ciudad Universitaria de Caracas|University City of Caracas|10.49|-66.89|150|0|15|现代建筑、公共艺术与热带校园空间结合，内部参访范围须向管理方确认。
玻利瓦尔广场|Plaza Bolivar Caracas|Plaza Bolívar, Caracas|10.506|-66.915|60|0|0|历史核心区的公共广场与周边建筑承载独立历史，通行按当地安排。
玻利瓦尔故居|Birthplace of Simon Bolivar|Birthplace of Simón Bolívar|10.504|-66.915|75|0|10|以住宅空间理解历史人物与城市背景，不能默认馆藏和展厅当前开放。
加拉加斯美术馆|Museo de Bellas Artes Caracas|Museo de Bellas Artes (Caracas)|10.501|-66.897|120|0|10|艺术馆与邻近文化设施形成城市文化片区，展览和开放状态需确认。
瓦拉伊拉雷帕诺山地|Waraira Repano|El Ávila National Park|10.54|-66.86|240|10|50|山地构成城市北侧背景，步道、缆车与观景设施不能视为一个统一开放项目。''',
 '''委内瑞拉玉米饼烹饪|Venezuelan arepa cooking|Arepa|10.49|-66.88|150|20|50|food|通过正规课程认识玉米面团与不同馅料，场所和活动可用性需确认。
大学城艺术与建筑解读|Campus art and architecture|University City of Caracas|10.49|-66.89|150|15|40|culture|围绕建筑和公共艺术理解现代主义校园，限管理方允许的路线。
委内瑞拉可可品鉴|Venezuelan cacao tasting|Chocolate|10.497|-66.857|90|15|40|food|由正式商家讲解不同产地与烘焙风味，具体品鉴场次、食材和售价需另核实。''',
 '''阿雷帕玉米饼|Arepa|Arepa|3|9|市区arepera餐馆|玉米面饼剖开夹肉、豆、奶酪或其他馅料，价格随馅料而变。
克里奥尔拼盘|Pabellon criollo|Pabellón criollo|7|18|委内瑞拉家常菜餐馆|米饭、黑豆、手撕肉与食蕉组成典型拼盘。
卡查帕甜玉米饼|Cachapa|Cachapa|4|12|玉米饼餐馆|鲜玉米做成较厚煎饼，常夹软奶酪，咸甜口感相互平衡。
特克尼奥奶酪卷|Tequenos|Tequeño|3|8|咖啡馆与小吃店|面皮包奶酪后炸制，适合按小份或拼盘试吃。
委内瑞拉恩帕纳达|Venezuelan empanada|Empanada|2|6|早餐铺与小吃餐馆|玉米面皮包馅后油炸，肉、鱼或奶酪版本不同。''',
 '''JW Marriott Hotel Caracas|El Rosal|170|400|https://www.marriott.com/en-us/hotels/ccsjw-jw-marriott-hotel-caracas/overview/|El Rosal酒店候选，当前接待与交通需直接确认。
Renaissance Caracas La Castellana Hotel|La Castellana|160|380|https://www.marriott.com/en-us/hotels/ccsbr-renaissance-caracas-la-castellana-hotel/overview/|La Castellana区域酒店，具体房态与设施状态须查询。
Cayena Caracas|La Castellana|250|600|https://www.hotelcayena.com/|小型高端酒店候选，预算不代表当前可预订价格。
Eurobuilding Hotel & Suites Caracas|Chuao|130|300|https://www.hoteleuro.com/|商务区酒店候选，需从酒店官网选择加拉加斯分店。
Hotel Chacao Suites|Chacao|90|220|https://hotelchacaosuites.com/|Chacao区域套房型酒店候选，当前营业及服务直接确认。''')

EXTRA_SIGHTS = {
 'port-sudan': '''翁布里亚号沉船资料点|Umbria wreck|SS Umbria|19.637|37.253|240|120|300|红海航运与二战沉船历史的资料点；深度、潜水资质与海上交通均不确认可开展。
沙阿布鲁米珊瑚礁|Shaab Rumi reef|Shaab Rumi|19.951|37.404|480|180|450|离岸珊瑚与海洋探索史相关的资料点，不作为默认可预订的潜水项目。''',
 'addis-ababa': '''阿杜瓦胜利纪念馆|Adwa Victory Memorial|Adwa Victory Memorial Museum|9.035|38.752|120|10|30|围绕阿杜瓦战役与民族历史展开的纪念展馆，票种、开放与展区先核实。
民族学博物馆|Ethnological Museum Addis Ababa|Ethnological Museum (Addis Ababa)|9.046|38.758|120|5|20|大学园区内的民族学展陈可补充不同社群的生活文化，校园准入与馆舍开放需确认。''',
 'windhoek': '''温得和克城市博物馆|Windhoek City Museum|Windhoek|-22.573|17.089|90|0|5|聚焦城市变迁、旧住区记忆与当代生活，适合补充国家历史展陈。
纳米比亚国家植物园|National Botanic Garden of Namibia|National Botanic Garden of Namibia|-22.572|17.098|90|0|5|从本土植物认识高地干旱环境，选择开放步道并避开炎热时段。''',
 'maputo': '''铁屋|Casa de Ferro Maputo|Casa de Ferro|-25.969|32.574|45|0|5|金属构造建筑反映热带城市的设计实验，外观参观和内部开放需分开判断。
马普托主教座堂|Maputo Cathedral|Maputo Cathedral|-25.968|32.575|45|0|5|白色现代教堂与城市广场相邻，礼拜期间尊重宗教使用。''',
 'livingstone': '''维多利亚瀑布野外博物馆|Victoria Falls Field Museum|Victoria Falls Field Museum|-17.923|25.861|60|3|12|通过河流沉积与地方遗存认识瀑布地质背景，需确认馆舍开放，园票是否已包含另查。
马拉姆巴市场|Maramba Market|Livingstone, Zambia|-17.824|25.863|75|0|0|蔬果、布料和生活用品体现瀑布城的日常，消费与摄影先询问商贩。''',
 'juba': '''杰贝尔库朱尔山|Jebel Kujur|Jebel Kujur|4.808|31.555|180|10|40|朱巴附近山地地标，仅作地理文化资料；登山路线、许可和安全不确认。
诸圣主教座堂|All Saints Cathedral Juba|All Saints Cathedral, Juba|4.836|31.599|45|0|5|教会与城市社群生活相关的宗教空间，是否接待访客须先核实。''',
 'maun': '''恩加米湖|Lake Ngami|Lake Ngami|-20.48|22.725|300|20|80|马翁西南的季节性湖区，观鸟和景观随水情变化，需要另排车辆往返。
绍罗贝村与手工艺|Shorobe village|Shorobe|-19.758|23.618|150|10|35|马翁东北的聚落以编篮等地方生活文化为参访线索，合作社或社区访问须事先联系。''',
 'antananarivo': '''狐猴公园|Lemurs Park|Lemurs' Park|-18.942|47.358|180|10|25|近郊植物与狐猴观察园区，不喂食或触摸动物，门票与接驳分别安排。
钦巴扎扎植物与动物园|Tsimbazaza Park|Tsimbazaza Zoo|-18.931|47.528|150|3|12|以植物、自然史与动物展示认识岛屿生态，部分区域维护或关闭需核对。''',
 'mogadishu': '''索马里国家博物馆资料点|National Museum of Somalia|National Museum of Somalia|2.038|45.341|90|0|10|国家文化收藏与博物馆历史的资料入口，不推断馆藏现状或对外开放。
阿尔巴鲁昆清真寺|Arba a Rukun Mosque|Arba'a Rukun Mosque|2.037|45.342|45|0|5|历史宗教建筑体现班纳迪尔沿海文化，参访、拍摄和进入许可须重新确认。''',
 'victoria-falls': '''贾富塔遗产中心|Jafuta Heritage Centre|Victoria Falls, Zimbabwe|-17.927|25.837|75|0|10|Elephant's Walk内的小型文化收藏空间，可补充对肖纳、恩德贝莱与汤加文化的认识。
维多利亚瀑布私人保护区|Victoria Falls Private Game Reserve|Victoria Falls, Zimbabwe|-18.012|25.8|240|90|180|镇外私人保护区仅通过批准的导游活动访问，游猎费用与动物出现均需分别确认。''',
 'kampala': '''纳米伦贝主教座堂|Namirembe Cathedral|Namirembe Cathedral|0.316|32.559|60|0|10|山丘上的教堂与城市历史相连，礼拜和旅游参观时段须分开。
卡巴卡湖|Kabakas Lake|Kabaka's Lake|0.297|32.567|75|0|5|Mengo附近人工湖与布干达历史相关，可从获准岸线了解景观，不安排游泳。''',
 'accra': '''杜波依斯泛非文化中心|W E B Du Bois Centre|W. E. B. Du Bois Memorial Centre for Pan African Culture|5.581|-0.168|90|5|15|通过纪念空间与展陈了解杜波依斯及泛非思想，导览和开放先确认。
艺术家联盟画廊|Artists Alliance Gallery|Artists Alliance Gallery|5.562|-0.143|90|0|10|浏览加纳绘画、雕塑与织物，展览和购买作品的费用分开考虑。''',
 'tunis': '''贝尔维德公园|Belvedere Park Tunis|Belvedere Park (Tunis)|36.827|10.176|90|0|5|市区绿地适合调整参观节奏，动物园或收费设施不包含在公共园路预算中。
达尔本阿卜杜拉博物馆|Dar Ben Abdallah Museum|Dar Ben Abdallah|36.794|10.172|90|3|10|历史宅邸与生活文化收藏呈现城市家庭空间，馆舍是否开放需先确认。''',
 'asmara': '''阿斯马拉大清真寺|Great Mosque of Asmara|Great Mosque of Asmara|15.339|38.94|45|0|5|清真寺与周边市场共同构成城市宗教空间，内部访问依礼仪和许可。
厄立特里亚国家博物馆|National Museum of Eritrea|National Museum of Eritrea|15.329|38.928|90|3|12|考古与历史收藏补充对国家背景的认识，展厅与摄影规定先核对。''',
 'lilongwe': '''昆巴利近郊自然区|Kumbali Game Farm|Lilongwe|-13.955|33.851|180|30|80|由经营者安排的近郊野生动物观察区域，预约、接驳和进入范围须确认。
崇戈尼岩画远足|Chongoni rock art excursion|Chongoni Rock Art Area|-14.293|34.279|420|50|130|近代扎的世界遗产岩画散布山林，需当地向导与整日往返，不作为市内短停留点。''',
 'la-paz': '''基利基利观景台|Mirador Killi Killi|Killi Killi|-16.496|-68.122|60|0|0|在城市山坡观察山谷建筑层次，前往有坡度，高原初到不宜急行。
国家民族与民俗博物馆|National Museum of Ethnography and Folklore|National Museum of Ethnography and Folklore|-16.494|-68.136|120|3|10|面具、纺织与民俗展陈帮助理解玻利维亚多元文化，展览可能轮换。''',
 'asuncion': '''曼萨纳德拉里韦拉文化中心|Manzana de la Rivera|Manzana de la Rivera|-25.277|-57.64|90|0|5|由多座历史建筑组成的文化空间，适合查看当日展览与城市记忆。
亚松森植物园|Botanical Garden of Asuncion|Botanical Garden and Zoo of Asunción|-25.243|-57.58|150|0|5|林地与公共园路适合认识首都的绿色空间，动物设施与展馆开放另核对。''',
 'georgetown': '''乌马纳亚纳|Umana Yana|Umana Yana|6.825|-58.162|60|0|5|以原住民建筑传统为基础的公共文化建筑，活动使用和参观需先查询。
普罗姆纳德花园|Promenade Gardens|Promenade Gardens|6.815|-58.158|60|0|0|市中心园林适合短暂休息和观察城市绿化，按当日开放安排使用。''',
 'paramaribo': '''拉拉鲁克博物馆|Lalla Rookh Museum|Lalla Rookh Museum|5.815|-55.204|90|3|10|以印度裔社群迁徙和文化为主题，参观时段或导览可能需要预约。
帕拉马里博中央市场|Central Market Paramaribo|Central Market, Paramaribo|5.822|-55.162|90|0|0|热带食材、香料与日常交易交织，按当地建议选择白天区域。''',
 'montevideo': '''乌拉圭立法宫|Palacio Legislativo Uruguay|Palacio Legislativo (Uruguay)|-34.891|-56.188|90|5|15|建筑导览可帮助认识政治与艺术空间，会议日和开放语言时段需预约核对。
世纪球场与足球博物馆|Estadio Centenario and football museum|Estadio Centenario|-34.895|-56.152|120|10|25|从球场和博物馆认识乌拉圭足球史，赛事与普通参观票不是同一项目。''',
 'caracas': '''东部公园|Parque del Este|Parque del Este|10.495|-66.843|120|0|10|城市公园展现热带景观设计，公共步道与设施状态需重新核实。
委内瑞拉国家先贤祠|National Pantheon of Venezuela|National Pantheon of Venezuela|10.513|-66.911|90|0|10|国家纪念与历史建筑空间，当前访问、仪式和展厅安排需确认。''',
}

# Replace a nested trail entry rather than count the same sanctuary twice.
for c in CITIES:
    if c['id']=='lilongwe':
        a=c['attractions'][-1]
        a.update({'id':'lilongwe-old-town-mall','name':'旧城工艺与书店街区','nameEn':'Old Town Mall crafts and books',
          'article':'Lilongwe','lat':-13.988,'lng':33.768,'description':'在旧城商业空间浏览本地工艺、地图与图书，购物花销自选，和露天食品市场是不同的停留点。',
          'image':{'url':'','sourceUrl':wiki('Lilongwe')},'price':price(0,0,SOURCES['lilongwe'])})
    for row in lines(EXTRA_SIGHTS[c['id']]):
        title,title_en,article,lat,lng,mins,lo,hi,desc=row
        item=dict(c['attractions'][0])
        item.update({'id':c['id']+'-'+slug(title_en),'name':title,'nameEn':title_en,'article':article,
          'lat':float(lat),'lng':float(lng),'durationHours':int(mins)/60,
          'durationRange':{'min':max(20,int(mins)//2),'recommended':int(mins),'max':int(int(mins)*1.5)},
          'description':desc,'priority':55,'visitRole':'optional',
          'automaticPlanning':False if int(mins)>=240 else c['automaticPlanning'],
          'image':{'url':'','sourceUrl':wiki(article)},'price':price(float(lo),float(hi),SOURCES[c['id']]),
          'sourceUrl':wiki(article),'sourceCheckedAt':None,
          'sourceReferences':[ref(wiki(article),'地点身份与图片检索线索，不核验即时开放。','encyclopedia-reference',None),
            ref(SOURCES[c['id']],'城市或遗产背景；不是此项目实时运营证明。')]})
        c['attractions'].append(item)

SPECIFIC_SOURCES = {
 'windhoek-windhoek-city-museum':'https://www.windhoekcc.org.na/windhoek-city-museum/',
 'maun-shorobe-village':'https://dailynews.gov.bw/news-detail/88423',
 'victoria-falls-jafuta-heritage-centre':'https://www.victoriafalls-guide.net/jafuta-heritage-centre.html',
 'victoria-falls-victoria-falls-private-game-reserve':'https://www.victoriafalls-guide.net/victoria-falls-private-game-reserve.html',
 'lilongwe-kumbali-game-farm':'https://www.malawitourism.com/news-blogs/nyala-join-growing-wildlife-population-at-kumbali-game-farm/',
 'lilongwe-chongoni-rock-art-excursion':'https://www.malawitourism.com/regions/central-malawi/chongoni-rock-art/',
 'lilongwe-old-town-mall':SOURCES['lilongwe'],
 'addis-ababa-adwa-victory-memorial':SOURCES['addis-ababa'],
}
CITY_ARTICLES={c['article'] for c in CITIES}
for c in CITIES:
    for a in c['attractions']:
        if a['id'] in SPECIFIC_SOURCES:
            u=SPECIFIC_SOURCES[a['id']]
            a['sourceUrl']=u
            a['sourceCheckedAt']=DATE
            a['sourceReferences'].insert(0,ref(u,'地点或服务类型背景；价格与用时仍为编辑估算，当前日期的开放须另查。',
                'tourism-reference' if 'victoriafalls-guide' in u else 'primary-source'))
        if a['article'] in CITY_ARTICLES or a['article'] in {'John Garang','Livingstone, Zambia','White Nile'}:
            a['imageScope']='nearby'
            a['imageContextNote']='图片检索范围为相关城市、地区或历史背景，不等同该具体地点的已核验实景。'
            if a['article']=='John Garang':
                a['article']='Juba'
                a['image']['sourceUrl']=wiki('Juba')
        if a['id']=='lilongwe-old-town-mall':
            a['sourceUrl']=SOURCES['lilongwe']
for e in EXPERIENCES:
    if e['kind']=='experience':
        e['localContext']=e['description']
        e['experienceType']={'food':'food-life','culture':'local-life','music':'performance'}.get(e['experienceType'],e['experienceType'])
        if any(x in e['nameEn'].lower() for x in ['music','dance','malouf','candombe']):
            e['experienceType']='performance'
        if any(x in e['nameEn'].lower() for x in ['textile','weaving','embroidery','woodcarving','lace','craft']):
            e['experienceType']='craft'
        if any(x in e['nameEn'].lower() for x in ['rhino','birding']):
            e['experienceType']='wildlife'
        e['seasonality']={'months':list(range(1,13)),'dateSpecific':True,
          'note':'全年可关注的文化或自然主题，不代表每日开行；具体日期、许可、场次、水位或天气须向组织方核对。'}
        if e['id']=='ex-addis-ababa-meskel-festival':
            e['seasonality']={'months':[9],'dateSpecific':True,'note':'梅斯克尔通常在公历9月庆祝；准确日期、仪式地点与可到访安排以当年公告为准。'}
        if e['id']=='ex-accra-homowo-festival-traditions':
            e['seasonality']={'months':[8,9],'dateSpecific':True,'note':'不同加族社区在各自日期庆祝，通常可关注8至9月；不代表期间每天有活动。'}
        e['imageScope']='nearby'
        e['imageContextNote']='相关地点或文化主题照片，具体活动场景以经营者说明为准。'
for f in FOODS:
    generic=('cuisine' in f['article'].lower() or f['article'] in {
      'Regional variations of barbecue','Coffee ceremony','Mithai','Piri piri','Ugali','Mbatata cookies',
      'Kapenta','Morogo','Samp','Bhaji'})
    if generic:
        f['photoStatus']='needs-food-photo'
        f['articleScope']='regional-food-context'
        f['image']['pendingReason']='需找到本条菜品实物照片，禁止用菜系、原料或其他菜品照片代替。'
    if f['id']=='food-georgetown-mithai':
        u='https://www.alicaspepperpot.com/crunchy-mithai-kurma/'
        f['description']='香料面团切条炸脆，再裹上结晶糖衣；圭亚那常称Mithai，也有较软版本，购买时确认种类。'
        f['sourceUrl']=u
        f['sourceCheckedAt']=DATE
        f['sourceReferences']=[ref(u,'圭亚那食谱作者提供的菜品做法与当地名称；不验证餐馆售价。','recipe-author')]

# Missing photographs stay as named placeholders; never use a generic illustration.
for city in CITIES:
    for item in city['attractions']:
        item['imagePolicy']='photograph-only'
for item in EXPERIENCES + FOODS:
    item['imagePolicy']='photograph-only'

def save():
    for folder,rows in [('expansion',CITIES),('experience-expansion',EXPERIENCES),('food-expansion',FOODS)]:
        path=ROOT/'data'/folder/(PACK+'.json')
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'cities':len(CITIES),'attractions':sum(len(c['attractions']) for c in CITIES),
        'experiences':sum(e['kind']=='experience' for e in EXPERIENCES),
        'hotels':sum(e['kind']=='hotel' for e in EXPERIENCES),'foods':len(FOODS)},ensure_ascii=False))

if __name__=='__main__':
    save()
