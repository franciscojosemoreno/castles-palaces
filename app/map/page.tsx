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
  // grid — Estado C (hotel-only) castles stay in, flagged as isHotel for a distinct marker.
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
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <CastleMap castles={mapData} />
    </div>
  );
}
