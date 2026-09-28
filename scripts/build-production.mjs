import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { productionFingerprint } from './lib/build-provenance.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.env.VITE_STATIC_DATA = 'false';
const before = productionFingerprint(root);
const { build } = await import('vite');
await build({ root, mode: 'production', base: '/' });
const after = productionFingerprint(root);
if (before !== after) throw new Error('Source files changed during production build; rebuild before archiving');
writeFileSync(resolve(root, 'dist/build-provenance.json'), JSON.stringify({ version: 1, builtAt: new Date().toISOString(), sourceFingerprint: after, mode: 'server', mediaBaseUrl: process.env.VITE_MEDIA_BASE_URL || null }, null, 2) + '\n');
