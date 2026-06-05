import type { Metadata } from 'next';
import { getPublishedCastles } from '@/lib/castles';
import CastleMap from '@/components/map/CastleMap';

export const metadata: Metadata = {
  title: 'Interactive Map of European Castles & Palaces',
  description: 'Explore 125 castles and palaces across Europe on an interactive map. Filter by country, type, UNESCO status and more.',
};

export default function MapPage() {
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
    price_adult: c.price_adult,
    unesco: c.unesco ?? false,
    tags: c.tags ?? [],
    hero_image: c.hero_image.url,
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <CastleMap castles={mapData} />
    </div>
  );
}
