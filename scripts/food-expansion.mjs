import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** Keep independently maintained regional food batches in the main catalog. */
export function mergeFoodExpansions(base, cityIds, { root = process.cwd(), refresh = false } = {}) {
  const directory = resolve(root, 'data/food-expansion');
  const merged = new Map(base.map(food => [food.id, food]));
  const seen = new Set();
  for (const filename of (existsSync(directory) ? readdirSync(directory) : []).filter(file => file.endsWith('.json')).sort()) {
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
  // Regional dishes can belong to several cities without duplicating the food.
  const cityDirectory = resolve(root, 'data/food-city-expansion');
  for (const filename of (existsSync(cityDirectory) ? readdirSync(cityDirectory) : []).filter(file => file.endsWith('.json')).sort()) {
    const rows = JSON.parse(readFileSync(resolve(cityDirectory, filename), 'utf8').replace(/^\uFEFF/, ''));
    if (!Array.isArray(rows)) throw new Error(`Food city expansion must be an array: ${filename}`);
    for (const row of rows) {
      const food = merged.get(row.id);
      if (!food || !Array.isArray(row.cityIds) || !row.cityIds.length || row.cityIds.some(id => !cityIds.has(id))) throw new Error(`Invalid food city association: ${filename}/${row.id}`);
      merged.set(row.id, { ...food, cityIds: [...new Set([...food.cityIds, ...row.cityIds])], whereByCity: { ...food.whereByCity, ...row.whereByCity }, sourceReferences: [...new Map([...(food.sourceReferences || []), ...(row.sourceReferences || [])].map(source => [source.url, source])).values()] });
    }
  }
  // Keep researched dish photos separate from food descriptions and prices.
  // These explicit matches take precedence on every scheduled catalog refresh.
  const photoDirectory = resolve(root, 'data/food-photo-expansion');
  const photoIds = new Set();
  for (const filename of (existsSync(photoDirectory) ? readdirSync(photoDirectory) : []).filter(file => file.endsWith('.json')).sort()) {
    const photos = JSON.parse(readFileSync(resolve(photoDirectory, filename), 'utf8').replace(/^\uFEFF/, ''));
    if (!photos || Array.isArray(photos) || typeof photos !== 'object') throw new Error(`Food photo expansion must be an object: ${filename}`);
    for (const [id, photo] of Object.entries(photos)) {
      if (!merged.has(id) || photoIds.has(id) || !photo.photoFile || !/^https:\/\//.test(photo.sourceUrl || '') || !photo.license) throw new Error(`Invalid or duplicate food photo: ${filename}/${id}`);
      photoIds.add(id);
      merged.set(id, { ...merged.get(id), photoFile: photo.photoFile, photoStatus: 'photo-selected', photoSourceUrl: photo.sourceUrl, photoSourceLicense: photo.license, photoMatchNote: photo.note, photoCheckedAt: photo.sourceCheckedAt, imageContextNote: photo.imageContextNote });
    }
  }
  for (const [id, food] of merged) {
    if (food.photoMatchNote && food.photoSourceUrl && !photoIds.has(id)) {
      const cleared = { ...food, photoStatus: 'needs-food-photo' };
      for (const field of ['photoFile', 'photoSourceUrl', 'photoSourceLicense', 'photoMatchNote', 'photoCheckedAt', 'imageContextNote']) delete cleared[field];
      merged.set(id, cleared);
    }
  }
  return [...merged.values()];
}
