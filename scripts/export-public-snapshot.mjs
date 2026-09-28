import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** The operational DB is private/local. Only validated public source values enter Git. */
export function exportPublicSnapshot() {
  const path = process.env.TRAVEL_DB_PATH || resolve(ROOT, 'data/travel.sqlite');
  if (path === ':memory:') throw new Error('A persistent source database is required');
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const statuses = db.prepare('SELECT id,name,url,kind,status,attempted_at,success_at,message FROM source_status ORDER BY id').all();
    const allowed = new Set(statuses.map(s => s.id));
    const snapshots = db.prepare('SELECT key,value,updated_at FROM snapshots ORDER BY key').all().filter(row => allowed.has(row.key));
    const result = { version: 1, exportedAt: new Date().toISOString(), snapshots, sourceStatus: statuses };
    const target = resolve(ROOT, 'data/public-source-snapshot.json');
    writeFileSync(`${target}.tmp`, JSON.stringify(result, null, 2) + '\n'); renameSync(`${target}.tmp`, target);
    return { snapshots: snapshots.length, sources: statuses.length, file: 'data/public-source-snapshot.json' };
  } finally { db.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) console.log(JSON.stringify(exportPublicSnapshot()));
