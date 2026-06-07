import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getCastlesByCountry, getAllCountrySlugs } from '@/lib/castles';
import { getCountryBySlug } from '@/lib/countries';
import CastleCard from '@/components/castle/CastleCard';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateStaticParams() {
  return getAllCountrySlugs().map((country) => ({ country }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country } = await params;
  const countryData = getCountryBySlug(country);
  if (!countryData) return {};

  const title = `Castles in ${countryData.name}: The Complete Guide`;
  return {
    title,
    description: countryData.description.slice(0, 160),
    alternates: { canonical: `/castles/${country}` },
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { country } = await params;
  const countryData = getCountryBySlug(country);
  const castles = getCastlesByCountry(country);

  if (!countryData) notFound();

  return (
    <div>
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
          <p className="text-white/70 text-xs uppercase tracking-wider mb-2">
            {castles.length} historic sites
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-2">
            Castles in {countryData.name}
          </h1>
          <p className="text-white/85 text-lg">{countryData.description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Castles', href: '/castles' },
            { label: countryData.name },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {castles.map((castle) => (
            <CastleCard key={castle.id} castle={castle} />
          ))}
        </div>

        {castles.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p>Castle pages for {countryData.name} are coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
