// Fails the build when a country folder in data/castles/ has no ISO 3166-1 alpha-2 code in
// lib/country-codes.json. components/seo/StructuredData.tsx reads the same file for the
// JSON-LD addressCountry, so a missing entry would otherwise emit a wrong code (or throw at render).
//
//   node scripts/check-country-codes.mjs      (runs automatically in `prebuild`)
//
// Add the missing folder to lib/country-codes.json, e.g. "malta": "MT". England, Scotland, Wales
// and Northern Ireland are "GB"; Kosovo uses the user-assigned "XK".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const castlesDir = path.join(root, 'data/castles');
const codes = JSON.parse(fs.readFileSync(path.join(root, 'lib/country-codes.json'), 'utf8'));

const folders = fs
  .readdirSync(castlesDir)
  .filter((entry) => fs.statSync(path.join(castlesDir, entry)).isDirectory())
  .sort();

const missing = folders.filter((folder) => !codes[folder]);
const malformed = Object.entries(codes).filter(([, code]) => !/^[A-Z]{2}$/.test(code)).map(([k]) => k);

if (missing.length || malformed.length) {
  for (const folder of missing) console.error(`Missing ISO country code for: ${folder}`);
  for (const key of malformed) console.error(`Invalid ISO country code (expected two capital letters) for: ${key}`);
  console.error('Fix lib/country-codes.json, then run the build again.');
  process.exit(1);
}
console.log(`check-country-codes — OK (${folders.length} country folders, all with an ISO code)`);
