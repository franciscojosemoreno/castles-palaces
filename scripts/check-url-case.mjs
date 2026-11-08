// Fails the build when an internal URL could contain capital letters in its country / slug
// segment. Linux hosts (Vercel) are case-sensitive, so /castles/Bulgaria/kaliakra-fortress is a
// 404 even though the castle page exists. This happened in Oct 2026: six castle JSON files had
// "country": "Bulgaria" (capitalised) and every card, map popup, search result and JSON-LD
// breadcrumb built from that field linked to a URL that did not exist.
//
//   node scripts/check-url-case.mjs           data check — runs automatically in `prebuild`
//   node scripts/check-url-case.mjs --built   output check — runs automatically in `postbuild`
//
// Data check (before the build): the folder names and file slugs under data/castles and
// data/tours are lowercase, and every castle's `country` equals its folder and its `id` equals
// its file name (components build /castles/<country>/<id> from those two fields).
//
// Output check (after the build): no href, JSON-LD value or sitemap <loc> in the generated HTML
// and sitemap points at /castles/, /castle-hotels/ or /tours/ with a capital letter in the path.
//
// To fix a data failure, make the field lowercase and equal to the folder / file name.
// next.config.ts and proxy.ts redirect incoming capitalised URLs, but our own links must never
// need that redirect.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const built = process.argv.includes('--built');
const problems = [];

function dirs(dir) {
  return fs.readdirSync(dir).filter((entry) => fs.statSync(path.join(dir, entry)).isDirectory());
}
function jsonFiles(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
}

if (!built) {
  const castlesDir = path.join(root, 'data/castles');
  let castleCount = 0;
  for (const folder of dirs(castlesDir)) {
    if (folder !== folder.toLowerCase()) problems.push(`data/castles/${folder}: folder name must be lowercase`);
    for (const file of jsonFiles(path.join(castlesDir, folder))) {
      castleCount++;
      const slug = file.replace(/\.json$/, '');
      const where = `data/castles/${folder}/${file}`;
      if (slug !== slug.toLowerCase()) problems.push(`${where}: file name must be lowercase`);
      const castle = JSON.parse(fs.readFileSync(path.join(castlesDir, folder, file), 'utf8'));
      if (castle.country !== folder) problems.push(`${where}: "country" is ${JSON.stringify(castle.country)}, expected "${folder}" (the folder)`);
      if (castle.id !== slug) problems.push(`${where}: "id" is ${JSON.stringify(castle.id)}, expected "${slug}" (the file name)`);
    }
  }

  const toursDir = path.join(root, 'data/tours');
  let tourCount = 0;
  for (const folder of dirs(toursDir)) {
    if (folder !== folder.toLowerCase()) problems.push(`data/tours/${folder}: folder name must be lowercase`);
    for (const file of jsonFiles(path.join(toursDir, folder))) {
      tourCount++;
      const slug = file.replace(/\.json$/, '');
      const where = `data/tours/${folder}/${file}`;
      if (slug !== slug.toLowerCase()) problems.push(`${where}: file name must be lowercase`);
      const tour = JSON.parse(fs.readFileSync(path.join(toursDir, folder, file), 'utf8'));
      if (tour.slug !== slug) problems.push(`${where}: "slug" is ${JSON.stringify(tour.slug)}, expected "${slug}"`);
      for (const country of tour.visited_countries ?? []) {
        if (country !== country.toLowerCase()) problems.push(`${where}: visited_countries entry "${country}" must be lowercase`);
      }
    }
  }

  const countries = JSON.parse(fs.readFileSync(path.join(root, 'data/countries.json'), 'utf8'));
  for (const country of Array.isArray(countries) ? countries : countries.countries ?? []) {
    if (country.slug !== country.slug.toLowerCase()) problems.push(`data/countries.json: slug "${country.slug}" must be lowercase`);
  }

  if (problems.length === 0) console.log(`check-url-case — OK (${castleCount} castles, ${tourCount} tours: lowercase slugs, country = folder, id = file name)`);
} else {
  const appDir = path.join(root, '.next/server/app');
  if (!fs.existsSync(appDir)) {
    console.error('check-url-case --built: .next/server/app not found — run it after `next build`.');
    process.exit(1);
  }
  // An internal URL: preceded by a quote, bracket, space, "=" or our own host, then /castles/,
  // /castle-hotels/ or /tours/ and a path with at least one capital letter. Percent-escapes
  // (%C3%A9) are removed first so their capital hex digits do not count.
  const internalUrl = /(?<=["'(<>\s=]|castles-palaces\.com)\/(?:castles|castle-hotels|tours)\/[A-Za-z0-9_.%\/-]*/g;
  let files = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html') || entry.name === 'sitemap.xml.body') {
        files++;
        const text = fs.readFileSync(full, 'utf8');
        const seen = new Set();
        for (const [url] of text.matchAll(internalUrl)) {
          if (/[A-Z]/.test(url.replace(/%[0-9A-Fa-f]{2}/g, '')) && !seen.has(url)) {
            seen.add(url);
            problems.push(`${path.relative(root, full)}: ${url}`);
          }
        }
      }
    }
  };
  walk(appDir);
  if (problems.length === 0) console.log(`check-url-case --built — OK (${files} generated files: no capitals in internal /castles, /castle-hotels or /tours URLs)`);
}

if (problems.length) {
  const shown = problems.slice(0, 40);
  for (const problem of shown) console.error(`Capital letters in URL source: ${problem}`);
  if (problems.length > shown.length) console.error(`… and ${problems.length - shown.length} more`);
  console.error('Internal URLs must be lowercase. See the header of scripts/check-url-case.mjs.');
  process.exit(1);
}
