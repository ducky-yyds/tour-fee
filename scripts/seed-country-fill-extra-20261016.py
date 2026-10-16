"""Maintained city definitions for the remaining country-coverage gaps.

The linked destination/food pages were read on 2026-10-16. Amounts are
editorial USD planning allowances, never a claim of currently bookable stock.
"""
import json
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DAY = '2026-10-16'
CITIES, EXPERIENCES, FOODS = [], [], []
def wiki(article): return 'https://en.wikipedia.org/wiki/' + quote(article.replace(' ', '_'))
def refs(url, scope='地点及文化背景；预算、用时和近似坐标为编辑规划参数'):
    return [{'name': url.split('/')[2], 'url': url, 'scope': scope, 'checkedAt': DAY, 'kind': 'reference'}]
def price(low, high, url, unit='person'):
    return {'low':low,'high':high,'currency':'USD','unit':unit,'type':'estimate','checkedAt':None,'sourceUrl':url,
            'note':'美元编辑预算，并非商家实时报价。零门票仅指公共区域，消费、接驳及收费内部区域另计；按日期核对税费、票种和服务范围。'}
def city(cid,name,en,cc,country,region,local,lat,lng,iata,days,intro,source,foodsource,daily,transport):
    c={'id':cid,'name':name,'nameEn':en,'countryCode':cc,'country':country,'region':region,'currency':'USD','localCurrency':local,'lat':lat,'lng':lng,'iata':iata,'article':en,
       'aliases':[name,en],'image':{'url':'','sourceUrl':wiki(en)},'tagline':intro,'description':intro,'tags':['地方文化','特色饮食','自然与生活'],
       'daily':dict(zip(['lodging','food','transport','misc'],daily)),'monthly':{'rent':[500,1200,2500],'utilities':[60,140,280]},
       'budgetBasis':{'type':'editorial-estimate','updatedAt':DAY,'note':f'以下采用美元 USD 作为规划计价基准，当地币种为 {local}；并非当地法定币种替代，也不是实时报价。三档住宿按每间每晚，饮食交通杂项按每成人每天，月租水电按每间每月。'},
       'tripDuration':{'min':max(2,days-1),'days':days,'max':days+2,'reason':transport},'transportNote':transport,'planningProfile':'balanced',
       'sourceReferences':refs(source),'officialTourismUrl':source,'attractions':[],
       'guide':{'cityId':cid,'intro':intro,'foodHighlights':[],'neighborhoods':[],'experienceIntro':'从城市文化、当地餐桌与自然活动中选择感兴趣的内容；季节活动按实际日期确认。'},'_source':source,'_foodsource':foodsource}
    CITIES.append(c);return c
def places(c,rows):
    for line in rows.strip().splitlines():
        slug,name,en,lat,lng,mins,low,high,kind,desc,*flags=line.split('|');mins=int(mins);remote='R' in flags
        c['attractions'].append({'id':c['id']+'-'+slug,'name':name,'nameEn':en,'article':en,'lat':float(lat),'lng':float(lng),'coordinateAccuracy':'approximate','coordinateNote':'景点或片区近似位置，实际入口以官方指引为准。',
          'durationHours':mins/60,'durationRange':{'min':max(20,round(mins*.6)),'recommended':mins,'max':round(mins*1.5)},'durationBasis':'editorial-estimate','category':kind,
          'activityType':'nature' if kind in ['海滩','自然公园','湖泊','海湾'] else 'culture','description':desc,'priority':65 if remote else 83,'visitRole':'optional' if remote else 'essential','automaticPlanning':not remote,
          'features':[kind,'城外往返另留时间' if remote else '可调整停留时间'],'bestTime':'参观前确认开放时间、天气及预约要求。','sourceUrl':c['_source'],'sourceReferences':refs(c['_source']),
          'image':{'url':'','sourceUrl':wiki(en)},'price':price(float(low),float(high),c['_source']),**({'accessNote':'城外项目，交通未包含在游览用时内，建议单独安排半日或整日。'} if remote else {})})
def experiences(c,rows):
    for line in rows.strip().splitlines():
        slug,name,en,mins,low,high,theme,desc,article,source,*flags=line.split('|');mins=int(mins);dated='D' in flags;remote='R' in flags
        EXPERIENCES.append({'id':'ex-'+c['id']+'-'+slug,'cityId':c['id'],'kind':'experience','name':name,'nameEn':en,'lat':c['lat'],'lng':c['lng'],'coordinateAccuracy':'city-area','coordinateNote':'城市级活动入口，并非经营者集合点；预约后按实际集合地址安排交通。',
          'durationMinutes':mins,'durationRange':{'min':max(30,round(mins*.7)),'recommended':mins,'max':round(mins*1.4)},'experienceType':theme,'description':desc,'localContext':desc,'tagline':en,'features':[name],
          'sourceUrl':source,'bookingUrl':source,'sourceReferences':refs(source),'provider':'通过所列目的地或运营方入口核对参与方式','article':article,'image':{'url':'','sourceUrl':wiki(article)},'imageScope':'related-theme','imageContextNote':'所述文化或自然主题的相关照片，不代表某一经营者套餐或当日现场。',
          'automaticPlanning':not(remote or dated),'requirements':['先确认活动日期、集合点、参与条件和费用包含项目。'],'seasonality':{'months':list(range(1,13)),'dateSpecific':dated,'note':'按当年公布日期举行，不代表每天举办。' if dated else '天气、季节及经营安排影响参与。'},
          'priceOptions':[{'id':'planning','name':'体验规划预算',**price(float(low),float(high),source),'includes':['所述体验预算'],'excludes':['未注明的接驳','餐饮与个人消费']}],**({'accessNote':'需另留城外接驳；不与市内短途活动机械拼接。'} if remote else {})})
def foods(c,rows):
    for line in rows.strip().splitlines():
        slug,name,en,desc,where,low,high,article=line.split('|')
        FOODS.append({'id':'food-'+c['id']+'-'+slug,'cityIds':[c['id']],'name':name,'nameEn':en,'localName':en,'description':desc,'article':article,'articleScope':'dish','image':{'url':'','sourceUrl':wiki(article)},'imageQuery':en+' food',
          'sourceUrl':c['_foodsource'],'sourceReferences':refs(c['_foodsource'],'区域饮食文化参考，不表示每间餐馆都供应或已核验菜单价格'),'sourceCheckedAt':DAY,'sourceStatus':'reference','catalogOrigin':'maintained-definition',
          'price':price(float(low),float(high),c['_foodsource'],'serving'),'servingNote':'按一份预留，作为当日餐饮选择，不与基础餐饮预算重复累加。',
          'whereByCity':{c['id']:[{'name':where,'kind':'area','sourceUrl':'https://www.google.com/maps/search/?api=1&query='+quote(c['nameEn']+' '+where+' '+en),'note':'寻味区域或经营者检索入口；具体菜单以当日供应为准。'}]}})
        c['guide']['foodHighlights'].append({'name':name,'description':desc})
