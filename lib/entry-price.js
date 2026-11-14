// The one place that decides which price a castle shows and how it is written.
//
// Rule (decided 2026-11-14): the only price the site shows for a castle is the price of its ACTIVE
// GetYourGuide featured tour — `gyg_featured_tours[0]` with a `price_from` — which GetYourGuide always
// quotes in EUR. That is the price the site earns a commission on. A castle without an active tour shows
// no price at all: `price_adult` / `price_currency` (the official admission, any currency) is information
// for the description text, never a price the site displays.
//
// Used by the "Entry from…" row of Quick Facts on the castle page (components/castle/CastleQuickFacts.tsx),
// by scripts/generate-search-index.js (`price_label` of the ⌘K search) and by the JSON-LD `priceRange`
// (components/seo/StructuredData.tsx). Plain CommonJS so the Next build (TypeScript, allowJs) and the Node
// prebuild scripts (scripts/check-prices.mjs fails the build if a shown price breaks the rule) can load it.
//
//   const { getEntryPrice, searchPriceLabel, priceRangeLabel } = require('./entry-price');

/** @typedef {import('../types').Castle} Castle */
/**
 * @typedef {Object} EntryPrice
 * @property {string} label   Quick Facts row label, e.g. "Guided tour from", "Skip-the-line from", "Entry".
 * @property {string} value   Exactly what Quick Facts prints: "€20", "€120 / group" ("Free" only for a GetYourGuide tour priced 0).
 * @property {number | null} amount    The number behind `value` (null when `value` is only text).
 * @property {string | null} currency  ISO code of `amount` (null when there is no amount or it is free).
 * @property {boolean} free
 */

const CURRENCY_SYMBOLS = { EUR: '€', GBP: '£', USD: '$' };

/** "€20", "£15", "$12"; any other currency is written with its ISO code: "CHF 27", "PLN 35". */
function formatMoney(amount, currency) {
  const code = currency || 'EUR';
  const symbol = CURRENCY_SYMBOLS[code];
  return symbol ? `${symbol}${amount}` : `${code} ${amount}`;
}

/** Whether this castle has no GetYourGuide visit product at all — Estado C (hotel-only). */
function isHotelOnly(castle) {
  const hasGygProduct = Boolean(castle.gyg_featured_tours && castle.gyg_featured_tours.length) || Boolean(castle.gyg_search_query);
  return Boolean(castle.hotel && castle.hotel.is_hotel) && !hasGygProduct;
}

const TOUR_LABELS = {
  skip_the_line: 'Skip-the-line from',
  entry_ticket: 'Entry via GetYourGuide',
  entrance_ticket: 'Entry via GetYourGuide',
  guided_tour: 'Guided tour from',
  day_trip: 'Day trip from',
  boat_tour: 'Boat tour from',
  multi_day: 'Tour from',
};

/** The castle's active featured tour: the first one, and only while GetYourGuide still lists it (`price_from` set). */
function getActiveTour(castle) {
  const tour = castle.gyg_featured_tours && castle.gyg_featured_tours[0];
  return tour && tour.price_from != null ? tour : null;
}

/**
 * The price row of Quick Facts, or null when the castle page shows none (no active tour).
 * Always the active tour's price in EUR — also when the castle's own entry is free (that goes in the
 * description) and also when the tour is a multi-site pass ("Pass from €124": the pass is itself a
 * GetYourGuide product in EUR).
 * @param {Castle} castle
 * @returns {EntryPrice | null}
 */
function getEntryPrice(castle) {
  const tour = getActiveTour(castle);
  if (!tour) return null;
  const label = tour.multi_site_pass ? 'Pass from' : TOUR_LABELS[tour.type] || 'Tour from';
  if (tour.price_from === 0) return { label, value: 'Free', amount: 0, currency: null, free: true };
  const suffix = tour.pricing_unit === 'group' ? ' / group' : '';
  return { label, value: `${formatMoney(tour.price_from, 'EUR')}${suffix}`, amount: tour.price_from, currency: 'EUR', free: false };
}

/**
 * What the ⌘K search shows next to a castle: "From €20" (the same price as Quick Facts), or null when the
 * page shows no price. Whether the castle's own entry is free is never part of it.
 */
function searchPriceLabel(castle) {
  const entry = getEntryPrice(castle);
  if (!entry) return null;
  if (entry.free) return 'Free';
  return `From ${entry.value}`;
}

/**
 * The JSON-LD `priceRange` ("€20", "€1140 / group"), or null to leave it out. Same price as the search.
 */
function priceRangeLabel(castle) {
  const label = searchPriceLabel(castle);
  return label ? label.replace(/^From /, '') : null;
}

module.exports = { CURRENCY_SYMBOLS, formatMoney, isHotelOnly, getActiveTour, getEntryPrice, searchPriceLabel, priceRangeLabel };
