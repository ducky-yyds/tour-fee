import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The cloud job is observational. Canonical datasets, originals and SQLite stay with local maintenance.
const urls = new Set();
function collect(value) {
  if (Array.isArray(value)) return value.forEach(collect);
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (['sourceUrl', 'officialUrl', 'url'].includes(key) && typeof item === 'string' && /^https:\/\//.test(item) && !/\.(jpg|png|webp|svg)(?:\?|$)/i.test(item)) urls.add(item);
    else if (typeof item === 'object') collect(item);
  }
}
for (const dir of ['data/expansion', 'data/experience-expansion']) {
  for (const file of readdirSync(dir).filter(file => file.endsWith('.json'))) collect(JSON.parse(readFileSync(resolve(dir, file), 'utf8')));
}
const list = [...urls].sort(), count = Math.min(20, list.length);
const day = Math.floor(Date.now() / 86400_000), start = list.length ? (day * 20) % list.length : 0;
const checks = [];
for (let index = 0; index < count; index++) {
  const url = list[(start + index) % list.length];
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15_000), headers: { 'User-Agent': 'TusuanSourceHealth/1.0 (+https://github.com/ducky-yyds/tour-fee)' } });
    checks.push({ url, httpStatus: response.status, status: response.ok ? 'reachable' : 'needs-check', priceVerified: false });
  } catch (error) { checks.push({ url, status: 'unreachable', message: error.message, priceVerified: false }); }
}
const report = { checkedAt: new Date().toISOString(), totalSources: list.length, checkedThisRun: checks.length, note: 'Reachability only; does not verify prices, content or original-file preservation.', checks };
mkdirSync('artifacts/source-health', { recursive: true });
writeFileSync('artifacts/source-health/report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ checked: checks.length, reachable: checks.filter(c => c.status === 'reachable').length, unchangedCanonicalData: true }));
