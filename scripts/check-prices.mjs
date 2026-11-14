#!/usr/bin/env node
// Fails the build when a visible price does not come from the castle's active GetYourGuide tour in EUR.
//
// Rule (2026-11-14): the only price the site shows for a castle — ⌘K search, Quick Facts, hub cards, /map,
// the sticky booking bar and the JSON-LD priceRange — is the price of its active featured tour
// (gyg_featured_tours[0] with a price_from), always in EUR. A castle without an active tour shows no price.
// price_adult / price_currency are for the description text only.
//
// Two checks:
//   1. DATA: for every published castle, what lib/entry-price.js hands to those places is null without an
//      active tour, and otherwise "€N" or "€N / group" (a multi-site pass is a GetYourGuide product in EUR
//      too; "Free" only for a tour priced 0) — never another currency, never the castle's own admission.
//   2. SOURCE: no page, component or lib file other than the shared function reads price_adult or
//      price_currency to build something visible (allow-list below).
//
//   node scripts/check-prices.mjs          (also `npm run check:prices`, and part of prebuild)

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getActiveTour, getEntryPrice, searchPriceLabel, priceRangeLabel } = require('../lib/entry-price.js');

const ROOT = process.cwd();
const errors = [];

// ── 1. data ──
const castlesDir = path.join(ROOT, 'data/castles');
const EUR_VALUE = /^(€\d+(\.\d+)?( \/ group)?|Free)$/;
for (const country of fs.readdirSync(castlesDir)) {
  const dir = path.join(castlesDir, country);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const castle = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    if (castle.status !== 'published') continue;
    const where = `data/castles/${country}/${file}`;
    const entry = getEntryPrice(castle);
    const search = searchPriceLabel(castle);
    const range = priceRangeLabel(castle);
    if (!getActiveTour(castle)) {
      if (entry || search || range) errors.push(`${where}: shows a price (${[entry && entry.value, search, range].filter(Boolean).join(' / ')}) but has no active GetYourGuide tour`);
      continue;
    }
    if (entry && !EUR_VALUE.test(entry.value)) errors.push(`${where}: Quick Facts price "${entry.value}" is not in EUR`);
    if (entry && entry.currency && entry.currency !== 'EUR') errors.push(`${where}: Quick Facts price currency ${entry.currency}, expected EUR`);
    if (search && !/^(Free|From €\d+(\.\d+)?( \/ group)?)$/.test(search)) errors.push(`${where}: search price "${search}" is not in EUR`);
    if (range && !/^(Free|€\d+(\.\d+)?( \/ group)?)$/.test(range)) errors.push(`${where}: JSON-LD priceRange "${range}" is not in EUR`);
  }
}

// ── 2. source ──
// Files that may mention price_adult: the shared function, the types, the map data (a filter flag only,
// never printed) and the search/quality scripts that read the data files.
const ALLOWED = new Set(['lib/entry-price.js', 'lib/entry-price.test.mjs', 'types/index.ts', 'app/map/page.tsx']);
function* files(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(full);
    else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name)) yield full;
  }
}
for (const top of ['app', 'components', 'lib']) {
  for (const file of files(path.join(ROOT, top))) {
    const rel = path.relative(ROOT, file);
    if (ALLOWED.has(rel)) continue;
    const text = fs.readFileSync(file, 'utf-8');
    for (const word of ['price_adult', 'price_currency']) {
      if (text.includes(word)) errors.push(`${rel}: reads ${word}; visible prices must come from lib/entry-price.js (active GetYourGuide tour, EUR)`);
    }
  }
}

if (errors.length) {
  console.error(`check-prices: ${errors.length} problem(s)`);
  for (const e of errors.slice(0, 40)) console.error(`  ${e}`);
  process.exit(1);
}
console.log('check-prices: ok');
