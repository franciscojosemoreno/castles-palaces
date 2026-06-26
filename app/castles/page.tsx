import type { Metadata } from 'next';
import { getPublishedCastles } from '@/lib/castles';
import { getAllCountries } from '@/lib/countries';
import CastleCard from '@/components/castle/CastleCard';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'All Castles & Palaces in Europe',
  description: 'Browse our complete directory of European castles and palaces. Filter by country, type and features to find your perfect historic destination.',
};

export default function CastlesIndexPage() {
  const castles = getPublishedCastles();
  const countries = getAllCountries();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider mb-1">Complete Directory</p>
        <h1 className="font-serif text-4xl font-bold text-[#1761a0] mb-3">
          Castles &amp; Palaces of Europe
        </h1>
        <p className="text-stone-600 text-lg max-w-2xl">
          {castles.length} historic sites across 40 countries, with visitor guides, ticket information and curated tours.
        </p>
      </div>

      {/* Country filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        <span className="text-sm text-stone-500 self-center mr-1">Filter:</span>
        {countries.map((country) => (
          <Link
            key={country.slug}
            href={`/castles/${country.slug}`}
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
    </div>
  );
}
