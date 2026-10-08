#!/usr/bin/env node
// Fixture tests for scripts/lint-public-copy.mjs — one minimal failing
// example and one legitimate passing example per rule. Run directly:
//   node scripts/lint-public-copy.test.mjs
// Exits 1 if any assertion fails.

import { ERROR_RULES, maskLinksAndUrls, UK_LIKE_COUNTRIES, CURRENCY_CONTEXT_RE, TITLE_PRICE_PATTERN, HISTORICAL_SALE_RE, TOP_RATED_CLAIM_RE, claimedTourMeetsThreshold, scanTopRatedClaims } from './lint-public-copy.mjs';

let failures = 0;
function ruleMatches(name, text) {
  const rule = ERROR_RULES.find(r => r.name === name);
  if (!rule) throw new Error(`no such rule: ${name}`);
  const masked = maskLinksAndUrls(text);
  const hits = [];
  for (const m of masked.matchAll(rule.pattern)) {
    const fp = rule.filter ? rule.filter(m, masked, m.index) : true;
    if (fp === true) hits.push(m[0]);
  }
  return hits;
}

function assertFails(label, ruleName, text) {
  const hits = ruleMatches(ruleName, text);
  if (hits.length === 0) {
    console.error(`FAIL (expected a match): ${label}\n  rule=${ruleName} text=${JSON.stringify(text)}`);
    failures++;
  } else {
    console.log(`ok   (fails as expected): ${label}`);
  }
}

function assertPasses(label, ruleName, text) {
  const hits = ruleMatches(ruleName, text);
  if (hits.length !== 0) {
    console.error(`FAIL (expected no match, got ${JSON.stringify(hits)}): ${label}\n  rule=${ruleName} text=${JSON.stringify(text)}`);
    failures++;
  } else {
    console.log(`ok   (passes as expected): ${label}`);
  }
}

// --- product-id ---
assertFails('bare product id in prose', 'product-id',
  'The GYG tour (t976544) covers the castle.');
assertPasses('product id only inside a markdown link target, never in rendered text', 'product-id',
  'See [this castle](/castles/france/some-castle-t976544) for more.');

// --- usd ---
assertFails('dollar sign before a digit', 'usd',
  'The private tour costs $90 per person.');
assertFails('literal USD', 'usd',
  'Priced at 90 USD per person.');
assertPasses('euro and pound signs are not USD', 'usd',
  'The private tour costs €90 (~£78) per person.');

// --- review-figure ---
assertFails('star rating with decimal', 'review-figure',
  'The tour has a 4.9★ rating.');
assertFails('review count', 'review-figure',
  'Based on 135 reviews, the tour is well regarded.');
assertFails('rating of N phrasing', 'review-figure',
  'The product has a rating of 5 on GetYourGuide.');
assertFails('thousands-separated review count with a trailing +', 'review-figure',
  'Book this tour — 21,000+ reviews on GetYourGuide.');
assertFails('thousands-separated review count, no +', 'review-figure',
  'This tour has 1,185 reviews so far.');
assertPasses('no exact figure, just a qualitative claim', 'review-figure',
  'The tour is highly and consistently rated on GetYourGuide.');

// --- internal-jargon ---
assertFails('REGLA citation', 'internal-jargon',
  'Rating is null per REGLA #3.');
assertFails('New Activity status label', 'internal-jargon',
  "The listing is tagged 'New Activity' with rating: null.");
assertFails('Includes list methodology citation', 'internal-jargon',
  'Entrance is confirmed ✓ in the GYG Includes list.');
assertFails('is_top_pick literal field name', 'internal-jargon',
  'This product (is_top_pick) is the best option.');
assertPasses('legitimate beer-batch exception', 'internal-jargon',
  "On 5 October 1842, brewmaster Josef Groll produced the first batch of a new style of beer.");
assertPasses('ordinary prose with no internal terms', 'internal-jargon',
  'The tour includes castle entrance tickets and a local guide.');

// --- grammar ---
assertFails('double space', 'grammar', 'The castle is  open daily.');
assertFails('empty parens left over from a strip', 'grammar', 'The GYG tour () covers the castle.');
assertFails('comma before closing paren', 'grammar', 'The GYG tour (6 hours, ) covers the castle.');
assertFails('two sentences glued with no space', 'grammar', 'Book in advance.The castle opens at nine.');
assertPasses('a real domain is not a missing-space defect', 'grammar',
  'Confirm current hours at chateau-reignac.com before visiting.');
assertPasses('a common abbreviation is not a missing-space defect', 'grammar',
  'Compare guided vs. self-guided access before booking.');

