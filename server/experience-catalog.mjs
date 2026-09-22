import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();

// The planner and maintenance job share one inventory, including future batches.
export function experienceCatalogFiles(root = ROOT) {
  const expansion = resolve(root, 'data/experience-expansion');
  return ['data/city-experiences.json', 'data/city-activities.json',
    ...(existsSync(expansion) ? readdirSync(expansion).filter(name => name.endsWith('.json')).sort().map(name => `data/experience-expansion/${name}`) : []),
  ].map(name => resolve(root, name));
}

export function readExperienceEntries(root = ROOT) {
  const ids = new Set();
  return experienceCatalogFiles(root).flatMap(filename => {
    const stat = statSync(filename), key = `${stat.mtimeMs}:${stat.size}`;
    let entry = cache.get(filename);
    if (entry?.key !== key) {
      const value = JSON.parse(readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
      if (!Array.isArray(value)) throw new Error(`Experience catalog must be an array: ${filename}`);
      entry = { key, value }; cache.set(filename, entry);
    }
    for (const item of entry.value) {
      if (!item.id || ids.has(item.id)) throw new Error(`Missing or duplicate experience ID: ${item.id}`);
      ids.add(item.id);
    }
    return entry.value;
  });
}
