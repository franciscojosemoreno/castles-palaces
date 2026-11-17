#!/usr/bin/env node
// Fixture tests for lib/country-hub.js. Run: node lib/country-hub.test.mjs
import { createRequire } from 'node:module';
const h = createRequire(import.meta.url)('./country-hub.js');

let failures = 0;
const eq = (label, actual, expected) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.error(`FAIL: ${label}\n  expected ${e}\n  got      ${a}`); failures++; } else console.log(`ok: ${label}`);
};
const c = (id, type, o = {}) => ({ id, name: o.name || id, type, region: o.region ?? 'Alpha', featured: false, priority_score: 10, ...o });

const sample = [
  c('a', 'castle', { featured: true, priority_score: 5 }), c('b', 'castle', { priority_score: 80 }), c('c', 'palace', { priority_score: 60 }),
  c('d', 'fortress', { region: 'Beta' }), c('e', 'castle', { region: 'Beta' }), c('f', 'ruins', { region: 'Gamma' }),
];

eq('title lists the real kinds (short form: the full one is over 60)', h.buildHubTitle('Testland', sample), 'Castles in Testland: 6 Castles, Palaces & Forts');
const many = (n, type) => Array.from({ length: n }, (_, i) => c(type + i, type));
eq('title form 1 when it fits', h.buildHubTitleForm('Italy', [...many(3, 'castle'), ...many(2, 'palace'), ...many(1, 'fortress')]), { title: 'Castles in Italy: 6 Castles, Palaces and Fortresses to Visit', form: 1 });
eq('title form 2 (short nouns) when form 1 is over 60', h.buildHubTitleForm('Czech Republic', [...many(3, 'castle'), ...many(2, 'palace'), ...many(1, 'fortress')]), { title: 'Castles in Czech Republic: 6 Castles, Palaces & Forts', form: 2 });
eq('title form 3 (two kinds)', h.buildHubTitleForm('Democratic Test Republic', [...many(3, 'castle'), ...many(2, 'palace'), ...many(1, 'fortress')]), { title: 'Castles in Democratic Test Republic: 6 Castles & Palaces', form: 3 });
eq('title form 4 (sites)', h.buildHubTitleForm('A Country With A Very Long Official Name', many(12, 'castle')).form, 4);
eq('every title fits in 60', [h.buildHubTitle('Czech Republic', many(24, 'castle')), h.buildHubTitle('Bosnia & Herzegovina', many(7, 'fortress'))].every((t) => t.length <= 60), true);
eq('region list is not worth showing when every region has one ficha', h.worthShowingRegions(h.groupByRegion([c('1', 'castle', { region: 'A' }), c('2', 'castle', { region: 'B' }), c('3', 'castle', { region: 'C' })])), false);
eq('region list is worth showing with a group of two', h.worthShowingRegions(h.groupByRegion(sample)), true);
eq('Polish voivodeship spellings merge', [h.regionLabel('Lower Silesia Province — Czocha'), h.regionLabel('Lower Silesia / Wałbrzych'), h.regionLabel('Śląskie, Polish Jurassic Highland'), h.regionLabel('Silesia — Borynia')], ['Lower Silesia', 'Lower Silesia', 'Silesia', 'Silesia']);

// Hotel hubs
const hotelsFx = [1, 2, 3, 4, 5].map((i) => c('h' + i, 'castle', { name: 'Hotel ' + i, region: i < 4 ? 'North' : 'South', priority_score: 50 - i, hotel: { is_hotel: true, price_from_night: 100 * i, currency: 'EUR' } }));
eq('hotel title form 1', h.buildHotelHubTitleForm('Poland', hotelsFx.concat(hotelsFx).slice(0, 5)), { title: 'Castle Hotels in Poland: 5 Castles and Palaces to Stay In', form: 1 });
eq('hotel title falls back when long', h.buildHotelHubTitleForm('Bosnia & Herzegovina', hotelsFx).form > 1, true);
eq('hotel title: one hotel', h.buildHotelHubTitle('Monaco', [hotelsFx[0]]), 'Castle Hotel in Monaco: 1 Castle to Stay In');
eq('hotel meta fits in 160', h.buildHotelHubDescription('Poland', hotelsFx).length <= 160, true);
eq('hotel intro', h.buildHotelIntro2('Poland', hotelsFx), 'This guide lists 5 castle hotels in Poland, mostly in North and South.');
const hf = h.buildHotelHubFaqs('poland', 'Poland', hotelsFx);
eq('hotel FAQ questions', hf.map((f) => f.question), ['Which are the main castle hotels in Poland?', 'How many castle hotels are listed for Poland?', 'How much does a night in a castle hotel in Poland cost?']);
eq('hotel FAQ rate range', hf[2].answer.startsWith('All 5 hotels list a nightly room rate in EUR, from €100 at [Hotel 1](/castles/poland/h1) to €500 at [Hotel 5](/castles/poland/h5).'), true);
eq('title: one kind only', h.buildHubTitle('Monaco', [c('p', 'palace')]), 'Castles in Monaco: 1 Palace to Visit');
eq('title: no castles among the kinds', h.buildHubTitle('X', [c('1', 'fortress'), c('2', 'fortress'), c('3', 'palace')]), 'Castles in X: 3 Fortresses and Palaces to Visit');
eq('top sites: featured first, then priority', h.topCastles(sample, 3).map((x) => x.id), ['a', 'b', 'c']);
eq('description names the top sites', h.buildHubDescription('Testland', sample).startsWith('Castles in Testland: a, b, c, d and e.'), true);
eq('description fits in 160', h.buildHubDescription('Testland', sample).length <= 160, true);
const longNames = Array.from({ length: 6 }, (_, i) => c('x' + i, 'castle', { name: 'A Very Long Castle Name Number ' + i, priority_score: 90 - i }));
eq('description drops names until it fits', h.buildHubDescription('Bosnia and Herzegovina', longNames).length <= 160, true);

