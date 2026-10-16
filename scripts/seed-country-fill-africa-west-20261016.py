"""Maintained West/Central/North Africa country coverage, researched 2026-10-16.

Run only this file to regenerate its three isolated seed packs. Prices are USD
editorial allowances, never live rates. Source scopes deliberately distinguish
heritage identity, regional food context and hotel existence from availability.
"""
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import quote, urlparse

ROOT = Path(__file__).resolve().parents[1]
DAY = '2026-10-16'
PACK = 'country-fill-africa-west-20261016'
CITIES, ITEMS, FOODS = [], [], []
EST = '美元编辑预算预留，非当地币种或实时商家报价；实际日期、人数、税费及服务范围另核。'

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', s).encode('ascii','ignore').decode().lower()).strip('-')
def wiki(s): return 'https://en.wikipedia.org/wiki/' + quote(s.replace(' ', '_'))
def ref(url, scope, kind='reference'):
    return {'name':urlparse(url).netloc,'url':url,'kind':kind,'scope':scope,'checkedAt':DAY}
def price(lo,hi,url,unit='person'):
    return {'low':lo,'high':hi,'currency':'USD','type':'estimate','unit':unit,'sourceUrl':url,'checkedAt':None,'note':EST}
def city(id,name,en,cc,country,local,lat,lng,iata,desc,guide,hotel_source,food_article,days=3,lodging=(45,100,220),advisory=None):
    c={'id':id,'name':name,'nameEn':en,'countryCode':cc,'country':country,'countryEn':{'CD':'Democratic Republic of the Congo','DZ':'Algeria','LY':'Libya','TD':'Chad','AO':'Angola','ML':'Mali','NE':'Niger','MR':'Mauritania','NG':'Nigeria','CF':'Central African Republic','CM':'Cameroon','CG':'Republic of the Congo','CI':"Côte d’Ivoire",'BF':'Burkina Faso','GA':'Gabon','GN':'Guinea','SN':'Senegal','BJ':'Benin','EH':'Western Sahara'}[cc],'region':'非洲','continent':'AF','currency':'USD','localCurrency':local,'lat':lat,'lng':lng,'iata':iata,'article':en,'aliases':[name,en],'contentTier':'maintained','tierReason':'补齐国家地图入口及可比较的地方文化内容','image':{'url':'','sourceUrl':wiki(en),'scope':'exact-place'},'tagline':desc,'description':desc,'tags':['地方文化','特色饮食','城市体验'],'daily':{'lodging':list(lodging),'food':[12,28,65],'transport':[8,22,65],'misc':[5,12,30]},'monthly':{'rent':[400,900,2000],'utilities':[55,110,220]},'budgetBasis':{'type':'editorial-estimate','updatedAt':DAY,'note':EST+'住宿按每间每晚；饮食交通杂项按每成人每天；月租水电按每间每月。'},'tripDuration':{'min':2,'days':days,'max':days+2,'reason':'中心城区按片区组合；海岛、远郊和节庆单独留时间。'},'planningProfile':'balanced','transportNote':'市内按实际道路距离安排正规预约车辆；不同城区不按连续步行处理。机场接驳另留时间，海岛项目需核对船期与天气。','attractions':[],'officialTourismUrl':guide,'sourceReferences':[ref(guide,'城市特色及文化地点；不支持实时开放时间或价格'),ref(hotel_source,'酒店名称与所在城市；未确认具体日期房态'),ref(wiki(food_article),'国家或区域饮食背景；店家菜单需另核')], 'guide':{'cityId':id,'intro':desc,'foodHighlights':[],'neighborhoods':[],'experienceIntro':'从音乐、手艺、饮食与自然认识城市；预约和季节限定项目需确认后再安排。'}}
    if advisory:
        country_slug,level,note,note_en=advisory
        c['travelAdvisory']={'url':'https://www.gov.uk/foreign-travel-advice/'+country_slug,'level':level,'note':note,'noteEn':note_en,'checkedAt':DAY}
        if level in ['avoid-all-travel','restricted']:
            c['automaticPlanning']=False
            c['transportNote']='此处保留城市文化资料供探索；当前旅行建议限制旅游出行，交通、准入及场所开放均须重新确认，不自动生成常规观光日。'
    c['_guide'],c['_hotel'],c['_food']=guide,hotel_source,food_article
    CITIES.append(c); return c
