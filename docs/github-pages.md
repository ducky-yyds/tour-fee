# GitHub Pages 静态发布

静态站点在构建时导出城市、价格来源状态与机场索引；行程、费用和自定义景点继续使用共享规划模块在浏览器计算。打开网页不需要常驻 Node 服务，也不需要机票或酒店 API 密钥。旅行项目与足迹仍保存在当前浏览器，可使用原有导入导出功能。跨浏览器和跨设备不会自动同步这些存档。

## 发布到 GitHub

1. 将项目代码和 `public/` 内的城市照片、地球纹理、地图许可文件提交到仓库。不要提交本机 `.env`、SQLite 数据库、`data/schedule.json`、日志、`dist/` 或 `dist-pages/`；这些已加入忽略规则。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 推送到默认的 `main` 或 `master` 分支，或手动运行 **Build and deploy GitHub Pages**。工作流安装 Node 24、运行测试、更新公共来源、导出快照、构建，并且仅上传 `dist-pages/`。如果仓库默认分支名称不同，修改 `pages.yml` 的 push 分支配置。
4. 部署地址来自 `actions/configure-pages`。项目站点的 `/仓库名/` 与自定义域名的 `/` 会自动作为 Vite base；确需覆写时添加仓库 Actions 变量 `PAGES_BASE_PATH`，例如 `/tour-fee/`。

GitHub Pages 的 Actions 发布需要 `pages: write`、`id-token: write`、`github-pages` environment，以及先构建后上传再部署的依赖关系；工作流据此配置，未请求仓库内容写入权限。[GitHub 自定义 Pages 工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Vite 项目站点应使用 `/仓库名/`，用户站点和自定义域名使用 `/`；`base` 同时决定 JS/CSS 产物路径。图片、地图与纹理的运行时路径由 `assetUrl()` 统一添加相同前缀。[Vite 静态发布文档](https://vite.dev/guide/static-deploy.html#github-pages)

## 在本地验证静态版

PowerShell：

```powershell
npm ci
$env:PAGES_BASE_PATH = '/tour-fee/'
npm run build:pages
npm run preview:pages
```

浏览器打开 `http://localhost:4173/tour-fee/`。应验证城市首页、计划生成、机场详情搜索、状态页、城市图片、3D 地球纹理和轻量地图都可加载；开发者工具里不会有发往 `/api/` 的静态站点网络请求。预览时需要与构建保持相同 `PAGES_BASE_PATH`。也可用 `npm run build:pages -- --base=/tour-fee/` 覆写构建路径。Pages 产物独立写入 `dist-pages/`，不会覆盖本机 Node 服务使用的 `dist/`。

回到本地 Node 模式时，在 PowerShell 清除 `PAGES_BASE_PATH` 和 `VITE_STATIC_DATA` 环境变量后运行 `npm run dev`，或 `npm run build` 再 `npm start`。原 `/api/*` 服务继续有效。`build:pages` 在子进程里设置静态模式，不会自行改变终端里的环境变量。

## 数据文件与隐私边界

- `scripts/export-static-data.mjs` 产生被 Git 忽略的 `public/static-data/manifest.json` 和带内容哈希的目录、状态、机场索引文件；Vite 将它们复制到 `dist-pages/` 静态发布目录。普通 `npm run build` 仍输出 `dist/`。
- 默认导出使用内存 SQLite，不会隐式读取本机 `data/travel.sqlite`。维护工作流显式使用 runner 临时目录的独立数据库，并将其中仅包含公共来源的快照放进 Actions 缓存，供下次失败时保留旧参考值。该数据库从不进入 Git 提交或 Pages artifact。
- 导出仅包含公共目录、来源状态与简要更新时间；Windows 调度配置、本机路径、原始错误、观察记录 payload、环境变量和浏览器旅行存档不导出。
- 目录与机场索引附带 gzip 文件。支持 `DecompressionStream` 的浏览器优先下载压缩版本；不支持或压缩加载失败时退回普通 JSON。机场完整索引仅在首次打开机场查询时加载，搜索分页与 Node API 的规则相同：默认 40、最多 100，支持城市 ID、机场代码、城市名和去重音搜索。
- `src/api.mjs` 的 `apiFetch` 在静态模式返回兼容 fetch 的 Response；`POST /api/plan` 在内存中调用共享规划器，绝不将项目上传到静态托管平台。外部订票/酒店链接依然跳转经营者，未接入实时库存的项目继续明确标注估算或待补价。

## 每日维护

`maintain-data.yml` 每日 03:23 UTC（北京时间 11:23）调用同一个发布工作流，并运行现有 `npm run update:data`。它更新已接入汇率和官方票价、按原规则每七天更新机场资料，并轮询经营者公开页面；没有机器访问权限或价格解析不确定时保留上次成功值。酒店与城市食宿的编辑预算不会因重新构建变成官方实价。

部分来源失败会产生 Actions warning，仍发布可验证旧快照，页面保留真实核验日期与失败状态。缓存被清理时退回版本库中的有日期参考值。工作流不把更新结果写回 Git，不需要保存个人访问令牌；下一次发布通过独立公共数据缓存延续维护状态。

GitHub 定时任务只在默认分支执行，可能因平台负载延迟；公共仓库 60 天没有活动时可能被暂停。可在 Actions 页重新启用或手动运行维护工作流，不能把 cron 配置视为每天一定成功的保证。[GitHub schedule 事件文档](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

发布元数据的 `base_path` 取自 GitHub 官方 action 输出；自定义域名可能为空，此时规范化为 `/`。[configure-pages 输出定义](https://github.com/actions/configure-pages/blob/main/action.yml)
