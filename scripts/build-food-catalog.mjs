/** Maintained dish definitions plus explicit guide-derived coverage.
 * Re-running adds new cities/guide foods, while preserving hand-edited records.
 * No restaurant availability, menu prices or photo rights are inferred here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeFoodExpansions } from './food-expansion.mjs';
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

// Supplemental dish catalog. Regional tourism pages are research references,
// not proof of a restaurant's current menu. Keep these editorial entries at
// sourceCheckedAt:null until each complete record is individually reviewed.
const supplementalSources = {
  "asia0": "https://www.meet-in-shanghai.net/en/guide/taste-your-way-through-shanghai-food-coffee-and-vibrant-neighborhoods-907063/",
  "asia1": "https://english.visitbeijing.com.cn/food",
  "asia2": "https://www.gotokyo.org/en/see-and-do/drinking-and-dining/tokyo-local-food/index.html",
  "asia3": "https://global.kyoto.travel/en/faq/detail.php?faq_id=10089",
  "asia4": "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=75408",
  "asia5": "https://thai.tourismthailand.org/Articles/%E0%B8%8B%E0%B8%AD%E0%B8%81%E0%B9%81%E0%B8%8B%E0%B8%81%E0%B8%9E%E0%B8%B2%E0%B8%81%E0%B8%B4%E0%B8%994%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%AD%E0%B8%A3%E0%B9%88%E0%B8%AD%E0%B8%A2%E0%B9%83%E0%B8%99%E0%B9%80%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%87%E0%B8%AA%E0%B8%B8%E0%B9%82%E0%B8%82%E0%B8%97%E0%B8%B1%E0%B8%A2",
  "asia6": "https://vietnam.travel/node/862",
  "asia7": "https://www.indonesia.travel/id/id/travel-ideas/gastronomy/sate-rembige/",
  "asia8": "https://storage.ebrochures.malaysia.travel/storage/IDB_PDF_MTG_EN.pdf",
  "asia9": "https://www.tourismlaos.org/2024/10/17/khao-soi-goes-viral-tiktok-sparks-new-trend-in-traditional-lao-cuisine/",
  "asia10": "https://www.tourismcambodia.com/travelguides/provinces/banteay-meanchey/where-to-eat.htm",
  "asia11": "https://philippines.travel/destinations/binondo-chinatown/index",
  "asia12": "https://eng.taiwan.net.tw/att/files/Taiwan%20-%20The%20Heart%20of%20Asia%20%28Taiwan%20Tourist%20Manual%29.pdf",
  "asia14": "https://www.prod.incredibleindia.gov.in/content/incredible-india-v2/en/destinations/delhi/food-and-cuisine.html",
  "asia15": "https://srilanka.travel/culinary-tourism/food-range.php",
  "asia16": "https://visitmaldives.com/en/experience/maldivian-cuisine-a-myriad-of-rich-tastes-and-flavors",
  "cn1": "https://www.jinan.gov.cn/cms_files/complat3/49/attach/20261/d5faa5491c4b403fa96d9cadfb05b0ef.pdf",
  "cn2": "https://www.zhengzhou.gov.cn/view43/6591476.jhtml",
  "cn3": "https://www.mct.gov.cn/wlbphone/wlbydd/xxfb/qglb/hn_9781/202308/t20230822_946750.html",
  "cn4": "https://quanzhou.gov.cn/gastronomy/ch/qzgk/yhzc/202412/t20241226_3122619.htm",
  "cn5": "https://www.qingdao.gov.cn/zwgk/xxgk/whly/gkml/gzxx/202512/t20251222_10415836.shtml",
  "cn6": "https://www.dali.gov.cn/dlzrmzf/c101726/pc/content/1968887499085418496/content_1968887499085418496.html",
  "cn7": "https://www.yn.gov.cn/ynxwfbt/html/twzb/1049.html",
  "cn8": "https://lzhbwg.mofcom.gov.cn/edi_ecms_web_front/thb/articledeail/2697",
  "cn9": "https://www.njjy.gov.cn/jyyw/202509/t20250923_5655059.html",
  "cn10": "https://www.gusu.gov.cn/gsq/zwyw/202402/ed44661c8c5d461b986913fa53818a23.shtml",
  "cn11": "https://scdfz.sc.gov.cn/upload/main/contentmanage/article/file/201701161555421063.pdf",
  "cn12": "https://zhuanti.mct.gov.cn/xcss2024_xcyfw/shanxi1/detail/7532.html",
  "cn13": "https://zjjcmspublic.oss-cn-hangzhou-zwynet-d01-a.internet.cloud.zj.gov.cn/jcms_files/jcms1/web3039/site/attach/0/0ad3e0c7e08547ed8018fbdfc336fe65.pdf",
  "cn14": "https://www.lw.gov.cn/zjlw/lwgs/",
  "eu0": "https://parisjetaime.com/eng/restaurant/brasserie-rosie-lou-p4749",
  "eu1": "https://www.visitlondon.com/things-to-do/place/45506032-wigmore",
  "eu2": "https://www.visitscotland.com/things-to-do/food-drink/must-try-food",
  "eu3": "https://images.ireland.com/media/Project/Website/BrochuresPDFFiles/English/881db5b3aa5046bc8986dd419f7e5e99.pdf",
  "eu4": "https://www.turismoroma.it/it/accoglienza/supplizio",
  "eu5": "https://www.veneziaunica.it/es/node/2408",
  "eu6": "https://www.feelflorence.it/it/esperienze-itinerari/cucina-tradizionale-e-km-zero",
  "eu7": "https://www.barcelonaturisme.com/wv3/de/page/1786/pa-amb-tomaquet.html",
  "eu8": "https://www.esmadrid.com/restaurantes/las-tortillas-de-gabino",
  "eu10": "https://www.iamsterdam.com/en/see-and-do/restaurant-and-bars/best-sandwich",
  "eu11": "https://www.visitberlin.de/de/berliner-kueche",
  "eu12": "https://www.visit.brussels/en/visitors/agenda/johnny-hallyday-and-brussels?auto=format&crop=faces&fit=crop&h=250&w=400",
  "eu14": "https://www.montenegro.travel/en/unique-montenegro/jewels-of-the-adriatic/bay-of-kotor",
  "eu15": "https://goturkiye.com/cappadocia/taste-cappadocia",
  "eu16": "https://www.visiticeland.com/service-provider/5ec7d096a90548233654e26c",
  "eu18": "https://www.visitcopenhagen.com/copenhagen/eat-drink/street-food-and-take-away/legendary-tale-hotdogs-denmark",
  "eu19": "https://visitsweden.com/what-to-do/food-drink/swedish-kitchen/local-legends/?what_to_do=4257",
  "eu20": "https://www.visitfinland.com/en/articles/best-finnish-desserts/",
  "eu21": "https://visitestonia.com/en/what-to-do/five-classic-foods-to-try-in-estonia",
  "eu22": "https://www.latvia.travel/en/event/home-cafe-days-2026",
  "eu23": "https://lithuania.travel/en/what-to-do/food-and-drink/lithuanian-products/sakotis",
  "eu24": "https://www.poland.travel/en/flavours-of-polish-cuisine/",
  "eu25": "https://www.visitczechia.com/en-us/things-to-do/places/gastronomic-tourism/czech-cuisine-and-regional-products/g-svickova-na-smetane",
  "eu26": "https://www.wien.info/de/essen-trinken/wiener-kueche/jj-wiener-kueche-1121094",
  "eu27": "https://visithungary.com/documents/b/bf/bfc/bfc5f9b9601c3024150bc8e099fd5ef6857f994.pdf",
  "eu28": "https://www.myswitzerland.com/de/planung/ueber-die-schweiz/brauchtum-und-tradition/schweizer-kueche/",
  "eu30": "https://www.slovenia.info/en/press-centre/news-of-the-tourism-press-agency/35662-slovenian-food-the-taste-of-tradition-nature-and-community",
  "eu31": "https://visitgozo.com/discover-gozo-island/",
  "eu32": "https://www.visitcyprus.com/wp-content/uploads/2016/05/NEW_REVISED_Flavours_of_Cyprus_6_2013_FRE.pdf",
  "eu33": "https://visitmadeira.com/en/what-to-do/food-and-wine-enthusiasts/traditional-madeira-food/sweet-tradition/",
  "eu34": "https://gastronomia.visitazores.com/pt/cozinha/produtos",
  "world0": "https://www.nyctourism.com/events/nathans-famous-fourth-of-july-hot-dog-eating-contest/",
  "world1": "https://www.discoverlosangeles.com/eat-drink/las-most-iconic-dishes-the-classics",
  "world2": "https://www.sydney.com/articles/must-eat-dishes",
  "world3": "https://www.visitmelbourne.com/regions/melbourne/eat-and-drink/11-must-try-melbourne-dishes-and-drinks",
  "world4": "https://www.newzealand.com/in/feature/favourite-new-zealand-foods/",
  "world5": "https://www.visitdubai.com/en/festivals-and-events/-/media/Files/faqs/wulfa/wulfa-guide-to-the-season.pdf",
  "world6": "https://live.southafrica.net/media/282605/nelson-mandela-bay-trade-guide-2021.pdf",
  "world7": "https://visitmorocco.com/en/discover-morocco/gastronomy",
  "world8": "https://www.experienceegypt.eg/en/attraction-details/315/gastronomy",
  "world9": "https://webmail.magicalkenya.com/default.nsf/_fsafaris1/8?l=1&opendocument=&s=8",
  "world10": "https://zanzibartourism.go.tz/activity/Culture%20%26%20Heritage%20Tour",
  "world11": "https://seychelles.com/blog-details/1932/highlights/keeping-tradition-alive-seychelles-cuisine-marie-louise-adela",
  "world12": "https://mauritiusnow.com/fr/blog/things-to-do/lune-de-miel-a-lile-maurice/",
  "world13": "https://www.destinationvancouver.com/inspirations/food-and-drink/super-canadian-comfort-foods-and-where-you-can-eat-them",
  "world14": "https://www.destinationtoronto.com/toronto-food-guide/what-to-eat/",
  "world15": "https://www.quebec-cite.com/en/restaurants-quebec-city/traditional-quebec-food",
  "world17": "https://caribemexicano.travel/guia-gastronomica-de-playa-del-carmen/",
  "world18": "https://www.peru.travel/gastronomy/en/recipes/entrees/causa.html",
  "world20": "https://turismo.buenosaires.gob.ar/sites/turismo/files/gastronomia_informe_final.pdf",
  "world21": "https://chile.travel/blog/turismo-gastronomico-seis-recetas-tipicas-de-chile-para-viajar-desde-tu-cocina-2/",
  "fix0": "https://www.ichongqing.info/2020/06/20/chongqing-showcase-nourish-the-heart-and-soul-in-pengshui-miao-country/",
  "fix2": "https://oss.ly.gov.cn/lyswhgdhlyj/upload/20240723/297ed34a90d832350190dd810af40005.pdf",
  "fix3": "https://wgly.hangzhou.gov.cn/attach/538/2307051510367229.pdf",
  "fix5": "https://www.ynxc.gov.cn/html/2026/ymkyn_0318/3032896.html",
  "fix6": "https://ntb.gov.np/yomari-punhi",
  "fix7": "https://www.tourismthailand.org/Articles/explore-thai-taste-thai-foodie-map-2-0-en",
  "fix8": "https://thailandinsider.com/what-are-the-differences-between-thai-curries/",
  "fix13": "https://www.visitnorway.com/things-to-do/food-and-drink/the-norwegian-cookbook/",
  "fix15": "https://visitdubrovnik.hr/gastronomy/",
  "fix16": "https://www.visitlisboa.com/en/lisbon-stories/13-the-codfish-route/pois",
  "fix17": "https://www.visitgreece.gr/experiences/gastronomy/traditional-cuisine/cycladic-cuisine",
  "fix19": "https://turismo.cdmx.gob.mx/storage/app/media/inf_2024/Guia_Gastronomica_CP-CDMX-digital.pdf",
  "fix20": "https://riotur.rio/onde_comer/bar-do-momo-4/"
};
const supplementalDefinitions = `
scallion-oil-noodles|shanghai|葱油拌面|葱油拌面 · Cōngyóu bànmiàn||葱段煎出的香油拌入细面，可另配炸猪排或小碟浇头。|asia0
pork-chop-rice-cakes|shanghai|排骨年糕|排骨年糕 · Páigǔ niángāo||炸猪排与软糯年糕搭配酱汁，一份即可作饱足的午餐。|asia0
sesame-paste-noodles|shanghai|麻酱拌面|麻酱拌面 · Májiàng bànmiàn||浓芝麻酱裹住面条，喜欢清爽口感可搭一碗清汤。|asia0
zhajiangmian|beijing|老北京炸酱面|炸酱面 · Zhàjiàngmiàn|Zhajiangmian|肉酱与面条、黄瓜等菜码拌匀，酱量可按口味逐步添加。|asia1
instant-boiled-mutton|beijing|铜锅涮羊肉|涮羊肉 · Shuàn yángròu|Instant-boiled mutton|薄羊肉在清汤铜锅里涮熟，搭麻酱与烧饼，适合多人分享。|asia1
rolling-donkey|beijing|驴打滚|驴打滚 · Lǘdǎgǔn|Lüdagun|糯米卷裹豆面、内夹豆沙，适合买小份当茶点。|asia1
rice-noodle-roll|guangzhou|广式肠粉|腸粉 · Cheung fan|Rice noodle roll|薄米浆皮包住肉或虾等馅料，酱汁通常另加，适合作早餐。|cn14
dandan-noodles|chengdu|担担面|担担面 · Dàndàn miàn|Dandan noodles|小碗面条拌肉臊与麻辣调料，可和其他小吃分着尝。|cn11
zhong-dumplings|chengdu|钟水饺|钟水饺 · Zhōng shuǐjiǎo||带红油与蒜香调味的肉馅饺子，甜辣比例依店家做法不同。|cn11
long-wontons|chengdu|龙抄手|龙抄手 · Lóng chāoshǒu||薄皮抄手可选清汤或红油，适合在春熙路一带找小吃店。|cn11
liangpi|xian|陕西凉皮|凉皮 · Liángpí|Liangpi|凉皮拌醋、辣椒与蔬菜，米皮和面皮口感不同，可先看菜单。|cn12
biangbiang-noodles|xian|油泼宽面|Biángbiáng 面|Biangbiang noodles|宽厚面条配油泼辣椒与蔬菜，一大碗更适合作正餐。|cn12
gourd-chicken|xian|葫芦鸡|葫芦鸡 · Húlú jī||鸡肉经煮蒸炸等工序呈酥香口感，常按整只供应，适合分享。|cn12
longjing-shrimp|hangzhou|龙井虾仁|龙井虾仁 · Lóngjǐng xiārén|Longjing shrimp|虾仁与龙井茶叶配成清香杭帮菜，可搭其他菜与米饭。|cn13
west-lake-fish|hangzhou|西湖醋鱼|西湖醋鱼 · Xīhú cùyú|West Lake fish in vinegar gravy|整鱼配酸甜醋汁，点单前问清鱼种、重量与整份价格。|cn13
pianerchuan|hangzhou|片儿川|片儿川 · Piàn'erchuān|Pian er chuan|面汤配肉片、笋片和雪菜，适合作为湖畔游览间的一顿热餐。|fix3
suanlafen|chongqing|重庆酸辣粉|酸辣粉 · Suānlàfěn|Hot and sour noodles|红薯粉条配酸辣汤汁，可按口味少辣并另选配料。|fix0
maoxuewang|chongqing|毛血旺|毛血旺 · Máoxuèwàng|Mao xue wang|血旺与多样配料浸在麻辣汤汁中，适合几人合点并确认内脏配料。|cq
chongqing-douhua|chongqing|豆花饭|豆花饭 · Dòuhuā fàn||嫩豆花配蘸水和米饭是一顿朴素便餐，蘸水辣度可自行控制。|cq
youxuan|jinan|济南油旋|油旋 · Yóuxuán||层层酥香的葱味小饼，可与甜沫搭配作老城早餐。|cn1
sweet-sour-carp|jinan|糖醋鲤鱼|糖醋鲤鱼 · Tángcù lǐyú||炸鱼浇上酸甜汁，通常为整鱼菜，按人数分享更合适。|cn1
cattail-soup|jinan|奶汤蒲菜|奶汤蒲菜 · Nǎitāng púcài||蒲菜配乳白高汤，名称中的奶汤指汤色，实际原料请向店家询问。|cn1
carp-baked-noodles|zhengzhou|黄河鲤鱼焙面|鲤鱼焙面 · Lǐyú bèimiàn||糖醋鱼搭配细脆焙面，蘸汁食用，适合多人分一条鱼。|cn2
henan-steamed-noodles|zhengzhou|河南蒸卤面|蒸卤面 · Zhēng lǔmiàn||面条与肉、豆角等蒸制入味，可找家常豫菜馆按份点选。|zhengzhou
henan-braised-pancake|zhengzhou|河南羊肉烩饼|羊肉烩饼 · Yángròu huìbǐng||饼丝浸在羊肉汤中煮软，是面馆里可询问的另一种主食。|zhengzhou
baoluo-noodles|haikou sanya wanning lingshui|抱罗粉|抱罗粉 · Bàoluó fěn||海南文昌一带的米粉风味，汤拌做法和牛肉等浇头依店而异。|cn3
zaopocu|haikou sanya wanning lingshui|海南糟粕醋|糟粕醋 · Zāopò cù||发酵酸汤搭海鲜和蔬菜，可做共享锅物或汤粉；主料、份量和形式以店家菜单为准。|cn3
tusun-jelly|xiamen quanzhou|土笋冻|土笋冻 · Tǔsǔndòng|Tusun jelly|由海产沙虫熬制凝成的小冻品，常配蒜醋汁；先确认能否接受主料。|cn4
minnan-meat-zongzi|xiamen quanzhou|闽南烧肉粽|烧肉粽 · Shāoròuzòng||糯米包入猪肉、香菇等馅料，蘸酱与配料由店家决定。|cn4
spicy-clams|qingdao|辣炒蛤蜊|辣炒蛤蜊 · Làchǎo gálá||蛤蜊大火炒制配辣椒与香料，可作为海鲜正餐的一道共享菜。|cn5
liuting-pork-trotter|qingdao|流亭猪蹄|流亭猪蹄 · Liútíng zhūtí||酱卤猪蹄切份供应，口感软糯，适合搭蔬菜与主食分食。|cn5
qingdao-zhizha|qingdao|青岛脂渣|脂渣 · Zhīzhā||猪肉炼制成香酥小块，可直接少量品尝，也可入炖菜。|cn5
xizhou-baba|dali|喜洲粑粑|喜洲粑粑 · Xǐzhōu bābā||炭火烤出的层酥饼有甜咸口味；可在喜洲古镇烘饼店询问现做批次。|fix5
dali-sour-fish|dali|白族酸辣鱼|酸辣鱼 · Suānlà yú||鱼肉与木瓜等酸味配料同煮，是适合配米饭分享的白族家常菜。|cn6
cold-chicken-noodles|dali|凉鸡米线|凉鸡米线 · Liángjī mǐxiàn||米线搭鸡丝与酸甜辣调味，适合作为古城午间较清爽的一餐。|cn6
lijiang-cured-ribs|lijiang|丽江腊排骨火锅|腊排骨 · Là páigǔ||腌制排骨配蔬菜煮成热锅，咸度和锅份大小可先询问。|cn7
naxi-chuigan|lijiang|纳西吹肝|吹肝 · Chuīgān||纳西风味猪肝经制作后切片调味，喜欢内脏风味的人可少量尝试。|cn7
naxi-grilled-pork|lijiang|纳西烤肉|纳西烤肉 · Nàxī kǎoròu||以烤制猪肉为主的地方菜，搭蘸料和蔬菜，点前确认肥瘦与份量。|cn7
beer-fish|guilin|阳朔啤酒鱼|啤酒鱼 · Píjiǔ yú||阳朔常见的鱼菜以啤酒参与烹调，整鱼按重量计价时先确认总价。|cn8
lipu-taro-pork|guilin|荔浦芋扣肉|荔浦芋扣肉 · Lìpǔ yù kòuròu||芋头与五花肉相间蒸制，是桂林地区适合多人分享的宴席菜。|cn8
guilin-stuffed-tofu|guilin|桂北豆腐酿|豆腐酿 · Dòufu niàng||豆腐中填入肉等馅料后烹制，荤素和份量以店家做法为准。|cn8
luoyang-beef-soup|luoyang|洛阳牛肉汤|牛肉汤 · Niúròu tāng||热牛肉汤配饼丝或烧饼是洛阳早餐选择，可按食量加肉。|fix2
bufan-soup|luoyang|洛阳不翻汤|不翻汤 · Bùfān tāng||小薄饼与汤料同食，店家配料各有差别，适合老城早餐时尝试。|fix2
luoyang-tofu-soup|luoyang|洛阳豆腐汤|豆腐汤 · Dòufu tāng||豆腐等配料构成热汤，可搭饼丝；请另问汤底是否含肉。|fix2
nanjing-sweet-taro|nanjing|糖芋苗|糖芋苗 · Táng yùmiáo||软糯小芋头配甜汤，常带桂花香，适合作为一小碗饭后甜品。|cn9
plum-blossom-cake|nanjing|梅花糕|梅花糕 · Méihuāgāo||模具烘成花形的小糕，豆沙等馅料上配小圆子等，趁温热品尝。|cn9
osmanthus-rice-cake|nanjing|桂花糕|桂花糕 · Guìhuāgāo|Osmanthus cake|米糕带桂花香，适合与茶搭配，软硬与甜度因做法而异。|cn9
suzhou-eel|suzhou|响油鳝糊|响油鳝糊 · Xiǎngyóu shànhú||切丝鳝鱼配葱蒜等调味后淋热油，可搭米饭多人分享。|cn10
red-bean-rice-balls|suzhou|赤豆小圆子|赤豆小圆子 · Chìdòu xiǎoyuánzi||红豆甜汤配小糯米圆子，适合在市集游览时安排一段甜品休息。|cn10
haitang-cake|suzhou|海棠糕|海棠糕 · Hǎitánggāo||花形模具烘出的小糕内有甜馅，表面略焦香，可按个购买。|cn10
monjayaki|tokyo|东京文字烧|もんじゃ焼き · Monjayaki|Monjayaki|稀面糊与卷心菜等在铁板上拌烤，可用小铲分着吃。|asia2
tempura|tokyo|江户前天妇罗|天ぷら · Tenpura|Tempura|海鲜与蔬菜裹薄浆炸制，配蘸汁或盐，按组合挑选份量。|asia2
soba|tokyo|荞麦面|そば · Soba|Soba|可选冷面蘸汁或热汤面，是东京传统的日常面食。|asia2
obanzai|kyoto|京都家常小菜|おばんざい · Obanzai|Obanzai|按季节做的京都家常小菜，选几小碟配饭可认识在地餐桌。|asia3
kyoto-yuba|kyoto|京都汤叶料理|湯葉 · Yuba||豆浆凝成的薄豆皮可做刺身样冷盘或热菜，具体套餐逐项确认。|asia3
kyoto-wagashi|kyoto|京都和菓子|和菓子 · Wagashi|Wagashi|豆沙、米粉等制成季节甜点，适合搭抹茶慢慢品尝。|asia3
bibimbap|seoul|韩式拌饭|비빔밥 · Bibimbap|Bibimbap|米饭配蔬菜、蛋与可选肉类，拌酱可逐步加入调整辣度。|asia4
tteokbokki|seoul|韩式炒年糕|떡볶이 · Tteokbokki|Tteokbokki|年糕配酱汁烹制，辣酱版本与宫廷酱油版本不同，点前看清。|asia4
samgyetang|seoul|参鸡汤|삼계탕 · Samgyetang|Samgye-tang|鸡肉配糯米、人参等熬成热汤，一盅通常可作正餐。|asia4
tom-yum|bangkok|冬阴功汤|ต้มยำกุ้ง · Tom yam kung|Tom yum|香茅、酸味与辣椒组成鲜明汤味，虾汤与其他版本按菜单区分。|fix7
green-curry|bangkok|泰式绿咖喱|แกงเขียวหวาน · Kaeng khiao wan|Green curry|椰奶咖喱配肉或蔬菜，适合配饭，绿色不代表不辣。|fix8
mango-sticky-rice|bangkok|芒果糯米饭|ข้าวเหนียวมะม่วง · Khao niao mamuang|Mango sticky rice|芒果搭椰奶糯米饭，水果成熟度与供应随季节变化。|fix7
sai-ua|chiang-mai|清迈香草烤肠|ไส้อั่ว · Sai ua|Sai ua|猪肉肠加入香草和辣椒烤香，可按重量少量点来分享。|asia5
nam-prik-ong|chiang-mai|泰北番茄肉末蘸酱|น้ำพริกอ่อง · Nam phrik ong|Nam phrik ong|番茄肉末蘸酱配蔬菜与糯米饭，是泰北餐桌常见搭配。|asia5
southern-sour-curry|krabi ko-lanta|泰南酸咖喱|แกงส้ม · Gaeng som|Kaeng som|鱼肉或海鲜配酸辣汤汁与蔬菜，南部版本香辣鲜明。|fix8
khua-kling|krabi ko-lanta|泰南干炒肉末咖喱|คั่วกลิ้ง · Khua kling|Khua kling|肉末与咖喱香料炒到较干，适合搭米饭并先确认辣度。|fix8
thai-fish-curry|krabi ko-lanta|泰南鱼内脏咖喱|แกงไตปลา · Gaeng tai pla|Kaeng tai pla|发酵鱼内脏调味与蔬菜形成浓郁咖喱，适合想尝本地重口味的人。|fix8
sate-lilit|bali|巴厘岛香料肉糜串|Sate lilit|Sate lilit|调味肉糜裹在竹签或香茅上烤制，鱼肉或其他主料请看菜单。|asia7
babi-guling|bali|巴厘岛烤乳猪饭|Babi guling|Babi guling|香料烤猪配米饭和多样配菜，可询问猪皮、瘦肉等份量。|asia7
lawar|bali|巴厘岛香料拌菜|Lawar|Lawar|蔬菜、椰丝与香料拌成配菜，部分版本含肉或血，请先询问。|asia7
sate-rembiga|lombok|龙目岛伦比加牛肉串|Sate Rembiga||香辣牛肉串烤制后配主食，适合按串分食并询问辣度。|asia7
bebalung|lombok|龙目岛牛骨汤|Bebalung||牛骨与香料慢煮成汤，可搭米饭作一顿热餐。|asia7
ares|lombok|萨萨克蕉茎咖喱|Ares||嫩蕉茎与香料、椰奶等同煮，部分版本含肉，点餐时确认。|asia7
satay|kuala-lumpur langkawi|马来沙爹串|Satay / Sate|Satay|小串烤肉搭花生酱，通常可混点肉类并配米糕。|asia8
nasi-kandar|penang langkawi|马来咖喱什锦饭|Nasi kandar|Nasi kandar|米饭加选咖喱肉与蔬菜，每样加料分别影响结账金额。|asia8
cendol|kuala-lumpur penang langkawi|煎蕊冰甜品|Cendol|Cendol|椰奶、棕榈糖与绿色粉条搭成冰甜品，配料依摊档不同。|asia8
tuaran-mee|kota-kinabalu|斗亚兰炒面|Tuaran mee||沙巴蛋面大火炒制，常配蔬菜与肉类，适合作一顿正餐。|asia8
hinava|kota-kinabalu|沙巴酸柑腌鱼|Hinava|Hinava|鱼肉与酸柑及调料制作的卡达山杜顺风味，点餐前确认生食做法。|asia8
kelupis|kota-kinabalu|沙巴叶包糯米卷|Kelupis|Kelupis|糯米包在叶片里蒸熟，可搭咖喱或其他蘸料，按个品尝。|asia8
banh-cuon|hanoi|越南蒸米卷|Bánh cuốn|Bánh cuốn|薄米皮卷入肉馅等配料，配蘸汁和香草，适合作早餐。|vietnam
goi-cuon|ho-chi-minh-city|越南鲜春卷|Gỏi cuốn|Gỏi cuốn|米纸包蔬菜、米线与虾肉等，蘸酱可选，适合轻餐或共享前菜。|vietnam
white-rose-dumplings|hoi-an|会安白玫瑰蒸饺|Bánh bao bánh vạc|White rose dumplings|小巧米皮蒸饺带虾或肉等馅，按盘分食，蘸汁另添。|vietnam
com-ga-hoi-an|hoi-an|会安鸡饭|Cơm gà Hội An||鸡肉配姜黄米饭与香草，是会安老城可寻找的地方主食。|vietnam
banh-dap|hoi-an|会安敲碎米饼|Bánh đập||薄软米片与脆米饼叠食，配发酵鱼蘸酱，注意酱料风味较浓。|vietnam
bun-cha-ca|da-nang|岘港鱼饼米线|Bún chả cá||鱼饼配米线与蔬菜热汤，适合早午餐时在市区面馆寻找。|danang
banh-trang-thit-heo|da-nang|岘港米纸卷猪肉|Bánh tráng cuốn thịt heo||猪肉片与蔬菜用米纸卷着吃，配发酵鱼酱等蘸料。|danang
nem-lui|da-nang|中越香茅肉串|Nem lụi|Nem lụi|调味肉串烤熟后配香草与米纸卷食，可几人点一份分享。|asia6
or-lam|luang-prabang|琅勃拉邦香草炖菜|ເອາະຫຼາມ · Or lam|Or lam|蔬菜、香草与肉类等慢炖，常搭糯米饭，主料依家庭做法不同。|asia9
lao-khao-soi|luang-prabang|老挝肉酱米粉汤|ເຂົ້າຊອຍ · Khao soi Lao||米粉汤上加肉末、番茄与豆酱，与清迈椰奶咖喱面风格不同。|asia9
jeow-bong|luang-prabang|琅勃拉邦辣椒蘸酱|ແຈ່ວບອງ · Jeow bong|Jeow bong|辣椒调味蘸酱可搭糯米饭，部分配方含水牛皮，请先确认。|asia9
nom-banh-chok|siem-reap|高棉咖喱米线|នំបញ្ចុក · Num banh chok|Num banh chok|米线配鱼汤咖喱与新鲜香草，是可在当地市场寻找的早餐。|asia10
lok-lak|siem-reap|高棉炒牛肉|ឡុកឡាក់ · Lok lak|Beef lok lak|牛肉块配胡椒酸柑蘸汁与米饭，熟度和份量按菜单选择。|asia10
samlor-machu|siem-reap|高棉酸汤|សម្លម្ជូរ · Samlor machu|Samlar machu|鱼或肉搭罗望子等酸味与蔬菜煮汤，可配饭与其他菜分享。|asia10
mami|manila|马尼拉玛米汤面|Mami|Mami soup|受华人饮食影响的热汤面，可选鸡肉、牛肉等配料。|asia11
hopia|manila|菲律宾豆馅酥饼|Hopia|Bakpia|豆沙等馅料的小酥饼可在马尼拉华埠糕饼店寻找，按盒或散买。|asia11
puso|cebu|宿务椰叶包饭|Pusô|Pusô|米饭在编织椰叶袋里煮熟，常作为烤肉的随餐主食。|asia11
ngohiong|cebu|宿务五香炸卷|Ngohiong|Ngohiong|蔬菜与五香调味裹皮炸制，配蘸酱，适合买小份试味。|asia11
sutukil|cebu|宿务海鲜三吃|Sutukil|Sutukil|烧烤、汤煮和酸腌等海鲜做法可组合点选，按重量先确认总价。|asia11
stinky-tofu|taipei kaohsiung|台式臭豆腐|臭豆腐 · Chòu dòufu|Stinky tofu|发酵豆腐炸后常配泡菜，香气明显，可先与同行者分一份。|asia12
oyster-vermicelli|taipei kaohsiung|蚵仔面线|蚵仔麵線 · Ô-á mī-sòaⁿ|Oyster vermicelli|细面线浓汤配蚵仔等，加蒜与醋的方式按个人口味调整。|asia12
taiwan-milkfish-congee|kaohsiung|虱目鱼粥|虱目魚粥 · Sat-ba̍k-hî muê||鱼肉与米粥煮成台南高雄常见的热早餐，点单前询问鱼刺处理。|asia12
yomari|kathmandu|尼瓦尔甜米饺|योमरी · Yomari|Yomari|米粉皮包糖浆或奶馅后蒸熟，是加德满都谷地的尼瓦尔甜点。|fix6
sel-roti|kathmandu|尼泊尔环形米饼|सेल रोटी · Sel roti|Sel roti|米浆炸成环形点心，可搭茶少量品尝，节庆和早餐店较适合寻找。|fix6
samay-baji|kathmandu|尼瓦尔扁米拼盘|समय् बजि · Samay baji|Samay Baji|扁米配豆类、肉与多种小菜的尼瓦尔拼盘，逐项询问生熟与份量。|fix6
chole-bhature|delhi|德里鹰嘴豆咖喱配炸饼|छोले भटूरे · Chole bhature|Chole bhature|膨起的炸饼蘸浓鹰嘴豆咖喱，适合作为一顿饱足早餐。|asia14
butter-chicken|delhi|黄油鸡|मुर्ग़ मखनी · Murgh makhani|Butter chicken|鸡肉配番茄奶油酱汁，可搭烤饼，香料强弱依餐馆不同。|asia14
chaat|delhi|德里酸辣街头小吃|चाट · Chaat|Chaat|脆饼、土豆或豆类搭酸甜酱汁，按具体品种小份点选。|asia14
dal-baati-churma|jaipur|拉贾斯坦豆汤烤面团套餐|दाल बाटी चूरमा · Dal baati churma|Dal baati churma|豆汤、烤面团和甜碎面组成经典搭配，可按人数分享。|asia14
ghevar|jaipur|斋浦尔蜂窝甜饼|घेवर · Ghevar|Ghevar|蜂窝状炸面饼浸甜浆，可带奶油等配料，节庆供应更常见。|asia14
mirchi-bada|jaipur|拉贾斯坦炸辣椒|मिर्ची बड़ा · Mirchi bada|Mirchi bada|辣椒包裹馅料与面糊炸制，辣度明显，适合先点一小份。|asia14
string-hoppers|colombo kandy|斯里兰卡蒸米线团|ඉඳිආප්ප · Idiyappam|Idiyappam|细米线蒸成小团，搭咖喱和椰丝辣拌菜组成早餐。|asia15
watalappan|colombo kandy|斯里兰卡椰糖布丁|වටලප්පන් · Watalappam|Watalappam|椰奶、糖与香料蒸成浓甜布丁，适合作为小份饭后甜点。|asia15
kiribath|kandy|斯里兰卡椰奶米饭|කිරිබත් · Kiribath|Kiribath|椰奶煮成的米饭切块食用，可搭辛香洋葱酱，常见于早餐与节庆。|asia15
garudhiya|male maafushi|马尔代夫清鱼汤|ގަރުދިޔަ · Garudhiya|Garudhiya|清鱼汤配米饭、酸柑与辣椒等，是马尔代夫的日常餐食。|asia16
kulhi-boakibaa|male maafushi|马尔代夫咸鱼糕|Kulhi boakibaa||鱼肉与椰丝等烘成咸味糕点，可在居民岛茶点店按块询问。|asia16
mas-roshi|male maafushi|马尔代夫金枪鱼馅饼|Mas roshi||扁饼内包金枪鱼、椰丝与调味料，适合下午茶时少量点选。|asia16
`.trim().split('\n').map(line => line.split('|'));

supplementalDefinitions.push(...`
croque-monsieur|paris|法式火腿芝士热三明治|Croque-monsieur|Croque monsieur|烘热面包夹火腿与奶酪，适合巴黎咖啡馆的一顿轻午餐。|eu0
french-onion-soup|paris|法式焗洋葱汤|Soupe à l'oignon|French onion soup|洋葱汤上盖面包和融化奶酪，适合天凉时作为热前菜。|eu0
paris-brest|paris|巴黎布雷斯特泡芙环|Paris-Brest|Paris–Brest|环形泡芙夹果仁奶油馅，可与咖啡分享一份甜点。|eu0
pie-and-mash|london|英式肉派与土豆泥|Pie and mash|Pie and mash|酥皮肉派搭土豆泥与酱汁，是适合坐下慢吃的饱足正餐。|eu1
sunday-roast|london|英式周日烤肉餐|Sunday roast|Sunday roast|烤肉搭烤蔬菜、土豆和肉汁，多在周日供应，先查餐厅菜单。|eu1
scotch-egg|london|苏格兰蛋|Scotch egg|Scotch egg|鸡蛋外裹肉馅与面包糠炸制，可作酒馆小食或轻餐。|eu1
cullen-skink|edinburgh|苏格兰烟熏鱼浓汤|Cullen skink|Cullen skink|烟熏黑线鳕配土豆和洋葱煮成浓汤，是苏格兰地区共享风味。|eu2
cranachan|edinburgh|苏格兰覆盆子燕麦奶油杯|Cranachan|Cranachan|燕麦、奶油与覆盆子组成甜点，部分版本含威士忌，点前询问。|eu2
soda-bread|dublin|爱尔兰苏打面包|Irish soda bread|Soda bread|苏打膨发的面包适合抹黄油或蘸汤，常作餐食配角。|eu3
irish-seafood-chowder|dublin|爱尔兰海鲜浓汤|Seafood chowder||鱼贝与奶油汤底组成一碗暖汤，可搭苏打面包，食材随供应改变。|eu3
boxty|dublin|爱尔兰土豆饼|Boxty|Boxty|土豆做成的煎饼可搭肉汁或蔬菜，是爱尔兰传统面食之一。|eu3
suppli|rome|罗马炸饭团|Supplì|Supplì|米饭球裹粉炸脆，常含番茄和融化奶酪，适合买一两个当小食。|eu4
amatriciana|rome|阿马特里切风味意面|Pasta all'amatriciana|Amatriciana sauce|番茄、腌猪颊肉与羊乳酪调味，是罗马餐馆常见的拉齐奥风味。|eu4
carciofi-giudia|rome|罗马犹太式炸朝鲜蓟|Carciofi alla giudia|Carciofi alla giudia|整颗朝鲜蓟炸出脆叶，通常按颗供应，时令与做法请先确认。|eu4
sarde-saor|venice|威尼斯酸甜沙丁鱼|Sarde in saor|Sarde in saor|沙丁鱼配洋葱、醋和葡萄干等腌出酸甜味，适合作共享前菜。|eu5
baccala-mantecato|venice|威尼斯鳕鱼慕斯|Baccalà mantecato|Baccalà mantecato|鱼肉打成绵滑抹酱，可搭玉米糕或面包，常见于小酒馆。|eu5
risi-bisi|venice|威尼斯豌豆烩饭|Risi e bisi|Risi e bisi|米与豌豆煮成介于汤和烩饭之间的料理，春季版本较有特色。|eu5
lampredotto|florence|佛罗伦萨牛肚包|Lampredotto|Lampredotto|炖煮牛胃切入面包，搭绿酱等，是当地街边午餐选择。|eu6
panzanella|florence|托斯卡纳面包沙拉|Panzanella|Panzanella|面包与番茄等蔬菜拌成清爽沙拉，适合夏季午餐配菜。|eu6
pappa-pomodoro|florence|托斯卡纳番茄面包浓汤|Pappa al pomodoro|Pappa al pomodoro|番茄与面包煮成浓稠汤，搭橄榄油和香草，是当地家常口味。|eu6
pa-amb-tomaquet|barcelona|加泰罗尼亚番茄面包|Pa amb tomàquet|Pa amb tomàquet|面包抹番茄、橄榄油与盐，可搭火腿或奶酪作简单餐食。|eu7
escalivada|barcelona|加泰罗尼亚烤蔬菜|Escalivada|Escalivada|茄子、甜椒等烤软后去皮调味，可作前菜或放在面包上。|eu7
crema-catalana|barcelona|加泰罗尼亚焦糖奶冻|Crema catalana|Crema catalana|奶香甜点表层烤出薄脆焦糖，适合饭后小份品尝。|eu7
spanish-omelette|madrid|西班牙土豆蛋饼|Tortilla de patatas|Spanish omelette|鸡蛋与土豆煎成厚饼，含不含洋葱、蛋液熟度可先询问。|eu8
churros|madrid|吉拿棒配巧克力|Churros con chocolate|Churro|细长炸面点蘸浓巧克力，适合早餐或两人分享的下午茶。|eu8
bacalhau-bras|lisbon|葡式鳕鱼炒薯丝|Bacalhau à Brás|Bacalhau à Brás|鳕鱼丝与细薯条、蛋拌炒，是里斯本常见的鳕鱼做法。|fix16
bifana|lisbon|葡式猪肉三明治|Bifana|Bifana|薄猪肉片夹入面包，适合作市区途中较快的一餐。|fix16
grilled-sardines|lisbon|葡式炭烤沙丁鱼|Sardinhas assadas||整条沙丁鱼烤后配面包或土豆，旺季与节庆更适合寻找。|fix16
bitterballen|amsterdam|荷兰炸肉丸|Bitterballen|Bitterballen|酥皮里包浓稠肉馅，通常蘸芥末，内馅很烫可稍等再吃。|eu10
broodje-haring|amsterdam|荷兰鲱鱼面包|Broodje haring||处理过的鲱鱼配洋葱、酸黄瓜夹面包，可在鱼摊按份询问。|eu10
poffertjes|amsterdam|荷兰迷你松饼|Poffertjes|Poffertjes|小圆松饼配黄油和糖粉，适合与同行者分享一盘。|eu10
eisbein|berlin|柏林咸猪肘|Eisbein|Eisbein|盐腌猪肘煮制后常配酸菜或豆泥，与脆皮烤肘做法不同。|eu11
berliner-leber|berlin|柏林式煎肝|Leber Berliner Art||肝片搭苹果与洋葱，是柏林传统家常菜，适合偏爱内脏的人。|eu11
boulette|berlin|柏林肉饼|Berliner Boulette||调味肉馅煎成饼，可配土豆沙拉或面包，适合酒馆便餐。|eu11
stoemp|brussels|比利时蔬菜土豆泥|Stoemp|Stoemp|土豆与胡萝卜等蔬菜捣成泥，常配香肠或其他主菜。|eu12
carbonnade|brussels|比利时啤酒炖牛肉|Carbonnade flamande|Carbonade flamande|牛肉在啤酒酱汁中慢炖，通常搭薯条，适合一顿热正餐。|eu12
speculoos|brussels|比利时香料饼干|Speculoos|Speculoos|带香料味的脆饼干适合配咖啡，可少量购买作旅途茶点。|eu12
rozata|dubrovnik|杜布罗夫尼克焦糖布丁|Rožata|Rožata|蛋奶布丁配焦糖汁，是达尔马提亚沿海的传统饭后甜点。|fix15
sporki-makaruli|dubrovnik|杜布罗夫尼克肉汁通心粉|Šporki makaruli||通心粉裹慢炖肉酱，传统与圣布莱斯庆典有关，也可在餐馆询问。|fix15
arancini-citrus|dubrovnik|达尔马提亚糖渍橙皮|Arancini dubrovački||柑橘皮糖渍后作小甜点，与意大利同名炸饭团不是同一种食物。|fix15
buzara|kotor|科托尔湾蒜香葡萄酒贻贝|Mušule na buzaru||贻贝配蒜、葡萄酒与香草烹煮，可用面包蘸汁，海鲜按供应点选。|eu14
kacamak|kotor|黑山玉米土豆糊|Kačamak|Kačamak|玉米粉、土豆与奶酪等做成饱足主食，属于黑山地区共享菜。|eu14
krempita|kotor|科托尔奶油千层糕|Kotorska krempita||酥皮与蛋奶馅组成的甜点，可在老城甜品店询问地方版本。|eu14
simit|istanbul|土耳其芝麻圈|Simit|Simit|烤面圈外裹芝麻，适合搭茶、奶酪作为简便早餐。|eu15
lahmacun|istanbul|土耳其薄肉饼|Lahmacun|Lahmacun|薄饼铺调味肉末烘烤，加入香草与柠檬汁后卷着吃。|eu15
manti|cappadocia|土耳其酸奶小饺子|Mantı|Manti (food)|小饺子配酸奶蒜酱和热油调味，邻近开塞利的版本尤其有名。|eu15
gozleme|cappadocia|土耳其铁板馅饼|Gözleme|Gözleme|薄面皮包奶酪、土豆或肉等，在铁板上烙熟后切块分享。|eu15
kuru-fasulye|cappadocia|土耳其白豆炖菜|Kuru fasulye|Kuru fasulye|白豆炖菜可搭米饭，部分做法含肉，是土耳其日常餐食。|eu15
plokkfiskur|reykjavik vik akureyri|冰岛鱼肉土豆烩|Plokkfiskur|Plokkfiskur|鱼肉与土豆烩成浓稠热菜，常搭黑麦面包，是冰岛共享家常风味。|eu16
rugbraud|reykjavik vik akureyri|冰岛黑麦面包|Rúgbrauð|Rúgbrauð|深色微甜黑麦面包可配黄油或鱼，不同烘制方式由店家标明。|eu16
icelandic-hot-dog|reykjavik vik akureyri|冰岛热狗|Pylsa||香肠配脆洋葱与多种酱汁装入面包，肉类成分请看店家说明。|eu16
norwegian-fish-soup|oslo bergen tromso|挪威奶油鱼汤|Fiskesuppe||鱼肉和蔬菜组成暖汤，沿海版本各不同，可配面包作轻餐。|fix13
farikal|oslo bergen tromso|挪威羊肉卷心菜锅|Fårikål|Fårikål|羊肉与卷心菜、胡椒同炖，传统偏秋季供应，出行前查菜单。|fix13
norwegian-fish-cakes|oslo bergen tromso|挪威鱼饼|Fiskekaker||鱼肉制成小饼煎熟，可在卑尔根鱼市或当地熟食店询问。|fix13
danish-hot-dog|copenhagen|丹麦热狗|Rød pølse||红肠等热狗搭腌黄瓜、洋葱与酱料，是哥本哈根街头便餐。|eu18
stegt-flaesk|copenhagen|丹麦脆猪肉配欧芹酱|Stegt flæsk|Stegt flæsk|煎烤猪肉配土豆和欧芹白酱，是丹麦传统正餐。|eu18
frikadeller|copenhagen|丹麦煎肉丸|Frikadeller|Frikadeller|调味肉末煎成扁丸，热吃或搭黑麦面包，配菜另按菜单选择。|eu18
toast-skagen|stockholm|瑞典虾肉吐司|Toast Skagen|Toast Skagen|虾肉拌莳萝奶油酱放在吐司上，可作前菜或轻午餐。|eu19
pickled-herring|stockholm|瑞典腌鲱鱼拼盘|Inlagd sill||不同酱汁的腌鲱鱼可配土豆与黑麦面包，小份适合试味。|eu19
princess-cake|stockholm|瑞典公主蛋糕|Prinsesstårta|Princess cake|奶油、蛋糕与杏仁糖皮分层，适合咖啡休息时按片购买。|eu19
korvapuusti|helsinki rovaniemi|芬兰肉桂豆蔻卷|Korvapuusti||面团加入豆蔻并卷上肉桂糖，适合搭咖啡作芬兰式茶歇。|eu20
bilberry-pie|helsinki rovaniemi|芬兰越橘派|Mustikkapiirakka|Mustikkapiirakka|野生越橘风味的果派可配奶油或香草酱，供应随烘焙店改变。|eu20
karjalanpaisti|helsinki rovaniemi|卡累利阿炖肉|Karjalanpaisti|Karelian hot pot|多种肉与蔬菜慢炖，是芬兰地区家常风味，适合配土豆分享。|eu20
mulgipuder|tallinn|爱沙尼亚土豆大麦粥|Mulgipuder|Mulgipuder|土豆与大麦煮成浓稠主食，有些版本加猪肉或培根，先看配料。|eu21
kama-dessert|tallinn|爱沙尼亚谷粉酸奶甜品|Kama||烘焙谷豆粉拌酸奶或发酵乳，可搭浆果，是当地传统简便甜食。|eu21
kohuke|tallinn|波罗的海巧克力奶酪条|Kohuke|Curd snack|甜凝乳外裹巧克力，小包装适合从食品店买来当旅途点心。|eu21
sklandrausis|riga|拉脱维亚胡萝卜土豆挞|Sklandrausis|Sklandrausis|黑麦饼皮装入土豆和胡萝卜馅，源于库尔泽梅，可在里加寻找地方糕点店。|eu22
rupjmaizes-kartojums|riga|拉脱维亚黑麦面包甜点杯|Rupjmaizes kārtojums|Rupjmaizes kārtojums|黑麦面包屑与奶油、果酱分层，适合饭后小份品尝。|eu22
piragi|riga|拉脱维亚培根小包|Pīrāgi|Pīrāgs|小面包包入培根与洋葱等咸馅，适合市集早餐与旅途便食。|eu22
sakotis|vilnius|立陶宛树蛋糕|Šakotis|Šakotis|面糊在转动烤架上烘成枝状蛋糕，可买切片或小份分享。|eu23
kibinai|vilnius|立陶宛卡拉伊姆馅饼|Kibinai|Kibinai|酥面皮包肉或蔬菜馅，源于特拉凯卡拉伊姆社群，也可在首都寻找。|eu23
kugelis|vilnius|立陶宛烤土豆布丁|Kugelis|Kugelis|磨碎土豆烤成饱足主食，常配酸奶油，有些版本含猪肉。|eu23
bigos|warsaw krakow|波兰猎人炖菜|Bigos|Bigos|酸菜、鲜卷心菜与肉类长时间炖煮，可搭面包分享。|eu24
golabki|warsaw krakow|波兰卷心菜包|Gołąbki|Gołąbki|卷心菜叶包肉米馅后烹煮，常配番茄酱，素食版本另问。|eu24
sernik|warsaw krakow|波兰凝乳蛋糕|Sernik||以凝乳制作的蛋糕可配果酱或其他风味，适合咖啡馆茶歇。|eu24
svickova|prague|捷克奶油炖牛肉|Svíčková na smetaně|Svíčková|牛肉配根茎蔬菜奶油酱与面包团子，通常再搭酸甜浆果。|eu25
bramboraky|prague|捷克香蒜土豆饼|Bramboráky||土豆丝与蒜香面糊煎成薄饼，可作街头小食或正餐配菜。|eu25
smazeny-syr|prague|捷克炸奶酪|Smažený sýr|Smažený sýr|厚奶酪裹面包糠炸制，常配薯条和酱汁，份量较饱足。|eu25
apfelstrudel|vienna|维也纳苹果卷|Apfelstrudel|Apple strudel|薄皮卷住苹果与香料馅，可配奶油或香草酱，适合咖啡馆休息。|eu26
kaiserschmarrn|vienna|奥地利皇帝煎饼|Kaiserschmarrn|Kaiserschmarrn|厚煎饼撕成小块配糖粉和果酱，一份常适合两人分享。|eu26
punschkrapfen|vienna|维也纳潘趣小蛋糕|Punschkrapfen|Punschkrapfen|粉色糖衣小蛋糕带朗姆酒风味，含酒精配方请先询问。|eu26
chicken-paprikash|budapest|匈牙利红椒炖鸡|Csirkepaprikás|Chicken paprikash|鸡肉配红椒与奶油风味酱汁，常搭面疙瘩或其他主食。|eu27
dobos-torte|budapest|多博什焦糖蛋糕|Dobostorta|Dobos torte|薄蛋糕与巧克力奶油多层叠起，上层脆焦糖是主要特色。|eu27
chimney-cake|budapest|匈牙利烟囱卷|Kürtőskalács|Kürtőskalács|面团绕筒烤制后滚糖和香料，来自地区共享传统，可按个分食。|eu27
raclette|zurich interlaken|瑞士融化奶酪配土豆|Raclette|Raclette|热奶酪刮在土豆上，搭腌菜，是适合慢慢分享的瑞士风味。|eu28
alplermagronen|zurich interlaken|瑞士山地奶酪通心粉|Älplermagronen|Älplermagronen|通心粉、土豆、奶酪与奶油同制，常配苹果泥与炸洋葱。|eu28
bircher-muesli|zurich interlaken|瑞士伯奇麦片|Birchermüesli|Muesli|浸泡麦片拌苹果、坚果与乳制品，适合酒店或咖啡馆早餐。|eu28
moussaka|athens santorini naxos|希腊慕萨卡|Μουσακάς · Mousakás|Moussaka|茄子、肉酱与白酱分层焗烤，是希腊地区共享正餐。|fix17
dolmades|athens santorini naxos|希腊葡萄叶饭卷|Ντολμάδες · Dolmádes|Dolma|葡萄叶包米饭与香草，部分版本含肉，可作共享小盘菜。|fix17
loukoumades|athens|希腊蜂蜜炸面球|Λουκουμάδες · Loukoumádes|Lokma|小面球炸后淋蜜或糖浆，适合两人分一小份作甜点。|fix17
naxos-patoudo|naxos|纳克索斯馅烤羊肉|Πάτουδο · Patoudo||羊肉配米饭、香草等内馅烤制，传统多见节庆，需提前问供应。|fix17
potica|bled|斯洛文尼亚坚果卷|Potica|Potica|面团卷入核桃等馅料后烘烤，可按片作湖边茶点。|eu30
zganci|bled|斯洛文尼亚荞麦面团|Ajdovi žganci|Žganci|荞麦等谷粉制成小团块，可配炖菜，是上卡尼奥拉地区传统主食。|eu30
jota|bled|斯洛文尼亚酸菜豆汤|Jota|Istrian stew|豆类、土豆与酸菜等组成浓汤，来自沿海地区的共享斯洛文尼亚风味。|eu30
pastizzi|gozo|马耳他酥皮馅角|Pastizzi|Pastizz|酥皮内包奶酪或豌豆泥，适合戈佐镇上烘焙店的早餐小食。|eu31
imqaret|gozo|马耳他椰枣炸饼|Imqaret|Imqaret|面皮夹椰枣香料馅后炸制，可按个搭茶品尝。|eu31
qubbajt|gozo|马耳他坚果牛轧糖|Qubbajt||坚果与糖蜜制成软硬不同的甜糖，节庆摊位较常见。|eu31
sheftalia|paphos|塞浦路斯网油肉卷|Σεφταλιά · Sheftaliá|Sheftalia|调味肉馅用网油包裹烤制，可搭皮塔饼与沙拉，主料先确认。|eu32
souvla|paphos|塞浦路斯大块烤肉|Σούβλα · Souvla|Souvla|较大块的肉慢烤至表面焦香，适合数人分享，按重量确认价格。|eu32
koupes|paphos|塞浦路斯麦粒肉馅炸饼|Κούπες · Koupes||碎麦外壳包肉与洋葱等馅料炸制，适合按个品尝。|eu32
madeira-honey-cake|funchal|马德拉糖蜜蛋糕|Bolo de mel|Bolo de mel|甘蔗糖蜜与香料制成深色蛋糕，可配茶少量品尝。|eu33
passion-fruit-pudding|funchal|马德拉百香果布丁|Pudim de maracujá||百香果的酸香搭奶油甜味，适合海岛正餐后的冷甜点。|eu33
malassadas|funchal|马德拉炸面饼|Malassadas|Malasada|蓬松炸面点在狂欢节前后更常见，糖浆等配料按店家做法不同。|eu33
bolo-levedo|ponta-delgada|亚速尔甜面包饼|Bolo lêvedo|Bolo lêvedo|柔软微甜的面包饼与富尔纳斯饮食有关，可抹黄油或做三明治。|eu34
grilled-limpets|ponta-delgada|亚速尔蒜香烤帽贝|Lapas grelhadas||帽贝带壳加蒜与黄油等烤制，按季节供应，注意确认整份价格。|eu34
queijadas-vila|ponta-delgada|维拉弗兰卡小挞|Queijadas da Vila||源自圣米格尔岛维拉弗兰卡的传统甜挞，可在岛上糕饼店寻找并按个品尝。|eu34
`.trim().split('\n').map(line => line.split('|')));

supplementalDefinitions.push(...`
new-york-pizza|new-york|纽约薄底披萨|New York–style pizza|New York–style pizza|大张薄底披萨可按角购买，适合城市步行途中解决一顿便餐。|world0
new-york-cheesecake|new-york|纽约芝士蛋糕|New York cheesecake||奶油奶酪风味厚实的蛋糕，适合买一片与同行者分享。|world0
new-york-hot-dog|new-york|纽约热狗|New York hot dog||热狗配芥末、酸菜或洋葱等，可按摊位菜单选择配料。|world0
french-dip|los-angeles|洛杉矶法式蘸汁三明治|French dip sandwich|French dip|烤肉夹长面包蘸肉汁，洛杉矶两家老店都与其历史相关。|world1
chili-burger|los-angeles|洛杉矶辣肉酱汉堡|Chili burger|Chili burger|汉堡上加辣肉酱，份量较足，可先选单个再考虑配餐。|world1
lamington|sydney melbourne|澳洲椰丝蛋糕|Lamington|Lamington|小蛋糕裹巧克力与椰丝，可带夹馅，是澳洲咖啡馆常见茶点。|world2
australian-meat-pie|sydney melbourne|澳洲肉派|Australian meat pie|Meat pie (Australia and New Zealand)|小酥皮派包肉与肉汁，适合外带午餐，内馅口味按店家选择。|world2
sydney-rock-oysters|sydney|悉尼岩蚝|Sydney rock oysters||澳洲东海岸蚝可按只或盘点选，生熟做法和产区须向店家确认。|world2
dim-sim|melbourne|墨尔本大烧卖|Dim sim|Dim sim|个头较大的肉菜馅点心可蒸可炸，与粤式小烧卖风格不同。|world3
pavlova|auckland queenstown|新西兰水果蛋白霜蛋糕|Pavlova|Pavlova (dessert)|蛋白霜底配奶油与水果，是澳新共享甜点传统的一部分。|world4
hokey-pokey|auckland queenstown|新西兰蜂窝糖冰淇淋|Hokey pokey ice cream|Hokey pokey (ice cream)|香草冰淇淋拌脆蜂窝糖块，可按球点选，适合作为散步休息。|world4
green-lipped-mussels|auckland queenstown|新西兰青口贝料理|Green-lipped mussels||新西兰绿唇贻贝可蒸煮或入锅，养殖产区与当日供应请看菜单。|world4
machboos|dubai|阿联酋香料肉饭|مجبوس · Machboos|Kabsa|香料米饭配肉类，阿联酋版本可选羊肉等，通常适合分享。|world5
thareed|dubai|阿联酋面饼炖菜|ثريد · Thareed|Tharid|炖肉与蔬菜连汤浸入薄面饼，适合坐下慢吃的一餐。|world5
luqaimat|dubai|阿联酋糖浆炸面球|لقيمات · Luqaimat|Lokma|炸面球外脆内软，淋椰枣糖浆等，适合买一小份尝味。|world5
boerewors|cape-town johannesburg|南非农夫香肠|Boerewors|Boerewors|盘绕香肠常用于户外烤肉，肉类组合与香料按产品说明确认。|world6
malva-pudding|cape-town johannesburg|南非玛尔瓦布丁|Malva pudding|Malva pudding|带甜酱的温热海绵甜点，可搭奶油或冰淇淋，份量适合分享。|world6
melktert|cape-town johannesburg|南非牛奶挞|Melktert|Melktert|奶香馅常撒肉桂粉，适合作咖啡馆小点，按片选择即可。|world6
harira|marrakech fes|摩洛哥哈里拉汤|حريرة · Harira|Harira|番茄、豆类与香料煮成浓汤，部分版本含肉，斋月也常见。|world7
rfissa|marrakech fes|摩洛哥鸡肉薄饼炖盘|رفيسة · Rfissa|Rfissa|鸡肉、扁豆与香料汤汁浸入薄饼，常适合多人分食。|world7
taameya|cairo luxor|埃及蚕豆炸丸|طعمية · Ta'ameya||蚕豆与香草制成炸丸，可夹面饼，与以鹰嘴豆为主的版本不同。|world8
molokhiya|cairo luxor|埃及锦葵叶汤|ملوخية · Molokhiya|Mulukhiyah|切碎叶菜煮成滑稠汤汁，蒜与香菜调味，可配米饭。|world8
umm-ali|luxor|埃及乌姆阿里奶香甜点|أم علي · Umm Ali|Om Ali|酥皮或面包浸奶后烘烤，常加葡萄干与坚果，适合热吃。|world8
sukuma-wiki|nairobi|肯尼亚炒羽衣甘蓝|Sukuma wiki|Sukuma wiki|叶菜切丝炒制，常与乌伽黎或烤肉搭配，是日常配菜。|world9
githeri|nairobi|肯尼亚玉米豆炖菜|Githeri|Githeri|玉米与豆类煮成饱足家常菜，不同摊档可能另加蔬菜或肉。|world9
mandazi|nairobi zanzibar|东非椰香炸面点|Mandazi|Mandazi|小块炸面点可配茶作早餐，部分沿海版本带椰香。|world9
zanzibar-pizza|zanzibar|桑给巴尔包馅煎饼|Zanzibar pizza||薄面皮包肉菜或甜馅后在铁板上煎，与意式披萨不同。|world10
urojo|zanzibar|桑给巴尔酸辣混合汤|Urojo|Urojo|浓汤里配炸点、土豆等食材，喜欢混搭口感的人可先尝小份。|world10
ladob|mahe|塞舌尔椰奶甜煮蕉薯|Ladob|Ladob|香蕉或块根与椰奶慢煮成甜点，也有咸味版本，点前确认。|world11
roast-breadfruit|mahe|塞舌尔烤面包果|Friyapen griye||面包果烤出柔软淀粉质果肉，可作为克里奥尔餐食的配食。|world11
kat-kat-banann|mahe|塞舌尔青香蕉炖鱼|Kat kat bannann||青香蕉与鱼肉等炖成当地家常菜，具体汤汁与配料依厨师调整。|world11
gateaux-piments|mauritius|毛里求斯辣豆丸|Gâteaux piments||豆类与香草做成小炸丸，可夹面包或当点心，辣度先询问。|world12
mauritian-boulettes|mauritius|毛里求斯汤丸|Boulettes mauriciennes||鱼肉、肉或蔬菜等做成丸子，常配清汤，逐种点选更好控制食量。|world12
alouda|mauritius|毛里求斯奶香甜饮|Alouda||奶饮配罗勒籽和琼脂等，适合市集休息时喝，甜度按店家做法。|world12
japadog|vancouver|温哥华日式热狗|Japadog||热狗搭海苔、照烧酱等日式配料，体现温哥华的移民饮食文化。|world13
nanaimo-bar|vancouver|纳奈莫巧克力方糕|Nanaimo bar|Nanaimo bar|饼底、奶油馅与巧克力分层，源自卑诗省，可在温哥华甜品店寻找。|world13
salmon-candy|vancouver|卑诗甜熏三文鱼|Candied salmon||三文鱼经烟熏与甜味调制，可在格兰维尔岛食品摊按份询问。|world13
peameal-bacon|toronto|多伦多玉米粉培根三明治|Peameal bacon sandwich|Peameal bacon|裹玉米粉的腌猪里脊夹面包，可在圣劳伦斯市场一带寻找。|world14
jamaican-patty|toronto|多伦多牙买加馅饼|Jamaican patty|Jamaican patty|香料酥皮包肉或蔬菜馅，是多伦多加勒比社群饮食的一部分。|world14
butter-tart|toronto|加拿大黄油挞|Butter tart|Butter tart|小挞内是浓甜黄油馅，是否含葡萄干或坚果以标签为准。|world14
quebec-pea-soup|quebec-city|魁北克黄豌豆汤|Soupe aux pois||黄豌豆配腌猪肉和蔬菜慢煮，是魁北克糖屋餐食的传统组成。|world15
sugar-pie|quebec-city|魁北克糖派|Tarte au sucre|Sugar pie|酥皮里装浓甜糖奶馅，有些版本用枫糖浆，适合分享一片。|world15
feves-au-lard|quebec-city|魁北克烤豆|Fèves au lard|Fèves au lard|豆类与猪肉慢烤，有些配方加枫糖浆，常作传统早餐配菜。|world15
tamales|mexico-city|墨西哥蒸玉米面包|Tamales|Tamale|玉米面团裹叶蒸熟，内馅可甜可咸，按个尝不同版本。|fix19
pozole|mexico-city|墨西哥玉米肉汤|Pozole|Pozole|大粒玉米与肉煮汤，再加萝卜、生菜等配料，红白绿版本各不同。|fix19
chilaquiles|mexico-city|墨西哥酱煮玉米脆片|Chilaquiles|Chilaquiles|玉米片浸红或绿酱，可加蛋和肉，是墨西哥城常见早餐。|fix19
sopa-lima|cancun|尤卡坦酸柑鸡汤|Sopa de lima|Sopa de lima|清鸡汤配当地酸柑与脆玉米条，属于坎昆可寻找的半岛共享风味。|world17
panuchos|cancun|尤卡坦豆馅炸玉米饼|Panuchos|Panucho|炸玉米饼夹黑豆，表面加肉与腌洋葱，可按个少量点选。|world17
salbutes|cancun|尤卡坦蓬松玉米饼|Salbutes|Salbute|膨起的小炸饼上铺肉、蔬菜与腌洋葱，与夹豆的帕努乔做法不同。|world17
causa|lima|秘鲁黄薯冷盘|Causa limeña|Causa limeña|调味黄土豆泥夹鸡肉或金枪鱼等馅料，是利马常见前菜。|world18
aji-gallina|lima|秘鲁黄椒奶香鸡丝|Ají de gallina|Ají de gallina|鸡丝拌黄椒奶香酱，可配土豆和米饭，坚果等配料先确认。|peru
anticuchos|lima cusco|秘鲁烤牛心串|Anticuchos|Anticucho|牛心等肉块腌后串烤，搭土豆或玉米，主料按摊档菜单确认。|peru
cusco-adobo|cusco|库斯科炖猪肉|Adobo cusqueño||猪肉与香料、发酵玉米饮等炖制，适合在库斯科家常餐馆询问。|peru
chicharron-cusco|cusco|库斯科炸猪肉拼盘|Chicharrón cusqueño||酥香猪肉配大粒玉米、土豆等，在库斯科周边市场可寻找地方版本。|peru
coxinha|rio-de-janeiro|巴西炸鸡肉滴形包|Coxinha|Coxinha|面皮包鸡肉馅后炸成水滴形，里约酒馆也有不同肉馅版本。|fix20
bolinho-arroz|rio-de-janeiro|里约炸米饭球|Bolinho de arroz||剩米饭制成小炸球，有些加香肠和奶酪，适合酒馆小食分享。|fix20
bolovo-bacalhau|rio-de-janeiro|里约鳕鱼裹蛋炸丸|Bolovo de bacalhau||鳕鱼馅裹住鸡蛋后炸制，可在特色酒馆询问，点前看清大小。|fix20
milanesa|buenos-aires|阿根廷炸肉排|Milanesa|Milanesa|薄肉排裹面包糠炸制，可配薯条或沙拉，肉类与加料另选。|world20
alfajor|buenos-aires|阿根廷焦糖夹心饼|Alfajor|Alfajor|两片饼干夹牛奶焦糖等馅，外层可裹巧克力，适合作小份茶点。|world20
fugazzeta|buenos-aires|布宜诺斯艾利斯洋葱芝士披萨|Fugazzeta|Fugazza|阿根廷风格披萨以洋葱和奶酪为特色，厚薄与夹层按店家版本选择。|world20
cazuela|santiago|智利肉蔬菜清炖锅|Cazuela|Cazuela|肉、土豆与南瓜煮成热汤主菜，适合圣地亚哥家常餐馆午餐。|world21
completo|santiago|智利配料热狗|Completo|Completo|热狗加牛油果、番茄和蛋黄酱等，配料很多，可先选小份。|world21
humita|santiago|智利玉米叶蒸包|Humita|Humita|磨碎玉米加香料后包叶蒸煮，常有咸甜不同吃法，按季节供应。|world21
`.trim().split('\n').map(line => line.split('|')));

supplementalDefinitions.push(['mrouzia', 'fes', '摩洛哥蜂蜜香料炖羊肉', 'مروزية · Mrouzia', 'Mrouzia', '羊肉与蜂蜜、香料及干果等慢炖，甜咸味明显，适合多人分享。', 'world7']);
// More specific references take precedence over the initial regional reading.
Object.assign(supplementalSources, {
  baliFood: 'https://www.indonesia.travel/id/id/travel-ideas/gastronomy/10-iconic-cuisine-s-that-you-must-try-on-your-next-visit-to-bali',
  lombokAres: 'https://www.indonesia.travel/fr/en/travel-ideas/gastronomy/ares',
  jaipurFood: 'https://www.incredibleindia.gov.in/en/rajasthan/jaipur',
  copenhagenMeals: 'https://www.visitcopenhagen.com/copenhagen/planning/cafe-sorgenfri-restaurant-gdk412426',
  lithuaniaFood: 'https://lithuania.travel/en/what-to-do/themed-experiences/the-tastiest-cities-of-lithuania',
  rigaFood: 'https://www.latvia.travel/sites/default/files/download/2016/pdfs/LiveRiga_gardeziem_LV.pdf',
  greekMeals: 'https://www.visitgreece.gr/en/blog/travel-tips/paradise-ermionida-in-greece',
  cuscoFood: 'https://www.peru.travel/es/inspirate/para-chuparse-los-dedos-los-mejores-potajes-de-la-gastronomia-cusquena',
  cqStreet: 'https://www.ichongqing.info/culture/chongqing-local-food/chongqing-street-cuisine/',
  icelandMeals: 'https://visitreykjavik.is/best-things-to-do-in-reykjavik-at-own-pace',
  icelandHotDog: 'https://www.visiticeland.com/service-provider/5ec7d096a90548233654E153',
  nyCheesecake: 'https://www.business.nyctourism.com/press-media/press-releases/nyc-company-unveils-new-york-citys-2020-holiday-programming',
  finnishMeals: 'https://www.visitfinland.com/en/articles/finlands-traditional-and-iconic-foods/',
  cebuFood: 'https://philippines.travel/destinations/cebu-city/index',
  thaiNorth: 'https://www.tourismthailand.org/Articles/https-www-tourismthailand-org-articles-wheretofindthebestrestaurantsinchiangrai',
});
const supplementalSourceKeys = {
  'sate-lilit': 'baliFood', 'babi-guling': 'baliFood', lawar: 'baliFood',
  ares: 'lombokAres', 'dal-baati-churma': 'jaipurFood', ghevar: 'jaipurFood', 'mirchi-bada': 'jaipurFood',
  frikadeller: 'copenhagenMeals', kibinai: 'lithuaniaFood', kugelis: 'lithuaniaFood',
  'rupjmaizes-kartojums': 'rigaFood', piragi: 'rigaFood', moussaka: 'greekMeals', dolmades: 'greekMeals',
  'cusco-adobo': 'cuscoFood', 'chicharron-cusco': 'cuscoFood', maoxuewang: 'cqStreet',
  plokkfiskur: 'icelandMeals', 'icelandic-hot-dog': 'icelandHotDog',
  'new-york-cheesecake': 'nyCheesecake', karjalanpaisti: 'finnishMeals',
  puso: 'cebuFood', ngohiong: 'cebuFood', sutukil: 'cebuFood', 'sai-ua': 'thaiNorth', 'nam-prik-ong': 'thaiNorth',
};
for (const row of supplementalDefinitions) if (supplementalSourceKeys[row[0]]) row[6] = supplementalSourceKeys[row[0]];

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
// Specific dish names and regional associations are editor-maintained. These
// source pages were used as food/culture references; no live menu or exact shop
// availability has been checked. In particular, do not promote a broad country
// reference into a per-record verification stamp.
for (const [slug, ids, name, localName, article, description, sourceKey] of supplementalDefinitions) {
  const cityIds = ids.split(' ').filter(id => cityById.has(id));
  if (!cityIds.length) continue;
  const sourceUrl = supplementalSources[sourceKey] || sources[sourceKey];
  if (!sourceUrl) throw new Error(`Missing food reference for ${slug}: ${sourceKey}`);
  generated.push({ id: `food-${slug}`, cityIds, name, localName, description,
    article: article || null, articleScope: article ? 'dish' : 'food-photo-pending',
    imageQuery: `${name} ${localName} ${cityById.get(cityIds[0]).nameEn || ''} prepared plated food`,
    photoStatus: article ? 'pending-download' : 'needs-food-photo', sourceUrl, sourceStatus: 'maintained-guide', sourceCheckedAt: null,
    sourceScope: 'regional-food-reference',
    sourceNote: '地方或地区饮食资料作为研究线索；中文介绍与城市关联经过编辑整理，未逐店核对当前菜单，也不表示起源独属于所列城市。',
    whereByCity: Object.fromEntries(cityIds.map(id => [id, areaFor(cityById.get(id), guideById.get(id), name, localName)])),
    servingNote: '餐饮选择参考，不单独计入行程预算；份量、配料与菜单价格请向店家确认。区域链接仅用于寻找，不能保证某家当日供应。',
    catalogOrigin: 'maintained-definition' });
}
const existing = new Map(mergeFoodExpansions(read('data/local-foods.json'), new Set(cityById.keys()), { root }).map(food => [food.id, food]));
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
// Reviewed Commons file pages, 2026-09-23. A food-family article can have a
// lead photograph of another regional recipe, an ingredient, or even diners.
// Pin the prepared dish instead. These are dish references, not a claim that
// the pictured restaurant currently supplies it. Preserve later manual edits.
const reviewedFoodPhotos = [
  ["nanjing-sweet-taro","Tangyumiao.JPG","Commons 描述明确为南京糖芋苗；AddisWang 于 2012-02-12 拍摄的成品，未标具体门店。","CC BY-SA 3.0"],
  ["suzhou-eel","Stir-fried shredded eel with hot oil and ginger at Songhelou Suzhou Noodles, Parkview Green (20210126165145).jpg","N509FZ 拍摄的苏式响油鳝糊成品，菜单英文为 stir-fried shredded eel with hot oil and ginger。实际拍摄地为北京侨福芳草地松鹤楼苏式面馆分店，并非苏州门店；仅用于说明同一种菜，不引入照片中的历史菜单价格。","CC BY-SA 4.0"],
  ["kyoto-yuba","Yuba-meal.jpg","Geoffrey A. Landis 的文件描述明确为京都供应的汤叶餐，属于成品料理而非干腐竹原料。原图仅 420 × 357 像素；文件同时提供 GFDL，可采用 CC BY 3.0 授权。","CC BY 3.0"],
  ["bebalung","Bebalung Lombok.jpg","文件名和印尼语说明明确为龙目岛 Bebalung 成品；Saharanisofina13 于 2025-11-15 拍摄，属于在马塔兰举办的 WikiMaknyus Mataram 饮食摄影活动。未确认具体餐馆，不作为门店菜单实拍承诺。","CC BY-SA 4.0"],
  ["tuaran-mee","Tuaran Sabah TuaranMee-1.jpg","描述明确为沙巴斗亚兰 Tuaran Mee Restoran 的斗亚兰炒面成品。实际拍摄地为斗亚兰，用作亚庇饮食指南中的区域菜品示例，不声称是在亚庇某店拍摄。按页面要求署名 Photo by CEphoto, Uwe Aranas；文件另有 GFDL，可采用 CC BY-SA 3.0。","CC BY-SA 3.0"],
  ["banh-trang-thit-heo","Bánh tráng cuốn thịt heo.jpg","Lê Huỳnh Bộ 于 2025-05-24 拍摄；描述明确列出越式米纸卷猪肉、生菜、水煮猪肉及 mắm nêm 蘸酱，菜品与条目一致。文件未标拍摄城市，仅作菜品示例，不声明岘港指定门店。","CC BY-SA 4.0"],
  ["lao-khao-soi","Lao-style khao soi.jpg","Mindmaker / Chriswan Sungkono 于 2016-05-12 拍摄；文件描述明确为琅勃拉邦街头摊贩供应的老挝式 khao soi，附蔬菜和调料。这是老挝版本，未混用清迈椰奶咖喱面。","CC BY-SA 4.0"],
  ["taiwan-milkfish-congee","Milkfish Congee 虱目魚粥.jpg","姜明雄于 2021-08-07 拍摄的虱目鱼粥成品，Commons 于 2022-10-26 复核 Flickr 的 CC0 授权。文件未明确拍摄城市，不将其声明为高雄具体门店实拍。","CC0 1.0"],
  ["irish-seafood-chowder","Seafood chowder with pieces of fish.JPG","Benreis 于 2015-07-29 拍摄；描述为奶油、鱼块和海鲜浓汤，配面包及黄油，Commons 归入爱尔兰鱼类菜肴分类。未标具体城镇，仅作爱尔兰海鲜浓汤示例，不承诺都柏林某家餐馆。","CC BY 3.0"],
  ["grilled-sardines","Sardinhas assadas.jpg","DuarteBriz 于 2017-06-21 拍摄；葡语描述明确为一盘葡萄牙式烤沙丁鱼成品。未标具体拍摄城市，不声称是里斯本某店或特定烤炉工艺实拍。","CC BY-SA 4.0"],
  ["broodje-haring","Broodje haring met ui en augurk.jpg","Vinvlugt 于 2019-06-13 拍摄；描述明确为面包夹鲱鱼、洋葱碎和腌黄瓜，吻合荷兰鲱鱼面包。拍摄城市未注明，不表示阿姆斯特丹指定商家菜单。","CC BY-SA 4.0"],
  ["berliner-leber","Leber Berliner Art, Zillestube.jpg","Gerda Arendt 于 2021-11-25 在柏林 Zillestube 拍摄的柏林式煎肝，配土豆泥、煎苹果圈及洋葱；菜品和拍摄城市均对应。历史菜品照片不代表现时营业或菜单供应情况。","CC BY-SA 4.0"],
  ["krempita","Kotorska krempita.jpg","Milica Buha 于 2021-09-15 拍摄；描述明确为科托尔版本的三层酥皮、两层奶油 krempita 成品，没有混用布莱德奶油蛋糕。文件未指定具体门店。","CC BY-SA 4.0"],
  ["icelandic-hot-dog","Icelandic hot dog.jpg","Owlsmcgee 于 2014-05-19 拍摄的冰岛热狗成品，描述列出炸洋葱、生洋葱及深色芥末。文件未确认具体城市，可用于冰岛各城市的同国菜品介绍，不视为各城市商家的实拍。","CC BY-SA 4.0"],
  ["norwegian-fish-soup","Fish soup in Bergen.jpg","Flickr 用户 Tu / tuey 于 2006-09-30 拍摄；描述明确为卑尔根 Bryggen 的 Bryggeloftet & Stuene 餐馆供应的 Bergensk fiskesuppe med suppeboller。用于奥斯陆及特罗姆瑟时须保留卑尔根菜品示例说明，不声明为当地餐馆实拍。","CC BY 2.0"],
  ["danish-hot-dog","Copenhagen red sausage 1.jpg","明确为丹麦哥本哈根的 Rød pølse 成品，2014年；不推定当前摊位或价格。","CC BY-SA 3.0"],
  ["pickled-herring","Sillar.jpg","文件说明列明瑞典 inlagd sill 多种成品腌鲱鱼；非生鱼照片，未确认拍摄于斯德哥尔摩。","CC BY-SA 3.0"],
  ["korvapuusti","Homemade Finnish korvapuusti.jpg","说明明确芬兰 Korvapuusti 肉桂卷，面团含豆蔻，家庭制作成品；不是某家赫尔辛基店的现售商品。","CC BY-SA 4.0"],
  ["sernik","2023 Sernik polski (1).jpg","明确标为 Polish cheesecake/Sernik polski 的成品照片、Commons质量图片；未指定华沙或克拉科夫店铺。","CC BY-SA 4.0"],
  ["bramboraky","Bramboracky.jpg","捷克维基转入、说明 Bramboráčky na pánvi，煎锅里的捷克土豆饼；不是土豆原料或另一地区饼类。","CC BY-SA 3.0"],
  ["grilled-limpets","Lapas grelhadas, Rabo de Peixe Açores.jpg","2023年亚速尔圣米格尔岛 Rabo de Peixe 餐馆的烤帽贝；与蓬塔德尔加达同岛，但不能标成后者具体餐馆，已排除马德拉版本。","CC BY-SA 4.0"],
  ["queijadas-vila","Queijadas aus Vila Franca do Campo, Azoren 2016 03.JPG","准确为 Vila Franca do Campo 小挞，有咬开截面；非一般葡式奶挞，拍摄于亚速尔2016年。","CC BY-SA 4.0"],
  ["new-york-cheesecake","New York cheesecake 2.jpg","说明明确纽约式芝士蛋糕切片配蓝莓，不声称实际摄于纽约或某特定蛋糕店。","CC BY-SA 4.0"],
  ["new-york-hot-dog","Hot Dog! (4870153858).jpg","纽约2010年行程中的热狗成品，Commons归入 Coney Island Nathan's Famous 与纽约装盘食物；不是摊车外观。","CC BY 2.0"],
  ["green-lipped-mussels","Green-lipped mussels in coconut milk, with buttered bread - Picton, New Zealand.jpg","新西兰 Picton 的椰奶青口贝料理配黄油面包，2024年；可作新西兰青口贝成品例，不声称奥克兰或皇后镇餐馆。","CC0 1.0"],
  ["taameya","Tameya Karoleen Lindberg.jpg","文件明确 Tameya/Egyptian equivalent to Falafel，埃及版本成品；未用黎凡特鹰嘴豆版替代。","CC BY-SA 3.0"],
  ["japadog","Okonomi (Right) and Kurobuta Terimayo (Left) - Kurobata pork, teriyaki sauce, fried onions, Japanese mayo, seaweed (9865349653).jpg","明确温哥华 Japadog 实拍，两份成品含照烧酱/海苔等；2013年菜式记录，不是洛杉矶分店或摊车照片。","CC BY 2.0"],
  ["chicharron-cusco","Chicharron Cerdo Cusco.jpg","说明明确库斯科传统猪肉拼盘，配玉米、猪油煎土豆与洋葱薄荷沙拉；不是其他地区猪皮小食。","CC BY-SA 3.0"],
  ["bolinho-arroz","Bolinho de arroz 01.jpg","巴西咸味炸米饭球成品，2026年；未指定里约某酒馆，排除了 Cuiabá 甜味米糕版本。","CC BY-SA 4.0"],
  ["kama-dessert","Kamadessert i Palmse.JPG","明确爱沙尼亚Palmse的Kama甜品成品，归入Meals/Sweet food of Estonia；不是谷粉原料，拍摄地点并非塔林。","CC BY 3.0"],
  ["quebec-pea-soup","Quebecois Pea Soup.png","说明明确魁北克式黄豌豆汤，黄豌豆与蔬菜泥、猪肘丝、欧芹黑胡椒；对应菜式而非普通绿豌豆汤，未指称具体糖屋。","CC BY-SA 4.0"],
  ["qubbajt","Brittle Nougat Marsaxlokk Street Market.jpg","2018年马耳他Marsaxlokk周日市集的Qubbajt Iebes硬焦糖牛轧糖，含坚果或芝麻；对应马耳他做法，实际拍摄地点不是戈佐，不指称当地商家当前商品。","CC BY-SA 4.0"],
  ['black-risotto', 'Black Risotto.jpg', '克罗地亚墨鱼汁黑烩饭成品；用于亚得里亚海沿岸菜式参考。', 'CC BY-SA 4.0'],
  ['pottery-kebab', 'TestiKebabGoreme.jpg', '格雷梅 Testi kebab 陶罐炖肉成品，文件标题和类别明确菜式；不是空陶罐。', 'CC BY-SA 3.0'],
  ['grey-peas', 'Grey peas at restaurant Milda in Riga.jpg', '里加 Milda 餐厅灰豌豆配培根和蔬菜成品，2019年；不保证当前菜单供应。', 'CC BY-SA 4.0'],
  ['quinoa-soup', 'Sopa de Quinua.jpg', '玻利维亚藜麦汤成品，作为安第斯菜式参考；不是库斯科具体餐馆的实拍。', 'CC BY-SA 4.0'],
  ['chiri-uchu', 'Chiriuchu.jpg', 'Chiriuchu 成品拼盘，文件说明明确烤豚鼠、玉米饼和海藻等组成。', 'CC BY-SA 4.0'],
  ['scallion-oil-noodles', '葱花葱油拌面.jpg', '葱油拌面成品，文件说明明确 congyou banmian；不指定上海店家。', 'CC0'],
  ['pork-chop-rice-cakes', 'Paiguniangao.jpg', '排骨年糕成品，文件中英文说明一致；不指定当前店家或价格。', 'CC BY-SA 3.0'],
  ['zhong-dumplings', 'Dumplings in chili oil (20180218142633).jpg', '成都餐厅的红油钟水饺成品，文件说明明确 Zhong’s Dumplings。', 'CC BY-SA 4.0'],
  ['long-wontons', 'Didishenshan13.jpg', '成都龙抄手餐厅的抄手成品，2014年历史照片；不表示当前菜单供应。', 'CC BY-SA 4.0'],
  ['gourd-chicken', 'Huluji at CHANG AN G, Beijing Xibeiwang MIXC One (20240601111947).jpg', '陕西葫芦鸡成品，摄于北京长安大排档；展示菜式，不作为西安门店实拍。', 'CC BY-SA 4.0'],
  ['sweet-sour-carp', 'Tangcu Liyu 20230622.jpg', '文件说明明确济南菜糖醋鲤鱼的成品照片。', 'CC BY-SA 4.0'],
  ['baoluo-noodles', 'Mixed Baoluofen with beef at Qiansheng Hainanfen, Sanya (20230326125016).jpg', '三亚店家的牛肉干拌抱罗粉成品，2023年；历史图片不代表当前价格。', 'CC BY-SA 4.0'],
  ['zaopocu', 'Zaopocu seafood rice noodle soup at Qiansheng Hainanfen, Sanya (20230326124453).jpg', '三亚糟粕醋海鲜汤粉成品；展示同一海南酸汤风味的汤粉版本，不是多人锅套餐。', 'CC BY-SA 4.0'],
  ['minnan-meat-zongzi', '1980烧肉粽前埔店的菜品.jpg', '厦门1980烧肉粽前埔店的菜品，烧肉粽在左、肉燕汤在右；不保证当前菜单供应。', 'CC BY-SA 4.0'],
  ['xizhou-baba', 'Xizhou baba.jpg', '云南大理喜洲售卖的肉馅粑粑成品，文件说明明确地点和馅料。', 'CC0'],
  ['beer-fish', 'Pijiu Yu (Beer fish) (253141965).jpg', '阳朔啤酒鱼成品，Commons 类别明确阳朔与桂林饮食。', 'CC BY-SA 2.0'],
  ['curry-fish-balls', 'Curry Fish Balls.jpg', '咖喱鱼蛋成品；替换火锅鱼丸和蟹棒原料拼盘。', 'CC BY-SA 4.0'],
  ['halloumi', 'Grilled Halloumi.jpg', '烤哈罗米奶酪成品；替换未烤的鲜奶酪切片。', 'CC BY 3.0'],
  ['tourtiere', 'Warm Tourtiere.jpg', '加拿大肉派成品，摄于温哥华 Granville Island Public Market；用于菜品参考，不作为魁北克店铺实拍。', 'CC BY-SA 2.0'],
  ['beef-noodle-soup', 'Taiwanese Beef Noodle Soup.jpg', '台湾牛肉面成品；替换兰州拉面首图。', 'CC BY-SA 4.0'],
  ['swedish-meatballs', 'Swedish meatballs.jpg', '瑞典肉丸成品，摄于美国瑞典餐厅；用于菜品参考，不作为斯德哥尔摩店铺实拍。', 'CC BY-SA 2.0'],
  ['fava', 'Φάβα Σαντορίνης (4463510858).jpg', '圣托里尼餐厅的 Fava 豆泥成品；替换植物照片。', 'CC BY 2.0'],
  ['ersi', '饵丝-大理祥云.jpg', '云南大理祥云的饵丝成品；不是烧饵块。', 'CC BY-SA 4.0'],
  ['kofta', 'Koftet-el-hati.jpg', '埃及烤 Koftet el hati 成品；不是伊朗大肉丸。', 'CC BY-SA 4.0'],
  ['pilau', 'Pilau la nyanya.jpg', '坦桑尼亚香料饭成品；用于斯瓦希里菜品参考，不作为桑给巴尔店铺实拍。', 'CC BY-SA 4.0'],
  ['feijoada', 'FeijoadaBrasileira.jpg', '巴西豆肉炖锅成品；替换葡萄牙版本。', 'CC BY-SA 4.0'],
  ['graviera', 'Naxos Graviéra.jpg', '纳克索斯岛 Graviera 奶酪；替换克里特岛原产地版本。', 'CC BY-SA 4.0'],
  ['guotie', 'Guotie 锅贴 potstickers from 乐陵（laoling）.jpg', '山东乐陵锅贴成品；用于菜品参考，不作为青岛店铺实拍。', 'CC0'],
  ['sticky-rice', 'Lao sticky rice.jpg', '老挝糯米饭成品；替换未烹饪糯米照片。', 'CC BY-SA 2.0'],
  ['saltibarsciai', 'Šaltibarščiai.JPG', '立陶宛冷甜菜汤成品；不是普通热红菜汤。', 'CC BY-SA 3.0'],
  ['braised-pork-rice', 'Fragpork Rice from Formosa Chang Taipei Neihu Store.jpg', '台北内湖店的一碗卤肉饭；替换宴请人物合照。', 'CC BY-SA 3.0'],
  ['lechon', 'Lechon Cebu 2.jpg', '菲律宾宿务烤乳猪成品；不是西班牙肉市生乳猪。', 'CC BY-SA 4.0'],
  ['cozido', 'Cozido (Furnas) 1.JPG', '亚速尔圣米格尔岛 Furnas 地热炖锅；不是葡萄牙本土鹰嘴豆炖菜。', 'CC BY-SA 4.0'],
  ['qingbuliang', '清補涼 Qingbuliang.jpg', '海南三亚清补凉成品；替换越南 Sâm bổ lượng。', 'CC BY-SA 4.0'],
  ['roti', 'Roti kluai khai chiang mai 04.jpg', '泰式香蕉鸡蛋 Roti 成品，摄于清迈；用于菜品参考，不作为泰南店铺实拍。', 'CC BY-SA 3.0'],
  ['yudofu', 'Yudofu (13238048184).jpg', '京都汤豆腐成品；替换冷的绢豆腐照片。', 'CC BY 2.0'],
  ['misua', 'Mī-suànn-kôo in Quanzhou (20200929220207).jpg', '泉州面线糊成品；不是台湾红面线。', 'CC BY-SA 4.0'],
  ['mint-tea', 'Moroccan Mint Tea - 1.jpg', '摩洛哥薄荷茶成品；不是加松子的突尼斯茶。', 'CC BY-SA 4.0'],
  ['knedliky', 'Knedlik.jpg', '捷克面团配食成品；替换德国圆团子雪人制作照片。', 'Public domain'],
  ['prosciutto', 'Dalmatinski pršut.jpg', '达尔马提亚火腿与奶酪拼盘；替换意大利帕尔马火腿生产场景。', 'CC BY-SA 2.0'],
  ['peameal-bacon', 'Peameal bacon sandwich.jpg', '多伦多 Carousel Bakery 的培根三明治成品；不是单独培根原料。', 'CC BY-SA 4.0'],
  ['cazuela', 'Chilean cazuela.jpg', '智利式鸡肉蔬菜炖锅成品；拍摄地不在智利，用于菜品参考。', 'CC BY-SA 4.0'],
  ['dolmades', 'Dolmades Kurdish and Greek - Dec 2018.jpg', '库尔德与希腊社群制作的葡萄叶饭卷成品；摄于爱尔兰，用于菜品参考。', 'CC BY-SA 4.0'],
  ['southern-sour-curry', 'Kaeng som pla sapparot.jpg', '泰南风格酸鱼咖喱配未熟菠萝，摄于清迈；用于菜品参考。', 'CC BY-SA 3.0'],
];
for (const [slug, file, note, license] of reviewedFoodPhotos) {
  const food = existing.get(`food-${slug}`);
  if (!food || food.photoFile && food.photoFile !== file) continue;
  Object.assign(food, { photoFile: file, photoStatus: 'exact-food-photo', photoScope: 'dish-reference',
    photoNote: note, photoSourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(' ', '_'))}`,
    photoLicense: license, photoCheckedAt: '2026-09-23' });
}
const pendingFoodPhotos = {
  'food-octopus-salad': ['Octopus as food', 'Seychelles octopus salad salad zourit prepared dish', '原图是东京市场的生章鱼，无法代表塞舌尔章鱼沙拉；准确成品照片待补。'],
  'food-fish-dumplings': ['Jiaozi', 'Qingdao mackerel seafood fish dumplings 鲅鱼水饺 成品', '原图仅注明台湾水饺，无法确认海鲜馅料；青岛海鲜水饺的准确成品照片待补。'],
};
for (const [id, [oldArticle, query, note]] of Object.entries(pendingFoodPhotos)) {
  const food = existing.get(id);
  if (!food || food.photoFile || food.article && food.article !== oldArticle) continue;
  Object.assign(food, { article: null, articleScope: 'food-photo-pending', photoStatus: 'needs-food-photo', imageQuery: query, photoNote: note });
}
const rollingDonkey = existing.get('food-rolling-donkey');
if (rollingDonkey?.article === 'Rolling donkey') rollingDonkey.article = 'Lüdagun';
for (const id of ['food-cazuela', 'food-dolmades', 'food-southern-sour-curry']) {
  const food = existing.get(id);
  if (food) food.articleScope = 'food-family';
}
const peameal = existing.get('food-peameal-bacon');
if (peameal?.article === 'Peameal bacon') peameal.articleScope = 'ingredient-background';
// Migrate the initial blanket "needs-food-photo" flag on supplemental dishes.
// That flag means the identity/lead photo is unsafe, not merely undownloaded.
// Keep curated file pins and explicit rejection notes intact when regenerating.
const supplementalFoodIds = new Set(supplementalDefinitions.map(([slug]) => `food-${slug}`));
for (const food of existing.values()) {
  if (supplementalFoodIds.has(food.id) && food.article && ['dish', 'food-family'].includes(food.articleScope)
      && !food.photoFile && !food.photoNote && food.photoStatus === 'needs-food-photo') {
    food.photoStatus = 'pending-download';
  }
}
const longjing = existing.get('food-longjing-tea');
if (longjing) {
  longjing.photoAlt = '龙井干茶叶近景，非已冲泡的茶汤';
  longjing.photoNote = '配图展示龙井干茶叶，作为茶叶品种参考；不是冲泡后的茶汤。';
  if (!longjing.description.includes('配图展示龙井干茶叶')) longjing.description += '配图展示龙井干茶叶。';
}
const zaopocu = existing.get('food-zaopocu');
if (zaopocu?.name === '糟粕醋海鲜锅') {
  zaopocu.name = '海南糟粕醋';
  zaopocu.description = '发酵酸汤搭海鲜和蔬菜，可做共享锅物或汤粉；主料、份量和形式以店家菜单为准。';
}
const output = [...existing.values()];
const target = path.join(root, 'data/local-foods.json');
const temporary = `${target}.${process.pid}.tmp`;
fs.writeFileSync(temporary, JSON.stringify(output, null, 2) + '\n', 'utf8');
fs.renameSync(temporary, target);
console.log(`Food catalog: ${output.length} foods, ${new Set(output.flatMap(food => food.cityIds)).size} cities. Existing edits preserved.`);
const coverage = [...cityById.values()].map(city => ({ id: city.id, count: output.filter(food => food.cityIds.includes(city.id)).length }));
console.log(`Per-city minimum: ${Math.min(...coverage.map(city => city.count))}; below five: ${coverage.filter(city => city.count < 5).map(city => `${city.id} (${city.count})`).join(', ') || 'none'}.`);