// --- maskLinksAndUrls (used by every rule above, tested directly too) ---
{
  const masked = maskLinksAndUrls('See [Reignac Castle](/castles/france/chateau-de-reignac) for details.');
  if (masked.includes('(') || masked.includes(')')) {
    console.error('FAIL: maskLinksAndUrls left markdown link syntax behind:', JSON.stringify(masked));
    failures++;
  } else if (!masked.includes('Reignac Castle')) {
    console.error('FAIL: maskLinksAndUrls dropped the visible link text:', JSON.stringify(masked));
    failures++;
  } else {
    console.log('ok   (markdown link reduced to its visible text, no empty-parens artifact)');
  }
}

// --- currency-gbp-wrong-country (scoped to ±80 chars of a product word) ---
{
  const near = 'The GYG entry ticket costs £15 per person.';
  const far = "D'Arcy spent £500 constructing the west wing of the house back in 1832.";
  const windowNear = near.slice(Math.max(0, near.indexOf('£') - 80), near.indexOf('£') + 80);
  const windowFar = far.slice(Math.max(0, far.indexOf('£') - 80), far.indexOf('£') + 80);
  if (!CURRENCY_CONTEXT_RE.test(windowNear)) {
    console.error('FAIL: expected £ near "GYG"/"ticket" to be in scope:', JSON.stringify(near));
    failures++;
  } else {
    console.log('ok   (fails as expected): £ price next to a GYG/ticket mention');
  }
  if (CURRENCY_CONTEXT_RE.test(windowFar)) {
    console.error('FAIL: expected a historical £ cost with no product word nearby to pass:', JSON.stringify(far));
    failures++;
  } else {
    console.log('ok   (passes as expected): historical £ construction cost with no GYG/tour context nearby');
  }
}

// --- title-price (titles/labels: price, price-unit, review figures, ids, jargon) ---
function titlePriceMatches(text) {
  const hits = [];
  for (const m of text.matchAll(TITLE_PRICE_PATTERN)) {
    const token = m[0];
    const isMoneyLike = /[€£$]|EUR|USD|GBP|per\s+(person|group)|\/\s?p(p|erson)\b/i.test(token);
    if (isMoneyLike && HISTORICAL_SALE_RE.test(text)) continue; // historical sale price, not a live GYG price
    if (token === '⚠️') continue;
    hits.push(token);
  }
  return hits;
}

function assertTitleFails(label, text) {
  const hits = titlePriceMatches(text);
  if (hits.length === 0) {
    console.error(`FAIL (expected a match): ${label}\n  text=${JSON.stringify(text)}`);
    failures++;
  } else {
    console.log(`ok   (fails as expected): ${label}`);
  }
}

function assertTitlePasses(label, text) {
  const hits = titlePriceMatches(text);
  if (hits.length !== 0) {
    console.error(`FAIL (expected no match, got ${JSON.stringify(hits)}): ${label}\n  text=${JSON.stringify(text)}`);
    failures++;
  } else {
    console.log(`ok   (passes as expected): ${label}`);
  }
}

assertTitleFails('embedded GYG price and per-person unit in a featured-tour title',
  'Lausanne: Private Day Trip to Vevey, Montreux & Aigle Castle — Swiss Riviera Circuit (~€419/person, 7 hours)');
assertTitleFails('embedded star rating in a title', 'Best-Rated City Tour — 4.9★ (2 hours)');
assertTitleFails('product id leaked into a title', 'Prague Castle Tour t976544 (3 hours)');
assertTitlePasses('duration only, no price', 'Lausanne: Private Day Trip to Vevey, Montreux & Aigle Castle — Swiss Riviera Circuit (7 hours)');
assertTitlePasses('decimal-range duration is not a price or rating figure', 'Edinburgh Castle & Highlands Day Tour (3.5–4h)');
assertTitlePasses('a qualitative badge with no figures', 'Prague Castle Skip-the-Line Tour — Top Rated');
assertTitlePasses('a historical sale price in a meta_title is not a live GYG price',
  'Bovey Castle — An Edwardian Dartmoor Resort Sold for £15,000');

// --- top-rated-claim-below-threshold (error, promoted from warning once baseline hit 0) ---
function topRatedClaimErrors(text, ownRating, ownReviews, ratingLookup = new Map(), field = 'description') {
  const errors = [];
  scanTopRatedClaims('fixture.json', [[field, text]], ownRating, ownReviews, ratingLookup, errors, {});
  return errors;
}

