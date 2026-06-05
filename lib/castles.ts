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
    if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
    return (b.annual_visitors ?? 0) - (a.annual_visitors ?? 0);
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
    .sort((a, b) => b.priority_score - a.priority_score);
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

export function getNearbyCastles(castle: Castle, limit = 4): Castle[] {
  if (castle.nearby_castles && castle.nearby_castles.length > 0) {
    return getCastlesByIds(castle.nearby_castles).slice(0, limit);
  }

  // Auto-calculate by proximity if not set
  const all = getPublishedCastles().filter((c) => c.id !== castle.id);
  return all
    .map((c) => ({
      castle: c,
      distance: Math.sqrt(Math.pow(c.lat - castle.lat, 2) + Math.pow(c.lng - castle.lng, 2)),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
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
