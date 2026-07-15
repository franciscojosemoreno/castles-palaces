import Image from 'next/image';
import Link from 'next/link';
import type { Tour } from '@/types/tours';

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
          <p className="text-xs font-semibold text-[#1a1a1a] mt-1">From {currencySymbol}{tour.price_from}</p>
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
            {tour.rating != null ? (
              <>
                <span className="text-[#c9a84c] text-sm font-bold">{tour.rating.toFixed(1)}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(tour.rating!) ? 'text-[#c9a84c]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-[#666]">({tour.review_count.toLocaleString()})</span>
              </>
            ) : (
              <span className="text-xs text-[#666]">New listing</span>
            )}
          </div>
          <p className="text-sm font-bold text-[#1761a0]">From {currencySymbol}{tour.price_from}</p>
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
