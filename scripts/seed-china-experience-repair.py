"""Source-backed activities enriching the existing Chinese city catalog.

Run explicitly; rewrites this batch only. Amounts are planning allowances unless
the entry specifically identifies a published official ticket.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-10-07'
# city, slug, title, English, theme, coordinate, minutes, budget, months,
# requires-date, remote, article, source, description, local context
ROWS = [
 ('chengdu','sichuan-cooking','在川菜博物馆学做一道川菜','Sichuan cooking at the cuisine museum','food-life',30.871,103.887,180,180,480,None,False,True,'Sichuan cuisine','https://zhuanti.mct.gov.cn/xcss2024_xcyfw/sichuan/detail/7522.html','先看郫县豆瓣和传统炊具，再预约动手烹饪课程，理解花椒、豆瓣与火候如何组成川味。课程内容和是否包含用餐要向馆方确认；场馆位于郫都区古城镇，往返市中心宜留半日。','川菜的调味不仅是辣，也包括发酵、香气与火候。'),
 ('guangzhou','canton-enamel','在广彩工坊认识金彩与瓷绘','Canton enamel porcelain workshop','craft',23.119,113.252,120,100,350,None,True,False,'Canton porcelain','https://www.gz.gov.cn/zt/zzyyzq/wlzx/content/post_8518845.html','从大新路一带的传统工艺展示与广彩工坊开始，观察金彩、花鸟和开光构图。选择公开预约的课程后再安排瓷绘体验，烧制、取件或寄送另向工坊确认。','外销瓷传统与广府手艺在笔触和配色中相遇。'),
 ('harbin','songhua-ice-games','松花江开放冰场的冰上游戏','Songhua River winter ice activities','nature',45.783,126.615,120,50,200,[12,1,2],True,False,'Songhua River','https://hrbggzy.harbin.gov.cn/cqjy/003008/003008001/20251117/a0aab43a-21ff-4816-8507-5fc9db344467.html','冰雪嘉年华开放期间，可按当天项目选择冰滑梯、雪圈和冰上游戏。只进入有管理的开放冰场，项目开放受冰情影响；往年活动不代表出行日已有运营。','冻结的江面在冬季成为城市游乐空间。'),
 ('harbin','yabuli-ski','亚布力滑雪入门的一整天','A full ski day at Yabuli','nature',44.756,128.466,420,350,950,[11,12,1,2,3],False,True,'Yabuli Ski Resort','https://tyj.hlj.gov.cn/tyj/c112420/202511/c00_31885318.shtml','提前选择适合初学者的雪场与教练，预算分别核对雪票、雪具、教学和保险。亚布力远离哈尔滨城区，应安排铁路加接驳或住一晚，不能与市区半日游直接拼接。','从缓坡学会制动，再按技术水平选择雪道。'),
 ('harbin','songhua-ferry','坐轮渡从江面看哈尔滨','Cross the Songhua by passenger ferry','local-life',45.786,126.617,60,10,60,[5,6,7,8,9,10],False,False,'Songhua River','https://hlj.msa.gov.cn/content/2024/22141.html','在防洪纪念塔附近码头选择当日运营的客渡航线，从江面看两岸建筑与太阳岛。单程过江和环线游船是不同产品，核对到达码头与末班后再购买。','过江船让城市通勤与江上风景共用一段时间。'),
 ('harbin','forest-botany','在森林植物园认识东北林木与物候','Discover northeastern trees at the forest botanical garden','nature',45.703,126.648,150,15,40,[4,5,6,7,8,9,10],False,False,'Heilongjiang Forest Botanical Garden','https://wlt.hlj.gov.cn/wlt/c114254/202503/c00_31824273.shtml','沿植物园开放路线观察树叶、树皮和季节花园，对照标牌认识东北林木；选择一两个专类园慢看即可。花期受天气影响，地铁到站后仍有步行距离，闭园季不排入。','城市中的森林课堂可以随季节看见不同的植物生长阶段。'),
 ('harbin','beer-culture','在哈啤博物馆读一座城市的酿造史','Harbin brewing history at the beer museum','food-life',45.590,126.631,120,50,120,None,False,True,'Harbin Beer','https://dva.hlj.gov.cn/dva/c111601/202406/c00_31743667.shtml','从设备和互动展项理解酿造流程与哈尔滨工业生活。位于平房区哈啤路9号，先确认开放和预约；品饮是否包含另核，未成年人选择不含酒精的参观内容。','啤酒工业也是这座城市近现代生活史的一部分。'),
 ('lijiang','lashi-birds','拉市海冬季湿地观鸟','Winter birdwatching at Lashihai','wildlife',26.889,100.139,180,0,180,[11,12,1,2,3],False,True,'Lashi Lake','https://www.forestry.gov.cn/c/www/dzw/678579.jhtml','带望远镜在允许进入的观鸟点观察迁徙水鸟，远离保护核心区。请在出发前确认开放步道和接驳；如需向导单独计费，不承诺遇见某一种鸟。','高原湿地为迁徙鸟类提供停歇和越冬空间。'),
 ('lijiang','baisha-tie-dye','白沙古镇的扎染手作','Tie-dye workshop in Baisha','craft',26.954,100.215,120,80,240,None,True,True,'Tie-dye','https://www.lijiang.cn/article/148097.html','在白沙选择可预约的扎染手作店，亲手折布、捆扎与染色，再等待图案显现。先确认布料、颜料、晾干和取件时间，避免临离城才安排制作。','把古镇停留变成一次可带走作品的手作体验。'),
 ('nanjing','qinhuai-boat','乘秦淮画舫看桨声灯影','An evening Qinhuai boat ride','local-life',32.020,118.789,75,100,140,None,False,False,'Qinhuai River','https://www.njqh.gov.cn/dmqh/yzqh/qhhssylx/','从夫子庙泮池码头登船，从水上观看桥洞、临水楼阁和灯影。东线、西线和日夜票是不同产品，选择一条线路即可；推荐用时包含候船预留。','水路为秦淮街巷提供了不同于步行的观看角度。'),
 ('nanjing','woodblock-printing','金陵刻经处认识雕版印刷','Woodblock printing at Jinling Sutra Press','craft',32.034,118.790,90,30,150,None,True,False,'Jinling Sutra Press','https://yht.nanjing.gov.cn/rednanjing/hsjy/hsrl/202504/t20250410_5121629.html','从刻字、上墨和纸张理解传统雕版印刷，参观前向金陵刻经处确认对外开放和讲解。只有当期公开活动接受报名时才选择动手拓印，保护经版，不能自行触摸或操作。','一块版、一张纸和反写字构成延续至今的印刷手艺。'),
 ('sanya','houhai-surf','后海湾初学者冲浪课','Beginner surf lesson at Houhai Bay','marine',18.271,109.734,150,200,450,None,False,True,'Houhai, Sanya','https://tzb.sanya.gov.cn/tzbsite/jctz/202602/98c232f91ce54b7c948ed5f8d8de7abc.shtml','在后海湾选择合规冲浪学校，先学岸上动作和水中规则，再由教练带领尝试起乘。确认教学人数、装备与保险，风浪不适合时改期；城区往返另留时间。','把海边午后留给一次循序渐进的海浪练习。'),
 ('sanya','serenity-sailing','半山半岛帆船港出海体验','Sailing from Sanya Serenity Marina','marine',18.211,109.486,150,180,500,None,False,False,'Sanya Serenity Marina','https://english.sanya.gov.cn/syen/CharmingSanya/202002/48bc16a1ce224b068ae7fa2c816b5c27.shtml','从半山半岛帆船港选择持证运营方，核对拼船或包船、航行范围与实际海上时间。推荐用时包含报到和装备说明；帆船、游艇与尾波冲浪不是同一套餐。','从海上看鹿回头一带海岸，并认识风帆如何借风前进。'),
 ('suzhou','biluochun-tea','东山春茶采制与品饮','Spring Biluochun tea in Dongshan','food-life',31.073,120.407,180,80,260,[3,4],True,True,'Biluochun','https://www.suzhou.gov.cn/szsrmzf/dwjlylxjy/202604/773b767848c24ef6b1cd499e32e77a70.shtml','在东山茶园确认当年采摘开放后，预约采茶或炒茶观摩，再比较新茶的香气。春茶季短，非采摘季改为品茶与茶文化参观；不能把往年团体活动当作每日散客课程。','洞庭山的春天藏在嫩芽、揉捻与温热茶汤里。'),
 ('suzhou','kunqu-evening','在昆曲传习所听水磨腔','An evening of Kunqu in Suzhou','performance',31.292,120.627,120,100,380,None,True,False,'Kunqu','https://wglj.suzhou.gov.cn/szwhgdhlyj/hdxx/202606/731eb928842747d89792493f266c2756.shtml','按照苏州昆剧院当期节目选择对公众售票的折子戏或园林演出，先了解故事再听唱腔与笛声。传习所、剧院和园林场地不同，预约后以票面地点和时刻排程。','唱、念、身段与园林空间共同呈现江南戏曲。'),
 ('xian','huaqing-dance','华清宫《长恨歌》山水实景演出','The Song of Everlasting Sorrow at Huaqing Palace','performance',34.365,109.212,120,260,600,None,True,True,'The Song of Everlasting Sorrow','https://www.hqc.cn/ChangHenGe1/Introduction/','在临潼华清宫观看以唐代故事为线索的山水舞剧。演出票与白天景区票分别核价，核对座区、当季版本及散场时间，提前安排回城区交通。','骊山和水面成为舞台的一部分；故事为艺术演绎。'),
]


def main():
    result=[]
    for city,slug,name,en,theme,lat,lng,minutes,low,high,months,dated,remote,article,source,description,context in ROWS:
        option={'id':'planning','name':'体验预算预留','low':low,'high':high,'currency':'CNY','type':'estimate','unit':'person','sourceUrl':source,'checkedAt':None,'includes':['所选体验的预算预留'],'excludes':['往返集合地点交通','未明确包含的餐饮、材料或附加服务'],'note':'编辑规划估算；来源用于核对项目身份与参与方式，不作为当日实时报价。'}
        row={'id':f'ex-china26-{city}-{slug}','cityId':city,'kind':'experience','name':name,'nameEn':en,'experienceType':theme,'lat':lat,'lng':lng,'coordinateAccuracy':'approximate','coordinateNote':'活动场馆或片区的规划定位，以实际预约入口为准。','provider':'以来源中的场馆或合规运营方为准','address':name,'description':description,'tagline':context,'localContext':context,'durationMinutes':minutes,'durationRange':{'min':max(30,round(minutes*.65)),'recommended':minutes,'max':min(720,round(minutes*1.4))},'includesTransfers':False,'automaticPlanning':not (remote or dated),'visitRole':'optional','features':[context,'需预约或核对开放情况'],'requirements':['出发前确认营业、天气、场次与套餐内容。'],'sourceUrl':source,'bookingUrl':source,'checkedAt':DATE,'sourceReferences':[{'name':source.split('/')[2],'url':source,'checkedAt':DATE,'kind':'official-reference' if '.gov.cn' in source else 'primary-reference','scope':'场馆身份、文化背景与参与方式；价格和停留时间另作编辑估算'}],'article':article,'image':{'url':'','sourceUrl':source},'seasonality':{'months':months or list(range(1,13)),'dateSpecific':dated,'note':'请核对当年日期或可预约场次，月份不代表每日可参加。' if dated else '户外项目受气候与当日运营影响。'},'priceOptions':[option]}
        if remote:
            row['accessNote']='远郊或城外项目；推荐用时不含往返交通，请另外预留接驳和必要住宿。'
        if slug=='qinhuai-boat':
            row['priceOptions']=[{**option,'id':'east-night','name':'夫子庙游船东线夜票','low':100,'high':100,'type':'official','checkedAt':DATE,'includes':['东线夜间游船成人票'],'note':'秦淮区官方游览页面列示夜票东线100元/人；以运营方所选日期售票情况为准。'}, {**option,'id':'west-night','name':'夫子庙游船西线夜票','low':140,'high':140,'type':'official','checkedAt':DATE,'includes':['西线夜间游船成人票'],'note':'秦淮区官方游览页面列示夜票西线140元/人；不与东线重复购买。'}]
        if slug=='lashi-birds':
            row['wildlife']={'species':['黑头白鹮','棉凫'],'encounterNote':'这些是保护区监测记录，迁徙与野生动物活动不可保证，保持距离观察。','responsibleNote':'不投喂、不追赶、不进入保护核心区。'}
        result.append(row)
    path=ROOT/'data/experience-expansion/china-existing-enrichment-20261007.json'
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Wrote {len(result)} locally distinctive experiences')


if __name__=='__main__':
    main()
