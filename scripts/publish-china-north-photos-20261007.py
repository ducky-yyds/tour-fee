"""Publish only individually selected and visually reviewed northern-China photos.

No network access. Unresolved properties/places stay unresolved; a skyline never
substitutes for a named hotel. Copyright metadata travels with each assignment.
"""
import json, runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DAY = '2026-10-07'
NAME = 'china-north-20261007.json'
selected = runpy.run_path(str(ROOT/'scripts/select-china-north-photos-20261007.py'))['selected']()
media = json.loads((ROOT/'data/media.json').read_text('utf-8-sig'))['attractions']

# Previously archived source files were opened and visually checked, too.
for target, original in {
    'food-yanji-bibimbap': 'food-bibimbap',
    'food-changchun-guobaorou': 'food-china2-harbin-guobaorou',
    'food-shenyang-pork': 'food-china2-harbin-guobaorou',
}.items():
    src = media[original]
    selected[target] = {
        'photoFile': src.get('photoFile') or src['fileTitle'],
        'sourceUrl': src['sourceUrl'], 'license': src['license'],
        'licenseUrl': src.get('licenseUrl',''),
        'artist': src.get('credit',''),
        'description': src.get('description') or src.get('sourceDescription',''),
        'sourceCheckedAt': DAY, 'name': target,
        'existingLocalAsset': src['url'], 'copiedFrom': original,
    }

cities = json.loads((ROOT/'data/expansion'/NAME).read_text('utf-8'))
experiences = json.loads((ROOT/'data/experience-expansion'/NAME).read_text('utf-8'))
foods = json.loads((ROOT/'data/food-expansion'/NAME).read_text('utf-8'))
entities = {}
for city in cities:
    entities[city['id']] = {**city, 'kind': 'city', 'cityId': city['id']}
    for item in city['attractions']:
        entities[item['id']] = {**item, 'kind': 'place', 'cityId': city['id']}
    for item in city.get('hotels', []):
        entities[item['id']] = {**item, 'kind': 'hotel', 'cityId': city['id']}
for item in experiences:
    entities[item['id']] = {**item, 'kind': 'hotel' if item['id'].startswith('hotel-') else 'experience'}
for item in foods:
    entities[item['id']] = {**item, 'kind': 'food'}

SPECIAL = {
    'ex-chengde-paper-cut': ('related-theme', '满族剪纸作品实拍，帮助认识造型与剪纸语言；不代表已预订的工坊、老师或当日课程。'),
    'ex-hohhot-shaomai-morning': ('related-theme', '呼和浩特羊肉烧麦实拍；不同门店的份量、茶水和搭配另核。'),
    'ex-hohhot-dairy-tour': ('exact-place', '伊利呼和浩特乳业基地设备实景；实际开放区域和生产线状态以预约通知为准。'),
    'ex-hohhot-milk-tea': ('related-theme', '蒙古奶茶实拍，示意同类饮食传统；不对应某家茶馆或其当前套餐。'),
    'ex-hailar-milk-food': ('related-theme', '蒙古奶茶实拍，展示早餐中的奶茶部分；当地套餐的奶食、点心和份量需另核。'),
    'ex-hailar-buryat-buns': ('related-theme', '布里亚特包子 buuza 实拍，摄于布里亚特地区；展示相同饮食传统，不代表海拉尔某店的课程或套餐。'),
    'ex-hailar-horse-music': ('related-theme', '马头琴与乐队演出实拍，摄于莫斯科；用于认识乐器，不代表海拉尔特定演出阵容。'),
    'ex-dalian-cherry': ('exact-place', '旅顺龙王塘樱花园实景；花期随当年气候变化，照片不保证指定日期仍有盛花。'),
    'ex-changchun-film-dubbing': ('exact-place', '长影旧址博物馆实景；展示活动关联场馆，不代表已确认有配音体验场次。'),
    'ex-yanji-ricecake': ('related-theme', '朝鲜族及韩国传统打糕制作主题实拍；不对应延吉某个具体体验店或已预约场次。'),
    'ex-yanji-kimchi': ('related-theme', '传统泡菜制作主题实拍；不对应延吉某个具体工坊或当前课程。'),
    'ex-yanji-costume': ('exact-place', '延吉中国朝鲜族民俗园服饰体验实景；租服装、妆发和摄影费用按店家项目另核。'),
    'ex-yinchuan-eight-tea': ('related-theme', '三炮台盖碗茶实拍，摄于兰州；展示西北回族盖碗茶传统，银川八宝茶配料和店家版本不同。'),
    'food-qinhuangdao-miancha': ('related-theme', '面茶实拍，摄于北京；示意同类北方小吃，秦皇岛各店调味与份量有所不同。'),
    'food-chengde-donkey-roll': ('related-theme', '驴打滚实拍，摄于北京；承德店家的大小、馅料和售卖形式另核。'),
    'food-datong-knife-noodles': ('related-theme', '刀削面成品实拍，摄于北京；展示面形，大同店家的臊子、份量和配料有所不同。'),
    'food-pingyao-kaolao': ('related-theme', '莜面栲栳栳实拍，摄于北京；展示同一种莜面形态，平遥各店蘸汁和配菜另核。'),
    'food-chengde-oat': ('related-theme', '莜面卷实拍，摄于北京；展示与莜面窝子相通的卷筒形态，承德版本的配菜和叫法略有差异。'),
    'food-hailar-buuz': ('related-theme', '布里亚特包子 buuza 实拍，摄于布里亚特地区；展示相同饮食传统，不代表海拉尔指定门店。'),
    'food-changchun-guobaorou': ('related-theme', '长春真不同餐厅锅包肉实拍；照片反映拍摄时成品，现时摆盘、价格和份量需另核。'),
    'food-shenyang-pork': ('related-theme', '东北锅包肉成品实拍，摄于长春；辽宁带番茄风味的做法和各店配方会有差异。'),
    'food-yanji-bibimbap': ('related-theme', '石锅拌饭实拍，用于认识同类菜品；不代表延吉指定餐馆的菜品份量或配菜。'),
}

