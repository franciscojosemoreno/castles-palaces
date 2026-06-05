import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getAllGuides } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Castle Travel Guides',
  description:
    'In-depth travel guides to Europe\'s most iconic castles and palace regions — best-of lists, itineraries and practical advice.',
};

export default function GuidesPage() {
  const guides = getAllGuides();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider mb-1">Editorial</p>
        <h1 className="font-serif text-4xl font-bold text-[#1761a0] mb-3">Travel Guides</h1>
        <p className="text-stone-600 text-lg max-w-2xl">
          Best-of lists, itineraries and practical guides to Europe's castle regions — written for travellers who want more than a Wikipedia summary.
        </p>
      </div>

      {guides.length === 0 ? (
        <p className="text-stone-400 text-center py-20">Guides coming soon.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.id}`}
              className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-stone-100"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={(guide.thumbnail_image ?? guide.hero_image).url}
                  alt={(guide.thumbnail_image ?? guide.hero_image).alt}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-4">
                {guide.country && (
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-1 capitalize">
                    {guide.country.replace('-', ' ')}
                  </p>
                )}
                <h2 className="font-serif font-bold text-[#1a1a1a] text-lg leading-snug mb-2 group-hover:text-[#1761a0]">
                  {guide.title}
                </h2>
                <p className="text-sm text-stone-500">
                  {guide.castles.length} castle{guide.castles.length !== 1 ? 's' : ''} featured
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
