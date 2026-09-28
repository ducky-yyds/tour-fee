import { spawnSync, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { hostname } from 'node:os';
import { createSnapshot } from './archive-project.mjs';
import { exportPublicSnapshot } from './export-public-snapshot.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const storage = resolve(ROOT, 'storage');
mkdirSync(storage, { recursive: true });
const lock = resolve(storage, 'maintenance.lock'), stateFile = resolve(storage, 'maintenance-state.json');
if (existsSync(lock)) {
  const previous = JSON.parse(readFileSync(lock, 'utf8'));
  if (previous.host && previous.host !== hostname()) throw new Error('Maintenance lock belongs to another host; cannot safely recover it');
  let alive = true;
  try { process.kill(previous.pid, 0); } catch (error) { if (error.code === 'ESRCH') alive = false; }
  if (alive) { console.log('Local maintenance is already running; no concurrent writer started.'); process.exit(0); }
  renameSync(lock, `${lock}.interrupted-${Date.now()}`);
}
writeFileSync(lock, JSON.stringify({ pid: process.pid, host: hostname(), startedAt: new Date().toISOString() }), { flag: 'wx' });
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : { version: 1 };
const run = { id: randomUUID(), startedAt: new Date().toISOString(), steps: [] };
function save() {
  if (typeof protectedBefore !== 'undefined') rememberOwnedFiles();
  writeFileSync(`${stateFile}.tmp`, JSON.stringify({ ...state, lastRun: run }, null, 2) + '\n'); renameSync(`${stateFile}.tmp`, stateFile);
}
function git(parameters) { return execFileSync('git', parameters, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
const hasRepository = (() => {
  try { return resolve(git(['rev-parse', '--show-toplevel'])).toLowerCase() === ROOT.toLowerCase(); }
  catch { return false; }
})();
function changed() {
  if (!hasRepository) return [];
  return execFileSync('git', ['-c', 'core.quotepath=false', 'status', '--porcelain=v1', '-z', '--untracked-files=all'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean).map(line => line.slice(3));
}
const dirtyBefore = new Set(changed());
const publicDataPath = path => /^(data\/.*\.json|public\/images\/[^/]+\.(?:jpg|jpeg|png|webp|svg))$/i.test(path);
const fileHash = path => existsSync(resolve(ROOT, path)) ? createHash('sha256').update(readFileSync(resolve(ROOT, path))).digest('hex') : 'deleted';
const protectedBefore = new Set([...dirtyBefore].filter(path => !state.ownedFiles?.[path] || state.ownedFiles[path] !== fileHash(path)));
const protectedContent = [...protectedBefore].filter(path => /^(data|public|src|shared|server|scripts)\//.test(path) && path !== 'data/experience-audit.json');
function rememberOwnedFiles() {
  state.ownedFiles ||= {};
  const paths = new Set(changed());
  for (const path of Object.keys(state.ownedFiles)) if (!paths.has(path)) delete state.ownedFiles[path];
  for (const path of paths) if (publicDataPath(path) && !protectedBefore.has(path)) state.ownedFiles[path] = fileHash(path);
}
const environment = { ...process.env, AUTO_UPDATE: '0', UPDATE_SKIP_EXPERIENCE_AUDIT: protectedBefore.has('data/experience-audit.json') ? '1' : process.env.UPDATE_SKIP_EXPERIENCE_AUDIT || '0' };
const pythonLauncher = process.env.ROAMLY_PYTHON || process.env.PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
const python = execFileSync(pythonLauncher, [...(process.platform === 'win32' && pythonLauncher === 'py' ? ['-3'] : []), '-c', 'import sys; print(sys.executable)'], { encoding: 'utf8', windowsHide: true }).trim();
const pythonArgs = parameters => ['-X', 'utf8', ...parameters];
function step(name, command, parameters, timeout = 20 * 60_000) {
  console.log(JSON.stringify({ stage: name, startedAt: new Date().toISOString() }));
  const start = Date.now();
  const result = spawnSync(command, parameters, { cwd: ROOT, env: environment, stdio: 'inherit', windowsHide: true, timeout });
  const record = { name, status: result.status === 0 ? 'ok' : 'error', elapsedMs: Date.now() - start, exitCode: result.status, ...(result.error ? { error: result.error.message } : {}) };
  run.steps.push(record); save();
  return record.status === 'ok';
}
function publishChanges() {
  if (!hasRepository) return { status: 'local-only', reason: 'Standalone deployment: archived local data is ready; no GitHub repository is required' };
  // Refuse to mix staged work or an in-progress merge with an automated data commit.
  if (git(['diff', '--cached', '--name-only']) || existsSync(resolve(ROOT, '.git/MERGE_HEAD'))) return { status: 'deferred', reason: 'Existing staged changes or merge; local archive is retained' };
  const branch = git(['branch', '--show-current']);
  if (!['main', 'master'].includes(branch)) return { status: 'deferred', reason: 'Automatic preview publishing only operates on main/master' };
  const safe = path => publicDataPath(path) && !protectedBefore.has(path) && state.ownedFiles?.[path] === fileHash(path);
  const paths = changed().filter(safe);
  // Unexpected local source edits can invalidate a supposedly data-only build.
  const protectedData = [...protectedBefore].filter(path => /^(data|public|src|shared|server|scripts)\//.test(path) && path !== 'data/experience-audit.json');
  if (protectedData.length) return { status: 'deferred', reason: 'Pre-existing working edits are preserved', paths: protectedData };
  const pending = state.pendingPreviewCommit;
  let ahead;
  try { ahead = git(['log', '--format=%H', '@{upstream}..HEAD']).split('\n').filter(Boolean); }
  catch { return { status: 'deferred', reason: 'An upstream branch is required for automatic preview publication' }; }
  if (ahead.some(commit => commit !== pending)) return { status: 'deferred', reason: 'Unpublished commits outside this maintenance task are preserved for explicit publication' };
  // Retry the previous commit before creating another one. Repeated network failures
  // must not accumulate a chain that can no longer be identified as task-owned.
  if (pending && pending === git(['rev-parse', 'HEAD'])) {
    git(['push', 'origin', branch]); delete state.pendingPreviewCommit; save();
    if (!paths.length) return { status: 'published', commit: pending, files: 0 };
  }
  if (!paths.length) return { status: 'unchanged' };
  for (let index = 0; index < paths.length; index += 50) git(['add', '--', ...paths.slice(index, index + 50)]);
  try { git(['-c', 'user.name=Tusuan data maintenance', '-c', 'user.email=maintenance@users.noreply.github.com', 'commit', '-m', 'Maintain archived public destination data [skip tests] [skip refresh]']); }
  catch (error) {
    for (let index = 0; index < paths.length; index += 50) git(['restore', '--staged', '--', ...paths.slice(index, index + 50)]);
    throw error;
  }
  state.pendingPreviewCommit = git(['rev-parse', 'HEAD']); save();
  git(['push', 'origin', branch]);
  delete state.pendingPreviewCommit;
  return { status: 'published', commit: git(['rev-parse', 'HEAD']), files: paths.length };
}
function stagePublicMedia() {
  const mediaRoot = resolve(process.env.MEDIA_ROOT || resolve(ROOT, 'public/images'));
  const publicImages = resolve(ROOT, 'public/images');
  if (mediaRoot === publicImages) return;
  // These are reproducible served derivatives, never private originals. Stage a copy for GitHub preview.
  const visit = (source, target) => {
    mkdirSync(target, { recursive: true });
    for (const item of readdirSync(source, { withFileTypes: true })) {
      if (item.isSymbolicLink()) throw new Error('Refusing a symbolic link in served media');
      if (item.isDirectory()) visit(resolve(source, item.name), resolve(target, item.name));
      else if (item.isFile()) {
        const destination = resolve(target, item.name);
        const relativePath = relative(ROOT, destination).replaceAll('\\', '/');
        if (protectedBefore.has(relativePath)) throw new Error(`Preview media has a pre-existing edit: ${relativePath}`);
        copyFileSync(resolve(source, item.name), destination);
      }
    }
  };
  visit(mediaRoot, publicImages);
}

try {
  // Both inventories surround every downloader/importer. Original bytes never depend on a preview build.
  if (!step('archive-existing-assets', python, pythonArgs(['scripts/archive_assets.py', '--inventory']))) throw new Error('Archive inventory failed; no image updates were started');
  if (protectedContent.length) {
    // Preserve hand edits BEFORE an importer/collector can replace canonical files.
    // The next scheduled run can continue after those edits have been committed.
    run.backup = await createSnapshot({ label: 'preexisting-edits' });
    run.publish = { status: 'deferred', reason: 'Pre-existing working edits were archived; data writers were not started', paths: protectedContent };
    run.status = 'deferred'; run.completedAt = new Date().toISOString(); save();
    console.log(JSON.stringify({ status: run.status, backup: run.backup, publish: run.publish }, null, 2));
  } else {
  if (!args.has('--offline')) {
    const discoveryDue = !state.discoveryCompletedAt || Date.now() - Date.parse(state.discoveryCompletedAt) >= 7 * 86400_000;
    if (discoveryDue || args.has('--discover')) {
      const coveragePath = resolve(ROOT, 'data/destination-coverage.json');
      const priorCoverage = existsSync(coveragePath) ? JSON.parse(readFileSync(coveragePath, 'utf8')) : null;
      const discoveryArgs = ['scripts/discover-destinations.py', '--time-budget-seconds', '1200', ...(priorCoverage?.sourceScansComplete ? ['--refresh'] : [])];
      if (step('discover-global-destinations', python, pythonArgs(discoveryArgs), 22 * 60_000)) {
        const coverage = existsSync(coveragePath) ? JSON.parse(readFileSync(coveragePath, 'utf8')) : null;
        if (coverage?.sourceScansComplete) state.discoveryCompletedAt = new Date().toISOString();
      }
    }
    step('identify-destination-candidates', python, pythonArgs(['scripts/discover-destinations.py', '--identity-only', '--enrich-limit', '500', '--time-budget-seconds', '900']), 17 * 60_000);
    step('refresh-public-prices', process.execPath, ['scripts/update-data.mjs']);
  }
  const imported = step('import-reviewed-content', process.execPath, ['scripts/import-expansion.mjs', '--refresh']);
  if (!imported) throw new Error('Source package import failed; preview kept unchanged');
  if (!args.has('--offline')) {
    // Spawn each actual writer directly so a timeout cannot leave a wrapper's
    // child writing media while the following inventory/snapshot is running.
    step('recover-reviewed-item-photographs', python, pythonArgs(['scripts/complete-media.py', '--phase=exact', '--kinds=food,hotel,experience,place', '--photo-packs-only', '--thumb-width=400']));
    step('recover-reviewed-place-photographs', python, pythonArgs(['scripts/complete-media.py', '--phase=exact', '--reviewed-places-only', '--thumb-width=400']));
    const directPacks = resolve(ROOT, 'data/direct-photo-expansion');
    if (existsSync(directPacks)) for (const file of readdirSync(directPacks).filter(file => file.endsWith('.json')).sort()) {
      step(`recover-direct-photographs:${file}`, python, pythonArgs(['scripts/import-direct-photos.py', resolve(directPacks, file), '--missing-only']));
    }
  }
  if (!step('archive-updated-assets', python, pythonArgs(['scripts/archive_assets.py', '--inventory']))) throw new Error('Updated assets could not be archived');
  if (!args.has('--offline')) step('recover-source-originals', python, pythonArgs(['scripts/archive_assets.py', '--download', '--limit=200']), 35 * 60_000);
  step('refresh-coverage-report', python, pythonArgs(['scripts/discover-destinations.py', '--offline']));
  stagePublicMedia();
  const valid = step('audit-publishable-catalog', process.execPath, ['scripts/audit-catalog.mjs']);
  run.publicSnapshot = exportPublicSnapshot();
  const productionBuilt = step('build-production', process.execPath, ['scripts/build-production.mjs']);
  save();
  run.backup = await createSnapshot({ label: valid ? 'maintained' : 'needs-review' });
  if (valid && productionBuilt && args.has('--publish') && hasRepository) {
    const built = step('build-preview', process.execPath, ['scripts/build-pages.mjs']);
    run.publish = built ? publishChanges() : { status: 'deferred', reason: 'Preview build failed; local originals and database snapshot remain preserved' };
  } else run.publish = { status: hasRepository ? 'deferred' : 'local-only', reason: !hasRepository ? 'Standalone deployment has no GitHub dependency' : valid ? 'Production build and --publish are required for preview publication' : 'Catalog audit has unresolved findings' };
  state.lastCompletedAt = new Date().toISOString();
  run.completedAt = state.lastCompletedAt;
  run.status = run.steps.some(result => result.status !== 'ok') ? 'partial' : 'ok';
  save();
  console.log(JSON.stringify({ status: run.status, backup: run.backup, publish: run.publish }, null, 2));
  if (!valid || !productionBuilt) process.exitCode = 1;
  }
} catch (error) {
  run.status = 'error'; run.error = error.message; run.completedAt = new Date().toISOString(); save();
  console.error(error.message); process.exitCode = 1;
} finally { unlinkSync(lock); }
