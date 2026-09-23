# 美国西部、夏威夷与阿拉斯加扩充来源

资料整理日期：2026-09-23。本批新增 8 城、112 个去处、40 种城市食物记录、40 家具名住宿。每城 14 个去处、5 种食物、5 家住宿；并补齐城市日常预算、长租预算、推荐天数、街区与交通说明。

对应数据为 `data/expansion/us-west.json`、`data/experience-expansion/us-west.json`、`data/food-expansion/us-west.json`。各条目保留自身来源链接。食物 `whereByCity` 提供街区查找入口，不把地图检索冒充已核验店家菜单。图片 `article` 只用于后续独立检索，照片授权与画面内容仍由统一媒体流程确认。

## 价格和交通口径

本批金额均为编辑规划估算，价格 `checkedAt: null`，未读取所选日期实际库存。酒店三档金额是城市每间每晚预算占位，均标 `priceBasis: city-daily-lodging`，不是对应酒店的售价，也不是三个可订房型。具体住宿网站作为询价入口。

免费条目只覆盖写明的公共空间或基础入场，停车、购物、餐饮和收费附加项目另计。红岩峡谷主要按车入场，保留 `type: missing`，没有将整车费用假装为每人票价。Torrey Pines、Point Lobos、Flattop 等条目明确步行范围和另计停车。预算不是最低与最高市场价。

远郊、长时、强预约或特殊兴趣项目使用 `visitRole: optional` 与 `automaticPlanning: false`，不会当成填空的短城市景点。所有坐标都是区域或场馆近似参考点。长时体验还需要调度器保留实际交通时间。

