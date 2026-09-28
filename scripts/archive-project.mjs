import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync, statSync, lstatSync, copyFileSync, unlinkSync } from 'node:fs';
import { resolve, relative, dirname, sep, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync, backup } from 'node:sqlite';
import { execFileSync } from 'node:child_process';
import { hostname } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CODE_DIRS = ['src', 'server', 'shared', 'scripts', 'tests', 'data', 'docs', 'public', '.github', 'dist'];
const CODE_FILES = ['package.json', 'package-lock.json', 'requirements-maintenance.txt', 'index.html', 'vite.config.js', 'README.md', 'start-app.cmd', '.gitignore', '.gitattributes', '.env.example'];
const cleanPath = value => {
  if (typeof value !== 'string' || !value || value.includes('\\') || isAbsolute(value) || value.includes(':') || value.split('/').some(p => !p || p === '.' || p === '..')) throw new Error(`Unsafe archive path: ${value}`);
  return value;
};
const inside = (base, name) => {
  const result = resolve(base, cleanPath(name));
  if (!result.startsWith(resolve(base) + sep)) throw new Error('Path escaped archive root');
  return result;
};
const writeJson = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, JSON.stringify(value, null, 2) + '\n');
  renameSync(temp, path);
};
async function hash(path) {
  const sha = createHash('sha256');
  for await (const chunk of createReadStream(path)) sha.update(chunk);
  return sha.digest('hex');
}
function walk(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Archive refuses symbolic link: ${name}`);
    if (entry.isDirectory()) return walk(resolve(dir, entry.name), name);
    return entry.isFile() ? [name] : [];
  });
}
const skip = path => /(?:^|\/)(?:__pycache__|node_modules)(?:\/|$)/.test(path) || /\.(?:sqlite(?:-wal|-shm)?|db(?:-wal|-shm)?|lock|tmp|log|pyc)$/.test(path) || path.startsWith('public/static-data/') || path.startsWith('dist/static-data/') || path === 'data/schedule.json';
const objectName = sha => {
  if (!/^[a-f0-9]{64}$/.test(sha)) throw new Error('Invalid SHA-256 in archive');
  return `objects/${sha.slice(0, 2)}/${sha}`;
};
function loadManifest(file) {
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  if (manifest.format !== 'tusuan-project-archive' || manifest.version !== 1 || !Array.isArray(manifest.files) || !manifest.files.length) throw new Error('Unsupported or empty project archive');
  const seen = new Set();
  for (const entry of manifest.files) {
    cleanPath(entry.path); objectName(entry.sha256);
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || seen.has(entry.path)) throw new Error('Invalid/duplicate archive entry');
    seen.add(entry.path);
  }
  if (!seen.has('package.json') || !seen.has('data/cities.json') || !seen.has('data/travel.sqlite')) throw new Error('Archive is missing required project/database files');
  return manifest;
}
function sqliteCheck(file) {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const checks = db.prepare('PRAGMA integrity_check').all();
    if (checks.some(row => Object.values(row)[0] !== 'ok')) throw new Error('SQLite integrity check failed');
    return Object.fromEntries(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(({ name }) => [name, db.prepare(`SELECT count(*) AS n FROM "${name.replaceAll('"', '""')}"`).get().n]));
  } finally { db.close(); }
}
const normalizedAbsolute = value => process.platform === 'win32' ? resolve(value).toLowerCase() : resolve(value);
const nested = (parent, child) => normalizedAbsolute(parent) === normalizedAbsolute(child) || normalizedAbsolute(child).startsWith(normalizedAbsolute(parent) + sep);
function checkStorageLocations(root, store, originals) {
  if (nested(store, originals) || nested(originals, store)) throw new Error('Backup and original stores must be separate, non-nested directories');
  for (const location of [store, originals]) {
    if (location === root || (nested(root, location) && !nested(resolve(root, 'storage'), location))) throw new Error('In-project archive stores must be under storage/');
    for (const directory of CODE_DIRS) if (nested(location, resolve(root, directory)) || nested(resolve(root, directory), location)) throw new Error('Archive stores cannot contain or be inside captured source directories');
  }
}
function acquireFileLock(path) {
  if (existsSync(path)) {
    const previous = JSON.parse(readFileSync(path, 'utf8'));
    if (previous.host !== hostname() || !Number.isSafeInteger(previous.pid) || previous.pid < 1) throw new Error(`Archive lock owner cannot be safely verified: ${path}`);
    let alive = true;
    try { process.kill(previous.pid, 0); } catch (error) { if (error.code === 'ESRCH') alive = false; }
    if (alive) throw new Error(`Archive is in use by process ${previous.pid}`);
    renameSync(path, `${path}.interrupted-${Date.now()}`);
  }
  writeFileSync(path, JSON.stringify({ pid: process.pid, host: hostname(), startedAt: new Date().toISOString() }), { flag: 'wx' });
}
function verifyAssetReferences(manifest, objectRoot) {
  const files = new Map(manifest.files.map(file => [file.path, file]));
  const media = files.get('storage/originals/manifest.json');
  if (!media) throw new Error('Missing original-asset manifest');
  const assets = JSON.parse(readFileSync(inside(objectRoot, objectName(media.sha256)), 'utf8'));
  if (assets.schemaVersion !== 1 || !assets.assets || typeof assets.assets !== 'object') throw new Error('Invalid original-asset manifest');
  for (const asset of Object.values(assets.assets)) {
    if (!Array.isArray(asset.versions)) throw new Error('Invalid asset version history');
    for (const version of asset.versions) {
      cleanPath(version.path);
      const record = files.get(`storage/originals/${version.path}`);
      if (!record || record.sha256 !== version.sha256 || record.bytes !== version.bytes) throw new Error(`Missing/corrupt original-asset reference: ${asset.id}`);
    }
    if (asset.status === 'original' && !asset.versions.some(version => ['source-original', 'generated-original'].includes(version.role))) throw new Error(`Unsubstantiated original status: ${asset.id}`);
  }
  return assets.summary;
}

