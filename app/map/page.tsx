import type { Metadata } from 'next';
import { getPublishedCastles } from '@/lib/castles';
import { isHotelOnly } from '@/lib/hotels';
import CastleMap from '@/components/map/CastleMap';

export const metadata: Metadata = {
  title: 'Interactive Map of European Castles & Palaces',
  description: 'Explore 125 castles and palaces across Europe on an interactive map. Filter by country, type, UNESCO status and more.',
};

export default function MapPage() {
  // Unlike /castles, the map is a location tool rather than a "what to visit" editorial
  // grid — Estado C (hotel-only) castles stay in, flagged as isHotel for the distinct purple
  // marker/badge. hasHotel is broader (any castle with a bookable hotel component, including
  // Estado B like Castle Fraser) and drives the "Castle hotels only" filter toggle only —
  // the marker colour and popup still key off isHotel so a real visit-castle like Castle
  // Fraser keeps its normal type-coloured pin rather than the "hotel-only" purple one.
  const castles = getPublishedCastles();
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
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <CastleMap castles={mapData} />
    </div>
  );
}
