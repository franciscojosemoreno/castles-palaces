import type { Castle, MediaItem } from '@/types';
import { getPublishedCastles } from '@/lib/castles';
import { getCountryBySlug } from '@/lib/countries';

/**
 * Server-only helpers for the /castle-hotels section (build-time fs reads via
 * lib/castles + lib/countries). Kept out of lib/hotels.ts because that module
 * is also imported by the client-side CastleMap component — pulling fs in
 * there breaks the client bundle.
 */

/** Every published castle with a bookable hotel component — hotel-only (Estado C) and visit+hotel (Estado B) alike. */
export function getHotelCastles(): Castle[] {
  return getPublishedCastles().filter((c) => Boolean(c.hotel?.is_hotel));
}

export function getHotelCastlesByCountry(country: string): Castle[] {
  return getHotelCastles().filter((c) => c.country === country);
}

export interface HotelCountrySummary {
  slug: string;
  name: string;
  count: number;
  heroImage: MediaItem;
}

/** Countries with at least one castle hotel, each with its live count and a representative image — computed at build time so new batches need no manual update. */
export function getHotelCountrySummaries(): HotelCountrySummary[] {
  const byCountry = new Map<string, Castle[]>();
  for (const castle of getHotelCastles()) {
    const arr = byCountry.get(castle.country) ?? [];
    arr.push(castle);
    byCountry.set(castle.country, arr);
  }

  const summaries: HotelCountrySummary[] = [];
  for (const [slug, castles] of byCountry.entries()) {
    const countryData = getCountryBySlug(slug);
    if (!countryData) continue; // e.g. a data directory with no matching countries.json entry
    summaries.push({
      slug,
      name: countryData.name,
      count: castles.length,
      heroImage: countryData.thumbnail_image ?? countryData.hero_image,
    });
  }
  return summaries.sort((a, b) => b.count - a.count);
}

export function getAllHotelCountrySlugs(): string[] {
  return getHotelCountrySummaries().map((s) => s.slug);
}
