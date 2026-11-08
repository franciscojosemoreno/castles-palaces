// Fails the build when a castle's "Nearby" data is wrong. Run automatically in `prebuild`:
//
//   node scripts/check-nearby.mjs
//
// A castle page has two blocks that come from its JSON:
//   - "Nearby Castles"  = `nearby_castles` (manual list), shown closest first with the distance.
//   - "More castles in <country>" = `more_castles_in_country` (max 4), same-country castles that are too
//     far to be nearby but are worth linking between important pages.
// Rules (150 km is MAX_NEARBY_DISTANCE_KM in lib/castles.ts):
//   1. Every id must be a published castle (no ghost ids, no self reference, no duplicates, the two
//      lists do not overlap).
//   2. A `nearby_castles` entry must be within 150 km. The only exception is the fallback for a remote
//      castle: at most 2 entries when no published castle at all lies within 150 km but the nearest one
//      is within 500 km. If even the nearest castle is farther than 500 km (Angra do Heroísmo, in the
//      Azores) there is no Nearby block: `nearby_castles` stays empty and `more_castles_in_country`
//      holds the 4 nearest castles of the same country (lib/castles.ts, NEARBY_HIDE_BEYOND_KM).
//   3. `more_castles_in_country` has at most 4 entries, all in the same country folder and all farther
//      than 150 km (a closer one belongs in `nearby_castles`).
// A castle with no `nearby_castles` list gets its Nearby block from the coordinates at render time
// (same 150 km cap and 2-nearest fallback), so there is nothing to check for it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const castlesDir = path.join(root, 'data/castles');
const MAX_KM = 150;
const HIDE_BEYOND_KM = 500;

function hav(a, b, c, d) {
  const R = 6371;
  const p = Math.PI / 180;
  const x = Math.sin(((c - a) * p) / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin(((d - b) * p) / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

const castles = new Map();
for (const folder of fs.readdirSync(castlesDir)) {
  const dir = path.join(castlesDir, folder);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const c = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    castles.set(c.id, { ...c, folder });
  }
}
const published = [...castles.values()].filter((c) => c.status === 'published');
const km = (a, b) => hav(a.lat, a.lng, b.lat, b.lng);

const problems = [];
let checked = 0;
for (const c of published) {
  const near = c.nearby_castles ?? [];
  const more = c.more_castles_in_country ?? [];

  // A castle whose nearest neighbour is farther than 500 km has no Nearby block: its `more_castles_in_country`
  // must be its 4 nearest same-country castles (or all of them when the country has fewer).
  const nearest = Math.min(...published.filter((o) => o.id !== c.id).map((o) => km(c, o)));
  if (nearest > HIDE_BEYOND_KM) {
    const where = `${c.folder}/${c.id}`;
    const expected = published
      .filter((o) => o.id !== c.id && o.folder === c.folder)
      .sort((a, b) => km(c, a) - km(c, b))
      .slice(0, 4)
      .map((o) => o.id);
    if (near.length) problems.push(`${where}: nearest castle is ${Math.round(nearest)} km away (> ${HIDE_BEYOND_KM}), so nearby_castles must be empty`);
    if (JSON.stringify(more) !== JSON.stringify(expected)) problems.push(`${where}: nearest castle is ${Math.round(nearest)} km away (> ${HIDE_BEYOND_KM}); more_castles_in_country must be its nearest same-country castles: ${JSON.stringify(expected)}`);
  }
  if (!near.length && !more.length) continue;
  checked++;
  const where = `${c.folder}/${c.id}`;
  const all = [...near.map((id) => ['nearby_castles', id]), ...more.map((id) => ['more_castles_in_country', id])];
  const seen = new Set();
  for (const [field, id] of all) {
    const t = castles.get(id);
    if (!t || t.status !== 'published') problems.push(`${where}: ${field} has "${id}", which is not a published castle`);
    else if (id === c.id) problems.push(`${where}: ${field} lists the castle itself`);
    if (seen.has(id)) problems.push(`${where}: "${id}" appears twice (in ${field} or in both lists)`);
    seen.add(id);
  }
  const known = (id) => castles.get(id)?.status === 'published' && id !== c.id;

  // 2. nearby_castles within 150 km, except the 2-nearest fallback of a remote castle
  const farNear = near.filter(known).filter((id) => km(c, castles.get(id)) > MAX_KM);
  if (farNear.length) {
    const anyWithin = published.some((o) => o.id !== c.id && km(c, o) <= MAX_KM);
    const isFallback = !anyWithin && nearest <= HIDE_BEYOND_KM && near.length <= 2 && farNear.length === near.length;
    if (!isFallback) {
      for (const id of farNear) problems.push(`${where}: nearby_castles has "${id}" at ${Math.round(km(c, castles.get(id)))} km (limit ${MAX_KM}); move it to more_castles_in_country if it is in the same country, otherwise remove it`);
    }
  }

  // 3. more_castles_in_country
  if (more.length > 4) problems.push(`${where}: more_castles_in_country has ${more.length} entries (max 4)`);
  for (const id of more.filter(known)) {
    const t = castles.get(id);
    if (t.folder !== c.folder) problems.push(`${where}: more_castles_in_country has "${id}", which is in ${t.folder} (must be ${c.folder})`);
    else if (km(c, t) <= MAX_KM) problems.push(`${where}: more_castles_in_country has "${id}" at only ${Math.round(km(c, t))} km; it belongs in nearby_castles`);
  }
}

if (problems.length) {
  for (const p of problems.slice(0, 40)) console.error(`Nearby data: ${p}`);
  if (problems.length > 40) console.error(`… and ${problems.length - 40} more`);
  console.error('Fix the lists in data/castles (see the header of scripts/check-nearby.mjs).');
  process.exit(1);
}
console.log(`check-nearby — OK (${checked} castles with a manual Nearby / More list: every id exists, nearby entries within ${MAX_KM} km)`);