eq('region label: first segment', h.regionLabel('Karlovy Vary Region / West Bohemia'), 'Karlovy Vary Region');
eq('region label: dash', h.regionLabel('Bavaria — Bamberg, on the hill'), 'Bavaria');
eq('region label: comma', h.regionLabel('Cetinje, Montenegro'), 'Cetinje');
eq('region label: alias merges spellings', [h.regionLabel('Central Bohemian Region — Poděbrady'), h.regionLabel('Central Bohemia')], ['Central Bohemia', 'Central Bohemia']);
const groups = h.groupByRegion(sample);
eq('regions: largest first, ties alphabetical, singles gathered', groups.map((g) => [g.label, g.castles.length]), [['Alpha', 3], ['Beta', 2], ['Other areas', 1]]);
eq('regions: all singles stay as they are', h.groupByRegion([c('1', 'castle', { region: 'A' }), c('2', 'castle', { region: 'B' })]).map((g) => g.label), ['A', 'B']);
eq('main regions need two fichas', h.mainRegions(sample), ['Alpha', 'Beta']);
eq('intro: counts, kinds and regions', h.buildIntro2('Testland', sample), 'This guide covers 6 historic sites in Testland, mostly castles, palaces and fortresses. The largest groups are in Alpha and Beta.');
eq('intro: one kind only reads "all"', h.buildIntro2('Jersey', [c('1', 'castle', { region: 'Jersey' }), c('2', 'castle', { region: 'Jersey — east' })]), 'This guide covers 2 historic sites in Jersey, all castles.');
eq('intro: a single site', h.buildIntro2('Monaco', [c('p', 'palace')]), 'This guide covers 1 palace in Monaco.');

const tours = sample.map((x) => (x.id === 'b' || x.id === 'c' ? { ...x, gyg_featured_tours: [{ price_from: 20 }] } : x));
const faqs = h.buildHubFaqs('testland', 'Testland', tours);
eq('three questions', faqs.map((f) => f.question), ['Which are the main castles to visit in Testland?', 'How many castles and palaces are listed for Testland?', 'Which castles in Testland can be visited with a tour?']);
eq('answer 1 links the top sites', faqs[0].answer, 'The main sites in Testland include [a](/castles/testland/a), [b](/castles/testland/b), [c](/castles/testland/c), [d](/castles/testland/d) and [e](/castles/testland/e).');
eq('answer 2 counts by kind', faqs[1].answer, 'This guide lists 6 historic sites in Testland: 3 castles, 1 palace, 1 fortress and 1 ruin. Most are in Alpha.');
eq('answer 3 counts the sites with a tour', faqs[2].answer.startsWith('2 of the 6 sites have a guided tour or ticket'), true);
eq('all sites with a tour', h.buildHubFaqs('t', 'T', sample.map((x) => ({ ...x, gyg_featured_tours: [{ price_from: 5 }] })))[2].answer.startsWith('All 6 sites'), true);
eq('the Czech Republic reads with an article', h.buildIntro2('Czech Republic', sample).includes('in the Czech Republic'), true);
eq('no tour question without tours', h.buildHubFaqs('t', 'T', sample).length, 2);
eq('no FAQs for a tiny country', h.buildHubFaqs('t', 'T', sample.slice(0, 2)), []);
eq('palaces question needs three palaces', h.buildPalacesFaq('t', 'T', sample), null);
const pal = [c('p1', 'palace'), c('p2', 'palace'), c('p3', 'palace')];
eq('palaces question lists them', h.buildPalacesFaq('malta', 'Malta', pal).answer, "Malta's palaces include [p1](/castles/malta/p1), [p2](/castles/malta/p2) and [p3](/castles/malta/p3).");

if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log('all ok');
