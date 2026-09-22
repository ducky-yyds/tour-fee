import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AIRPORT_SOURCE, buildAirportCatalog, parseCsv } from '../shared/airport-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runFile = promisify(execFile);
export const AIRPORT_CSV_SOURCES = ['airports', 'countries', 'regions'].map(kind => ({ kind, url: `https://davidmegginson.github.io/ourairports-data/${kind}.csv` }));
const MAX_BYTES = 64 * 1024 * 1024;
const PYTHON_FETCH = `import sys,urllib.request
req=urllib.request.Request(sys.argv[1],headers={'User-Agent':'TusuanTravelCatalog/1.0'})
with urllib.request.urlopen(req,timeout=35) as response:
 data=response.read(int(sys.argv[2])+1)
 if len(data)>int(sys.argv[2]): raise ValueError('CSV exceeds size limit')
 sys.stdout.buffer.write(data)
`;

async function downloadText(url) {
  if (!process.argv.includes('--python-network')) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(18000), headers: { 'User-Agent': 'TusuanTravelCatalog/1.0' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('CSV exceeds size limit');
      const raw = await response.arrayBuffer();
      if (raw.byteLength > MAX_BYTES) throw new Error('CSV exceeds size limit');
      return new TextDecoder().decode(raw);
    } catch (error) {
      // Python urllib reads the Windows system proxy that Node fetch may not use.
      if (error.message === 'CSV exceeds size limit') throw error;
    }
  }
  const interpreter = process.env.ROAMLY_PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
  const args = process.platform === 'win32' ? ['-3', '-X', 'utf8'] : [];
  const { stdout } = await runFile(interpreter, [...args, '-c', PYTHON_FETCH, url, String(MAX_BYTES)], { timeout: 45000, maxBuffer: MAX_BYTES + 1024, windowsHide: true, encoding: 'utf8' });
  return stdout;
}
async function readJson(filename, fallback) { try { return JSON.parse(await fs.readFile(filename, 'utf8')); } catch { return fallback; } }
async function atomicJson(filename, value) {
  const temp = `${filename}.${randomUUID()}.tmp`;
  try { await fs.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); await fs.rename(temp, filename); }
  finally { await fs.rm(temp, { force: true }); }
}

export async function acquireAirportLock(lockPath, checkedAt) {
  try {
    const lock = await fs.open(lockPath, 'wx');
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: checkedAt, token: randomUUID() }));
    return lock;
  } catch (error) { if (error.code !== 'EEXIST') throw error; }
  // A crashed updater must not permanently disable maintenance. A live process,
  // including one whose age exceeds the normal timeout, always keeps its lock.
  let contents, stat, owner;
  try { [contents, stat] = await Promise.all([fs.readFile(lockPath, 'utf8'), fs.stat(lockPath)]); }
  catch (error) { if (error.code === 'ENOENT') return acquireAirportLock(lockPath, checkedAt); throw error; }
  try { owner = JSON.parse(contents); } catch { owner = null; }
  const age = Date.parse(checkedAt) - stat.mtimeMs;
  const validPid = Number.isInteger(owner?.pid) && owner.pid > 0;
  let live = false;
  if (validPid) {
    try { process.kill(owner.pid, 0); live = true; }
    catch (error) { live = error.code !== 'ESRCH'; }
  }
  if (live || age < (validPid ? 60000 : 10 * 60000)) return null;
  // Serialize crash recovery so two refreshers cannot both remove a newly
  // acquired lock after inspecting the same stale lock. This separate lock is
  // held only around filesystem operations, never around a network request.
  const recoveryPath = `${lockPath}.recovery`;
  let recovery;
  try { recovery = await fs.open(recoveryPath, 'wx'); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    // Recover the short-lived recovery guard too, should a process die during
    // these few filesystem operations. Never clear a guard owned by a live PID.
    let guard, guardStat, guardText;
    try {
      [guardText, guardStat] = await Promise.all([fs.readFile(recoveryPath, 'utf8'), fs.stat(recoveryPath)]);
      try { guard = JSON.parse(guardText); } catch { guard = null; }
      if (Date.parse(checkedAt) - guardStat.mtimeMs < 10 * 60000) return null;
      if (Number.isInteger(guard?.pid) && guard.pid > 0) {
        try { process.kill(guard.pid, 0); return null; } catch (guardError) { if (guardError.code !== 'ESRCH') return null; }
      }
      if (await fs.readFile(recoveryPath, 'utf8') !== guardText) return null;
      await fs.unlink(recoveryPath);
      recovery = await fs.open(recoveryPath, 'wx');
    } catch (guardError) { if (['ENOENT', 'EEXIST'].includes(guardError.code)) return null; throw guardError; }
  }
  try {
    await recovery.writeFile(JSON.stringify({ pid: process.pid, startedAt: checkedAt }));
    if (await fs.readFile(lockPath, 'utf8') !== contents) return null;
    await fs.unlink(lockPath);
    return await acquireAirportLock(lockPath, checkedAt);
  } finally { await recovery.close(); await fs.rm(recoveryPath, { force: true }); }
}