def hotels(c,rows):
    for line in rows.strip().splitlines():
        slug,name,en,lat,lng,low,high,desc,url=line.split('|')
        EXPERIENCES.append({'id':'hotel-'+c['id']+'-'+slug,'cityId':c['id'],'kind':'hotel','name':name,'nameEn':en,'lat':float(lat),'lng':float(lng),'coordinateAccuracy':'approximate','coordinateNote':'住宿片区近似位置，实际门牌与接送点请在预订时核对。',
          'durationMinutes':0,'description':desc,'tagline':en,'features':['每间每晚','按日期核价'],'sourceUrl':url,'bookingUrl':url,'sourceReferences':[{'name':en,'url':url,'kind':'operator-link','checkedAt':None,'scope':'物业资料与预订核价入口；不声称检索入口等同于实时房态或逐项设施核验'}],
          'article':en,'image':{'url':'','sourceUrl':url},'imageScope':'exact-place','imageQuery':en+' '+c['nameEn']+' hotel','priceOptions':[{'id':'room','name':'每间每晚规划预算',**price(float(low),float(high),url,'room-night'),'includes':['客房预算'],'excludes':['税费及未注明早餐','接送与其他服务']}]})

c=city('nuuk','努克','Nuuk','GL','格陵兰','北美洲','DKK',64.1814,-51.6941,'GOH',4,'在彩色港湾读因纽特文化，去峡湾看山海，再把夜晚留给格陵兰音乐。','https://visitgreenland.com/destinations/nuuk/','https://visitgreenland.com/activities/greenlandic-gastronomy-a-taste-of-greenland/',[[95,180,340],[30,65,125],[8,25,80],[10,25,60]],'中心步行结合公交；峡湾游船另订，不把出海与市内步行按同一交通方式计算。')
c['monthly']={'rent':[950,1750,2900],'utilities':[100,220,420]}
places(c,'''national-museum|格陵兰国家博物馆|Greenland National Museum|64.1826|-51.7216|120|8|18|博物馆|从皮船、传统服饰与考古收藏理解格陵兰历史，尊重馆内对敏感展品的拍摄要求。
katuaq|卡图阿克文化中心|Katuaq|64.1763|-51.7378|75|0|15|文化场馆|欣赏以极光为灵感的木质立面，展览、咖啡和演出票务分开选择。
art-museum|努克艺术博物馆|Nuuk Art Museum|64.1798|-51.7308|100|5|15|美术馆|看格陵兰艺术家的创作与不同年代对北极生活的表达，按实际展线参观。
cathedral|努克主教座堂|Nuuk Cathedral|64.1838|-51.7440|40|0|0|宗教建筑|从教堂外的海岸位置看旧城轮廓；内部参观以礼拜和开放安排为准。
colonial-harbour|努克旧港|Nuuk|64.1825|-51.7400|80|0|0|港湾|沿公开木栈道看传统建筑、海湾与日常渔港，私人码头和住宅保持距离。''')
experiences(c,'''fjord|努克峡湾小团出海|Nuuk fjord cruise|240|130|260|nature|随当地船队进入峡湾，看陡峭山壁和水上聚落；海况可能改线，不保证遇见鲸鱼。|Nuup Kangerlua|https://visitgreenland.com/destinations/nuuk/|R
music|听一场格陵兰现场音乐|Greenlandic live music|120|20|65|performance|从当地语言歌曲和当代音乐了解岛上的生活，按卡图阿克或酒吧公布的演出日期选择。|Music of Greenland|https://visitgreenland.com/activities/music/|D
food|北极食材小份品尝|Greenlandic tasting meal|100|35|95|food-life|在明确标注食材的餐厅尝当季鱼类、驯鹿或麝牛料理，先询问来源、份量及个人饮食限制。|Greenlandic cuisine|https://traveltrade.visitgreenland.com/latest-news/4-things-to-tell-your-guests-about-food-in-greenland/''')
foods(c,'''soup|苏阿萨特炖汤|Suaasat|以肉、洋葱和谷物等慢煮的传统汤，肉类随家庭与店家配方变化。|努克市中心格陵兰菜餐厅|15|35|Suaasat
fish|当季格陵兰鱼排|Greenlandic fish plate|以当地捕获鱼类为主的餐盘，煎烤方式和配菜按当日渔获变化。|旧港及市中心餐厅|20|45|Greenlandic cuisine
reindeer|驯鹿肉料理|Reindeer steak|北极食材在现代餐厅中的一种选择，可先问熟度、来源与供应季节。|市中心北欧风味餐厅|30|65|Reindeer meat
muskox|麝牛肉汉堡|Musk ox burger|用麝牛肉替代常规牛肉的汉堡并非每店都有，点单时确认实际肉类。|努克市中心咖啡餐厅|22|38|Greenlandic cuisine
shrimp|格陵兰虾开放三明治|Greenland shrimp smorrebrod|虾与面包组成轻食，适合在博物馆和港湾参观间安排午餐。|市中心咖啡馆|12|25|Smørrebrød''')
hotels(c,'''hans|汉斯埃格德酒店|Hotel Hans Egede|64.176|-51.738|180|360|市中心酒店，便于衔接文化场馆和餐厅。|https://www.hhe.gl/
hhe|HHE快捷酒店|HHE Express|64.173|-51.737|110|210|市中心简洁住宿选项，按房型核对早餐。|https://traveltrade.visitgreenland.com/providers/hhe-express/
soma|努克SØMA酒店|Hotel SOMA Nuuk|64.167|-51.727|130|260|港区住宿，与旧港景点不是同一地点。|https://hotelsoma.com/nuuk/
inuk|伊努克旅舍|Inuk Hostels|64.190|-51.716|100|220|面向峡湾的小屋与旅舍，房间及卫浴形式按预订确认。|https://visitgreenland.com/de/local-experiences/inuk-hostels/
apartments|HHE努克公寓|Nuuk Hotel Apartments by HHE|64.177|-51.737|170|300|带厨房的公寓型选择，适合减少外食或延长停留。|https://traveltrade.visitgreenland.com/gl/providers/nuuk-hotel-apartments-by-hhe/''')

