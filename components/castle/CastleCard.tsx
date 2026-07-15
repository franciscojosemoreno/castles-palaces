import Image from 'next/image';
import Link from 'next/link';
import { Castle } from '@/types';
import Badge from '@/components/ui/Badge';

interface CastleCardProps {
  castle: Castle;
  variant?: 'default' | 'compact';
}

export default function CastleCard({ castle, variant = 'default' }: CastleCardProps) {
  const href = `/castles/${castle.country}/${castle.id}`;

  if (variant === 'compact') {
    return (
      <Link href={href} prefetch={false} className="group flex gap-3 items-center hover:bg-stone-50 rounded-lg p-2 -mx-2 transition-colors">
        <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
          <Image
            src={castle.hero_image.url}
            alt={castle.hero_image.alt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="64px"
          />
        </div>
        <div>
          <p className="font-serif font-semibold text-[#1a1a1a] text-sm leading-tight group-hover:text-[#1761a0]">
            {castle.name}
          </p>
          <p className="text-xs text-stone-500 capitalize mt-0.5">{castle.country.replace('-', ' ')} · {castle.type}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} prefetch={false} className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-stone-100">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={castle.hero_image.url}
          alt={castle.hero_image.alt}
          fill
          className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {castle.unesco && (
          <div className="absolute top-3 left-3">
            <Badge label="UNESCO" variant="unesco" />
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1 capitalize">
          {castle.country.replace('-', ' ')}
          {castle.region ? ` · ${castle.region}` : ''}
        </p>
        <h3 className="font-serif font-bold text-[#1a1a1a] text-lg leading-snug mb-1 group-hover:text-[#1761a0]">
          {castle.name}
        </h3>
        <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">{castle.tagline}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-stone-600">
            {castle.price_adult === 0 ? (
              <span className="text-green-700 font-medium">Free entry</span>
            ) : castle.price_adult ? (
              <span>From €{castle.price_adult}</span>
            ) : null}
          </span>
          <span className="text-sm font-medium text-[#c9a84c] group-hover:underline">
            Explore →
          </span>
        </div>
      </div>
    </Link>
  );
}
