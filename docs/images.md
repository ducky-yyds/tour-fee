# 目的地图片维护

本地图片位于 `public/images/`，映射与逐张署名位于 `data/media.json`。169 座目的地扩展后的实际图片覆盖与缺失清单以 `data/catalog-coverage.json` 为准，可运行 `npm.cmd run audit:catalog` 更新。`cities` 按城市 ID 索引，`attractions` 按地点或食物 ID 索引；前端使用记录的 `url`，不要自行拼接扩展名。实拍来自 Wikimedia Commons 与逐图核实开放许可的 Flickr 文件；食物专属示意图另行标注。不使用随机城市风景冒充地点。

上一版（2026-09-22）的 100 张目的地主图与 819 张地点照片作为扩充起点保留。本轮继续增加新城市、香港街区、地图小地点和食物摄影；当前缺图清单以目录报告为准，没有运行上一版的额外解码测试。

## 更新命令

人工核对菜品实拍的映射独立保存在 `data/food-photo-expansion/`，酒店实拍在 `data/hotel-photo-expansion/`；包含具体主体、来源文件、作者、许可及匹配依据。食物映射每次导入都会覆盖旧的不准确首图；酒店映射由整库图片维护读取。映射是候选来源，只有成功下载并核对后才记为照片。

```sh
npm run import:destinations
python scripts/complete-media.py --phase exact --kinds food,hotel --photo-packs-only --thumb-width 400
python scripts/complete-media.py --phase fallback
```

新下载的卡片图取较小的原图派生缩略图，现有本地照片保留。`--photo-packs-only` 只处理上述经过主体核对的映射，避免每次重新检索整库。不要同时运行多个写入 `data/media.json` 的维护任务。

Commons 以外的逐图开放许可照片维护在 `data/direct-photo-expansion/`。目前支持 Flickr CC BY、CC BY-SA、CC0 和公有领域图片：先核对单图来源页的许可、作者、具体主体，再用 `scripts/import-direct-photos.py <候选包> --preview` 缓存缩略图供目视核对；只有 `visualReviewRequired:false` 的记录才允许正式导入。网站保留每张图的来源链接和许可，作者另有署名链接要求时一并保留。自动部署使用已缓存的本地图片，不依赖商家平台的防盗链。

`data/food-photo-research/` 与 `data/hotel-photo-research/` 中的候选和未解决记录不能直接当作可发布照片；名称搜索命中、网页含有 og:image，都不代表主体或授权已经核实。

每日数据维护在导入条目后运行 `scripts/maintain-reviewed-images.py`：只修复已审阅照片映射缺少的本地文件；成功的既有文件不重复下载。下载失败仍保留旧图或明确的插画，并由目录报告记录摄影覆盖缺口。随后 `--phase fallback` 应用逐道菜品插画，实际照片始终优先。

部分商家照片公开可见但没有向第三方开放转载；旅游平台用于核对菜名、分店与来源线索，不把可访问的 URL 当作开放许可。无法取得可复用成品实拍的菜品使用 [`generated-food-media.md`](generated-food-media.md) 所列专属示意图，在图片详情保留说明；住宿不以生成的具体酒店外观冒充实拍。

需要 Node.js 20 或以上，无 API 密钥或 npm 依赖：

```sh
node scripts/fetch-images.mjs
node scripts/fetch-images.mjs --force
node scripts/fetch-images.mjs --only=tokyo,sensoji
```

默认只刷新超过 30 天的记录，或者本地图片丢失的记录。`--force` 忽略缓存时间；`--only` 限定城市或景点 ID。城市与景点 ID 可以混用。

如果本机网络通过 Windows 系统代理访问 Wikipedia，Node 的直接请求可能超时。可使用 Python 3 标准库的网络方式，它会读取操作系统代理设置：

```sh
node scripts/fetch-images.mjs --python-network
node scripts/fetch-images.mjs --python-network --force --only=tokyo
```

Windows 默认调用 `py -3`，其他系统调用 `python3`；可通过 `ROAMLY_PYTHON` 指定解释器。该选项让英文 Wikipedia、Commons 许可查询和 Wikimedia 原图／缩略图下载统一使用 Python 系统网络。该方式无需安装 Python 包，不读取或保存代理密码。当前工作区的实际抓取已用此方式验证。