packs = {key:{} for key in ('place','experience','hotel','food')}
reviewed_city_covers = {}
for id, src in selected.items():
    item = entities.get(id)
    if not item:
        raise ValueError('Selected photograph has no current entity: '+id)
    kind = item['kind']
    if kind == 'city':
        reviewed_city_covers[id] = src
        continue
    if kind == 'hotel':
        scope, note = 'exact-place', '该酒店建筑外观实拍；不代表所选房型、现时装修或已包含的服务套餐。'
    elif kind == 'food':
        scope, note = 'related-theme', '同类菜品或食材成品实拍，用于认识食物；不代表所列寻味地点的当日菜品、份量或摆盘。'
    else:
        scope, note = 'exact-place', item['name']+'的地点实景；实际开放区域、天气与现场设施可能变化。'
    scope, note = SPECIAL.get(id, (scope, note))
    row = {k:src[k] for k in ('photoFile','sourceUrl','license','licenseUrl','artist','originalUrl','thumbnailUrl','existingLocalAsset') if src.get(k)}
    row.update({
        'imageScope':scope, 'imageContextNote':note, 'note':note,
        'sourceCheckedAt':DAY, 'checkedAt':DAY,
        'sourceDescription':src.get('description',''),
        'identityEvidence':src['photoFile'],
        'visualReview':'2026-10-07：已查看下载缩略图或已有本地照片，并结合 Commons 文件名、说明与许可逐项筛选；未以检索排名视为匹配。',
    })
    if kind == 'hotel':
        row.update({'hotelName':item['name'], 'cityId':item['cityId']})
    packs[kind][id] = row

for kind, data in packs.items():
    dest=ROOT/'data'/f'{kind}-photo-expansion'/NAME
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n','utf-8')

missing = [
    {'id':id, 'name':item['name'], 'kind':item['kind'],
     'cityId':item.get('cityId') or item.get('cityIds',[None])[0],
     'status':'unresolved',
     'reason':'尚未找到并确认主题及再用许可相符的实拍图；酒店不使用城市或其他物业图替代。'}
    for id,item in entities.items() if item['kind']!='city' and id not in selected
]
report={
    'createdAt':DAY,
    'counts':{kind:len(data) for kind,data in packs.items()},
    'reviewedCityCoverCandidates':len(reviewed_city_covers),
    'cityCoverNote':'根任务统一处理城市封面，本脚本不写共享封面映射。',
    'unresolvedCount':len(missing), 'unresolved':missing,
    'networkStatus':'Commons 新检索暂停，遵守全组限流协调；429 后至少等待 60 秒并遵守 Retry-After。',
    'reviewScope':'筛选图已逐张查看缩略图/本地已有实拍；尚未逐项下载原尺寸或核对所有底层 EXIF。',
}
(ROOT/'artifacts/china-north-20261007-photo-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ('unresolved',)},ensure_ascii=False))
