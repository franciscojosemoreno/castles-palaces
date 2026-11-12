#!/usr/bin/env node
// Fixture tests for lib/entry-price.js. Run directly:  node lib/entry-price.test.mjs
import { createRequire } from 'node:module';
const { getEntryPrice, searchPriceLabel, formatMoney, isHotelOnly } = createRequire(import.meta.url)('./entry-price.js');

let failures = 0;
const eq = (label, actual, expected) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.error(`FAIL: ${label}\n  expected ${e}\n  got      ${a}`); failures++; } else console.log(`ok: ${label}`);
};
const tour = (o) => ({ tour_id: '1', title: 't', type: 'entry_ticket', duration: '1h', rating: null, reviews: 0, ...o });

eq('formatMoney EUR/GBP/USD use symbols', [formatMoney(20, 'EUR'), formatMoney(15, 'GBP'), formatMoney(12, 'USD')], ['€20', '£15', '$12']);
eq('formatMoney other currencies use the ISO code', [formatMoney(27, 'CHF'), formatMoney(35, 'PLN'), formatMoney(155, 'DKK')], ['CHF 27', 'PLN 35', 'DKK 155']);
eq('formatMoney without a currency defaults to EUR, like the castle page', formatMoney(8, null), '€8');

// Featured tour price (GetYourGuide, always EUR) beats price_adult — also when price_adult has another currency
const kronborg = { price_adult: 155, gyg_featured_tours: [tour({ type: 'day_trip', price_from: 134 })] };
eq('tour price wins over price_adult: Quick Facts value', getEntryPrice(kronborg).value, '€134');
eq('tour price wins over price_adult: label', getEntryPrice(kronborg).label, 'Day trip from');
eq('tour price wins over price_adult: search', searchPriceLabel(kronborg), 'From €134');
eq('group price', searchPriceLabel({ gyg_featured_tours: [tour({ price_from: 1140, pricing_unit: 'group' })] }), 'From €1140 / group');
eq('no tour: the castle\'s own price in its own currency', searchPriceLabel({ price_adult: 35, price_currency: 'PLN' }), 'From PLN 35');
eq('no tour, no currency: EUR like the page', searchPriceLabel({ price_adult: 8 }), 'From €8');
eq('free castle without a tour shows Free', searchPriceLabel({ price_adult: 0 }), 'Free');
// Search only: free entry wins over the featured tour's price; the castle page (Quick Facts) still leads with the tour
const freeWithTour = { price_adult: 0, gyg_featured_tours: [tour({ type: 'guided_tour', price_from: 25 })] };
eq('free castle with a tour: search says Free', searchPriceLabel(freeWithTour), 'Free');
eq('free castle with a tour: Quick Facts is unchanged (tour price)', [getEntryPrice(freeWithTour).label, getEntryPrice(freeWithTour).value], ['Guided tour from', '€25']);
eq('free castle with a pass: search says Free, Quick Facts says Free too', [searchPriceLabel({ ...freeWithTour, gyg_featured_tours: [tour({ price_from: 124, multi_site_pass: true })] }), getEntryPrice({ ...freeWithTour, gyg_featured_tours: [tour({ price_from: 124, multi_site_pass: true })] }).value], ['Free', 'Free']);
eq('free tour shows Free', searchPriceLabel({ gyg_featured_tours: [tour({ price_from: 0 })] }), 'Free');
eq('no price anywhere: nothing', searchPriceLabel({}), null);
eq('no price anywhere: Quick Facts row', getEntryPrice({}), null);

// Multi-site pass: never the pass price as the castle's entry
const pass = { gyg_featured_tours: [tour({ price_from: 124, multi_site_pass: true })] };
eq('pass without own price: Quick Facts text', getEntryPrice(pass).value, 'Included in multi-site pass');
eq('pass without own price: search shows nothing', searchPriceLabel(pass), null);
eq('pass with own price: that price', searchPriceLabel({ ...pass, price_adult: 10 }), 'From €10');
eq('pass with own price 0: Free', searchPriceLabel({ ...pass, price_adult: 0 }), 'Free');

// Hotel-only castles: only the separate day-visit entry, never the room rate
const hotel = { hotel: { is_hotel: true, price_from_night: 148, currency: 'EUR' } };
eq('isHotelOnly', [isHotelOnly(hotel), isHotelOnly({ ...hotel, gyg_search_query: 'x' })], [true, false]);
eq('hotel-only without day-visit price: nothing', searchPriceLabel(hotel), null);
eq('hotel-only with day-visit price: its own currency', getEntryPrice({ ...hotel, price_adult: 6, price_currency: 'GBP' }).label + ' ' + getEntryPrice({ ...hotel, price_adult: 6, price_currency: 'GBP' }).value, 'Day-visit entry £6');

if (failures) { console.error(`\n${failures} test(s) failed`); process.exit(1); }
console.log('\nAll entry-price tests passed.');
