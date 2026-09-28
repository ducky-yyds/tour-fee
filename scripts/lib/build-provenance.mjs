import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function productionFingerprint(root) {
  const paths = ['package.json', 'package-lock.json', 'vite.config.js', 'index.html'];
  function walk(relative) {
    for (const file of readdirSync(resolve(root, relative), { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      const name = `${relative}/${file.name}`;
      if (file.isDirectory()) walk(name);
      else if (file.isFile()) paths.push(name);
    }
  }
  for (const directory of ['src', 'shared', 'server']) walk(directory);
  const hash = createHash('sha256');
  for (const path of paths.sort()) if (existsSync(resolve(root, path))) hash.update(path).update('\0').update(readFileSync(resolve(root, path))).update('\0');
  return hash.digest('hex');
}
