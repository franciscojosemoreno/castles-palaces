#!/usr/bin/env node
// Fixture tests for lib/rating-thresholds.ts. Run directly:
//   node lib/rating-thresholds.test.mjs
// Exits 1 if any assertion fails. Node 24+ runs .ts via native type
// stripping, so no build step is needed to test this module directly.

import {
  MIN_REVIEWS_FOR_STARS,
  MIN_REVIEWS_FOR_TOP_RATED,
  TOP_RATED_MIN_RATING,
  shouldShowStars,
  shouldShowTopRated,
} from './rating-thresholds.ts';

let failures = 0;
function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    console.error(`FAIL: ${label} — expected ${expected}, got ${actual}`);
    failures++;
  } else {
    console.log(`ok   ${label} -> ${actual}`);
  }
}

assertEqual('sanity: thresholds match the brief', MIN_REVIEWS_FOR_STARS, 3);
assertEqual('sanity: thresholds match the brief', MIN_REVIEWS_FOR_TOP_RATED, 10);
assertEqual('sanity: thresholds match the brief', TOP_RATED_MIN_RATING, 4.8);

// --- shouldShowStars: review-count boundary at 1, 2, 3, 9, 10 ---
assertEqual('stars: 1 review', shouldShowStars(5, 1), false);
assertEqual('stars: 2 reviews', shouldShowStars(5, 2), false);
assertEqual('stars: 3 reviews (boundary, inclusive)', shouldShowStars(5, 3), true);
assertEqual('stars: 9 reviews', shouldShowStars(4.8, 9), true);
assertEqual('stars: 10 reviews', shouldShowStars(4.8, 10), true);

// --- shouldShowTopRated: rating boundary at 4.7 / 4.8 / 5, reviews boundary at 9 / 10 ---
assertEqual('top-rated: rating 4.7 (just under), 10 reviews', shouldShowTopRated(4.7, 10), false);
assertEqual('top-rated: rating 4.8 (boundary, inclusive), 10 reviews', shouldShowTopRated(4.8, 10), true);
assertEqual('top-rated: rating 5, 10 reviews', shouldShowTopRated(5, 10), true);
assertEqual('top-rated: rating 5, 9 reviews (just under review floor)', shouldShowTopRated(5, 9), false);
assertEqual('top-rated: rating 4.8, 2 reviews (the Reignac case)', shouldShowTopRated(4.8, 2), false);
assertEqual('top-rated: rating 5, 2 reviews (the Reignac case, rating=5)', shouldShowTopRated(5, 2), false);

// --- null / undefined rating or reviews never show anything ---
assertEqual('stars: null rating', shouldShowStars(null, 10), false);
assertEqual('stars: null reviews', shouldShowStars(5, null), false);
assertEqual('stars: undefined rating', shouldShowStars(undefined, 10), false);
assertEqual('stars: undefined reviews', shouldShowStars(5, undefined), false);
assertEqual('top-rated: null rating', shouldShowTopRated(null, 10), false);
assertEqual('top-rated: null reviews', shouldShowTopRated(5, null), false);
assertEqual('top-rated: undefined rating', shouldShowTopRated(undefined, 10), false);
assertEqual('top-rated: undefined reviews', shouldShowTopRated(5, undefined), false);

// --- a Top Rated badge is never shown when stars themselves wouldn't show ---
assertEqual('top-rated implies stars: rating 4.9, 1 review', shouldShowTopRated(4.9, 1), false);

console.log('');
if (failures > 0) {
  console.error(`${failures} fixture assertion(s) failed.`);
  process.exit(1);
} else {
  console.log('All fixture assertions passed.');
  process.exit(0);
}
