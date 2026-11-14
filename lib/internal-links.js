// Which internal paths are real pages, so a Markdown link in copy only becomes an <a> when it leads
// somewhere that exists (and answers 200). Built once from the content files — the same source the
// routes are generated from — so it cannot drift from the site.
//
//   const { resolveInternalLink } = require('./internal-links');
//   resolveInternalLink('/castles/italy/castle-of-poppiano');   // '/castles/italy/castle-of-poppiano'
//   resolveInternalLink('https://example.com/x');               // null (external: show the text only)

const fs = require('fs');
const path = require('path');
const { internalTarget } = require('./inline-markdown');

const DATA = path.join(process.cwd(), 'data');
const STATIC_PAGES = ['/', '/castles', '/tours', '/routes', '/guides', '/castle-hotels', '/map', '/about', '/contact', '/quiz'];

function jsonFiles(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
}

let validPaths = null;

function buildValidPaths() {
  const set = new Set(STATIC_PAGES);

  const countriesFile = path.join(DATA, 'countries.json');
  if (fs.existsSync(countriesFile)) {
    for (const c of JSON.parse(fs.readFileSync(countriesFile, 'utf-8'))) {
      set.add(`/castles/${c.slug}`);
      set.add(`/castle-hotels/${c.slug}`);
    }
  }

  const castlesDir = path.join(DATA, 'castles');
  for (const country of fs.readdirSync(castlesDir)) {
    const dir = path.join(castlesDir, country);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of jsonFiles(dir)) {
      const castle = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      if (castle.status === 'published') set.add(`/castles/${castle.country}/${castle.id}`);
    }
  }

  const toursDir = path.join(DATA, 'tours');
  if (fs.existsSync(toursDir)) {
    for (const country of fs.readdirSync(toursDir)) {
      const dir = path.join(toursDir, country);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const file of jsonFiles(dir)) {
        const tour = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
        set.add(`/tours/${tour.departure_country}/${tour.slug}`);
        set.add(`/tours/${tour.departure_country}`);
      }
    }
  }

  for (const file of jsonFiles(path.join(DATA, 'routes'))) set.add(`/routes/${file.slice(0, -5)}`);
  for (const file of jsonFiles(path.join(DATA, 'guides'))) set.add(`/guides/${file.slice(0, -5)}`);
  return set;
}

/**
 * The site path to link to ("/castles/italy/x", plus a #hash if the copy had one), or null when the
 * href is external or points at a page that does not exist.
 */
function resolveInternalLink(href) {
  const target = internalTarget(href);
  if (!target) return null;
  if (!validPaths) validPaths = buildValidPaths();
  return validPaths.has(target.path) ? target.path + target.hash : null;
}

module.exports = { resolveInternalLink };