c=city('port-moresby','莫尔兹比港','Port Moresby','PG','巴布亚新几内亚','大洋洲','PGK',-9.4438,147.1803,'POM',3,'用博物馆、鸟类和海港认识巴布亚新几内亚的多样文化，近郊森林与海岛单独安排。','https://papuanewguinea.travel/stories/things-to-do-port-moresby/','https://en.wikipedia.org/wiki/Papua_New_Guinean_cuisine',[[85,155,300],[18,40,90],[30,65,140],[10,25,60]],'优先酒店接送、正规出租或预约向导，市区景点分散；机场与城外森林另留车程。')
places(c,'''museum|巴布亚新几内亚国家博物馆|Papua New Guinea National Museum and Art Gallery|-9.411|147.184|120|5|20|博物馆|看传统船只、雕刻与区域文化藏品，按馆方当期开放范围安排。
nature-park|莫尔兹比港自然公园|Port Moresby Nature Park|-9.375|147.151|150|15|35|自然公园|沿园内步道观察当地植物与鸟类，适合先认识区域生态。
parliament|国民议会外观|National Parliament House, Papua New Guinea|-9.414|147.183|45|0|0|建筑|观察融合传统屋顶语言的建筑外观；内部访问须另行获准，不默认开放。
bomana|博马纳战争公墓|Port Moresby (Bomana) War Cemetery|-9.387|147.247|90|0|0|历史纪念|在战争公墓了解太平洋战事与个人生命的历史，保持肃静。|R
ela-beach|埃拉海滩|Ela Beach|-9.480|147.151|75|0|0|海滩|选择白天和适合当地条件的短时海滨停留，出行前向住宿方确认路线。''')
experiences(c,'''varirata|瓦里拉塔森林观鸟|Varirata birdwatching|300|80|180|wildlife|由当地向导安排清晨森林观察，留意天堂鸟及林冠鸟类；不能保证遇见特定物种。|Varirata National Park|https://papuanewguinea.travel/stories/things-to-do-port-moresby/|R
bilum|认识比鲁姆编织袋|Bilum weaving introduction|90|15|50|craft|在工艺市场或事先预约的工作坊了解绳结、纹样与用途，课程须确认，不默认包含成品。|Bilum|https://papuanewguinea.travel/
island|洛洛阿塔海岛体验|Loloata island day visit|300|80|180|marine|向度假村核对日访船班和海上活动，浮潜与潜水须按资格及海况另选。|Loloata Island|https://papuanewguinea.travel/stories/things-to-do-port-moresby/|R''')
foods(c,'''mumu|木木地炉料理|Mumu|用热石慢熟肉类与根茎，是聚餐烹饪方式，需找明确提供该餐的活动或餐厅。|提供巴新菜的酒店餐厅与预约文化餐|15|35|Mumu (food)
sago|西米饼|Sago pancake|以西米加工的饼食反映区域主食传统，口感和搭配随做法变化。|地方菜餐厅和市场熟食摊|2|7|Sago
greens|椰奶绿叶菜|Aibika in coconut milk|用当地叶菜和椰奶烹煮，适合搭配根茎或米饭。|地方菜餐厅|4|12|Abelmoschus manihot
taro|蒸芋头与甘薯|Taro and kaukau|根茎食物在日常餐桌中常见，可作为主食或烤肉配菜。|市场熟食与本地餐厅|3|10|Sweet potato
fish|沿海烤鱼|Grilled coastal fish|按当日渔获选择熟制鱼类，配椰奶蔬菜或根茎更接近当地家常搭配。|海滨及酒店餐厅|12|30|Grilled fish''')
hotels(c,'''airways|航空酒店|Airways Hotel|-9.443|147.219|170|330|机场附近住宿，去海滨城区另算车程。|https://www.airways.com.pg/
grand-papua|大巴布亚酒店|Grand Papua Hotel|-9.479|147.149|150|310|城镇半岛的酒店选项，外出接送建议预约。|https://www.grandpapuahotel.com.pg/
hilton|莫尔兹比港希尔顿|Hilton Port Moresby|-9.435|147.188|165|350|胡贝尔山一带酒店，与国家博物馆方向衔接较方便。|https://www.hilton.com/en/hotels/pomsmhi-hilton-port-moresby-hotel-and-residences/
crown|皇冠酒店|Crown Hotel Port Moresby|-9.478|147.150|125|260|市区半岛酒店，按预订条款确认机场接送。|https://www.crownhotel.com.pg/
holiday-inn|莫尔兹比港假日酒店|Holiday Inn Port Moresby|-9.429|147.188|120|250|怀加尼方向住宿，便于连接政府文化区。|https://www.ihg.com/holidayinn/hotels/us/en/port-moresby/pomih/hoteldetail''')

