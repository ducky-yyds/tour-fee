"""Publish the five-city shard only after explicit visual and metadata review."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'artifacts/china-east-assist-20261007'
DAY='2026-10-07'
def read(p):return json.loads(p.read_text('utf-8-sig'))
candidates=read(BASE/'photo-candidates.json')
reviewed=read(BASE/'review/index.json')
cities=read(ROOT/'data/expansion/china-east-20261007.json')
names={a['id']:a['name'] for c in cities for a in c['attractions']}
names.update({e['id']:e['name'] for e in read(ROOT/'data/experience-expansion/china-east-20261007.json')})
selected={r['id']:candidates[r['id']]['candidates'][r['candidateIndex']] for r in reviewed}
notes={
 'jingdezhen-ceramic-museum':('exact-place','景德镇中国陶瓷博物馆馆藏陈列实拍；展品及展陈可能轮换。'),
 'jingdezhen-ancient-kiln':('exact-place','古窑民俗博览区户外陶艺景观实拍；展示园区一部分，非窑炉内部。'),
 'yangzhou-lu-shaoxu':('exact-place','卢氏盐商住宅展陈中的建筑模型实拍，帮助理解院落布局；不是缩小比例的现实街景。'),
 'yangzhou-daming':('exact-place','扬州大明寺内鉴真纪念堂实景。'),
 'ex-yangzhou-storytelling':('exact-place','扬州评话《皮五辣子》演出实拍；演员、场地和演出时间以所选场次公告为准。'),
 'ex-yangzhou-woodblock':('exact-place','扬州中国雕版印刷博物馆雕版刻制展示实拍；是否开放游客动手体验需预约确认。'),
 'ex-shaoxing-wupeng':('exact-place','绍兴乌篷船与水巷实景；上船码头、路线和价格以实际运营方为准。'),
 'ex-shaoxing-huangjiu-tasting':('related-theme','绍兴花雕酒瓶与酒杯实拍，用于认识酒款与色泽；不对应所选酒坊或品鉴套餐。'),
 'ex-shaoxing-opera':('related-theme','越剧《西厢记》演出实拍，摄于上海天蟾剧场；用于认识越剧，不是沈园之夜当前节目和演员的承诺。'),
 'ex-chaozhou-gongfu':('related-theme','工夫茶茶席与茶具实拍，用于认识冲泡器具；不代表潮州某家茶馆及其当前套餐。'),
 'ex-chaozhou-woodcarving':('exact-place','潮州己略黄公祠木构与雕刻细部实拍；展示潮州木雕的应用，非游客动手课程现场。'),
 'ex-chaozhou-opera':('related-theme','潮剧演出实拍，摄于马来西亚槟城；展示相同戏曲传统，不是潮州当前演出场次。'),
 'ex-macau-dragonboat':('exact-place','澳门往年龙舟赛事观赛区实景；当年比赛日期、座位和赛道以主办方公布为准。'),
 'ex-macau-fado':('related-theme','法朵演出实拍，摄于葡萄牙亚速尔群岛；用于认识音乐形式，不代表澳门指定场地或演出阵容。'),
}
copies={
 'ex-jingdezhen-night-market':('jingdezhen-taoxichuan','exact-place','陶溪川街区日间实景；创作市集是否举行、摊位和开放时段另查当期公告。'),
 'ex-shaoxing-winter-town':('shaoxing-anchang','exact-place','安昌古镇实景；腊月年俗活动和食品摊位以当年现场安排为准。'),
}
for target,(origin,scope,note) in copies.items():
 if origin in selected:selected[target]=selected[origin];notes[target]=(scope,note)
foods=read(ROOT/'data/food-photo-expansion/china-east-20261007.json')
food_copies={
 'ex-yangzhou-morning-tea':('food-yangzhou-sanding','扬州富春茶社茶点实拍，展示早茶餐桌中的包点；干丝、茶水和其他菜品按实际点单另核。'),
 'ex-macau-macanese':('food-macau-african-chicken','澳门非洲鸡菜品实拍，示意土生葡菜的一道代表菜；不代表已选餐厅或完整套餐。'),
 'ex-macau-portuguese-baking':('food-macau-egg-tart','澳门葡式蛋挞成品实拍；用于认识下午茶内容，不代表已预订的烘焙课、门店或份量。'),
}
for target,(origin,note) in food_copies.items():selected[target]=foods[origin];notes[target]=('related-theme',note)
places={};experiences={}
for id,src in selected.items():
 assert id!='macau-st-pauls'
 scope,note=notes.get(id,('exact-place',names[id]+'相关地点实景；照片反映拍摄时情况，开放区域及现场布置可能调整。'))
 row={k:src[k] for k in ('photoFile','sourceUrl','license','licenseUrl','artist','originalUrl') if src.get(k)}
 row.update({'imageScope':scope,'imageContextNote':note,'note':note,'sourceCheckedAt':DAY,'checkedAt':DAY,
             'sourceDescription':src.get('description') or src.get('sourceDescription',''),
             'visualReviewRequired':False,'visualReviewedAt':DAY,
             'verification':'已核对 Commons 文件名、说明和授权，并查看下载缩略图/联系表；没有把首个检索结果自动视为匹配。'})
 (experiences if id.startswith('ex-') else places)[id]=row
for kind,rows in [('place',places),('experience',experiences)]:
 p=ROOT/f'data/{kind}-photo-expansion/china-east-assist-20261007.json'
 p.parent.mkdir(exist_ok=True);p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n','utf-8')
scope={'jingdezhen','yangzhou','shaoxing','chaozhou','macau'}
allids={a['id']:a['name'] for c in cities if c['id'] in scope for a in c['attractions']}
allids.update({e['id']:e['name'] for e in read(ROOT/'data/experience-expansion/china-east-20261007.json') if e['cityId'] in scope and e['kind']=='experience'})
report={'reviewedAt':DAY,'places':len(places),'experiences':len(experiences),'existingExternalMapping':['macau-st-pauls'],
        'unresolved':[{'id':k,'name':n} for k,n in allids.items() if k not in selected and k!='macau-st-pauls'],
        'rejectedExamples':['扬州文昌阁搜索误落广西东兰魁星楼','扬州大明寺搜索误落河南济源大明寺','朱自清故居候选为北京清华大学','绍兴东湖候选为南昌东湖','绍兴府山候选为温州杨府山','澳门玫瑰堂候选为香港玫瑰堂','澳门海事博物馆候选为阿姆斯特丹博物馆','凤凰单丛候选为凤凰街奶茶店','手工制陶主题候选为绘画及古董器物，未当作工坊实拍']}
(BASE/'review-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'places':len(places),'experiences':len(experiences),'unresolved':len(report['unresolved'])}))
