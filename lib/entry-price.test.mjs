#!/usr/bin/env node
// Fixture tests for lib/entry-price.js. Run directly:  node lib/entry-price.test.mjs
import { createRequire } from 'node:module';
const { getEntryPrice, searchPriceLabel, priceRangeLabel, getActiveTour, formatMoney, isHotelOnly } = createRequire(import.meta.url)('./entry-price.js');

let failures = 0;
const eq = (label, actual, expected) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.error(`FAIL: ${label}\n  expected ${e}\n  got      ${a}`); failures++; } else console.log(`ok: ${label}`);
};
const tour = (o) => ({ tour_id: '1', title: 't', type: 'entry_ticket', duration: '1h', rating: null, reviews: 0, ...o });

eq('formatMoney EUR/GBP/USD use symbols', [formatMoney(20, 'EUR'), formatMoney(15, 'GBP'), formatMoney(12, 'USD')], ['€20', '£15', '$12']);
eq('formatMoney other currencies use the ISO code', [formatMoney(27, 'CHF'), formatMoney(35, 'PLN'), formatMoney(155, 'DKK')], ['CHF 27', 'PLN 35', 'DKK 155']);
eq('formatMoney without a currency defaults to EUR', formatMoney(8, null), '€8');

// The only price shown is the active GetYourGuide tour's, in EUR — price_adult / price_currency never count
const kronborg = { price_adult: 155, price_currency: 'DKK', gyg_featured_tours: [tour({ type: 'day_trip', price_from: 134 })] };
eq('tour price: Quick Facts value', getEntryPrice(kronborg).value, '€134');
eq('tour price: label', getEntryPrice(kronborg).label, 'Day trip from');
eq('tour price: currency', getEntryPrice(kronborg).currency, 'EUR');
eq('tour price: search', searchPriceLabel(kronborg), 'From €134');
eq('tour price: JSON-LD priceRange', priceRangeLabel(kronborg), '€134');
eq('group price', searchPriceLabel({ gyg_featured_tours: [tour({ price_from: 1140, pricing_unit: 'group' })] }), 'From €1140 / group');
eq('group price: JSON-LD', priceRangeLabel({ gyg_featured_tours: [tour({ price_from: 1140, pricing_unit: 'group' })] }), '€1140 / group');

// No active tour: no price anywhere, whatever price_adult says
for (const [label, castle] of [
  ['no tour, own price in a local currency', { price_adult: 35, price_currency: 'PLN' }],
  ['no tour, own price without currency', { price_adult: 8 }],
  ['no tour, free entry', { price_adult: 0 }],
  ['tour delisted (price_from null)', { price_adult: 12, gyg_featured_tours: [tour({ price_from: null })] }],
  ['hotel-only with a day-visit price', { price_adult: 6, price_currency: 'GBP', hotel: { is_hotel: true, price_from_night: 148, currency: 'EUR' } }],
  ['nothing at all', {}],
]) {
  eq(`${label}: Quick Facts row`, getEntryPrice(castle), null);
  eq(`${label}: search`, searchPriceLabel(castle), null);
  eq(`${label}: JSON-LD`, priceRangeLabel(castle), null);
}
eq('getActiveTour: first tour with a price', getActiveTour({ gyg_featured_tours: [tour({ price_from: 9 }), tour({ price_from: 5 })] }).price_from, 9);
eq('getActiveTour: a later tour does not count when the first is delisted', getActiveTour({ gyg_featured_tours: [tour({ price_from: null }), tour({ price_from: 5 })] }), null);

// Free entry with an active tour: the rule applies without exception — the tour's price everywhere
const freeWithTour = { price_adult: 0, gyg_featured_tours: [tour({ type: 'guided_tour', price_from: 25 })] };
eq('free castle with a tour: Quick Facts shows the tour price', [getEntryPrice(freeWithTour).label, getEntryPrice(freeWithTour).value], ['Guided tour from', '€25']);
eq('free castle with a tour: search shows the tour price', searchPriceLabel(freeWithTour), 'From €25');
eq('free castle with a tour: JSON-LD shows the tour price', priceRangeLabel(freeWithTour), '€25');
eq('a GetYourGuide tour priced 0 is Free', searchPriceLabel({ gyg_featured_tours: [tour({ price_from: 0 })] }), 'Free');

// Multi-site pass: the pass is a GetYourGuide product in EUR, so its price is the price shown
const pass = { gyg_featured_tours: [tour({ price_from: 124, multi_site_pass: true })] };
eq('pass: Quick Facts label and value', [getEntryPrice(pass).label, getEntryPrice(pass).value], ['Pass from', '€124']);
eq('pass: search', searchPriceLabel(pass), 'From €124');
eq('pass: JSON-LD', priceRangeLabel(pass), '€124');
eq('pass with own price in another currency: still the pass price', [getEntryPrice({ ...pass, price_adult: 10, price_currency: 'GBP' }).value, searchPriceLabel({ ...pass, price_adult: 10 })], ['€124', 'From €124']);
eq('free castle with a pass: the pass price', searchPriceLabel({ ...pass, price_adult: 0 }), 'From €124');

// Hotel-only castles
const hotel = { hotel: { is_hotel: true, price_from_night: 148, currency: 'EUR' } };
eq('isHotelOnly', [isHotelOnly(hotel), isHotelOnly({ ...hotel, gyg_search_query: 'x' })], [true, false]);

if (failures) { console.error(`\n${failures} test(s) failed`); process.exit(1); }
console.log('\nAll entry-price tests passed.');
