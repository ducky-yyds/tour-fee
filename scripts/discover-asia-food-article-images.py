"""Record article image names for unresolved Asian dishes; metadata only."""
import json, urllib.request, urllib.parse, time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
GROUPS={
'zh':['鲅鱼水饺','鸡豆凉粉','洛阳水席','兴隆咖啡','麻酱面','豆花饭','油旋','奶汤蒲菜','鲤鱼焙面','蒸卤面','烩饼','流亭猪蹄','脂渣','酸辣鱼','凉鸡米线','腊排骨','吹肝','纳西烤肉','荔浦芋扣肉','洛阳牛肉汤','不翻汤','豆腐汤','梅花糕','赤豆小元宵','海棠糕','光明乳鸽','沙井蚝','锅包肉','格瓦斯','油炸糕','驴肉黄面','酿皮','杏皮水','三下锅','腊肉','麻花','千张'],
'ja':['水炊き','シメパフェ'],
'vi':['Cơm gà Hội An','Bánh đập'],
'en':['Coconut pudding','Masroshi','Kulhi boakibaa','Jeju black pig','Eomuk'],
}
result={}
for lang,titles in GROUPS.items():
 url=f'https://{lang}.wikipedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','titles':'|'.join(titles),'prop':'images','imlimit':500,'redirects':1})
 try:
  request=urllib.request.Request(url,headers={'User-Agent':'TusuanTravelPhotoDiscovery/1.0 (https://github.com/ducky-yyds/tour-fee)'})
  with urllib.request.urlopen(request,timeout=30) as response: payload=json.load(response)
  result[lang]=[{ 'title':page['title'],'images':[x['title'] for x in page.get('images',[])]} for page in payload.get('query',{}).get('pages',{}).values() if 'missing' not in page]
 except Exception as e: result[lang]={'error':str(e)}
 time.sleep(1.5)
(ROOT/'artifacts/asia-food-article-images.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
