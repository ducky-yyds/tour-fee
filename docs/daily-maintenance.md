# 每日公开数据维护失败与修复

## 失败范围

[Daily public data maintenance #1](https://github.com/ducky-yyds/tour-fee/actions/runs/35838532937) 于 2026-09-23 08:41 UTC 执行，使用提交 `076d6be7064f677978cbc94fc250430b4977e3ff`。复用 `pages.yml` 的 `Run tests` 步骤报告 184 项中 181 项通过、3 项失败；之后的缓存恢复、公开数据刷新、附近地点维护、住宿维护、图片补齐、构建和部署均未执行。

这不是爬取超时或 GitHub Pages 发布失败。上一成功发布为 [run 35826418955](https://github.com/ducky-yyds/tour-fee/actions/runs/35826418955)，其提交信息带有 `[skip tests] [skip refresh]`，因此未触发旧断言。定时事件没有 `head_commit.message`，原工作流的跳过判断未命中，才在首次每日维护中暴露这三个问题。失败任务没有替换线上部署。

## 三个根因

### 美国新城市地区名称与筛选枚举不一致

`tests/global-expansion.test.mjs:22` 首先在 `san-francisco` 失败。失败提交中美国三个新增源包的 24 城均使用 `region: 北美洲`，但 `shared/currencies.mjs` 的地区枚举为亚洲、欧洲、非洲、美洲、大洋洲。`src/App.jsx` 和 `src/ui.jsx` 按 `city.region === region` 筛选，因此用户选择“美洲”时会漏掉这批城市，是实际数据错误。

修复：把 `data/expansion/us-west.json`、`us-east.json`、`us-inland.json` 中这 24 个地区值统一为“美洲”。由正常导入步骤更新 `data/cities.json`，避免只修导出文件而被下一次导入覆盖。没有放宽地区枚举断言。

### 住宿网址断言比采集与页面契约更严格

`tests/experience-expansion.test.mjs:37` 首先在 `stay-athens-osm-node-6907018190`（Cosmopolit）失败。源资料给出的官网是 `http://www.hotel-cosmopolit.com/`；采集器 `scripts/update-stay-library.py` 明确接收合法 HTTP 或 HTTPS 网址，并在没有网站标签时省略 `bookingUrl`。失败提交共有 77 个 HTTP 住宿链接、50 个没有官网链接的条目；它们的资料来源链接仍是 HTTPS。

只读确认页面已有对应行为：`CityHome.jsx` 的 `safeUrl` 支持 HTTP/HTTPS，网站缺失时隐藏官网按钮，详情保留原始资料与地图入口；`ItineraryPlanner.jsx` 使用 `bookingUrl || sourceUrl` 回退到资料页面。无需伪造官网或未经查阅强行把 HTTP 改成 HTTPS。

修复：保留资料来源必须 HTTPS 的断言；`bookingUrl` 可以缺失，提供时必须是字符串、能够解析为合法 URL，协议为 HTTP/HTTPS 且具有主机名。没有把地图来源包装成已核验酒店官网。

### 游览天数测试误把弹性范围当成默认天数

`tests/trip-duration.test.mjs:11` 首先在香港失败。香港默认为 5 天、弹性范围 3–9 天；三亚和龙目岛默认同为 5 天、范围上限为 8 天。`shared/trip-duration.mjs` 已明确接受 1–365 的有序城市方案，并优先使用逐城维护的建议。没有出现默认 30 天的回归。

修复：现有断言继续要求默认推荐为整数 1–7 天；最短、最长也为整数，满足 `1 <= min <= days <= max <= 365`。这样保留短期默认值，同时允许用户为离岛、主题乐园、休息或周边路线延长停留。

## 本次执行与后续维护

本次检查了既有 GitHub 日志、失败提交数据、工作区代码及改动内容，**没有运行单元测试或浏览器测试**。每日维护显式传入 `run_tests: false`，普通代码推送保留原有测试及 `[skip tests]` 规则，手动发布可独立选择是否运行测试。每次发布都执行目录完整性检查与正式构建；目录检查也会拒绝不受支持的地区名称。

恢复流程是先发布修复，再触发真正的每日公开数据维护，检查公开资料刷新、容错回退、静态构建与部署。具体结果以 [每日维护运行记录](https://github.com/ducky-yyds/tour-fee/actions/workflows/maintain-data.yml) 为准；旧失败记录保留用于追溯，不通过删除失败运行伪装成功。

## 可清理的 GitHub 存储

清理前的只读快照保存在本机 `artifacts/github-maintenance-cleanup-inventory.json`。记录了 Actions artifact / cache 的精确 ID、关联运行、创建时间和字节数；下列数字是 2026-09-23 08:54 UTC 盘点值，不是后续清理后的余额。

- 优先清理旧 `github-pages` artifacts：当前共 8 份、3,322,165,526 字节。新发布成功后保留新发布及当前上一成功发布（artifact `10735405504`，run `35826418955`），其余 7 份可释放 2,378,162,811 字节，约 2.38 GB；若新发布前保留当前最近两份，可清理 6 份约 1.47 GB。已有 artifacts 默认一天到期，自动到期后实际可释放量会变化。
- 公开源缓存共 8 份约 44.09 MB，npm 缓存约 28.02 MB。保留 npm 缓存和最近的源快照；新维护成功后可考虑清理更旧源缓存约 38.58 MB，收益远小于 artifacts。缓存中包含上次有效的公开数据，删除前确认有较新成功快照。
- 没有 Releases；仅有 `main` 分支，没有可清理的旧分支。已有 8 个 Pages 部署记录，旧记录主要是历史元数据，清理几乎不释放构建包空间，建议保留。不要删除线上部署、`main` 或重写提交历史。
- 清理针对可重建的旧 artifact 和较旧公共来源缓存，不删除失败日志、线上部署、分支或提交历史。发布上传文件的保留期显式设为 1 天。
