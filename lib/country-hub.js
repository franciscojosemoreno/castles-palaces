// Everything the country hub (/castles/[country]) says about a country that can be worked out from its
// castle data: the title and meta description, the second intro paragraph, the "castles by region" lists,
// the palaces list and the three FAQ answers. One generator for every country, so a new country gets the
// same hub without anyone writing it by hand. Anything a person already wrote in data/countries.json
// (seo_title_override, seo_description_override, intro_paragraph_2, hub_faqs) always wins over what is
// generated here.
//
// Plain CommonJS (like lib/entry-price.js) so the page, the tests and the prebuild scripts can all load it.
//
//   const { buildHubTitle, buildHubDescription, groupByRegion, ... } = require('./country-hub');

/** @typedef {import('../types').Castle} Castle */

const TYPE_ORDER = ['castle', 'chateau', 'palace', 'fortress', 'tower', 'manor', 'ruins', 'monastery'];
const TYPE_PLURAL = {
  castle: 'castles', chateau: 'châteaux', palace: 'palaces', fortress: 'fortresses',
  tower: 'towers', manor: 'manors', ruins: 'ruins', monastery: 'monasteries',
};
const TYPE_SINGULAR = {
  castle: 'castle', chateau: 'château', palace: 'palace', fortress: 'fortress',
  tower: 'tower', manor: 'manor', ruins: 'ruin', monastery: 'monastery',
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Country names that read with "the" in a sentence ("in the Czech Republic"); the title and the meta keep the plain name.
const WITH_THE = new Set(['Czech Republic', 'Netherlands']);
function inCountry(name) {
  return WITH_THE.has(name) ? `the ${name}` : name;
}

/** "A", "A and B", "A, B and C". */
function joinList(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function plural(type, n) {
  return n === 1 ? TYPE_SINGULAR[type] || type : TYPE_PLURAL[type] || `${type}s`;
}

/** [{ type, count }] — most numerous type first, ties in the usual castle → palace → fortress order. */
function typeCounts(castles) {
  const counts = new Map();
  for (const c of castles) counts.set(c.type, (counts.get(c.type) || 0) + 1);
  const rank = (t) => (TYPE_ORDER.includes(t) ? TYPE_ORDER.indexOf(t) : TYPE_ORDER.length);
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || rank(a.type) - rank(b.type) || a.type.localeCompare(b.type));
}

/** The kinds of site a country really has, as plural nouns, e.g. ["Castles", "Palaces", "Fortresses"]. */
function typeNouns(castles, max = 3) {
  const top = typeCounts(castles).slice(0, max);
  const total = castles.length;
  return top.map(({ type }) => cap(plural(type, total === 1 ? 1 : 2)));
}

/** "117 castles, 42 palaces, 13 fortresses, 1 ruins and 1 monastery". */
function typeCountsPhrase(castles) {
  return joinList(typeCounts(castles).map(({ type, count }) => `${count} ${plural(type, count)}`));
}

const MAX_TITLE = 60; // characters, not counting the suffix the site adds ("— Castles & Palaces")
const SHORT_NOUN = { Fortresses: 'Forts', Fortress: 'Fort', Monasteries: 'Monasteries' };
const shortNoun = (n) => SHORT_NOUN[n] || n;

/** "A, B & C" — the short list used when the full title does not fit. */
function joinAmp(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`;
}

/**
 * Page title (the site adds its own suffix), at most 60 characters without it. The first form that fits wins:
 *   1  Castles in Italy: 119 Castles, Palaces and Fortresses to Visit
 *   2  Castles in Italy: 119 Castles, Palaces & Forts
 *   3  Castles in Italy: 119 Castles & Palaces
 *   4  Castles in Italy: 119 Sites to Visit
 * The kinds are the ones the country really has (the three most numerous in forms 1-2, two in form 3).
 * @param {string} name
 * @param {Castle[]} castles
 * @returns {{ title: string, form: number }}
 */
function buildHubTitleForm(name, castles) {
  const n = castles.length;
  const nouns = typeNouns(castles);
  const prefix = `Castles in ${name}: ${n}`;
  const forms = [
    `${prefix} ${joinList(nouns)} to Visit`,
    `${prefix} ${joinAmp(nouns.map(shortNoun))}`,
    `${prefix} ${joinAmp(nouns.slice(0, 2).map(shortNoun))}`,
    `${prefix} Sites to Visit`,
  ];
  const i = forms.findIndex((t) => t.length <= MAX_TITLE);
  return { title: forms[i === -1 ? 3 : i], form: i === -1 ? 4 : i + 1 };
}

function buildHubTitle(name, castles) {
  return buildHubTitleForm(name, castles).title;
}

/** The sites to name first: featured ones, then the highest priority_score, never a hotel-only ficha. */
function topCastles(castles, limit = 5) {
  const score = (c) => c.priority_score || 0;
  return [...castles]
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || score(b) - score(a) || (b.annual_visitors || 0) - (a.annual_visitors || 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Meta description, at most 160 characters: the country's main sites by name, then what the page offers. */
function buildHubDescription(name, castles) {
  const names = topCastles(castles).map((c) => c.name);
  const tail = `Tickets, tours and tips for ${castles.length} ${castles.length === 1 ? 'site' : 'sites'}.`;
  for (let n = Math.min(5, names.length); n >= 1; n--) {
    const text = `Castles in ${name}: ${joinList(names.slice(0, n))}. ${tail}`;
    if (text.length <= 160) return text;
  }
  return `Castles in ${name}. ${tail}`;
}

// Presentation-only: the region field is free text and a few places are spelt two ways. This never moves a
// castle between groups beyond merging those spellings.
const REGION_ALIASES = {
  'Central Bohemian Region': 'Central Bohemia',
  'South Moravian Region': 'South Moravia',
  "Valle d'Aosta": 'Aosta Valley',
  Bourgogne: 'Burgundy',
  Trentino: 'Trentino-Alto Adige',
  'Central Bosnia Canton': 'Central Bosnia',
  // Poland: the same voivodeship written as province, voivodeship or its old name
  'Lower Silesia Province': 'Lower Silesia',
  'Subcarpathian Voivodeship': 'Subcarpathia',
  'Warmian-Masurian Voivodeship': 'Warmia-Masuria',
  'Warmia-Masuria': 'Warmia-Masuria',
  Warmia: 'Warmia-Masuria',
  Masuria: 'Warmia-Masuria',
  'Greater Poland Voivodeship': 'Greater Poland',
  'Pomeranian Voivodeship': 'Pomerania',
  'Kuyavian-Pomeranian Voivodeship': 'Kuyavian-Pomerania',
  'Łódź Voivodeship': 'Łódź',
  'Opole Voivodeship': 'Opole',
  'Podlaskie Voivodeship': 'Podlaskie',
  Mazovia: 'Masovia',
  Mazowieckie: 'Masovia',
  Subcarpathia: 'Subcarpathia',
  'Śląskie': 'Silesia',
  'Silesian Voivodeship': 'Silesia',
  'Małopolskie': 'Lesser Poland',
};

/** "Karlovy Vary Region / West Bohemia" → "Karlovy Vary Region"; "Bavaria — Bamberg, …" → "Bavaria". */
function regionLabel(region) {
  const first = (region || '').split(/\s+[—–]\s+|\s+-\s+|,|\/|\(/)[0].trim();
  return REGION_ALIASES[first] || first;
}

/**
 * Castles grouped by region, largest group first. Regions with a single ficha are gathered under
 * "Other areas" when the country has at least one larger group; otherwise (every region has one ficha) they
 * stay as they are. Order inside a group follows the input order.
 * @returns {{ label: string, castles: Castle[] }[]}
 */
function groupByRegion(castles) {
  const map = new Map();
  for (const c of castles) {
    const label = regionLabel(c.region);
    if (!label) continue;
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(c);
  }
  let groups = [...map.entries()].map(([label, cs]) => ({ label, castles: cs }));
  groups.sort((a, b) => b.castles.length - a.castles.length || a.label.localeCompare(b.label));
  if (groups.some((g) => g.castles.length >= 2)) {
    const big = groups.filter((g) => g.castles.length >= 2);
    const single = groups.filter((g) => g.castles.length < 2).flatMap((g) => g.castles);
    groups = single.length ? [...big, { label: 'Other areas', castles: single }] : big;
  }
  return groups;
}

/** Whether a "by region" list is worth showing: some region has two or more fichas (and there is more than one list item). */
function worthShowingRegions(groups) {
  return groups.length > 1 && groups.some((g) => g.castles.length >= 2);
}

/** Regions with at least two fichas, largest first (at most three) — "the main regions" of the intro. */
function mainRegions(castles, limit = 3, countryName = '') {
  return groupByRegion(castles)
    .filter((g) => g.label !== 'Other areas' && g.castles.length >= 2 && g.label.toLowerCase() !== countryName.toLowerCase())
    .slice(0, limit)
    .map((g) => g.label);
}

/** Second intro paragraph: how many sites, which kinds and where the biggest groups are. */
function buildIntro2(name, castles) {
  const n = castles.length;
  if (n === 1) return `This guide covers 1 ${TYPE_SINGULAR[castles[0].type] || castles[0].type} in ${inCountry(name)}.`;
  const kinds = joinList(typeNouns(castles).map((s) => s.toLowerCase()));
  const regions = mainRegions(castles, 3, name);
  const where = regions.length ? ` The largest groups are in ${joinList(regions)}.` : '';
  const all = typeCounts(castles).length === 1 ? 'all' : 'mostly';
  return `This guide covers ${n} historic sites in ${inCountry(name)}, ${all} ${kinds}.${where}`;
}

const link = (country, c) => `[${c.name}](/castles/${country}/${c.id})`;

/**
 * Castles of a given type, in the input order.
 * @param {Castle[]} castles
 * @param {string} type
 * @returns {Castle[]}
 */
function castlesOfType(castles, type) {
  return castles.filter((c) => c.type === type);
}

/** Sites with an active GetYourGuide featured tour or ticket (the first featured tour still has a price). */
function castlesWithTour(castles) {
  return castles.filter((c) => c.gyg_featured_tours && c.gyg_featured_tours[0] && c.gyg_featured_tours[0].price_from != null);
}

/**
 * The three generated FAQs of a hub (answers use [name](/castles/country/id) links): the main sites, how many
 * there are, and which can be visited with a tour. A question is left out when it cannot be answered.
 * @returns {{ question: string, answer: string }[]}
 */
function buildHubFaqs(country, name, castles) {
  const faqs = [];
  if (castles.length < 3) return faqs;

  const top = topCastles(castles);
  faqs.push({
    question: `Which are the main castles to visit in ${inCountry(name)}?`,
    answer: `The main sites in ${inCountry(name)} include ${joinList(top.map((c) => link(country, c)))}.`,
  });

  const regions = mainRegions(castles, 1, name);
  faqs.push({
    question: `How many castles and palaces are listed for ${inCountry(name)}?`,
    answer: `This guide lists ${castles.length} historic sites in ${inCountry(name)}: ${typeCountsPhrase(castles)}.${regions.length ? ` Most are in ${regions[0]}.` : ''}`,
  });

  const withTour = castlesWithTour(castles);
  if (withTour.length) {
    const names = topCastles(withTour).map((c) => link(country, c));
    faqs.push({
      question: `Which castles in ${inCountry(name)} can be visited with a tour?`,
      answer: `${withTour.length === castles.length ? `All ${castles.length}` : `${withTour.length} of the ${castles.length}`} sites have a guided tour or ticket that can be booked through GetYourGuide, including ${joinList(names)}.`,
    });
  }
  return faqs;
}

/** "Malta's palaces include [A](…), [B](…) and [C](…)." — for the pilot hub's palace question. */
function buildPalacesFaq(country, name, castles) {
  const palaces = castlesOfType(castles, 'palace');
  if (palaces.length < 3) return null;
  return {
    question: `What are the most famous palaces in ${name}?`,
    answer: `${name}'s palaces include ${joinList(palaces.map((c) => link(country, c)))}.`,
  };
}


