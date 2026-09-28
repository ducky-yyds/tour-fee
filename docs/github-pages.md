# GitHub Pages 公共预览

GitHub Pages 由已提交的公共目录与网页派生图构建，是项目的预览入口。本地 JSON 目录、SQLite、图片原件和完整备份是主版本；正式部署不依赖 Pages，见 [本地完整资产与正式部署](local-deployment.md)。

静态预览在浏览器内使用共享逻辑计算行程和预算。旅行项目、足迹和旅居偏好保存在当前浏览器，不上传到 Pages，也不会跨设备自动同步。换域名之前，可在项目页导出完整个人工作区，在新网站导入；原有单项目和足迹导出继续可用。

## 发布

1. 将代码、经维护的 `data/` 公共 JSON、`public/images/` 派生图和地图资源提交到仓库。`.env`、本机 SQLite、`storage/` 私有归档、日志和构建目录不提交。
2. 在仓库 Settings → Pages 将发布来源设为 GitHub Actions。
3. 推送默认 `main` 或 `master` 分支，或手动运行 **Build and deploy preview**。工作流安装依赖、合并已提交扩充包、审计目录和本地图片，再构建 `dist-pages/` 并部署。应用测试仅在手动明确选择 `run_tests` 时运行，默认关闭。
4. `PAGES_BASE_PATH` 默认来自 Pages 配置，也可使用同名仓库变量覆盖。项目站点使用 `/tour-fee/`，自定义域名通常使用 `/`。

工作流不抓取新价格或照片，不自动生成 AI 兜底图，也不把 runner 的临时数据当作主版本。新增数据和照片必须先在维护环境保全与核对，再提交给预览构建。旧的 `[skip refresh]`、`[skip tests]` 提交标记不再决定该工作流的采集或测试行为。

## 本地构建预览

```powershell
npm.cmd ci
$env:PAGES_BASE_PATH = '/tour-fee/'
npm.cmd run build:pages
npm.cmd run preview:pages
```

打开 `http://localhost:4173/tour-fee/`。也可使用 `npm.cmd run build:pages -- --base=/tour-fee/`。预览与构建需使用相同路径；静态网页计算行程时不会请求常驻 Node API。`dist-pages/` 与生产 Node 服务的 `dist/` 相互独立。

回到服务器模式前，清除终端中显式设置的 `PAGES_BASE_PATH`、`VITE_STATIC_DATA`，再执行 `npm.cmd run build` 和 `npm.cmd start`。`build:pages` 仅在自己的进程中启用静态模式，不修改终端设置。

## 数据交付

- `scripts/export-static-data.mjs` 在 `public/static-data/` 生成内容哈希文件与 manifest。v2 格式先加载轻量城市摘要，随后按需获取各城市详情；旧版 manifest 仍兼容。国家规划、选择器与环球地图可先使用摘要，不会把未加载详情当作城市没有内容。
- 加载个人项目时先获取相关城市，再恢复已选景点和活动；网络失败会提示重试，不能因为详情暂缺而裁剪存档。
- JSON 同时提供 gzip 版本；支持浏览器解压时优先使用，否则回退普通 JSON。机场索引与必要的历史地点资料按需读取，机场存在不代表旅行内容已收录。
- 导出使用内存 SQLite，并读取已提交的公共来源快照；不隐式读取私有运行数据库。导出不包含原件归档、本机路径、环境变量、完整观察历史或浏览器个人资料。
- Node 正式部署提供兼容的摘要与详情接口：`GET /api/catalog`、`GET /api/cities?ids=...`，共享同一目录和预算逻辑。
- 图片通过统一资源路径加载。可配置 `VITE_MEDIA_BASE_URL` 使用公开派生图 CDN；图片原件及私人备份不作为静态站点目录发布。

## 维护职责

本地运行 `npm.cmd run maintain:local -- --publish`，负责完整维护、原件与数据库备份，并在审计和构建通过后提交公共数据、推送预览。本机关闭时维护暂停，恢复后继续；正式服务器可以调度相同命令。维护状态见 `storage/maintenance-state.json`，完整流程和 Windows 调度方式见 [本地部署说明](local-deployment.md)。

GitHub 的 **Daily source availability report** 每日按工作流设定的 03:23 UTC 调度，仅检查轮换来源样本并保存诊断报告。它不更新主目录、不产生新官方价格、不部署预览，也不能作为本机每天已成功维护的证明。HTTP 成功只说明页面可访问；价格有效性、经营状态与照片匹配仍需要相应核验。

Pages 上传产物仅保留短期构建文件，不能承担长期备份职责。预览构建报告完整网站体积，超过脚本设置的 1,000,000,000 字节阈值时中止；缩小派生图之前必须先保存原始字节。正式网站与本地原件库不使用此预览体积阈值。

城市数量不固定写入部署文档：内容质量和缺图见 [目录覆盖报告](../data/catalog-coverage.json)，已发现、待补齐与达到编辑目标的目的地见 [全球覆盖报告](../data/destination-coverage.json)。报告中有缺口的条目不会因为发布成功而自动变成完整内容。
