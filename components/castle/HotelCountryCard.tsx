import Image from 'next/image';
import Link from 'next/link';
import type { HotelCountrySummary } from '@/lib/hotel-directory';

interface HotelCountryCardProps {
  country: HotelCountrySummary;
}

export default function HotelCountryCard({ country }: HotelCountryCardProps) {
  return (
    <Link
      href={`/castle-hotels/${country.slug}`}
      prefetch={false}
      className="group relative aspect-square rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <Image
        src={country.heroImage.url}
        alt={country.heroImage.alt}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-3 left-3 text-white">
        <p className="font-serif font-bold text-base drop-shadow leading-tight">{country.name}</p>
        <p className="text-white/70 text-xs">{country.count} {country.count === 1 ? 'castle hotel' : 'castle hotels'}</p>
      </div>
    </Link>
  );
}