c=city('granada-nicaragua','格拉纳达（尼加拉瓜）','Granada, Nicaragua','NI','尼加拉瓜','北美洲','NIO',11.9344,-85.9560,'MGA',3,'从彩色庭院走到湖畔，在市场尝木薯与猪皮的组合，再留半天给火山湖岛。','https://www.visitanicaragua.com/en/ciudades/granada/','https://www.visitanicaragua.com/en/atractivos/gastronomia/',[[30,70,150],[10,25,55],[8,20,50],[5,15,35]],'老城以步行为主；从马那瓜机场需公路接驳。湖岛和蒙巴乔火山分开安排，不当市内步行点。')
places(c,'''cathedral|格拉纳达主教座堂|Cathedral of Granada, Nicaragua|11.934|-85.956|60|0|5|宗教建筑|以中央公园周边建筑认识老城，登塔和内部参观按现场安排另计。
merced|拉梅尔塞德教堂|Iglesia de La Merced, Granada|11.931|-85.961|60|2|5|宗教建筑|可询问钟楼开放与登塔方式，从高处读老城街道和屋顶。
san-francisco|圣方济各修道院博物馆|San Francisco Convent, Granada|11.933|-85.953|100|5|10|博物馆|在历史修道院建筑中看地方文化与考古展示，按实际馆区参观。
central-park|中央公园|Granada, Nicaragua|11.934|-85.956|60|0|0|城市广场|在树荫、摊点与人群中认识市中心，适合安排一顿当地小吃。
islets|格拉纳达湖岛|Islets of Granada|11.912|-85.915|180|25|70|湖泊|乘正规游船看尼加拉瓜湖中的小岛，遵守自然观察距离，不诱喂动物。|R''')
experiences(c,'''cocoa|可可制作小课堂|Granada cacao workshop|120|25|45|craft|从可可豆烘焙与研磨认识饮品和巧克力，课程和材料按预约套餐确认。|Chocolate|https://www.chocomuseo.com/granada/
market|中央公园寻味|Granada local food tasting|90|8|22|food-life|围绕vigoron与本地饮品尝小份，餐食从当天餐饮偏好中选择，避免重复购买套餐。|Vigorón|https://www.visitanicaragua.com/en/platillos/vigorous/
mombacho|蒙巴乔云雾林步道|Mombacho cloud forest|300|35|90|nature|提前核对上山接驳、步道与向导，湿滑和云雾会影响观景；按半日到整日安排。|Mombacho|https://www.visitanicaragua.com/en/ciudades/granada/|R''')
foods(c,'''vigoron|木薯猪皮沙拉|Vigoron|熟木薯、脆猪皮与卷心菜组合，是格拉纳达常见地方小吃。|中央公园周边|3|7|Vigorón
gallo-pinto|米豆饭|Gallo pinto|米饭与豆类混炒，常作为早餐或配菜。|中央公园及本地早餐店|3|8|Gallo pinto
nacatamal|尼加拉瓜大粽|Nacatamal|玉米面包裹肉与配料后蒸熟，份量较大，常见于周末家庭餐。|老城本地餐厅与周末熟食摊|4|9|Nacatamal
baho|蕉叶蒸肉|Baho|肉、木薯与大蕉慢蒸，适合分食并搭配清爽蔬菜。|本地午餐店|5|12|Vaho
quesillo|奶酪玉米饼|Quesillo nicaraguense|软奶酪、玉米饼与洋葱等组成的小食，不同地区做法有差别。|老城小吃店|2|5|Quesillo''')
hotels(c,'''plaza-colon|科隆广场酒店|Hotel Plaza Colon Granada|11.934|-85.957|110|220|中央公园旁的庭院酒店，适合步行探索。|https://hotelplazacolon.com/
dario|达里奥酒店|Hotel Dario Granada|11.930|-85.950|90|190|卡尔萨达街方向的历史建筑酒店，街景与房间安静程度按房型核对。|https://hoteldario.com/
colonial|格拉纳达殖民风格酒店|Hotel Colonial Granada|11.935|-85.957|75|160|靠近市中心的庭院住宿，便于安排短途参观。|https://www.hotelcolonialgranada.com/
almirante|海军上将酒店|Hotel El Almirante Granada|11.935|-85.954|55|120|老城内的中小型住宿选项。|https://www.hotelelalmirante.com/
gran-francia|大法兰西酒店|Hotel La Gran Francia|11.933|-85.956|85|180|中央公园附近历史建筑住宿，开放与房型按预订确认。|https://www.lagranfrancia.com/''')

c=city('havana','哈瓦那','Havana','CU','古巴','北美洲','CUP',23.1136,-82.3666,'HAV',4,'用老城广场、海堤与现场音乐认识哈瓦那；把休息和交通弹性留在日程中。','https://www.cuba.travel/en/destinations/la-havana-cuba','https://www.cuba.travel/en/destinations/la-havana-cuba/restaurants-in-havana',[[35,100,240],[12,30,70],[12,35,90],[8,20,50]],'旧城局部可步行，跨到维达多需车程；供电、燃油与支付条件按出发前信息确认，美元预算不等同于当地兑换或支付承诺。')
places(c,'''old-square|老广场|Plaza Vieja, Havana|23.135|-82.350|75|0|0|历史广场|从庭院、阳台与公共空间认识哈瓦那老城，咖啡和博物馆可按兴趣选。
cathedral|哈瓦那主教座堂广场|Havana Cathedral|23.141|-82.352|60|0|5|宗教建筑|欣赏石质立面与周边建筑，礼拜和收费内部区域另行确认。
capitol|古巴国会大厦|El Capitolio|23.136|-82.359|100|10|25|历史建筑|内部导览与外部观赏分开安排，先核对票务与开放范围。
malecon|马雷贡海堤|Malecón, Havana|23.142|-82.373|90|0|0|海滨|选择海浪较平稳的路段看城市与海面，恶劣天气不靠近护岸。
fine-arts|古巴国家美术馆|Museo Nacional de Bellas Artes de La Habana|23.140|-82.357|150|8|20|美术馆|按兴趣选择古巴艺术或其他馆区，不把分散的展馆当成同一入口。''')
experiences(c,'''son|聆听古巴颂乐|Cuban son performance|120|15|45|performance|按场馆演出日程选择小型现场，理解节奏与舞蹈互动，消费及座位另核。|Son cubano|https://www.cuba.travel/en/destinations/la-havana-cuba
salsa|萨尔萨入门课|Havana salsa lesson|90|20|45|performance|预约当地舞蹈老师学习基本步伐，确认单人或双人课程以及授课语言。|Salsa (dance)|https://www.cuba.travel/en/destinations/la-havana-cuba
paladar|私房餐厅里的古巴餐桌|Havana paladar meal|100|20|50|food-life|选择菜单与价格清楚的paladar，了解家常配菜与城市饮食，餐饮纳入当天用餐预算选择。|Paladar|https://www.cuba.travel/en/destinations/la-havana-cuba/restaurants-in-havana''')
foods(c,'''ropa|撕牛肉炖菜|Ropa vieja|慢炖撕肉配番茄、甜椒等，常与米饭和豆类同吃。|老城与维达多的paladar|10|22|Ropa vieja
moros|黑豆米饭|Moros y cristianos|黑豆与米饭同煮，可作为主食或烤肉配菜。|本地餐厅|4|10|Moros y Cristianos (food)
yuca|蒜香木薯|Yuca con mojo|木薯配蒜与柑橘风味酱，口感与土豆不同。|古巴菜餐厅|4|9|Yuca con mojo
tostones|炸青大蕉|Tostones|压扁后再次炸制的大蕉片，适合分食，蘸酱依店家变化。|老城小餐厅|3|7|Tostones
flan|焦糖布丁|Flan cubano|古巴家庭和餐厅常见甜点，甜度较高，可与咖啡分食。|咖啡馆与餐厅|3|8|Crème caramel''')
hotels(c,'''nacional|古巴国家饭店|Hotel Nacional de Cuba|23.143|-82.381|120|280|维达多的历史酒店，与哈瓦那老城需要交通连接。|https://www.hotelnacionaldecuba.com/
manzana|曼萨纳凯宾斯基酒店|Gran Hotel Manzana Kempinski La Habana|23.138|-82.358|250|550|中央公园一带高端酒店，房态及支付条件按官网确认。|https://www.kempinski.com/en/gran-hotel-kempinski-la-habana
parque|中央公园伊贝罗斯塔酒店|Iberostar Parque Central|23.138|-82.359|150|330|靠近老城入口，适合把广场和美术馆串联。|https://www.iberostar.com/en/hotels/havana/iberostar-parque-central/
inglaterra|英格兰酒店|Hotel Inglaterra|23.137|-82.359|85|190|历史建筑住宿，按实际房型核对设备及服务。|https://www.hotel-inglaterra.com/
habana-libre|哈瓦那自由酒店|Hotel Habana Libre|23.140|-82.383|100|230|维达多的大型酒店，去海堤和老城分别安排交通。|https://www.meliacuba.com/hoteles-en-cuba/hotel-habana-libre/''')

