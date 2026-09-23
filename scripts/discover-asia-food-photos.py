"""Read-only Commons subject/license discovery; never changes the media catalog."""
import json, time, urllib.request, urllib.parse, html, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'artifacts/asia-food-photo-search.json'
QUERIES={
'food-fish-dumplings':'鲅鱼水饺', 'food-jidou-liangfen':'鸡豆凉粉', 'food-luoyang-water-banquet':'Luoyang water banquet',
'food-xinglong-coffee':'Xinglong coffee', 'food-coconut-pudding':'coconut pudding Maldives', 'food-rice-and-curry':'Sri Lanka rice curry',
'food-sesame-paste-noodles':'sesame paste noodles China', 'food-longjing-shrimp':'Longjing shrimp', 'food-west-lake-fish':'West Lake vinegar fish', 'food-pianerchuan':'片儿川',
'food-chongqing-douhua':'豆花饭', 'food-youxuan':'油旋', 'food-cattail-soup':'奶汤蒲菜', 'food-carp-baked-noodles':'鲤鱼焙面',
'food-henan-steamed-noodles':'蒸卤面','food-henan-braised-pancake':'羊肉烩饼','food-tusun-jelly':'Tusun jelly',
'food-spicy-clams':'炒蛤蜊','food-liuting-pork-trotter':'流亭猪蹄','food-qingdao-zhizha':'脂渣','food-dali-sour-fish':'Dali sour fish',
'food-cold-chicken-noodles':'凉鸡米线','food-lijiang-cured-ribs':'腊排骨','food-naxi-chuigan':'吹肝','food-naxi-grilled-pork':'Naxi pork',
'food-lipu-taro-pork':'芋扣肉','food-guilin-stuffed-tofu':'豆腐酿','food-luoyang-beef-soup':'洛阳 牛肉汤','food-bufan-soup':'不翻汤','food-luoyang-tofu-soup':'洛阳 豆腐汤',
'food-plum-blossom-cake':'梅花糕','food-red-bean-rice-balls':'赤豆小元宵','food-haitang-cake':'海棠糕','food-lawar':'Lawar food',
'food-sate-rembiga':'Sate Rembiga','food-ares':'Ares Lombok','food-com-ga-hoi-an':'Cơm gà Hội An','food-banh-dap':'Bánh đập','food-bun-cha-ca':'Bún chả cá',
'food-nem-lui':'Nem lụi','food-nom-banh-chok':'Num banh chok','food-sutukil':'Sutukil','food-samay-baji':'Samay baji','food-dal-baati-churma':'Dal baati churma',
'food-kulhi-boakibaa':'Kulhi boakibaa','food-mas-roshi':'Mas roshi','food-asia-sapporo-shime-parfait':'Sapporo parfait','food-asia-fukuoka-mizutaki':'Mizutaki',
'food-asia-busan-eomuk':'Busan eomuk','food-asia-jeju-black-pork':'Jeju black pork barbecue','food-china2-shenzhen-squab':'光明乳鸽','food-china2-shenzhen-oyster':'沙井蚝',
'food-china2-shenzhen-urchin-rice':'南澳 海胆 炒饭','food-china2-changsha-sugar-cake':'糖油粑粑','food-china2-changsha-rice-noodles':'长沙 米粉',
'food-china2-wuhan-crayfish':'Wuhan crayfish','food-china2-harbin-guobaorou':'Guobaorou','food-china2-harbin-kvass':'Harbin kvass','food-china2-harbin-fried-cake':'东北 油炸糕',
'food-china2-dunhuang-yellow-noodles':'驴肉黄面','food-china2-dunhuang-niangpi':'Dunhuang niangpi','food-china2-dunhuang-apricot-water':'杏皮水','food-china2-dunhuang-fried-pancake':'敦煌 油糕',
'food-china2-zhangjiajie-sanxiaguo':'三下锅','food-china2-zhangjiajie-cured-pork':'Zhangjiajie pork','food-china2-zhangjiajie-sour-fish':'土家 酸鱼','food-china2-zhangjiajie-chestnut-chicken':'板栗炖鸡',
'food-china2-chongqing-chen-mahua':'Ciqikou mahua','food-china2-chongqing-qianzhang':'磁器口 千张','food-china2-jinan-roast-duck':'Jinan roast duck',
}
def plain(s):return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',s or ''))).strip()
out=json.loads(TARGET.read_text('utf-8')) if TARGET.exists() else {}
retry=any(arg in sys.argv for arg in ['--retry','--round3','--round4','--round5'])
if retry:
 QUERIES.update({'food-coconut-pudding':'coconut pudding Sabah','food-jidou-liangfen':'Jidou liangfen','food-sesame-paste-noodles':'麻酱拌面','food-youxuan':'Youxuan','food-luoyang-water-banquet':'Luoyang Shuixi','food-com-ga-hoi-an':'"Com ga" "Hoi An"','food-banh-dap':'"Banh dap"','food-asia-sapporo-shime-parfait':'シメパフェ','food-asia-fukuoka-mizutaki':'水炊き','food-asia-jeju-black-pork':'"Jeju" "pork"','food-asia-busan-eomuk':'"Busan" "fish cake"','food-china2-harbin-kvass':'秋林格瓦斯','food-china2-harbin-guobaorou':'锅包肉','food-plum-blossom-cake':'"Meihua" cake','food-haitang-cake':'"Haitang" cake','food-sate-rembiga':'"Sate Rembiga"','food-mas-roshi':'"Masroshi"'})
 picked=json.loads((ROOT/'data/food-photo-expansion/asia-20260923.json').read_text('utf-8'))
 QUERIES={k:v for k,v in QUERIES.items() if k not in picked}
