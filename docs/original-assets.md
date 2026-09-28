# 本地完整资产库

`storage/originals/` 是本地资产主库，独立于 `public/` 网页图片和 GitHub Pages。可通过 `ASSET_ARCHIVE_DIR` 指定其它磁盘目录。此目录不提交 Git，也不得被网站构建、缩略图清理或发布包压缩删除。

网页派生图片目录可通过 `MEDIA_ROOT` 指向外部磁盘，服务 URL 仍为 `/images/...`。归档会同时保全项目内现存网页图片与外部目录中的当前版本，沿用同一资产编号；地图、国旗等其它 `public/` 资源照常归档。`MEDIA_ROOT` 与原件库不得互相包含。主要图片维护入口也使用该设置，避免正式部署后把新图写到未被服务的旧目录。

## 使用

```powershell
node scripts/archive-assets.mjs --inventory
node scripts/archive-assets.mjs --download --limit 25
node scripts/archive-assets.mjs --verify
```

首次 `--inventory` 将全部 `public/` 资产按原有字节存入主库（仅排除可重建的 `static-data`），包括照片、国旗、地球纹理、地图、许可文件和图标；保存 `data/` 中的媒体引用、来源、作者、许可、生成提示词及已有明确生成输出。历史版本不删除。重复运行按 SHA-256 去重，不会重复保存相同内容。

`--download` 使用 [Commons imageinfo API](https://www.mediawiki.org/wiki/API:Imageinfo) 的原始 `url`，而非 `thumburl`，逐项恢复全尺寸原件。下载后同时核验来源字节数与 SHA-1，再保存原始编码文件；记录来源版本时间、完整署名/许可元数据和归档 SHA-256。现有缩略图不会被替换，也不会将改扩展名、放大或转 PNG 算作原件。

每次默认最多尝试 25 个原件；`--limit 0` 处理全部待恢复 Commons 资产。失败项按最近尝试时间排到后面，断点续跑不会被首个坏链接卡住。默认单原件上限 256 MiB，可用 `--max-bytes` 调整；超过上限保留明确缺项。`--refresh` 检查更新版本；过去归档的文件继续保留。`--only city-tokyo,routine-breakfast` 可按本地文件名限定。

下载默认最多 3 并发（`--workers 1` 可串行），遵守来源 429 退避。每个原件完成后先同步写入 `recovery-journal.jsonl`，每 25 条和任务结束时合并至完整清单；中断后会重放成功记录，不会仅凭孤儿文件猜测任务完成。需要安全暂停长任务时，在主库中新建 `.stop-after-current` 空文件，程序完成当前最多 3 个请求后落盘退出，并删除该暂停标记。下一次运行继续处理待恢复项目。

Python 3 负责归档与网络请求，Node 命令只是启动包装；Pillow 可选，用于提取本地栅格图尺寸（没有 Pillow 时仍保存字节，Commons 原件尺寸由 API 提供）。代理遵从 `HTTPS_PROXY`、`HTTP_PROXY` 与 Windows 系统设置，不在日志中输出代理凭据。

## 归档状态与结构

- `original`：已有通过来源校验的原始文件，或明确生成输出目录中的生成原件。
- `available-copy`：已保存当前最高可用版本，可能只是历史缩略图；绝不冒充原件。
- `missing`：有媒体引用，但本地没有可存的文件，也没有成功恢复的原件。

`manifest.json` 的 `assets` 以稳定资源路径标识；每项保存 `localPaths`、数据引用、当前与历史来源、所有 `versions`、归档状态及首选版本。每个版本保存 `sha256`、相对于主库的 `path`、字节数、可用尺寸、MIME、角色、归档时间，以及来源版本和许可元数据。`summary` 分别统计原件、可用副本和缺失，不将“副本全部已保全”表述为“原件全部恢复”。

原件与副本均置于 `blobs/<hash前两位>/<sha256>.<原扩展名>`。`source-api-cache/` 保存可追溯的来源查询结果，默认 30 天更新。不存在清理旧 blob 的自动命令；需要清理时必须先完成独立备份并明确审核引用。

当前可自动核验恢复的来源为 Commons。Flickr、商家或其它平台图片先原样保留现有副本和来源；未提供可核验原件端点时继续列作待恢复，不猜测所谓“原图链接”。历史生成文件只恢复本地明确保留的输出与提示词，找不到的原图不会伪造。

## 并发、备份和压缩

所有修改主库的命令使用 `.archive.lock`，文件写入采用临时文件加原子替换。异常中止后，只在锁来自同一主机且系统明确确认该 PID 已退出时，自动将旧锁移入 `lock-history/` 再重新获取锁；活进程、其它主机、信息损坏或存活状态无法确认时均拒绝抢锁。单次失败不会覆盖已经存在的 blob；校验不一致会中止并报告。

媒体维护应在下载/覆盖图片之前和之后分别执行 inventory。`compact-catalog-photos.py --apply` 已强制执行两次归档；前置归档失败则拒绝压缩。压缩只写 `public/` 派生图，原件和历史副本保持原有哈希。

手动运行 `fetch-images.mjs`、`fetch-routine-images.py`、`import-direct-photos.py` 或生成插图导入器时，同名图片覆盖前后也会单独保全目标文件及来源。此保护使用短事务，不在网络下载期间占用归档锁；旧图归档失败则不会覆盖。`--preserve /images/文件名.jpg` 是同一保护的命令行入口，可重复参数处理多个 URL。派生图采用临时文件加原子替换，避免中断留下半张图片。

备份需同时复制整个主库和完整目录/SQLite快照。排除 `.archive.lock`、`*.tmp` 与 `incoming/` 中尚未完成的下载。迁移后使用 `--archive-dir <恢复目录> --verify` 校验全部引用文件；只备份 `manifest.json` 或媒体外链无法恢复完整网站。
