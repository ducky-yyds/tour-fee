import { readSnapshot, sourceStatuses } from './db.mjs';
import { updateData } from '../scripts/update-data.mjs';

export const MAINTENANCE_CONFIG = { enabled: process.env.AUTO_UPDATE === '1', intervalHours: Math.max(1, Math.min(168, Number(process.env.UPDATE_INTERVAL_HOURS) || 24)) };
let running = false;
export async function updateWhenDue() {
  if (!MAINTENANCE_CONFIG.enabled || running) return;
  const previous = readSnapshot('updater-run');
  const sourceAttempts = sourceStatuses().map(s => s.attemptedAt).filter(Boolean).sort();
  const lastAttempt = previous?.value.startedAt || sourceAttempts.at(-1);
  if (lastAttempt && Date.now() - Date.parse(lastAttempt) < MAINTENANCE_CONFIG.intervalHours * 3600000) return;
  running = true;
  try {
    const results = await updateData();
    console.log(`Public data update: ${results.map(r => `${r.id}=${r.status}`).join(', ')}`);
  } catch (error) { console.error(`Public data update failed: ${error.message}`); }
  finally { running = false; }
}
export function startMaintenance() {
  if (!MAINTENANCE_CONFIG.enabled) return () => {};
  const first = setTimeout(updateWhenDue, 1500);
  const periodic = setInterval(updateWhenDue, 15 * 60 * 1000);
  first.unref(); periodic.unref();
  return () => { clearTimeout(first); clearInterval(periodic); };
}