if '--round3' in sys.argv:
 QUERIES={
 'food-coconut-pudding':'"coconut" "pudding"', 'food-sesame-paste-noodles':'"sesame" "noodles"', 'food-chongqing-douhua':'"douhua" "rice"',
 'food-youxuan':'"Jinan" "pastry"', 'food-carp-baked-noodles':'"carp" "noodles"', 'food-henan-steamed-noodles':'"Henan" "noodles"',
 'food-spicy-clams':'"clams" "chili"', 'food-dali-sour-fish':'"Dali" "fish"', 'food-cold-chicken-noodles':'"cold" "chicken" "noodles"',
 'food-lijiang-cured-ribs':'"Lijiang" "ribs"', 'food-naxi-grilled-pork':'"Lijiang" "pork"', 'food-plum-blossom-cake':'"plum" "blossom" "cake"',
 'food-red-bean-rice-balls':'"red bean" "balls"', 'food-haitang-cake':'"begonia" "cake"','food-sate-rembiga':'"rembiga"',
 'food-kulhi-boakibaa':'"boakibaa"', 'food-asia-sapporo-shime-parfait':'"Hokkaido" "parfait"', 'food-asia-fukuoka-mizutaki':'"chicken" "hotpot"',
 'food-china2-shenzhen-squab':'"roasted" "pigeon"', 'food-china2-shenzhen-oyster':'"Shenzhen" "oyster"', 'food-china2-shenzhen-urchin-rice':'"sea urchin" "rice"',
 'food-china2-wuhan-crayfish':'"crayfish" "China"','food-china2-harbin-fried-cake':'"youzhagao"','food-china2-dunhuang-niangpi':'"niangpi"',
 'food-china2-dunhuang-fried-pancake':'"Chinese" "fried cake"','food-china2-zhangjiajie-sanxiaguo':'"sanxiaguo"','food-china2-zhangjiajie-cured-pork':'"Hunan" "pork"',
 'food-china2-zhangjiajie-sour-fish':'"Tujia" "fish"','food-china2-zhangjiajie-chestnut-chicken':'"chestnut" "chicken"',
 'food-china2-chongqing-chen-mahua':'"mahua" "snack"','food-china2-chongqing-qianzhang':'"bean curd" "skin" "salad"','food-china2-jinan-roast-duck':'"roast duck" "China"',
 }
