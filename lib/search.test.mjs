#!/usr/bin/env node
// Fixture tests for lib/search.ts. Run directly:  node lib/search.test.mjs
// Exits 1 if any assertion fails (Node 24+ runs .ts natively, as in the other lib tests).
import { normalizeEntries, rankSearch, normalizeSearchText } from './search.ts';

let failures = 0;
const eq = (label, actual, expected) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.error(`FAIL: ${label}\n  expected ${e}\n  got      ${a}`); failures++; } else console.log(`ok: ${label}`);
};
const mk = (name, country, region, featured = false) => ({ name, country, region, featured });
const corpus = normalizeEntries([
  mk('Miltown Castle', 'ireland', 'Co. Clare'),
  mk('Milan Sforza Castle', 'italy', 'Lombardy', true),
  mk('Hamilton Castle', 'scotland', 'South Lanarkshire'),
  mk('Castello di Milano Marittima', 'italy', 'Emilia-Romagna'),
  mk('Castello Estense', 'italy', 'Emilia-Romagna'),
  mk('Rocchetta Mattei', 'italy', 'Emilia-Romagna'),
  mk('Kilkenny Castle', 'ireland', 'Kilkenny'),
  mk('Château de Chambord', 'france', 'Loir-et-Cher', true),
  mk('Edinburgh Castle', 'scotland', 'Edinburgh', true),
  mk('Edinburgh Dungeon', 'scotland', 'Edinburgh'),
  mk("Grand Master's Palace", 'malta', 'Valletta'),
  mk('Ardoe House', 'scotland', 'Aberdeenshire, Royal Deeside'),
  mk('Balmoral Castle', 'scotland', 'Royal Deeside', true),
  mk('Prague Castle', 'czech-republic', 'Prague', true),
  mk('Audley End House', 'england', 'Essex — Saffron Walden, 1 mile west of Saffron Walden, 15 miles south of Cambridge', true),
]);
const names = (r) => r.map((e) => e.name);
const noFuzzy = () => [];
let fuzzyCalls = 0;
const fuzzySpy = (hits) => (q) => { fuzzyCalls++; return hits(q); };

eq('normalize: accents, hyphen, apostrophe, spaces', normalizeSearchText("  Château-de  Master's "), 'chateau de masters');
eq('a 1-letter query returns nothing', rankSearch(corpus, 'm', noFuzzy), []);
eq('empty query returns nothing', rankSearch(corpus, '   ', noFuzzy), []);

// Tier order: starts with the name (featured first) -> inside the name (word start before mid-word) -> region/country
eq('"mil": starts-with first (featured Milan before Miltown), then inside the name (at a word start: Milano; then mid-word: Hamilton)', names(rankSearch(corpus, 'mil', noFuzzy)), ['Milan Sforza Castle', 'Miltown Castle', 'Castello di Milano Marittima', 'Hamilton Castle']);
eq('"mil" does not match a region because of "1 mile" / "15 miles"', names(rankSearch(corpus, 'mil', noFuzzy)).includes('Audley End House'), false);
eq('"mil" does not match "Emilia-Romagna" regions', ['Castello Estense', 'Rocchetta Mattei'].some((n) => names(rankSearch(corpus, 'mil', noFuzzy)).includes(n)), false);
eq('"edin": name starts, featured first, then A-Z', names(rankSearch(corpus, 'edin', noFuzzy)), ['Edinburgh Castle', 'Edinburgh Dungeon']);
eq('"chambord": inside the name (word start)', names(rankSearch(corpus, 'chambord', noFuzzy)), ['Château de Chambord']);
eq('accents are ignored both ways', names(rankSearch(corpus, 'château', noFuzzy)), ['Château de Chambord']);
eq('"masters" finds "Master\'s"', names(rankSearch(corpus, 'grand masters', noFuzzy)), ["Grand Master's Palace"]);
eq('"deeside": region word-start (featured first)', names(rankSearch(corpus, 'deeside', noFuzzy)), ['Balmoral Castle', 'Ardoe House']);
eq('"emilia": region match when nothing else matches', names(rankSearch(corpus, 'emilia', noFuzzy)), ['Castello di Milano Marittima', 'Castello Estense', 'Rocchetta Mattei']);
eq('a name match always beats a region match', names(rankSearch(corpus, 'edinburgh', noFuzzy)).slice(0, 2), ['Edinburgh Castle', 'Edinburgh Dungeon']);

// Fuzzy only with fewer than 5 results, never before exact results, never duplicated
const fuzzyPrague = fuzzySpy((q) => (q === 'praga' ? [corpus.find((e) => e.name === 'Prague Castle'), corpus.find((e) => e.name === 'Kilkenny Castle')] : []));
eq('"praga": no exact match -> fuzzy fills in', names(rankSearch(corpus, 'praga', fuzzyPrague)), ['Prague Castle', 'Kilkenny Castle']);
fuzzyCalls = 0;
rankSearch(corpus, 'castle', fuzzySpy(() => []));
eq('fuzzy is NOT called when there are 5 or more exact results ("castle")', fuzzyCalls, 0);
fuzzyCalls = 0;
const exactThenFuzzy = rankSearch(corpus, 'edin', fuzzySpy(() => [corpus.find((e) => e.name === 'Edinburgh Castle'), corpus.find((e) => e.name === 'Kilkenny Castle')]));
eq('fuzzy is called with fewer than 5 and its hits come after the exact ones, without duplicates', names(exactThenFuzzy), ['Edinburgh Castle', 'Edinburgh Dungeon', 'Kilkenny Castle']);
eq('...and it was called exactly once', fuzzyCalls, 1);
eq('results are capped at 8', rankSearch(corpus, 'ca', noFuzzy).length <= 8, true);

if (failures) { console.error(`\n${failures} test(s) failed`); process.exit(1); }
console.log('\nAll search ranking tests passed.');