/** Validate all sources before replacing either catalog. Failed refreshes retain the complete previous catalog. */
export async function updateAirports({ ifStale = false, dataDir = path.join(ROOT, 'data'), fetchText = downloadText, minimumAirports = 10000, now = () => new Date(), curatedCities } = {}) {
  await fs.mkdir(dataDir, { recursive: true });
  const maintenancePath = path.join(dataDir, 'airport-maintenance.json');
  const previousMaintenance = await readJson(maintenancePath, {});
  const checkedAt = now().toISOString();
  const age = Date.parse(checkedAt) - Date.parse(previousMaintenance.lastSuccessAt || '');
  if (ifStale && age >= 0 && age < 7 * 86400000) {
    const [airportSnapshot, citySnapshot] = await Promise.all(['airports.json', 'airport-cities.json'].map(name => readJson(path.join(dataDir, name), null)));
    if (airportSnapshot?.version === 1 && airportSnapshot.airports?.length > 0 && citySnapshot?.version === 1 && citySnapshot.cities?.length > 0) {
      return { id: 'ourairports', status: 'ok', skipped: true, reason: 'Updated within seven days', counts: previousMaintenance.counts, lastSuccessAt: previousMaintenance.lastSuccessAt };
    }
  }
  const lockPath = path.join(dataDir, '.airport-update.lock');
  const lock = await acquireAirportLock(lockPath, checkedAt);
  if (!lock) return { id: 'ourairports', status: 'busy' };
  try {
    const fetched = await Promise.all(AIRPORT_CSV_SOURCES.map(async source => ({ ...source, rows: parseCsv(await fetchText(source.url)), checkedAt })));
    const [airports, countries, regions] = fetched;
    if (airports.rows.length < minimumAirports || countries.rows.length < (minimumAirports > 100 ? 200 : 1) || regions.rows.length < (minimumAirports > 100 ? 1000 : 1)) throw new Error('OurAirports response is incomplete; previous snapshot retained');
    for (const [source, required] of [[airports, ['id','ident','type','latitude_deg','longitude_deg','iso_country','iso_region','municipality','scheduled_service']], [countries, ['code','name','continent']], [regions, ['code','name','iso_country']]]) {
      if (!required.every(field => field in (source.rows[0] || {}))) throw new Error(`Unexpected ${source.kind} CSV schema`);
    }
    const links = await readJson(path.join(dataDir, 'airport-city-links.json'), { links: [] });
    const catalog = buildAirportCatalog({ airportRows: airports.rows, countryRows: countries.rows, regionRows: regions.rows, curatedCities: curatedCities || await readJson(path.join(dataDir, 'cities.json'), []), links: links.links, checkedAt });
    if (catalog.airports.airports.length < minimumAirports || catalog.cities.cities.length < minimumAirports / 3 || !catalog.counts.scheduledAirports) throw new Error('Airport catalog sanity check failed; previous snapshot retained');
    if (['sourceAirports', 'includedAirports', 'airportCities'].some(key => previousMaintenance.counts?.[key] > 100 && catalog.counts[key] < previousMaintenance.counts[key] * 0.85)) throw new Error('Airport coverage unexpectedly fell by over 15%; previous snapshot retained for review');
    const snapshots = [['airports.json', catalog.airports], ['airport-cities.json', catalog.cities]];
    // Prepare both complete files first. Restore previous bytes if replacing either file fails.
    const prepared = await Promise.all(snapshots.map(async ([name, value]) => {
      const target = path.join(dataDir, name), temp = `${target}.${randomUUID()}.tmp`;
      let old; try { old = await fs.readFile(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      await fs.writeFile(temp, `${JSON.stringify(value)}\n`, 'utf8');
      return { target, temp, old, replaced: false };
    }));
    try {
      for (const file of prepared) { await fs.rename(file.temp, file.target); file.replaced = true; }
    } catch (error) {
      for (const file of prepared.filter(file => file.replaced)) {
        if (file.old) await fs.writeFile(file.target, file.old); else await fs.rm(file.target, { force: true });
      }
      throw error;
    } finally { await Promise.all(prepared.map(file => fs.rm(file.temp, { force: true }))); }
    const maintenance = { version: 1, source: AIRPORT_SOURCE, status: 'ok', lastAttemptAt: checkedAt, lastSuccessAt: checkedAt, refreshIntervalDays: 7, sources: fetched.map(({ rows, ...source }) => ({ ...source, rowCount: rows.length })), counts: catalog.counts, notes: ['Active airport types only; scheduled_service is a source flag, not a current airline schedule.', 'Airport-city coordinates are airport positions, not city centres.', 'No route, fare, hotel price or attraction coverage is implied.'] };
    await atomicJson(maintenancePath, maintenance);
    return { id: 'ourairports', status: 'ok', counts: catalog.counts, lastSuccessAt: checkedAt };
  } catch (error) {
    await atomicJson(maintenancePath, { ...previousMaintenance, version: 1, source: AIRPORT_SOURCE, status: 'error', lastAttemptAt: checkedAt, error: error.message, previousSnapshotRetained: true });
    return { id: 'ourairports', status: 'error', error: error.message, previousSnapshotRetained: true };
  } finally { await lock.close(); await fs.rm(lockPath, { force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await updateAirports({ ifStale: process.argv.includes('--if-stale') });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'ok') process.exitCode = 1;
}