// ── Castle hotels (/castle-hotels/[country]) ────────────────────────────────────────────────────────────────
// The same generator for the hotel hubs: title, meta, second intro paragraph, "by region" list and three FAQs,
// all worked out from the hotel fichas of the country.

const CURRENCY_SYMBOLS = { EUR: '€', GBP: '£', USD: '$' };
const money = (n, cur) => (CURRENCY_SYMBOLS[cur] ? `${CURRENCY_SYMBOLS[cur]}${n}` : `${cur} ${n}`);

/**
 * Hotel hub title, at most 60 characters without the site suffix:
 *   1  Castle Hotels in Poland: 47 Castles and Palaces to Stay In
 *   2  Castle Hotels in Poland: 47 Castles to Stay In
 *   3  Castle Hotels in Poland: 47 Hotels
 * @param {string} name
 * @param {Castle[]} hotels
 * @returns {{ title: string, form: number }}
 */
function buildHotelHubTitleForm(name, hotels) {
  const n = hotels.length;
  const forms = n === 1
    ? [`Castle Hotel in ${name}: 1 Castle to Stay In`, `Castle Hotel in ${name}`]
    : [`Castle Hotels in ${name}: ${n} Castles and Palaces to Stay In`, `Castle Hotels in ${name}: ${n} Castles to Stay In`, `Castle Hotels in ${name}: ${n} Hotels`];
  const i = forms.findIndex((t) => t.length <= MAX_TITLE);
  return { title: forms[i === -1 ? forms.length - 1 : i], form: i === -1 ? forms.length : i + 1 };
}

