'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MediaItem } from '@/types';

interface CastleGalleryProps {
  images: MediaItem[];
  castleName: string;
}

export default function CastleGallery({ images, castleName }: CastleGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible">
        {images.map((img, i) => (
          <button
            key={i}
            className="relative flex-shrink-0 w-64 sm:w-auto aspect-[4/3] rounded-lg overflow-hidden cursor-zoom-in"
            onClick={() => setLightboxIndex(i)}
            aria-label={`View photo ${i + 1} of ${castleName}`}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              className="object-cover hover:scale-[1.03] transition-transform duration-300"
              sizes="(max-width: 640px) 256px, (max-width: 1024px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] aspect-[4/3]">
            <Image
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].alt}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
          >
            ✕
          </button>
          {images[lightboxIndex].credit && (
            <p className="absolute bottom-4 text-white/50 text-xs">
              Photo: {images[lightboxIndex].credit}
            </p>
          )}
        </div>
      )}
    </>
  );
}
