import { exportStaticData } from './export-static-data.mjs';
import { normalizeBasePath } from '../shared/public-paths.mjs';
import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
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
const outputDir = resolve('dist-pages');
const publishedBytes = readdirSync(outputDir, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile())
  .reduce((sum, entry) => sum + statSync(resolve(entry.parentPath, entry.name)).size, 0);
console.log(`Published site: ${(publishedBytes / 1048576).toFixed(2)} MiB.`);
if (publishedBytes > 1_000_000_000) throw new Error('Pages 产物超过 1 GB；请先缩小大型卡片照片或整理未使用素材，再发布。');
