import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DB_PATH = process.env.TRAVEL_DB_PATH || resolve(ROOT, 'data', 'travel.sqlite');
let connection;
export function database() {
  if (connection) return connection;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  connection = new DatabaseSync(DB_PATH);
  connection.exec(`PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS snapshots (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS observations (id INTEGER PRIMARY KEY AUTOINCREMENT, source_id TEXT NOT NULL, fetched_at TEXT NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS observations_source ON observations(source_id, fetched_at DESC);
    CREATE TABLE IF NOT EXISTS source_status (id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL, attempted_at TEXT NOT NULL, success_at TEXT, message TEXT, details TEXT);
    CREATE TABLE IF NOT EXISTS maintenance_lock (key TEXT PRIMARY KEY, acquired_at INTEGER NOT NULL, owner TEXT NOT NULL);
  `);
  return connection;
}
export function readSnapshot(key) {
  const row = database().prepare('SELECT value, updated_at FROM snapshots WHERE key = ?').get(key);
  return row ? { value: JSON.parse(row.value), updatedAt: row.updated_at } : null;
}
export function writeSnapshot(key, value, timestamp = new Date().toISOString()) {
  database().prepare('INSERT INTO snapshots(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at').run(key, JSON.stringify(value), timestamp);
}
export function recordObservation(source, status, payload, message = '') {
  const timestamp = new Date().toISOString();
  const db = database();
  db.prepare('INSERT INTO observations(source_id,fetched_at,status,payload) VALUES(?,?,?,?)').run(source.id, timestamp, status, JSON.stringify(payload));
  const old = db.prepare('SELECT success_at FROM source_status WHERE id = ?').get(source.id);
  const successAt = status === 'ok' ? timestamp : (old?.success_at || null);
  db.prepare('INSERT INTO source_status(id,name,url,kind,status,attempted_at,success_at,message,details) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,url=excluded.url,kind=excluded.kind,status=excluded.status,attempted_at=excluded.attempted_at,success_at=excluded.success_at,message=excluded.message,details=excluded.details').run(source.id, source.name, source.url, source.kind, status, timestamp, successAt, message, JSON.stringify(payload));
  return timestamp;
}
export function sourceStatuses() {
  return database().prepare('SELECT * FROM source_status ORDER BY kind,id').all().map(r => ({ id: r.id, name: r.name, url: r.url, kind: r.kind, status: r.status, attemptedAt: r.attempted_at, successAt: r.success_at, message: r.message, details: JSON.parse(r.details || '{}') }));
}
export function recentObservations(limit = 30) {
  return database().prepare('SELECT source_id AS sourceId,fetched_at AS fetchedAt,status,payload FROM observations ORDER BY id DESC LIMIT ?').all(limit).map(r => ({ ...r, payload: JSON.parse(r.payload) }));
}
export function acquireUpdateLock(owner) {
  const now = Date.now();
  const result = database().prepare('INSERT INTO maintenance_lock(key,acquired_at,owner) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET acquired_at=excluded.acquired_at,owner=excluded.owner WHERE maintenance_lock.acquired_at < ?').run('public-update', now, owner, now - 10 * 60 * 1000);
  return result.changes > 0;
}
export function releaseUpdateLock(owner) { database().prepare('DELETE FROM maintenance_lock WHERE key = ? AND owner = ?').run('public-update', owner); }