function buildHotelHubTitle(name, hotels) {
  return buildHotelHubTitleForm(name, hotels).title;
}

/** Hotel hub meta description (at most 160 characters): the main hotels by name, then what the page offers. */
function buildHotelHubDescription(name, hotels) {
  const names = topCastles(hotels).map((c) => c.name);
  const tail = hotels.length === 1 ? 'Rooms, rates and tips for a castle you can stay in.' : `Rooms, rates and tips for ${hotels.length} castles and palaces you can stay in.`;
  for (let n = Math.min(5, names.length); n >= 1; n--) {
    const text = `Castle hotels in ${name}: ${joinList(names.slice(0, n))}. ${tail}`;
    if (text.length <= 160) return text;
  }
  return `Castle hotels in ${name}. ${tail}`;
}

function buildHotelIntro2(name, hotels) {
  const n = hotels.length;
  if (n === 1) return `This guide lists 1 castle hotel in ${inCountry(name)}.`;
  const regions = mainRegions(hotels, 3, name);
  return `This guide lists ${n} castle hotels in ${inCountry(name)}${regions.length ? `, mostly in ${joinList(regions)}` : ''}.`;
}

/**
 * Three FAQs for a hotel hub (answers use [name](/castles/country/id) links): the main hotels, how many there
 * are and what a night costs. A question is left out when it cannot be answered from the data.
 */
