// Pure fill-percentage math for RatingStars (components/ui/RatingStars.tsx).
// Kept separate from the component so it can be unit-tested directly with
// plain node (see rating-stars.test.mjs) without pulling in JSX/React.

/**
 * Returns the fill percentage (0-100) for each of the 5 stars, given a
 * rating out of 5. Star i is fully filled if the rating is at least i,
 * fully empty if the rating is at most i-1, and partially filled by the
 * remaining fraction otherwise — e.g. rating=4.6 -> [100,100,100,100,60].
 */
export function starFillPercents(rating: number): number[] {
  // Rounded to a whole percentage point: floating-point ratings like 4.8
  // produce (4.8 - 4) * 100 === 79.99999999999999, not 80, and a clip-path
  // value doesn't need sub-percent precision anyway.
  return [0, 1, 2, 3, 4].map((i) => Math.round(Math.max(0, Math.min(100, (rating - i) * 100))));
}
