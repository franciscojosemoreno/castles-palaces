import Image from 'next/image';
import Link from 'next/link';
import { getAllTourParams, getTourBySlug } from '@/lib/tours';
import { getCountryBySlug } from '@/lib/countries';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import type { Metadata } from 'next';
import TourStructuredData from '@/components/seo/TourStructuredData';
import GYGWidget from '@/components/affiliate/GYGWidget';

const GYG_PARTNER_ID = process.env.NEXT_PUBLIC_GYG_PARTNER_ID ?? '';

interface Props {
  params: Promise<{ country: string; slug: string }>;
}

export async function generateStaticParams() {
  return getAllTourParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;
  const tour = getTourBySlug(country, slug);
  if (!tour) return {};
  return {
    title: tour.meta.title,
    description: tour.meta.description,
    alternates: {
      canonical: `/tours/${country}/${slug}`,
    },
    openGraph: {
      title: tour.meta.title,
      description: tour.meta.description,
      images: tour.hero_image?.url ? [{ url: tour.hero_image.url }] : [],
      type: 'article',
    },
  };
}

export default async function TourPage({ params }: Props) {
  const { country, slug } = await params;
  const tour = getTourBySlug(country, slug);
  if (!tour) notFound();

  const countryData = getCountryBySlug(country);
  const countryName = countryData?.name ?? country.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const currencySymbol = tour.currency === 'USD' ? '$' : tour.currency === 'GBP' ? '£' : '€';
  const gygUrl = GYG_PARTNER_ID
    ? `${tour.gyg_url}${tour.gyg_url.includes('?') ? '&' : '?'}partner_id=${GYG_PARTNER_ID}`
    : tour.gyg_url;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
      <TourStructuredData tour={tour} url={`/tours/${country}/${slug}`} />
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tours', href: '/tours' },
          { label: countryName, href: `/tours/${country}` },
          { label: tour.name },
        ]}
      />

      <div className="mt-6 lg:grid lg:grid-cols-[1fr_340px] lg:gap-10">

        {/* Left column */}
        <div className="min-w-0">

          {/* Hero image */}
          <div className="relative aspect-[3/2] sm:aspect-[16/9] -mx-4 sm:mx-0 rounded-none sm:rounded-xl overflow-hidden mb-6">
            <Image
              src={tour.hero_image.url}
              alt={tour.hero_image.alt}
              fill
              priority
              quality={90}
              className="object-cover object-center"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, calc(100vw - 380px)"
            />
          </div>

          {/* Title block */}
          <p className="text-[#c9a84c] text-xs font-medium uppercase tracking-wider mb-2">
            Departing from {tour.departure_city}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1761a0] leading-tight mb-2">
            {tour.name}
          </h1>
          <p className="text-stone-500 text-base mb-4">{tour.tagline}</p>

          {/* Price + rating — visible on mobile only (desktop has sidebar) */}
          <div className="lg:hidden flex items-center gap-4 mb-6 py-3 px-4 bg-[#f5f0e8] rounded-lg">
            <div>
              <p className="text-xs text-stone-500 leading-none mb-0.5">From</p>
              <p className="font-serif font-bold text-[#1761a0] text-2xl leading-none">
                {currencySymbol}{tour.price_from}
                <span className="text-stone-400 font-normal text-sm ml-1">/ person</span>
              </p>
            </div>
            <div className="w-px h-8 bg-stone-300" />
            <div>
              <p className="text-xs text-stone-500 leading-none mb-0.5">Rating</p>
              <p className="font-semibold text-[#1a1a1a] text-sm">
                <span className="text-[#c9a84c]">★</span> {tour.rating}
                <span className="text-stone-400 font-normal ml-1">({tour.review_count.toLocaleString()})</span>
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-6 py-6 border-y border-gray-200 mb-10">
            <div>
              <p className="text-xs text-[#666] uppercase tracking-wider">Duration</p>
              <p className="font-semibold text-[#1a1a1a]">{tour.duration_label}</p>
            </div>
            <div>
              <p className="text-xs text-[#666] uppercase tracking-wider">Rating</p>
              <p className="font-semibold text-[#1a1a1a]">{tour.rating} ★ ({tour.review_count.toLocaleString()} reviews)</p>
            </div>
            <div>
              <p className="text-xs text-[#666] uppercase tracking-wider">Languages</p>
              <p className="font-semibold text-[#1a1a1a]">{tour.languages.join(', ')}</p>
            </div>
            <div>
              <p className="text-xs text-[#666] uppercase tracking-wider">Group size</p>
              <p className="font-semibold text-[#1a1a1a]">Max {tour.max_group_size} people</p>
            </div>
          </div>

          <div className="space-y-12">

            {/* Overview */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-4">About This Tour</h2>
              <p className="text-[#333] leading-relaxed">{tour.overview}</p>
            </div>

            {/* Highlights */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-4">Highlights</h2>
              <ul className="space-y-2">
                {tour.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#c9a84c] font-bold mt-0.5">✓</span>
                    <span className="text-[#333]">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Inline CTA after highlights — mobile only */}
            <div className="lg:hidden -mt-4 mb-8 rounded-lg border border-[#c9a84c]/40 bg-[#f5f0e8] px-4 py-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[#1761a0] font-semibold text-sm leading-tight">Ready to book this tour?</p>
                <p className="text-stone-500 text-xs mt-0.5">Free cancellation · Instant confirmation</p>
              </div>
              <a
                href={gygUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex-shrink-0 bg-[#c9a84c] text-[#1761a0] font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-[#b8973b] transition-colors whitespace-nowrap"
              >
                Book Now →
              </a>
            </div>

            {/* Itinerary */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-6">Itinerary</h2>
              <div className="space-y-0">
                {tour.itinerary.map((stop, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#1761a0] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {stop.order}
                      </div>
                      {i < tour.itinerary.length - 1 && (
                        <div className="w-0.5 flex-1 bg-[#1761a0]/20 my-1 min-h-[2rem]" />
                      )}
                    </div>
                    <div className="pb-8">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {stop.castle_id ? (
                          <Link
                            href={`/castles/${tour.visited_countries[0]}/${stop.castle_id}`}
                            className="font-serif font-bold text-lg text-[#1761a0] hover:text-[#c9a84c] transition-colors"
                          >
                            {stop.castle_name}
                          </Link>
                        ) : GYG_PARTNER_ID ? (
                          <a
                            href={`https://www.getyourguide.com/s/?q=${encodeURIComponent(stop.castle_name)}&partner_id=${GYG_PARTNER_ID}`}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="font-serif font-bold text-lg text-[#1761a0] hover:text-[#c9a84c] transition-colors"
                          >
                            {stop.castle_name}
                          </a>
                        ) : (
                          <span className="font-serif font-bold text-lg text-[#1a1a1a]">
                            {stop.castle_name}
                          </span>
                        )}
                        <span className="text-xs text-[#666] bg-[#f5f0e8] px-2 py-0.5 rounded-full">{stop.duration}</span>
                      </div>
                      <p className="text-[#555] leading-relaxed">{stop.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Included / Excluded */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1761a0] mb-4">What's Included</h3>
                <ul className="space-y-2">
                  {tour.included.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#333]">
                      <span className="text-green-600 font-bold flex-shrink-0">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1761a0] mb-4">Not Included</h3>
                <ul className="space-y-2">
                  {tour.excluded.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#333]">
                      <span className="text-red-500 font-bold flex-shrink-0">✗</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tips */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-4">Insider Tips</h2>
              <div className="space-y-3">
                {tour.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 bg-[#f5f0e8] rounded-lg p-4">
                    <span className="text-[#c9a84c] text-xl flex-shrink-0">💡</span>
                    <p className="text-sm text-[#333] leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="pb-10">
              <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-6">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {tour.faqs.map((faq, i) => (
                  <div key={i}>
                    <h3 className="font-semibold text-[#1a1a1a] mb-2">{faq.question}</h3>
                    <p className="text-[#555] leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* More tours from this city */}
            <div className="pb-8">
              <GYGWidget
                searchQuery={`${tour.departure_city} castle tour`}
                numResults={4}
                widgetType="activities"
                title={`More Tours from ${tour.departure_city}`}
              />
            </div>

          </div>
        </div>

        {/* Right column: booking sidebar */}
        <div className="mt-8 lg:mt-0">
          <div className="sticky top-6 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-[#1761a0] p-6 text-white">
              <p className="text-white/70 text-sm">From</p>
              <p className="font-serif text-3xl font-bold">{currencySymbol}{tour.price_from}</p>
              <p className="text-white/70 text-sm">per person</p>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="text-[#c9a84c] font-bold">{tour.rating}</span>
                <span className="text-[#c9a84c]">★★★★★</span>
                <span className="text-white/60 text-xs">({tour.review_count.toLocaleString()} reviews)</span>
              </div>
            </div>
            <div className="p-6">
              <a
                href={gygUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#c9a84c] text-[#1761a0] font-bold text-base px-6 py-4 rounded-lg hover:bg-[#b8973b] transition-colors"
              >
                Book on GetYourGuide
              </a>
              <p className="text-xs text-center text-[#999] mt-3">
                Free cancellation available on most dates · Secure booking
              </p>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-[#666] uppercase tracking-wider font-medium mb-2">Meeting point</p>
                <p className="text-sm text-[#555]">{tour.meeting_point}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Sticky mobile booking bar ─────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-stone-500 leading-none mb-0.5">From</p>
          <p className="font-serif font-bold text-[#1761a0] text-xl leading-none">
            {currencySymbol}{tour.price_from}
            <span className="text-stone-400 font-normal text-xs ml-1">/ person</span>
          </p>
        </div>
        <a
          href={gygUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex-shrink-0 bg-[#c9a84c] text-[#1761a0] font-bold text-sm px-5 py-3 rounded-lg hover:bg-[#b8973b] transition-colors whitespace-nowrap"
        >
          Book Now →
        </a>
      </div>
    </div>
  );
}
