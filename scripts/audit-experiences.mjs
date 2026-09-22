import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { ROOT } from '../server/db.mjs';
import { readExperienceEntries } from '../server/experience-catalog.mjs';

// Source health is separate from price verification: an HTTP 200 never certifies a price.
export async function auditExperiences({ limit = 12 } = {}) {
  const filename = resolve(ROOT, 'data/experience-audit.json');
  const read = async (name, fallback) => {
    try { return JSON.parse(await readFile(resolve(ROOT, name), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
  };
  const entries = readExperienceEntries();
  const previous = await read('data/experience-audit.json', { sources: [] });
  const urls = [...new Set(entries.flatMap(e => [e.sourceUrl, e.bookingUrl, ...e.priceOptions.map(o => o.sourceUrl)]).filter(url => /^https:\/\//.test(url || '')))];
  const records = new Map(previous.sources.map(row => [row.url, row]));
  const queue = urls.filter(url => !records.get(url)?.checkedAt || Date.now() - Date.parse(records.get(url).checkedAt) > 7 * 86400000)
    .sort((a, b) => (records.get(a)?.checkedAt || '').localeCompare(records.get(b)?.checkedAt || ''))
    .slice(0, Math.max(1, Math.min(150, limit)));
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(3, queue.length) }, async () => {
    while (cursor < queue.length) {
      const url = queue[cursor++], old = records.get(url);
      const row = { url, checkedAt: new Date().toISOString(), status: 'unknown', priceVerified: false };
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'TusuanTravelBudget/1.0 (weekly public reference source check)' } });
        row.httpStatus = response.status;
        row.finalUrl = response.url;
        if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`); }
        const reader = response.body.getReader();
        const chunks = []; let size = 0;
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          size += value.byteLength;
          if (size > 2_000_000) { await reader.cancel(); row.truncated = true; break; }
          chunks.push(value);
        }
        row.contentHash = createHash('sha256').update(Buffer.concat(chunks)).digest('hex');
        row.status = 'reachable';
        row.changed = !!old?.contentHash && old.contentHash !== row.contentHash;
        row.note = row.changed ? '页面内容有变化，价格与服务需复核；未自动覆盖。' : '来源可访问；这不代表票价、房态或菜单已重新核验。';
      } catch (error) { row.status = 'unreachable'; row.note = `${error.message}; 保留原资料，等待复核。`; }
      records.set(url, row);
    }
  }));
  const sources = urls.map(url => records.get(url) || { url, status: 'pending', priceVerified: false });
  const review = entries.map(e => {
    const reasons = [];
    if ([e.sourceUrl, e.bookingUrl].some(url => records.get(url)?.status === 'unreachable')) reasons.push('来源或预订页面暂不可访问');
    if (e.priceOptions.some(o => o.type === 'official' && (!o.checkedAt || Date.now() - Date.parse(o.checkedAt) > 30 * 86400000))) reasons.push('人工官方价格超过30天未复核');
    if ([e.sourceUrl, ...e.priceOptions.map(o => o.sourceUrl)].some(url => records.get(url)?.changed)) reasons.push('来源页面内容变化，需确认价格与服务');
    return { experienceId: e.id, name: e.name, cityId: e.cityId, reasons };
  }).filter(e => e.reasons.length);
  const result = { updatedAt: new Date().toISOString(), checkedThisRun: queue.length, totalSources: urls.length, sources, review,
    note: '每次维护最多检查12个超7天未检查的公开链接；HTTP状态及页面哈希只用于人工复核队列，不会把估算标成已核验价格。专用价格适配器另外更新官方报价。' };
  const temporary = filename + `.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(result, null, 2) + '\n');
  await rename(temporary, filename);
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await auditExperiences({ limit: Number(process.argv[2]) || 12 });
  console.log(JSON.stringify({ checked: result.checkedThisRun, total: result.totalSources, reachable: result.sources.filter(s => s.status === 'reachable').length, review: result.review.length }));
}
