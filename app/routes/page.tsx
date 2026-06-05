import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getAllRoutes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Castle Routes & Itineraries in Europe',
  description: 'Explore curated castle routes across Europe — from the Loire Valley châteaux to the Scottish Highlands. Multi-day itineraries with maps and tour options.',
};

export default function RoutesPage() {
  const routes = getAllRoutes();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider mb-1">Planned Itineraries</p>
        <h1 className="font-serif text-4xl font-bold text-[#1761a0] mb-3">Castle Routes</h1>
        <p className="text-stone-600 text-lg max-w-2xl">
          Curated multi-day castle routes across Europe, with maps, stops and guided tour options.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((route) => (
          <Link
            key={route.id}
            href={`/routes/${route.id}`}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <Image
              src={(route.thumbnail_image ?? route.hero_image).url}
              alt={(route.thumbnail_image ?? route.hero_image).alt}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 text-white">
              <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
                {route.duration_days} · {route.countries.join(', ')}
              </p>
              <h2 className="font-serif font-bold text-xl leading-snug">{route.name}</h2>
              <p className="text-white/80 text-sm mt-1 line-clamp-2">{route.tagline}</p>
            </div>
          </Link>
        ))}
      </div>

      {routes.length === 0 && (
        <p className="text-center py-20 text-stone-400">Routes coming soon.</p>
      )}
    </div>
  );
}