function buildHotelHubFaqs(country, name, hotels) {
  const faqs = [];
  if (hotels.length < 3) return faqs;
  const top = topCastles(hotels);
  faqs.push({
    question: `Which are the main castle hotels in ${inCountry(name)}?`,
    answer: `The main castle hotels in ${inCountry(name)} include ${joinList(top.map((c) => link(country, c)))}.`,
  });
  const regions = mainRegions(hotels, 1, name);
  faqs.push({
    question: `How many castle hotels are listed for ${inCountry(name)}?`,
    answer: `This guide lists ${hotels.length} castle hotels in ${inCountry(name)}.${regions.length ? ` Most are in ${regions[0]}.` : ''}`,
  });
  // Nightly rates: only rooms priced per room per night, in the currency most hotels use.
  const priced = hotels.filter((c) => c.hotel && typeof c.hotel.price_from_night === 'number' && !c.hotel.price_unit);
  const byCurrency = new Map();
  for (const c of priced) byCurrency.set(c.hotel.currency || 'EUR', [...(byCurrency.get(c.hotel.currency || 'EUR') || []), c]);
  const [currency, list] = [...byCurrency.entries()].sort((a, b) => b[1].length - a[1].length)[0] || [];
  if (list && list.length >= 2) {
    const sorted = [...list].sort((a, b) => a.hotel.price_from_night - b.hotel.price_from_night);
    const lo = sorted[0];
    const hi = sorted[sorted.length - 1];
    faqs.push({
      question: `How much does a night in a castle hotel in ${inCountry(name)} cost?`,
      answer: `${list.length === hotels.length ? `All ${hotels.length}` : `${list.length} of the ${hotels.length}`} hotels list a nightly room rate in ${currency}, from ${money(lo.hotel.price_from_night, currency)} at ${link(country, lo)} to ${money(hi.hotel.price_from_night, currency)} at ${link(country, hi)}. Rates vary by season and room.`,
    });
  }
  return faqs;
}

module.exports = {
  joinList, typeCounts, typeNouns, typeCountsPhrase, buildHubTitle, buildHubTitleForm, topCastles, buildHubDescription, worthShowingRegions,
  buildHotelHubTitle, buildHotelHubTitleForm, buildHotelHubDescription, buildHotelIntro2, buildHotelHubFaqs,
  regionLabel, groupByRegion, mainRegions, buildIntro2, castlesOfType, castlesWithTour, buildHubFaqs, buildPalacesFaq,
};
