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

// Real-world km, used only to cap how far "nearby" can stretch — not to
// re-rank. 1° of longitude is ~111km at the equator but ~70km at
// Portugal's latitude, so the degree-based ordering below isn't a true
// distance, but it's the ordering already live on every one of these
// pages today; changing the cutoff shouldn't also reshuffle everyone
// else's results as a side effect.
function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MAX_NEARBY_DISTANCE_KM = 250;

export function getNearbyCastles(castle: Castle, limit = 4): Castle[] {
  if (castle.nearby_castles && castle.nearby_castles.length > 0) {
    return getCastlesByIds(castle.nearby_castles).slice(0, limit);
  }

  // Auto-calculate by proximity if not set — same degree-distance ranking
  // as before (so every castle's selection is unchanged unless this cutoff
  // actually removes something), with a real-km cutoff applied afterward
  // and never backfilled. A genuinely isolated site (e.g. one on an island
  // with nothing else nearby in the dataset) correctly shows fewer than
  // `limit`, or none at all, rather than a distant false match.
  const all = getPublishedCastles().filter((c) => c.id !== castle.id);
  return all
    .map((c) => ({
      castle: c,
      degreeDistance: Math.sqrt((c.lat - castle.lat) ** 2 + (c.lng - castle.lng) ** 2),
    }))
    .sort((a, b) => a.degreeDistance - b.degreeDistance)
    .slice(0, limit)
    .filter((item) => haversineDistanceKm(castle.lat, castle.lng, item.castle.lat, item.castle.lng) <= MAX_NEARBY_DISTANCE_KM)
    .map((item) => item.castle);
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
