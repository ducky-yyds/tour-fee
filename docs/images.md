# 目的地图片维护

本地图片位于 `public/images/`，映射与逐张署名位于 `data/media.json`。原 30 城与 262 景点的 292 张照片均保留；100 目的地扩展后的实际图片覆盖与缺失清单以 `data/catalog-coverage.json` 为准，可运行 `npm.cmd run audit:catalog` 更新。`cities` 按城市 ID 索引，`attractions` 按景点 ID 索引；前端使用记录的 `url`，不要自行拼接扩展名。每张图片都从真实目的地的 Wikimedia Commons 文件下载，不使用随机图库图片冒充地点。

本轮收尾核验（2026-09-22）：**100 张目的地主图 + 819 张景点图，共 919 张**。小美人鱼与西贝柳斯纪念碑保留明确城市参考图，其余在用条目均已下载；全库解码、尺寸、字节数结果见 `artifacts/qa/media-decode-report.json`。

## 更新命令

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
- 条目每批最多 20 个、授权元数据每批最多 10 个，图片逐张下载，减少目录扩容带来的 API 请求。
- 先完成城市主图，再以每批四十个地点处理景点；成功的条目映射和许可查询缓存在 `data/image-lookup-cache.json` 七天，中断后可继续。照片仍按默认三十天刷新。人工精确文件覆盖可维护在 `data/expansion-photo-overrides.json`、`data/africa-photo-overrides.json`、`data/global-photo-overrides.json`。
- 欧洲补图维护在 `data/europe-photo-overrides.json`。值为 `null` 表示暂不发布该地点独立照片，不反复尝试不合适首图；页面使用标注过的城市参考图。小美人鱼、西贝柳斯纪念碑采用此方式保留缺图状态，摄影文件的 CC 许可并不当然涵盖雕塑本体授权。
- 每次请求间隔至少 1 秒、单个 worker；HTTP 429 和临时服务器错误有至多 3 次退避重试，Node 网络异常最多重试 2 次。请求有 20 秒超时，Python 子进程另有 25 秒上限。
- Python 网络异常重试一次并保存简短原因；连续三张照片均网络失败时终止本轮，已下载内容保留，稍后重跑继续缺图，避免网络中断时把整库逐张等到超时。
- 城市通常取 1280 像素宽缩略图，景点通常取 960 像素；超过 600 KiB 则改取较小尺寸。校验 MIME、文件签名和文件大小，并从下载文件读取实际宽高。
- 只接受 Commons 明确标注的 CC BY、CC BY-SA、CC0 或 Public domain；缺失或未识别许可不发布。拒绝 Wikipedia 本地文件、旗帜、地图、Logo 和 SVG 首图。
- 临时文件写完后再替换目标。网络失败或许可未通过检查时保留此前可用图片和元数据；运行结果写入 `lastRun`，有失败时返回退出码 1，便于监控。

## 署名与来源

每条记录提供 `credit`、`sourceUrl`、`license`、`licenseUrl`、拍摄日期、核验时间、原始文件名、远程缩略图 URL、字节数和修改说明。应在展示位置或可直接访问的图片署名视图中展示作者、原始文件页链接和许可链接，并保留“缩略图，界面可能裁切”的说明。CC BY-SA 图片的衍生版本继续遵循原许可；应用代码的许可不受这些图片许可的替代。

`capturedAt` 是来源注明的拍摄日期；`checkedAt` 是抓取/许可核验时间，两者不能混用。照片呈现地点，不保证当前天气、建筑状态或现场人流。南山首尔塔、哈利法塔使用从观景台拍摄的城市实景，图片描述保留具体拍摄视角。

东京主页图为 [David Kernan 的 Minato City, Tokyo, Japan](https://commons.wikimedia.org/wiki/File:Minato_City,_Tokyo,_Japan.jpg)，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0)，已核对为包含东京塔的黄金时段城市全景。其他逐张来源请查看 `data/media.json`。

## 添加城市和景点

在 `data/cities.json` 添加城市或景点时，为其 `image.sourceUrl` 填写准确的英文 Wikipedia 条目链接，或 Commons 文件页链接；抓取器会自动发现新 ID。缺少来源时会尝试 `nameEn`，仍需经过相同的图片与许可检查。脚本内的人工覆盖规则优先于目录默认值。

首图不合适时，在 `scripts/fetch-images.mjs` 的 `citySources.file` 或 `attractionFiles` 指定经过核实的 Commons 文件名，然后对该 ID 运行 `--force --only=...`。默认首图为地图、Logo、未匹配许可或缺失文件时，抓取会明确失败，不能以无关城市照片替代景点。下载后核对图片内容及文件页，再发布新增目录。

用户自定义地点或后续新增条目没有独立图片时，行程界面可展示所在城市的照片，但必须同时标注“城市参考图 · 景点暂无照片”。这是明确的占位提示，不计入景点照片覆盖率。