可在 Windows 任务计划程序、cron 或现有任务调度器中每日运行更新命令。默认的 30 天缓存期限避免每天重复下载。任务不要并发运行；应由调度器选择“已有实例运行时不启动新实例”。

## 抓取规则

- 自动读取 `data/cities.json` 中的城市与景点，并使用准确的 Wikipedia 条目或经过筛选的 Commons 文件名。没有固定文件时，从条目取得首图，再向 Commons 查询署名和许可；第一次成功后固定文件名，后续刷新不会因百科首图调整变成另一张照片。
- 自动发现 `data/local-foods.json` 中的食物，可用 `photoFile` 指定人工核对的成品照片；`photoStatus:needs-food-photo`、原材料条目和不准确的跳转页面不会被下载为食物照片。`--catalog=路径` 可为待导入地点提前准备图片。
- 条目每批最多 20 个、授权元数据每批最多 10 个，图片逐张下载，减少目录扩容带来的 API 请求。
- 先完成城市主图，再以每批四十个地点处理景点；成功的条目映射和许可查询缓存在 `data/image-lookup-cache.json` 七天，中断后可继续。照片仍按默认三十天刷新。人工精确文件覆盖可维护在 `data/expansion-photo-overrides.json`、`data/africa-photo-overrides.json`、`data/global-photo-overrides.json`。
- 欧洲补图维护在 `data/europe-photo-overrides.json`。值为 `null` 表示暂不发布该地点独立照片，不反复尝试不合适首图。小美人鱼、西贝柳斯纪念碑采用此方式跳过独立照片，整库补图时使用主题插画；摄影文件的 CC 许可并不当然涵盖雕塑本体授权。
- 每次请求间隔至少 1 秒、单个 worker；HTTP 429 和临时服务器错误有至多 3 次退避重试，Node 网络异常最多重试 2 次。请求有 20 秒超时，Python 子进程另有 25 秒上限。
- Python 网络异常重试一次并保存简短原因；连续三张照片均网络失败时终止本轮，已下载内容保留，稍后重跑继续缺图，避免网络中断时把整库逐张等到超时。
- 城市通常取 1280 像素宽缩略图，景点通常取 960 像素；超过 600 KiB 则改取较小尺寸。校验 MIME、文件签名和文件大小，并从下载文件读取实际宽高。
- 只接受 Commons 明确标注的 CC BY、CC BY-SA（含日本 2.1 版本）、CC0、Public domain 或 Free Art License；缺失或未识别许可不发布。拒绝 Wikipedia 本地文件、旗帜、地图、Logo 和 SVG 首图。
- 临时文件写完后再替换目标。网络失败或许可未通过检查时保留此前可用图片和元数据；运行结果写入 `lastRun`，有失败时返回退出码 1，便于监控。

## 署名与来源

每条记录提供 `credit`、`sourceUrl`、`license`、`licenseUrl`、拍摄日期、核验时间、原始文件名、远程缩略图 URL、字节数和修改说明。应在展示位置或可直接访问的图片署名视图中展示作者、原始文件页链接和许可链接，并保留“缩略图，界面可能裁切”的说明。CC BY-SA 与 FAL 图片的衍生版本继续遵循各自原许可；独立图片仍可从公开文件访问，应用代码的许可不受这些图片许可的替代。

`capturedAt` 是来源注明的拍摄日期；`checkedAt` 是抓取/许可核验时间，两者不能混用。照片呈现地点，不保证当前天气、建筑状态或现场人流。南山首尔塔、哈利法塔使用从观景台拍摄的城市实景，图片描述保留具体拍摄视角。

