import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getHotelCastlesByCountry, getAllHotelCountrySlugs } from '@/lib/hotel-directory';
import { getCountryBySlug } from '@/lib/countries';
import CastleCard from '@/components/castle/CastleCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { CastleHotelsCountryStructuredData } from '@/components/seo/CastleHotelsStructuredData';

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateStaticParams() {
  return getAllHotelCountrySlugs().map((country) => ({ country }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country } = await params;
  const countryData = getCountryBySlug(country);
  if (!countryData) return {};
  const count = getHotelCastlesByCountry(country).length;
  return {
    title: `${countryData.name} Castle Hotels: ${count} Historic Castles You Can Actually Stay In`,
    description: `Book a night in one of ${count} historic castles and palaces in ${countryData.name} that take overnight guests — real rooms, real history, no costume required.`,
    alternates: { canonical: `/castle-hotels/${country}` },
  };
}

export default async function CastleHotelsCountryPage({ params }: PageProps) {
  const { country } = await params;
  const countryData = getCountryBySlug(country);
  const castles = getHotelCastlesByCountry(country);
  if (!countryData || castles.length === 0) notFound();

  return (
    <div>
      <CastleHotelsCountryStructuredData countrySlug={country} countryName={countryData.name} castles={castles} />

      {/* Hero */}
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
          <p className="text-white/70 text-xs uppercase tracking-wider mb-2">{castles.length} castle hotels</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-2">Castle Hotels in {countryData.name}</h1>
          <p className="text-white/85 text-lg">
            Real castles and palaces in {countryData.name} where you can book a room for the night.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Castle Hotels', href: '/castle-hotels' },
            { label: countryData.name },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {castles.map((castle) => (
            <CastleCard key={castle.id} castle={castle} variant="hotel" />
          ))}
        </div>
      </div>
    </div>
  );
}
