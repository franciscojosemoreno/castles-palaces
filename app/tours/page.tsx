import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTours, getAllTourCountrySlugs } from '@/lib/tours';
import { getCountryBySlug } from '@/lib/countries';
import TourCard from '@/components/tours/TourCard';

export const metadata: Metadata = {
  title: 'Castle Tours in Europe | Castles & Palaces',
  description: 'Book the best multi-castle day trips and guided tours across Europe. Handpicked tours with verified reviews from GetYourGuide.',
};

export default function ToursPage() {
  const tours = getAllTours();
  const countrySlugs = getAllTourCountrySlugs();
  const countries = countrySlugs
    .map(slug => getCountryBySlug(slug))
    .filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider mb-1">Handpicked Experiences</p>
        <h1 className="font-serif text-4xl font-bold text-[#1761a0] mb-3">
          Castle Tours in Europe
        </h1>
        <p className="text-stone-600 text-lg max-w-2xl">
          {tours.length} multi-castle day trips and guided experiences across more than 30 countries, curated from thousands of verified reviews.
        </p>
      </div>

      {/* Country filter pills */}
      <div className="flex flex-wrap gap-2 mb-10">
        <span className="text-sm text-stone-500 self-center mr-1">Filter:</span>
        {countries.map((country) => country && (
          <Link
            key={country.slug}
            href={`/tours/${country.slug}`}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm border border-stone-200 bg-white hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
          >
            {country.name}
          </Link>
        ))}
      </div>

      {/* Tours grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>

      {tours.length === 0 && (
        <div className="text-center py-20 text-stone-400">
          <p className="text-xl">Tours coming soon.</p>
        </div>
      )}
    </div>
  );
}
