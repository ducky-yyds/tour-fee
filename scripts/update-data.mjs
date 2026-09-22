import { DATA_SOURCES, fetchWithRetry, parseFx, parseTokyoSubway, parseEiffel, parseTokyoTower, parseIchiran } from '../server/sources.mjs';
import { recordObservation, writeSnapshot, readSnapshot, acquireUpdateLock, releaseUpdateLock } from '../server/db.mjs';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseExperienceSource } from '../server/experience-sources.mjs';
import { auditExperiences } from './audit-experiences.mjs';
import { updateAirports } from './update-airports.mjs';

/** Low-frequency public source updates. On any ambiguity, retain the last successful snapshot. */
export async function updateData() {
  const owner = `${process.pid}-${randomUUID()}`;
  if (!acquireUpdateLock(owner)) return [{ id: 'maintenance-lock', status: 'busy', message: 'Another updater is running; no duplicate fetch started' }];
  try {
  const startedAt = new Date().toISOString();
  const results = [];
  try { results.push(await updateAirports({ ifStale: true })); }
  catch (error) { results.push({ id: 'ourairports', status: 'error', error: error.message }); }
  for (const source of DATA_SOURCES) {
    try {
      const response = await fetchWithRetry(source.url, { responseType: source.kind === 'exchange-rates' ? 'json' : 'text' });
      const value = source.id === 'frankfurter' ? parseFx(response) : source.id === 'tokyo-subway' ? parseTokyoSubway(response) : source.id === 'tokyo-tower' ? parseTokyoTower(response) : source.kind === 'official-menu' ? parseIchiran(response, source) : source.kind === 'official-experience' ? parseExperienceSource(source, response) : parseEiffel(response);
      const old = readSnapshot(source.id)?.value;
      // Large price jumps require manual review rather than silently replacing validated values.
      if (old && source.id !== 'frankfurter') {
        const previous = source.kind === 'official-experience' ? value.options.map(option => old.options.find(o => o.optionId === option.optionId && o.currency === option.currency)?.amount) : source.id === 'tokyo-subway' ? Object.values(old.prices) : source.kind === 'official-menu' ? old.items.map(i => i.amount) : [old.low, old.high];
        const next = source.kind === 'official-experience' ? value.options.map(o => o.amount) : source.id === 'tokyo-subway' ? Object.values(value.prices) : source.kind === 'official-menu' ? value.items.map(i => i.amount) : [value.low, value.high];
        if (next.some((amount, i) => !Number.isFinite(previous[i]) || amount / previous[i] > 1.6 || amount / previous[i] < 0.6)) {
          recordObservation(source, 'review', value, 'Price changed by more than the allowed threshold; previous snapshot retained');
          results.push({ id: source.id, status: 'review' });
          continue;
        }
      }
      const timestamp = recordObservation(source, 'ok', value, 'Validated public source; snapshot updated');
      writeSnapshot(source.id, value, timestamp);
      results.push({ id: source.id, status: 'ok', asOf: value.asOf || timestamp });
    } catch (error) {
      recordObservation(source, 'error', { error: error.message }, 'Fetch or validation failed; previous snapshot retained');
      results.push({ id: source.id, status: 'error', error: error.message });
    }
  }
  try {
    const audit = await auditExperiences();
    results.push({ id: 'experience-source-audit', status: 'ok', checked: audit.checkedThisRun, reviewCount: audit.review.length });
  } catch (error) { results.push({ id: 'experience-source-audit', status: 'error', error: error.message }); }
  writeSnapshot('updater-run', { startedAt, completedAt: new Date().toISOString(), results });
  return results;
  } finally { releaseUpdateLock(owner); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await updateData();
  for (const result of results) console.log(JSON.stringify(result));
  if (results.some(r => r.status !== 'ok')) process.exitCode = 1;
}
