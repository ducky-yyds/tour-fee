# 酒店对应照片扩充 · 2026-09-23

本轮以 860 家住宿为库存，筛出 528 家没有准确对应酒店实拍的条目。对 186 家编辑条目和 342 家 OSM 具名住宿分别检索；OSM 部分优先使用明确的 Commons 分类和 Wikidata 图片，再按酒店名、城市检索。逐项排除同品牌不同分店、人物活动照、仅有酒店名的附近风景、旧明信片和错误地理对应。

`data/hotel-photo-expansion/hotels-20260923.json` 收录 91 家通过元数据、地点和许可复核的 Commons 酒店照片，其中 41 家为 OSM 住宿。字段保存确切文件名、来源、作者、许可、拍摄日期及对应依据。Commons 图片下载与最终画面复核由整合流程完成。

再对其余 437 家逐家检索 Flickr 公开 CC 图片，并对 89 家补充中文酒店名检索。33 家通过单图页面许可复核、地点匹配和实际缩略图审阅，保存在 `data/hotel-photo-research/direct-approved-20260923.json`，与前述 91 家不重叠。本轮合计找到 124 家准确可复用实拍；研究包仅用于整合，最终发布使用独立的 `data/direct-photo-expansion/hotels-20260923.json`。预览图只下载到 `artifacts` 供人工看图，没有直接写入用户图库。

Flickr 记录保存单图来源、作者、CC 许可链接、拍摄日期、酒店对应依据和 `imageContextNote`。屋顶房车、室内装饰细节、泳池、入口标牌及季节性灯饰均明确说明展示范围；不把局部场景当作完整客房。拍摄年份仅代表历史照片，不能保证当前装修及房态。

酒店只占综合楼部分楼层时，使用 `imageScope: hotel-building` 和 `imageContextNote` 说明“酒店所在建筑的外观，非客房或设施照片”，并附经营者官网地址依据。不把整座综合楼说成酒店，也不将建筑外观当作当前客房或设施。

528 个既有酒店公开链接完成元数据访问。160 家留下尚未核准的官方网页图片候选，保存在 `data/hotel-photo-research/official-candidates-20260923.json`。这些 URL 只供继续复核，不是发布许可，不能导入用户图库。网页被拒绝或登录受限时没有绕过访问控制。仍未取得合格对应图片的 404 家列于 `unresolved-hotels-20260923.json`，并记录是否完成 Flickr 及中文名交叉检索。

本批采用 Commons 文件页的 CC BY、CC BY-SA、CC0、Public domain 或 Free Art License 标记。下载后仍应保留作者、原图及许可链接。FAL 两项为柏林 Park Inn 和康提 Queen’s Hotel；独立图片遵守 [Free Art License](https://artlibre.org/licence/lal/en/) 的归属及传播条件。

## 官方媒体页复核

- [Hotel Locarno Roma 媒体库](https://www.hotellocarno.com/en/corporate-nav/media-kit) 有明确分店的外观和房间图；未找到适用于本项目持续复用的具体许可，保留候选。
- [Little America Flagstaff](https://flagstaff.littleamerica.com/media-resources/) 限定既定协议下的合作伙伴、客户和顾客使用，不能将“公开可下载”视为本项目自动取得许可。
- [Santa’s Hotels](https://santashotels.fi/en/media/) 提供媒体图集；本项目长期产品图库的适用范围及单图署名尚未核实。
- [UDS Press Room](https://www.uds-hotels.com/en/presskit/) 所见资料主要是标识及媒体联系，未确认 YUEN 新宿酒店可直接复用的照片。
- [Marriott Press Area 条款](https://marriott.pressarea.com/en/terms-and-conditions) 面向合资格新闻媒体用途，不能推定一般旅行应用具备同样授权。

## 已排除的重要错误

- 马拉喀什 Riad Bab Tilila 的 OSM Wikidata 指向“摩洛哥 Riad”通用概念；其图片是其他城市的庭院场景，不能当作该住宿。
- 布宜诺斯艾利斯 Claridge 的 OSM 分类指向巴黎 Café Claridge；采用另行检索的阿根廷酒店实拍。
- 青岛 Westin 检索命中“西海岸世博城威斯汀”，与市中心该条目不同，未采用。
- 苏州 Marriott 检索命中 Courtyard，未采用；深圳 Park Hyatt 检索命中罗湖 Grand Hyatt，未采用。
- 罗马 Locarno 的部分结果实际位于尼斯；Naxos Nissaki 的部分结果实际位于科孚；Zurich Limmathof 的部分结果实际位于 Baden。只采纳准确城市条目。
- `stay-siem-reap-osm-relation-5532571` 的原 Angkor Holiday 网址跳转至无关博彩内容，官方候选标为拒绝；已移除原预订网址，维护程序也停用该域名，待经营者核验。
- Bergen Oleana 的候选是人物背部装饰画；Cappadocia Museum Hotel 的候选涉及住客订婚人物照片；均排除。
- 高雄 Howard Plaza 的候选只是从酒店拍摄的城市天际线；Monterey Hotel Pacific 的候选实际为 Seven Gables Inn；均排除。
- Melbourne The Nunnery 初始候选是其他修道院建筑，已改用明确酒店名和地点的公共休息区实拍。

统计是本轮发现工作的范围，不代表全部住宿图片已经补齐，也不代表房态、当前装修或经营状态已逐项核实。