- [恶魔岛 NPS 访客指南](https://www.nps.gov/alca/planyourvisit/index.htm)：指定经营者渡轮，从 Pier 33 报到；不是 Pier 39 登船，轮渡需预订。
- [钻石头州立纪念地](https://dlnr.hawaii.gov/dsp/parks/oahu/diamond-head-state-monument/)：非夏威夷居民预约，停车和成人入场分开。
- [珍珠港 NPS 访客指南](https://www.nps.gov/perl/planyourvisit/index.htm)：纪念地免费与船班预约、停车、其他舰馆分开说明。
- [红岩峡谷](https://www.redrockcanyonlv.org/)及[胡佛坝](https://www.usbr.gov/lc/hooverdam/)：独立远郊往返。没有将大峡谷放作拉斯维加斯市内点。
- [阿拉斯加铁路](https://www.alaskarailroad.com/)：可选全天体验，不承诺任一季节有同日往返，也不把预算当成指定线路票价。
- 檀香山所有去处均在瓦胡岛，`islandGroup: oahu`；其他夏威夷岛需另加航班和住宿。

## 目的地与饮食资料

| 城市 | 官方目的地与文化资料 | 饮食来源 |
| --- | --- | --- |
| 旧金山 | [San Francisco Travel](https://www.sftravel.com/)、[唐人街](https://www.sftravel.com/neighborhoods/visit-chinatown)、[Mission](https://www.sftravel.com/neighborhoods/mission-district)、[渔人码头](https://www.sftravel.com/article/sightseeing-dining-more-fishermans-wharf) | [城市代表性食物](https://www.sftravel.com/article/iconic-san-francisco-eats-drinks-every-visitor-must-try)、[各街区风味](https://www.sftravel.com/article/san-franciscos-iconic-eats-every-neighborhood) |
| 西雅图 | [Visit Seattle 街区](https://visitseattle.org/things-to-do/neighborhoods/)、[主要景点](https://visitseattle.org/press/press-kit/seattles-major-attractions/)、[太空针塔](https://www.spaceneedle.com/) | [当地食材与餐饮](https://visitseattle.org/food-drink/restaurants/eat-local/)、[照烧饭等家常味道](https://visitseattle.org/food-drink/restaurants/best-comfort-food-restaurants-in-seattle/) |
| 圣迭戈 | [SDTA 游览指南](https://www.sandiego.org/things-to-do/top-things-to-do)、[街区](https://www.sandiego.org/press-release/san-diegos-buzzing-neighborhoods)、[Coronado](https://www.sandiego.org/explore/coastal/coronado) | [SDTA 餐饮](https://www.sandiego.org/food-drink)、[加州卷饼介绍](https://www.sandiego.org/press-release/san-diego-tourism-authority-celebrates-national-burrito-day-by-honoring-the) |
| 拉斯维加斯 | [Visit Las Vegas](https://www.visitlasvegas.com/experience/post/top-5-things-to-do-in-las-vegas/)、[百乐宫喷泉](https://bellagio.mgmresorts.com/en/entertainment/fountains-of-bellagio.html) | [自助餐](https://www.visitlasvegas.com/experience/post/buffets-on-and-off-the-strip/)、[餐馆与烤肋排](https://www.visitlasvegas.com/experience/post/the-best-rooftop-bars-and-restaurants-in-las-vegas/)、[冷虾杯历史](https://www.goldengatecasino.com/blog/history-of-shrimp-cocktail-las-vegas/) |
| 波特兰 | [Travel Portland](https://www.travelportland.com/attractions/)、[公园与花园](https://www.travelportland.com/attractions/parks-gardens/)、[日本庭园](https://japanesegarden.org/) | [城市食物与餐车](https://www.travelportland.com/culture/food/)、[俄勒冈莓果派](https://traveloregon.com/things-to-do/eat-drink/artisan-producers/oregons-pit-stop-worthy-pies/) |
| 蒙特雷 | [See Monterey](https://www.seemonterey.com/)、[水族馆](https://www.montereybayaquarium.org/)、[Point Lobos](https://www.parks.ca.gov/?page_id=571) | [产区食材与海鲜](https://www.seemonterey.com/food-drink/made-in-monterey/) |
| 檀香山／瓦胡岛 | [Go Hawaii Oahu](https://www.gohawaii.com/islands/oahu)、[威基基海滩](https://www.gohawaii.com/islands/oahu/things-to-do/beaches/waikiki-beach)、[钻石头概览](https://www.gohawaii.com/islands/oahu/regions/honolulu/leahi-diamond-head) | [夏威夷饮食体验](https://www.gohawaii.com/experiences/culinary-experiences) |
| 安克雷奇 | [Visit Anchorage](https://www.anchorage.net/things-to-do/)、[本地生活路线](https://www.anchorage.net/plan-your-trip/itineraries/locally-made/) | [餐馆与阿拉斯加食材](https://www.anchorage.net/restaurants/)、[市中心餐饮](https://www.anchorage.net/restaurants/downtown/)、[季节市场](https://www.anchorage.net/blog/post/anchorage-farmers-market-guide/) |

## 住宿核对

40 家住宿使用各自官网或官方旅游住宿目录确认实体身份、片区与经营者链接。没有声称具体日期可订或已验证当前房型。

- 旧金山：[Fairmont](https://www.fairmont.com/san-francisco/)、[Palace](https://www.marriott.com/en-us/hotels/sfolc-palace-hotel-a-luxury-collection-hotel-san-francisco/overview/)、[Mark Hopkins](https://www.intercontinental.com/hotels/us/en/san-francisco/sfoha/hoteldetail)、[Argonaut](https://www.argonauthotel.com/)、[Westin St. Francis](https://www.marriott.com/en-us/hotels/sfouw-the-westin-st-francis-san-francisco-on-union-square/overview/)。
- 西雅图：[Fairmont Olympic](https://www.fairmontolympic.com/)、[Edgewater 官方旅游目录](https://visitseattle.org/members/the-edgewater-hotel-pd/)、[Sorrento](https://www.hotelsorrento.com/)、[Westin](https://www.marriott.com/en-us/hotels/seawi-the-westin-seattle/overview/)、[Inn at the Market](https://www.innatthemarket.com/)。
- 圣迭戈：[SDTA 滨水酒店](https://www.sandiego.org/stay/article/san-diego-waterfront-hotels-and-resorts)、[历史与城市酒店](https://www.sandiego.org/stay/article/romantic-hotels-resorts-in-san-diego)、[Lafayette](https://www.lafayettehotelsd.com/)、[Bahia](https://www.bahiahotel.com/)、[La Jolla Shores](https://www.ljshoreshotel.com/)。
- 拉斯维加斯：[Bellagio](https://bellagio.mgmresorts.com/)、[Venetian](https://www.venetianlasvegas.com/)、[Wynn](https://www.wynnlasvegas.com/)、[Paris](https://www.caesars.com/paris-las-vegas)、[Golden Nugget](https://www.goldennugget.com/las-vegas/)。
- 波特兰：[官方酒店指南](https://www.travelportland.com/plan/portland-hotels/)、[Benson 目录资料](https://www.travelportland.com/plan/pet-friendly-portland-hotels/)、[Heathman](https://heathmanhotel.com/)、[Sentinel](https://www.sentinelhotel.com/)、[The Nines](https://www.thenines.com/)、[Lucia](https://www.hotellucia.com/)。
- 蒙特雷：[2026 官方住宿会议清单](https://www.seemonterey.com/wp-content/uploads/022426-Monterey-Meetings-Destination-Flier.pdf)、[Monterey Plaza](https://montereyplazahotel.com/)、[Casa Munras](https://www.hotelcasamunras.com/)、[Portola](https://www.portolahotel.com/)、[Hotel Pacific](https://www.hotelpacific.com/)。Clement 专属网站未返回正文，实体与地址使用官方清单，不假称已读取实时房态。
- 瓦胡岛：[Go Hawaii 住宿](https://www.gohawaii.com/islands/oahu/accommodations)、[Moana 目录](https://www.gohawaii.com/listing/moana-surfrider-a-westin-resort-spa-waikiki-beach/196)、[Royal Hawaiian](https://www.royal-hawaiian.com/)、[Halekulani](https://www.halekulani.com/)、[Hilton Hawaiian Village](https://www.hiltonhawaiianvillage.com/)、[Kahala](https://www.kahalaresort.com/)。
- 安克雷奇：[官方酒店目录](https://www.anchorage.net/meetings/venues/convention-hotels/)、[Captain Cook](https://captaincook.com/)、[Historic Anchorage](https://www.historicanchoragehotel.com/)、[Lakefront](https://www.millenniumhotels.com/en/anchorage/the-lakefront-anchorage/)、[Hilton](https://www.hilton.com/en/hotels/ancahhf-hilton-anchorage/)、[Marriott](https://www.marriott.com/en-us/hotels/ancdt-marriott-anchorage-downtown/overview/)。

## 图片匹配注意

本批不下载或直接复用旅游局网站图片。地点与酒店提供具体百科条目候选，缺少可确认图像时由共享媒体流程使用标明用途的插画。生蚝、驯鹿香肠、蟹腿、莓果派和洋蓟没有猜文件名，先标 `needs-food-photo`。食品照片按成品菜检查，百科首图误配时以具体 Commons 文件优先；同类饮食配有范围说明，避免声称画面就是指定店家、当前菜单或特殊配方。

首次媒体匹配后又只读检查了本批 152 个地点／酒店的图片槽位：Captain Cook 的百科重定向误指州长肖像、Neon Museum 首图是 Logo，均以明确 `photoFile` 替换；另为 Mission、Alki、Alberta、Carmel 和 Kakaako 选择更符合卡片内容的街景或海滩照片。来源文件：

- [Captain Cook Tower II 楼体](https://commons.wikimedia.org/wiki/File:Hotel_Captain_cook_Tower_II,_Downtown_Anchorage,_AK.jpg)
- [Neon Museum 展区步道](https://commons.wikimedia.org/wiki/File:Neon_Museum_Las_Vegas_walkway.jpg)
- [Mission District 街区](https://commons.wikimedia.org/wiki/File:Mission_District_2.JPG)
- [Alki Beach 海滩](https://commons.wikimedia.org/wiki/File:Alki_Beach,_Seattle_in_April_2012.JPG)
- [Alberta Street 商业街建筑](https://commons.wikimedia.org/wiki/File:NE_Alberta_Street,_Portland_-_DPLA_-_24f284a55523376e5ef28ef2ea1494cb.jpg)
- [Carmel Ocean Avenue 街面](https://commons.wikimedia.org/wiki/File:Fee_Building_Ocean_Avenue_view.jpg)
- [Kakaako Halekauwila Street](https://commons.wikimedia.org/wiki/File:Halekauwila_Street_in_Kaka%CA%BBako.jpg)

对 40 条食品逐项只读审阅本次媒体查询的首图元数据，并打开含糊文件说明。修正了 Salmon as food 首图为刺身、Teriyaki 首图为鸭肉、Fish taco 重定向到普通肉类塔可、California burrito 重定向普通卷饼、Squid as food 首图为墨鱼汁意面、Standing rib roast 首图为牛肉部位图、Buffet 首图为瑞典自助餐、India pale ale 首图为英国啤酒的问题；另把波特兰鸡饭升级为当地成品实拍。10 条食品新增明确 `photoFile`，图片下载仍由共享媒体流程负责：

- [西雅图雪松板三文鱼](https://commons.wikimedia.org/wiki/File:Cedar-Planked_Salmon_with_couscous,_spinach,_tomatoes_and_olives.jpg) — CC BY-SA 4.0。
- [烤三文鱼成品](https://commons.wikimedia.org/wiki/File:Grilled_salmon_garnished_with_lemon_and_parsley.jpg) — CC BY-SA 4.0；只作为安克雷奇常见做法参考，不声称鱼种与来源。
- [西雅图地区照烧鸡饭](https://commons.wikimedia.org/wiki/File:Chicken_Teriyaki_(with_rice_and_slaw)_at_Toshi%E2%80%99s_Teriyaki_Grill,_Seattle,_Washington.jpg) — CC BY-SA 4.0。
- [Baja 风格炸鱼塔可](https://commons.wikimedia.org/wiki/File:Baja_Style_Fish_taco,_Fried_rock_fish,_cabbage,_heirloom_tomato,_avocado,_Serrano_chile,_lime,_crema,_herbs_-_18511248695.jpg) — CC BY 2.0；照片拍于洛杉矶，显示菜式而非指定圣迭戈餐厅。
- [圣迭戈 California burrito 剖面](https://commons.wikimedia.org/wiki/File:C%26F_California_Burrito_-_bisected.jpg) — CC BY 4.0。
- [Stone Brewing 精酿示例](https://commons.wikimedia.org/wiki/File:Stone_Imperial_Black_IPA.jpg) — CC BY 2.0；不代表当前供应酒款。
- [拉斯维加斯 Magnolia's prime rib](https://commons.wikimedia.org/wiki/File:Magnolia%27s_prime_rib.jpg) — CC BY 2.0。
- [Bellagio 自助餐用餐实拍](https://commons.wikimedia.org/wiki/File:The_Buffet_at_Bellagio,_Las_Vegas_-_5306609356.jpg) — CC BY-SA 2.0；历史照片不代表当前菜单。
- [炸鱿鱼圈成品](https://commons.wikimedia.org/wiki/File:Deep-fried_Calamari_Rings.jpg) — CC BY-SA 4.0；只作为蒙特雷常见做法参考，不声称拍于当地。
- [波特兰 Nong's 泰式鸡饭](https://commons.wikimedia.org/wiki/File:Khao_Man_Gai_at_Nong%27s_Khao_Man_Gai.jpg) — CC BY-SA 4.0。

名称模糊的 `Quail 07 bg 041506.jpg` 经文件说明确认是蛤蜊浓汤，`Cocktail 1 bg 060702.jpg` 是虾鸡尾酒，故保留。其余已匹配文件是对应成品菜／饮品；仍需共享下载流程保留作者、许可和图片范围说明。

没有运行单元测试或浏览器测试；此文件是内容来源与预算范围记录。
