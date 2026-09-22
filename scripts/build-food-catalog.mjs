/** Maintained dish definitions plus explicit guide-derived coverage.
 * Re-running adds new cities/guide foods, while preserving hand-edited records.
 * No restaurant availability, menu prices or photo rights are inferred here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name, fallback = []) => { try { return JSON.parse(fs.readFileSync(path.join(root, name), 'utf8')); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; } };
const stamp = '2026-09-23';
const sources = {
  hkBreakfast: 'https://www.discoverhongkong.com/eng/plan/qts/start-your-day-right-quality-breakfast-spots.html',
  hkFood: 'https://www.discoverhongkong.com/eng/food-and-drink.html',
  hkPicks: 'https://www.discoverhongkong.com/content/dam/dhk/intl/corporate/newsroom/press-release/hktb/2023/04-HKbestpicks-result-announcement-E.pdf',
  hkWalk: 'https://www.discoverhongkong.com/content/dam/dhk/market-site/seasia/e-guidebook/pdf/Sham%20Shui%20Po%20-%20Self-guided%20Walks.pdf',
  cq: 'https://www.ichongqing.info/brands/tasty-chongqing/',
  cqNoodles: 'https://www.ichongqing.info/2024/05/16/xiaomian-chongqing-spicy-noodles/amp/',
  hainanChicken: 'https://en.hainan.gov.cn/englishsite/sDining/202506/594f540cda93448c85c0b093e66bdd65.shtml',
  hainanSweet: 'https://www.ehainan.gov.cn/2019-08/20/c_398131.htm',
  japan: 'https://www.japan.travel/en/local-specialities/local-foods/',
  tokyo: 'https://www.gotokyo.org/en/see-and-do/drinking-and-dining/index.html',
  vietnam: 'https://www.vietnam.travel/things-to-do/21-must-try-vietnamese-dishes/',
  singapore: 'https://www.visitsingapore.com/content/dam/desktop/global/about-singapore/traveller-information/STB_Singapore_Insider_2017_Q3_English.pdf',
  portugal: 'https://www.visitportugal.com/pt-pt/content/tempo-para-saborear-portugal',
  scotland: 'https://www.visitscotland.com/things-to-do/food-drink/must-try-food',
  greece: 'https://www.visitgreece.gr/experiences/gastronomy/traditional-cuisine/cycladic-cuisine',
  gozo: 'https://visitgozo.com/experience/local-delicacies/',
  madeira: 'https://www.visitmadeira.com/pt/o-que-fazer/apreciadores-de-gastronomia-e-vinho/gastronomia-tradicional/bolo-do-caco/',
  azores: 'https://taste.visitazores.com/en/recipe/cozido-furnas',
  bled: 'https://www.bled.si/en/what-to-see-do/cuisine/bled-cream-cake/2020050414555020/-/',
  morocco: 'https://www.visitmorocco.com/en/travel-info/food-drinks',
  peru: 'https://www.peru.travel/gastronomy/en/peruvian-cuisine/cuisine-of-lima.html',
  argentina: 'https://www.argentina.travel/en/news/typical-argentinian-dishes-ideal-for-sharing',
  jinan: 'https://jnbusiness.jinan.gov.cn/col8314/art/2025/art_8314_4783453.html',
  zhengzhou: 'https://www.zhengzhou.gov.cn/view43/index.jhtml',
  quanzhou: 'https://www.quanzhou.gov.cn/lyb/lyxw/202601/t20260119_3258243.htm',
  dali: 'https://www.yndali.gov.cn/dlsrmzf/c103383/pc/content/1981555777511460864/content_1981555777511460864.html',
  qingdao: 'https://www.qingdao.gov.cn/zwgk/xxgk/whly/gkml/gzxx/tnull_8822276.shtml',
  madeiraMeat: 'https://www.visitmadeira.com/en/what-to-do/food-and-wine-enthusiasts/traditional-madeira-food/espetada/',
  azoresCheese: 'https://taste.visitazores.com/en/cuisine/products',
  danang: 'https://vietnam.travel/vi/things-to-do/foodie%E2%80%99s-guide-da-nang',
};
// slug | cities | Chinese name | local name | English Wikipedia article | description | optional checked source key
const definitions = [
  ['dim-sum','hong-kong guangzhou','粤式点心','點心 · Dim sum','Dim sum','蒸笼里的虾饺、烧卖和叉烧包适合搭配一壶茶，按份选择并慢慢分享。','hkFood'],
  ['hong-kong-milk-tea','hong-kong','丝袜奶茶','絲襪奶茶 · Hong Kong-style milk tea','Hong Kong-style milk tea','浓红茶配奶的茶餐厅饮品，热饮和冻饮各有风味；可先询问甜度与是否另加糖。','hkBreakfast'],
  ['egg-waffle','hong-kong','鸡蛋仔','雞蛋仔 · Gai daan jai','Egg waffle','连成一片的小圆格蛋香烘饼，适合在街区散步时买一份现做的小食。','hkWalk'],
  ['pineapple-bun','hong-kong','菠萝包与菠萝油','菠蘿包／菠蘿油 · Bo lo bao','Pineapple bun','表面酥皮的茶餐厅面包；菠萝油通常夹一片黄油，名称并不表示一定含菠萝。','hkBreakfast'],
  ['wonton-noodles','hong-kong guangzhou','云吞面','雲吞麵 · Wonton noodles','Wonton noodles','细面与云吞组成的一碗轻巧正餐，汤面、捞面及配料按菜单分别选择。','hkBreakfast'],
  ['siu-mei','hong-kong guangzhou','粤式烧味','燒味 · Siu mei','Siu mei','叉烧、烧肉和烧鸭等烧味可以配饭或拼盘，切件份量与搭配方式影响一餐大小。','hkPicks'],
  ['egg-tart','hong-kong guangzhou','港式蛋挞','蛋撻 · Daan taat','Egg tart','蛋奶馅配酥皮或牛油皮的小点心，适合作为茶歇；出炉批次与口感可现场询问。','hkBreakfast'],
  ['curry-fish-balls','hong-kong','咖喱鱼蛋','咖喱魚蛋 · Curry fish balls','Fish ball','街边常见的鱼蛋小食，咖喱汁的辣度和每份数量以摊位菜单为准。','hkPicks'],
  ['chongqing-noodles','chongqing','重庆小面','重庆小面 · Xiǎomiàn','Chongqing noodles','以麻辣调味和面条为主角的日常面食，可按偏好询问汤面、干拌及豌杂等配料。','cqNoodles'],
  ['chongqing-hot-pot','chongqing','重庆火锅','重庆火锅 · Chóngqìng huǒguō','Chongqing hot pot','围着热锅涮煮自己选的食材，适合留出一段完整用餐时间，并事先确认辣度与锅底。','cq'],
  ['wenchang-chicken','haikou sanya wanning lingshui','文昌鸡','文昌鸡 · Wénchāng jī','Wenchang chicken','海南代表性鸡肉菜肴之一，白切做法着重鸡肉本味，蘸汁和配饭可分别点选。','hainanChicken'],
  ['qingbuliang','haikou sanya wanning lingshui','清补凉','清补凉 · Qīngbǔliáng','Ching bo leung','海南常见的清凉甜品，椰奶或其他汤底搭配多种小料；具体配料和甜度以店家做法为准。','hainanSweet'],
  ['shengjian','shanghai','生煎包','生煎 · Shēngjiān','Shengjian mantou','底部煎香、内有汤汁的包子，适合作为一份热早餐或轻餐。'],
  ['xiaolongbao','shanghai taipei','小笼包','小籠包 · Xiǎolóngbāo','Xiaolongbao','小巧蒸笼里的薄皮汤包，可从原味肉馅开始，再按口味选择其他馅料。'],
  ['peking-duck','beijing','北京烤鸭','北京烤鸭 · Běijīng kǎoyā','Peking duck','烤鸭切片搭配薄饼与葱酱，适合分享；按人数核对半只、整只及配料。'],
  ['douzhi','beijing','豆汁与焦圈','豆汁儿 · Dòuzhī','Douzhi','带发酵风味的老北京饮品，常与焦圈等早餐小食搭配；初尝可以先选小份。'],
  ['sichuan-hot-pot','chengdu','四川火锅','四川火锅 · Sìchuān huǒguō','Sichuan hot pot','选择锅底后逐份点食材涮煮，给分享、聊天和慢慢吃留足时间。'],
  ['mapo-tofu','chengdu','麻婆豆腐','麻婆豆腐 · Mápó dòufu','Mapo tofu','麻辣酱汁和豆腐组成的川味下饭菜，辣度与肉末等用料需按菜单确认。'],
  ['roujiamo','xian','肉夹馍','肉夹馍 · Ròujiāmó','Roujiamo','馍中夹肉的陕西小吃，适合街区途中补充一顿轻餐；馍与馅料风格因店而异。'],
  ['paomo','xian','羊肉泡馍','羊肉泡馍 · Yángròu pàomó','Paomo','掰碎的馍与肉汤一起构成饱足的一餐，用餐时可询问掰馍与制作流程。'],
  ['dongpo-pork','hangzhou','东坡肉','东坡肉 · Dōngpō ròu','Dongpo pork','慢炖的酱香五花肉，适合与蔬菜、米饭搭配分享。'],
  ['longjing-tea','hangzhou','龙井茶','龙井茶 · Lóngjǐng chá','Longjing tea','以一壶茶作为湖西或茶村散步的休息环节，询问茶叶等级、茶位及续水方式。'],
  ['ramen','tokyo osaka','日式拉面','ラーメン · Rāmen','Ramen','从盐味、酱油或味噌等汤底选择一碗面，再决定是否搭配饺子与其他小食。','tokyo'],
  ['sushi','tokyo osaka','寿司','寿司 · Sushi','Sushi','寿司饭与鱼类或其他食材组合，单点和套餐的数量、时长各有不同。','tokyo'],
  ['udon','osaka kyoto','乌冬面','うどん · Udon','Udon','较粗的面条搭配高汤或蘸汁，适合在街区游览中安排一顿简单正餐。','japan'],
  ['takoyaki','osaka','章鱼烧','たこ焼き · Takoyaki','Takoyaki','圆形热小食通常含章鱼块，现做后内部较烫，可稍等再吃。','japan'],
  ['okonomiyaki','osaka','大阪烧','お好み焼き · Okonomiyaki','Okonomiyaki','铁板煎制的咸味料理，可按店家菜单选择主料，通常比外带小吃需要更长用餐时间。','japan'],
  ['yudofu','kyoto','汤豆腐','湯豆腐 · Yudōfu','Yudofu','热汤中的豆腐搭配蘸汁与配菜，是适合慢慢吃的清淡选择。'],
  ['kalguksu','seoul','韩式刀切面','칼국수 · Kalguksu','Kalguksu','刀切面条搭配热汤，可作为博物馆和老街游览之间的一顿暖胃正餐。'],
  ['korean-barbecue','seoul los-angeles','韩式烤肉','고기구이 · Gogi-gui','Korean barbecue','在烤盘上制作肉类并搭配小菜，按人数核对最低点单份数和配餐。'],
  ['pad-thai','bangkok chiang-mai','泰式炒粉','ผัดไทย · Phat Thai','Pad thai','炒米粉配蛋、蔬菜和可选虾肉等食材，酸甜咸与花生配料各店不同。'],
  ['khao-soi','chiang-mai','泰北咖喱面','ข้าวซอย · Khao soi','Khao soi','椰香咖喱汤与面条组合，是已有城市指南推荐的北泰风味主食。'],
  ['roti','krabi ko-lanta bangkok','泰式煎饼','โรตี · Roti','Roti','小店现煎的薄饼，可选甜味或其他搭配；配料与份量以现场菜单为准。'],
  ['hainanese-chicken-rice','singapore kuala-lumpur sanya','海南鸡饭','海南雞飯 · Hainanese chicken rice','Hainanese chicken rice','鸡肉、香米饭与蘸汁组成的一餐；不同城市的烹调与配酱版本不完全相同。','singapore'],
  ['laksa','singapore penang langkawi','叻沙','Laksa','Laksa','米粉搭配有地方特色的汤底；酸辣鱼汤与椰香汤并非同一版本，点餐时先看名称。','singapore'],
  ['chilli-crab','singapore','辣椒螃蟹','Chilli crab','Chilli crab','酱汁与蟹肉适合多人分享，点单前核对蟹种、重量和配食。','singapore'],
  ['nasi-lemak','kuala-lumpur langkawi singapore','椰浆饭','Nasi lemak','Nasi lemak','椰香米饭搭配酱料与不同配菜，摊档与餐厅版本的份量会有差别。','singapore'],
  ['roti-canai','kuala-lumpur penang','印度煎饼','Roti canai','Roti canai','层叠薄饼搭配咖喱等蘸汁，可作为早餐或较轻的一餐。'],
  ['char-kway-teow','penang singapore','炒粿条','Char kway teow','Char kway teow','宽米粉与配料大火翻炒，点餐时可询问海鲜、肉类及是否加蛋。'],
  ['nasi-campur','bali','印尼什锦饭','Nasi campur','Nasi campur','一盘米饭配多样小菜，适合逐样认识本地餐桌并按食量选择。'],
  ['ayam-taliwang','lombok','塔里旺辣烤鸡','Ayam Taliwang','Ayam Taliwang','龙目岛城市指南收录的辣味鸡肉料理，可先询问辣度及整只或分量。'],
  ['plecing-kangkung','lombok','辣拌空心菜','Plecing kangkung','Plecing kangkung','以空心菜搭配辣味调料的当地风味，可作为烤鸡等主菜的配菜。'],
  ['pho','hanoi ho-chi-minh-city','越南河粉','Phở','Pho','河粉、热汤和肉类或其他配料构成一碗正餐，搭配香草与调味料自行调整。','vietnam'],
  ['bun-cha','hanoi','烤肉米线','Bún chả','Bún chả','烤猪肉、米线与香草搭配着吃，适合午餐时留出坐下慢吃的时间。','vietnam'],
  ['banh-mi','ho-chi-minh-city hoi-an','越南法棍','Bánh mì','Bánh mì','法棍夹入肉类、蔬菜与酱料，是城市散步时方便携带的一餐。','vietnam'],
  ['com-tam','ho-chi-minh-city','越南碎米饭','Cơm tấm','Cơm tấm','碎米饭搭配肉类和其他配菜，按店家的单点或组合菜单选择。','vietnam'],
  ['cao-lau','hoi-an','会安高楼面','Cao lầu','Cao lầu','较有嚼劲的面条配肉与香草，适合在会安老城游览中安排。','vietnam'],
  ['mi-quang','da-nang','广南面','Mì Quảng','Mì Quảng','米面配少量汤汁、香草与肉类或海鲜，岘港指南将其作为地方主食介绍。','vietnam'],
  ['egg-coffee','hanoi','越南蛋咖啡','Cà phê trứng','Egg coffee','咖啡上搭配蛋奶泡沫的饮品，可留一段咖啡馆休息时间。'],
  ['vietnamese-iced-coffee','ho-chi-minh-city hanoi','越南炼乳冰咖啡','Cà phê sữa đá','Vietnamese iced coffee','咖啡搭配炼乳与冰块，甜度及杯量依店家做法而异。'],
  ['larb','luang-prabang','老挝香草肉末','ລາບ · Laap','Larb','肉末与香草调味的菜肴，可搭糯米饭分享；点餐时确认主料与熟制做法。'],
  ['sticky-rice','luang-prabang chiang-mai','糯米饭','ເຂົ້າໜຽວ · Khao niao','Glutinous rice','适合搭配烤肉、蔬菜或蘸酱的主食，按人数选择份量。'],
  ['fish-amok','siem-reap','阿莫克鱼','អាម៉ុកត្រី · Amok trey','Fish amok','椰香与香料包裹鱼肉的高棉菜肴，常与米饭搭配作正餐。'],
  ['adobo','manila','菲律宾阿多波','Adobo','Philippine adobo','以肉类慢煮的家常菜，搭米饭作为正餐，常适合多人分食。'],
  ['sinigang','manila','菲律宾酸汤','Sinigang','Sinigang','酸味汤菜可配不同肉类或海鲜，点单时确认具体版本与份量。'],
  ['lechon','cebu','宿务烤乳猪','Lechon','Lechon','烤猪肉按份或按重量供应时的用餐规模不同，先确认份量再搭配米饭与蔬菜。'],
  ['halo-halo','cebu manila','菲律宾刨冰甜品','Halo-halo','Halo-halo','冰、奶与多种甜配料组成的甜品，适合作为街区休息时的小点。'],
  ['beef-noodle-soup','taipei','台湾牛肉面','牛肉麵 · Niúròu miàn','Beef noodle soup','牛肉与汤面构成的一碗正餐，清炖或红烧的口味可按菜单选择。'],
  ['braised-pork-rice','taipei kaohsiung','卤肉饭','滷肉飯 · Lǔròu fàn','Braised pork rice','肉燥与米饭的日常搭配，小碗饭可再加蔬菜、蛋或汤。'],
  ['momo','kathmandu','尼泊尔蒸饺','मोमो · Momo','Momo (food)','包馅面皮做成的饺子，肉馅与蔬菜馅需按菜单确认，蘸酱口味也有区别。'],
  ['dal-bhat','kathmandu','达尔巴特套餐','दाल भात · Dal bhat','Dal bhat','扁豆汤、米饭及配菜组成的一餐，按食量确认套餐内容与续添规则。'],
  ['naan','delhi jaipur','印度烤饼','नान · Naan','Naan','热烤饼适合搭配咖喱与其他共享菜，原味与加黄油等做法分别点选。'],
  ['lassi','jaipur delhi','拉西酸奶饮','लस्सी · Lassi','Lassi','以酸奶为基础的饮品，可按菜单选择甜、咸或水果等口味。'],
  ['hoppers','colombo kandy','斯里兰卡碗状薄饼','Appa / Hoppers','Appam','薄饼可搭配蛋或其他配菜，适合作为早餐或轻餐的一部分。'],
  ['kottu','colombo','斯里兰卡炒饼','Kottu roti','Kottu','切碎的薄饼与蔬菜、蛋或肉类炒制，点餐前确认版本与辣度。'],
  ['mas-huni','male maafushi','金枪鱼椰丝早餐','Mas huni','Mas huni','金枪鱼、椰丝与其他调味组成的早餐菜，通常搭配当地薄饼。'],
  ['mas-riha','male maafushi','马尔代夫咖喱鱼','Mas riha','Mas riha','鱼肉咖喱配饭或薄饼，居民岛小店与度假村餐饮的供应方式可能不同。'],
  ['croissant','paris','可颂','Croissant','Croissant','层叠酥皮的面包可搭配咖啡作早餐或街区散步后的茶歇。'],
  ['baguette','paris','法棍面包','Baguette','Baguette','外皮与内里形成不同口感的长面包，可单买，也可选做成三明治的版本。'],
  ['full-breakfast','london edinburgh dublin','英伦式早餐','Full breakfast','Full breakfast','热食拼盘的组合因城市和店家而异，选择前核对肉类、蛋、豆类与饮品。'],
  ['fish-and-chips','london edinburgh','炸鱼薯条','Fish and chips','Fish and chips','炸鱼与薯条适合作为一顿完整正餐，鱼种、份量与堂食服务按菜单确认。'],
  ['haggis','edinburgh','哈吉斯','Haggis','Haggis','肉类、燕麦与香料组成的苏格兰菜肴，可选择主菜或小份前菜版本。','scotland'],
  ['irish-stew','dublin','爱尔兰炖菜','Irish stew','Irish stew','炖肉与蔬菜组成暖热的一餐，可搭配面包；店家版本与主料需看菜单。'],
  ['carbonara','rome','卡邦尼意面','Pasta alla carbonara','Carbonara','罗马风味意面之一，蛋、奶酪与腌肉风味适合单独安排一份主食。'],
  ['cacio-e-pepe','rome','奶酪黑胡椒意面','Cacio e pepe','Cacio e pepe','奶酪与黑胡椒作为核心风味的意面，适合与其他前菜分开选择。'],
  ['cicchetti','venice','威尼斯小食','Cicchetti','Cicchetti','小份咸点适合在酒馆按件挑选、慢慢尝味；饮品通常另点。'],
  ['risotto','venice','意式烩饭','Risotto','Risotto','米饭与汤汁慢慢烹调的主食，潟湖食材等具体版本须看当季菜单。'],
  ['florentine-steak','florence','佛罗伦萨牛排','Bistecca alla fiorentina','Bistecca alla fiorentina','适合多人分享的大块牛排，点餐前先确认重量、熟度和配菜。'],
  ['ribollita','florence','托斯卡纳蔬菜面包汤','Ribollita','Ribollita','蔬菜、豆类与面包组成的浓汤，适合作为比大份肉菜更轻的一餐。'],
  ['paella','barcelona','西班牙烩饭','Paella','Paella','一锅米饭搭配不同主料，海鲜与其他版本分别点选，先核对最低人数。'],
  ['tapas','barcelona madrid','西班牙小盘菜','Tapas','Tapas','用小盘分次品尝不同菜肴，可按食量续点，留意每盘与饮品的累计金额。'],
  ['calamari-sandwich','madrid','鱿鱼圈三明治','Bocadillo de calamares','Bocadillo de calamares','面包夹炸鱿鱼圈的便餐，可在马德里老城散步途中寻找。'],
  ['cocido-madrileno','madrid','马德里炖菜','Cocido madrileño','Cocido madrileño','鹰嘴豆、肉类与其他配菜组成的一餐，较适合留出充分用餐时间。'],
  ['pastel-de-nata','lisbon','葡式蛋挞','Pastel de nata','Pastel de nata','酥皮包着蛋奶馅的甜点，可单买或搭一杯咖啡，堂食与外带分别确认。','portugal'],
  ['codfish-cakes','lisbon','葡式鳕鱼饼','Pastéis de bacalhau','Bolinho de bacalhau','鳕鱼与其他配料做成的小点，适合作为轻食或共享前菜。','portugal'],
  ['stamppot','amsterdam','荷兰蔬菜土豆泥','Stamppot','Stamppot','土豆与蔬菜搭配成的家常主食，肉类及其他配菜依店家版本而异。'],
  ['stroopwafel','amsterdam','荷兰焦糖华夫饼','Stroopwafel','Stroopwafel','薄华夫饼之间夹甜糖浆，适合作为咖啡或茶的配点。'],
  ['currywurst','berlin','咖喱香肠','Currywurst','Currywurst','香肠与咖喱风味酱汁组成的街头餐食，可按菜单选择是否配薯条。'],
  ['doner-kebab','berlin istanbul','土耳其旋转烤肉','Döner kebab','Doner kebab','烤肉可做成夹饼、卷饼或餐盘，按菜单核对肉类与配菜。'],
  ['belgian-waffle','brussels','比利时华夫饼','Gaufre / Wafel','Belgian waffle','华夫饼本身与水果、奶油等加料分别选择，口味和口感依做法不同。'],
  ['moules-frites','brussels','青口配薯条','Moules-frites','Moules-frites','一锅青口与薯条适合坐下慢慢吃，汤汁做法、饮品和份量另核对。'],
  ['black-risotto','dubrovnik kotor','黑墨鱼烩饭','Crni rižot','Risotto','海边指南介绍的墨鱼风味米饭，实际主料与做法请按餐厅菜单选择。'],
  ['prosciutto','dubrovnik kotor','风干火腿与奶酪','Pršut','Prosciutto','薄切风干肉可与奶酪、面包组成小盘，具体产地和搭配以菜单为准。'],
  ['baklava','istanbul cappadocia','果仁千层酥','Baklava','Baklava','层叠薄皮、果仁与糖浆组成的甜点，可按件少量选择配茶。'],
  ['pottery-kebab','cappadocia','陶罐炖肉','Testi kebabı','Testi kebab','陶罐制作的炖肉是现有当地指南推荐菜，通常需要先询问制作时间与预订要求。'],
  ['smorrebrod','copenhagen','丹麦开放式三明治','Smørrebrød','Smørrebrød','面包上叠放鱼、肉或蔬菜等配料，按片挑选适合自己的轻餐组合。'],
  ['danish-pastry','copenhagen','丹麦酥点','Wienerbrød','Danish pastry','层叠面团做成多种甜酥点，可搭配咖啡作早餐或休息时的小食。'],
  ['swedish-meatballs','stockholm','瑞典肉丸','Köttbullar','Meatball','肉丸与酱汁、土豆等配菜组成的一餐，份量和配菜按菜单核对。'],
  ['cinnamon-roll','stockholm bergen tallinn','肉桂卷','Kanelbulle / Kanelbolle','Cinnamon roll','带肉桂香气的烘焙点心，适合咖啡休息；不同地方的形状和甜度不同。'],
  ['lohikeitto','helsinki','芬兰奶油三文鱼汤','Lohikeitto','Lohikeitto','三文鱼与奶油风味汤组成温暖的一餐，可搭面包食用。'],
  ['karelian-pasty','helsinki','卡累利阿派','Karjalanpiirakka','Karelian pasty','薄面皮包馅的小派，适合作早餐或咖啡馆里的咸味小点。'],
  ['sauteed-reindeer','rovaniemi tromso','驯鹿肉料理','Poronkäristys / Reinsdyr','Sautéed reindeer','北方城市指南收录的驯鹿肉菜肴，配菜和制作方式以各地菜单为准。'],
  ['gravlax','oslo bergen tromso','北欧腌三文鱼','Gravlaks','Gravlax','薄切鱼肉可作前菜或开放式面包的配料，点餐时确认是否为生腌做法。'],
  ['norwegian-waffle','oslo','挪威华夫饼与棕奶酪','Vafler med brunost','Brunost','华夫饼搭配棕奶酪等甜咸配料，适合散步途中的咖啡馆小憩。'],
  ['rye-bread','tallinn riga','波罗的海黑麦面包','Rukkileib / Rupjmaize','Rye bread','深色黑麦面包可搭配鱼、奶酪或其他小菜，认识城市家常餐桌。'],
  ['grey-peas','riga','灰豌豆与培根','Pelēkie zirņi ar speķi','Grey pea','当地指南收录的豆类与肉类搭配，适合作为温热的家常菜尝试。'],
  ['cepelinai','vilnius','齐柏林土豆饺','Cepelinai','Cepelinai','土豆面团包馅做成的大饺子，份量通常较足，可先询问每份数量。'],
  ['saltibarsciai','vilnius','立陶宛冷甜菜汤','Šaltibarščiai','Borscht','粉红色冷汤是当地指南的特色选择，主料与配菜请按菜单确认。'],
  ['pierogi','warsaw krakow','波兰饺子','Pierogi','Pierogi','面皮包入咸味或甜味馅料，可按口味选组合并确认每份数量。'],
  ['zurek','warsaw','波兰酸麦汤','Żurek','West Slavic fermented cereal soups','带发酵酸香的汤菜，可搭配蛋、香肠或其他配料，版本因店而异。'],
  ['obwarzanek','krakow','克拉科夫面包圈','Obwarzanek krakowski','Obwarzanek krakowski','环形面包可作为老城散步途中的轻食，表面配料按摊位选择。'],
  ['goulash','prague budapest','中欧炖牛肉与汤','Guláš / Gulyás','Goulash','不同城市会以汤或较浓的炖菜形式呈现，面包或团子配菜另按菜单确认。'],
  ['knedliky','prague','捷克面包团子','Knedlíky','Knedlík','切片的面团类配食可吸收炖菜酱汁，通常作为主菜的一部分。'],
  ['wiener-schnitzel','vienna','维也纳炸肉排','Wiener Schnitzel','Wiener schnitzel','薄肉排裹面包糠炸制，配菜和肉类版本应按餐厅菜单核对。'],
  ['sachertorte','vienna','萨赫巧克力蛋糕','Sachertorte','Sachertorte','巧克力蛋糕适合作为咖啡馆休息时的甜点，份量与奶油搭配可询问。'],
  ['langos','budapest','匈牙利炸饼','Lángos','Lángos','炸面饼可配酸奶油、奶酪等，先选择基础饼再决定加料。'],
  ['fondue','zurich interlaken','瑞士奶酪火锅','Käsefondue / Fondue au fromage','Fondue','面包等配料蘸融化奶酪食用，适合多人慢慢分享并确认每人份量。'],
  ['rosti','zurich interlaken','瑞士薯饼','Rösti','Rösti','土豆煎成的饼可作配菜或带加料的主餐，菜单上的搭配有所不同。'],
  ['souvlaki','athens','希腊烤肉串','Σουβλάκι · Souvláki','Souvlaki','烤肉串可单点或配皮塔饼和蔬菜，适合老城游览中的简单一餐。'],
  ['greek-salad','athens santorini naxos','希腊乡村沙拉','Χωριάτικη · Horiatiki','Greek salad','蔬菜、橄榄与奶酪等组合的沙拉，可与烤肉或其他共享菜搭配。'],
  ['tomatokeftedes','santorini','圣托里尼番茄丸子','Ντοματοκεφτέδες · Tomatokeftedes','Tomatokeftedes','番茄风味的小炸饼，可作为共享前菜逐份点选。','greece'],
  ['fava','santorini','希腊黄豌豆泥','Φάβα · Fáva','Fava Santorinis','黄豌豆泥可搭配面包及其他小菜，是岛屿指南介绍的地方风味。','greece'],
  ['graviera','naxos','纳克索斯奶酪','Γραβιέρα · Graviera','Graviera','可切片品尝或加入菜肴的当地奶酪，产地与成熟度以产品标签为准。','greece'],
  ['bled-cream-cake','bled','布莱德奶油蛋糕','Blejska kremšnita','Cremeschnitte','酥皮与奶油、蛋奶馅叠成的甜点，适合湖边散步后坐下配咖啡。','bled'],
  ['struklji','bled','斯洛文尼亚面卷','Štruklji','Štruklji','面皮包馅成卷的料理，可有甜咸不同版本，按菜单选择。'],
  ['gbejniet','gozo','戈佐小羊乳酪','Ġbejniet','Ġbejna','小圆乳酪可有新鲜、风干或调味版本，适合与面包分次品尝。','gozo'],
  ['gozo-ftira','gozo','戈佐烤饼','Ftira Għawdxija','Ftira','戈佐的烤饼常以带配料的烤制形式呈现，适合在烘焙店按份寻找。','gozo'],
  ['halloumi','paphos','烤哈罗米奶酪','Χαλλούμι / Hellim','Halloumi','奶酪可烤制后作小菜或正餐配料，搭配与份量以餐厅菜单为准。'],
  ['meze','paphos istanbul','地中海小盘分享菜','Meze','Meze','用多种小份冷盘和热菜组成一餐，点套餐前确认菜数、肉鱼搭配和人数。'],
  ['bolo-do-caco','funchal','马德拉蒜香面包','Bolo do caco','Bolo do caco','圆面包可搭蒜香黄油或做成夹馅版本，适合丰沙尔街区餐食。','madeira'],
  ['cozido','ponta-delgada','富尔纳斯地热炖锅','Cozido das Furnas','Cozido','富尔纳斯以地热慢煮多种食材的炖锅；供应和预订需先确认，不能把市区与富尔纳斯视为步行距离。','azores'],
  ['bagel','new-york toronto','百吉饼','Bagel','Bagel','圆形面包可搭配奶油奶酪或其他夹馅，适合早餐与街区途中轻餐。'],
  ['pastrami-sandwich','new-york','熏牛肉三明治','Pastrami sandwich','Pastrami on rye','熟食店式肉馅三明治常较有饱足感，先看份量再决定是否加配菜。'],
  ['avocado-toast','sydney melbourne auckland','牛油果吐司早午餐','Avocado toast','Avocado toast','烤面包搭配牛油果及可选蛋等配料，适合不赶时间的咖啡馆早午餐。'],
  ['flat-white','sydney melbourne auckland queenstown','澳新白咖啡','Flat white','Flat white','浓缩咖啡与细密奶泡组合，适合作为早餐或下午休息时的饮品。'],
  ['hamburger','queenstown los-angeles','汉堡','Burger','Hamburger','面包、主料与配菜组成的便餐，可按食量选择单个或配薯条套餐。'],
  ['shawarma','dubai','阿拉伯烤肉卷','شاورما · Shawarma','Shawarma','切下的烤肉搭配面饼与酱料，可作为城市游览途中较方便的一餐。'],
  ['balaleet','dubai','阿联酋甜面配蛋','بلاليط · Balaleet','Balaleet','甜味细面与蛋搭配的早餐料理，适合认识阿联酋早餐的不同风味。'],
  ['skyr','reykjavik vik akureyri','冰岛乳制品 Skyr','Skyr','Skyr','质地浓稠的乳制品可作为早餐或甜点，原味与水果配料按标签或菜单选择。'],
  ['icelandic-lamb-soup','reykjavik vik akureyri','冰岛羊肉汤','Kjötsúpa','Kjötsúpa','羊肉与蔬菜的热汤适合衔接海边和户外游览，可搭面包作一餐。'],
  ['braai','cape-town johannesburg','南非烤肉','Braai','Braai','烤肉与配菜组成适合分享的一餐，按人数和肉类部位确认份量。'],
  ['chakalaka','johannesburg','南非香辣蔬菜','Chakalaka','Chakalaka','可搭配玉米主食或烤肉的蔬菜小菜，辣度和食材依店家做法不同。'],
  ['bobotie','cape-town','开普风味焗肉','Bobotie','Bobotie','肉末与蛋面层等组成的焗菜，可作为认识开普香料风味的正餐。'],
  ['tajine','marrakech','摩洛哥塔吉锅','طاجين · Tajine','Tajine','在锅中慢炖肉类或蔬菜，适合与面包分享，先按人数核对主料与份量。','morocco'],
  ['couscous','marrakech','库斯库斯','كسكس · Couscous','Couscous','细粒主食配蔬菜或肉类，可作为完整一餐；供应日期和搭配需看菜单。','morocco'],
  ['pastilla','fes','摩洛哥巴斯蒂亚馅饼','بسطيلة · Pastilla','Pastilla','层叠薄皮包入馅料的料理，咸甜与肉类版本不同，点单前确认。','morocco'],
  ['mint-tea','marrakech fes','摩洛哥薄荷茶','أتاي · Atay','Maghrebi mint tea','薄荷与茶的组合适合作为街区探索后的茶歇，甜度可先询问。','morocco'],
  ['koshary','cairo','埃及库沙里','كشري · Koshary','Koshary','米、面和豆类等食材组合的主食，按食量选择份量及调味。'],
  ['ful-medames','cairo luxor','埃及炖蚕豆','فول مدمس · Fūl medames','Ful medames','蚕豆料理可搭配面饼作早餐或便餐，其他配料按菜单另选。'],
  ['kofta','luxor cairo','烤肉丸与肉串','كفتة · Kofta','Kofta','肉末做成的烤制料理，可搭面饼、米饭或沙拉；主料需按店家菜单确认。'],
  ['nyama-choma','nairobi','东非烤肉','Nyama choma','Nyama choma','现有内罗毕指南收录的烤肉菜肴，按重量或份量点单前先确认价格。'],
  ['ugali','nairobi','东非玉米主食','Ugali','Ugali','玉米制成的主食可搭蔬菜、酱汁或肉类，是认识家常餐桌的入口。'],
  ['pilau','zanzibar','桑给巴尔香料饭','Pilau','Pilaf','带香料风味的米饭可搭配不同肉类或蔬菜，具体版本以菜单为准。'],
  ['coconut-fish-curry','zanzibar mahe mauritius','印度洋椰香咖喱鱼','Coconut fish curry','Fish curry','已有当地指南介绍的鱼类咖喱；岛屿之间的香料与椰奶用量不同，可配饭分享。'],
  ['dholl-puri','mauritius','毛里求斯豆馅薄饼','Dholl puri','Dholl puri','薄饼配豆类和其他酱菜的便餐，是现有城市指南收录的地方风味。'],
  ['octopus-salad','mahe','塞舌尔章鱼沙拉','Salade de poulpe','Octopus as food','章鱼与蔬菜等组合的冷盘，可作为海岛餐食的一道前菜，按菜单确认份量。'],
  ['poutine','quebec-city toronto','魁北克肉汁奶酪薯条','Poutine','Poutine','薯条搭配肉汁与奶酪，适合作为较有饱足感的共享小食或一餐。'],
  ['tourtiere','quebec-city','魁北克肉派','Tourtière','Tourtière','酥皮包入肉馅的热派，可按份选择并搭配蔬菜或其他配菜。'],
  ['salmon','vancouver rovaniemi','三文鱼料理','Salmon','Salmon as food','现有城市指南收录的鱼类菜肴，可选烤制等方式；鱼种、份量与时令菜单需核对。'],
  ['tacos','mexico-city los-angeles','墨西哥玉米饼','Tacos','Taco','小饼配不同肉类或蔬菜馅料，按个逐份尝试更容易掌握食量。'],
  ['mole','mexico-city','墨西哥莫莱酱料理','Mole','Mole (sauce)','层次丰富的酱汁搭配主菜，颜色和口味因做法而异，先看菜单版本。'],
  ['cochinita-pibil','cancun','尤卡坦慢烤猪肉','Cochinita pibil','Cochinita pibil','猪肉菜肴可搭饼或米饭，适合按人数选择主菜与分享份量。'],
  ['ceviche','lima cancun','酸橘汁腌鱼','Ceviche / Cebiche','Ceviche','鱼或海鲜与柑橘汁等调料组合，秘鲁与墨西哥版本各有差别，点餐确认食材及生食做法。','peru'],
  ['lomo-saltado','lima','秘鲁炒牛肉','Lomo saltado','Lomo saltado','牛肉、蔬菜与薯条等搭配的热菜，现有利马指南将其列为当地特色正餐。','peru'],
  ['quinoa-soup','cusco','安第斯藜麦汤','Sopa de quinua','Quinoa','藜麦与蔬菜等组成的热汤，可作为高原城市餐食中较轻的一道。'],
  ['chiri-uchu','cusco','库斯科地方拼盘','Chiri uchu','Chiri uchu','现有库斯科指南收录的多食材拼盘，先核对主料和人数，选择适合自己的份量。'],
  ['feijoada','rio-de-janeiro','巴西黑豆炖肉','Feijoada','Feijoada','黑豆与肉类慢炖的主菜，可搭配米饭及其他配菜，适合分享。'],
  ['pao-de-queijo','rio-de-janeiro','巴西奶酪面包','Pão de queijo','Pão de queijo','小巧奶酪烘焙点心适合作早餐或咖啡配点，可按份少量选择。'],
  ['asado','buenos-aires','阿根廷烤肉','Asado / Parrilla','Asado','烤肉聚餐适合预留充分用餐时间，按部位、份量及分享人数点菜。','argentina'],
  ['empanada','buenos-aires santiago','南美馅饼','Empanada','Empanada','面皮包入肉类或其他馅料烤制或炸制，地方做法不同，可按个选择。','argentina'],
  ['pastel-de-choclo','santiago','智利玉米焗派','Pastel de choclo','Pastel de choclo','玉米面层与馅料组成的焗菜，适合作为坐下慢吃的一顿主餐。'],
  ['tianmo','jinan','济南甜沫','甜沫 · Tiánmò','Tian mo','名字带“甜”的济南粥食通常呈咸味，可与油旋等小点组成老城早餐。','jinan'],
  ['bazirou','jinan','济南把子肉','把子肉 · Bǎziròu','Bazirou','酱香炖肉可按块选择，再配米饭和蔬菜；份量与肥瘦可先询问。','jinan'],
  ['hui-mian','zhengzhou','河南烩面','烩面 · Huìmiàn','Hui mian','宽面与汤底组成一碗热面，加肉和小菜按菜单另选。','zhengzhou'],
  ['hulatang','zhengzhou luoyang','河南胡辣汤','胡辣汤 · Húlàtāng','Hulatang','带胡椒香气的浓汤适合搭配饼或包子作早餐，先按食量点小份。','zhengzhou'],
  ['shacha-noodles','xiamen','厦门沙茶面','沙茶面 · Shāchá miàn','Shacha noodles','沙茶风味汤面可选择不同加料，先看基础面与各配料的菜单。'],
  ['oyster-omelette','xiamen quanzhou kaohsiung','海蛎煎','海蠣煎／蚵仔煎','Oyster omelette','海蛎搭配蛋与面糊等煎制，不同城市的配比与酱汁各有特色。'],
  ['fish-dumplings','qingdao','青岛海鲜水饺','鲅鱼水饺 · Bàyú shuǐjiǎo','Jiaozi','以鱼肉等海鲜作馅的饺子，按份点选时可询问数量和具体鱼种。','qingdao'],
  ['guotie','qingdao','青岛锅贴','锅贴 · Guōtiē','Jiaozi','底部煎得酥香的面食小点，适合与其他早餐小食分次尝试。','qingdao'],
  ['rushan','dali','大理乳扇','乳扇 · Rǔshàn','Rushan cheese','薄片状乳制品有不同食用做法，可在大理按菜单选择烤制等版本。','dali'],
  ['ersi','dali','大理饵丝','饵丝 · Ěrsī','Erkuai','米制饵丝可配汤或做成其他面食风格，适合早餐或一顿便餐。'],
  ['jidou-liangfen','lijiang','丽江鸡豆凉粉','鸡豆凉粉 · Jīdòu liángfěn','Jidou liangfen','当地指南收录的豆类凉粉小吃，凉拌与热制等版本按店家菜单选择。'],
  ['lijiang-baba','lijiang','丽江粑粑','丽江粑粑 · Lìjiāng bābā','Lijiang baba','丽江地方饼食可有不同馅料与咸甜口味，适合先买小份尝试。'],
  ['guilin-rice-noodles','guilin','桂林米粉','桂林米粉 · Guìlín mǐfěn','Guilin rice noodles','卤菜粉与汤粉各有吃法，加肉、卤蛋及小菜可按胃口选择。'],
  ['oil-tea','guilin','桂林油茶','油茶 · Yóuchá','Oil tea','当地指南收录的茶汤风味餐食，可搭配小点；与单纯冲泡茶饮不同。'],
  ['luoyang-water-banquet','luoyang','洛阳水席','洛阳水席 · Luòyáng shuǐxí','Luoyang Water Banquet','多种汤菜组成的宴席传统，也可寻找单点菜肴，按人数取舍而非默认整套。'],
  ['misua','quanzhou','泉州面线糊','面线糊 · Miànxiànhú','Misua','细面线制成的热糊汤可加不同配料，适合配油条等作为早餐。','quanzhou'],
  ['popiah','quanzhou xiamen','闽南润饼','润饼 · Rùnbǐng','Popiah','薄饼皮包入多种熟配料，适合按份购买，馅料内容请看摊位菜单。','quanzhou'],
  ['ginger-duck','quanzhou','泉州姜母鸭','姜母鸭 · Jiāngmǔyā','Ginger duck','姜香与鸭肉搭配的热菜通常适合分享，先确认每份大小和配菜。','quanzhou'],
  ['duck-blood-soup','nanjing','鸭血粉丝汤','鸭血粉丝汤 · Yāxuè fěnsī tāng','Duck blood and vermicelli soup','粉丝汤配鸭血及可选鸭杂，是南京指南推荐的便餐，按个人偏好确认配料。'],
  ['nanjing-salted-duck','nanjing','南京盐水鸭','盐水鸭 · Yánshuǐyā','Nanjing salted duck','盐卤风味熟鸭可按份或重量点选，适合与主食、蔬菜组成一餐。'],
  ['suzhou-noodles','suzhou','苏式汤面','苏式汤面 · Sūshì tāngmiàn','Suzhou-style noodles','一碗汤面搭配自己选择的浇头，可先选一两样，避免为尝味而点得过多。'],
  ['squirrel-fish','suzhou','松鼠鳜鱼','松鼠鳜鱼 · Sōngshǔ guìyú','Squirrel fish','整鱼制作的苏帮菜适合分享，先问鱼重、整条价格和用餐人数。'],
  ['hainan-noodles','haikou','海南粉','海南粉 · Hǎinán fěn','Hainan rice noodles','米粉与配料、酱汁组合的地方便餐，可在骑楼老街周边按实际菜单寻找。'],
  ['lingshui-noodles','lingshui','陵水酸粉','陵水酸粉 · Língshuǐ suānfěn','Lingshui sour noodles','酸甜酱汁搭配粉与地方配料，是已有陵水指南收录的小食。'],
  ['xinglong-coffee','wanning','兴隆咖啡','兴隆咖啡 · Xīnglóng kāfēi','Coffee production in China','可以在兴隆安排一段咖啡休息，咖啡馆点单与庄园参观是不同消费。'],
  ['sabah-pork-noodles','kota-kinabalu','沙巴生肉面','生肉面 · Sang nyuk mian','Sang nyuk mian','沙巴城市指南推荐的猪肉面食，点餐时确认汤、面和配料的具体组合。'],
  ['coconut-pudding','kota-kinabalu','椰子布丁','Coconut pudding','Coconut pudding','椰香甜品可作为餐后或海边散步后的小点，配料和冷藏供应按店家确认。'],
  ['rendang','bali','印尼仁当慢炖肉','Rendang','Rendang','香料与肉类慢炖的料理，可搭米饭分享；店家所用肉类与辣度需先确认。'],
  ['banh-xeo','da-nang','越南煎饼','Bánh xèo','Bánh xèo','咸味煎饼可搭香草和蘸汁，馅料、份量与配菜以餐馆菜单为准。','danang'],
  ['kuyteav','siem-reap','高棉米粉汤','គុយទាវ · Kuyteav','Kuyteav','米粉与热汤、肉类等配料组成一碗便餐，是当地指南介绍的米线类选择。'],
  ['rice-and-curry','kandy colombo','斯里兰卡米饭咖喱','Rice and curry','Rice and curry','米饭搭配数种咖喱与蔬菜，家庭式与正式餐厅的菜数及份量不同。'],
  ['espetada','funchal','马德拉烤肉串','Espetada','Espetada','马德拉传统烤肉串可搭面包与配菜，适合与同伴分享一顿正餐。','madeiraMeat'],
  ['sao-jorge-cheese','ponta-delgada','亚速尔圣若热奶酪','Queijo São Jorge','São Jorge cheese','亚速尔群岛的奶酪可在市集或熟食店寻找，按产品标签确认原产岛屿与熟成。','azoresCheese'],
  ['massaman-curry','krabi ko-lanta','泰南马萨曼咖喱','แกงมัสมั่น · Kaeng matsaman','Massaman curry','较浓的香料咖喱可配米饭分享，主料与辣度由具体餐馆菜单决定。'],
];

const wikipedia = article => `https://en.wikipedia.org/wiki/${encodeURIComponent(article.replaceAll(' ', '_'))}`;
const mapSearch = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const cityById = new Map(read('data/cities.json').map(city => [city.id, city]));
const guideById = new Map(read('data/city-guides.json').map(guide => [guide.cityId, guide]));
// Include reviewed expansion records even before the aggregate import runs.
for (const name of fs.readdirSync(path.join(root, 'data/expansion')).filter(name => name.endsWith('.json')).sort()) {
  const entries = read(`data/expansion/${name}`);
  for (const city of Array.isArray(entries) ? entries : []) {
    if (!city?.id) continue;
    if (!cityById.has(city.id)) cityById.set(city.id, city);
    if (!guideById.has(city.id) && city.guide) guideById.set(city.id, city.guide);
  }
}
const areaFor = (city, guide, foodName, localName) => {
  const area = guide?.neighborhoods?.[0]?.name || `${city.name}市区`;
  return [{ name: area, kind: 'area', sourceUrl: mapSearch(`${city.nameEn || city.name} ${area} ${localName || foodName}`), note: `可以从${area}寻找供应${foodName}的餐馆或小店；这是区域检索起点，未核对具体店家的当前菜单与营业。` }];
};
const generated = definitions.map(([slug, ids, name, localName, article, description, sourceKey]) => {
  const cityIds = ids.split(' ').filter(id => cityById.has(id));
  const sourceUrl = sourceKey ? sources[sourceKey] : wikipedia(article);
  return { id: `food-${slug}`, cityIds, name, localName, description, article, sourceUrl,
    whereByCity: Object.fromEntries(cityIds.map(id => [id, areaFor(cityById.get(id), guideById.get(id), name, localName)])),
    servingNote: '作为当地日常餐饮的选择参考；未添加独立单品报价，实际份量、菜单价格及服务费请向店家确认。',
    sourceStatus: sourceKey ? 'official-reference' : 'maintained-guide', sourceCheckedAt: sourceKey ? stamp : null,
    sourceScope: sourceKey ? 'food-description' : 'food-background', catalogOrigin: 'maintained-definition' };
}).filter(food => food.cityIds.length);
const existing = new Map(read('data/local-foods.json').map(food => [food.id, food]));
for (const food of generated) {
  const prior = existing.get(food.id);
  existing.set(food.id, prior ? { ...food, ...prior, cityIds: [...new Set([...food.cityIds, ...prior.cityIds])], whereByCity: { ...food.whereByCity, ...prior.whereByCity } } : food);
}
// Vancouver's maintained guide explicitly includes Asian dining. This is a
// place to seek the dish, not a claim that Vancouver is its historical origin.
const sushi = existing.get('food-sushi');
if (sushi && cityById.has('vancouver')) {
  sushi.cityIds = [...new Set([...sushi.cityIds, 'vancouver'])];
  sushi.whereByCity.vancouver ||= areaFor(cityById.get('vancouver'), guideById.get('vancouver'), sushi.name, sushi.localName);
}
// Only the following named businesses were matched to the dish in a tourism
// board or government food page read on the check date. A listing is not a live
// menu, booking, stock or opening-hours confirmation.
const namedPlaces = [
  ['food-hong-kong-milk-tea', 'hong-kong', 'Cheung Hong Yuen', sources.hkBreakfast],
  ['food-pineapple-bun', 'hong-kong', 'Cheung Hong Yuen', sources.hkBreakfast],
  ['food-egg-tart', 'hong-kong', 'Cheung Hong Yuen', sources.hkBreakfast],
  ['food-wonton-noodles', 'hong-kong', 'Wing Wah AllDay', sources.hkBreakfast],
  ['food-misua', 'quanzhou', '水门国仔面线糊', sources.quanzhou],
  ['food-popiah', 'quanzhou', '亚佛润饼', sources.quanzhou],
  ['food-ginger-duck', 'quanzhou', '斯丹姜母鸭', sources.quanzhou],
  ['food-hulatang', 'zhengzhou', '方中山胡辣汤', 'https://www.zhengzhou.gov.cn/view43/6634544.jhtml'],
  ['food-fish-dumplings', 'qingdao', '船歌鱼水饺', sources.qingdao],
];
for (const [foodId, cityId, name, sourceUrl] of namedPlaces) {
  const food = existing.get(foodId);
  if (!food?.cityIds.includes(cityId)) continue;
  const places = food.whereByCity[cityId] || [];
  if (!places.some(place => place.name === name)) places.unshift({ name, kind: 'restaurant', sourceUrl, sourceCheckedAt: stamp,
    mapsUrl: mapSearch(`${cityById.get(cityId).name} ${name}`),
    note: '官方旅游或政务饮食页面明确介绍过该店与此类食物；分店地址、当前菜单、营业和价格仍需出行前核对。' });
  food.whereByCity[cityId] = places;
}
// Keep every reviewed destination discoverable as guides expand. Guide text is
// retained verbatim; an unverified local translation or representative image is
// never invented to make these fallback records look complete.
for (const [cityId, city] of cityById) {
  const guide = guideById.get(cityId);
  let count = [...existing.values()].filter(food => food.cityIds.includes(cityId)).length;
  for (const [index, highlight] of (guide?.foodHighlights || []).entries()) {
    if (count >= 2) break;
    const id = `food-guide-${cityId}-${index + 1}`;
    if (existing.has(id)) continue;
    if ([...existing.values()].some(food => food.cityIds.includes(cityId) && food.name === highlight.name)) continue;
    existing.set(id, { id, cityIds: [cityId], name: highlight.name, localName: highlight.localName || highlight.name,
      description: highlight.description, article: null, articleScope: 'guide-category', imageQuery: `${city.nameEn || city.name} ${highlight.name} food`, photoStatus: 'needs-food-photo',
      sourceUrl: city.officialTourismUrl || city.image?.sourceUrl || wikipedia(city.article || city.nameEn), sourceScope: 'destination-context', sourceStatus: 'maintained-guide', sourceCheckedAt: null,
      whereByCity: { [cityId]: areaFor(city, guide, highlight.name, highlight.localName) },
      servingNote: '来自已维护的城市饮食指南；尚未逐店核对菜单，不添加独立单品价格。图片与当地名称待进一步精编。', catalogOrigin: 'guide-fallback' });
    count++;
  }
}
// These links were checked and either do not exist, redirect to a city, or
// describe raw ingredients rather than a plated local dish. Do not fetch their
// lead image as a supposedly authentic food photograph.
const unsafeArticleById = {
  'food-lingshui-noodles': 'Lingshui sour noodles',
  'food-lijiang-baba': 'Lijiang baba', 'food-suzhou-noodles': 'Suzhou-style noodles',
  'food-guilin-rice-noodles': 'Guilin rice noodles', 'food-jidou-liangfen': 'Jidou liangfen',
  'food-quinoa-soup': 'Quinoa', 'food-grey-peas': 'Grey pea',
  'food-xinglong-coffee': 'Coffee production in China', 'food-norwegian-waffle': 'Brunost',
  'food-oil-tea': 'Oil tea', 'food-hainan-noodles': 'Hainan rice noodles',
  'food-chiri-uchu': 'Chiri uchu', 'food-pottery-kebab': 'Testi kebab',
  'food-black-risotto': 'Risotto', 'food-gozo-ftira': 'Ftira',
};
const familyArticles = new Set(['Fish ball', 'Jiaozi', 'Erkuai', 'Misua', 'Meatball', 'Risotto', 'Borscht', 'Cozido', 'Cremeschnitte', 'Pilaf', 'Octopus as food', 'Salmon as food', 'Prosciutto', 'Knedlík', 'Roti', 'Egg tart']);
for (const food of existing.values()) {
  if (food.id === 'food-tianmo' && [null, 'Tianmo'].includes(food.article)) {
    food.article = 'Tian mo';
    food.articleScope = 'dish';
    delete food.photoStatus;
  }
  const unsafeArticle = unsafeArticleById[food.id];
  if (unsafeArticle && !food.photoFile && (food.article === unsafeArticle || food.article === null)) {
    food.article = null;
    food.articleScope = 'food-photo-pending';
    food.photoStatus = 'needs-food-photo';
    food.imageQuery = `${food.name} ${food.localName} plated food`;
    if (food.sourceUrl === wikipedia(unsafeArticle)) {
      const city = cityById.get(food.cityIds[0]);
      food.sourceUrl = city?.officialTourismUrl || city?.image?.sourceUrl || null;
      food.sourceScope = 'destination-context';
    }
  } else if (!food.articleScope || food.articleScope === 'dish' && familyArticles.has(food.article)) food.articleScope = familyArticles.has(food.article) ? 'food-family' : 'dish';
  food.imageQuery ||= `${food.name} ${food.localName} food`;
}
const output = [...existing.values()];
const target = path.join(root, 'data/local-foods.json');
const temporary = `${target}.${process.pid}.tmp`;
fs.writeFileSync(temporary, JSON.stringify(output, null, 2) + '\n', 'utf8');
fs.renameSync(temporary, target);
console.log(`Food catalog: ${output.length} foods, ${new Set(output.flatMap(food => food.cityIds)).size} cities. Existing edits preserved.`);