c=city('roatan','罗阿坦岛','Roatan','HN','洪都拉斯','北美洲','HNL',16.3298,-86.5299,'RTB',4,'在加勒比珊瑚礁与加里富纳节奏之间慢下来，海滩午后本身也是旅行内容。','https://www.honduras.travel/playas.php','https://en.wikipedia.org/wiki/Honduran_cuisine',[[45,120,300],[15,35,80],[10,30,75],[8,20,50]],'西端、西湾与机场分散，陆路或水上出租需先问价；潜水和东岸村落分别留出半日。')
c['article']='Roatán'
places(c,'''west-bay|西湾海滩|West Bay, Roatan|16.275|-86.598|180|0|0|海滩|把半天留给海边休息，沙滩床、淋浴与餐饮按各经营者收费另计。
half-moon|半月湾|West End, Roatan|16.305|-86.592|120|0|0|海湾|小海湾连着餐馆与潜店，可结合岸边休息；下水前核对船只航道。
carambola|卡兰博拉植物园|Carambola Botanical Gardens|16.328|-86.567|100|12|25|自然公园|在植物园步道看热带植物与岛屿环境，雨后路面留意湿滑。
oak-ridge|橡树岭水上聚落|Oak Ridge, Roatan|16.386|-86.353|120|0|0|港湾|观察水边木屋与船只交通，进入村民住宅或拍摄人物前征求同意。|R
punta-gorda|蓬塔戈尔达村|Punta Gorda, Roatan|16.399|-86.370|120|0|0|文化聚落|认识加里富纳社区的语言与海岸生活，表演或餐食须向当地经营者确认。|R''')
experiences(c,'''reef|珊瑚礁潜水或浮潜|Roatan reef exploration|180|45|120|marine|按认证等级选潜水或浮潜，观察礁鱼与海绵，保持中性浮力并避免触碰珊瑚；不保证遇见特定生物。|Roatán Marine Park|https://www.roatanmarinepark.org/
garifuna|加里富纳鼓乐与餐桌|Garifuna music and food|150|25|65|performance|由社区经营者介绍鼓乐、语言和饮食，按实际活动预约，不把日常社区当全天表演场。|Garifuna music|https://www.honduras.travel/islas.php|R
kayak|海湾皮划艇午后|Roatan bay kayaking|120|20|55|marine|选适合当天天气的平静海湾，使用救生衣并遵守出海边界，租艇与向导费区分。|Roatán|https://www.honduras.travel/playas.php''')
foods(c,'''baleada|豆泥折叠面饼|Baleada|软面饼里加入豆泥、奶酪等，是洪都拉斯常见实惠餐食。|西端村本地早餐店|3|7|Baleada
machuca|马丘卡鱼汤|Machuca|捣制大蕉配鱼汤体现加里富纳餐桌传统，按店家确认鱼种与椰奶配方。|蓬塔戈尔达社区餐厅|10|22|Machuca (dish)
rice-beans|椰香红豆饭|Coconut rice and beans|岛屿餐桌常见配菜，椰奶与豆类搭配鱼肉。|西端与海岸本地餐厅|5|12|Rice and beans
fish|加勒比烤鱼|Caribbean grilled fish|按当日渔获选熟鱼料理，确认重量、配菜与整鱼计价方式。|西端海滨餐厅|12|28|Grilled fish
coconut-bread|椰子面包|Pan de coco|带椰香的面包适合早餐或海边小食，配咖啡另计。|岛上面包店|2|5|Pan de coco''')
hotels(c,'''infinity|无限海湾度假村|Infinity Bay Spa and Beach Resort|16.274|-86.598|180|400|西湾海滩公寓型度假选项，餐食和潜水套餐单独核对。|https://www.infinitybay.com/
mayan|玛雅公主度假村|Mayan Princess Beach and Dive Resort|16.275|-86.598|190|430|西湾海滨度假村，核对所选餐饮及潜水包含范围。|https://www.mayanprincess.com/
anthony|安东尼礁度假村|Anthony's Key Resort|16.329|-86.568|180|420|桑迪湾潜水基地型住宿，按资格和套餐选择潜水内容。|https://anthonyskey.com/
kimpton|金普顿大罗阿坦度假村|Kimpton Grand Roatan Resort and Spa|16.269|-86.598|300|650|西湾南端高端度假住宿。|https://www.grandroatanresortandspa.com/
tranquilseas|静海生态旅舍|Tranquilseas Eco Lodge|16.324|-86.574|120|280|桑迪湾的小型住宿，去西端和机场需交通。|https://www.tranquilseas.com/''')

