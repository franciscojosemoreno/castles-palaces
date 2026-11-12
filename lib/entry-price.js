// The one place that decides which entry price a castle shows and how it is written.
//
// Used by the "Entry from…" row of Quick Facts on the castle page (components/castle/CastleQuickFacts.tsx)
// and by scripts/generate-search-index.js, which writes it into public/search-index.json for the ⌘K
// search. Plain CommonJS so both the Next build (TypeScript, allowJs) and the Node prebuild script can
// load it without a TypeScript step. If the Quick Facts price changes, the search price changes with it.
//
//   const { getEntryPrice, searchPriceLabel } = require('./entry-price');

/** @typedef {import('../types').Castle} Castle */
/**
 * @typedef {Object} EntryPrice
 * @property {string} label   Quick Facts row label, e.g. "Entry from", "Guided tour from", "Day-visit entry".
 * @property {string} value   Exactly what Quick Facts prints: "€20", "Free", "€120 / group", "Included in multi-site pass".
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

/**
 * The entry price row of Quick Facts, or null when the castle page shows none.
 * - Hotel-only castles: the separate "Day-visit entry" price, only when `price_adult` is set (the room
 *   rate has its own "Rooms from" row and is not an entry price).
 * - Everything else: the featured tour's price (always EUR on GetYourGuide) or, without one, the castle's
 *   own `price_adult` in its `price_currency`. A multi-site pass price is never shown as the castle's
 *   entry: with a pass the row shows the castle's own `price_adult`, or says it is included in the pass.
 * @param {Castle} castle
 * @returns {EntryPrice | null}
 */
function getEntryPrice(castle) {
  const free = { value: 'Free', amount: 0, currency: null, free: true };
  const own = (label) =>
    castle.price_adult === 0
      ? { label, ...free }
      : { label, value: formatMoney(castle.price_adult, castle.price_currency), amount: castle.price_adult, currency: castle.price_currency || 'EUR', free: false };

  if (isHotelOnly(castle)) {
    return castle.price_adult != null ? own('Day-visit entry') : null;
  }

  const tour = castle.gyg_featured_tours && castle.gyg_featured_tours[0];
  if (castle.price_adult == null && !(tour && tour.price_from != null)) return null;

  if (tour && tour.multi_site_pass) {
    return castle.price_adult != null
      ? own('Entry')
      : { label: 'Entry', value: 'Included in multi-site pass', amount: null, currency: null, free: false };
  }

  const label = tour ? TOUR_LABELS[tour.type] || 'Tour from' : 'Entry from';
  if (tour && tour.price_from != null) {
    if (tour.price_from === 0) return { label, ...free };
    const suffix = tour.pricing_unit === 'group' ? ' / group' : '';
    return { label, value: `${formatMoney(tour.price_from, 'EUR')}${suffix}`, amount: tour.price_from, currency: 'EUR', free: false };
  }
  return own(label);
}

/**
 * What the ⌘K search shows next to a castle: "Free", "From €20", or null when the page shows no price.
 * Same as the Quick Facts price with one deliberate difference: a castle whose own entry is free
 * (`price_adult` 0) says "Free" in the search even when the page leads with a featured tour's price,
 * because that is what someone scanning search results wants to know. The castle page does not change.
 */
function searchPriceLabel(castle) {
  if (castle.price_adult === 0) return 'Free';
  const entry = getEntryPrice(castle);
  if (!entry) return null;
  if (entry.free) return 'Free';
  if (entry.amount == null) return null;
  return `From ${entry.value}`;
}

module.exports = { CURRENCY_SYMBOLS, formatMoney, isHotelOnly, getEntryPrice, searchPriceLabel };
