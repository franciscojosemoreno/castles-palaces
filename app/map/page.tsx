import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedCastles } from '@/lib/castles';
import { isHotelOnly } from '@/lib/hotels';
import CastleMap from '@/components/map/CastleMap';

// Rounded down to the nearest hundred so the figure never needs a manual
// update as the catalogue grows — same formula app/layout.tsx already uses
// for its own default "Discover N+ Historic Sites" title.
export async function generateMetadata(): Promise<Metadata> {
  const castleCount = Math.floor(getPublishedCastles().length / 100) * 100;
  const castleCountDisplay = `${castleCount.toLocaleString('en-US')}+`;
  return {
    // Set as absolute: the site-wide "%s — Castles & Palaces" title template
    // would push this past 60 characters, so this page skips it.
    title: { absolute: 'Castle Map of Europe: Interactive Map of Castles & Palaces' },
    description: `Interactive map of castles in Europe: explore ${castleCountDisplay} castles and palaces by country, type, UNESCO status and more.`,
    alternates: { canonical: '/map' },
  };
}

export default function MapPage() {
  // Unlike /castles, the map is a location tool rather than a "what to visit" editorial
  // grid — Estado C (hotel-only) castles stay in, flagged as isHotel for the distinct purple
  // marker/badge. hasHotel is broader (any castle with a bookable hotel component, including
  // Estado B like Castle Fraser) and drives the "Castle hotels only" filter toggle only —
  // the marker colour and popup still key off isHotel so a real visit-castle like Castle
  // Fraser keeps its normal type-coloured pin rather than the "hotel-only" purple one.
  const castles = getPublishedCastles();
  const castleCountDisplay = `${(Math.floor(castles.length / 100) * 100).toLocaleString('en-US')}+`;
  const mapData = castles.map(c => ({
    id: c.id,
    name: c.name,
    country: c.country,
    slug: c.id,
    lat: c.lat,
    lng: c.lng,
    type: c.type,
    tagline: c.tagline,
    price_adult: c.gyg_featured_tours?.[0]?.price_from ?? c.price_adult,
    unesco: c.unesco ?? false,
    tags: c.tags ?? [],
    hero_image: c.hero_image.url,
    isHotel: isHotelOnly(c),
    hasHotel: Boolean(c.hotel?.is_hotel),
    hotel_price_from_night: c.hotel?.price_from_night ?? undefined,
    hotel_currency: c.hotel?.currency,
  }));

  return (
    <>
      {/* CastleMap's own root is `flex-1` expecting a flex-col parent of fixed
          height — adding this compact H1 bar as a sibling before it makes the
          map shrink to fill the remaining space automatically, with no change
          to CastleMap.tsx itself. */}
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="shrink-0 bg-white border-b border-stone-200 px-4 py-2.5 sm:px-6">
          <h1 className="font-serif font-bold text-[#1761a0] text-base sm:text-lg leading-tight">
            Castle Map of Europe
          </h1>
        </div>
        <CastleMap castles={mapData} />
      </div>

      {/* Server-rendered text — unlike the map above, this is present in the
          initial HTML before any client JS runs. */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="prose-editorial">
          <p>
            Use this interactive map of castles in Europe to find {castleCountDisplay} castles, palaces, fortresses and
            other historic sites by location, rather than reading through country guides one at a time. Click any marker
            to open a preview — a photo, the site&apos;s type and a short description — with a link through to its full
            visitor page: opening hours, how to get there, ticket information and nearby sites. The castle map works as a
            starting point for planning a specific trip as much as for simply browsing what is out there.
          </p>
          <p>
            The filters alongside the map narrow it down to what matters for your trip. Filter by country to see
            everything in a single destination such as{' '}
            <Link href="/castles/france" className="text-[#1761a0] hover:underline">France</Link>,{' '}
            <Link href="/castles/germany" className="text-[#1761a0] hover:underline">Germany</Link>,{' '}
            <Link href="/castles/italy" className="text-[#1761a0] hover:underline">Italy</Link>,{' '}
            <Link href="/castles/spain" className="text-[#1761a0] hover:underline">Spain</Link>,{' '}
            <Link href="/castles/scotland" className="text-[#1761a0] hover:underline">Scotland</Link>,{' '}
            <Link href="/castles/england" className="text-[#1761a0] hover:underline">England</Link>,{' '}
            <Link href="/castles/ireland" className="text-[#1761a0] hover:underline">Ireland</Link> or{' '}
            <Link href="/castles/portugal" className="text-[#1761a0] hover:underline">Portugal</Link>. Filter by type —
            Castle, Palace, Fortress, Chateau or Ruins — to separate working fortresses from royal palaces and ruined
            sites. Switch on UNESCO only to see just the European castles with that formal recognition, or Castle hotels
            only to see the sites where you can stay overnight.
          </p>
          <p>
            For a browsable, text-based alternative to the map, the{' '}
            <Link href="/castles" className="text-[#1761a0] hover:underline">full castle directory</Link> lists every
            site with a short description and links through to the same visitor guides.
          </p>
        </div>
      </div>
    </>
  );
}
