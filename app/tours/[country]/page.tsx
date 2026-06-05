import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getToursByCountry, getAllTourCountrySlugs } from '@/lib/tours';
import { getCountryBySlug } from '@/lib/countries';
import TourCard from '@/components/tours/TourCard';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateStaticParams() {
  return getAllTourCountrySlugs().map((country) => ({ country }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country } = await params;
  const countryData = getCountryBySlug(country);
  const name = countryData?.name ?? country.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: `Castle Tours from ${name} | Castles & Palaces`,
    description: `Browse the best guided castle tours departing from ${name}. Multi-castle day trips with verified reviews and transparent pricing.`,
    alternates: { canonical: `/tours/${country}` },
  };
}

export default async function TourCountryPage({ params }: PageProps) {
  const { country } = await params;
  const tours = getToursByCountry(country);
  const countryData = getCountryBySlug(country);

  if (tours.length === 0 && !countryData) notFound();

  const countryName = countryData?.name ?? country.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div>
      {/* Hero — reuses country hero image from countries.json */}
      {countryData && (
        <div className="relative h-[400px] overflow-hidden">
          <Image
            src={countryData.hero_image.url}
            alt={countryData.hero_image.alt}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
          <div className="absolute bottom-0 left-0 p-8 text-white max-w-3xl">
            <p className="text-white/70 text-xs uppercase tracking-wider mb-2">
              {tours.length} tour{tours.length !== 1 ? 's' : ''} departing from {countryName}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-2">
              Castle Tours from {countryName}
            </h1>
            <p className="text-white/85 text-lg">
              Multi-castle day trips and guided experiences departing from {countryName}.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Tours', href: '/tours' },
            { label: countryName },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>

        {tours.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p>Tours from {countryName} are coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