if '--round4' in sys.argv or '--round5' in sys.argv:
 QUERIES={
 'food-lipu-taro-pork':'"taro" "pork belly"','food-henan-steamed-noodles':'"卤面"','food-xinglong-coffee':'"Xinglong" "coffee" -intitle:Valley',
 'food-chongqing-douhua':'"Sichuan" "douhua"','food-youxuan':'"油旋"','food-dali-sour-fish':'"sour" "fish" "Yunnan"',
 'food-cold-chicken-noodles':'"chicken" "mixian"','food-lijiang-cured-ribs':'"腊" "排骨"','food-naxi-grilled-pork':'"Naxi" "barbecue"',
 'food-red-bean-rice-balls':'"红豆" "汤圆"','food-haitang-cake':'"海棠" "糕"','food-sate-rembiga':'"Rembige"',
 'food-kulhi-boakibaa':'"Kulhi"','food-asia-sapporo-shime-parfait':'"parfait" "Japan" -intitle:SAKURAKO',
 'food-asia-fukuoka-mizutaki':'"Mizutaki"','food-asia-jeju-black-pork':'"흑돼지"',
 'food-china2-shenzhen-squab':'"乳鴿"','food-china2-shenzhen-urchin-rice':'"urchin" "fried rice"',
 'food-china2-wuhan-crayfish':'"spicy crayfish"','food-china2-harbin-fried-cake':'"炸糕"','food-china2-dunhuang-yellow-noodles':'"donkey" "noodles"',
 'food-china2-dunhuang-niangpi':'"酿皮"','food-china2-dunhuang-fried-pancake':'"油糕"','food-china2-zhangjiajie-cured-pork':'"腊肉"',
 'food-china2-zhangjiajie-chestnut-chicken':'"栗子" "雞"','food-china2-chongqing-qianzhang':'"千張"','food-china2-jinan-roast-duck':'"roast duck" "Shandong"',
 'food-spicy-clams':'"辣炒" "蛤蜊"','food-luoyang-water-banquet':'"Luoyang" "soup"',
 }
if '--round5' in sys.argv:
 QUERIES={k:v for k,v in QUERIES.items() if re.search(r'[\u4e00-\u9fff]',v)}
 QUERIES.update({'food-asia-jeju-black-pork':'"black pork"','food-asia-fukuoka-mizutaki':'"鶏" "鍋"','food-spicy-clams':'"stir fried" "clams"','food-red-bean-rice-balls':'"red bean" "tangyuan"','food-kulhi-boakibaa':'"fish cake" "Maldives"','food-luoyang-water-banquet':'"water banquet"','food-haitang-cake':'"Haitanggao"','food-sate-rembiga':'"sate" "Lombok"','food-dali-sour-fish':'"酸辣鱼"'})
for food,query in QUERIES.items():
 if food in out and not retry:continue
 search=(f'"{query}"' if re.search(r'[\u4e00-\u9fff]',query) and '"' not in query else query)+' filetype:bitmap'
 params={'action':'query','format':'json','generator':'search','gsrsearch':search,'gsrnamespace':6,'gsrlimit':15,'prop':'imageinfo','iiprop':'url|extmetadata|size'}
 url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'TusuanTravelPhotoDiscovery/1.0 (https://github.com/ducky-yyds/tour-fee) metadata only'})
  with urllib.request.urlopen(req,timeout=30) as response:data=json.load(response)
  rows=[]
  for page in data.get('query',{}).get('pages',{}).values():
   image=(page.get('imageinfo') or [{}])[0];meta=image.get('extmetadata',{})
   rows.append({'photoFile':page['title'].removeprefix('File:'),'sourceUrl':image.get('descriptionurl'),'license':plain(meta.get('LicenseShortName',{}).get('value')),'licenseUrl':plain(meta.get('LicenseUrl',{}).get('value')),'artist':plain(meta.get('Artist',{}).get('value')),'description':plain(meta.get('ImageDescription',{}).get('value')),'categories':plain(meta.get('Categories',{}).get('value')),'originalUrl':image.get('url'),'width':image.get('width'),'height':image.get('height')})
  previous=out.get(food,{})
  rows={p['photoFile']:p for p in previous.get('candidates',[])+rows}
  out[food]={'query':query,'priorQuery':previous.get('query'),'candidates':list(rows.values()),'checkedAt':'2026-09-23'}
  print(food,len(rows),flush=True)
 except Exception as e:
  out[food]={'query':query,'error':str(e),'checkedAt':'2026-09-23'};print(food,str(e),flush=True)
 TARGET.write_text(json.dumps(out,ensure_ascii=False,indent=2),'utf-8')
 time.sleep(1.5)
