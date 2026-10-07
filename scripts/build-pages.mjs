import { exportStaticData } from './export-static-data.mjs';
import { normalizeBasePath } from '../shared/public-paths.mjs';
import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const args = process.argv.slice(2);
const index = args.indexOf('--base');
const explicit = index >= 0 ? args[index + 1] : args.find(arg => arg.startsWith('--base='))?.slice(7);
if (index >= 0 && !explicit) throw new Error('--base 需要路径，例如 /tour-fee/');
const repo = (process.env.GITHUB_REPOSITORY || '').split('/')[1];
process.env.PAGES_BASE_PATH = normalizeBasePath(explicit ?? process.env.PAGES_BASE_PATH ?? (repo && !repo.endsWith('.github.io') ? `/${repo}/` : '/'));
process.env.VITE_STATIC_DATA = 'true';
const manifest = await exportStaticData({ basePath: process.env.PAGES_BASE_PATH });
console.log(`Static data exported: catalog ${(manifest.catalog.gzipBytes / 1048576).toFixed(2)} MiB gzip; airport index ${(manifest.airports.gzipBytes / 1048576).toFixed(2)} MiB gzip (loaded on demand).`);
const { build } = await import('vite');
await build({ mode: 'pages' });
const imageOptimizer = fileURLToPath(new URL('./optimize-pages-images.py', import.meta.url));
const pythonCommands = process.env.PYTHON
  ? [[process.env.PYTHON, []]]
  : process.platform === 'win32'
    ? [['py', ['-3']], ['python', []], ['python3', []]]
    : [['python3', []], ['python', []]];
let imageOptimizationStarted = false;
for (const [command, prefix] of pythonCommands) {
  const result = spawnSync(command, [...prefix, imageOptimizer], { stdio: 'inherit' });
  if (result.error?.code === 'ENOENT') continue;
  if (result.error) throw result.error;
  imageOptimizationStarted = true;
  if (result.status !== 0) throw new Error(`Pages 图片副本压缩失败（${result.signal || result.status}）。请检查 Python/Pillow 与构建日志。`);
  break;
}
if (!imageOptimizationStarted) throw new Error('Pages 预览构建需要 Python 3 和 requirements-maintenance.txt 中固定版本的 Pillow。');
const outputDir = resolve('dist-pages');
const publishedBytes = readdirSync(outputDir, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile())
  .reduce((sum, entry) => sum + statSync(resolve(entry.parentPath, entry.name)).size, 0);
console.log(`Published site: ${(publishedBytes / 1048576).toFixed(2)} MiB.`);
if (publishedBytes >= 950_000_000) throw new Error('Pages 预览产物需小于 950 MB，以保留发布空间；本地完整图片不受预览压缩影响。');
