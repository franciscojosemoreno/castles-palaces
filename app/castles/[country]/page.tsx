import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCastlesByCountry, getAllCountrySlugs } from '@/lib/castles';
import { getCountryBySlug } from '@/lib/countries';
import { isHotelOnly } from '@/lib/hotels';
import { getCastleAreaGroups } from '@/lib/castle-areas';
import { renderEditorialHtml } from '@/lib/markdown';
import CastleCard from '@/components/castle/CastleCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import CountryStructuredData from '@/components/seo/CountryStructuredData';

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

  const castleCount = getCastlesByCountry(country).filter((c) => !isHotelOnly(c)).length;
  const title = (countryData.seo_title_override ?? `Castles in ${countryData.name}: The Complete Guide`)
    .replace('{N}', String(castleCount));
  const description = (countryData.seo_description_override ?? countryData.description.slice(0, 160));
  return {
    title,
    description,
    alternates: { canonical: `/castles/${country}` },
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { country } = await params;
  const countryData = getCountryBySlug(country);
  // Estado C (hotel-only, no visit product) castles are browsed under Castle Hotels,
  // not the visit-focused Castles directory — their own page stays live and linkable.
  const castles = getCastlesByCountry(country).filter((c) => !isHotelOnly(c));

  if (!countryData) notFound();

  const areaGroups = countryData.show_seo_sections ? getCastleAreaGroups(castles) : [];

  // "Which castles are in the capital area?" is derived from the area breakdown above
  // so it can never drift out of sync with it; everything else comes from hub_faqs.
  const capitalGroup = areaGroups.find((g) => g.label === 'Valletta');
  const capitalFaq = capitalGroup
    ? [{
        question: `Which castles and palaces are in ${capitalGroup.label}?`,
        answer: capitalGroup.castles
          .map((castle) => `[${castle.name}](/castles/${country}/${castle.id})`)
          .join(', ') + '.',
      }]
    : [];
  const allFaqs = [...(countryData.hub_faqs ?? []), ...capitalFaq];

  return (
    <div>
      <CountryStructuredData
        countrySlug={country}
        countryName={countryData.name}
        countryDescription={countryData.description}
        heroImageUrl={countryData.hero_image.url}
        castles={castles}
      />
      {/* Hero — grows with its text on narrow screens instead of clipping the H1;
          fixed height (and the image's own crop) only kick in from sm: up. */}
      <div className="relative min-h-[320px] sm:h-[400px]">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={countryData.hero_image.url}
            alt={countryData.hero_image.alt}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
        </div>
        <div className="relative z-10 flex flex-col justify-end min-h-[320px] sm:h-full p-8 text-white max-w-3xl">
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

        {countryData.show_seo_sections && countryData.intro_paragraph_2 && (
          <p className="text-[#333] leading-relaxed mt-6 max-w-3xl">
            {countryData.intro_paragraph_2.replace('{N}', String(castles.length))}
          </p>
        )}

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

        {countryData.show_seo_sections && areaGroups.length > 0 && (
          <div className="mt-14 max-w-3xl">
            <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-4">
              {countryData.name} castles by area
            </h2>
            <ul className="space-y-2">
              {areaGroups.map((group) => (
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

        {countryData.show_seo_sections && allFaqs.length > 0 && (
          <div className="mt-14 max-w-3xl">
            <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-4">
              Frequently asked questions
            </h2>
            <div className="space-y-5">
              {allFaqs.map((faq) => (
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
