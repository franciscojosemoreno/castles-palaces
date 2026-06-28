import type { Castle } from '@/types';
import { getGYGSearchUrl } from '@/lib/gyg';

type FeaturedTour = NonNullable<Castle['gyg_featured_tours']>[number];

const typeLabels: Record<FeaturedTour['type'], string> = {
  day_trip: 'Day trip',
  guided_tour: 'Guided tour',
  skip_the_line: 'Skip the line',
  multi_day: 'Multi-day',
  entry_ticket: 'Entry ticket',
};

interface Props {
  tour: FeaturedTour;
  castleName: string;
}

export default function GYGFeaturedTour({ tour, castleName }: Props) {
  const href = getGYGSearchUrl(castleName);

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5">
      <p className="text-[#c9a84c] font-medium text-xs uppercase tracking-wider mb-2">Featured Tour</p>
      <h3 className="font-serif font-bold text-[#1a1a1a] text-base leading-snug mb-3">
        {tour.title}
      </h3>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600 mb-3">
        {tour.rating != null && tour.reviews != null && tour.reviews > 1 && (
          <>
            <span>⭐ {tour.rating} ({tour.reviews.toLocaleString()})</span>
            <span className="text-stone-300">·</span>
          </>
        )}
        <span>{tour.duration}</span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-bold text-[#1a1a1a] text-sm">
          {tour.price_from != null ? `From $${tour.price_from}` : 'Check availability'}
        </span>
        <span className="bg-stone-100 text-stone-600 text-xs font-medium px-2 py-0.5 rounded-full">
          {typeLabels[tour.type]}
        </span>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block w-full bg-[#1761a0] text-white text-sm font-semibold text-center py-2.5 rounded-md hover:bg-[#125489] transition-colors mb-2"
      >
        Book This Tour →
      </a>
      <p className="text-xs text-stone-400 text-center">Cancellation available · Instant confirmation</p>
    </div>
  );
}
