// Generates public/search-index.json at build time.
// Run via `npm run prebuild` (added to package.json scripts).
// The SearchModal fetches this file lazily on first open.

const fs = require('fs');
const path = require('path');

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
      price: castle.price_adult ?? null,
      currency: castle.price_currency || null,
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
