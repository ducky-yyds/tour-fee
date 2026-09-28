/** Import-safe entry point for the byte-preserving local asset archive. */
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const defaultAssetArchiveDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../storage/originals');
export async function archiveAssets(args = ['--inventory'], options = {}) {
  let python = options.python || process.env.PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
  // Spawn the interpreter itself, rather than leaving a py.exe launcher child
  // alive when a maintenance timeout terminates its Node parent.
  if (process.platform === 'win32') {
    const resolved = await promisify(execFile)(python, ['-c', 'import sys; print(sys.executable)'], { windowsHide: true, encoding: 'utf8' });
    python = resolved.stdout.trim();
    if (!python) throw new Error('Python interpreter could not be resolved');
  }
  const script = fileURLToPath(new URL('./archive_assets.py', import.meta.url));
  return new Promise((resolve, reject) => {
    const child = spawn(python, ['-X', 'utf8', script, ...args], { stdio: 'inherit', windowsHide: true, ...options.spawn });
    const stop = () => child.kill('SIGTERM');
    const cleanup = () => { process.off('SIGINT', stop); process.off('SIGTERM', stop); };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    child.once('error', error => { cleanup(); reject(error); });
    child.once('exit', (code, signal) => { cleanup(); code === 0 ? resolve() : reject(new Error(`Asset archive failed (${code ?? signal})`)); });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  archiveAssets(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