东京主页图为 [David Kernan 的 Minato City, Tokyo, Japan](https://commons.wikimedia.org/wiki/File:Minato_City,_Tokyo,_Japan.jpg)，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0)，已核对为包含东京塔的黄金时段城市全景。其他逐张来源请查看 `data/media.json`。

## 添加城市和景点

在 `data/cities.json` 添加城市或景点时，为其 `image.sourceUrl` 填写准确的英文 Wikipedia 条目链接，或 Commons 文件页链接；抓取器会自动发现新 ID。缺少来源时会尝试 `nameEn`，仍需经过相同的图片与许可检查。脚本内的人工覆盖规则优先于目录默认值。

首图不合适时，在 `scripts/fetch-images.mjs` 的 `citySources.file` 或 `attractionFiles` 指定经过核实的 Commons 文件名，然后对该 ID 运行 `--force --only=...`。默认首图为地图、Logo、未匹配许可或缺失文件时，抓取会明确失败，不能以无关城市照片替代景点。下载后核对图片内容及文件页，再发布新增目录。

用户自定义地点或新增条目没有准确图片时，城市卡片与行程使用对应主题的插画。已有的相关地点引用保留其来源语义，不计入独立地点照片覆盖率。

## 整库图片覆盖（2026-09-23）

`scripts/complete-media.py` 使用 Python 3 标准库，将地点、特色食物、住宿、餐厅与体验统一纳入维护。不要与其他图片脚本同时运行：

```sh
python3 scripts/complete-media.py --phase exact
python3 scripts/complete-media.py --phase nearby
python3 scripts/complete-media.py --phase fallback
```

- `exact`：优先采用人工文件、准确的百科条目和地点 Wikidata 的 P18 图片；过滤人物实体、明显地图／标志、离地点超过两公里的实体坐标，以及不明确的许可。支持 `--cities=hong-kong,beijing` 限定城市。自动匹配仍需人工复核，发现不相符应更换文件，不应只改图片说明。
- `nearby`：为仍缺图的地点查找 Commons 有坐标标注的周边实景，距离上限 1,250 米。详情显示标注坐标与地点参考点的距离及“不是该地点内部或入口的核验照片”；不会用于冒充酒店客房或某一道菜。附近照片只是环境参考。
- `fallback`：离线为剩余条目补上主题插画，保留 `scope: illustration` 与明确说明。插画不是实拍，也不代表任何酒店房型或菜品外观。生成提示词和资产清单见 [生成素材记录](generated-media.md)。每次 Pages 构建执行此步骤，保证新增条目也有图。

API 顺序请求，间隔至少 1.25 秒；CDN 最多三个下载任务、统一限速。30 天请求缓存保存在 `artifacts/media-completion-cache`，429 尊重等待时间，401/403 不绕过。新缩略图默认请求宽 500 像素，可用 `--thumb-width=400` 为新增批次请求较小图片（Commons 可能返回最接近的预生成尺寸）；单图不超过 750 KiB，已有图片继续保留。周边检索先取得轻量坐标索引，只为选中的候选读取许可和缩略图信息；排除藏品、人物、菜品、施工等不适合表达周边环境的照片。逐张记录作者、来源和许可，原子写入素材清单。

目录审计分别报告对应实拍、旧版摄影、附近实景、主题插画和仍缺图数量；“有图”不等于“全部已有准确实拍”。卡片默认只展示图片，来源和范围在展开详情中可直接查看。公共 API 资料：[Commons 图片元数据](https://www.mediawiki.org/wiki/API:Imageinfo)、[坐标检索](https://www.mediawiki.org/wiki/API:Geosearch)。

## 控制目录图片体积

`python3 scripts/compact-catalog-photos.py` 只列出体积超过 220 KiB、宽度至少 900 像素的 Commons 卡片照片；加 `--apply --max-images=80` 后，重新下载同一源文件的官方 500 像素缩略图。城市封面不参与，公共 URL、对应地点、署名和许可保持不变；仅在编码一致、授权仍可确认且体积至少缩小 10% 时替换。程序不在本地裁切或改绘照片，失败保留原图。

这是按需执行的发布维护，不会在每日任务中反复下载。报告位于 `artifacts/catalog-photo-compaction.json`；2026-09-23 分两批为 159 张卡片共减少约 41.8 MiB，为新增目的地留出发布空间。素材记录保存 `preferredWidth: 500`，常规刷新继续请求该尺寸，并保留同一源图片的范围说明。
