import type { Metadata } from 'next';
import { getHotelCountrySummaries } from '@/lib/hotel-directory';
import HotelCountryCard from '@/components/castle/HotelCountryCard';
import { CastleHotelsIndexStructuredData } from '@/components/seo/CastleHotelsStructuredData';

export function generateMetadata(): Metadata {
  const total = getHotelCountrySummaries().reduce((sum, c) => sum + c.count, 0);
  return {
    title: `Castle Hotels in Europe: Sleep in ${total}+ Historic Castles & Palaces`,
    description: `Spend the night inside a real castle. Browse ${total}+ historic castles and palaces across Europe that take overnight guests, from working wine estates to Renaissance towers.`,
    alternates: { canonical: '/castle-hotels' },
  };
}

export default function CastleHotelsIndexPage() {
  const countries = getHotelCountrySummaries();
  const total = countries.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <CastleHotelsIndexStructuredData countries={countries} />

      <div className="mb-10 max-w-2xl">
        <p className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider mb-1">Castle Hotels</p>
        <h1 className="font-serif text-4xl font-bold text-[#1761a0] mb-3">
          Sleep Inside Europe&rsquo;s Historic Castles
        </h1>
        <p className="text-stone-600 text-lg">
          {total} castles and palaces across {countries.length} countries take overnight guests — from
          working wine estates in the Chianti to a beauty-farm castle in the Dolomites. Some are purely
          hotels; others let you visit by day and stay the night in the very building you toured.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {countries.map((country) => (
          <HotelCountryCard key={country.slug} country={country} />
        ))}
      </div>

      {countries.length === 0 && (
        <div className="text-center py-20 text-stone-400">
          <p className="text-xl">More castle hotels coming soon.</p>
        </div>
      )}
    </div>
  );
}