c=city('antigua-guatemala','安提瓜（危地马拉）','Antigua Guatemala','GT','危地马拉','北美洲','GTQ',14.5586,-90.7337,'GUA',4,'在火山背景下看拱门、修道院与庭院，咖啡、可可和圣周工艺让老城更有层次。','https://visitguatemala.gt/ciudades/antigua-guatemala/','https://en.wikipedia.org/wiki/Guatemalan_cuisine',[[35,90,220],[12,30,65],[8,25,70],[8,20,45]],'老城步行为主，机场从危地马拉城公路接驳；火山徒步不是市内短行程，须另择整日或过夜。')
places(c,'''arch|圣卡塔利娜拱门|Santa Catalina Arch|14.560|-90.734|45|0|0|历史建筑|在公开街道看拱门与山景，清晨较适合慢走，尊重交通和居民出入口。
merced|拉梅尔塞德教堂|La Merced Church, Antigua Guatemala|14.561|-90.735|75|0|8|宗教建筑|观察立面纹饰，教堂与修道院遗址的参观范围和收费分开核对。
capuchinas|嘉布遣修道院遗址|Capuchinas Convent|14.561|-90.731|90|5|12|历史遗址|通过庭院、廊道和圆形空间认识修道生活，不进入保护封闭区域。
central-park|中央公园|Parque Central, Antigua Guatemala|14.557|-90.734|60|0|0|城市广场|在树荫下看老城日常，可把附近教堂与午餐安排在同一区域。
cathedral|安提瓜主教座堂遗址|Antigua Guatemala Cathedral|14.557|-90.733|90|3|10|宗教遗址|区分仍使用的教堂与后方遗址空间，按实际开放和票务安排。''')
experiences(c,'''coffee|小农咖啡采收与杯测|Antigua coffee cooperative tour|180|30|65|food-life|在安提瓜周边合作社了解咖啡处理与风味，采收只能在相应季节参与，交通另留时间。|Guatemalan coffee|https://www.dlgcoffee.org/|R
cacao|可可豆到巧克力|Antigua chocolate workshop|120|25|45|craft|通过研磨与调味了解可可饮品和巧克力，不把不同历史传统混称为同一道甜点。|Chocolate|https://www.chocomuseo.com/antigua/
holy-week|圣周花毯与游行文化|Antigua Holy Week carpets|180|0|20|festival|按当年圣周日程观察花毯制作与宗教游行，不跨踩作品；街道封闭会改变交通。|Holy Week in Guatemala|https://visitguatemala.gt/blog/semana-santa-antigua-guatemala/|D''')
foods(c,'''pepian|佩皮安炖菜|Pepian|用焙烤香料、种子和蔬菜调味的浓汁炖菜，肉类按店家配方变化。|老城本地午餐店|7|16|Pepián
jocon|绿酱鸡|Jocon|以绿色蔬菜与香草组成的酱汁配鸡肉，常与米饭或玉米饼同吃。|传统危地马拉菜餐厅|7|16|Jocón
tamales|蕉叶玉米粽|Guatemalan tamales|蒸制玉米面加肉或其他馅料，叶包形式与口味有地区差别。|中央市场熟食摊|3|8|Tamal
rellenitos|豆沙大蕉球|Rellenitos de platano|甜大蕉包豆馅后煎炸的小食，适合与同伴分食。|市场和传统甜点店|2|5|Rellenitos de plátano
atol|甜玉米热饮|Atol de elote|用嫩玉米制成的浓热饮，甜度和香料因摊位而异。|市场早餐摊|2|4|Atol de elote''')
hotels(c,'''santo-domingo|圣多明各博物馆酒店|Hotel Casa Santo Domingo|14.558|-90.728|170|400|在历史修道院遗址周边形成的酒店，博物馆与住宿服务分别确认。|https://www.casasantodomingo.com.gt/es/
porta|安提瓜波尔塔酒店|Porta Hotel Antigua|14.553|-90.734|140|300|老城南侧的庭院酒店，步行到中央公园较方便。|https://www.portahotelantigua.com/
convento|修道院精品酒店|El Convento Boutique Hotel Antigua|14.561|-90.732|180|350|靠近嘉布遣修道院一带的小型高端住宿。|https://www.elconventoantigua.com/
panza|潘萨维尔德旅馆|Meson Panza Verde|14.551|-90.733|150|330|第五大道南端的小型艺术氛围酒店，年龄等入住条件按官网确认。|https://www.panzaverde.com/hotel
good|安提瓜Good酒店|Good Hotel Antigua|14.555|-90.729|100|220|老城东南侧的设计型住宿，适合以步行为主的停留。|https://goodhotel.co/antigua/''')

c=city('monrovia','蒙罗维亚','Monrovia','LR','利比里亚','非洲','LRD',6.3156,-10.8074,'ROB',3,'从普罗维登斯岛和博物馆认识建城历史，在市场、海岸和当地餐桌间观察城市生活。','https://enjoyliberia.travel/blog/','https://en.wikipedia.org/wiki/Liberian_cuisine',[[65,130,260],[12,30,65],[25,55,120],[10,25,55]],'机场距离市区较远，提前安排住宿接送；市内用可靠车辆衔接，海岸步行需先向当地住宿方了解条件。')
places(c,'''museum|利比里亚国家博物馆|Liberian National Museum|6.321|-10.801|100|5|15|博物馆|以历史、艺术与民族文化藏品认识利比里亚，馆区及导览安排需事先确认。
providence|普罗维登斯岛|Providence Island, Liberia|6.333|-10.796|90|0|10|历史地点|从河口岛屿了解移民、建城与地方社群历史，访前确认进入与导览方式。
centennial|百年纪念亭|Centennial Pavilion|6.323|-10.800|50|0|5|历史建筑|在开放外部空间认识纪念性建筑，内部和官方活动期间须另行核准。
waterside|沃特赛德市场|Waterside Market|6.330|-10.801|90|0|0|地方市场|留意布料、日用品与交易方式，拍摄摊主先征得同意，推荐与熟悉路线的当地向导同行。
cece|塞塞海滨|Monrovia|6.288|-10.789|90|0|0|海滩|把海岸作为白天短暂停留点，海浪与水流不适合仅凭外观判断是否可游泳。''')
experiences(c,'''food|利比里亚家常菜小餐桌|Liberian home-style food|100|15|35|food-life|在菜单清楚的本地餐厅比较木薯叶、棕榈汁和米饭的搭配，询问辣度与肉类。
fabric|西非布料与裁缝交流|Monrovia textile and tailoring|120|15|50|craft|在市场与裁缝店认识面料、花纹和成衣过程，定制服装价格与取货日期单独谈妥。
art|蒙巴角画廊与当代艺术|Mamba Point gallery visit|90|0|20|craft|按画廊开放时间看本地创作，作品购买不含在参观预算内。'''.replace('|food-life|在菜单清楚的本地餐厅比较木薯叶、棕榈汁和米饭的搭配，询问辣度与肉类。','|food-life|在菜单清楚的本地餐厅比较木薯叶、棕榈汁和米饭的搭配，询问辣度与肉类。|Liberian cuisine|https://en.wikipedia.org/wiki/Liberian_cuisine').replace('|craft|在市场与裁缝店认识面料、花纹和成衣过程，定制服装价格与取货日期单独谈妥。','|craft|在市场与裁缝店认识面料、花纹和成衣过程，定制服装价格与取货日期单独谈妥。|African wax prints|https://enjoyliberia.travel/blog/').replace('|craft|按画廊开放时间看本地创作，作品购买不含在参观预算内。','|craft|按画廊开放时间看本地创作，作品购买不含在参观预算内。|Monrovia|https://enjoyliberia.travel/stays/mamba-point-hotel/'))
foods(c,'''cassava-leaf|木薯叶炖菜|Cassava leaf stew|充分熟制的木薯叶与肉、鱼或油脂同炖，通常配米饭。|市中心利比里亚菜餐厅|6|15|Cassava leaf soup
palm-butter|棕榈汁炖菜|Palm butter|用棕榈果汁形成浓郁汤汁，肉或鱼的搭配依餐厅变化。|本地午餐店|7|17|Palm nut soup
jollof|西非番茄米饭|Liberian jollof rice|利比里亚家庭式番茄米饭有自己的配料习惯，与烤肉或蔬菜组合。|本地餐厅|6|15|Jollof rice
torborgee|托博吉炖豆|Torborgee|以豆类和特色调味烹制的利比里亚菜，味道较浓，适合先点小份。|提供地方菜的餐厅|6|15|Torborgee
dry-rice|干米饭配鱼|Liberian dry rice|以米饭配熏鱼、酱汁或调味，是当地日常餐食的一种形式。|市区本地餐馆|5|12|Liberian cuisine''')
hotels(c,'''mamba|蒙巴角酒店|Mamba Point Hotel|6.319|-10.812|150|290|靠近海岸的酒店，适合以预约接送串联城市参观。|https://enjoyliberia.travel/stays/mamba-point-hotel/
royal|皇家大酒店|Royal Grand Hotel Monrovia|6.292|-10.779|130|270|市区酒店，有餐厅等设施，具体开放按预订核对。|https://enjoyliberia.travel/stays/royal-grand-hotel/
boulevard|大道宫酒店|Boulevard Palace Hotel|6.288|-10.775|140|290|塔布曼大道方向住宿，与老城需车辆衔接。|https://www.boulevardpalacelib.com/
diana|戴安娜酒店|Diana Hotel Monrovia|6.309|-10.797|70|145|蒙罗维亚市区中小型酒店，按日期确认可订房型。|https://enjoyliberia.travel/stays/?refinementList%5Bfeatures.accommodation_types%5D%5B0%5D=Hotel
embassy|使馆套房酒店|Embassy Suites Hotel Monrovia|6.317|-10.809|90|180|市区住宿选项，套房与普通房的价格及服务分开核对。|https://enjoyliberia.travel/stays/?refinementList%5Bfeatures.accommodation_types%5D%5B0%5D=Hotel''')