export async function createSnapshot({ projectRoot = ROOT, backupDir = process.env.PROJECT_BACKUP_DIR || resolve(ROOT, 'storage/backups'), archiveDir = process.env.ASSET_ARCHIVE_DIR || resolve(ROOT, 'storage/originals'), databasePath = process.env.TRAVEL_DB_PATH || resolve(projectRoot, 'data/travel.sqlite'), label = 'snapshot' } = {}) {
  const root = resolve(projectRoot), store = resolve(backupDir), originals = resolve(archiveDir);
  checkStorageLocations(root, store, originals);
  if (databasePath === ':memory:' || !existsSync(databasePath)) throw new Error('Snapshot requires an existing persistent SQLite database');
  if (!existsSync(resolve(originals, 'manifest.json'))) throw new Error('Run archive:assets --inventory before taking a complete snapshot');
  const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${label.replace(/[^a-z0-9-]/gi, '-').slice(0, 32)}-${randomUUID().slice(0, 8)}`;
  mkdirSync(store, { recursive: true });
  const lockPath = resolve(store, 'snapshot.lock');
  // Never steal a lock from a possibly running backup process.
  acquireFileLock(lockPath);
  const temporaryDb = resolve(store, `${id}.sqlite`);
  const originalLock = resolve(originals, '.archive.lock');
  let ownsOriginalLock = false;
  try {
    acquireFileLock(originalLock);
    ownsOriginalLock = true;
    const recoveryJournal = resolve(originals, 'recovery-journal.jsonl');
    if (existsSync(recoveryJournal) && readFileSync(recoveryJournal, 'utf8').trim()) throw new Error('Original recovery has uncheckpointed records; run archive:assets -- --inventory before taking a snapshot');
    const sourceDb = new DatabaseSync(databasePath, { readOnly: true });
    try { await backup(sourceDb, temporaryDb); } finally { sourceDb.close(); }
    const databaseTables = sqliteCheck(temporaryDb);
    const { productionFingerprint } = await import('./lib/build-provenance.mjs');
    const buildInfoPath = resolve(root, 'dist/build-provenance.json');
    const buildInfo = existsSync(buildInfoPath) ? JSON.parse(readFileSync(buildInfoPath, 'utf8')) : null;
    const includeBuild = buildInfo?.version === 1 && buildInfo.mode === 'server' && buildInfo.sourceFingerprint === productionFingerprint(root);
    const servedMedia = resolve(process.env.MEDIA_ROOT || resolve(root, 'public/images'));
    if (nested(servedMedia, store) || nested(store, servedMedia) || nested(servedMedia, originals) || nested(originals, servedMedia)) throw new Error('Served media and private archive/backup stores cannot overlap');
    const externalMedia = servedMedia !== resolve(root, 'public/images');
    if (!existsSync(servedMedia)) throw new Error('Configured MEDIA_ROOT does not exist');
    const candidates = CODE_DIRS.filter(dir => dir !== 'dist' || includeBuild).flatMap(dir => walk(resolve(root, dir), dir)).concat(CODE_FILES.filter(path => existsSync(resolve(root, path))))
      .filter(path => !skip(path) && !(externalMedia && path.startsWith('public/images/'))).map(path => ({ path, source: inside(root, path) }));
    if (externalMedia) candidates.push(...walk(servedMedia).map(path => ({ path: `public/images/${path}`, source: inside(servedMedia, path) })));
    const maintenanceState = resolve(root, 'storage/maintenance-state.json');
    if (existsSync(maintenanceState)) candidates.push({ path: 'storage/maintenance-state.json', source: maintenanceState });
    candidates.push(...walk(originals).filter(path => !path.startsWith('incoming/') && !path.startsWith('.archive.lock') && !path.startsWith('.stop-after-current') && !/(?:\.lock|\.tmp|\.part)$/.test(path)).map(path => ({ path: `storage/originals/${path}`, source: inside(originals, path) })));
    candidates.push({ path: 'data/travel.sqlite', source: temporaryDb });
    const files = [], sourceVersions = [];
    for (const [index, item] of candidates.entries()) {
      const before = statSync(item.source);
      const sha256 = await hash(item.source), object = inside(store, objectName(sha256));
      mkdirSync(dirname(object), { recursive: true });
      if (!existsSync(object)) {
        const temp = `${object}.${randomUUID()}.tmp`;
        copyFileSync(item.source, temp);
        if (await hash(temp) !== sha256) { unlinkSync(temp); throw new Error(`File changed during snapshot: ${item.path}`); }
        renameSync(temp, object);
      } else if (statSync(object).size !== before.size || await hash(object) !== sha256) throw new Error(`Corrupted backup object: ${sha256}`);
      const after = statSync(item.source);
      if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error(`File changed during snapshot: ${item.path}`);
      files.push({ path: item.path, sha256, bytes: before.size });
      sourceVersions.push({ source: item.source, bytes: before.size, mtimeMs: before.mtimeMs });
      if (index && index % 1000 === 0) console.log(JSON.stringify({ stage: 'snapshot', completed: index, total: candidates.length }));
    }
    for (const source of sourceVersions) {
      const current = statSync(source.source);
      if (current.size !== source.bytes || current.mtimeMs !== source.mtimeMs) throw new Error('Source files changed during the snapshot; retry after maintenance finishes');
    }
    let commit = null;
    try {
      const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (normalizedAbsolute(gitRoot) === normalizedAbsolute(root)) commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {}
    const manifest = { format: 'tusuan-project-archive', version: 1, id, createdAt: new Date().toISOString(), node: process.version, codeCommit: commit,
      note: 'Exact working files are included; codeCommit is informational. Credentials and browser-local personal data are excluded. Original acquisition gaps remain in the asset manifest.',
      databaseTables, builtFrontendIncluded: files.some(file => file.path === 'dist/index.html'), files, totalBytes: files.reduce((sum, file) => sum + file.bytes, 0) };
    manifest.assetSummary = verifyAssetReferences(manifest, store);
    const manifestPath = resolve(store, 'snapshots', `${id}.json`);
    writeJson(manifestPath, manifest);
    writeJson(resolve(store, 'latest.json'), { id, manifest: `snapshots/${id}.json`, createdAt: manifest.createdAt });
    return { id, manifestPath, files: files.length, totalBytes: manifest.totalBytes, databaseTables };
  } finally {
    if (existsSync(temporaryDb)) unlinkSync(temporaryDb);
    if (ownsOriginalLock) unlinkSync(originalLock);
    unlinkSync(lockPath);
  }
}

export async function verifySnapshot(manifestFile, objectRoot = resolve(dirname(manifestFile), '..')) {
  const manifest = loadManifest(manifestFile);
  let verified = 0;
  for (const file of manifest.files) {
    const object = inside(objectRoot, objectName(file.sha256));
    if (!existsSync(object) || statSync(object).size !== file.bytes || await hash(object) !== file.sha256) throw new Error(`Missing/corrupt object for ${file.path}`);
    if (file.path.endsWith('.json')) JSON.parse(readFileSync(object, 'utf8').replace(/^\uFEFF/, ''));
    verified++;
  }
  const database = manifest.files.find(file => file.path === 'data/travel.sqlite');
  const tables = sqliteCheck(inside(objectRoot, objectName(database.sha256)));
  if (JSON.stringify(tables) !== JSON.stringify(manifest.databaseTables)) throw new Error('Database counts do not match snapshot');
  const assetSummary = verifyAssetReferences(manifest, objectRoot);
  return { id: manifest.id, verified, totalBytes: manifest.totalBytes, databaseTables: tables, assetSummary };
}

export async function exportSnapshot(manifestFile, output, objectRoot = resolve(dirname(manifestFile), '..')) {
  const manifest = loadManifest(manifestFile), destination = resolve(output);
  if (existsSync(destination)) throw new Error('Export target must not already exist');
  await verifySnapshot(manifestFile, objectRoot);
  const stage = `${destination}.incomplete-${randomUUID()}`;
  mkdirSync(stage, { recursive: true });
  for (const file of manifest.files) {
    const object = objectName(file.sha256), target = inside(stage, object);
    if (existsSync(target)) continue;
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(inside(objectRoot, object), target);
  }
  writeJson(resolve(stage, 'manifest.json'), manifest);
  copyFileSync(fileURLToPath(import.meta.url), resolve(stage, 'restore.mjs'));
  writeFileSync(resolve(stage, 'README.txt'), 'Requires Node.js 24+. Verify: node restore.mjs verify --manifest manifest.json --objects .\nRestore: node restore.mjs restore --manifest manifest.json --objects . --target /absolute/path/to/new-directory\nIf manifest.builtFrontendIncluded is true, start the preserved build directly: node --env-file-if-exists=.env server/index.mjs\nRebuilding/maintaining requires dependency installation: npm ci; python3 -m pip install -r requirements-maintenance.txt; npm run build. See docs/local-deployment.md.\nThis bundle includes the local original archive and explicitly recorded original-file gaps. Secrets and browser personal workspaces are not included.\n');
  await verifySnapshot(resolve(stage, 'manifest.json'), stage);
  renameSync(stage, destination);
  return { id: manifest.id, output: destination, files: manifest.files.length };
}

export async function restoreSnapshot(manifestFile, targetDirectory, objectRoot = resolve(dirname(manifestFile), '..')) {
  const manifest = loadManifest(manifestFile), target = resolve(targetDirectory);
  if (existsSync(target)) throw new Error('Restore requires a new directory; existing projects are never overwritten');
  await verifySnapshot(manifestFile, objectRoot);
  const stage = `${target}.incomplete-${randomUUID()}`;
  mkdirSync(stage, { recursive: true });
  for (const file of manifest.files) {
    const output = inside(stage, file.path);
    mkdirSync(dirname(output), { recursive: true });
    copyFileSync(inside(objectRoot, objectName(file.sha256)), output);
    if (await hash(output) !== file.sha256) throw new Error(`Restore checksum mismatch: ${file.path}`);
  }
  sqliteCheck(resolve(stage, 'data/travel.sqlite'));
  renameSync(stage, target);
  return { id: manifest.id, target, files: manifest.files.length, databaseTables: manifest.databaseTables };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command = 'help', ...args] = process.argv.slice(2);
  const option = name => { const index = args.indexOf(`--${name}`); return index >= 0 ? args[index + 1] : args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3); };
  try {
    let result;
    if (command === 'snapshot') result = await createSnapshot({ label: option('label') || 'snapshot', ...(option('backup-dir') ? { backupDir: option('backup-dir') } : {}) });
    else if (['verify', 'export', 'restore'].includes(command)) {
      const manifest = option('manifest');
      if (!manifest) throw new Error('--manifest is required');
      const objects = option('objects') || (resolve(manifest).endsWith(`${sep}manifest.json`) ? dirname(resolve(manifest)) : resolve(dirname(manifest), '..'));
      if (command === 'verify') result = await verifySnapshot(resolve(manifest), resolve(objects));
      if (command === 'export') { if (!option('output')) throw new Error('--output is required'); result = await exportSnapshot(resolve(manifest), option('output'), resolve(objects)); }
      if (command === 'restore') { if (!option('target')) throw new Error('--target is required'); result = await restoreSnapshot(resolve(manifest), option('target'), resolve(objects)); }
    } else console.log('snapshot [--label name] | verify --manifest file | export --manifest file --output NEW_DIRECTORY | restore --manifest file --target NEW_DIRECTORY [--objects directory]');
    if (result) console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
