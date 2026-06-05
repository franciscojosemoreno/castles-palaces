import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getFeaturedCastles } from '@/lib/castles';
import { getAllCountries } from '@/lib/countries';
import { getFeaturedTours } from '@/lib/tours';
import CastleCard from '@/components/castle/CastleCard';
import TourCard from '@/components/tours/TourCard';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  const featured = getFeaturedCastles(9);
  const countries = getAllCountries();
  const featuredTours = getFeaturedTours(9);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Castles & Palaces',
            url: 'https://castlespalaces.com',
            description: 'Visitor guides, tours and itineraries for historic castles and palaces across Europe.',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://castlespalaces.com/castles?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative h-[70vh] min-h-[480px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero-home.jpg"
          alt="Europe's most beautiful castles and palaces"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60" />
        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 drop-shadow-lg">
            Europe&apos;s Most Beautiful<br />
            <span className="text-[#c9a84c]">Castles &amp; Palaces</span>
          </h1>
          <p className="text-white/90 text-lg sm:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
            Visitor guides, tours and itineraries for 500+ historic sites across Europe.
          </p>
          <Link
            href="/castles"
            className="inline-block bg-[#c9a84c] text-[#1761a0] font-bold text-lg px-8 py-3 rounded-md hover:bg-[#b8973b] transition-colors shadow-lg"
          >
            Explore All Castles
          </Link>
        </div>
      </section>

      {/* ── Featured Castles ───────────────────────────── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider mb-1">Editor&apos;s Picks</p>
              <h2 className="font-serif text-3xl font-bold text-[#1761a0]">Featured Castles</h2>
            </div>
            <Link href="/castles" className="text-sm font-medium text-[#1761a0] hover:text-[#c9a84c] transition-colors hidden sm:block">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((castle) => (
              <CastleCard key={castle.id} castle={castle} />
            ))}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link href="/castles" className="text-sm font-medium text-[#1761a0] hover:text-[#c9a84c]">
              View all castles →
            </Link>
          </div>
        </section>
      )}

      {/* ── Browse by Country ──────────────────────────── */}
      <section className="bg-[#f5f0e8] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider mb-1">Explore by Destination</p>
            <h2 className="font-serif text-3xl font-bold text-[#1761a0]">Browse by Country</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {countries.map((country) => (
              <Link
                key={country.slug}
                href={`/castles/${country.slug}`}
                className="group relative aspect-square rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <Image
                  src={(country.thumbnail_image ?? country.hero_image).url}
                  alt={(country.thumbnail_image ?? country.hero_image).alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-3 left-3 text-white font-serif font-bold text-base drop-shadow">
                  {country.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Tours ─────────────────────────────── */}
      {featuredTours.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider mb-1">
                Top Rated on GetYourGuide
              </p>
              <h2 className="font-serif text-3xl font-bold text-[#1761a0]">
                Featured Castle Tours
              </h2>
            </div>
            <Link
              href="/tours"
              className="text-sm font-medium text-[#1761a0] hover:text-[#c9a84c] transition-colors hidden sm:block"
            >
              All tours →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link
              href="/tours"
              className="inline-block text-sm font-medium text-[#1761a0] hover:text-[#c9a84c] transition-colors"
            >
              View all tours →
            </Link>
          </div>
        </section>
      )}

      {/* ── Instagram CTA ──────────────────────────────── */}
      <section className="bg-[#1761a0] py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="font-serif text-3xl font-bold text-white mb-3">
            Castle Photography Every Day
          </p>
          <p className="text-white/70 text-base mb-6">
            Follow <span className="text-[#c9a84c]">@castlespalaces</span> for daily inspiration from Europe&apos;s most spectacular historic sites.
          </p>
          <a
            href="https://instagram.com/castlespalaces"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#c9a84c] text-[#1761a0] font-bold px-8 py-3 rounded-md hover:bg-[#b8973b] transition-colors"
          >
            Follow on Instagram
          </a>
        </div>
      </section>
    </div>
  );
}