c=city('santo-domingo','圣多明各','Santo Domingo','DO','多米尼加共和国','北美洲','DOP',18.4861,-69.9312,'SDQ',3,'以殖民城为起点，读加勒比历史，尝大蕉和炖汤，再用一段梅伦格舞感受城市节奏。','https://www.godominicanrepublic.com/en/destinations/santo-domingo','https://mirex.gob.do/cultura/gastronomia/',[[40,100,240],[12,30,70],[10,30,80],[8,20,50]],'殖民城集中步行；国家公园、海滨大道和现代城区用车辆衔接，机场在城外另留接驳。')
places(c,'''cathedral|美洲首座主教座堂|Basilica Cathedral of Santa Maria la Menor|18.472|-69.884|75|0|8|宗教建筑|看殖民城的宗教建筑与公共广场，服装要求和内部参观范围按馆方确认。
ozama|奥萨马要塞|Fortaleza Ozama|18.473|-69.882|90|3|10|历史要塞|从石墙和临河位置认识城市防御历史，登高范围按当日开放。
royal-houses|王室宫殿博物馆|Museo de las Casas Reales|18.477|-69.883|100|3|10|博物馆|从行政建筑和展览理解加勒比殖民历史，不把历史叙事简化为建筑打卡。
columbus-park|哥伦布公园|Parque Colon|18.473|-69.885|60|0|0|历史广场|在广场树荫下休息，看周边街道与日常生活，餐饮消费另计。
three-eyes|三眼洞湖公园|Los Tres Ojos|18.480|-69.843|120|5|15|自然公园|沿洞穴步道看石灰岩湖泊，台阶较多，园内船只或额外区域另核。''')
experiences(c,'''merengue|梅伦格舞入门|Merengue dance introduction|90|15|40|performance|跟随当地老师学习基本节奏和搭步，确认课程地点与单人参与方式。|Merengue (dance)|https://www.godominicanrepublic.com/en/destinations/santo-domingo
food|多米尼加家常餐桌|Dominican local lunch|100|15|35|food-life|用米饭、豆类与炖菜认识日常餐桌，先看清份量，避免把多道主菜同时算成必要开销。|Dominican Republic cuisine|https://mirex.gob.do/cultura/gastronomia/
cacao|可可与巧克力体验|Santo Domingo cacao workshop|120|25|55|craft|在殖民城相关工作坊学习可可加工与品尝，材料和带走成品按实际课程确认。|Chocolate|https://www.chocomuseo.com/santo-domingo/''')
foods(c,'''mangu|青大蕉泥早餐|Mangu|煮熟青大蕉捣泥，常配鸡蛋、奶酪等；组合内容与价格按菜单选择。|殖民城早餐店|5|12|Mangú
sancocho|桑科乔炖汤|Dominican sancocho|肉、根茎和蔬菜组成的浓汤，实际肉类种数不固定。|多米尼加菜餐厅|8|18|Sancocho
bandera|多米尼加家常套餐|La bandera dominicana|米饭、豆类和肉菜构成的日常午餐组合，适合对比不同餐馆的配菜。|本地午餐店|6|15|Dominican Republic cuisine
tostones|炸青大蕉|Tostones|双炸大蕉片适合分食，作为配菜时不用再点多份主食。|本地餐厅|3|7|Tostones
habichuelas|甜奶红豆羹|Habichuelas con dulce|豆类、奶与香料制成的甜品，尤其与复活节时期饮食相关。|传统甜品店和季节摊点|3|7|Habichuelas con dulce''')
hotels(c,'''ovando|尼古拉斯德奥万多酒店|Hodelpa Nicolas de Ovando|18.476|-69.883|170|350|殖民城拉斯达马斯街的历史建筑酒店。|https://www.hodelpa.com/hodelpa-nicolas-de-ovando.html
caribe|加勒比殖民酒店|Hodelpa Caribe Colonial|18.473|-69.884|85|180|殖民城核心住宿选项，便于步行串联景点。|https://www.hodelpa.com/
novus|诺乌斯广场酒店|Novus Plaza Hodelpa|18.474|-69.885|65|140|殖民城内的简洁城市酒店，按日期核对早餐。|https://www.hodelpa.com/
billini|比利尼酒店|Billini Hotel|18.470|-69.886|150|320|殖民城的精品型酒店，建筑风格与现代服务结合。|https://www.billinihotel.com/
beaterio|贝阿特里奥旅馆|El Beaterio Casa Museo|18.471|-69.885|80|170|历史建筑内的小型住宿，按实际房型确认设施。|https://www.elbeaterio.com/''')

