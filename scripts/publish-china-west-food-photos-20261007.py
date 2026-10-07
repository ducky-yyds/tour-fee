"""Export the dish/property selection after indexed and single-image review."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
rows=json.loads((ROOT/'artifacts/china-west-food-visual-review/index.json').read_text(encoding='utf8'))
NOTES={
 'food-kunming-bridge-noodles':'过桥米线成品与配料实拍，摄于蒙自，说明同款云南菜品，不代表昆明某家餐馆的套餐。',
 'food-kunming-erkuai':'昆明烧饵块现场制作实拍，具体馅料与份量以店家为准。',
 'food-jinghong-pineapple-rice':'傣味菠萝紫米饭成品，摄于昆明傣味摊位，说明菜品形态，不代表景洪某家餐馆。',
 'food-jinghong-bamboo-rice':'掸族地区竹筒糯米饭实拍，说明相近竹筒熟制方式；西双版纳傣味版本的配料和装盛可能不同。',
 'food-tengchong-earthen-pot':'腾冲土锅子成品实拍，摄于北京云南菜餐厅，份量和配菜随商家变化。',
 'food-tengchong-ersi':'梁河九保饵丝实拍，示意滇西饵丝汤食形态，不代表腾冲所选餐馆的配料。',
 'food-tengchong-chickpea-jelly':'丽江鸡豆凉粉实拍，说明鸡豆凉粉的凉拌吃法，腾冲版本的切法和调味可能不同。',
 'food-lhasa-tsampa':'藏式糌粑成品实拍，摄于西宁玛吉阿米餐馆，说明食物形态，不代表拉萨商家的套餐。',
 'food-lhasa-thukpa':'藏式汤面成品实拍，摄于大阪藏餐馆，不代表拉萨某家餐馆的配料或份量。',
 'food-lhasa-butter-tea':'藏式酥油茶实拍，用于说明饮品，不代表拉萨某家茶馆。',
 'food-nyingchi-butter-tea':'藏式酥油茶实拍，用于说明饮品，不代表林芝某家茶馆。',
 'food-xining-shouzhua':'西北手抓羊肉成品实拍，摄于嘉峪关餐馆，西宁各店的部位和装盘可能不同。',
 'food-xining-niangpi':'临夏酿皮实拍，说明西北酿皮的食物形态，西宁配料和份量可能不同。',
 'food-lanzhou-niangpi':'临夏酿皮实拍，说明西北酿皮的食物形态，兰州配料和份量可能不同。',
 'food-urumqi-laghman':'新疆拉条子成品实拍，摄于北京新疆餐馆，配菜按所选店铺确认。',
 'food-yining-laghman':'新疆拉条子成品实拍，摄于北京新疆餐馆，配菜按所选店铺确认。',
 'food-urumqi-kebab':'新疆风味羊肉串成品实拍，摄于成都，不代表乌鲁木齐某家摊店的大小或份量。',
 'food-kashgar-kebab':'新疆风味羊肉串成品实拍，摄于成都，不代表喀什某家摊店的大小或份量。',
 'food-yining-kvass':'面包发酵格瓦斯实拍，示意饮品；图中薄荷与装杯方式不代表伊宁商家的配方。',
 'hotel-zhangye-huachen':'张掖华辰国际大酒店外观实拍，属于较早拍摄的外观记录，当前装修和房型以酒店页面为准。',
}
packs={'food':{},'hotel':{}}
for r in rows:
 eid=r['id'];kind=r['kind'];assert kind in packs
 assert r.get('license') and r.get('sourceUrl','').startswith('https://')
 note=NOTES.get(eid,'对应菜品的真实照片，具体餐馆配料、份量和摆盘会不同。' if kind=='food' else '该酒店物业的外观实景，客房及当前服务以预订页面为准。')
 row={k:r[k] for k in ['photoFile','sourceUrl','license','licenseUrl'] if r.get(k)}
 row.update(artist=r.get('author',r.get('artist','')),author=r.get('author',r.get('artist','')),sourceCheckedAt='2026-10-07',checkedAt='2026-10-07',note=note,imageContextNote=note,imageScope='exact-place' if kind=='hotel' else 'related-theme',reviewBasis='Commons filename, description and indexed contact-sheet/single-image inspection',visualReview={'status':'passed','checkedAt':'2026-10-07','method':'indexed-contact-sheet','artifact':'artifacts/china-west-food-visual-review/index.json'})
 packs[kind][eid]=row
for kind,pack in packs.items():
 folder=ROOT/'data'/f'{kind}-photo-expansion';folder.mkdir(exist_ok=True)
 (folder/'china-west-20261007.json').write_text(json.dumps(pack,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:len(v) for k,v in packs.items()}))
