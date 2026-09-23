"""Export manually reviewed Commons matches from the read-only search cache."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'artifacts/asia-food-photo-search.json'
OUT=ROOT/'data/food-photo-expansion/asia-20260923.json'
CHOICES={
'food-rice-and-curry':('Sri Lankan Rice and Curry.jpg','文件说明明确为斯里兰卡米饭配多款咖喱与蔬菜的成品套餐；未采用检索中混入的日式咖喱饭。'),
'food-longjing-shrimp':('Longjing prawns in Hangzhou Restaurant 2015-07.JPG','杭州酒家龙井虾仁成品，文件说明写明菜名与杭州门店。'),
'food-west-lake-fish':('West Lake Fish in Vinegar Gravy.jpg','杭州山外山餐厅西湖醋鱼成品，文件说明明确对应菜名及杭州餐厅。'),
'food-pianerchuan':('片儿川 20260730.jpg','富阳国际贸易中心大酒店的片儿川成品；文件说明与杭州地方面食对应。'),
'food-tusun-jelly':('Tusundong Xiamen.jpg','文件说明明确为厦门餐馆的土笋冻成品；未用沙虫原料图替代。'),
'food-lawar':('Lawar.jpg','文件说明明确为巴厘岛 Lawar 拌菜成品；未用泛指巴厘岛拼饭的照片。'),
'food-ares':('Ares nangka pelecing beberok.jpg','龙目岛当地菜拼盘包含 Ares 蕉茎咖喱；照片也包含其他当地菜，须在照片说明保留拼盘语境。'),
'food-bun-cha-ca':('Bún chả cá, tháng 8 năm 2018.JPG','文件说明与名称明确为越南鱼饼米线 Bún chả cá；未用河内烤肉米粉 Bún chả 替代。'),
'food-nem-lui':('Nhà mình Lễ 30th4n2023 (chạo nem lụi) (1).jpg','文件名明确为 chạo nem lụi 成品，Commons 归类为越南饮食；下载后需目视确认肉串清晰度。'),
'food-nom-banh-chok':('Num Banh Chok (cropped).jpg','文件说明明确为暹粒 Sam Khmer Noodles 的 Num Banhchok Samlar Brahar 成品。'),
'food-samay-baji':('Samaybaji.JPG','文件说明明确为尼瓦尔 Samaybaji 菜肴成品；未用多人祭祀活动照片。'),
'food-dal-baati-churma':('Dal Baati Churma.jpg','文件名与说明明确为拉贾斯坦 Dal Baati Churma 套餐成品。'),
'food-china2-changsha-sugar-cake':('糖油粑粑.jpg','文件说明明确为长沙糖油粑粑成品；携程南门口金记店公开介绍交叉确认名称和食物外观类型，未转载平台用户照片。'),
'food-china2-changsha-rice-noodles':('长沙米粉.jpg','文件说明明确为湖南长沙米粉成品；未使用检索结果中的米粉街门面照片。'),
'food-jidou-liangfen':('丽江鸡豌豆凉粉 - Chicken pea jelly.jpg','中文维基条目进一步定位到准确文件；Commons说明明确为丽江当地鸡豆凉粉，非川北凉粉或普通豌豆粉。'),
'food-mas-roshi':('Masroshi Maldives.jpg','文件说明明确为马尔代夫 Masroshi 馅饼；不使用另一道鱼松 Mas huni 配薄饼的照片。'),
'food-asia-busan-eomuk':('Eomuk.jpg','文件说明为多种韩式鱼糕成品，许可已由Commons复核；呈现食物种类，不代表釜山某家门店或特定套餐。'),
'food-china2-harbin-kvass':('Qiulin kvas.jpg','文件名与说明明确为秋林格瓦斯饮品；不采用街头商贩或俄罗斯场景替代。'),
'food-guilin-stuffed-tofu':('酿豆腐 1.jpg','肉馅酿豆腐成品；拍于深圳客家餐馆，用于说明同类菜品外观，不代表桂林某门店或当地特定馅料。'),
'food-sutukil':('KINILAW (Carcar, Cebu).jpg','图中为宿务Sutukil餐厅的酸腌鱼Kinilaw，是海鲜三吃中的酸腌做法；并非三道菜合照。'),
'food-coconut-pudding':('Coconut Milk Pudding in Young Coconut.JPG','图为嫩椰壳中盛放的椰奶布丁成品；对应椰子布丁菜型，不声称拍摄于亚庇某家店。'),
'food-sesame-paste-noodles':('Noodles With Sesame Sauce (麻醬麵).jpg','文件说明明确为麻酱面，按中式面食食谱制成；不是米线、日式拉面或单纯麻油拌面。'),
'food-fish-dumplings':('山东鲅鱼饺子.jpg','根代理通过同义菜名鲅鱼饺子检索发现；文件明确为山东鲅鱼水饺成品。'),
'food-china2-shenzhen-oyster':('SZ 深圳 Shenzhen 福田 Futian 皇庭廣場 Wongtee Plaza 商場 Mall shop 盒馬鮮生 Freshippo Supermarket January 2024 R12S steamed oyster.jpg','图为深圳蒸蚝成品，用作本地蚝风味的一种吃法；不声称蚝的养殖产区已核验为沙井。'),
'food-china2-chongqing-chen-mahua':('Mahua 麻花.jpg','图为麻花成品，呈现这种小吃的拧花外观；不代表陈麻花品牌或磁器口某家店铺的实物。'),
'food-lipu-taro-pork':('A Chinese Pork bellies with taro.jpg','图为芋头扣肉成品；展示五花肉与芋头搭配的同类菜，不声称使用的芋头产地已核验为荔浦。'),
'food-china2-wuhan-crayfish':('Spicy crayfish.jpg','图为麻辣小龙虾成品；不采用冷冻原料或小龙虾口味辣条图片。'),
'food-china2-dunhuang-yellow-noodles':('Lürou Huangmian at Daji Jianglürou Huangmian Guan, Dunhuang (20230917193656).jpg','图为敦煌达记酱驴肉黄面馆的驴肉与黄面成品，文件说明明确菜名、当地店名和食用方式。'),
'food-asia-sapporo-shime-parfait':('Chocolate Parfait 20230717.jpg','图为日式巧克力芭菲成品；夜间收尾是餐后食用方式，图片不代表札幌某家店的限定菜单。'),
'food-china2-shenzhen-urchin-rice':('Fried rice with sea urchin 1.jpg','图为深圳大鹏南澳镇海港路餐馆供应的海胆炒饭成品；文件明确菜名与当地拍摄地址，非海胆寿司或生海胆盖饭。'),
'food-china2-shenzhen-squab':('Chinese squab.jpg','图为中式乳鸽成品，呈现该类菜式外观；不声称拍摄于深圳光明某家店铺。'),
'food-china2-dunhuang-niangpi':('5658-Linxia-City-niang-pi.jpg','图为甘肃临夏酿皮成品，呈现同类甘肃小吃的做法；不代表敦煌某家摊位。'),
'food-red-bean-rice-balls':('赤豆酒酿元宵.jpg','图为赤豆酒酿元宵成品，准确对应红豆、小元宵与酒酿的甜汤做法。'),
}
# Public image captions stay separate from the provenance/review notes above.
IMAGE_CONTEXT_NOTES={
'food-rice-and-curry':'图中为米饭搭配多款斯里兰卡咖喱，配菜随店家变化。',
'food-longjing-shrimp':'拍摄于杭州酒家的龙井虾仁。',
'food-west-lake-fish':'拍摄于杭州山外山餐厅的西湖醋鱼。',
'food-pianerchuan':'图中为杭州富阳餐馆供应的片儿川。',
'food-tusun-jelly':'厦门土笋冻的一种呈现方式，旁边配有蘸料。',
'food-lawar':'图中展示几种巴厘岛 Lawar 拌菜。',
'food-ares':'龙目岛家常菜组合，包含 Ares 蕉茎咖喱与其他配菜。',
'food-bun-cha-ca':'图中为越南鱼饼米线，鱼饼与配菜因店而异。',
'food-nem-lui':'图中为香茅串烤肉，摆盘与配菜因店而异。',
'food-nom-banh-chok':'图中为暹粒餐馆供应的柬式米线。',
'food-samay-baji':'尼瓦尔风味拼盘的一种组合，配菜随店家变化。',
'food-dal-baati-churma':'图中展示扁豆咖喱搭配烤面团球的吃法。',
'food-china2-changsha-sugar-cake':'图中为长沙糖油粑粑。',
'food-china2-changsha-rice-noodles':'图中为长沙米粉的一种搭配。',
'food-jidou-liangfen':'图中为丽江鸡豆凉粉的凉拌吃法。',
'food-mas-roshi':'马尔代夫 Masroshi 馅饼的成品外观。',
'food-asia-busan-eomuk':'图中为多种韩式鱼糕，形状与搭配随店家变化。',
'food-china2-harbin-kvass':'图中为瓶装秋林格瓦斯，包装以购买时为准。',
'food-guilin-stuffed-tofu':'图中为同类肉馅酿豆腐，馅料与摆盘因店而异。',
'food-sutukil':'图中是海鲜三吃中的酸腌鱼 Kinilaw。',
'food-coconut-pudding':'图中为盛在嫩椰壳中的椰奶布丁。',
'food-sesame-paste-noodles':'图中为麻酱面的一种做法。',
'food-fish-dumplings':'图中为绿色面皮的鲅鱼饺子，面皮做法因店而异。',
'food-china2-shenzhen-oyster':'图中展示蒸蚝的一种吃法。',
'food-china2-chongqing-chen-mahua':'麻花小吃外观示例，图片不代表特定品牌。',
'food-lipu-taro-pork':'图中为同类芋头扣肉，展示芋头与五花肉的搭配。',
'food-china2-wuhan-crayfish':'图中展示麻辣小龙虾的常见吃法。',
'food-china2-dunhuang-yellow-noodles':'拍摄于敦煌餐馆的驴肉黄面。',
'food-asia-sapporo-shime-parfait':'日式巧克力芭菲示例，餐后甜品的一种选择。',
'food-china2-shenzhen-urchin-rice':'拍摄于深圳南澳餐馆的海胆炒饭。',
'food-china2-shenzhen-squab':'中式乳鸽成品示例，摆盘与配菜因店而异。',
'food-china2-dunhuang-niangpi':'图中为甘肃临夏酿皮，呈现同类甘肃小吃的外观。',
'food-red-bean-rice-balls':'南京赤豆酒酿元宵，红豆甜汤搭配小元宵。',
}
source=json.loads(SOURCE.read_text('utf-8'))
result={}
for food,(name,note) in CHOICES.items():
 found=next((row for row in source.get(food,{}).get('candidates',[]) if row['photoFile']==name),None)
 if not found:raise ValueError(f'Missing verified source metadata: {food}/{name}')
 if not found['license'].startswith(('CC BY','CC0','Public domain')):raise ValueError(f'Unsupported license {food}')
 result[food]={key:found.get(key) for key in ['photoFile','sourceUrl','license','licenseUrl','artist','description','originalUrl']}
 result[food].update({'scope':'dish','sourceCheckedAt':'2026-09-23','note':note,'verification':'Commons文件页元数据核对菜品主题、地域和许可；已查看下载后的成图与接触表，剔除不同地方做法、非照片与未烹调成品。'})
 result[food]['imageContextNote']=IMAGE_CONTEXT_NOTES[food]
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n','utf-8')
print(f'Published {len(result)} reviewed food photo candidates.')