EXTRA_PLACES = {
 'nuuk': ('https://visitgreenland.com/destinations/nuuk/', '''egede-house|汉斯埃格德故居外观|Hans Egede House|64.1818|-51.7388|35|0|0|历史建筑|从公共道路看旧港的早期木屋，了解殖民历史；建筑仍有公务用途，不默认室内开放。
local-museum|努托卡克地方博物馆|Nuuk Local Museum|64.1824|-51.7393|75|0|12|地方博物馆|以城市居民的生活、照片和物件认识努克的近现代变化，与国家博物馆的展览主题不同。'''),
 'port-moresby': ('https://papuanewguinea.travel/port-moresby-ncd/', '''apec-haus|APEC大厦海滨外观|APEC Haus|-9.4814|147.1518|40|0|0|当代建筑|在允许进入的公共海滨看以航海文化为灵感的建筑；会议区域和内部访问须获准。
adventure-park|冒险公园与兰花园|Adventure Park PNG|-9.354|147.282|180|0|30|自然公园|在14英里方向的公园欣赏兰花和园林，游乐项目另付费，入园与项目开放先询问园方。|R'''),
 'granada-nicaragua': ('https://www.nicaraguacreativa.com/wp-content/uploads/2022/04/Mapa-Granada_Ruta-creativa_compressed.pdf', '''polvora|拉波尔沃拉堡|Fuerte La Polvora|11.928|-85.971|60|0|5|历史建筑|沿旧城西侧认识早期防御建筑，内部开放不固定，可先以公共区域外观参观安排。
calzada|拉卡尔萨达街|Calle La Calzada, Granada|11.9308|-85.9517|75|0|0|街区|在老城连接湖岸方向的街道看彩色立面、咖啡馆和夜间餐饮，步行本身免费，消费另算。'''),
 'havana': ('https://www.cuba.travel/en/wheretogo/havana/whattodo/culture', '''revolution-museum|革命博物馆外观与纪念区|Museum of the Revolution (Cuba)|23.1417|-82.3567|90|0|15|历史博物馆|旧总统府周边展示革命历史；主馆若维修则只看开放的外部与纪念区，先确认实际展览范围。
real-fuerza|皇家军队城堡|Castillo de la Real Fuerza|23.1445|-82.3491|90|5|15|历史要塞|从港口防御建筑与馆内航海展示认识城市海洋史，按开放区域选择参观。'''),
 'roatan': ('https://www.honduras.travel/en/beaches.php', '''sandy-bay|桑迪湾公共海岸|Sandy Bay, Roatan|16.329|-86.564|120|0|0|海滩|在可进入的公共海岸慢下来，尊重度假村边界和船道，沙滩设施与餐饮另计。
roatan-museum|罗阿坦博物馆|Roatan Museum|16.328|-86.570|75|5|15|地方博物馆|在RIMS建筑内通过物件、壁画和文献认识海湾群岛文化；先向Anthony’s Key确认日访和开放。'''),
 'antigua-guatemala': ('https://visitguatemala.gt/en/blog/santa-catalina-arch-history-interesting-facts/', '''tanque|拉乌尼翁洗衣池|Tanque La Union|14.555|-90.730|40|0|0|历史街景|看旧洗衣池的长拱廊与相邻广场，理解过去的日常公共生活，适合短停而非单独占半日。
cruz|十字架山观景点|Cerro de la Cruz, Antigua Guatemala|14.564|-90.733|100|0|0|观景点|白天沿开放路线登高看古城格网与阿瓜火山，遇雨和低云可调整安排。'''),
 'monrovia': ('https://enjoyliberia.travel/pages/monrovia/', '''ducor|杜科山与旧酒店外观|Ducor Hotel|6.320|-10.814|60|0|0|历史遗址|在允许进入的公共区域看城市与海岸，旧酒店不作为可住宿酒店，也不进入封闭或破损建筑。
silver-beach|银滩海岸午后|Silver Beach, Monrovia|6.244|-10.680|180|0|10|海滩|在城市外围海岸休息，向当地经营者确认进入方式、海况和返程；不默认可安全下水。|R'''),
 'santo-domingo': ('https://www.godominicanrepublic.com/weddings/best-places-for-photos', '''alcazar|哥伦布宫|Alcazar de Colon|18.478|-69.883|100|5|15|历史博物馆|在西班牙广场旁认识早期殖民建筑与居住文化，具体展室按当期开放安排。
san-francisco|圣方济各修道院遗址|Monasterio de San Francisco, Santo Domingo|18.478|-69.887|60|0|0|历史遗址|从公共区域看石墙与拱门，晚间音乐活动须按实际日程核对，不默认每天有演出。'''),
}
for c in CITIES:
    c['contentTier'] = 'standard'
    if c['region'] in ['北美洲', '南美洲']:
        c['region'] = '美洲'
    source, rows = EXTRA_PLACES[c['id']]
    previous = c['_source']; c['_source'] = source
    places(c, rows); c['_source'] = previous
    for place in c['attractions'][-2:]:
        place['priority'] = 55
        place['visitRole'] = 'optional'
        if place['id'].endswith(('revolution-museum', 'polvora', 'ducor', 'roatan-museum')):
            place['automaticPlanning'] = False
for item in FOODS:
    if item['id'] in ['food-nuuk-shrimp', 'food-granada-nicaragua-quesillo']:
        item['photoStatus'] = 'needs-food-photo'
    if item['article'] in ['Sago', 'Abelmoschus manihot', 'Sweet potato', 'Reindeer meat']:
        item.update(articleScope='ingredient', photoStatus='needs-food-photo')
    elif item['article'] in ['Greenlandic cuisine', 'Dominican Republic cuisine', 'Liberian cuisine']:
        item.update(articleScope='regional-cuisine', photoStatus='needs-food-photo')
    if item['cityIds'] == ['roatan'] and item['article'] == 'Pan de coco':
        item['article'] = 'Pan de coco (Honduran cuisine)'
        item['image']['sourceUrl'] = wiki(item['article'])
for item in EXPERIENCES:
    for reference in item.get('sourceReferences', []):
        if reference.get('checkedAt') is None:
            reference['verificationStatus'] = 'unverified'
    if item.get('experienceType') == 'festival' and item['cityId'] == 'antigua-guatemala':
        item['seasonality']['months'] = [3, 4]
for c in CITIES:
    for place in c['attractions']:
        if place['article'] in [c['nameEn'], c['article']]:
            place.update(imageScope='nearby', imageContextNote='所在城市或街区的实景参考；不表示照片正对该地点入口。')
    c.pop('_source');c.pop('_foodsource')
for item in [*FOODS, *EXPERIENCES, *(a for c in CITIES for a in c['attractions'])]:
    item['imagePolicy'] = 'photograph-only'
for folder, rows in [('expansion',CITIES),('experience-expansion',EXPERIENCES),('food-expansion',FOODS)]:
    out=ROOT/'data'/folder/'country-fill-extra-20261016.json'
    out.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'cities':len(CITIES),'places':sum(len(c['attractions']) for c in CITIES),'experiences':sum(e['kind']=='experience' for e in EXPERIENCES),'hotels':sum(e['kind']=='hotel' for e in EXPERIENCES),'foods':len(FOODS)}))
