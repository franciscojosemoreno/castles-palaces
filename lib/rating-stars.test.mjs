#!/usr/bin/env node
// Fixture tests for lib/rating-stars.ts and the shouldShowStars gate that
// components/ui/RatingStars.tsx relies on. Run directly:
//   node lib/rating-stars.test.mjs
// Exits 1 if any assertion fails. Node 24+ runs .ts via native type
// stripping, so no build step is needed to test these modules directly.

import { starFillPercents } from './rating-stars.ts';
import { shouldShowStars } from './rating-thresholds.ts';

let failures = 0;
function assertDeepEqual(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    console.error(`FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failures++;
  } else {
    console.log(`ok   ${label} -> ${JSON.stringify(actual)}`);
  }
}
function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    console.error(`FAIL: ${label} — expected ${expected}, got ${actual}`);
    failures++;
  } else {
    console.log(`ok   ${label} -> ${actual}`);
  }
}

// --- starFillPercents: shape of the 5 stars for each rating in the brief ---
assertDeepEqual('fill shape: rating 5.0 (all full)', starFillPercents(5.0), [100, 100, 100, 100, 100]);
assertDeepEqual('fill shape: rating 4.8 (5th star 80% full)', starFillPercents(4.8), [100, 100, 100, 100, 80]);
assertDeepEqual('fill shape: rating 4.5 (5th star half full)', starFillPercents(4.5), [100, 100, 100, 100, 50]);
assertDeepEqual('fill shape: rating 4.0 (4 full, 5th empty)', starFillPercents(4.0), [100, 100, 100, 100, 0]);
assertDeepEqual('fill shape: rating 3.5 (3 full, 4th half, 5th empty)', starFillPercents(3.5), [100, 100, 100, 50, 0]);
assertDeepEqual('fill shape: rating 3.0 (3 full, rest empty)', starFillPercents(3.0), [100, 100, 100, 0, 0]);

// --- shouldShowStars: presence/absence of the block at the review-count boundary ---
for (const rating of [5.0, 4.8, 4.5, 4.0, 3.5, 3.0]) {
  assertEqual(`block hidden: rating ${rating}, 2 reviews (below MIN_REVIEWS_FOR_STARS)`, shouldShowStars(rating, 2), false);
  assertEqual(`block shown: rating ${rating}, 3 reviews (boundary, inclusive)`, shouldShowStars(rating, 3), true);
  assertEqual(`block shown: rating ${rating}, 9 reviews`, shouldShowStars(rating, 9), true);
  assertEqual(`block shown: rating ${rating}, 10 reviews`, shouldShowStars(rating, 10), true);
}

// --- fill percentages are clamped to [0, 100] even outside a 0-5 rating ---
assertDeepEqual('fill clamp: rating above 5 never exceeds 100 per star', starFillPercents(5.4), [100, 100, 100, 100, 100]);
assertDeepEqual('fill clamp: rating 0 is all empty', starFillPercents(0), [0, 0, 0, 0, 0]);

console.log('');
if (failures > 0) {
  console.error(`${failures} fixture assertion(s) failed.`);
  process.exit(1);
} else {
  console.log('All fixture assertions passed.');
  process.exit(0);
}
