import Image from 'next/image';
import Link from 'next/link';
import type { Tour } from '@/types/tours';
import { shouldShowStars } from '@/lib/rating-thresholds';
import RatingStars from '@/components/ui/RatingStars';

interface TourCardProps {
  tour: Tour;
  variant?: 'default' | 'compact';
}

export default function TourCard({ tour, variant = 'default' }: TourCardProps) {
  const href = `/tours/${tour.departure_country}/${tour.slug}`;
  const currencySymbol = tour.currency === 'USD' ? '$' : tour.currency === 'GBP' ? '£' : '€';

  if (variant === 'compact') {
    return (
      <Link href={href} prefetch={false} className="group flex gap-4 items-start p-3 rounded-lg hover:bg-[#f5f0e8] transition-colors">
        <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
          <Image src={tour.hero_image.url} alt={tour.hero_image.alt} fill className="object-cover" sizes="80px" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-semibold text-[#1761a0] text-sm leading-tight line-clamp-2 group-hover:text-[#c9a84c] transition-colors">
            {tour.name}
          </h3>
          <p className="text-xs text-[#666] mt-1">{tour.duration_label}</p>
          <p className="text-xs font-semibold text-[#1a1a1a] mt-1">
            {tour.price_from != null ? `From ${currencySymbol}${tour.price_from}` : 'See on GetYourGuide'}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} prefetch={false} className="group block rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={tour.hero_image.url}
          alt={tour.hero_image.alt}
          fill
          className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-[#1761a0] px-2 py-1 rounded-full">
          {tour.duration_label}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-serif font-bold text-[#1a1a1a] text-base leading-snug line-clamp-2 group-hover:text-[#1761a0] transition-colors mb-2">
          {tour.name}
        </h3>
        <p className="text-sm text-[#555] line-clamp-2 mb-4">{tour.tagline}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {shouldShowStars(tour.rating, tour.review_count) && (
              <>
                <span className="text-[#c9a84c] text-sm font-bold">{tour.rating!.toFixed(1)}</span>
                <RatingStars rating={tour.rating!} reviews={tour.review_count} starClassName="w-3.5 h-3.5" />
                <span className="text-xs text-[#666]">({tour.review_count.toLocaleString()})</span>
              </>
            )}
          </div>
          <p className="text-sm font-bold text-[#1761a0]">
            {tour.price_from != null ? `From ${currencySymbol}${tour.price_from}` : 'See on GetYourGuide'}
          </p>
        </div>
        <div className="mt-4">
          <span className="inline-block bg-[#c9a84c] text-[#1761a0] text-xs font-bold px-4 py-2 rounded-md w-full text-center hover:bg-[#b8973b] transition-colors">
            View Tour
          </span>
        </div>
      </div>
    </Link>
  );
}
