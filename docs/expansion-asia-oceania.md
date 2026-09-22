# 亚洲与大洋洲目的地扩展

核验日期：2026-09-22。数据文件：`data/expansion/asia-oceania.json`。

本批新增 20 个目的地、160 个具体景点，覆盖越南、老挝、柬埔寨、马来西亚、菲律宾、中国台湾、尼泊尔、印度、斯里兰卡和新西兰。每城含 8 个景点、2 类特色餐饮、2 个住宿/游览片区、3 档日常预算与月租、水电估算。

## 证据与价格边界

- 官方旅游局、地方旅游网站或场馆资料用于核实目的地、地标与游览性质。下列链接是查阅来源，并不意味着页面已经给出当前门票。
- **全部新增票价均为估算**：`price.type = estimate`、`checkedAt = null`。未把旧旅游资料中的历史票价标成实时或官方核验价格。各金额是编辑预留范围，不是最低价保证，也不是商家最高价。
- 公共区域 `0–0` 仅表示相应基础参访按零门票安排；付费展览、观景层、演出、游船、接送、停车、餐饮与购物另计。寺庙开放、拍照和着装规定以运营方为准。
- 日常住宿按每间每晚，餐饮、交通和杂项按每成人每天；月租与水电按每间每月。经济/舒适/高端为规划假设，旺季、税费、房型、入住人数和供给都会改变实际费用。
- VND、LAK、LKR 等高面额货币均记录整数本币，不是“千元”单位。琅勃拉邦使用 LAK；暹粒为方便旅游报价对比使用 USD，同时明确当地 KHR 流通。
- 经纬度用于粗略路线规划，不保证是售票口或上车点。景点时长一般为现场参访时间；郊外和跨海地点用 `accessNote` 单独说明进出交通，不能把它们当作市内短途。
- 图片记录对应的 Wikipedia 页面或经检索确认的 Commons File 页面作为采集线索，初版不伪造本地图片路径。会安、槟城城市图片及26条城市/景点来源已明确到准确页面，避免取到旗帜、同名地点或不存在条目。公开上线前由图片维护程序读取授权信息、保存实际图片；未成功取得图片时应显示缺图状态而非冒充准确景观。

## 联票与特殊交通