{
  const belowThreshold = topRatedClaimErrors('Hours vary by season. Top Rated on GYG.', 5, 3);
  if (belowThreshold.length === 0) {
    console.error('FAIL: expected an error for "Top Rated" claimed with only 3 reviews');
    failures++;
  } else {
    console.log('ok   (fails as expected): "Top Rated" claimed with reviews below MIN_REVIEWS_FOR_TOP_RATED');
  }
}
{
  const atThreshold = topRatedClaimErrors('This is a Top Rated tour on GetYourGuide.', 4.8, 10);
  if (atThreshold.length !== 0) {
    console.error('FAIL: expected no error — rating and reviews both clear the Top Rated threshold');
    failures++;
  } else {
    console.log('ok   (passes as expected): "Top Rated" claimed and the tour actually clears the threshold');
  }
}
{
  const ratingTooLow = topRatedClaimErrors('One of GetYourGuide\'s highest-rated tours in Europe.', 4.7, 21506);
  if (ratingTooLow.length === 0) {
    console.error('FAIL: expected an error — huge review count but rating below 4.8');
    failures++;
  } else {
    console.log('ok   (fails as expected): "highest-rated" claimed with a large review base but rating below 4.8');
  }
}
{
  const noClaim = topRatedClaimErrors('A guided tour of the castle grounds and gardens.', 4.2, 5);
  if (noClaim.length !== 0) {
    console.error('FAIL: expected no error — no "Top Rated"-style phrase present at all');
    failures++;
  } else {
    console.log('ok   (passes as expected): ordinary prose with no ranking claim');
  }
}
{
  // Sentence points at a *different*, qualifying tour via a markdown link — the
  // claim is about that linked tour, not this page's own (sub-threshold) rating.
  const lookup = new Map([['/tours/scotland/edinburgh-castle-guided-tour', { rating: 4.8, reviews: 10369 }]]);
  const text = "If your priority is Edinburgh Castle in depth — with the highest-rated dedicated tour and the smallest specialist groups — the [Edinburgh Castle: Guided History Tour](/tours/scotland/edinburgh-castle-guided-tour) is the better choice. This tour is still a solid pick.";
  const resolved = topRatedClaimErrors(text, 4.4, 5, lookup, 'overview');
  if (resolved.length !== 0) {
    console.error(`FAIL: expected no error — the claim is about the linked tour, which clears the threshold, got ${JSON.stringify(resolved)}`);
    failures++;
  } else {
    console.log('ok   (passes as expected): claim resolves to a different, qualifying tour linked in the same sentence');
  }
}
{
  // A link to a DIFFERENT, non-qualifying tour in the same sentence, and a
  // paragraph break right after — the sentence boundary must stop at the
  // break, not read into the next paragraph's own, unrelated link.
  const lookup = new Map([
    ['/tours/example/low-review-tour', { rating: 4.9, reviews: 2 }],
    ['/castles/example/unrelated-castle', { rating: 4.9, reviews: 500 }],
  ]);
  const text = "This is the highest-rated option here, see [Low Review Tour](/tours/example/low-review-tour) for details.\n\nSeparately, [Unrelated Castle](/castles/example/unrelated-castle) is also worth a visit.";
  const result = topRatedClaimErrors(text, 4.2, 1, lookup, 'overview');
  if (result.length === 0) {
    console.error('FAIL: expected an error — the linked tour in the same sentence also fails the threshold, and the unrelated castle in the next paragraph must not be picked up instead');
    failures++;
  } else {
    console.log('ok   (fails as expected): paragraph break stops the sentence scan before the next paragraph\'s unrelated link');
  }
}
{
  // A hotel's own guest-review claim is a different subject entirely —
  // there's no GYG tour rating to compare it against.
  const result = topRatedClaimErrors('Breakfast highly rated by guests.', null, null, new Map(), 'hotel.how_to_stay');
  if (result.length !== 0) {
    console.error('FAIL: expected no error — hotel.* fields are exempt from this rule');
    failures++;
  } else {
    console.log('ok   (passes as expected): a hotel guest-review claim in a hotel.* field is exempt');
  }
}

// --- UK_LIKE_COUNTRIES sanity (used by the currency-gbp-wrong-country check in the main script) ---
{
  const expected = ['england', 'scotland', 'wales', 'northern-ireland', 'gibraltar', 'jersey', 'isle-of-man'];
  const missing = expected.filter(c => !UK_LIKE_COUNTRIES.has(c));
  if (missing.length) {
    console.error('FAIL: UK_LIKE_COUNTRIES missing expected entries:', missing);
    failures++;
  } else {
    console.log('ok   (UK_LIKE_COUNTRIES covers the expected GBP-legitimate countries)');
  }
}

console.log('');
if (failures > 0) {
  console.error(`${failures} fixture assertion(s) failed.`);
  process.exit(1);
} else {
  console.log('All fixture assertions passed.');
  process.exit(0);
}
