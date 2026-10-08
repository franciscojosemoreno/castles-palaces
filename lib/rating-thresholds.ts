// Single source of truth for when a GYG rating/review figure is shown to a
// visitor. A small review sample (2-3 reviews) is not a meaningful signal,
// and showing a "Top Rated" badge off a handful of reviews reads as
// misleading. Change the numbers here only — every component that renders
// stars or the "Top Rated" badge calls shouldShowStars()/shouldShowTopRated()
// rather than comparing rating/reviews directly.
export const MIN_REVIEWS_FOR_STARS = 3;
export const MIN_REVIEWS_FOR_TOP_RATED = 10;
export const TOP_RATED_MIN_RATING = 4.8;

export function shouldShowStars(
  rating: number | null | undefined,
  reviews: number | null | undefined
): boolean {
  return rating != null && reviews != null && reviews >= MIN_REVIEWS_FOR_STARS;
}

export function shouldShowTopRated(
  rating: number | null | undefined,
  reviews: number | null | undefined
): boolean {
  return (
    shouldShowStars(rating, reviews) &&
    reviews! >= MIN_REVIEWS_FOR_TOP_RATED &&
    rating! >= TOP_RATED_MIN_RATING
  );
}
