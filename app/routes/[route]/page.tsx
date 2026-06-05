import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getAllRoutes, getRouteBySlug } from '@/lib/routes';
import { getCastlesByIds } from '@/lib/castles';
import CastleCard from '@/components/castle/CastleCard';
import GYGWidget from '@/components/affiliate/GYGWidget';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface PageProps {
  params: Promise<{ route: string }>;
}

export async function generateStaticParams() {
  return getAllRoutes().map((r) => ({ route: r.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { route: routeSlug } = await params;
  const route = getRouteBySlug(routeSlug);
  if (!route) return {};

  return {
    title: `${route.name}: The Complete Castle Route Guide`,
    description: route.tagline,
    alternates: { canonical: `/routes/${routeSlug}` },
  };
}

export default async function RoutePage({ params }: PageProps) {
  const { route: routeSlug } = await params;
  const route = getRouteBySlug(routeSlug);

  if (!route) notFound();

  const castles = getCastlesByIds(route.castles);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[400px] overflow-hidden">
        <Image
          src={route.hero_image.url}
          alt={route.hero_image.alt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/65" />
        <div className="absolute bottom-0 left-0 p-8 text-white max-w-3xl">
          <p className="text-white/70 text-sm uppercase tracking-wider mb-2">
            {route.duration_days}
            {route.distance_km ? ` · ${route.distance_km}km` : ''}
            {` · ${route.countries.join(', ')}`}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-2">{route.name}</h1>
          <p className="text-white/85 text-lg">{route.tagline}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Routes', href: '/routes' },
            { label: route.name },
          ]}
        />

        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 mt-8">
          <div>
            <p className="text-stone-600 leading-relaxed text-base mb-10 max-w-2xl">{route.description}</p>

            <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-6">
              Castles on this Route ({castles.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {castles.map((castle, i) => (
                <div key={castle.id} className="relative">
                  <span className="absolute -top-2 -left-2 z-10 bg-[#c9a84c] text-[#1761a0] font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                  <CastleCard castle={castle} />
                </div>
              ))}
            </div>
          </div>

          <aside className="mt-10 lg:mt-0 space-y-6 lg:self-start lg:sticky lg:top-24">
            <GYGWidget
              searchQuery={route.gyg_search_query}
              title="Tours on this Route"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
