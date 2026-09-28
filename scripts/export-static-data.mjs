import { mkdirSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { createAirportIndex } from '../shared/static-airports.mjs';
import { normalizeBasePath } from '../shared/public-paths.mjs';
import { summarizeCatalog } from '../shared/catalog-delivery.mjs';

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
  const result = pick(catalog, ['cities', 'airportCities', 'airportCityAliases', 'rates', 'priceSamples', 'experienceMaintenance', 'lastUpdated', 'providerStatus']);
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
  // In-memory builds are seeded from the versioned public-source snapshot.
  process.env.TRAVEL_DB_PATH ||= ':memory:';
  const [{ getCatalog, dataStatus, getAirportInventory }] = await Promise.all([import('../server/catalog.mjs')]);
  const generatedAt = new Date().toISOString();
  const catalog = publicCatalog(getCatalog(), generatedAt), rawStatus = dataStatus();
  const status = {
    ...pick(rawStatus, ['lastUpdated', 'rates', 'providerStatus', 'cityCount', 'airportCityCount', 'priceSampleCount', 'attractionCount', 'note']),
    airportCoverage: catalog.airportCoverage, experienceMaintenance: catalog.experienceMaintenance, sources: catalog.sources,
    history: (rawStatus.history || []).map(row => pick(row, ['sourceId', 'fetchedAt', 'status'])),
    deployment: catalog.deployment,
    schedule: { mode: 'local-maintenance', label: '本机维护后发布预览', timezone: 'Asia/Shanghai',
      note: '本机维护主数据库与原始资产；关机期间暂停，恢复后续跑。GitHub 检查来源并发布已保存的数据，正式部署后可将维护调度迁至服务器。',
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
  const cityDetails = Object.fromEntries(catalog.cities.map(city => [city.id, writePart(`city-${city.id}`, { ...city, detailStatus: 'loaded' })]));
  const manifest = { version: 2, generatedAt, basePath: normalizeBasePath(basePath), cityDetails,
    catalog: writePart('catalog', summarizeCatalog(catalog)), dataStatus: writePart('data-status', status),
    legacyAirportCities: writePart('legacy-airport-cities', catalog.airportCities),
    airports: writePart('airports-index', createAirportIndex(getAirportInventory())) };
  writeFileSync(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  // Only old, specifically named generated files in this exact directory are removed.
  for (const entry of readdirSync(outputDir, { withFileTypes: true })) {
    if (entry.isFile() && !published.has(entry.name) && /^(catalog|data-status|airports-index|legacy-airport-cities|city-[a-z0-9-]+)-[a-f0-9]{16}\.json(?:\.gz)?$/.test(entry.name)) {
      const target = resolve(outputDir, entry.name);
      if (basename(target) !== entry.name || resolve(target, '..') !== resolve(outputDir)) throw new Error('拒绝清理导出目录之外的路径');
      unlinkSync(target);
    }
  }
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await exportStaticData(), null, 2));
