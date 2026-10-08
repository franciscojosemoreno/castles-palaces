import { shouldShowStars } from '@/lib/rating-thresholds';
import { starFillPercents } from '@/lib/rating-stars';

// Same star path already used (as a single whole-star icon) across the
// site — reused here so a partial star is a clipped copy of the exact
// same shape, not a different glyph.
const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

interface RatingStarsProps {
  rating: number;
  reviews: number;
  starClassName?: string;
  className?: string;
}

/**
 * Five stars filled proportionally to `rating` (partial stars are clipped,
 * not rounded to the nearest whole star). Renders nothing — no stars, no
 * placeholder, no "no reviews" text — when shouldShowStars(rating, reviews)
 * is false, same as every other rating display on the site. Pure function
 * of its props, so it can be a server component.
 */
export default function RatingStars({ rating, reviews, starClassName = 'w-3.5 h-3.5', className = '' }: RatingStarsProps) {
  if (!shouldShowStars(rating, reviews)) return null;

  const fills = starFillPercents(rating);

  return (
    <span
      role="img"
      aria-label={`Rated ${rating} out of 5`}
      className={`inline-flex ${className}`}
    >
      {fills.map((fill, i) => (
        <span key={i} className="relative inline-block" aria-hidden="true">
          <svg className={`${starClassName} text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
            <path d={STAR_PATH} />
          </svg>
          <svg
            className={`${starClassName} text-[#c9a84c] absolute inset-0`}
            style={{ clipPath: `inset(0 ${100 - fill}% 0 0)` }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d={STAR_PATH} />
          </svg>
        </span>
      ))}
    </span>
  );
}
