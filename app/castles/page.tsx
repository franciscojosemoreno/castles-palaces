import type { Metadata } from 'next';
import { getPublishedCastles } from '@/lib/castles';
import { getAllCountries } from '@/lib/countries';
import { isHotelOnly } from '@/lib/hotels';
import CastleCard from '@/components/castle/CastleCard';
import Link from 'next/link';
import { getEuropeWideGuides } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'All Castles & Palaces in Europe',
  description: 'Browse our complete directory of European castles and palaces. Filter by country, type and features to find your perfect historic destination.',
  // Own URL without query: /castles?q=… serves the same page and must not be indexed as a separate URL.
  alternates: { canonical: '/castles' },
};

export default function CastlesIndexPage() {
  // Estado C (hotel-only, no visit product) castles are browsed under Castle Hotels,
  // not the visit-focused Castles directory — their own page stays live and linkable.
  const castles = getPublishedCastles().filter((c) => !isHotelOnly(c));
  const countries = getAllCountries();
  const guides = getEuropeWideGuides();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider mb-1">Complete Directory</p>
        <h1 className="font-serif text-4xl font-bold text-[#1761a0] mb-3">
          Castles &amp; Palaces of Europe
        </h1>
        <p className="text-stone-600 text-lg max-w-2xl">
          {castles.length} historic sites across {countries.length} countries, with visitor guides, ticket information and curated tours.
        </p>
      </div>

      {/* Country filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        <span className="text-sm text-stone-500 self-center mr-1">Filter:</span>
        {countries.map((country) => (
          <Link
            key={country.slug}
            href={`/castles/${country.slug}`}
            prefetch={false}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm border border-stone-200 bg-white hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
          >
            {country.name}
          </Link>
        ))}
      </div>

      {/* Castle grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {castles.map((castle) => (
          <CastleCard key={castle.id} castle={castle} />
        ))}
      </div>

      {castles.length === 0 && (
        <div className="text-center py-20 text-stone-400">
          <p className="text-xl">More castles coming soon.</p>
        </div>
      )}

      {guides.length > 0 && (
        <div className="mt-14 max-w-3xl">
          <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-4">Castle guides</h2>
          <ul className="space-y-2">
            {guides.map((guide) => (
              <li key={guide.id}>
                <Link href={`/guides/${guide.id}`} prefetch={false} className="text-[#1761a0] hover:underline font-medium">
                  {guide.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
