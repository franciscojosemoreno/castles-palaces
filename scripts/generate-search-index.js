// Generates public/search-index.json at build time.
// Run via `npm run prebuild` (added to package.json scripts).
// The SearchModal fetches this file lazily on first open.
//
// `price_label` ("From €20", "Free" or null) is computed by lib/entry-price.js — the same function that
// writes the "Entry from…" row of Quick Facts on the castle page — so the search always shows the price
// the castle page shows, in the same currency, and nothing when the page shows no price.

const fs = require('fs');
const path = require('path');
const { searchPriceLabel } = require('../lib/entry-price.js');

const CASTLES_DIR = path.join(__dirname, '..', 'data', 'castles');
const OUTPUT = path.join(__dirname, '..', 'public', 'search-index.json');

const index = [];

const countries = fs.readdirSync(CASTLES_DIR).filter((entry) =>
  fs.statSync(path.join(CASTLES_DIR, entry)).isDirectory()
);

for (const country of countries) {
  const dir = path.join(CASTLES_DIR, country);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    let castle;
    try {
      castle = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    } catch {
      console.warn(`Skipping ${file}: invalid JSON`);
      continue;
    }
    if (castle.status !== 'published') continue;
    index.push({
      id: castle.id,
      country: castle.country,
      name: castle.name,
      region: castle.region || null,
      thumb: castle.hero_image?.url || null,
      price_label: searchPriceLabel(castle),
      featured: castle.featured || false,
      unesco: castle.unesco || false,
    });
  }
}

// Sort featured first, then by name
index.sort((a, b) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return a.name.localeCompare(b.name);
});

fs.writeFileSync(OUTPUT, JSON.stringify(index));
console.log(`✓ Search index: ${index.length} castles → public/search-index.json`);
