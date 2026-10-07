"""Cache Commons candidates for missing Chinese catalog photographs.

Discovery only: no candidate becomes a published photograph without review.
"""
import json
import argparse
import pathlib
import time
import requests

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/china-repair-photo-research.json'
read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
REFINEMENTS = {
 'osm-chongqing-way-1293122510':['"杨森公馆"','"Yang Sen" Chongqing house'],
 'chongqing-xinhua-daily-headquarters':['"新华日报" Chongqing','"Xinhua Daily" Chongqing'],
 'haikou-qiongya-congress':['"琼崖"','"Qiongya"'],
 'osm-haikou-way-1435845523':['"琼崖"','"Qiongya"'],
 'osm-lijiang-node-9201553045':['"王丕震"','"Wang Pizhen"'],
 'nanjing-yangtze-crossing-memorial':['"渡江胜利"','"Yangtze" "Nanjing" memorial'],
 'yanan-fenghuang-revolutionary-site':['"凤凰山" "延安"','"Fenghuang" "Yanan"'],
 'zunyi-fenghuang-forest':['"Fenghuang" "Zunyi"','"凤凰山" "遵义"'],
 'stay-cityrepair-tianjin-four-seasons':['"Four Seasons" "Tianjin"','"天津现代城"'],
 'stay-cityrepair-tianjin-holiday-inn-express-heping':['"Holiday Inn Express" "Tianjin"'],
 'stay-history-nanchang-sheraton':['"Sheraton" "Nanchang"'],
 'stay-history-nanchang-courtyard':['"Courtyard" "Nanchang"'],
 'stay-history-nanchang-crowne-riverside':['"Crowne Plaza" "Nanchang"'],
 'stay-history-nanchang-fourpoints-xihu':['"Four Points" "Nanchang"'],
 'stay-cityrepair-yanan-wanda-realm':['"Wanda Realm" "Yanan"'],
 'stay-cityrepair-yanan-wanda-jin':['"Wanda Jin" "Yanan"'],
 'stay-cityrepair-yanan-zaoyuan':['"Zaoyuan" hotel'],
 'stay-cityrepair-yanan-luyi-garden':['"Luyi" hotel'],
 'stay-cityrepair-yanan-jinze':['"Jinze" hotel'],
 'stay-history-zunyi-millennium':['"Millennium" "Zunyi"'],
 'stay-history-zunyi-jianguo':['"Jianguo" "Zunyi"'],
 'stay-history-zunyi-new-century':['"New Century" "Zunyi"'],
 'stay-history-zunyi-grand-skylight':['"Grand Skylight" "Zunyi"'],
 'stay-history-zunyi-hanting-conference':['"Hanting" "Zunyi"'],
 'food-luoyang-water-banquet':['"Luoyang" "banquet"','"水席"'],
 'food-xinglong-coffee':['"Xinglong" coffee'],
 'food-chongqing-douhua':['"豆花饭"','"douhua" "rice"'],
 'food-youxuan':['"油旋"','"Youxuan"'],
 'food-cattail-soup':['"蒲菜"','"cattail" "soup"'],
 'food-carp-baked-noodles':['"鲤鱼焙面"','"carp" "noodles"'],
 'food-henan-steamed-noodles':['"蒸卤面"','"Henan" "steamed noodles"'],
 'food-henan-braised-pancake':['"羊肉烩饼"'],
 'food-spicy-clams':['"辣炒蛤蜊"','"Qingdao" "clams"'],
 'food-liuting-pork-trotter':['"流亭猪蹄"'],
 'food-qingdao-zhizha':['"脂渣"'],
 'food-dali-sour-fish':['"酸辣鱼" "大理"','"Dali" "sour"'],
 'food-cold-chicken-noodles':['"凉鸡米线"'],
 'food-lijiang-cured-ribs':['"腊排骨"','"Lijiang" "ribs"'],
 'food-naxi-chuigan':['"吹肝"'],
 'food-naxi-grilled-pork':['"纳西烤肉"','"Naxi" "pork"'],
 'food-luoyang-beef-soup':['"Luoyang" "beef"','"洛阳" "牛肉汤"'],
 'food-bufan-soup':['"不翻汤"'],
 'food-luoyang-tofu-soup':['"Luoyang" "tofu"','"洛阳" "豆腐汤"'],
 'food-plum-blossom-cake':['"梅花糕"','"Meihua" "cake"'],
 'food-haitang-cake':['"海棠糕"','"Haitang" "cake"'],
 'food-china2-harbin-fried-cake':['"东北" "炸糕"','"Youzhagao"'],
 'food-china2-dunhuang-apricot-water':['"杏皮水"','"Dunhuang" "apricot"'],
 'food-china2-dunhuang-fried-pancake':['"敦煌" "油糕"'],
 'food-china2-zhangjiajie-sanxiaguo':['"三下锅"','"Sanxiaguo"'],
 'food-china2-zhangjiajie-cured-pork':['"张家界" "腊肉"','"Tujia" "pork"'],
 'food-china2-zhangjiajie-sour-fish':['"土家" "酸鱼"'],
 'food-china2-zhangjiajie-chestnut-chicken':['"板栗炖鸡"','"chestnut" "chicken"'],
 'food-china2-chongqing-qianzhang':['"千张" "磁器口"'],
 'food-china2-jinan-roast-duck':['"Jinan" "duck"'],
 'food-cityrepair-yanan-hele':['"饸饹"','"Hele" "noodles"'],
 'food-cityrepair-yanan-potato-caca':['"洋芋擦擦"'],
 'food-cityrepair-yanan-millet-bun':['"黄米馍馍"'],
 'food-cityrepair-yanan-youmomo':['"油馍馍"'],
 'food-cityrepair-tianjin-ear-hole-cake':['"耳朵眼"','"Erduoyan"'],
 'food-history-nanchang-white-sugar-cake':['"南昌" "白糖糕"','"Nanchang" "cake"'],
 'food-history-nanchang-artemisia-pork':['"藜蒿"','"Artemisia" "pork"'],
 'food-history-zunyi-egg-cake':['"遵义" "鸡蛋糕"'],
 'food-history-zunyi-egg-potato-wrap':['"蛋包洋芋"'],
 'food-history-zunyi-yaxi-liangfen':['"鸭溪凉粉"'],
}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refine',action='store_true')
    args=parser.parse_args()
    cities = read(ROOT / 'data/cities.json')
    chinese = {c['id'] for c in cities if c['countryCode'] == 'CN'}
    media = read(ROOT / 'data/media.json')
    report = read(ROOT / 'data/catalog-coverage.json')
    missing = set(report['mediaCoverage']['runtime']['attractions']['missingImageIds'] + report['mediaCoverage']['runtime']['experiences']['missingImageIds'])
    items = [p for c in cities if c['id'] in chinese for p in c['attractions'] if p['id'] in missing]
    for file in [ROOT/'data/city-experiences.json', ROOT/'data/city-activities.json', *sorted((ROOT/'data/experience-expansion').glob('*.json'))]:
        items.extend(p for p in read(file) if p['cityId'] in chinese and p['id'] in missing)
    items.extend(p for p in read(ROOT/'data/local-foods.json') if set(p['cityIds']) & chinese and media['attractions'].get(p['id'], {}).get('scope') == 'illustration')
    result = read(OUT) if OUT.exists() else {}
    session = requests.Session()
    session.headers['User-Agent'] = 'TourFeeSubjectResearch/1.0 (+https://github.com/ducky-yyds/tour-fee)'
    for item in items:
        if item['id'] in result and (not args.refine or result[item['id']].get('refined')):
            continue
        queries = REFINEMENTS.get(item['id'], [f'"{item["name"]}"']) if args.refine else list(dict.fromkeys([item['name'], item.get('nameEn') or item.get('localName') or item.get('article') or item['name']]))
        rows = result.get(item['id'],{}).get('candidates',[])
        for query in queries:
            try:
                response = session.get('https://commons.wikimedia.org/w/api.php', params={
                    'action':'query','format':'json','generator':'search','gsrsearch':query+' filetype:bitmap','gsrnamespace':6,'gsrlimit':8,
                    'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':320,
                }, timeout=35)
                response.raise_for_status()
                for page in response.json().get('query', {}).get('pages', {}).values():
                    if page.get('imageinfo'):
                        rows.append({'title':page['title'],'query':query,**page['imageinfo'][0]})
            except Exception as error:
                print(json.dumps({'id':item['id'],'error':str(error)}, ensure_ascii=False), flush=True)
            time.sleep(1.3)
        result[item['id']] = {'name':item['name'],'queries':queries,'candidates':list({r['title']:r for r in rows}.values()),'reviewed':False,'refined':args.refine}
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'id':item['id'],'candidates':len(rows)},ensure_ascii=False),flush=True)


if __name__ == '__main__':
    main()
