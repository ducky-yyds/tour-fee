import { mkdirSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { createAirportIndex } from '../shared/static-airports.mjs';
import { normalizeBasePath } from '../shared/public-paths.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const pick = (value, keys) => Object.fromEntries(keys.filter(key => value?.[key] !== undefined).map(key => [key, value[key]]));
const sourceKeys = ['id', 'name', 'label', 'url', 'kind', 'type', 'status', 'attemptedAt', 'successAt', 'checkedAt'];
function cleanAirportCoverage(coverage) {
  if (!coverage) return coverage;
  return { ...coverage, maintenance: coverage.maintenance ? {
    ...pick(coverage.maintenance, ['version', 'source', 'status', 'lastAttemptAt', 'lastSuccessAt', 'refreshIntervalDays', 'counts']),
    sources: (coverage.maintenance.sources || []).map(s => pick(s, ['kind', 'url', 'checkedAt', 'rowCount'])),
  } : null };
}
export function publicCatalog(catalog, generatedAt) {
  const result = pick(catalog, ['cities', 'airportCities', 'rates', 'priceSamples', 'experienceMaintenance', 'lastUpdated', 'providerStatus']);
  result.airportCoverage = cleanAirportCoverage(catalog.airportCoverage);
  result.sources = (catalog.sources || []).map(source => pick(source, sourceKeys));
  if (result.experienceMaintenance?.audit) {
    const audit = result.experienceMaintenance.audit;
    result.experienceMaintenance = { ...result.experienceMaintenance, audit: {
      ...pick(audit, ['updatedAt', 'checkedThisRun', 'totalSources']),
      sources: (audit.sources || []).map(s => pick(s, ['url', 'checkedAt', 'status', 'priceVerified', 'httpStatus', 'changed'])),
      review: (audit.review || []).map(s => pick(s, ['id', 'experienceId', 'cityId', 'name', 'sourceUrl', 'url', 'status', 'checkedAt'])),
    } };
  }
  result.deployment = { mode: 'static', generatedAt, note: '数据由构建时导出；计划与预算在浏览器计算，不会上传旅行项目。' };
  return result;
}

export async function exportStaticData({ outputDir = resolve(root, 'public/static-data'), basePath = process.env.PAGES_BASE_PATH || '/' } = {}) {
  // Defaulting to memory prevents exporting machine-specific database contents.
  // CI explicitly supplies a temporary public-source-only DB for maintenance.
  process.env.TRAVEL_DB_PATH ||= ':memory:';
  const [{ getCatalog, dataStatus, getAirportInventory }] = await Promise.all([import('../server/catalog.mjs')]);
  const generatedAt = new Date().toISOString();
  const catalog = publicCatalog(getCatalog(), generatedAt), rawStatus = dataStatus();
  const status = {
    ...pick(rawStatus, ['lastUpdated', 'rates', 'providerStatus', 'cityCount', 'airportCityCount', 'priceSampleCount', 'attractionCount', 'note']),
    airportCoverage: catalog.airportCoverage, experienceMaintenance: catalog.experienceMaintenance, sources: catalog.sources,
    history: (rawStatus.history || []).map(row => pick(row, ['sourceId', 'fetchedAt', 'status'])),
    deployment: catalog.deployment,
    schedule: { mode: 'github-actions', label: 'GitHub Actions 每日更新并重新发布', timezone: 'UTC', cron: '23 3 * * *',
      note: '定时任务由 GitHub 执行，可能延迟；页面只显示最近成功发布的快照。无需本机持续开机。',
      builtIn: { enabled: false, activeWhileServerRuns: false }, windowsTask: null,
      lastRun: rawStatus.schedule?.builtIn?.lastRun ? {
        ...pick(rawStatus.schedule.builtIn.lastRun, ['startedAt', 'completedAt']),
        results: (rawStatus.schedule.builtIn.lastRun.results || []).map(row => pick(row, ['id', 'status', 'asOf'])),
      } : null },
  };
  mkdirSync(outputDir, { recursive: true });
  const published = new Set(['manifest.json']);
  const writePart = (name, value) => {
    const bytes = Buffer.from(JSON.stringify(value));
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
    const file = `${name}-${hash}.json`, gzip = `${file}.gz`, compressed = gzipSync(bytes, { level: 9 });
    writeFileSync(resolve(outputDir, file), bytes);
    writeFileSync(resolve(outputDir, gzip), compressed);
    published.add(file); published.add(gzip);
    return { file, gzip, bytes: bytes.length, gzipBytes: compressed.length };
  };
  const manifest = { version: 1, generatedAt, basePath: normalizeBasePath(basePath),
    catalog: writePart('catalog', catalog), dataStatus: writePart('data-status', status),
    airports: writePart('airports-index', createAirportIndex(getAirportInventory())) };
  writeFileSync(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  // Only old, specifically named generated files in this exact directory are removed.
  for (const entry of readdirSync(outputDir, { withFileTypes: true })) {
    if (entry.isFile() && !published.has(entry.name) && /^(catalog|data-status|airports-index)-[a-f0-9]{16}\.json(?:\.gz)?$/.test(entry.name)) {
      const target = resolve(outputDir, entry.name);
      if (basename(target) !== entry.name || resolve(target, '..') !== resolve(outputDir)) throw new Error('拒绝清理导出目录之外的路径');
      unlinkSync(target);
    }
  }
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await exportStaticData(), null, 2));
