# 日本与韩国跨来源补充 · 2026-09-23

本包增加札幌、福冈、广岛、那霸、釜山、济州岛6个目的地，每地14个游览项目、5种地方食物和5家具名住宿；另为东京、首尔各增加6段街区体验、2种食物、2家住宿。合计96个游览项目、34个食物定义、34家住宿。

数据文件分别为 `data/expansion/asia-cross-source.json`、`data/place-expansion/asia-editorial.json`、`data/food-expansion/asia-cross-source.json` 和 `data/experience-expansion/asia-cross-source.json`。既有条目未重命名、未覆盖；东京和首尔新条目已与原景点、食物和住宿名称对照去重。

## 交叉来源及用途

| 城市 | 官方来源 | 独立旅行编辑来源 | 采用方式 |
| --- | --- | --- | --- |
| 札幌 | [札幌旅游](https://www.sapporo.travel/en/)、[札幌美食](https://www.sapporo.travel/en/feature/sapporo-gourmet-recommend-guide/) | [Japan Guide](https://www.japan-guide.com/e/e2163.html) | 市中心、公园、市场与远郊温泉分区，食物补充地方吃法 |
| 福冈 | [福冈市旅游](https://gofukuoka.jp/)、[地方饮食](https://www.gofukuoka.jp/f-food.html) | [Japan Guide](https://www.japan-guide.com/e/e2161.html)、[屋台指南](https://www.japan-guide.com/e/e4803.html) | 屋台、市场与海滨内容交叉，太宰府不视为市内短步行 |
| 广岛 | [广岛旅游](https://dive-hiroshima.com/en/)、[地方美食](https://dive-hiroshima.com/en/feature/feature-38422/) | [Japan Guide](https://www.japan-guide.com/e/e2160.html)、[市中心指南](https://www.japan-guide.com/e/e3406.html) | 纪念性场所与轻松河岸、市区生活搭配；宫岛另留大半天 |
| 那霸 | [冲绳旅游·那霸](https://visitokinawajapan.com/destinations/okinawa-main-island/southern-okinawa-main-island/naha/)、[壶屋工艺街](https://visitokinawajapan.com/travel-inspiration/visiting-tsuboya-yachimun-street/)、[饮食文化](https://visitokinawajapan.com/discover/food-and-longevity/okinawan-food-culture/) | [Japan Guide 冲绳本岛](https://www.japan-guide.com/e/e7101.html) | 以那霸文化与街区为主，北部水族馆和远岛不硬塞进市内日程 |
| 釜山 | [釜山官方游览目录](https://www.visitbusan.net/index.do?menuCd=DOM_000000301001000000)、[住宿目录](https://www.visitbusan.net/index.do?menuCd=DOM_000000301004000000) | [Klook 釜山编辑指南](https://www.klook.com/blog/busan-guide/) | 街区与海岸按西部、影岛、中部、东部分区；商业套餐价格未采用 |
| 济州岛 | [济州旅游局](https://www.visitjeju.net/en/lowmenu?menuId=DOM_000001703100000000)、[官方口袋指南](https://www.visitjeju.net/pdf/Official%20Jeju%20Tourism%20Guidebook_en.pdf) | [Klook 济州编辑指南](https://www.klook.com/blog/best-things-to-do-jeju/) | 北岸、东西线与西归浦分日，保留海边下午与海女文化，汉拿山独立整日 |

这里的Klook链接用于旅行编辑内容和体验发现，不将商业预订页的促销数当作基础价格；Lonely Planet搜索摘要曾用于发现线索，但全文返回403，未记为已阅读全文的核验来源。福冈旧旅游入口 `yokanavi.com/en/` 已跳转为 `gofukuoka.jp`，最终使用新入口。

东京街区采用GO TOKYO的[谷中根津](https://www.gotokyo.org/en/destinations/northern-tokyo/yanaka-and-nezu/index.html)、[下北泽](https://www.gotokyo.org/en/destinations/western-tokyo/shimokitazawa/index.html)、[神乐坂](https://www.gotokyo.org/en/destinations/central-tokyo/kagurazaka/index.html)、[清澄白河](https://www.gotokyo.org/en/destinations/eastern-tokyo/kiyosumi-shirakawa/index.html)、[神保町](https://www.gotokyo.org/en/destinations/central-tokyo/kanda-and-jimbocho/index.html)及[吉祥寺](https://www.gotokyo.org/en/destinations/western-tokyo/kichijoji/index.html)指南；餐饮补充[东京地方食物](https://www.gotokyo.org/en/see-and-do/drinking-and-dining/tokyo-local-food/index.html)。首尔采用[城水炼武场街](https://english.visitseoul.net/area/Yeonmujang-gil/ENP7u7jrk)、[益善洞](https://english.visitseoul.net/attractions/ikseongdongHanokVillage/ENP037008)、[望远市场](https://english.visitseoul.net/MapoArea/Mangwon-Market/ENP037950)与[韩国旅游局的弘大、延南和望远路线](https://english.visitkorea.or.kr/svc/whereToGo/hdrdslt/hdrdsltView.do?crsSn=256)。

## 重要边界与修正

- [广岛城官方公告](https://hiroshimacastle.jp/news/news-2537/)明确天守于2026年3月22日闭馆。条目只安排外观与仍开放的城园，不承诺登楼。
- [首里城公园](https://oki-park.jp/shurijo/en/)按开放区域和复兴进展游览；不将火灾前正殿照片包装为当前已恢复的完整宫殿体验。
- 宫岛、定山溪、太宰府、汉拿山及济州远线设置为可选，避免自动挤入短市内日程。资料馆用时、海滩休息与街区漫游分别给出可调范围。
- 所有新增数字费用为 `estimate`，价格 `checkedAt` 为空；`sourceCheckedAt` 与 `sourceReferences.checkedAt` 只表示内容来源阅读日期。免费项目指公共街道、公园或所述基础参观，不包括交通、餐饮、停车和另购活动。
- 住宿均是具名物业，可跳转官网或预订入口。金额沿用城市每间每晚预算 `city-daily-lodging`，不伪装成具体酒店报价。房型、人数、取消规则、住宿税与附加设施须在所选日期确认。
- 餐饮地点以片区或已阅读旅游资料中的店家作为起点，地图检索链接不构成已验证菜单。食物消费计入日常餐饮，不重复添加门票。
- 济州条目明确覆盖全岛，以济州市和CJU机场为基点；南岸度假酒店和东岸海滩不是北岸市内点。札幌CTS机场在千岁市，另有OKD市内机场；那霸OKA、福冈FUK、广岛HIJ、釜山PUS按各自门户接驳。

## 图片维护

先检查百科首图的主体与重定向，再通过Commons文件描述选择精确 `photoFile`。排除人物、行政区地图、历史街景和不同食物：例如海鲜丼词条曾跳转到牛肉饭，明太子词条曾显示鱼内脏原料，不能直接用于相应成品卡片。未找到对应成品照片的食物保留 `article: null` 和 `photoStatus: needs-food-photo`，交由统一媒体流程提供明确标注的插画。图片下载与许可证记录由主控媒体流程统一执行，本包不直接下载外站照片。

完成两轮主体核对后，164个卡片实体中140个指定了精确Commons文件。第二轮补充15家酒店的建筑或大厅照片、金城町石板路、濑长岛海景及清澄白河咖啡店外观；白浅滩的游客中心标牌替换成社区实景。鳗鱼饭照片的Commons文字描述只写了餐馆所在设施，已查看统一媒体流程下载的图片，确认主体确为烤鳗鱼盖饭。

仍未匹配到准确成品照片的4项为札幌夜间芭菲、博多水炊锅、釜山鱼糕和济州黑猪烤肉，不使用其他锅物、原料或泛指烤肉来代替。酒店未匹配照片的条目同样不将相邻酒店、品牌Logo或音乐会演出图当作物业照片。

## 具名饮食地点补充

以官方资料补充了 [Yeongdong Seolleongtang](https://english.visitseoul.net/gangnamarea/Yeongdong-Seolleongtang/ENP004984)、[Soonheenae Bindaetteok](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=194106)、[Ilmi Milmyeon](https://www.visitbusan.net/index.do?lang_cd=en&menuCd=DOM_000000302003001000&uc_seq=2285) 和 [Dongnae Halmae Pajeon](https://www.visitbusan.net/index.do?menuCd=DOM_000000301002002001&uc_seq=1607) 的食物与店家关系；这属于内容与地点核对，未采纳页面中的历史菜单价格。

乙支路资料已替换成直接相关的[官方工业街巷指南](https://english.visitseoul.net/editorspicks/seoul-streetside-architecture-3/39527)和[晚间Nogari食街](https://english.visitseoul.net/area/Euljiro-Nogari-Alley/ENPf8bj59)，东京6个街区各自指向相应GO TOKYO页面，避免将同城其他街区页面作为项目依据。