def places(c,text):
    for line in text.strip().split('\n'):
        name,en,lat,lng,minutes,lo,hi,article,desc=line.split('|')
        a={'id':c['id']+'-'+slug(en),'name':name,'nameEn':en,'lat':float(lat),'lng':float(lng),'coordinateAccuracy':'approximate','coordinateNote':'规划用街区级定位，入口以场馆指引为准。','durationHours':int(minutes)/60,'durationRange':{'min':max(15,int(minutes)//2),'recommended':int(minutes),'max':int(minutes)*2},'durationBasis':'editorial-estimate','category':'文化与城市风景','activityType':'culture','description':desc,'article':article,'image':{'url':'','sourceUrl':wiki(article),'scope':'exact-place' if article==en else 'related-theme'},'priority':85-len(c['attractions'])*5,'visitRole':'essential' if len(c['attractions'])<2 else 'optional','automaticPlanning':c.get('automaticPlanning',True),'sourceUrl':wiki(article),'sourceCheckedAt':None,'sourceReferences':[ref(c['_guide'],'城市文化或旅游背景；具体地点以补充百科条目核对')],'price':price(float(lo),float(hi),c['_guide'])}
        if '开放' in desc or '许可' in desc or '礼拜' in desc: a['automaticPlanning']=False
        c['attractions'].append(a)
def experiences(c,text):
    for line in text.strip().split('\n'):
        name,en,lat,lng,minutes,lo,hi,typ,article,desc,flag=line.split('|')
        remote=flag=='remote'; seasonal=flag=='seasonal'
        e={'id':'ex-'+c['id']+'-'+slug(en),'cityId':c['id'],'kind':'experience','name':name,'nameEn':en,'lat':float(lat),'lng':float(lng),'coordinateAccuracy':'approximate','coordinateNote':'体验片区定位，集合点须向运营方确认。','durationMinutes':int(minutes),'durationRange':{'min':max(30,int(minutes)//2),'recommended':int(minutes),'max':int(minutes)*2},'experienceType':typ,'description':desc,'tagline':name,'localContext':desc,'features':[{'music':'现场音乐','craft':'地方手艺','food-life':'地方饮食','nature':'自然体验','festival':'季节活动','culture':'文化体验'}.get(typ,'独特体验')],'provider':'具体场次及供应者通过来源和当地预约入口确认','address':en+', '+c['nameEn'],'sourceUrl':c['_guide'],'bookingUrl':'https://www.google.com/maps/search/?api=1&query='+quote(en+' '+c['nameEn']),'checkedAt':None,'sourceReferences':[ref(c['_guide'],'地方文化主题和地点背景；不代表已核验现售活动')],'article':article,'image':{'url':'','sourceUrl':wiki(article),'scope':'related-theme'},'imageScope':'related-theme','imageContextNote':'该文化、景观或食物主题实景，具体体验内容以预约说明为准。','automaticPlanning':c.get('automaticPlanning',True) and flag=='auto','requirements':['需先确认场次、参加资格、实际集合点及费用包含内容。'],'seasonality':{'months':list(range(1,13)),'dateSpecific':seasonal,'note':'限定活动查当年官方日历；天气及运营情况可能改变安排。'},'availabilityNote':'本条为可探索的体验方向，未确认指定日期开放和供应。','priceOptions':[dict(price(float(lo),float(hi),c['_guide']),id='planning',name='体验预算',includes=['所述体验的预算预留'],excludes=['未注明的交通、餐饮与购物'])]}
        if remote: e['accessNote']='城外或离岸项目，单独预留半天至一天及往返交通；不与市中心按步行衔接。'
        ITEMS.append(e)
def foods(c,text):
    for line in text.strip().split('\n'):
        name,en,article,lo,hi,area,desc=line.split('|')
        f={'id':'food-'+c['id']+'-'+slug(en),'cityIds':[c['id']],'name':name,'nameEn':en,'localName':en,'description':desc,'article':article,'articleScope':'dish' if article!=c['_food'] else 'regional-cuisine','image':{'url':'','sourceUrl':wiki(article),'scope':'related-theme'},'imageQuery':en+' food '+c['countryEn'],'sourceUrl':wiki(c['_food']),'sourceReferences':[ref(wiki(c['_food']),'区域饮食文化背景；非商家当日菜单')],'sourceCheckedAt':None,'sourceStatus':'reference','sourceScope':'regional-food-context','catalogOrigin':'maintained-definition','price':price(float(lo),float(hi),wiki(c['_food']),'serving'),'servingNote':'按一份或一杯预算；作为当日餐饮选择，避免与每日饮食预算重复累加。','whereByCity':{c['id']:[{'name':area,'kind':'area','sourceUrl':'https://www.google.com/maps/search/?api=1&query='+quote(c['nameEn']+' '+area+' '+en),'note':'寻味区域入口；具体店铺、食材和在售菜单需当日确认。'}]}}
        FOODS.append(f);c['guide']['foodHighlights'].append({'name':name,'description':desc})
def hotels(c,text):
    for line in text.strip().split('\n'):
        en,lat,lng,lo,hi,desc=line.split('|')
        u='https://www.booking.com/searchresults.html?ss='+quote(en+' '+c['nameEn'])
        ITEMS.append({'id':'hotel-'+c['id']+'-'+slug(en),'cityId':c['id'],'kind':'hotel','name':en,'nameEn':en,'lat':float(lat),'lng':float(lng),'coordinateAccuracy':'approximate','coordinateNote':'酒店所在街区近似定位，预订前按物业官方地址核对。','description':desc,'tagline':desc,'provider':en,'address':c['nameEn'],'sourceUrl':c['_hotel'],'bookingUrl':u,'checkedAt':None,'sourceReferences':[ref(c['_hotel'],'独立来源中的酒店名称与城市身份；不保证当前房态或服务')],'image':{'url':'','sourceUrl':c['_hotel'],'scope':'exact-place'},'imageQuery':en+' '+c['nameEn']+' hotel exterior','imageScope':'exact-place','automaticPlanning':False,'availabilityNote':'预订入口用于按名称查询；先核对物业地址、营业情况、取消条款及接送。','priceOptions':[dict(price(float(lo),float(hi),c['_hotel'],'room-night'),id='room',name='每间每晚规划预算',includes=['一间客房预算预留'],excludes=['未注明的早餐、税费与机场接送'])]})

c=city('kinshasa','金沙萨','Kinshasa','CD','刚果（金）','CDF',-4.325,15.322,'FIH','刚果河畔的伦巴音乐、当代艺术与博物馆构成金沙萨鲜明的城市文化。','https://www.unesco.org/en/creative-cities/kinshasa','https://visitrdc.org/hotels','Congolese cuisine',lodging=(70,180,380),advisory=('democratic-republic-of-the-congo','regional-restrictions','金沙萨部分城区及省内道路存在官方旅行限制；使用可靠接送，跨地区行程另核。','Official restrictions apply to parts of Kinshasa city and province; verify specific routes.'))
places(c,'''刚果国家博物馆|National Museum of the Democratic Republic of the Congo|-4.339|15.306|100|5|15|National Museum of the Democratic Republic of the Congo|通过民族器物、纺织与国家历史展陈认识刚果文化的多样性。
圣安娜大教堂|Sainte-Anne Cathedral Kinshasa|-4.308|15.309|40|0|0|Kinshasa|观察砖红色教堂外观及周边旧城尺度，礼拜和内部参观须征得同意。
洛拉倭黑猩猩保护中心|Lola ya Bonobo|-4.489|15.278|180|15|40|Lola ya Bonobo|了解获救倭黑猩猩的保护工作；位于市区以南，需预约与单独往返车辆。
金沙萨美术学院|Academie des Beaux-Arts Kinshasa|-4.326|15.296|90|0|15|Académie des Beaux-Arts (Kinshasa)|校园与展览呈现刚果雕塑和绘画，访客进入和展览开放需先确认。
独立广场与刚果河岸|Place de la Gare Kinshasa|-4.305|15.313|45|0|0|Kinshasa|在允许通行的公共区域观察河港城市空间，不拍摄军事和限制设施。''')
c['attractions'][2]['automaticPlanning']=False;c['attractions'][2]['accessNote']='远郊保护中心；单独核对路况、往返车程及预约。'
experiences(c,'''刚果伦巴现场|Congolese rumba evening|-4.316|15.294|120|15|60|music|Congolese rumba|在已确认演出日的正规音乐场地感受吉他声部与舞步；由住宿方安排往返接送。|manual
艺术工作室参观|Kinshasa artist studios|-4.326|15.296|90|10|35|craft|Art of the Democratic Republic of the Congo|预约艺术家工作室，了解回收材料、绘画与雕塑的创作方法，不假定校园每天接待访客。|manual
木薯叶与河鱼餐桌|Congolese home-style meal|-4.311|15.301|90|12|35|food-life|Congolese cuisine|在贡贝的正规刚果菜餐厅比较木薯叶、木薯团与鱼的搭配；可替代当日正餐。|auto''')
foods(c,'''木薯叶炖菜|Pondu|Cassava leaf|3|9|Gombe|木薯叶充分熟制后配米饭或木薯团，花生和棕榈油的使用随店家不同。
纸包烤鱼|Liboke de poisson|Liboké|8|22|Gombe|鱼与香料包入叶片蒸烤，点餐时确认鱼种、辣度及是否配主食。
木薯团|Chikwangue|Chikwangue|1|4|Gombe|以叶片包裹的木薯主食，口感紧实，通常配鱼或浓汁炖菜。
花生鸡肉炖菜|Moambe chicken|Moambe chicken|8|20|Gombe|以棕榈果酱为特色的鸡肉菜，实际配方可能含花生，过敏者需询问。
烤山羊肉|Ntaba|Congolese cuisine|6|18|Gombe|炭烤山羊肉常配木薯或洋葱，询问按份还是按重量计价。''')
hotels(c,'''Hilton Kinshasa|-4.304|15.307|180|400|贡贝河岸的国际品牌选择，具体景观与接送按房型核对。
Fleuve Congo Hotel|-4.305|15.272|180|450|刚果河沿岸高层酒店，适合以预约车辆串联城市地点。
Pullman Kinshasa Grand Hotel|-4.311|15.276|150|350|贡贝西部完整服务酒店，餐饮与接送服务分别确认。
Hotel Memling|-4.307|15.313|130|300|布尔瓦尔三十六月附近的历史酒店，适合中心城区停留。
Sultani Hotel|-4.317|15.290|100|250|贡贝城区的本地酒店，房型和营业状态预订前核对。''')

c=city('algiers','阿尔及尔','Algiers','DZ','阿尔及利亚','DZD',36.7538,3.0588,'ALG','白色山城沿地中海铺开，卡斯巴小巷、奥斯曼宫院与花园可组成节奏舒缓的文化旅行。','https://whc.unesco.org/en/list/565/','https://groupe-htt.dz/pdf/catalogue_presentation_htt_fr.pdf','Algerian cuisine',days=4)
places(c,'''阿尔及尔卡斯巴|Casbah of Algiers|36.783|3.060|180|0|0|Casbah of Algiers|山坡巷道连接传统住宅、庭院与清真寺，适合请熟悉社区的向导解释历史。
哈马试验花园|Botanical Garden Hamma|36.747|3.075|100|1|5|Botanical Garden Hamma|树荫大道与植物区适合午后停留，园内小路不需要赶点。
殉道者纪念碑|Martyrs Memorial Algiers|36.745|3.069|60|0|8|Martyrs' Memorial, Algiers|从山丘地标认识独立战争记忆，内部展馆与外部广场分别安排。
非洲圣母大教堂|Notre Dame d Afrique|36.800|3.043|60|0|5|Notre-Dame d'Afrique|地中海上方的山丘教堂具有醒目的穹顶，礼拜与参观时段分开。
巴尔多国家博物馆|Bardo National Museum Algiers|36.764|3.047|90|2|8|Bardo National Museum (Algiers)|在庭院式建筑中了解史前考古与民族生活，开馆日以场馆公告为准。''')
experiences(c,'''沙阿比音乐之夜|Algiers Chaabi music|36.783|3.060|120|10|40|music|Chaabi (Algeria)|选择有公开演出安排的文化场地，听曼陀林和诗词形成的城市音乐传统。|manual
铜器与卡斯巴手艺|Casbah metal craft|36.782|3.061|90|5|25|craft|Casbah of Algiers|预约小工坊观察敲打与纹饰制作，购买与手作课程另计，避免擅入民居。|manual
海景咖啡与甜点|Algiers coffee and pastries|36.777|3.061|75|4|12|food-life|Algerian cuisine|在海滨或老城正规咖啡馆尝薄荷茶与小份甜点，比较坚果、蜂蜜和橙花的味道。|auto''')
foods(c,'''库斯库斯|Couscous|Couscous|4|12|Casbah|细麦粒搭配蔬菜和炖肉，通常是一份完整正餐。
番茄麦粒汤|Chorba frik|Chorba|2|7|Alger Centre|番茄、绿小麦与香料组成热汤，肉类和辣度因店而异。
鹰嘴豆饼|Karantika|Karantika|1|4|Bab El Oued|鹰嘴豆粉烤成柔软厚饼，常夹面包，适合小份尝味。
杏仁蜜甜卷|Kalb el louz|Qalb el louz|1|5|Alger Centre|粗麦粉、糖浆与杏仁的甜点，浓甜口味适合配无糖茶。
薄层面饼|Mhadjeb|Mhadjeb|1|4|Casbah|薄面皮包裹番茄洋葱馅，现煎后当早餐或小食。''')
hotels(c,'''Hotel El Aurassi|36.779|3.054|120|280|山坡上的阿尔及尔代表性酒店，前往卡斯巴需考虑坡道。
Hotel El Djazair|36.753|3.045|100|260|穆斯塔法地区的历史花园酒店，适合偏安静的城市住宿。
Sofitel Algiers Hamma Garden|36.749|3.072|130|330|哈马花园旁的国际品牌物业，可结合植物园方向安排。
Hotel El Safir|36.775|3.061|70|160|中心城区的传统城市酒店，入住前核实当前接待及房型。
Hotel Albert Premier Algiers|36.771|3.057|60|140|市中心历史酒店，适合比较老城和海滨周边的住宿预算。''')

c=city('tripoli-libya','的黎波里','Tripoli, Libya','LY','利比亚','LYD',32.8872,13.1913,'MJI','地中海港口的旧城保留罗马遗迹、奥斯曼建筑与北非咖啡文化，可先从历史地图认识它。','https://whc.unesco.org/en/tentativelists/7020/','https://libyaadventures.com/top-hotels-in-tripoli-libya/','Libyan cuisine',advisory=('libya','restricted','官方建议避免前往的黎波里进行非必要旅行；这里提供文化资料，尚未确认场所可安全访问。','Official advice discourages non-essential travel to Tripoli; cultural listings do not confirm safe access.'))
places(c,'''马可奥勒留凯旋门|Arch of Marcus Aurelius|32.898|13.176|40|0|0|Arch of Marcus Aurelius|罗马时期石拱门嵌在旧城肌理里，适合从构件与城市层次认识历史。
红城堡|Red Castle Tripoli|32.896|13.181|90|3|12|Red Castle Museum|海港旁的城堡承载多层城市历史，博物馆内部是否开放必须单独确认。
圣玛利亚广场|Sayeda Mariam Square|32.8987|13.1760|45|0|0|Old city of Tripoli|旧城广场周边集中教堂、历史银行和领事建筑，是理解地中海交流的小尺度地点。
古尔吉清真寺|Gurgi Mosque|32.899|13.175|40|0|0|Gurgi Mosque|观察奥斯曼时期的建筑装饰，非穆斯林内部准入和礼拜时段须确认。
烈士广场|Martyrs Square Tripoli|32.896|13.181|40|0|0|Martyrs' Square, Tripoli|从开放公共区域认识旧城入口与城市广场，政治集会期间不安排访问。''')
experiences(c,'''旧城铜器与皮革手艺|Tripoli souk crafts|32.898|13.177|90|5|25|craft|Old city of Tripoli|在确认安全与接待条件后由当地向导介绍老市场工艺，观察与购物分开计费。|manual
利比亚咖啡与甜点|Tripoli coffee tradition|32.896|13.180|75|3|12|Libyan cuisine|浓咖啡、小杯茶和甜点是认识港口日常的一种方式，先确认正规店铺与往返安排。|manual
利比亚家常餐桌|Libyan shared table|32.890|13.188|90|10|30|food-life|Libyan cuisine|通过共同分享炖菜与面食了解本地饮食，活动为文化目录而非现成可订套餐。|manual'''.replace('|Tripoli coffee tradition|32.896|13.180|75|3|12|Libyan cuisine|','|Tripoli coffee tradition|32.896|13.180|75|3|12|food-life|Libyan cuisine|'))
foods(c,'''巴津大麦团|Bazin|Bazin (bread)|5|15|Old City|大麦面团配浓汁、肉和蔬菜，通常多人分享，先问份量。
利比亚番茄意面|Mbakbaka|Mbakbaka|4|12|Central Tripoli|意面与番茄、香料同锅煮，肉类可按店家选择。
阿西达甜面团|Asida|Asida|2|7|Old City|柔软面团搭配蜂蜜或糖浆，可作为小份甜点。
利比亚辣味汤|Shorba|Chorba|2|6|Central Tripoli|以番茄和香料为底的热汤，具体肉类与谷物按店家做法变化。
椰枣粗麦甜点|Makroudh|Makroudh|1|5|Old City|粗麦粉面皮包椰枣馅后浸糖浆，配咖啡可减少单独点大份甜食。''')
hotels(c,'''Corinthia Tripoli|32.895|13.168|170|400|靠近旧城的国际品牌酒店，预订和安全接送均须重新确认。
Radisson Blu Al Mahary Hotel|32.902|13.197|150|340|海滨完整服务酒店；目录收录不代表当前旅行条件适宜。
Al Waddan Hotel|32.892|13.193|100|240|历史城市酒店，入住前直接核实营业与预约要求。
Awal Hotel|32.889|13.184|80|180|中心城区的商务酒店，具体房态以书面确认的信息为准。
Thobacts Hotel|32.889|13.179|70|170|市中心酒店选择，安全安排与取消条款需提前核对。''')

c=city('ndjamena','恩贾梅纳',"N'Djamena",'TD','乍得','XAF',12.1348,15.0557,'NDJ','沙里河边的首都连接萨赫勒市集、考古历史与多民族饮食，适合从博物馆和生活文化认识乍得。','https://www.radissonhotels.com/en-us/hotels/radisson-blu-ndjamena','https://www.google.com/travel/hotels/landingpage/n%27djamena-hotels','Chadian cuisine',advisory=('chad','restricted','官方建议避免前往恩贾梅纳进行非必要旅行；北部、边境及乍得湖部分地区限制更严。','Official advice discourages non-essential travel to N’Djamena; stricter restrictions apply elsewhere.'))
places(c,'''乍得国家博物馆|Chad National Museum|12.109|15.039|90|3|10|Chad National Museum|以考古和民族文化藏品认识乍得，馆藏展示及开放需重新确认。
民族广场|Place de la Nation N Djamena|12.108|15.044|45|0|0|N'Djamena|城市纪念空间与宽阔广场，避开集会和行政设施限制区域。
恩贾梅纳大清真寺|Grand Mosque N Djamena|12.112|15.053|45|0|0|N'Djamena|作为首都宗教地标观察建筑外观，内部准入由场所确认。
恩贾梅纳主教座堂|N Djamena Cathedral|12.111|15.045|40|0|0|N'Djamena Cathedral|认识当地基督教建筑的外观，礼拜期间避免观光打扰。
中央市场|Grand Marche N Djamena|12.116|15.055|75|0|0|N'Djamena|纺织品、香料与日常食材构成萨赫勒首都生活切面，摄影先征得同意。''')
experiences(c,'''萨赫勒织物与篮编|Chadian textiles and baskets|12.116|15.055|90|5|25|craft|Culture of Chad|由熟悉市场的当地接待者介绍织物和编织品，体验时间取决于商户接待。|manual
沙里河岸茶歇|Chari riverside tea|12.097|15.047|90|3|12|food-life|Chari River|在确认可进入的临河餐饮空间看河面与日落，不安排未经核验的游船。|manual
乍得杂粮与炖汁餐|Chadian boule meal|12.123|15.049|90|6|20|food-life|Chadian cuisine|品尝高粱或小米主食与秋葵炖汁，了解牧业和河流食材对城市餐桌的影响。|manual''')
foods(c,'''杂粮团与炖汁|Boule with sauce|Chadian cuisine|3|9|Central N'Djamena|小米或高粱做成主食团，与炖汁搭配食用。
秋葵炖菜|Daraba|Daraba|3|10|Central N'Djamena|秋葵与蔬菜组成的黏稠炖菜，可含花生，点餐时确认配方。
薄高粱饼|Kisra|Kisra|1|4|Central N'Djamena|发酵谷物面糊烙成薄饼，适合搭配肉汁或豆菜。
花生炖鸡|Peanut chicken stew|Chadian cuisine|6|16|Central N'Djamena|花生浓汁与鸡肉组合，含花生过敏原，肉量和配餐需确认。
洛神花饮|Karkade|Hibiscus tea|1|4|Central N'Djamena|洛神花泡制的酸甜饮品，可选热饮或密封冷饮。''')
hotels(c,'''Radisson Blu Hotel N Djamena|12.086|15.068|150|350|沙里河方向的国际酒店，访问和接送条件直接向物业核实。
Hilton N Djamena|12.082|15.079|150|350|城市东南河岸一带的酒店目录项，当前品牌与营业情况需核对。
La Residence Hotel N Djamena|12.121|15.040|90|220|城市商务酒店，适合比较接送与长期入住条款。
Hotel L Amitie N Djamena|12.111|15.033|120|300|原Ledger Plaza物业，预订时核对现行名称与接待安排。
Hotel Mercure N Djamena Le Chari|12.110|15.035|90|240|历史河岸酒店目录项，当前运营状态未确认，不作即时可订承诺。''')

c=city('luanda','罗安达','Luanda','AO','安哥拉','AOA',-8.839,13.289,'NBJ','大西洋海湾、堡垒与森巴音乐将罗安达的海港历史和当代生活连在一起。','https://www.angolatourism.org/luanda/','https://www.angolatourism.org/guides/best-hotels-in-luanda/','Angolan cuisine',days=4,lodging=(65,150,340))
places(c,'''圣米格尔堡|Fortress of Sao Miguel|-8.815|13.235|100|3|12|Fortress of São Miguel|高处堡垒可看海湾并理解殖民军事历史，展馆与外部观景分别计时。
罗安达边际海滨|Marginal de Luanda|-8.810|13.238|75|0|0|Luanda|沿海湾公共步道感受城市天际线，日落前适合短程停留。
国家人类学博物馆|National Museum of Anthropology Luanda|-8.813|13.240|90|2|8|National Museum of Anthropology (Angola)|通过器物和乐器了解安哥拉不同地区的社会生活。
安哥拉国家自然历史博物馆|National Museum of Natural History Luanda|-8.818|13.237|75|2|8|National Museum of Natural History of Angola|认识当地动物与自然环境的展陈，适合与中心城区文化地点组合。
奴隶制度国家博物馆|National Museum of Slavery|-8.990|13.091|120|3|12|National Museum of Slavery|在旧礼拜堂和相关展陈理解大西洋奴隶贸易记忆；远离市中心需单独往返。''')
c['attractions'][-1]['automaticPlanning']=False;c['attractions'][-1]['sourceUrl']='https://www.visiteluanda.com/en/locais-interesse/museu-nacional-escravatura.html'
experiences(c,'''森巴音乐与基础舞步|Semba music and dance|-8.819|13.236|120|15|45|music|Semba|预约本地舞蹈学校或有公开演出的正规场地，了解安哥拉社交舞与节奏。|manual
穆苏洛沙洲海边午后|Mussulo beach afternoon|-8.959|13.043|300|30|100|nature|Mussulo|从已确认码头搭乘合规船只前往沙洲，留足回程和天气余量，不安排为市内短暂停留。|remote
伊利亚海鲜餐与海风|Ilha seafood lunch|-8.790|13.228|120|15|45|food-life|Ilha de Luanda|在半岛餐馆按重量或份量选择熟制海鲜，海边午餐可替代当日正餐。|auto''')
foods(c,'''棕榈鸡肉炖菜|Muamba de galinha|Moambe chicken|6|18|Ilha de Luanda|棕榈果酱与鸡肉组合，常配木薯主食，辣度先确认。
木薯粉团|Funge|Funge|2|6|Ingombota|木薯或玉米粉做成的柔软主食，通常搭配炖鱼和浓汁。
豆与棕榈油炖菜|Feijao de oleo de palma|Angolan cuisine|3|9|Ingombota|豆类加入棕榈油炖制，配主食时可作一餐中的菜品。
烤海鱼|Mufete|Mufete|10|30|Ilha de Luanda|海鱼配豆类、木薯和香蕉等配菜，份量常适合分享。
香蕉甜点|Doce de banana|Angolan cuisine|2|7|Ingombota|香蕉烹制的甜食或烤香蕉，具体甜度与做法依菜单选择。''')
hotels(c,'''EPIC SANA Luanda Hotel|-8.816|13.239|180|450|市中心高层完整服务酒店，适合城市观光与商务停留。
InterContinental Luanda Miramar|-8.806|13.245|180|450|米拉马尔区域国际酒店，机场接驳至新机场另核车程。
Hotel Presidente Luanda|-8.802|13.242|130|300|海湾沿岸传统酒店，可结合海滨步道安排。
Hotel Baia Luanda|-8.818|13.221|130|320|靠近海湾西侧的酒店，去旧城需安排车辆。
Hotel Tropico|-8.815|13.236|120|280|中心城区的成熟酒店，餐饮和机场接送是否包含需确认。''')

c=city('bamako','巴马科','Bamako','ML','马里','XOF',12.639, -8.003,'BKO','尼日尔河边的乐声、泥染布与国家博物馆，展现马里在音乐和手艺上的深厚传统。','https://www.onomohotels.com/en/destination/bamako/','https://www.malibooking.com/reserver/sejours?destination=Bamako','Malian cuisine',advisory=('mali','avoid-all-travel','官方建议避免前往马里，包含巴马科；此处保留文化资料，不自动安排旅游活动。','Official advice is against all travel to Mali, including Bamako; cultural records are retained without automatic tours.'))
places(c,'''马里国家博物馆|National Museum of Mali|12.654|-7.996|100|3|10|National Museum of Mali|织物、器物和考古展陈帮助理解马里各地区文化。
马里国家公园巴马科园区|National Park of Mali|12.658|-7.996|100|2|8|National Park of Mali|城市山脚的景观园区，开放情况和安全接待需确认。
巴马科大清真寺|Bamako Grand Mosque|12.643|-7.992|45|0|0|Bamako Grand Mosque|城市宗教地标，礼拜与非穆斯林准入由管理方确认。
手工艺之家|Maison des Artisans Bamako|12.642|-7.995|90|0|0|Bamako|小作坊集中展示皮革、金属和织物制作，摄影先征询工匠。
巴马科玫瑰市场|Marche Rose Bamako|12.641|-7.994|75|0|0|Bamako|通过布料与日常贸易理解首都市场文化，访问须由可靠本地接待确认。''')
experiences(c,'''泥染布工艺|Bamako bogolan textiles|12.642|-7.995|120|10|35|craft|Bògòlanfini|了解用泥与植物染色形成几何图案的布艺，课程和作品购买费用单独核对。|manual
马里音乐聆听|Bamako live music|12.625|-8.003|120|10|40|music|Music of Mali|关注正规文化场地的公开演出，了解科拉琴与城市音乐的关联；不默认夜间外出。|manual
尼日尔河餐桌|Bamako riverside meal|12.626|-7.991|90|8|25|food-life|Malian cuisine|以熟制鱼、杂粮和花生酱菜认识河流与城市饮食，不包含未核验游船。|manual''')
foods(c,'''花生酱炖菜|Tigadegena|Peanut stew|4|12|Centre Commercial|花生浓汁配肉或蔬菜与米饭，含明确花生过敏原。
小米主食团|To|Tô|2|7|Centre Commercial|小米或高粱粉主食配酱汁，口感与米饭不同。
米与花生菜饭|Lafidi|Malian cuisine|3|9|Centre Commercial|米饭配蔬菜与花生调味的家常组合，版本因店家变化。
小米酸奶甜食|Degue|Thiakry|1|5|ACI 2000|小米颗粒与酸奶组成的甜食，乳制品应选择可靠冷藏来源。
木槿花饮|Bissap|Hibiscus tea|1|4|ACI 2000|洛神花泡制酸甜饮料，甜度可另问。''')
hotels(c,'''Azalai Hotel Bamako|12.622|-8.013|100|240|河岸片区的本地连锁酒店，安全接送需独立确认。
Radisson Collection Hotel Bamako|12.633|-8.035|160|350|ACI 2000方向的酒店，目录不代表可安全开展旅游。
ONOMO Hotel Bamako|12.633|-7.995|70|180|河流区的城市酒店，房态和服务以直接确认为准。
Grand Hotel Bamako|12.647|-7.999|90|220|中心区域传统酒店，确认物业名称、接待条件及房型。
Hotel L Amitie Bamako|12.633|-7.987|110|260|尼日尔河附近的成熟酒店，当前营业与预订安排需核对。''')

c=city('niamey','尼亚美','Niamey','NE','尼日尔','XOF',13.5128,2.1128,'NIM','尼日尔河、布布哈马博物馆与银饰工艺，提供认识萨赫勒文化的城市窗口。','https://en.wikivoyage.org/wiki/Niamey','https://www.tripadvisor.com/Hotels-g293823-Niamey-Hotels.html','Nigerien cuisine',advisory=('niger','avoid-all-travel','官方建议避免前往尼日尔，包含尼亚美；城市目录仅供文化探索，活动不自动排程。','Official advice is against all travel to Niger, including Niamey; listings are cultural references.'))
places(c,'''布布哈马国家博物馆|Boubou Hama National Museum|13.510|2.108|120|3|10|National Museum of Niger|从民族器物、建筑模型与工艺展示了解尼日尔，展馆开放需确认。
尼亚美大清真寺|Grand Mosque of Niamey|13.524|2.125|60|0|8|Grand Mosque of Niamey|城市重要宗教地标，内部和宣礼塔准入以管理人员确认为准。
尼亚美大市场|Grand Market Niamey|13.516|2.116|90|0|0|Grand Market, Niamey|布匹、香料和日用品展示城市商贸生活，摄影及参观由当地接待协调。
尼亚美大教堂|Cathedral of Our Lady of Perpetual Help Niamey|13.518|2.107|45|0|0|Cathedral of Our Lady of Perpetual Help, Niamey|将欧洲教堂形式与本地材料结合的宗教建筑，礼拜与参观分开。
肯尼迪大桥北岸|Kennedy Bridge riverbank|13.508|2.113|45|0|0|Kennedy Bridge (Niamey)|从允许停留的河岸空间观察首都与尼日尔河，不在桥面停车或拍摄限制设施。''')
experiences(c,'''图阿雷格银饰观摩|Niamey silver craft|13.510|2.108|90|5|25|craft|Tuareg people|在确认接待的工艺展示点了解银饰几何图案和工具，体验不含购买贵金属作品。|manual
尼日尔传统摔跤文化|Niger traditional wrestling|13.535|2.104|120|5|25|culture|Lutte Traditionnelle|有正式公开赛事时了解传统摔跤和助威音乐；赛程、场地与安全安排先核实。|seasonal
河岸茶与烤肉|Niamey tea and brochettes|13.506|2.107|90|5|18|food-life|Nigerien cuisine|在正规河岸餐饮空间比较萨赫勒茶饮、烤肉与杂粮主食，不包括游船。|manual''')
foods(c,'''香料烤肉串|Kilishi and suya|Suya|3|10|Plateau|烤肉或干肉以香料调味，花生粉较常见，过敏者先询问。
豆饼|Kosai|Akara|1|4|Grand Marche|豆泥炸成的小饼，适合作为早餐小食。
小米粥|Hausa koko|Hausa koko|1|4|Plateau|温热小米粥可作早餐，香料与糖量因店不同。
杂粮主食团|Tuwo|Tuwo shinkafa|2|7|Plateau|米或小米做成的软团搭配汤汁，问清所用谷物。
尼日尔河烤鱼|Grilled Niger river fish|Nigerien cuisine|5|15|Plateau|选充分熟制的淡水鱼，实际鱼种和份量按当天菜单确认。''')
hotels(c,'''Radisson Blu Hotel and Conference Center Niamey|13.508|2.109|160|350|会议中心附近的国际酒店，安全条件和接送先直接确认。
Noom Hotel Niamey|13.508|2.105|140|300|河岸区域酒店，房价和营业状态不作实时承诺。
Bravia Hotel Niamey|13.510|2.105|130|280|中心城区完整服务酒店，适合比较房型与住宿条款。
Grand Hotel du Niger|13.505|2.109|80|180|河岸传统酒店，具体接待服务须预约确认。
Hotel Terminus Niamey|13.505|2.120|70|160|特米努斯区域酒店，前往城市地点应安排可靠接送。''')

c=city('nouakchott','努瓦克肖特','Nouakchott','MR','毛里塔尼亚','MRU',18.0735,-15.9582,'NKC','彩绘渔船、沙漠茶礼与游牧手艺，让这座年轻海岸首都有清晰而独特的生活风景。','https://visitmauritania.com/nouakchott/','https://www.aeroport-nouakchott.com/hotels_nouakchott.php','Mauritanian cuisine')
places(c,'''努瓦克肖特渔港|Port de Peche Nouakchott|18.074|-16.027|90|0|0|Port de Pêche|观察彩绘船只上岸和渔业劳作，不妨碍搬运，人物摄影先获同意。
毛里塔尼亚国家博物馆|National Museum of Mauritania|18.078|-15.976|90|2|8|National Museum of Mauritania|通过工具、饰品与考古展品认识游牧生活和撒哈拉历史。
沙特清真寺|Saudi Mosque Nouakchott|18.086|-15.976|40|0|0|Saudi Mosque|市中心宗教地标，以外观参观为主，内部和礼拜空间遵照管理要求。
首都中央市场|Marche Capitale Nouakchott|18.078|-15.973|90|0|0|Nouakchott|布料、银饰与生活用品集中，适合观察沙漠和海岸贸易的交汇。
努瓦克肖特海滩|Nouakchott beach|18.096|-16.025|90|0|0|Nouakchott|在有人员活动的开放海岸看风与沙，海况复杂，不将游泳作为默认活动。''')
experiences(c,'''毛里塔尼亚三道茶|Mauritanian tea ceremony|18.098|-15.977|90|4|15|food-life|Maghrebi mint tea|在正规茶馆慢慢喝几轮小杯绿茶，了解泡沫、甜度与待客节奏。|auto
地毯与皮革工艺|Nouakchott carpets and leather|18.090|-15.979|90|5|25|craft|Culture of Mauritania|在手工艺店或接待工坊观察染色和缝制，作品价格与讲解费用分开。 |manual
渔港熟食与鱼市|Nouakchott fish market lunch|18.074|-16.027|120|8|22|food-life|Mauritanian cuisine|以渔港为认识海产的起点，选择正规餐馆做熟后享用，采购和加工费分别确认。|auto''')
foods(c,'''鱼与米饭|Thieboudienne|Thieboudienne|4|12|Port de Peche|海鱼、蔬菜与米饭的西非沿海组合，按份询价。
库斯库斯|Mauritanian couscous|Couscous|4|12|Tevragh Zeina|粗麦粒配肉汁或蔬菜，传统谷物版本依店家询问。
炖羊肉|Maru we-lham|Mauritanian cuisine|6|18|Tevragh Zeina|羊肉与米饭组成的主食菜，适合确认份量后分享。
小米乳食|Lakh|Thiakry|2|6|Tevragh Zeina|谷物与乳制品的温和甜食，选择有可靠冷藏的店家。
薄荷绿茶|Atay|Maghrebi mint tea|1|5|Tevragh Zeina|小杯甜茶是社交的一部分，不赶着一次喝完，可按偏好问糖量。''')
hotels(c,'''Azalai Hotel Nouakchott|18.086|-15.980|90|210|市中心连锁酒店，适合作为市场与博物馆的住宿基地。
Monotel Dar El Barka|18.099|-15.983|100|230|特夫拉格泽纳区酒店，机场接送和房型提前确认。
Hotel Semiramis City Center|18.095|-15.980|70|170|城市中心附近的小型酒店，适合关注位置和预算的停留。
Sunset Hotel Nouakchott|18.108|-15.984|70|170|城区酒店选项，预订时核对实际物业地址与餐食条款。
La Palma Hotel Nouakchott|18.106|-15.974|40|100|较平实的城市酒店选择，空调、热水和接送逐项确认。''')

c=city('lagos','拉各斯','Lagos','NG','尼日利亚','NGN',6.455,3.384,'LOS','艺术、Afrobeats与潟湖生活让拉各斯充满能量；把岛区按片区安排，给交通留出充分余量。','https://www.freedomparklagos.com/about.php','https://www.radissonhotels.com/en-us/destination/nigeria/lagos','Nigerian cuisine',days=4)
c['transportNote']='拉各斯岛、维多利亚岛、莱基和伊凯贾分区安排，堵车会明显改变行程；优先可靠预约车辆。海滩船只与跨潟湖交通单独确认运营及救生条件。'
places(c,'''莱基自然保护中心|Lekki Conservation Centre|6.441|3.535|150|8|25|Lekki Conservation Centre|在湿地和林地步道观察城市生态，树冠步道开放、年龄与身体条件另核。
耐克艺术画廊|Nike Art Gallery Lagos|6.431|3.459|90|0|15|Nike Art Gallery|多层艺术空间展示绘画、雕塑和纺织，拍摄及收费导览规则以现场为准。
自由公园|Freedom Park Lagos|6.448|3.396|90|2|10|Freedom Park, Lagos|旧监狱转型的文化公园，可结合展览与公开演出，活动票另计。
尼日利亚国家博物馆|Nigerian National Museum|6.445|3.403|90|3|12|Nigerian National Museum|民族器物与历史展陈帮助认识多元尼日利亚，馆藏与摄影规定现场确认。
塔夸湾海滩|Tarkwa Bay Beach|6.397|3.394|240|10|40|Tarkwa Bay Beach|离岸海滩适合留出半天，需合规船只和回程安排，海况不佳取消。''')
c['attractions'][0]['sourceUrl']='https://ncfnigeria.org/our-centers/';c['attractions'][-1]['automaticPlanning']=False
experiences(c,'''Afrobeat现场音乐|Lagos Afrobeat live|6.621|3.356|150|10|40|music|New Afrika Shrine|查New Afrika Shrine等正规场地公开节目，往返车辆和散场时间先确认。|manual
约鲁巴蓝染手作|Adire textile workshop|6.431|3.459|120|20|65|craft|Adire|预约接待访客的艺术工坊认识防染纹样；材料、课程语言与作品能否带走单独核对。|manual
维多利亚岛苏亚晚餐|Victoria Island suya evening|6.428|3.421|90|8|25|food-life|Suya|在正规烤肉店尝香料烤串与配菜，花生粉是常见过敏原，可替代当日晚餐。|auto''')
foods(c,'''乔洛夫饭|Jollof rice|Jollof rice|3|10|Victoria Island|番茄香料饭搭配鸡肉或鱼，辣度和配菜另问。
苏亚烤串|Suya|Suya|3|12|Victoria Island|牛肉或鸡肉串撒香料和常见花生粉，按串或份计价。
蒸豆糕|Moi moi|Moin moin|2|6|Lekki Phase 1|豆泥蒸成软糕，可能包含鱼、蛋或虾，点餐时确认。
瓜籽炖汤|Egusi soup|Egusi soup|4|12|Victoria Island|磨碎瓜籽与蔬菜、肉或鱼煮成浓汤，常配木薯主食。
炸面球|Puff puff|Puff-puff|1|4|Lagos Island|发酵面团炸成的小球，适合少量现炸品尝。''')
hotels(c,'''Radisson Blu Anchorage Hotel Lagos|6.437|3.416|150|350|维多利亚岛潟湖沿岸酒店，适合岛区活动基地。
Radisson Blu Hotel Lagos Ikeja|6.584|3.359|130|290|伊凯贾地区国际酒店，适合机场方向，前往岛区另留堵车时间。
Radisson Hotel Lagos Ikeja|6.587|3.358|100|250|伊凯贾城市酒店，适合比较机场交通与城市停留成本。
Park Inn by Radisson Serviced Apartments Lagos Victoria Island|6.430|3.431|100|240|维多利亚岛服务式住宿，是否配厨房及长住条款需逐房型确认。
Eko Hotel and Suites|6.426|3.430|140|350|维多利亚岛大型酒店群，预订时区分楼栋与房型。''')

c=city('bangui','班吉','Bangui','CF','中非共和国','XAF',4.3947,18.5582,'BGF','乌班吉河岸、木雕与桑戈语文化是班吉的重要线索；城市目录保留这些独特生活内容。','https://en.wikivoyage.org/wiki/Bangui','https://en.wikipedia.org/wiki/Bangui','Central African Republic cuisine',advisory=('central-african-republic','restricted','官方建议避免前往班吉进行非必要旅行，其余多数地区为避免所有旅行；场馆开放尚未确认。','Official advice discourages non-essential travel to Bangui and all travel to most other areas; access is unconfirmed.'))
places(c,'''博干达国家博物馆|Boganda National Museum|4.361|18.582|90|3|10|Boganda National Museum|历史建筑中的器物与民族文化展陈，内部开放须与当地接待确认。
班吉圣母大教堂|Notre Dame of Bangui Cathedral|4.365|18.577|45|0|0|Notre-Dame of Bangui Cathedral|红砖立面与宗教生活构成城市记忆，礼拜和观光时间分开。
班吉市中心市场|Marche Central Bangui|4.365|18.575|75|0|0|Bangui|认识本地食材、织物与小商品贸易，人物摄影先获得同意。
乌班吉河公共岸线|Ubangi riverside Bangui|4.360|18.586|60|0|0|Ubangi River|从确认可进入的公共区域观察河流与对岸，不安排未经核验的乘船活动。
PK0城市中心|PK0 Bangui|4.363|18.578|40|0|0|Bangui|理解首都中心路网和商业生活的小尺度停留点，避开行政与安保设施。''')
experiences(c,'''中非木雕与篮编|Bangui wood carving and baskets|4.364|18.576|90|5|25|craft|Culture of the Central African Republic|由可靠接待者介绍木雕和编织品，选可合法携带的材料，不购买野生动物制品。|manual
桑戈语与城市音乐|Bangui Sango music culture|4.370|18.580|90|10|30|music|Music of the Central African Republic|预约文化机构的公开项目，了解城市音乐与语言，不将私人仪式当作随时开放表演。|manual
木薯叶与河鱼午餐|Bangui cassava and fish lunch|4.364|18.581|90|7|20|food-life|Central African Republic cuisine|熟制河鱼、木薯叶和主食组成一餐，了解雨林与河流如何影响本地饮食。|manual''')
foods(c,'''木薯叶炖菜|Koko cassava leaves|Central African Republic cuisine|3|8|Centre Ville|叶菜充分熟制后配主食，花生或棕榈油使用需问店家。
木薯主食团|Gozo|Fufu|2|6|Centre Ville|木薯粉做成主食，与浓汁和熟制鱼搭配。
棕榈酱鸡肉|Poulet moambe|Moambe chicken|6|18|Centre Ville|棕榈果酱鸡肉炖菜，部分做法含花生，过敏者先问。
烤大蕉|Grilled plantain|Cooking banana|1|4|Centre Ville|大蕉切片烤制或煎炸，可作配菜或小食。
乌班吉河烤鱼|Grilled Ubangi fish|Central African Republic cuisine|5|16|Riverside|按当日鱼种选择熟制河鱼，确认是否按重量和另收加工费。''')
hotels(c,'''Ledger Plaza Bangui|4.383|18.584|160|330|完整服务酒店，直接确认安全接送、营业和房态。
Oubangui Hotel|4.361|18.588|80|190|乌班吉河岸的传统酒店，当前接待条件需重新核验。
JM Residence Bangui|4.374|18.574|90|210|班吉城市住宿选择，预订时确认具体地址和服务范围。
Hotel du Centre Bangui|4.366|18.578|70|170|中心城区酒店目录项，未确认当前营业和可预订日期。
Hotel Somba Bangui|4.372|18.579|60|150|本地小型酒店目录项，需可靠当地接待先核实营业与房型。''')

c=city('yaounde','雅温得','Yaoundé','CM','喀麦隆','XAF',3.848,11.502,'NSI','山丘之间的博物馆、手工艺与喀麦隆家常菜，让雅温得适合放慢脚步认识中非城市生活。','https://www.minpmeesa.cm/site/inhoud/uploads/2024/07/guidesiarc2024.pdf','https://www.anor.cm/documents/hotels.pdf','Cameroonian cuisine')
places(c,'''喀麦隆国家博物馆|National Museum of Cameroon|3.856|11.516|120|3|12|National Museum of Cameroon|在原总统府建筑内认识民族器物与国家历史，参观动线按馆方安排。
统一纪念碑|Reunification Monument Yaounde|3.847|11.510|60|0|5|Reunification Monument (Cameroon)|螺旋结构与雕塑呈现国家统一主题，适合与国家博物馆同区安排。
姆沃格贝齐动物园|Mvog Betsi Zoo|3.858|11.482|100|3|10|Mvog-Betsi Zoo|以自然教育视角了解当地动物，访客开放和动物展示状况须确认。
圣母胜利大教堂|Our Lady of Victories Cathedral Yaounde|3.866|11.520|45|0|0|Our Lady of Victories Cathedral, Yaoundé|城市中心的现代宗教建筑，礼拜时段避免打扰。
蒙菲贝山|Mont Febe|3.909|11.487|150|0|15|Mont Fébé|从山丘方向观察城市与植被，往返需要车辆，林间路线应先确认。''')
c['attractions'][-1]['automaticPlanning']=False
experiences(c,'''埃通迪编织与木雕|Yaounde craft makers|3.870|11.514|120|10|35|craft|Culture of Cameroon|预约有接待能力的手作工坊，比较织物、珠饰和木雕的地方风格。|manual
比库齐音乐与舞步|Bikutsi music evening|3.888|11.511|120|10|35|music|Bikutsi|查看文化场地的公开演出，了解贝蒂文化的节奏与舞蹈；返程交通提前约好。|manual
本地菜馆家常午餐|Yaounde Cameroonian lunch|3.872|11.518|90|6|18|food-life|Cameroonian cuisine|把苦叶炖菜、木薯或大蕉组合成一餐，先询问鱼干、花生及甲壳类配料。|auto''')
foods(c,'''苦叶花生炖菜|Ndole|Ndolé|5|14|Bastos|苦叶、花生与肉或虾组成浓香炖菜，过敏原较多需问清。
发酵木薯卷|Bobolo|Bobolo|1|4|Centre Ville|叶片包裹的发酵木薯主食，常配烤鱼或酱菜。
香蕉叶包鱼|Ndomba|Ndomba|6|18|Bastos|鱼和调味料包入叶片蒸煮，适合搭配木薯主食。
烤鱼与辣酱|Poisson braise|Cameroonian cuisine|6|20|Bastos|现烤鱼常配洋葱与辣酱，按重量或份量先问价。
花生叶包|Koki|Koki (food)|2|7|Centre Ville|豆泥与棕榈油叶包蒸制，并非所有做法都用花生，原料请按菜单确认。''')
hotels(c,'''Hilton Yaounde|3.865|11.518|150|350|市中心国际酒店，适合文化场馆和商务区域。
Hotel Mont Febe|3.908|11.486|100|240|山丘酒店，可看城市景观，去中心城区需车辆。
Hotel La Falaise Yaounde|3.868|11.514|100|230|中心城区酒店，适合步行片区与车程组合的行程。
Djeuga Palace Hotel|3.875|11.517|90|210|城市商务酒店，餐饮、机场接送与房型分别核价。
Hotel Merina Yaounde|3.865|11.519|80|190|中心商业区酒店，预订时确认房间朝向与早餐条款。''')

c=city('brazzaville','布拉柴维尔','Brazzaville','CG','刚果（布）','XAF',-4.263,15.242,'BZV','刚果河对岸的音乐之城，以圣安娜绿瓦屋顶、波托波托绘画和伦巴文化形成自己的节奏。','https://ambacongo-us.org/en/about-congo/visit-congo/what-to-do','https://www.afro.who.int/sites/default/files/2019-07/AFR-RC69-INF-01%20Bulletin%20d%27information%20Congo.pdf','Congolese cuisine',lodging=(55,130,280))
places(c,'''刚果圣安娜大教堂|Basilica of Sainte Anne du Congo|-4.265|15.277|60|0|5|Basilica of Sainte-Anne-du-Congo|绿瓦屋顶与现代建筑形式鲜明，礼拜时段不安排观光打扰。
萨沃尼昂德布拉扎纪念馆|Pierre Savorgnan de Brazza Memorial|-4.269|15.281|90|3|12|Pierre Savorgnan de Brazza Memorial|通过展览了解城市名称来源与殖民历史，也可思考当地视角的历史叙述。
波托波托绘画学校|Poto Poto painting school|-4.267|15.272|90|0|15|Poto-Poto School of Painting|观察刚果绘画中的人物、色彩与城市生活，工作室接待需先确认。
皮埃尔萨沃尼昂河岸步道|Brazzaville Corniche|-4.283|15.272|75|0|0|Brazzaville|从开放河岸看刚果河与对岸城市，白天短程停留便于安排。
圣心大教堂|Sacred Heart Cathedral Brazzaville|-4.279|15.262|45|0|0|Sacred Heart Cathedral, Brazzaville|高处宗教建筑与周边城市景观可组合，内部参观遵循管理规定。''')
experiences(c,'''伦巴与音乐场地|Brazzaville rumba music|-4.276|15.269|120|10|35|music|Congolese rumba|在公开演出日聆听音乐之城的吉他与人声，场次及交通由正规场地确认。|manual
萨普文化与服饰|Sape style and tailoring|-4.293|15.258|120|10|35|culture|La Sape|预约服装店或文化向导认识西装、配饰与城市身份，不将路人当作免费表演者。|manual
波托波托绘画体验|Poto Poto painting workshop|-4.267|15.272|120|15|45|craft|Poto-Poto School of Painting|在确认接待的画室了解构图和色彩，课程与带走作品按预约条款另核。|manual''')
foods(c,'''木薯叶炖菜|Saka saka|Cassava leaf|3|9|Centre Ville|木薯叶充分熟制后搭配鱼与主食，花生和棕榈油配方先问。
叶包木薯|Chikwangue|Chikwangue|1|4|Poto Poto|叶片包裹的木薯主食，适合配烤鱼或浓汁。
纸包鱼|Liboke|Liboké|6|18|Centre Ville|鱼和香料以叶片包裹蒸烤，确认鱼种和份量。
棕榈鸡肉|Poulet moambe|Moambe chicken|6|18|Centre Ville|鸡肉配棕榈果酱炖煮，花生版本需额外留意过敏原。
刚果烤肉串|Brochettes congolaises|Congolese cuisine|3|10|Poto Poto|牛肉或羊肉串配洋葱和辣酱，优先选择现场充分烹熟的店家。''')
hotels(c,'''Radisson Blu M Bamou Palace Hotel|-4.270|15.283|160|350|刚果河沿岸的国际酒店，部分房型可看河景。
Olympic Palace Hotel|-4.269|15.268|110|250|中心城区成熟酒店，适合作为文化地点的住宿基地。
Pefaco Hotel Maya Maya|-4.249|15.254|130|280|机场附近的完整服务酒店，前往河岸另留车程。
Mikhael s Hotel|-4.263|15.275|100|240|圣安娜附近的城市酒店，适合波托波托方向。
Hotel Amaritsah|-4.276|15.267|80|190|城市酒店选项，房态与接送直接向物业确认。''')

c=city('abidjan','阿比让','Abidjan','CI','科特迪瓦','XOF',5.360,-4.008,'ABJ','潟湖、现代建筑与马基餐馆构成阿比让的城市表情，艺术和街头餐桌比赶景点更能说明它。','https://tourismecotedivoire.ci/wp-content/uploads/2023/12/Travel-Guide.pdf','https://adfi-ci.org/oga25/','Ivorian cuisine',days=4)
c['transportNote']='高原、科科迪、特雷什维尔和马科里跨桥连接，高峰期留足车程；班科森林单独安排半天。潟湖船只须核对运营、安全与回程，非默认市内步行。'
places(c,'''圣保罗大教堂|St Pauls Cathedral Abidjan|5.333|-4.020|90|0|8|St. Paul's Cathedral, Abidjan|现代结构与彩色玻璃呈现独特宗教建筑，礼拜和参观时段分开。
班科国家公园|Banco National Park|5.390|-4.052|180|5|20|Banco National Park|在城市旁的热带森林认识树木与保护工作，按开放步道与向导要求活动。
科特迪瓦文明博物馆|Musee des Civilisations de Cote d Ivoire|5.332|-4.023|90|3|10|Musée des Civilisations de Côte d'Ivoire|通过面具、雕塑和器物理解不同族群文化，展陈与摄影规则现场确认。
高原大清真寺|Plateau Mosque|5.321|-4.020|45|0|5|Plateau Mosque|城市商务区中的宗教建筑，以外观为起点，内部参观需许可。
科科迪市政市场|Cocody market|5.348|-3.988|90|0|0|Cocody|工艺品和日常用品交织的城市市场，询价、摄影和购买分开处理。''')
experiences(c,'''马基餐馆与阿切凯|Abidjan maquis meal|5.303|-3.986|120|8|25|food-life|Maquis (restaurant)|在马科里的正规马基餐馆点烤鱼与阿切凯，慢慢认识共享餐桌的节奏。|auto
祖格卢与库佩代卡莱|Zouglou and coupe decale music|5.333|-4.090|120|10|35|music|Zouglou|查约普贡或文化场地公开节目，认识城市音乐与舞步，返程车辆提前安排。|manual
科科迪当代艺术|Abidjan contemporary art|5.350|-3.986|100|0|20|culture|Abidjan|按画廊展期看科特迪瓦当代绘画与摄影，开幕活动和私人工作室需预约。|manual''')
foods(c,'''阿切凯木薯粒|Attieke|Attiéké|2|6|Marcory|发酵木薯蒸成松散颗粒，常配烤鱼、洋葱和辣椒。
加尔巴鱼饭|Garba|Garba (food)|3|9|Treichville|炸鱼与阿切凯的街头组合，选择现做熟食并问清鱼份量。
阿洛科炸大蕉|Alloco|Alloco|2|6|Marcory|成熟大蕉炸至金黄，可作配菜或小食。
花生酱炖菜|Sauce arachide|Peanut stew|4|12|Cocody|花生浓汁搭配肉和米饭，食物过敏者需明确避开。
菲图主食团|Foutou banane|Fufu|2|6|Marcory|大蕉与木薯捣成紧实主食，适合蘸炖汁。''')
hotels(c,'''Sofitel Abidjan Hotel Ivoire|5.326|-4.001|180|450|科科迪大型酒店，适合关注花园和综合服务的停留。
Pullman Abidjan|5.321|-4.017|140|320|高原区潟湖沿岸酒店，适合商务区与城市文化路线。
Noom Hotel Abidjan Plateau|5.319|-4.017|140|330|高原区现代酒店，具体景观与泳池使用按房型确认。
Seen Hotel Abidjan Plateau|5.320|-4.021|85|200|高原中心的城市酒店，适合紧凑市区行程。
Azalai Hotel Abidjan|5.299|-3.986|100|240|马科里方向酒店，去高原和科科迪需跨桥安排交通。''')

c=city('ouagadougou','瓦加杜古','Ouagadougou','BF','布基纳法索','XOF',12.371,-1.520,'OUA','非洲电影、青铜铸造和乐器文化赋予瓦加杜古鲜明身份；这些内容值得在地图里被看见。','https://nations-unies.diplomatie.gov.bf/index.php/potentialites-touristiques-et-culturelles/','https://www.aeroport-ouagadougou.com/fr/hotels_ouagadougou.php','Burkinabe cuisine',advisory=('burkina-faso','avoid-all-travel','官方建议避免前往布基纳法索，包含首都；保留电影与手艺文化目录，不自动规划旅游出行。','Official advice is against all travel to Burkina Faso, including the capital; cultural listings remain available.'))
places(c,'''布基纳法索国家博物馆|National Museum of Burkina Faso|12.381|-1.476|120|3|10|National Museum of Burkina Faso|多族群器物、建筑与传统衣饰组成认识国家文化的入口。
瓦加杜古大教堂|Ouagadougou Cathedral|12.361|-1.528|45|0|0|Ouagadougou Cathedral|红土色建筑与塔楼形成城市地标，礼拜和访问条件需确认。
国家音乐博物馆|National Museum of Music Ouagadougou|12.375|-1.520|90|3|10|National Museum of Music (Burkina Faso)|传统乐器展陈帮助理解鼓、弦与节奏的区域差异。
邦格尔韦奥戈城市公园|Bangr Weogo Urban Park|12.402|-1.491|150|2|8|Bangr Weogo Urban Park|城市中的林地与自然教育空间，开放与访客路线须重新确认。
电影人广场|Place des Cineastes Ouagadougou|12.369|-1.519|45|0|0|FESPACO|电影主题纪念空间呈现非洲影人的城市记忆，节庆期间交通另核。''')
experiences(c,'''泛非电影节观影|FESPACO screenings|12.369|-1.519|180|5|25|festival|FESPACO|仅在电影节正式公布的场次参加放映和交流，年份与票务不能按日常活动安排。|seasonal
失蜡法青铜工艺|Ouagadougou bronze casting|12.345|-1.525|120|10|40|craft|Lost-wax casting|预约接待访客的工坊认识蜡模、铸造与打磨，不能靠近未隔离的高温作业。|manual
巴拉丰与鼓乐|Burkina balafon music|12.375|-1.520|120|10|35|music|Balafon|通过文化机构公开课程或演出认识木琴与打击乐，先核对日期和接待安排。|manual''')
foods(c,'''托杂粮团|To|Tô|2|6|Centre Ville|玉米、小米或高粱做成主食团，通常配叶菜汤汁。
比萨普饮|Bissap|Hibiscus tea|1|4|Centre Ville|木槿花饮料带酸味，选择可靠饮用水和密封或现煮版本。
里兹格拉斯香饭|Riz gras|Riz gras|3|9|Centre Ville|米饭与番茄、蔬菜和肉同锅烹制，可作为完整一餐。
巴本达杂粮叶菜|Babenda|Babenda|3|8|Centre Ville|叶菜、谷物与花生的家常组合，口感厚实。
自行车鸡烤鸡|Poulet bicyclette|Burkinabe cuisine|6|16|Ouaga 2000|本地土鸡烤制，肉质紧实；名称是料理俗称而非具体商户。''')
hotels(c,'''Bravia Hotel Ouagadougou|12.355|-1.519|100|240|机场与城区之间的酒店，接送和现时营业直接确认。
Sopatel Silmande|12.402|-1.503|110|260|唐甘湖方向的成熟酒店，安保与返程安排先核对。
Sonia Hotel Ouagadougou|12.355|-1.526|80|180|城市酒店选择，房型和含餐情况依预订条款。
Hotel de la Liberte|12.367|-1.515|45|110|相对平实的本地住宿目录项，当前营业未单独确认。
Lancaster Ouaga 2000|12.310|-1.523|130|280|瓦加2000区大型酒店，预订时确认现行品牌名称和接待条件。''')

c=city('libreville','利伯维尔','Libreville','GA','加蓬','XAF',0.392,9.454,'LBV','海岸城市连接雕刻教堂、热带树林和河口沙滩，自然体验适合留出整段时间。','https://olympe-libreville.com/guide/que-faire-a-libreville/','https://www.radissonhotels.com/en-us/destination/gabon/libreville','Gabonese cuisine',days=4,lodging=(55,130,290))
places(c,'''加蓬国家艺术与传统博物馆|National Museum of Arts and Traditions Libreville|0.386|9.451|90|3|12|National Museum of Arts, Rites and Traditions of Gabon|通过面具、乐器和器物认识加蓬文化，实际展馆位置与开放先确认。
恩肯博圣米歇尔教堂|Saint Michel de Nkembo|0.405|9.459|60|0|5|St. Michael's Church, Libreville|雕刻木柱将圣经故事与本地木雕传统相连，礼拜期间不打扰。
利伯维尔海滨|Libreville waterfront|0.395|9.443|90|0|0|Libreville|在开放海岸步道看河口光线，避免进入私人或政府设施周边。
西邦树木园|Sibang Arboretum|0.426|9.485|120|5|20|Sibang Arboretum|近郊林木提供认识热带树种的机会，预约、入口和向导需提前确认。
蒙布埃市场|Mont Bouet market|0.407|9.460|90|0|0|Mont-Bouët|城市主要市场的食材和日用品体现生活节奏，人物摄影先取得同意。''')
experiences(c,'''德尼角沙滩半日|Pointe Denis beach day|0.357|9.353|300|30|100|nature|Pointe Denis|合规船只穿过河口抵达沙滩，确认回程与海况，餐饮、船费和沙滩服务分开。|remote
蓬加拉自然观察|Pongara guided nature|0.300|9.352|360|60|160|nature|Pongara National Park|由授权向导介绍河口与森林生态，动物观察不保证；海龟等季节项目按保护方规则参加。|remote
加蓬棕榈炖菜与海鱼|Gabonese fish and palm stew|0.411|9.432|100|12|35|food-life|Gabonese cuisine|在可靠餐馆品尝熟制鱼、木薯和棕榈果酱菜，理解森林与海岸对餐桌的影响。|auto''')
foods(c,'''尼扬布韦鸡|Poulet nyembwe|Poulet nyembwe|8|22|Centre Ville|鸡肉与棕榈果酱炖煮，通常配木薯或米饭。
木薯叶炖菜|Feuilles de manioc|Cassava leaf|3|10|Louis|木薯叶充分熟制，调味可能含花生和烟熏鱼。
叶包木薯|Batons de manioc|Chikwangue|1|4|Louis|发酵木薯蒸成条状，是配鱼或浓汁的主食。
烤海鱼|Poisson braise|Gabonese cuisine|8|25|Waterfront|按当天鱼种和重量选择，辣酱与配菜单独询问。
阿坦加果|Atanga|Dacryodes edulis|2|6|Mont Bouet|季节性非洲梨常加热后食用，带油润酸味，供应依季节。''')
hotels(c,'''Radisson Blu Okoume Palace Hotel Libreville|0.431|9.429|170|380|北部海滨的完整服务酒店，适合海景与商务停留。
Park Inn by Radisson Libreville|0.430|9.430|120|270|奥库梅片区的国际品牌酒店，去市中心需车辆。
ONOMO Hotel Libreville|0.458|9.411|80|180|机场附近酒店，适合转机停留与机场方向行程。
Hotel Nomad Suites Residence|0.458|9.419|110|250|机场方向服务式住宿，厨房和长住条件逐房型核对。
Hotel Olympe Libreville|0.420|9.449|70|170|本地城市酒店，官网提供城市周边探索资料。''')

c=city('conakry','科纳克里','Conakry','GN','几内亚','GNF',9.509,-13.712,'CKY','半岛、洛斯群岛与曼丁鼓乐，让科纳克里兼具港口日常、历史记忆和离岛慢生活。','https://guineavibes.com/conakry/','https://www.booking.com/city/gn/camayenne.html','Guinean cuisine',days=4)
c['sourceReferences'].append(ref('https://mcta.gov.gn/les-directions-et-services/','几内亚文化部门列明国家博物馆机构及所在地','primary-source'))
places(c,'''桑德瓦利亚国家博物馆|Sandervalia National Museum|9.509|-13.713|90|2|8|Sandervalia National Museum|考古、工艺和民族器物介绍几内亚多元文化，确认当前展览与开放日。
科纳克里大清真寺|Conakry Grand Mosque|9.535|-13.681|60|0|5|Conakry Grand Mosque|城市宗教地标，参观以允许区域为限，尊重礼拜与着装规则。
圣玛丽主教座堂|St Marys Cathedral Conakry|9.508|-13.710|45|0|0|St. Mary's Cathedral, Conakry|半岛旧城区的宗教建筑，可与博物馆分时段组合。
十一月二十二日纪念碑|Monument du 22 Novembre Conakry|9.529|-13.684|45|0|0|Conakry|认识城市独立后历史记忆的公共纪念地点，避开政治集会。
马迪纳市场|Madina Market Conakry|9.548|-13.667|100|0|0|Madina Market|织物、食材和日常货物反映城市商业生活，拥挤时减少行李并先询问摄影。''')
experiences(c,'''卡萨岛海边一日|Kassa Island beach day|9.464|-13.753|360|25|90|nature|Îles de Los|从正规码头按已确认船期出发，海岛午餐和返程另核，风浪大时取消。|remote
金贝鼓课程|Conakry djembe workshop|9.535|-13.686|120|15|45|music|Djembe|预约有接待能力的音乐学校或鼓手，了解基本节奏与鼓的材料，避免把仪式当作表演。|manual
马迪纳织物与裁缝|Conakry textile and tailoring|9.548|-13.667|120|5|25|craft|African wax prints|与店家认识印花布和裁缝制作，布料、尺寸及定制服装价格单独确认。|manual''')
foods(c,'''拉菲迪蔬菜饭|Lafidi|Lafidi|3|9|Kaloum|米饭配蔬菜和棕榈油等调味，店家版本和份量可能不同。
花生炖菜|Mafe|Peanut stew|4|12|Kaloum|花生浓汁搭配米饭与肉或蔬菜，含明确过敏原。
木薯叶炖菜|Sauce feuilles|Guinean cuisine|3|10|Camayenne|叶菜与鱼或肉同煮，木薯叶须充分熟制。
丰尼奥杂粮|Fonio|Fonio|3|10|Kaloum|细小谷物可蒸制搭配酱汁，供应与做法以店家菜单为准。
姜汁饮|Ginger juice|Guinean cuisine|1|4|Kaloum|姜的辛香与糖和柠檬组合，选择现煮或密封饮品。''')
hotels(c,'''Noom Hotel Conakry|9.506|-13.712|130|300|卡卢姆海滨的现代酒店，适合半岛文化路线。
Palm Camayenne|9.532|-13.684|120|280|卡马延海岸酒店，往返旧城区需考虑道路拥堵。
Riviera Royal Hotel|9.536|-13.678|130|300|卡马延地区完整服务酒店，具体楼栋和设施以房型核对。
Hotel Kaloum|9.513|-13.708|120|280|半岛中心酒店，适合商务与博物馆方向活动。
ONOMO Hotel Conakry|9.502|-13.708|85|200|卡卢姆南岸城市酒店，机场接送需预留车程。''')

c=city('dakar','达喀尔','Dakar','SN','塞内加尔','XOF',14.693,-17.447,'DSS','大西洋半岛将戈雷记忆、当代艺术、冲浪与鱼饭连在一起，城市节奏适合留给海风和音乐。','https://mcat.gouv.sn/service/dakar/','https://www.dakarcare.com/en/_files/ugd/ddf6d4_420feea09f0a4c2abedd2eb9584aad93.pdf','Senegalese cuisine',days=4,lodging=(40,100,260))
places(c,'''戈雷岛|Goree Island|14.667|-17.399|240|10|30|Gorée|历史建筑与博物馆帮助理解大西洋奴隶贸易记忆，渡轮和岛上参观分开计时。
非洲复兴纪念碑|African Renaissance Monument|14.722|-17.495|90|0|15|African Renaissance Monument|山丘上的大型雕塑俯瞰半岛，外部台阶与内部参观可分开选择。
西奥多莫诺非洲艺术博物馆|IFAN Museum of African Arts|14.661|-17.439|120|3|10|IFAN Museum of African Arts|面具、器物与纺织提供西非文化的细致入口，展览内容按当前安排。
黑人文明博物馆|Museum of Black Civilisations|14.678|-17.433|120|5|15|Museum of Black Civilisations|通过历史与当代展陈理解非洲及海外黑人文化，不必与其他博物馆赶在同一天。
马梅勒灯塔|Mamelles Lighthouse|14.724|-17.502|90|3|10|Mamelles Lighthouse|山丘灯塔可看海岸，登高与餐饮活动分开，开放时段事先确认。''')
c['attractions'][0]['automaticPlanning']=False;c['attractions'][0]['accessNote']='离岛项目：需渡轮往返、候船和岛内参观半天，不按市内步行衔接。'
experiences(c,'''恩戈尔冲浪入门|Ngor surf lesson|14.755|-17.513|150|30|75|nature|Ngor|按海况和能力选择正规教练，确认板具、救生安排和保险，不保证每天适合初学者。|manual
姆巴拉克斯现场|Mbalax music night|14.715|-17.467|150|10|40|music|Mbalax|在有公开节目和可靠返程交通的场地感受鼓乐与现代流行乐，演出日期先核实。|manual
塞内加尔鱼饭餐桌|Dakar thieboudienne lunch|14.688|-17.446|120|6|20|food-life|Thieboudienne|点一份鱼、蔬菜和香料饭慢慢吃，了解共享餐桌礼节，可替代当日午餐。|auto''')
foods(c,'''塞内加尔鱼饭|Thieboudienne|Thieboudienne|4|14|Plateau|鱼、蔬菜与米饭同锅烹制，红白做法和辣酱可以先问。
洋葱柠檬鸡|Yassa poulet|Yassa (food)|5|15|Medina|鸡肉与大量洋葱、柠檬调味，常配白米饭。
花生炖菜|Mafe|Peanut stew|4|12|Plateau|花生浓汁配肉或蔬菜，是完整正餐中的主菜。
咖啡图巴|Cafe Touba|Café Touba|1|4|Medina|咖啡以几内亚胡椒等香料调味，香气强烈，含咖啡因。
小米酸奶甜食|Thiakry|Thiakry|2|6|Almadies|小米颗粒和乳制品混合的甜食，份量通常适合餐后。''')
hotels(c,'''Terrou Bi Resort|14.679|-17.466|180|450|西海岸度假式酒店，海滩服务与早餐依房型条款。
Pullman Dakar Teranga|14.666|-17.431|150|350|高原区海岸酒店，适合市中心与渡轮港方向。
Noom Hotel Dakar Sea Plaza|14.694|-17.474|150|360|西海滨酒店，原Radisson Blu Dakar Sea Plaza；以当前名称预订。
Novotel Dakar|14.665|-17.428|100|240|高原区海岸连锁酒店，适合博物馆和中心城区路线。
Hotel Lagon 2|14.667|-17.428|100|240|市中心东侧海滨酒店，具体海景和房型需确认。''')

c=city('cotonou','科托努','Cotonou','BJ','贝宁','XOF',6.370,2.391,'COO','阿戈吉女战士纪念碑、港口壁画与湖上生活，让科托努成为认识贝宁文化的鲜活起点。','https://benin.bj/en/sectors/tourism','https://www.icotonou.com/en/annuaire/hotels-accommodation-cotonou/','Benin cuisine',days=4)
places(c,'''亚马逊女战士纪念碑|Amazon Monument Benin|6.349|2.402|60|0|0|Amazon Monument (Benin)|纪念达荷美阿戈吉女战士，广场适合停留理解女性在国家记忆中的角色。
港口涂鸦长墙|Port of Cotonou graffiti wall|6.354|2.420|90|0|0|Cotonou|大型壁画呈现历史人物和城市创作，沿开放步道观看，不进入港口作业区。
比奥盖拉纪念碑|Bio Guera Monument|6.352|2.387|40|0|0|Bio Guera|纪念反殖民抵抗人物的小型公共停留点，与海滨文化路线组合。
科托努主教座堂|Cotonou Cathedral|6.359|2.440|45|0|0|Cotonou Cathedral|红白条纹立面鲜明，礼拜与访客参观时间分开。
丹托克帕市场|Dantokpa Market|6.379|2.433|120|0|0|Dantokpa Market|湖岸商业区的布匹、食材与家庭用品让人理解城市生活，先确认市场实际营业与迁移信息。''')
experiences(c,'''冈维埃水上村落|Ganvie lake village|6.466|2.416|360|25|90|culture|Ganvie|从阿博梅卡拉维一带正规码头乘船，了解湖上住房和交通，尊重住户并留足往返。|remote
沃顿文化节资料与观礼|Vodun Days cultural visit|6.326|2.083|480|30|100|festival|West African Vodun|在乌伊达官方开放庆典了解宗教与公共文化，按当年日程参加，私人仪式不默认对游客开放。|remote
海滨熟鱼与阿卡萨|Cotonou fish and akassa|6.351|2.398|120|7|22|food-life|Benin cuisine|在正规海滨餐馆尝鱼、玉米主食和辣酱，沙滩休息可与午餐合并，不默认海泳。|auto''')
c['guide']['experienceIntro']='冈维埃需船程和往返接驳；乌伊达节庆在另一座城市，仅作为需单独安排的文化延伸，不并入短暂市内日。'
foods(c,'''玉米发酵团|Akassa|Akassa|1|4|Haie Vive|发酵玉米做成柔软主食，常与鱼和酱汁搭配。
豆与米饭|Atassi|Atassi|3|8|Dantokpa|豆与米饭的组合，常搭配煎炸配菜，具体版本以菜单为准。
烤奶酪|Wagasi|Wagasi|2|7|Haie Vive|西非奶酪可煎烤或入菜，含乳制品过敏原。
叶菜炖汁|Gboma dessi|Gboma dessi|4|12|Haie Vive|叶菜与肉或鱼组成浓汁，搭配玉米或木薯主食。
烤鱼与辣椒酱|Poisson braise beninois|Benin cuisine|6|18|Fidjrosse|熟制海鱼配辣椒调味，按鱼大小询价并确认配菜。''')
hotels(c,'''Sofitel Cotonou Marina Hotel and Spa|6.349|2.403|180|450|海滨综合酒店，可结合女战士广场和Marina文化路线。
Golden Tulip Le Diplomate Cotonou|6.354|2.400|110|260|机场与海滨之间的完整服务酒店，适合中心城区基地。
Novotel Cotonou Orisha|6.349|2.400|100|240|海滨传统连锁酒店，餐饮与接送按预订条件核实。
Ibis Cotonou|6.350|2.400|60|140|Marina片区相对平实的连锁住宿，可比较早餐和机场接送。
Azalai Hotel Cotonou|6.355|2.429|90|220|拉库区域海滨酒店，去机场和西侧海滩另留车程。''')

c=city('dakhla','达赫拉','Dakhla','EH','西撒哈拉','MAD',23.714,-15.936,'VIL','沙漠沙丘贴近大西洋潟湖，风筝冲浪、海鸟和牡蛎让达赫拉适合为海风留出几天。','https://dakhla-attitude.ma/activities/spots/?lang=en','https://www.oceanvagabond.com/en/','Sahrawi cuisine',days=4,lodging=(45,100,230))
c['territoryStatusNote']='西撒哈拉为争议地区，此处按地区展示目的地，不作主权判断；入境、实际控制区及路线要求须按出行日期核实。'
c['territoryStatusNoteEn']='Western Sahara is a disputed territory. This regional listing makes no sovereignty determination; verify entry and route requirements for travel dates.'
c['sourceReferences'].append(ref('https://www.un.org/dppa/decolonization/en/nsgt/western-sahara','联合国搜索索引摘要：西撒哈拉列为非自治领土；正文访问遇到验证页面','primary-source-search-excerpt'))
c['transportNote']='城市、潟湖营地与大西洋海岸相隔较远，按实际住宿基地安排接驳。白沙丘和岛屿活动单独预留半天，核对潮汐、风况及合法道路，不自行驶离既定路线。'
places(c,'''达赫拉潟湖|Dakhla Lagoon|23.785|-15.849|180|0|0|Dakhla|在开放岸线看潟湖光线与风帆，鸟类观察不保证；从城市往返需车辆。
达赫拉海滨步道|Dakhla Corniche|23.710|-15.929|90|0|0|Dakhla|沿城市公共海滨看渔船与日常生活，适合抵达后的轻松活动。
白沙丘|Dakhla White Dune|23.819|-15.791|180|20|60|Dakhla|纯白沙丘伸向潟湖，需由熟悉路线的合规运营者安排接驳与停留。
龙岛观景|Dragon Island Dakhla|23.899|-15.785|180|20|65|Dakhla|潮汐改变岛屿周围水深，按运营方和保护要求决定是否登陆，不自行涉水。
拉萨尔加海岸|Lassarga beach|23.612|-15.953|180|0|0|Dakhla|半岛南端的海浪与沙岸适合远眺和休息，游泳与冲浪须评估海况。''')
for a in c['attractions']:
    if 'Corniche' not in a['nameEn']:
        a['automaticPlanning']=False
        a['accessNote']='与城市中心有车程或潮汐限制；单独安排往返，不自动填入市内空档。'
experiences(c,'''潟湖风筝冲浪入门|Dakhla beginner kitesurfing|23.895|-15.777|180|70|160|nature|Kitesurfing|向正规学校预约教练课，按风况调整，确认装备、救援和保险；一次体验不等于可独立冲浪。|manual
潟湖牡蛎熟食体验|Dakhla oyster farm meal|23.821|-15.857|120|12|35|food-life|Oyster|在接待访客的养殖场或正规餐馆了解牡蛎养殖，优先选熟制海鲜；参观与餐饮是否包含另核。|manual
撒哈拉茶礼与日落|Dakhla Sahrawi tea|23.713|-15.934|90|4|15|food-life|Sahrawi cuisine|在城市茶馆或住宿方组织的交流中认识小杯甜茶和待客节奏，不假定私人家庭可随时参观。|auto''')
foods(c,'''达赫拉牡蛎|Dakhla oysters|Oyster|8|25|Lagoon restaurants|海湾养殖牡蛎可按只或拼盘点选，熟制和生食版本分别确认，偏好熟制可直接说明。
炭烤海鱼|Grilled Atlantic fish|Fish as food|8|22|Dakhla Corniche|海鱼按当天供应与重量选择，烤制后配面包或蔬菜。
鱼肉塔吉锅|Fish tagine|Tajine|7|20|City centre|鱼和蔬菜在陶锅中慢煮，香料、橄榄和柠檬用量依店家做法。
撒哈拉薄荷茶|Sahrawi tea|Maghrebi mint tea|1|5|City centre|小杯甜茶分轮奉上，是社交而非赶时间的饮品。
库斯库斯|Sahrawi couscous|Couscous|6|16|City centre|麦粒配肉、蔬菜或鱼的地方餐桌选择，餐馆具体供应日先询问。''')
hotels(c,'''Dakhla Attitude|23.895|-15.777|90|250|潟湖风筝冲浪营地，课程、器材与餐食是否包含分别核价。
Dakhla Club|23.888|-15.778|110|280|潟湖岸边度假物业，去市区需独立安排接驳。
Westpoint Dakhla|23.752|-15.948|100|260|面向大西洋浪区的住宿，与潟湖平水区是不同环境。
Ocean Vagabond Lassarga|23.612|-15.953|110|290|半岛南端的沙滩住宿，适合海浪与水上活动，交通另留时间。
Lagon Energy Dakhla|23.887|-15.777|100|260|潟湖岸边的小型度假住宿，水上课、器材和餐饮按套餐核对。''')

# Additional cultural sites give each destination seven places and three
# experiences. Country visibility is not purchased by relaxing depth thresholds.
EXTRA_PLACES={
'kinshasa':[
('金沙萨植物园|Kinshasa Botanical Garden|-4.313|15.307|100|2|8|Kinshasa|市中心植物园可认识热带树木与城市绿地，访客开放及入口需先确认。','https://whc.unesco.org/document/181586',False),
('马瓦莱湖|Lake Ma Vallee|-4.493|15.274|180|10|30|Lac Ma Vallée|林地环抱的近郊湖泊适合沿确认开放的步道停留；往返车程另计，不作为市区短暂停留。','https://tourismerdc.cd/article-divers/Lac%20Ma%20Vall%C3%A9e/21',True)],
'algiers':[
('赖斯宫与二十三号堡垒|Palais des Rais|36.789|3.062|100|3|10|Palais des Rais|海边奥斯曼宫院群如今承载艺术与文化活动，庭院与装饰值得慢看。','https://palaisdesrais-bastion23.dz/en/home/',False),
('阿尔及尔国家美术馆|National Museum of Fine Arts of Algiers|36.745|3.072|120|2|10|National Museum of Fine Arts of Algiers|哈马花园上方的艺术馆汇集绘画与雕塑，可与植物园安排在同一片区。','https://en.wikipedia.org/wiki/National_Museum_of_Fine_Arts_of_Algiers',False)],
'tripoli-libya':[
('卡拉曼利故居博物馆|Karamanly House Museum|32.897|13.176|75|3|10|Karamanly House Museum|传统庭院住宅展现城市历史居住方式，内部开放与安全接待必须重新确认。','https://en.wikipedia.org/wiki/Karamanly_House_Museum',False),
('旧城钟楼|Tripoli Clock Tower|32.894|13.180|40|0|0|Ottoman clock tower, Tripoli|奥斯曼时期城市钟楼与周边街道帮助理解旧城的公共生活尺度。','https://libyaadventures.com/top-things-to-do-in-tripoli/',False)],
'ndjamena':[
('乍得法国文化学院|Institut Francais du Tchad|12.113|15.056|100|0|12|N\'Djamena|关注公开展览、电影和演出，只有确认活动与访客接待后才安排进入。','https://institut-francais-tchad.org/institut/',False),
('阿尔穆纳文化中心|Centre Al Mouna|12.109|15.044|90|0|10|N\'Djamena|文化中心提供认识地方思想与出版的线索，讲座或展览接待须先联系。','https://www.africabizinfo.com/ar-TD/centre-al-mouna-66-52-34-02',False)],
'luanda':[
('铁宫|Palacio de Ferro|-8.808|13.237|75|2|10|Palácio de Ferro|金属结构与外廊使这座历史建筑格外醒目，作者归属存在讨论，不简单称作埃菲尔作品。','https://welcometoangola.co.ao/en/directorio/palacio-de-ferro/',False),
('安娜若阿基纳宫外观|Palacio Dona Ana Joaquina|-8.814|13.239|35|0|0|Luanda|从允许通行的公共街道看历史宅邸外观，建筑内部不列为常规参观。','https://www.vivreenangola.com/tourisme/a-luanda/autres-monuments-de-la-ville/',False)],
'bamako':[
('穆索昆达女性博物馆|Muso Kunda Museum of Women|12.671|-7.965|100|3|10|Muso Kunda Museum of Women|通过女性生活与文化藏品认识马里，实际开放与参观要求需重新确认。','https://en.wikipedia.org/wiki/Muso_Kunda_Museum_of_Women',False),
('巴马科动物园|Bamako Zoo|12.660|-7.995|120|3|10|Bamako Zoo|将自然教育与国家公园片区组合；设施现状与访客接待未确认，不自动安排。','https://en.wikivoyage.org/wiki/Bamako',False)],
'niamey':[
('奥马鲁甘达文化中心|Oumarou Ganda Cultural Centre|13.526|2.136|90|0|10|Niamey|以当地电影人命名的文化场所，公开节目和访客进入条件需重新核实。','https://mapcarta.com/W267371060',False),
('塞尼孔切体育场|Seyni Kountche Stadium|13.526|2.107|90|3|15|Stade Général Seyni Kountché|作为城市体育文化目录收录，仅在公开赛事并确认安全接待时进入。','https://mapcarta.com/W267371060',False)],
'nouakchott':[
('伊本阿巴斯清真寺|Ibn Abass Mosque|18.082|-15.974|40|0|0|Ibn Abass Mosque|认识首都宗教建筑的另一个地点，以外观为主，礼拜与内部准入另核。','https://en.wikipedia.org/wiki/Ibn_Abass_Mosque',False),
('泽因艺术画廊|Galerie Zeinart|18.104|-15.981|75|0|10|Nouakchott|小型画廊展示地方艺术与工艺，展期和接待需事先联系。','https://www.tripadvisor.fr/Attraction_Review-g293815-d7142608-Reviews-Galerie_Zeinart-Nouakchott.html',False)],
'lagos':[
('卡拉库塔博物馆|Kalakuta Museum|6.612|3.348|100|5|18|Kalakuta Museum|费拉库蒂旧居中的展览连接音乐与城市社会历史，伊凯贾片区宜单独组合。','https://www.kalakutamuseum.com/',False),
('特拉文化中心|Terra Kulture|6.423|3.428|120|5|30|Terra Kulture|戏剧、文学与视觉艺术共享的文化空间，演出票与展览参观按实际节目分开。','https://terrakulture.com/contact/',False)],
'bangui':[
('巴泰勒米博干达体育场|Barthelemy Boganda Stadium|4.3744|18.5676|90|3|15|Barthélemy Boganda Stadium|国家体育场作为城市公共文化地点收录，公开赛事与设施接待条件须重核。','https://en.wikipedia.org/wiki/Barth%C3%A9lemy_Boganda_Stadium',False),
('博阿利瀑布|Boali Falls|4.878|18.003|240|5|25|Boali|姆巴利河形成宽阔瀑布，距班吉有明显车程，位于更严格旅行限制区域，仅作自然文化资料。','https://www.lonelyplanet.com/points-of-interest/chutes-de-boali/1016096',True)],
'yaounde':[
('布拉基图德博物馆|Blackitude Museum|3.865|11.520|100|5|15|Blackitude Museum|集中认识喀麦隆王室器物与文化收藏，导览时间和摄影规则先确认。','https://visit-yaounde.com/blackitude-museum/',False),
('蒙菲贝本笃会艺术博物馆|Mont Febe Benedictine Museum|3.910|11.487|90|3|12|Mont Fébé|修道院小型展馆收藏面具、家具与艺术器物，访客开放遵从宗教空间安排。','https://monasteremontfebe.com/index.php/musee',True)],
'brazzaville':[
('纳本巴塔外观|Nabemba Tower|-4.274|15.287|35|0|0|Nabemba Tower|从允许停留的公共区域认识城市高层建筑，办公楼内部不列为旅游参观。','https://armp.cg/contact-coordinates.php?id=12&lang=en',False),
('朱埃急流观景|Djoue Rapids|-4.299|15.218|120|0|10|Djoué River|在安全岸线远观河水与岩石，不游泳或靠近急流边缘，往返市区另留车程。','https://www.developpement-durable.gouv.cg/wp-content/uploads/2019/02/SITE-DES-CATARACTES-CATDR.pdf',True)],
'abidjan':[
('阿比让手工艺中心|CAVA craft centre|5.300|-3.989|100|0|10|Abidjan|集中比较木雕、金属饰品和织物，购物与手工艺讲解分开计费。','https://abidjan.embassy.qa/en/c%C3%B4te-divoire-republic/entertainment-places',False),
('宾热维尔植物园|Bingerville Botanical Garden|5.356|-3.886|150|3|12|Bingerville|近郊热带植物园适合看树木与缓步休息，城市往返车程不能忽略。','https://www.tourisme.ci/destinations-touristiques/le-jardin-botanique-de-bingerville/',True)],
'ouagadougou':[
('托马斯桑卡拉纪念馆|Thomas Sankara Memorial|12.372|-1.548|100|0|10|Thomas Sankara|围绕桑卡拉与国家历史记忆的纪念空间，访问许可和当前安全条件须确认。','https://memorialsankara.bf/',False),
('瓦加杜古手工艺村|Village Artisanal de Ouagadougou|12.335|-1.511|120|0|10|Ouagadougou|工坊和展售空间集纳地方手艺，铸造、织造与皮革工作均以接待安排为准。','https://www.racines-aisbl.org/wp-content/uploads/2014/03/Repertoire-dinformation-des-arts-et-de-la-culture.pdf',False)],
'libreville':[
('圣玛丽主教座堂|Sainte Marie Cathedral Libreville|0.402|9.444|45|0|0|Libreville|海滨方向的宗教建筑体现城市历史，礼拜和访客参观遵从管理要求。','https://fr.wikipedia.org/wiki/Cath%C3%A9drale_Notre-Dame-de-l%27Assomption_de_Libreville',False),
('阿坎达国家公园|Akanda National Park|0.616|9.526|360|45|120|Akanda National Park|红树林和潮滩对候鸟及鱼类重要，跟随授权向导按天气与潮汐安排，不保证见到特定动物。','https://www.lonelyplanet.com/points-of-interest/akanda-national-park/1558169',True)],
'conakry':[
('卡马延植物园|Camayenne Botanical Garden|9.532|-13.681|90|0|5|Conakry|半岛城市中的历史植物园，可与周边文化地点组合，入口及维护开放状态先确认。','https://fr.wikipedia.org/wiki/Jardin_botanique_de_Conakry',False),
('法几文化中心|Centre Culturel Franco Guineen|9.510|-13.709|120|0|15|Conakry|公开展览、音乐与电影带来城市当代文化视角，按正式节目确定日期。','https://www.campusfrance.org/fr/espaces/guinee-conakry',False)],
'dakar':[
('达喀尔艺术村|Village des Arts Dakar|14.751|-17.466|120|0|15|Village des Arts de Dakar|艺术家工作室与展览园区，慢慢看绘画、雕塑并尊重工作中的创作者。','https://levillagedesartsdedakar.org/',False),
('神性清真寺|Mosque of the Divinity|14.715|-17.491|60|0|0|Mosque of the Divinity|海岸低处的清真寺与周围渔村形成独特景观，以允许的外部区域观赏。','https://www.mosqueedeladivinite.org/',False)],
'cotonou':[
('津苏基金会科托努实验室|Fondation Zinsou LAB Cotonou|6.383|2.408|100|0|10|Fondation Zinsou|关注科托努LAB的开放项目；基金会主博物馆在乌伊达，不能与本地址混为一处。','https://www.fondation-zinsou.org/infospratiques',False),
('纪念广场|Place du Souvenir Cotonou|6.353|2.399|45|0|0|Place du Souvenir|海滨片区的公共纪念空间，认识贝宁近代历史，可与Marina路线组合。','https://tourismebenin.com/en/',False)],
'dakhla':[
('福姆布伊尔海滩|Foum El Bouir Beach|23.752|-15.948|150|0|0|Dakhla|大西洋浪区海滩适合观察冲浪和休息，初学者不自行入水，往返市区需车辆。','https://www.visitmorocco.com/en/travel/dakhla/beach',True),
('阿斯玛温泉|Asmaa hot spring|23.867|-15.777|90|5|20|Dakhla|沙漠环境中的温泉出水点，接待、卫生与水温需现场核对，不宣称治疗功效。','https://www.lemonde.fr/m-styles/article/2022/06/18/dakhla-une-lagune-dans-le-vent_6130941_4497319.html',True)]
}
for c in CITIES:
    c['contentTier']='standard'
    for row,url,remote in EXTRA_PLACES[c['id']]:
        places(c,row)
        a=c['attractions'][-1]
        a['sourceUrl']=url;a['sourceCheckedAt']=DAY
        a['sourceReferences']=[ref(url,'地点身份、文化背景或运营者信息；检索记录不代表指定日期开放')]
        a['price']['sourceUrl']=url
        a['automaticPlanning']=False if remote or c.get('automaticPlanning') is False else a['automaticPlanning']
        if remote: a['accessNote']='远郊或自然路线，单独安排往返接驳与开放核验，不自动填入市区空档。'

# Pin independently researched hotel and specialist references instead of claiming
# a chain destination page verifies unrelated properties.
HOTEL_SOURCES={
 'Hotel El Safir':'https://www.algdz.com/fr/tourisme/hotels/alger/hotel-es-safir-a-alger-centre',
 'Hotel Albert Premier Algiers':'https://www.google.com/travel/hotels/entity/ChcImN_x5cTW6dkGGgsvZy8xdnE4OTFwOBAB',
 'Radisson Blu Hotel N Djamena':'https://www.radissonhotels.com/en-us/hotels/radisson-blu-ndjamena',
 'Hilton N Djamena':'https://www.hilton.com/fr/locations/chad/ndjamena/hilton-hotels/',
 'Eko Hotel and Suites':'https://www.google.ca/travel/hotels/entity/CgsIt5TC7YeWsK3hARAB',
 'Pefaco Hotel Maya Maya':'https://www.icao.int/WACAF/Documents/DGCA/DGCA-6/HOTELS%20DGAC.pdf',
 'Mikhael s Hotel':'https://www.icao.int/WACAF/Documents/DGCA/DGCA-6/HOTELS%20DGAC.pdf',
 'Hotel Amaritsah':'https://www.afro.who.int/sites/default/files/2025-02/AFR-RC74-INF-01%20Bulletin%20d%E2%80%99information.pdf',
 'Azalai Hotel Abidjan':'https://www.azalai.com/en/azalai-hotel-abidjan',
 'Lancaster Ouaga 2000':'https://www.lancasterouaga2000.com/',
 'ONOMO Hotel Libreville':'https://www.icao.int/filebrowser/download/23594?fid=23594',
 'Hotel Nomad Suites Residence':'https://www.booking.com/hotel/ga/nomad-libreville.fr.html',
 'Hotel Olympe Libreville':'https://olympe-libreville.com/guide/que-faire-a-libreville/',
 'Noom Hotel Dakar Sea Plaza':'https://www.radissonhotels.com/en-us/hotels/radisson-individuals-noom-dakar-sea-plaza',
 'Hotel Lagon 2':'https://www.lelagondakar.com/our-hotel/',
 'Dakhla Attitude':'https://dakhla-attitude.ma/activities/spots/?lang=en',
 'Dakhla Club':'https://dakhlaclub.com/en/home/',
 'Westpoint Dakhla':'https://westpointdakhla.ma/',
 'Ocean Vagabond Lassarga':'https://www.oceanvagabond.com/en/dakhla-morocco/',
 'Lagon Energy Dakhla':'https://lagonenergydakhla.com/lodges/',
}
for item in ITEMS:
    if item['kind']=='hotel':
        item['durationMinutes']=0
        item['features']=['每间每晚','按日期核价']
        if item['nameEn'] in HOTEL_SOURCES:
            u=HOTEL_SOURCES[item['nameEn']]
            item['sourceUrl']=u
            item['sourceReferences']=[ref(u,'酒店身份和所在地区；不代表实时房价或指定日期可订')]
            item['image']['sourceUrl']=u
            item['priceOptions'][0]['sourceUrl']=u
            if not any(x in u for x in ['google.','icao.','algdz.']): item['bookingUrl']=u
        if item['nameEn']=='Hilton N Djamena':
            item['name']=item['nameEn']='Hilton N’Djamena Toumai Palace'
            item['description']='Hilton目录中的图迈宫酒店；与旧Hilton物业和其他同城酒店区分，直接核对地址与接待日期。'
            item['imageQuery']='Hilton N Djamena Toumai Palace hotel exterior'
for food in FOODS:
    if food['article']=='Cassava leaf':
        food['article']='Pondu';food['image']['sourceUrl']=wiki('Pondu')
    if food['article']=='Qalb el louz':
        food['article']='Kalb el louz';food['image']['sourceUrl']=wiki('Kalb el louz')
    if food['nameEn']=='Koko cassava leaves':
        food['name']='科科森林叶菜';food['nameEn']=food['localName']='Koko';food['article']='Gnetum africanum'
        food['description']='藤本买麻藤叶切细后与花生或烟熏鱼炖煮，区别于木薯叶；配主食享用。'
        food['sourceUrl']='https://www.fao.org/4/XII/0671-B5.htm'
        food['sourceReferences']=[ref(food['sourceUrl'],'FAO确认中非等地区将Gnetum食用叶称为koko','primary-source')]
        food['image']['sourceUrl']=wiki('Gnetum africanum');food['imageQuery']='Central African Republic koko stew Gnetum'
    if food['nameEn']=='Koki': food['name']='豆泥叶包'
    if food['nameEn'] in ['Akassa','Atassi']:
        article='Akassa (pâte)' if food['nameEn']=='Akassa' else 'Atassi'
        food['article']=article;food['articleLanguage']='fr'
        food['image']['sourceUrl']='https://fr.wikipedia.org/wiki/'+quote(article.replace(' ','_'))
        food['sourceReferences'].append(ref(food['image']['sourceUrl'],'菜品名称、原料与贝宁饮食背景'))
for c in CITIES:
    c['guide']['foodHighlights']=[{'name':f['name'],'description':f['description']} for f in FOODS if c['id'] in f['cityIds']]
    for a in c['attractions']:
        if a['article'] in [c['article'],c['nameEn'],'Bingerville','Mont Fébé','Djoué River','Boali','Thomas Sankara','Bio Guera','FESPACO']:
            a['imageScope']='nearby'
            a['imageContextNote']='展示所在地区或相应文化主题的真实环境，不代表该地点的内部或当前开放状态。'
            a['image']['scope']='nearby'
        else:
            a['imageScope']=a['image'].get('scope','exact-place')
        # A portrait is not an image of a memorial.
        if a['article'] in ['Thomas Sankara','Bio Guera']:
            a['article']=c['article'];a['image']['sourceUrl']=wiki(c['article'])
for item in ITEMS:
    if item['kind']=='experience':
        item['experienceType']={'music':'performance','culture':'local-life'}.get(item['experienceType'],item['experienceType'])
        if item['experienceType']=='festival':
            item['automaticPlanning']=False
            item['seasonality']['dateSpecific']=True
            if item['cityId']=='ouagadougou': item['seasonality']['months']=[2,3]
            if item['cityId']=='cotonou': item['seasonality']['months']=[1]
for food in FOODS:
    if food['id'] in ['food-bamako-to','food-ouagadougou-to']:
        food['article']='Tô (mets)'
        food['articleLanguage']='fr'
        food['image']['sourceUrl']='https://fr.wikipedia.org/wiki/T%C3%B4_(mets)'
        food['photoStatus']='needs-food-photo'
    if food['id']=='food-kinshasa-moambe-chicken':
        food['name']='棕榈果酱炖鸡'
    if food['id']=='food-algiers-kalb-el-louz':
        food['name']='杏仁糖浆粗麦糕'
    if food['id']=='food-niamey-kilishi-and-suya':
        food['nameEn']=food['localName']='Suya'
        food['description']='肉串以香料调味后烤制，花生粉较常见，过敏者需先询问。'
        food['imageQuery']='Suya grilled meat skewers Niger'
    if food['id']=='food-niamey-tuwo':
        food['name']='米粉主食团'
        food['nameEn']=food['localName']='Tuwo shinkafa'
        food['description']='米制软团搭配叶菜、肉或蔬菜汤汁，是豪萨饮食中的主食选择。'
        food['imageQuery']='Tuwo shinkafa rice food Niger'
    if food['articleScope']=='regional-cuisine' or food['article'] in ['Gnetum africanum','Cooking banana','Oyster','Fish as food','Fonio','Dacryodes edulis','Couscous']:
        food['photoStatus']='needs-food-photo'
    if food.get('articleLanguage')=='fr':
        food['photoStatus']='needs-food-photo'
    if food['nameEn']=='Atassi': food['name']='豆与米饭'
for c in CITIES:
    if c['id']=='dakhla':
        c['_food']='Western Saharan cuisine'
        for r in c['sourceReferences']:
            if 'Sahrawi_cuisine' in r['url']: r['url']=wiki('Western Saharan cuisine')
        c['sourceReferences'].append(ref('https://www.secretflying.com/guides/dakhla-western-sahara/food/','达赫拉餐饮类型及牡蛎、烤鱼、塔吉锅和茶的地方背景'))
    if c['id']=='tripoli-libya': c['nameEn']='Tripoli'
    for a in c['attractions']:
        if a['article']=='Lac Ma Vallée':
            a['article']='Kinshasa';a['imageScope']='nearby';a['image']['scope']='nearby';a['image']['sourceUrl']=wiki('Kinshasa')
            a['imageContextNote']='展示金沙萨周边环境，马瓦莱湖的具体景观照片待逐项匹配。'
for food in FOODS:
    if 'dakhla' in food['cityIds']:
        food['sourceUrl']=wiki('Western Saharan cuisine')
        food['sourceReferences']=[ref(food['sourceUrl'],'西撒哈拉区域饮食背景'),ref('https://www.secretflying.com/guides/dakhla-western-sahara/food/','达赫拉餐饮类型参考；非菜单或报价')]
        food['price']['sourceUrl']=food['sourceUrl']
for item in ITEMS:
    if item.get('article')=='Sahrawi cuisine':
        item['article']='Western Saharan cuisine';item['image']['sourceUrl']=wiki(item['article'])
for c in CITIES:
    if c['id']=='dakhla':
        c['article']='Dakhla, Western Sahara'
        c['image']['sourceUrl']=wiki(c['article'])
        for a in c['attractions']:
            if a.get('article')=='Dakhla':
                a['article']=c['article'];a['image']['sourceUrl']=wiki(c['article'])
for item in ITEMS + FOODS:
    if item.get('article')=='Dakhla':
        item['article']='Dakhla, Western Sahara'
        item['image']['sourceUrl']=wiki(item['article'])
    item['imagePolicy']='photograph-only'
for c in CITIES:
    for attraction in c['attractions']:
        attraction['imagePolicy']='photograph-only'
for food in FOODS:
    if food['id'] in ['food-nouakchott-lakh','food-dakhla-fish-tagine']:
        food['photoStatus']='needs-food-photo'

def validate():
    assert len(CITIES)==19
    assert len({c['id'] for c in CITIES})==19
    assert len({e['id'] for e in ITEMS})==len(ITEMS)
    assert len({f['id'] for f in FOODS})==len(FOODS)
    allowed={'festival','marine','wildlife','nature','craft','performance','food-life','local-life','literary'}
    for c in CITIES:
        assert c['contentTier']=='standard'
        assert len(c['attractions'])>=7,c['id']
        assert len({(a['lat'],a['lng']) for a in c['attractions']})>=6,c['id']
        assert len([x for x in ITEMS if x['cityId']==c['id'] and x['kind']=='experience'])>=3,c['id']
        assert len([x for x in ITEMS if x['cityId']==c['id'] and x['kind']=='hotel'])>=5,c['id']
        assert len([x for x in FOODS if c['id'] in x['cityIds']])>=5,c['id']
        if c.get('automaticPlanning') is False:
            assert not any(a['automaticPlanning'] for a in c['attractions']),c['id']
            assert not any(x['automaticPlanning'] for x in ITEMS if x['cityId']==c['id']),c['id']
    assert all(x['experienceType'] in allowed for x in ITEMS if x['kind']=='experience')

def write():
    validate()
    clean=[{k:v for k,v in c.items() if not k.startswith('_')} for c in CITIES]
    for folder,data in [('expansion',clean),('experience-expansion',ITEMS),('food-expansion',FOODS)]:
        (ROOT/'data'/folder/(PACK+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=['# 西、中、北非国家覆盖补充 · 2026-10-16','',
      '19 个城市/地区入口；每城 7 个具体地点、3 个体验、5 种食物、5 家具名住宿，共 380 条内容。城市采用 standard 深度，不降低现有完整度门槛。','',
      '## 核验边界','',
      '- 联网检索旅游主管部门、UNESCO、文化机构、自然保护组织、酒店官网、会议酒店名录、旅行网站和百科进行交叉补充。精确链接保存在各条 sourceReferences。',
      '- 参考来源用于地点身份、文化主题、食物背景或酒店存在性。旧版会议名录及旅行目录不能证明酒店当前营业；相应说明和 booking 搜索入口保留，不声称已验证日期房态。',
      '- 所有费用均为美元编辑预算，不是实时票价或房价。currency=USD；localCurrency 保存实际当地币种代码。门票、开放、交通、餐食供应和签证需按具体日期核实。',
      '- 坐标为规划街区级近似位置，远郊、离岸、需预约和公开节庆有单独限制；没有将全部条目放在同一点。',
      '- 图像 URL 初始留空交由媒体维护程序匹配。城市背景不能当作酒店或具体景点照片；区域图顶层 imageScope=nearby。泛饮食、原料及法语专门菜品设 needs-food-photo，阻止百科首图自动错配。',
      '- 旅游文字为独立编辑概括，不复制整段来源，也不将原始地图描述放入页面。','',
      '## 当前旅行建议','',
      '2026-10-16 读取英国 FCDO 的实际目的地建议：Mali、Niger、Burkina Faso 为 avoid-all-travel；Tripoli、N’Djamena、Bangui 为 restricted（避免非必要旅行）。六城的地点、体验和城市 automaticPlanning 均为 false。Kinshasa 为分区限制，不将整个首都错误归为全境禁止。资料保留是文化探索，不是保证安全或开放。',
      '', '西撒哈拉 EH 作为地区标识，不作主权判断。联合国页面正文遇到机器人验证，记录的是搜索索引所载非自治领土地位；未伪称读取全文。达赫拉住宿与活动由各运营者来源确认。','',
      '## 城市基准来源','', '| 城市 | 地区代码 | 文化/旅游来源 | 住宿基准来源 |','| --- | --- | --- | --- |']
    for c in CITIES:
        lines.append(f'| {c["name"]} / {c["nameEn"]} | {c["countryCode"]} | {c["_guide"]} | {c["_hotel"]} |')
    lines += ['','## 关键更名与照片处理','',
      '- 达喀尔 Sea Plaza 使用当前 Noom Hotel Dakar Sea Plaza 名称，保留原 Radisson Blu 背景供识别。',
      '- 恩贾梅纳 Hilton 使用官方目录中的 Hilton N’Djamena Toumai Palace，提醒区分旧物业，不以历史品牌推断营业。',
      '- Akassa (pâte) 与 Atassi 指向真实法语食物条目；英语 Akassa 是尼日利亚城镇，禁止误用其图片。',
      '- Koko 使用 Gnetum 食用叶主题，与木薯叶 Pondu 区分；Koki 是豆泥叶包而非花生名称。',
      '- 利比里亚未在本包重复添加，由主任务负责。','',
      '## 复现与边界检查','',
      '`py -X utf8 scripts/seed-country-fill-africa-west-20261016.py` 只写本包 3 个种子 JSON 与此来源记录。内置检查确认城市/条目 ID 唯一、每城内容数、坐标不全相同、体验类型合法、受限城市不自动规划。未执行导入、数据库更新、完整测试、构建或提交。','']
    (ROOT/'docs'/(PACK+'.md')).write_text('\n'.join(lines),encoding='utf-8')
    print(json.dumps({'cities':len(clean),'attractions':sum(len(c['attractions']) for c in clean),'experiences':sum(x['kind']=='experience' for x in ITEMS),'hotels':sum(x['kind']=='hotel' for x in ITEMS),'foods':len(FOODS)}))

if __name__=='__main__': write()
