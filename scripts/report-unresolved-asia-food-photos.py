"""Keep the unsuccessful subject/license review separate from the publishable mapping."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
inventory=json.loads((ROOT/'artifacts/asia-food-photo-inventory.json').read_text('utf-8'))
search=json.loads((ROOT/'artifacts/asia-food-photo-search.json').read_text('utf-8'))
accepted=json.loads((ROOT/'data/food-photo-expansion/asia-20260923.json').read_text('utf-8'))
REASONS={
'food-xinglong-coffee':'搜索主要返回兴隆咖啡谷景区、咖啡树和咖啡馆。无法从元数据确定是否为杯中兴隆咖啡成品，未用店面或原料代替。',
'food-coconut-pudding':'该条目对应亚庇；未找到地域和椰子布丁成品均可核对的许可照片。未借用其他椰奶甜食或马尔代夫照片。',
'food-sesame-paste-noodles':'返回昆明米线调料照片，菜型不符。',
'food-chongqing-douhua':'早期搜索返回马来西亚蝶豆花饭；后找到乐山市场未加调料的大锅豆花，不能完整表现豆花饭套餐，采用专属菜品示意。',
'food-youxuan':'英文名检索混入兴盛优选总部等同音内容；没有油旋成品。',
'food-spicy-clams':'现有可许可照片为黄蚬子菜，无法确定是青岛辣炒蛤蜊的贝种和做法。',
'food-lipu-taro-pork':'发现海外客家芋头扣肉，无法确认荔浦芋扣肉地方版本，未直接替代。',
'food-guilin-stuffed-tofu':'发现深圳客家鱼浆酿豆腐、新马酿豆腐和北京芋头豆腐泡。均不能确认桂北肉馅豆腐酿对应版本。',
'food-sate-rembiga':'可许可文件为Sate pusut与Rembiga的并列插画，不是食物实拍。',
'food-com-ga-hoi-an':'下载后目视候选Com ga Viet Nam voi ga luoc com vang va nuoc cham.jpg实为炸鸡腿炒饭，和描述所说白切鸡鸡汤饭不符，已撤回映射。',
'food-china2-harbin-guobaorou':'下载后目视Guōbāoròu.jpg为较小块橙红浓酱做法，不符合哈尔滨薄大片、清亮糖醋汁特色；已撤回映射。',
'food-banh-dap':'下载后目视Banh dap.jpg实际为黑白钢笔素描而非食物照片；文件页只写菜名容易误判，已撤回实拍映射。',
'food-plum-blossom-cake':'下载后目视Red Bean Plum Blossom Cake (1).jpg为绿色透明花模糕，和南京热烤面糊红豆梅花糕不同，已撤回映射。',
'food-sutukil':'只找到Sutukil餐厅的单道螃蟹或酸腌鱼和门面，尚无能对应海鲜三吃组合的许可照片。',
'food-asia-sapporo-shime-parfait':'Commons搜索混入儿童吃普通芭菲的人像；已排除。札幌官方旅游和酒店公开页面有对应甜品图，但没有确认可转载许可。',
'food-asia-fukuoka-mizutaki':'日语水炊条目引用横滨涮涮锅照片；不是明确的博多鸡肉水炊锅，未采用。',
'food-asia-jeju-black-pork':'Korean BBQ.jpg来源标签明确济州黑猪，许可可用，但下载后画面为生肉置于烤网上，未达到本次熟成菜品呈现要求；改为明确标示的烤黑猪专属插画。',
'food-china2-shenzhen-squab':'未找到能确认光明红烧乳鸽地域和成品的开放许可照片。',
'food-china2-shenzhen-oyster':'检索内容主要为旧文献，未找到沙井蚝成菜开放照片。',
'food-china2-harbin-fried-cake':'中文油炸糕条目使用Birthday cake.jpg，明显不匹配，已排除。',
'food-china2-zhangjiajie-cured-pork':'发现张家界肉炒菜照片但说明未确认腊肉；未把鲜猪肉菜当腊肉。',
'food-china2-chongqing-chen-mahua':'中文麻花条目引用日本神奈川制造的麻花小图，非磁器口麻花且只有200px，未采用。',
'food-china2-chongqing-qianzhang':'千张条目照片主要为食材本身，不能代表磁器口千张皮成品或当地做法。',
}
unresolved=[]
for food in inventory:
 if food['id'] in accepted:continue
 research=search.get(food['id'],{})
 images=[{key:p.get(key) for key in ['photoFile','sourceUrl','license','description']} for p in research.get('candidates',[]) if p['photoFile'].lower().endswith(('.jpg','.jpeg','.png','.webp'))]
 art=ROOT/'data/food-art-expansion'/f"{food['id']}.json"
 unresolved.append({'foodId':food['id'],'name':food['name'],'cityIds':food['cityIds'],'queries':[x for x in [research.get('priorQuery'),research.get('query')] if x],'reason':REASONS.get(food['id'],'多轮Commons、多语维基条目和网页交叉检索，未找到菜名、地方做法与许可均可确认的成品照片；无结果或仅返回无关古籍、同音内容。'),'rejectedOrUnverifiedCandidates':images,'status':'dish-specific-ai-illustration' if art.exists() else 'needs-matching-licensed-photo','artPack':str(art.relative_to(ROOT)).replace('\\','/') if art.exists() else None,'checkedAt':'2026-09-23'})
report={'inventoryCount':len(inventory),'candidateMappingCount':len(accepted),'unresolvedCount':len(unresolved),'unresolved':unresolved,'externalDiscoveryNotes':[
{'url':'https://tw.trip.com/restaurant/china/changsha/detail/nanmenkou-jin-ji-fried-glutinous-rice-balls-11452845/?rankingId=100900014001&source=uccrank','topic':'长沙糖油粑粑与金记店','outcome':'用于菜名和地方关联交叉参考；页面标注用户图片，未转载或下载平台照片。'},
{'url':'https://www.flickr.com/photos/apullmaninlijiang/6019987217','topic':'丽江鸡豆凉粉','outcome':'准确主题但页面明确All rights reserved，已排除；另找到Commons CC BY-SA 2.0准确成品照片。'},
{'url':'https://en.www.resol-hotel.jp/sapporo-n/discovery/resolparfait','topic':'札幌夜间收尾芭菲','outcome':'经营者公开页确认主题与甜品图片，未找到允许直接转载的授权说明，未下载。'},
{'url':'https://faq.japan-travel.jnto.go.jp/en/japan-magazine/1903_hokkaido02/','topic':'札幌夜间收尾芭菲','outcome':'官方旅游资料用于题材识别；不能据公开可见推断照片可自由转载。'}]}
(ROOT/'artifacts/asia-food-photo-unresolved.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
print(f'{len(accepted)} mapped; {len(unresolved)} unresolved with review notes.')
