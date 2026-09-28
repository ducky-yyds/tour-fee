// Rebuild the small, fixed geographic label index used by the globe.
// Natural Earth data is public domain; coordinates are source label positions,
// never averages of the destinations currently visible on screen.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const commit = 'ca96624a56bd078437bca8184e78163e5039ad19';
const upstream = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${commit}/10m_cultural/`;
const cache = path.join(root, 'artifacts/natural-earth-labels', commit);
const sourceNames = [
  'ne_10m_admin_0_countries',
  'ne_10m_admin_1_states_provinces',
  'ne_10m_admin_0_map_subunits',
];
const zhRegions = new Intl.DisplayNames(['zh-CN'], { type: 'region', style: 'short' });
const enRegions = new Intl.DisplayNames(['en'], { type: 'region', style: 'short' });

// The fixed source files are dBASE tables with UTF-8 names. Reading just DBF
// avoids downloading, parsing, or shipping any additional boundary geometry.
function readDbf(buffer) {
  const count = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);
  const fields = [];
  for (let offset = 32; offset < headerLength - 1 && buffer[offset] !== 13; offset += 32) {
    fields.push({
      name: buffer.subarray(offset, offset + 11).toString('ascii').split('\0')[0],
      length: buffer[offset + 16],
    });
  }
  const rows = [];
  for (let i = 0; i < count; i++) {
    let offset = headerLength + i * recordLength;
    if (buffer[offset] === 42) continue;
    offset++;
    const row = {};
    for (const field of fields) {
      row[field.name] = buffer.subarray(offset, offset + field.length).toString('utf8').replace(/\0/g, '').trim();
      offset += field.length;
    }
    rows.push(row);
  }
  return rows;
}

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const round = (number, digits = 4) => Number(Number(number).toFixed(digits));
const validCode = (code) => /^[A-Z]{2}$/.test(code);
const validPoint = (point) => Number.isFinite(point.lat) && Math.abs(point.lat) <= 90
  && Number.isFinite(point.lng) && Math.abs(point.lng) <= 180;
const provinceMinZoom = (minLabel, rank) => round(Math.min(2.85,
  1.7 + Math.max(0, Number(minLabel) - 3.5) * 0.21 + (Number(rank) >= 7 ? 0.05 : 0)), 2);

await fs.mkdir(cache, { recursive: true });
const sources = [];
const tables = [];
for (const name of sourceNames) {
  const url = `${upstream}${name}.dbf`;
  const file = path.join(cache, `${name}.dbf`);
  let bytes;
  try { bytes = await fs.readFile(file); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`Natural Earth download failed (${response.status}): ${url}`);
    bytes = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(file, bytes);
  }
  sources.push({ layer: name, url, sha256: sha256(bytes) });
  tables.push(readDbf(bytes));
}

const countryCandidates = tables[0].flatMap((row) => {
  const countryCode = [row.ISO_A2, row.ISO_A2_EH, row.WB_A2].find(validCode);
  if (!countryCode) return [];
  const point = {
    id: `country-${countryCode}`,
    countryCode,
    name: zhRegions.of(countryCode) || row.NAME_ZH || row.NAME,
    nameEn: enRegions.of(countryCode) || row.NAME_EN || row.NAME,
    lat: round(row.LABEL_Y),
    lng: round(row.LABEL_X),
    rank: Number(row.LABELRANK),
    minZoom: round(Math.min(1.7, 0.7 + Math.max(0, Number(row.MIN_LABEL) - 1.7) * 0.22), 2),
    sourcePriority: validCode(row.ISO_A2) ? 0 : 1,
  };
  return validPoint(point) ? [point] : [];
});
// Some tiny detached map units share the parent's fallback ISO code. Keep the
// principal country anchor rather than showing several labels with that name.
countryCandidates.sort((a, b) => a.sourcePriority - b.sourcePriority || a.rank - b.rank);
const countryByCode = new Map();
for (const { sourcePriority, ...point } of countryCandidates) {
  if (!countryByCode.has(point.countryCode)) countryByCode.set(point.countryCode, point);
}
const countries = [...countryByCode.values()];

const provinces = tables[1].flatMap((row) => {
  // Very small districts need a street map, not a globe. The source's scale
  // classification keeps their labels out, including small island enclaves.
  // Rank 7 intentionally includes Beijing, Shanghai and Tianjin.
  if (!validCode(row.iso_a2) || Number(row.labelrank) > 7 || Number(row.min_label) > 8.7) return [];
  const point = {
    id: `province-${row.adm1_code}`,
    countryCode: row.iso_a2,
    name: row.name_zh || row.name_en || row.name,
    nameEn: row.name_en || row.name,
    lat: round(row.latitude),
    lng: round(row.longitude),
    rank: Number(row.labelrank),
    minZoom: provinceMinZoom(row.min_label, row.labelrank),
  };
  return point.name && point.nameEn && validPoint(point) ? [point] : [];
});

// The admin-1 layer models UK councils. Natural Earth's map-subunit layer has
// the four much more useful constituent-country labels at fixed label points.
for (const row of tables[2]) {
  if (row.ADMIN !== 'United Kingdom' || !['ENG', 'SCT', 'WLS', 'NIR'].includes(row.SU_A3)) continue;
  const point = {
    id: `province-GB-${row.SU_A3}`,
    countryCode: 'GB',
    name: row.NAME_ZH || row.NAME_EN || row.NAME,
    nameEn: row.NAME_EN || row.NAME,
    lat: round(row.LABEL_Y),
    lng: round(row.LABEL_X),
    rank: Number(row.LABELRANK),
    minZoom: provinceMinZoom(row.MIN_LABEL, row.LABELRANK),
  };
  if (validPoint(point)) provinces.push(point);
}

const compare = (a, b) => a.minZoom - b.minZoom || a.rank - b.rank || a.id.localeCompare(b.id, 'en');
countries.sort(compare);
provinces.sort(compare);
const ids = new Set();
for (const point of [...countries, ...provinces]) {
  if (ids.has(point.id)) throw new Error(`Duplicate label ID: ${point.id}`);
  ids.add(point.id);
}
const output = {
  version: 1,
  source: 'Natural Earth 1:10m cultural vectors',
  sourceCommit: commit,
  license: 'Public domain',
  licenseUrl: 'https://www.naturalearthdata.com/about/terms-of-use/',
  sources,
  coordinates: 'WGS84 degrees; source label positions rounded to four decimal places',
  countries,
  provinces,
};
const file = path.join(root, 'public/maps/label-places.json');
await fs.writeFile(file, `${JSON.stringify(output)}\n`, 'utf8');
console.log(`Wrote ${countries.length} countries/territories and ${provinces.length} regional labels (${(await fs.stat(file)).size} bytes).`);
