import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getCastleBySlug, getAllCastleParams, getNearbyCastles } from '@/lib/castles';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';
import CastleQuickFacts from '@/components/castle/CastleQuickFacts';
import CastleFAQ from '@/components/castle/CastleFAQ';
import CastleMap from '@/components/castle/CastleMap';
import CastleCard from '@/components/castle/CastleCard';
import GYGWidget from '@/components/affiliate/GYGWidget';
import GYGFeaturedTour from '@/components/affiliate/GYGFeaturedTour';
import StructuredData from '@/components/seo/StructuredData';
import { getGYGSearchUrl } from '@/lib/gyg';

interface PageProps {
  params: Promise<{ country: string; castle: string }>;
}

export async function generateStaticParams() {
  return getAllCastleParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, castle: castleSlug } = await params;
  const castle = getCastleBySlug(country, castleSlug);
  if (!castle) return {};

  const year = new Date().getFullYear();
  const title = castle.meta_title ?? `${castle.name}: Tickets, Tours & Visitor Guide ${year}`;
  const description = castle.meta_description ?? `Plan your visit to ${castle.name}. Book tickets, guided tours and get insider tips for visiting this incredible historic site.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: castle.og_image ? [{ url: castle.og_image, width: 1200, height: 630 }] : [],
      type: 'article',
    },
    alternates: {
      canonical: `/castles/${country}/${castleSlug}`,
    },
  };
}

export default async function CastlePage({ params }: PageProps) {
  const { country, castle: castleSlug } = await params;
  const castle = getCastleBySlug(country, castleSlug);

  if (!castle || castle.status !== 'published') notFound();

  const nearby = getNearbyCastles(castle, 4);
  const countryLabel = country.charAt(0).toUpperCase() + country.slice(1).replace('-', ' ');

  return (
    <>
      <StructuredData castle={castle} url={`/castles/${country}/${castleSlug}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Castles', href: '/castles' },
            { label: countryLabel, href: `/castles/${country}` },
            { label: castle.name },
          ]}
        />

        <div className="mt-6 lg:grid lg:grid-cols-[1fr_340px] lg:gap-10">
          {/* ── Main content ─────────────────────────────────── */}
          <div className="min-w-0">
            {/* Title block */}
            {castle.unesco && (
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge label="UNESCO World Heritage" variant="unesco" />
              </div>
            )}

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1761a0] leading-tight mb-2">
              {castle.name}
            </h1>
            {castle.local_name && (
              <p className="text-stone-500 text-base mb-1 italic">{castle.local_name}</p>
            )}
            <p className="text-stone-500 text-sm mb-1">
              {countryLabel}
              {castle.region ? ` · ${castle.region}` : ''}
              {castle.nearest_city ? ` · Near ${castle.nearest_city}` : ''}
            </p>
            {castle.year_built && castle.architectural_style && (
              <p className="text-stone-500 text-sm mb-3">
                Built {castle.year_built} · {castle.architectural_style}
              </p>
            )}
            <p className="text-stone-500 text-sm mb-5">
              This page is part of an independent travel guide and is not affiliated with, endorsed by, or operated by {castle.name}.
            </p>

            {/* Hero image */}
            <div className="relative aspect-[16/12] rounded-xl overflow-hidden mb-6">
              <Image
                src={castle.hero_image.url}
                alt={castle.hero_image.alt}
                fill
                priority
                quality={90}
                className="object-cover object-top"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, calc(100vw - 380px)"
              />
              {castle.hero_image.credit && (
                <p className="absolute bottom-2 right-3 text-white/60 text-xs">
                  © {castle.hero_image.credit}
                </p>
              )}
            </div>

            {/* Price anchor + Quick facts — mobile only */}
            <div className="lg:hidden mb-6">
              {castle.price_adult !== undefined && (
                <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-[#f5f0e8] rounded-lg border border-stone-200">
                  <span className="text-[#c9a84c] text-lg">🎟</span>
                  <span className="text-sm text-stone-600">
                    {castle.price_adult === 0
                      ? <strong className="text-[#1761a0]">Free entry</strong>
                      : <>Entry from <strong className="text-[#1761a0]">€{castle.price_adult}</strong> per adult</>
                    }
                  </span>
                  {castle.best_season && (
                    <span className="ml-auto text-xs text-stone-400 hidden xs:block">Best: {castle.best_season}</span>
                  )}
                </div>
              )}
              <CastleQuickFacts castle={castle} />
            </div>

            {/* Highlights */}
            <div className="bg-[#f5f0e8] rounded-lg p-5 mb-8 border border-stone-200">
              <h2 className="font-serif font-bold text-[#1761a0] text-lg mb-3">Highlights</h2>
              <ul className="space-y-2">
                {castle.highlights.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="text-[#c9a84c] font-bold mt-0.5 flex-shrink-0">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Inline tour CTA — after highlights */}
            <div className="lg:hidden mb-8 flex items-center gap-3 bg-[#1761a0] rounded-lg px-4 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">
                  Skip the queue with a guided tour
                </p>
                <p className="text-white/70 text-xs mt-0.5">Skip-the-line tickets & expert guides</p>
              </div>
              <a
                href={getGYGSearchUrl(castle.name)}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex-shrink-0 bg-[#c9a84c] text-[#1761a0] font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-[#b8973b] transition-colors whitespace-nowrap"
              >
                See Tours →
              </a>
            </div>

            {/* Description */}
            <div className="prose-editorial mb-8">
              {castle.description.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* History */}
            {castle.history && (
              <section className="mb-10">
                <h2 className="font-serif font-bold text-[#1761a0] text-2xl mb-4">History</h2>
                <div className="prose-editorial">
                  {castle.history.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            )}

            {/* How to visit */}
            {castle.how_to_visit && (
              <section className="mb-10">
                <h2 className="font-serif font-bold text-[#1761a0] text-2xl mb-4">How to Visit</h2>
                <div className="prose-editorial">
                  {castle.how_to_visit.split('\n\n').map((para, i) => (
                    <p key={i}
                      dangerouslySetInnerHTML={{
                        __html: para
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>'),
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {castle.faqs && castle.faqs.length > 0 && (
              <section className="mb-10">
                <h2 className="font-serif font-bold text-[#1761a0] text-2xl mb-4">
                  Frequently Asked Questions
                </h2>
                <CastleFAQ faqs={castle.faqs} />
              </section>
            )}

            {/* Map */}
            <section className="mb-10">
              <h2 className="font-serif font-bold text-[#1761a0] text-2xl mb-4">Location</h2>
              <CastleMap lat={castle.lat} lng={castle.lng} name={castle.name} />
              {castle.address && (
                <p className="mt-2 text-sm text-stone-500">{castle.address}</p>
              )}
            </section>

            {/* Nearby castles */}
            {nearby.length > 0 && (
              <section className="mb-10">
                <h2 className="font-serif font-bold text-[#1761a0] text-2xl mb-4">Nearby Castles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {nearby.map((c) => (
                    <CastleCard key={c.id} castle={c} variant="compact" />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Sidebar (desktop only) ────────────────────────── */}
          <aside className="hidden lg:block space-y-6 self-start sticky top-24">
            <CastleQuickFacts castle={castle} />

            {castle.gyg_featured_tours && castle.gyg_featured_tours.length > 0 && (
              <GYGFeaturedTour tour={castle.gyg_featured_tours[0]} castleName={castle.name} />
            )}

            <GYGWidget
              locationId={castle.gyg_location_id}
              searchQuery={castle.gyg_search_query}
              numResults={castle.gyg_num_results ?? 4}
              widgetType={castle.gyg_widget_type}
              title="Tours & Tickets"
            />

            {/* Instagram CTA */}
            <div className="bg-[#1761a0] text-white rounded-lg p-5 text-center">
              <p className="font-serif text-lg font-bold mb-1">Follow for More</p>
              <p className="text-white/70 text-sm mb-3">Daily castle photography from across Europe</p>
              <a
                href="https://instagram.com/castlespalaces"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#c9a84c] text-[#1761a0] font-semibold text-sm px-4 py-2 rounded-md hover:bg-[#b8973b] transition-colors"
              >
                @castlespalaces →
              </a>
            </div>
          </aside>
        </div>

        {/* Featured tour + GYG Widget — mobile (after main content) */}
        {castle.gyg_featured_tours && castle.gyg_featured_tours.length > 0 && (
          <div className="lg:hidden mt-6">
            <GYGFeaturedTour tour={castle.gyg_featured_tours[0]} castleName={castle.name} />
          </div>
        )}
        <div className="lg:hidden mt-6">
          <GYGWidget
            locationId={castle.gyg_location_id}
            searchQuery={castle.gyg_search_query}
            numResults={castle.gyg_num_results ?? 4}
            widgetType={castle.gyg_widget_type}
            title="Tours & Tickets"
          />
        </div>
      </div>

      {/* ── Sticky mobile booking bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {castle.price_adult !== undefined && castle.price_adult > 0 ? (
            <>
              <p className="text-xs text-stone-500 leading-none mb-0.5">Entry from</p>
              <p className="font-serif font-bold text-[#1761a0] text-xl leading-none">
                €{castle.price_adult}
                <span className="text-stone-400 font-normal text-xs ml-1">/ adult</span>
              </p>
            </>
          ) : castle.price_adult === 0 ? (
            <p className="font-serif font-bold text-[#1761a0] text-xl leading-none">Free Entry</p>
          ) : (
            <p className="font-serif font-bold text-[#1761a0] text-base leading-none">Plan Your Visit</p>
          )}
        </div>
        <a
          href={getGYGSearchUrl(castle.name)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex-shrink-0 bg-[#c9a84c] text-[#1761a0] font-bold text-sm px-5 py-3 rounded-lg hover:bg-[#b8973b] transition-colors whitespace-nowrap"
        >
          See Tours →
        </a>
      </div>
    </>
  );
}
