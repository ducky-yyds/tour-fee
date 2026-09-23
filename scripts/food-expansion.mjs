import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** Keep independently maintained regional food batches in the main catalog. */
export function mergeFoodExpansions(base, cityIds, { root = process.cwd(), refresh = false } = {}) {
  const directory = resolve(root, 'data/food-expansion');
  if (!existsSync(directory)) return base;
  const merged = new Map(base.map(food => [food.id, food]));
  const seen = new Set();
  for (const filename of readdirSync(directory).filter(file => file.endsWith('.json')).sort()) {
    const rows = JSON.parse(readFileSync(resolve(directory, filename), 'utf8').replace(/^\uFEFF/, ''));
    if (!Array.isArray(rows)) throw new Error(`Food expansion must be an array: ${filename}`);
    for (const food of rows) {
      if (!food.id || seen.has(food.id) || !food.name || !food.localName || !food.description
        || !Array.isArray(food.cityIds) || !food.cityIds.length
        || food.cityIds.some(id => !cityIds.has(id))) throw new Error(`Invalid or duplicate food expansion: ${filename}/${food.id}`);
      seen.add(food.id);
      const previous = merged.get(food.id);
      merged.set(food.id, previous ? {
        ...(refresh ? previous : food), ...(refresh ? food : previous),
        cityIds: [...new Set([...previous.cityIds, ...food.cityIds])],
      } : food);
    }
  }
  return [...merged.values()];
}