- 吴哥窟、巴戎寺、塔布茏寺、女王宫、圣剑寺、斑黛喀蒂寺使用 `angkor-pass`、`passDurationDays: 1`，每项均填写相同 USD 35–45 估算，实际来源入口为 [Angkor Enterprise](https://www.angkorenterprise.gov.kh/)。同日只应计一次；不同日预留日票，多日可核对 3 日、7 日票更优惠。当前价格未核验。
- 会安古城、新奇古屋、福建会馆使用 `hoi-an-heritage-pass` 同组日票估算 VND 100000–180000，按所购联票开放场馆和参观次数选点；来远桥仅按公共视角看外观，内部参观须核对联票。
- 古芝地道、美山圣地、卡瓦山瀑布、女王宫、巴德岗和格林诺奇等均注明远郊通行时间；卡瓦山瀑布不能与宿务市多处景点塞入普通一日行程。
- 占婆群岛、巴乌洞、旗津与奥克兰离岛设置 `routeMode: boat`。城市公共交通的通用估价不能代表实际船票；船班、末班回程和海况需单独确认。基林红树林的现场游览时长及估算价格已含园内船游，酒店至码头仍按公路抵达，避免重复船程。
- 台北士林夜市、琅勃拉邦夜市设置 `preferredStartTime: 17:00`，这是编辑建议游览时段，并非核验营业时间，避免将夜市自动排在早晨。
- 兰卡威、康提、皇后镇使用公路导向交通说明。康提的国际机场门户为 CMB；会安为 DAD；暹粒为 SAI，机场不是市中心。

## 各城市查阅来源

| 城市 | 币种 | 景点数 | 官方来源 | 核验内容及边界 |
| --- | --- | ---: | --- | --- |
| 河内 | VND | 8 | [河内目的地资料](https://vietnam.travel/node/187) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 胡志明市 | VND | 8 | [胡志明市目的地资料](https://vietnam.travel/node/137) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 会安 | VND | 8 | [会安目的地资料](https://www.vietnam.travel/things-to-do/7-things-to-do-hoi-an) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 岘港 | VND | 8 | [岘港目的地资料](https://vietnam.travel/things-to-do/must-visit-places-in-da-nang) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 琅勃拉邦 | LAK | 8 | [琅勃拉邦目的地资料](https://www.tourismlaos.org/northern-provinces/louangphabang-province/) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 暹粒 | USD | 8 | [暹粒目的地资料](https://www.tourismcambodia.org/provinces/47/siem-reap) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 吉隆坡 | MYR | 8 | [吉隆坡目的地资料](https://www.malaysia.travel/explore/top-places-to-visit-in-kuala-lumpur) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 槟城 | MYR | 8 | [槟城目的地资料](https://ebrochures.malaysia.travel/en/islands-and-beaches/penang/) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 兰卡威 | MYR | 8 | [兰卡威目的地资料](https://ebrochures.malaysia.travel/en/islands-and-beaches/langkawi-kedah/) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 马尼拉 | PHP | 8 | [马尼拉目的地资料](https://app.philippines.travel/destinations/manila) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 宿务 | PHP | 8 | [宿务目的地资料](https://philippines.travel/destinations/cebu-city/index) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 台北 | TWD | 8 | [台北目的地资料](https://travel.taipei/en/attraction) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 高雄 | TWD | 8 | [高雄目的地资料](https://khh.travel/en/attractions/) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 加德满都 | NPR | 8 | [加德满都目的地资料](https://ntb.gov.np/) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 德里 | INR | 8 | [德里目的地资料](https://www.incredibleindia.gov.in/en/delhi/delhi) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 斋浦尔 | INR | 8 | [斋浦尔目的地资料](https://www.tourism.rajasthan.gov.in/jaipur.html) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 科伦坡 | LKR | 8 | [科伦坡目的地资料](https://www.srilanka.travel/ArrivebyaCruise/colombo-port.php) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 康提 | LKR | 8 | [康提目的地资料](https://srilanka.travel/index.php?destination=2&route=attractions%2Fdestination) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 奥克兰 | NZD | 8 | [奥克兰目的地资料](https://www.aucklandnz.com/) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |
| 皇后镇 | NZD | 8 | [皇后镇目的地资料](https://www.queenstownnz.co.nz/things-to-do/) | 核对目的地和主要地标；当前单项票价、营业与预约仍待逐项复核。 |

## 补充官方证据

- [河内 11 处地标，越南旅游局](https://vietnam.travel/node/187)：还剑湖、文庙及历史文化景点。
- [胡志明市历史景点，越南旅游局](https://vietnam.travel/node/137)：战争遗迹博物馆、统一宫、邮局及古芝。页面历史价格不用于官方实价标签。
- [会安文化游览，越南旅游局](https://www.vietnam.travel/things-to-do/7-things-to-do-hoi-an)：会馆、老宅、来远桥、美山、茶桂村。
- [岘港地标，越南旅游局](https://vietnam.travel/things-to-do/must-visit-places-in-da-nang)：山茶半岛、五行山、巴拿山和海滨。
- [琅勃拉邦省，老挝旅游局](https://www.tourismlaos.org/northern-provinces/louangphabang-province/)；[香通寺，琅勃拉邦旅游局](https://tourismluangprabang.org/things-to-do/buddhism/wat-xiengthong/)；[王宫博物馆](https://nationalmuseum.tourismluangprabang.org/09-the-royal-palace-haw-kham/)：确认地点与历史参观性质。
- [吴哥周边，柬埔寨旅游部](https://tourismcambodia.org/public/provinces/search/detail/447/around-siem-reap)：吴哥寺院范围；[吴哥国家博物馆](https://tourismcambodia.org/public/provinces/search/detail/390/angkor-national-museum-1550810877)。
- [马来西亚旅游局目的地指南](https://ebrochures.malaysia.travel/destination-guide/)：吉隆坡、槟城、兰卡威地区资料；旧渡轮时刻不视作当前交通保证。
- [宿务省政府](https://www.cebu.gov.ph/about/)：麦哲伦十字架、圣佩德罗堡、道观等地标；[中维萨亚旅游资料](https://visitcentralvisayas.ph/destinations/magellans-cross/)提供十字架及周边步行节点。
- [台北官方景点目录](https://travel.taipei/en/attraction)；[高雄莲池潭](https://khh.travel/en/attractions/detail/491/)；[高雄港区旅游地图](https://khh.travel/files/attractions-around-Kaohsiung-port-en.pdf)：城市内景点名称与区域关联。
- [尼泊尔旅游局斯瓦扬布佛塔](https://ntb.gov.np/en/swayambhu-stupa)；[谷地朝圣地](https://trade.ntb.gov.np/tourist-destination/pilgrimage-sites-2/)：佛塔、帕斯帕提那、昌古纳拉扬与帕坦。
- [印度旅游局德里](https://www.incredibleindia.gov.in/en/delhi/delhi)；[红堡](https://www.incredibleindia.gov.in/en/delhi/delhi/red-fort)；[顾特卜塔](https://www.incredibleindia.gov.in/en/delhi/delhi/qutub-minar)；[胡马雍陵](https://www.incredibleindia.gov.in/en/delhi/delhi/humayuns-tomb-taj-mahal-of)。
- [拉贾斯坦旅游局斋浦尔](https://www.tourism.rajasthan.gov.in/jaipur.html)；[琥珀堡](https://www.tourism.rajasthan.gov.in/amber-palace.html)；[纳哈加尔堡](https://www.tourism.rajasthan.gov.in/nahargarh-fort.html)。
- [斯里兰卡旅游局博物馆](https://www.srilanka.travel/national-museum)：科伦坡国家博物馆、锡兰茶博物馆；[植物园](https://www.srilanka.travel/botanical-gardens)：佩拉德尼亚；[佛教地标](https://www.srilanka.travel/buddhist-places/attractions.php)：佛牙寺及加达拉德尼亚。
- [奥克兰博物馆，奥克兰旅游局](https://www.aucklandnz.com/explore/auckland-museum)；[奥克兰美术馆](https://www.aucklandnz.com/explore/auckland-art-gallery-toi-o-tamaki)；[离岛指南](https://www.aucklandnz.com/inspire/the-ultimate-guide-to-aucklands-islands)：朗伊托托、怀赫科离岛交通性质。
- [皇后镇官方风景景点](https://www.queenstownnz.co.nz/things-to-do/sightseeing/scenic-attractions/)；[自然与保育](https://www.queenstownnz.co.nz/things-to-do/nature-and-wildlife/)；[格林诺奇游览](https://www.queenstownnz.co.nz/plan/surrounding-region/glenorchy/things-to-do/)；[Kiwi Park 参观信息](https://kiwibird.co.nz/visit/)。

## 尚未覆盖

本批只扩展目的地、景点、地区饮食说明和基础成本范围；未将城市通用美食名称伪装成具体餐厅，未宣称新增了可即时下单的酒店房态、餐厅订位或各类体验商家库存。后续可按城市逐家补充官方经营地址、菜单、服务选项、价格采集器和预订接口。
