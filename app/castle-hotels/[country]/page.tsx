import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getHotelCastlesByCountry, getAllHotelCountrySlugs } from '@/lib/hotel-directory';
import {
  buildHotelHubTitle, buildHotelHubDescription, buildHotelIntro2, buildHotelHubFaqs, groupByRegion, worthShowingRegions,
} from '@/lib/country-hub';
import { renderEditorialHtml } from '@/lib/markdown';
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
  const hotels = getHotelCastlesByCountry(country);
  return {
    // Generated from the country's hotel fichas (lib/country-hub.js).
    title: buildHotelHubTitle(countryData.name, hotels),
    description: buildHotelHubDescription(countryData.name, hotels),
    alternates: { canonical: `/castle-hotels/${country}` },
  };
}

export default async function CastleHotelsCountryPage({ params }: PageProps) {
  const { country } = await params;
  const countryData = getCountryBySlug(country);
  const castles = getHotelCastlesByCountry(country);
  if (!countryData || castles.length === 0) notFound();

  const intro2 = buildHotelIntro2(countryData.name, castles);
  const regionGroups = castles.length >= 4 ? groupByRegion(castles) : [];
  const showRegions = worthShowingRegions(regionGroups);
  const faqs = buildHotelHubFaqs(country, countryData.name, castles);

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
        <p className="text-[#333] leading-relaxed mt-6 max-w-3xl">{intro2}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {castles.map((castle) => (
            <CastleCard key={castle.id} castle={castle} variant="hotel" />
          ))}
        </div>

        {showRegions && (
          <div className="mt-14 max-w-3xl">
            <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-4">
              {countryData.name} castle hotels by region
            </h2>
            <ul className="space-y-2">
              {regionGroups.map((group) => (
                <li key={group.label} className="text-[#333] leading-relaxed">
                  <span className="font-semibold">{group.label}:</span>{' '}
                  {group.castles.map((castle, i) => (
                    <span key={castle.id}>
                      <Link
                        href={`/castles/${country}/${castle.id}`}
                        prefetch={false}
                        className="text-[#1761a0] hover:underline"
                      >
                        {castle.name}
                      </Link>
                      {i < group.castles.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {faqs.length > 0 && (
          <div className="mt-14 max-w-3xl">
            <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-4">
              Frequently asked questions
            </h2>
            <div className="space-y-5">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-semibold text-[#1a1a1a] mb-1">{faq.question}</h3>
                  <p
                    className="text-[#555] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderEditorialHtml(faq.answer) }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
