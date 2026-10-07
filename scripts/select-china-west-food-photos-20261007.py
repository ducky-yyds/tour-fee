"""Stage explicit dish/property photo matches for visual inspection before export."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'artifacts/china-west-photo-research'
OUT=ROOT/'artifacts/china-west-food-visual-review';OUT.mkdir(parents=True,exist_ok=True)
PICKS={
 'food-kunming-bridge-noodles':0,'food-kunming-erkuai':0,'food-kunming-small-pot-noodles':0,'food-kunming-steam-chicken':0,
 'food-jinghong-pineapple-rice':0,
 'food-tengchong-dajiujia':0,'food-tengchong-earthen-pot':0,
 'food-lhasa-butter-tea':0,'food-nyingchi-butter-tea':0,'food-lhasa-tsampa':2,'food-lhasa-thukpa':0,
 'food-lanzhou-beef-noodle':0,
 'food-urumqi-dapanji':0,'food-urumqi-laghman':3,'food-yining-laghman':3,'food-xining-shouzhua':3,
 'food-kashgar-nan':1,'food-yining-kvass':0,
 'hotel-kunming-intercontinental':0,'hotel-lhasa-st-regis':0,'hotel-urumqi-holiday-express':0,'hotel-urumqi-universal':0,'hotel-zhangye-huachen':0,
}
rows=[]
for eid,idx in PICKS.items():
 d=json.loads((CACHE/(eid+'.json')).read_text(encoding='utf8'));p=d['candidates'][idx];rows.append({'id':eid,'kind':d['kind'],**p})
for eid,term,idx in [('food-kunming-flower-cake','鲜花饼',3),('food-jinghong-bamboo-rice','竹筒饭',2),('food-kashgar-lung-sausage','面肺子',1),('food-kashgar-polo','抓饭 新疆',1),('food-urumqi-polo','抓饭 新疆',1),('food-kashgar-samsa','烤包子',3),('food-urumqi-samsa','烤包子',3),('food-kashgar-kebab','新疆 羊肉串',2),('food-urumqi-kebab','新疆 羊肉串',2),('food-tengchong-ersi','饵丝',2)]:
 p=json.loads((ROOT/'artifacts/china-west-food-photo-research'/(term+'.json')).read_text(encoding='utf8'))[idx];rows.append({'id':eid,'kind':'food',**p})
prior=json.loads((ROOT/'data/food-photo-expansion/asia-20260923.json').read_text(encoding='utf8'))
for eid,old in [('food-tengchong-chickpea-jelly','food-jidou-liangfen'),('food-xining-niangpi','food-china2-dunhuang-niangpi'),('food-lanzhou-niangpi','food-china2-dunhuang-niangpi')]:
 p=prior[old];rows.append({'id':eid,'kind':'food',**p,'thumbnailUrl':p['originalUrl'],'author':p.get('author',p.get('artist',''))})
(OUT/'candidates.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'staged':len(rows)}))
