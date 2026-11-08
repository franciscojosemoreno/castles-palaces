import fs from 'fs';
import path from 'path';
import { Castle, CountryStats } from '@/types';

const CASTLES_DIR = path.join(process.cwd(), 'data/castles');

export function getAllCastles(): Castle[] {
  const castles: Castle[] = [];
  const countries = fs.readdirSync(CASTLES_DIR);

  for (const country of countries) {
    const countryPath = path.join(CASTLES_DIR, country);
    const stat = fs.statSync(countryPath);
    if (!stat.isDirectory()) continue;

    const files = fs.readdirSync(countryPath).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(countryPath, file), 'utf-8');
      const castle = JSON.parse(content) as Castle;
      castles.push(castle);
    }
  }

  return castles.sort((a, b) => {
    const avDiff = (b.annual_visitors ?? 0) - (a.annual_visitors ?? 0);
    if (avDiff !== 0) return avDiff;
    return a.name.localeCompare(b.name);
  });
}

export function getPublishedCastles(): Castle[] {
  return getAllCastles().filter((c) => c.status === 'published');
}

export function getCastlesByCountry(country: string): Castle[] {
  const countryPath = path.join(CASTLES_DIR, country);
  if (!fs.existsSync(countryPath)) return [];

  const files = fs.readdirSync(countryPath).filter((f) => f.endsWith('.json'));
  return files
    .map((f) => JSON.parse(fs.readFileSync(path.join(countryPath, f), 'utf-8')) as Castle)
    .filter((c) => c.status === 'published')
    .sort((a, b) => {
      const avDiff = (b.annual_visitors ?? 0) - (a.annual_visitors ?? 0);
      if (avDiff !== 0) return avDiff;
      return a.name.localeCompare(b.name);
    });
}

export function getCastleBySlug(country: string, slug: string): Castle | null {
  const filePath = path.join(CASTLES_DIR, country, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Castle;
}

export function getFeaturedCastles(limit = 6): Castle[] {
  return getPublishedCastles()
    .filter((c) => c.featured)
    .slice(0, limit);
}

export function getCastlesByIds(ids: string[]): Castle[] {
  const all = getAllCastles();
  return ids
    .map((id) => all.find((c) => c.id === id))
    .filter((c): c is Castle => c !== undefined);
}

// Great-circle distance in km. "Nearby" is ranked and capped by this real distance (1° of longitude
// is ~111 km at the equator but ~70 km at Portugal's latitude, so degree distance is not usable).
export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Nothing farther than this is shown as "Nearby" (scripts/check-nearby.mjs enforces it on the data). */
export const MAX_NEARBY_DISTANCE_KM = 150;
/** A castle with nothing within MAX_NEARBY_DISTANCE_KM shows this many nearest castles anyway... */
const NEARBY_FALLBACK_COUNT = 2;
/** ...unless even the nearest one is farther than this: then there is no Nearby block at all (see getMoreCastlesInCountry). */
export const NEARBY_HIDE_BEYOND_KM = 500;

export interface NearbyCastle {
  castle: Castle;
  distanceKm: number;
}

/**
 * The "Nearby Castles" block: at most `limit` castles within MAX_NEARBY_DISTANCE_KM, closest first,
 * with their distance. A manual `nearby_castles` list is used when there is one, otherwise the
 * closest castles by coordinates. A castle with nothing within MAX_NEARBY_DISTANCE_KM (an island or
 * a remote site) shows its 2 nearest with their distance; if even the nearest is farther than
 * NEARBY_HIDE_BEYOND_KM (Angra do Heroísmo, in the Azores) the block is empty and the page lists the
 * nearest castles of its own country under "More castles in <country>" instead.
 */
export function getNearbyCastles(castle: Castle, limit = 4): NearbyCastle[] {
  const withDistance = (c: Castle): NearbyCastle => ({
    castle: c,
    distanceKm: haversineDistanceKm(castle.lat, castle.lng, c.lat, c.lng),
  });
  const byDistance = (a: NearbyCastle, b: NearbyCastle) => a.distanceKm - b.distanceKm;

  if (castle.nearby_castles && castle.nearby_castles.length > 0) {
    return getCastlesByIds(castle.nearby_castles).map(withDistance).sort(byDistance).slice(0, limit);
  }

  const ranked = getPublishedCastles().filter((c) => c.id !== castle.id).map(withDistance).sort(byDistance);
  const near = ranked.filter((item) => item.distanceKm <= MAX_NEARBY_DISTANCE_KM).slice(0, limit);
  if (near.length > 0) return near;
  if (!ranked.length || ranked[0].distanceKm > NEARBY_HIDE_BEYOND_KM) return [];
  return ranked.slice(0, NEARBY_FALLBACK_COUNT);
}

/** The "More castles in <country>" block: same-country castles listed by hand that are too far to be "nearby" (max 4). */
export function getMoreCastlesInCountry(castle: Castle, limit = 4): Castle[] {
  return getCastlesByIds(castle.more_castles_in_country ?? []).slice(0, limit);
}

export function getCountryStats(country: string): CountryStats {
  const castles = getCastlesByCountry(country);
  return {
    total: castles.length,
    featured: castles.filter((c) => c.featured).length,
    unesco: castles.filter((c) => c.unesco).length,
    topCastle: castles[0],
  };
}

let publishedCastleCountryById: Map<string, string> | null = null;

/**
 * Country folder of a published castle page, looked up by castle id (null when no published page
 * has that id). Tour itineraries use it to link a stop to the right /castles/<country>/<id> URL
 * instead of assuming the stop is in the tour's own country.
 */
export function getPublishedCastleCountryById(id: string): string | null {
  if (!publishedCastleCountryById) {
    publishedCastleCountryById = new Map(
      getPublishedCastles().map((c) => [c.id, c.country] as [string, string]),
    );
  }
  return publishedCastleCountryById.get(id) ?? null;
}

export function getAllCountrySlugs(): string[] {
  return fs
    .readdirSync(CASTLES_DIR)
    .filter((entry) => fs.statSync(path.join(CASTLES_DIR, entry)).isDirectory());
}

export function getAllCastleParams(): { country: string; castle: string }[] {
  const params: { country: string; castle: string }[] = [];
  const countries = getAllCountrySlugs();

  for (const country of countries) {
    const countryPath = path.join(CASTLES_DIR, country);
    const files = fs.readdirSync(countryPath).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      params.push({ country, castle: file.replace('.json', '') });
    }
  }

  return params;
}
