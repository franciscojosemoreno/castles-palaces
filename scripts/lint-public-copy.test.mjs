#!/usr/bin/env node
// Fixture tests for scripts/lint-public-copy.mjs — one minimal failing
// example and one legitimate passing example per rule. Run directly:
//   node scripts/lint-public-copy.test.mjs
// Exits 1 if any assertion fails.

import { ERROR_RULES, maskLinksAndUrls, UK_LIKE_COUNTRIES, CURRENCY_CONTEXT_RE } from './lint-public-copy.mjs';

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
