"""Explicit subject/context assignments for the reviewed 2026-09-28 pilot batch.

Wikimedia file metadata is checked before committing each reusable photograph.
Generic article lead images are not evidence of a location or an activity.
"""
import json
import os
import time
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]
PHOTO_ROWS = {
 'munich-residenz': ('Antiquarium, Münchner Residenz.jpg', 'exact-place', '慕尼黑王宫 Antiquarium 大厅实景。'),
 'munich-viktualienmarkt': ('Münchner Viktualienmarkt - Verkaufsstand mit Früchten.jpg', 'exact-place', '慕尼黑谷物市场水果摊实景。'),
 'munich-deutsches': ('Deutsches Museum - exterior.jpg', 'exact-place', '慕尼黑德意志博物馆外观实景。'),
 'shangri-la-guishan': ('Guishan Temple.jpg', 'exact-place', '香格里拉龟山寺实景。'),
 'shangri-la-diqing-museum': ('57120-Shangri-La (28479016061).jpg', 'exact-place', '迪庆州博物馆建筑照片，展览与开放安排以馆方公告为准。'),
 'shangri-la-long-march': ('58632-Shangri-La-Long-March-Museum (28450561702).jpg', 'exact-place', '迪庆红军长征博物馆展览实景，当前展线可能调整。'),
 'shangri-la-baiji': ('Shangri-La, Yunnan (21006492308).jpg', 'exact-place', '香格里拉百鸡寺山顶建筑实景。'),
 'shangri-la-napahai': ('纳帕海.jpg', 'exact-place', '纳帕海湿地实景；水位与草甸随季节变化。'),
 'shangri-la-shika': ('Shika Snow Mountain.jpg', 'exact-place', '石卡雪山开放观景区实景，天气与运营状态需另查。'),
 'shangri-la-balagezong': ('虎跳峡.JPG', 'related-theme', '迪庆虎跳峡实景用于说明峡谷地貌；不是巴拉格宗现场照片。'),
 'shangri-la-ringha-temple': ('Tibetan Village @ Nixi - panoramio.jpg', 'related-theme', '香格里拉尼西藏式村落实景，说明当地民居形态；不是大宝寺或仁安谷地现场照片。'),
 'shangri-la-niru-village': ('Tibetan Village @ Nixi - panoramio.jpg', 'related-theme', '香格里拉尼西藏式村落实景，用于说明乡村建筑；不是尼汝村现场照片。'),
 'shangri-la-haba-village': ('The Snow Slope of Haba Mountain.JPG', 'nearby', '哈巴雪山实景，展示哈巴村周边的雪峰环境；不是村内街景。'),
 'ex-munich-biergarten': ('MUC Augustinerbiergarten.jpg', 'exact-place', '慕尼黑 Augustiner 啤酒花园实景，具体座位和营业以店家为准。'),
 'ex-munich-isar-picnic': ('2015-10-24 D300-3666 Achim-Lammerts Munich-Isar-Flaucher.jpg', 'exact-place', '伊萨尔河 Flaucher 河岸实景。'),
 'ex-munich-christmas': ('Marienplatz Christkindlmarkt, 2013.jpg', 'exact-place', '玛利亚广场圣诞集市往年实景；不代表当前年份的布置与活动日期。'),
 'ex-shangri-la-nixi-pottery': ('Tibetan Nixi Potter (33183559198).jpg', 'exact-place', '尼西陶匠制陶实景；不代表某个具体工坊的预约名额。'),
 'ex-shangri-la-guozhuang': ('Public Dance (43823654535).jpg', 'exact-place', '香格里拉公共舞蹈活动实景，现场是否有活动需另核对。'),
 'ex-shangri-la-horse-festival': ('Horse Race, Diqing Zangzu, Yunnan, China.jpg', 'related-theme', '迪庆传统赛马实景，展示当地赛马文化；不是所选年份格咱赛马节的现场承诺。'),
 'ex-shangri-la-niru-waterfall': ('Meadow in Pudacuo.JPG', 'nearby', '普达措区域高原草甸实景，说明区域生态；不是尼汝七彩瀑布的现场照片。'),
 'ex-shangri-la-xiaozhongdian-flowers': ('Meadow in Pudacuo.JPG', 'related-theme', '香格里拉高原草甸实景，用于说明季节环境；不是小中甸杜鹃花期的现场照片。'),
 'ex-shangri-la-napahai-birds': ('Black necked crane at Hanle.jpg', 'related-theme', '黑颈鹤物种实拍，拍于 Hanle；不是纳帕海现场，野外遇见情况不作保证。'),
 'ex-shangri-la-thangka': ('Buddha Vairocana - Google Art Project.jpg', 'related-theme', '唐卡艺术作品，用于说明绘画主题；不代表课程成品或现场工坊。'),
 'food-shangri-la-momo': ('Veg Momo.jpg', 'exact-place', '藏式包子 momo 食物照片；各店馅料、大小和摆盘可能不同。'),
}


def main():
    session = requests.Session()
    session.headers['User-Agent'] = 'TourFeePhotoReview/1.0 (https://github.com/ducky-yyds/tour-fee)'
    files = sorted({row[0] for row in PHOTO_ROWS.values()})
    metadata = {}
    for start in range(0, len(files), 20):
        response = session.get('https://commons.wikimedia.org/w/api.php', params={
            'action': 'query', 'format': 'json', 'titles': '|'.join('File:' + name for name in files[start:start+20]),
            'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'redirects': 1,
        }, timeout=60)
        response.raise_for_status()
        data = response.json()
        pages = {page['title'].removeprefix('File:').replace('_', ' '): page for page in data.get('query', {}).get('pages', {}).values()}
        aliases = {row['from'].removeprefix('File:'): row['to'].removeprefix('File:') for row in data.get('query', {}).get('normalized', []) + data.get('query', {}).get('redirects', [])}
        for original in files[start:start+20]:
            name = original.replace('_', ' ')
            for _ in range(4):
                name = aliases.get(name, name)
            page = pages.get(name)
            if not page or not page.get('imageinfo'):
                raise RuntimeError('No image metadata: ' + original)
            info = page['imageinfo'][0]
            license_name = info.get('extmetadata', {}).get('LicenseShortName', {}).get('value', '')
            if not license_name or not any(allowed in license_name for allowed in ['CC', 'Public domain', 'GFDL', 'FAL']):
                raise RuntimeError('Unreviewed license: ' + original + ': ' + license_name)
            metadata[original] = {'sourceUrl': info['descriptionurl'], 'license': license_name}
        time.sleep(.5)
    groups = {'place-photo-expansion': {}, 'experience-photo-expansion': {}, 'food-photo-expansion': {}}
    for identity, (name, scope, note) in PHOTO_ROWS.items():
        group = 'experience-photo-expansion' if identity.startswith('ex-') else 'food-photo-expansion' if identity.startswith('food-') else 'place-photo-expansion'
        groups[group][identity] = {'photoFile': name, **metadata[name], 'imageScope': scope, 'imageContextNote': note, 'checkedAt': '2026-09-28'}
    for group, rows in groups.items():
        path = ROOT / 'data' / group / 'global-pilots-20260928.json'
        path.parent.mkdir(exist_ok=True)
        path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({group: len(rows) for group, rows in groups.items()}))


if __name__ == '__main__':
    main()
