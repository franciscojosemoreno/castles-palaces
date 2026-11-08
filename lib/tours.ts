import fs from 'fs';
import path from 'path';
import type { Castle } from '@/types';
import type { Tour, TourCountry } from '@/types/tours';
import { getPublishedCastles } from '@/lib/castles';
import { shouldShowStars } from '@/lib/rating-thresholds';

// A tour below the display threshold never outranks one above it on rating
// alone — same invariant as the stars/badge display, so a 2-review 5.0
// can't out-sort a well-reviewed tour just because log10 dampening alone
// didn't fully suppress it.
function popularityScore(tour: Pick<Tour, 'rating' | 'review_count'>): number {
  if (!shouldShowStars(tour.rating, tour.review_count)) return 0;
  return (tour.rating ?? 0) * Math.log10((tour.review_count ?? 1) + 1);
}

const toursDir = path.join(process.cwd(), 'data/tours');

export function getAllTours(): Tour[] {
  const tours: Tour[] = [];
  if (!fs.existsSync(toursDir)) return tours;
  const countries = fs.readdirSync(toursDir);
  for (const country of countries) {
    const countryPath = path.join(toursDir, country);
    if (!fs.statSync(countryPath).isDirectory()) continue;
    const files = fs.readdirSync(countryPath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(countryPath, file), 'utf-8'));
      tours.push(data);
    }
  }
  return tours.sort((a, b) => {
    return popularityScore(b) - popularityScore(a);
  });
}

export function getToursByCountry(country: string): Tour[] {
  return getAllTours().filter(t => t.departure_country === country);
}

export function getTourBySlug(country: string, slug: string): Tour | undefined {
  return getAllTours().find(t => t.departure_country === country && t.slug === slug);
}

export interface TourVisitingCastle {
  slug: string;
  country: string;
  name: string;
  duration_label: string;
}

// Words that carry no identity in a castle name ("Castle of X" -> X), used to check that a tour
// really talks about a castle before linking to it.
const GENERIC_NAME_WORDS = new Set([
  'castle', 'palace', 'chateau', 'fortress', 'citadel', 'of', 'de', 'the', 'royal', 'grand', 'ducal', 'walls',
  'fort', 'kasteel', 'schloss', 'castillo', 'castello', 'palacio', 'cetatea', 'hrad', 'zamek', 'city', 'old',
  'town', 'la', 'le', 'du', 'des', 'et', 'and', 'national', 'imperial', 'medieval', 'tower', 'fortaleza',
  'st', 'saint', 's',
]);

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\x00-\x7f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ');
}

function tourSearchText(tour: Tour): string {
  const parts = [tour.name, tour.tagline, tour.overview, tour.meta?.title, tour.meta?.description, ...(tour.highlights ?? []), ...(tour.tips ?? [])];
  for (const stop of tour.itinerary ?? []) parts.push(stop.castle_name, stop.description);
  return ` ${normalizeText(parts.filter(Boolean).join(' '))} `;
}

/** True when the tour's own text names the castle (full name, distinctive part, or all its distinctive words). */
function tourNamesCastle(castle: Castle, text: string): boolean {
  const words = new Set(text.split(' '));
  for (const name of [castle.name, castle.local_name ?? '']) {
    const full = normalizeText(name).trim();
    if (full.length >= 4 && text.includes(` ${full} `)) return true;
    const core = full.split(' ').filter((w) => w && !GENERIC_NAME_WORDS.has(w));
    if (!core.length) continue;
    if (core.join(' ').length >= 3 && text.includes(` ${core.join(' ')} `)) return true;
    if (core.length >= 2 && core.every((w) => w.length >= 4 && words.has(w))) return true;
  }
  return false;
}

let toursByCastleId: Map<string, Tour[]> | null = null;
let toursCoveringCastleId: Map<string, Tour[]> | null = null;

function buildCastleTourIndexes() {
  toursByCastleId = new Map();
  toursCoveringCastleId = new Map();
  const published = new Map(getPublishedCastles().map((c) => [c.id, c] as [string, Castle]));

  // GetYourGuide product id -> castle fichas whose featured tour is that product (the ficha itself
  // plus the castles its `covers_castles` lists).
  const castlesByProduct = new Map<string, Set<string>>();
  for (const castle of published.values()) {
    for (const featured of castle.gyg_featured_tours ?? []) {
      const set = castlesByProduct.get(String(featured.tour_id)) ?? new Set<string>();
      for (const id of [castle.id, ...(featured.covers_castles ?? [])]) if (published.has(id)) set.add(id);
      castlesByProduct.set(String(featured.tour_id), set);
    }
  }

  for (const tour of getAllTours()) {
    const stopIds = new Set<string>();
    for (const stop of tour.itinerary ?? []) {
      if (!stop.castle_id || stopIds.has(stop.castle_id)) continue;
      stopIds.add(stop.castle_id);
      const list = toursByCastleId.get(stop.castle_id) ?? [];
      list.push(tour);
      toursByCastleId.set(stop.castle_id, list);
    }
    // A tour with no itinerary stop that is a castle page: fall back to the castles its GetYourGuide
    // product covers, but only those the tour's own text names (covers_castles can be broader than
    // what the tour visits).
    if ([...stopIds].some((id) => published.has(id))) continue;
    const text = tourSearchText(tour);
    for (const id of castlesByProduct.get(String(tour.gyg_tour_id)) ?? []) {
      const castle = published.get(id);
      if (!castle || !tourNamesCastle(castle, text)) continue;
      const list = toursCoveringCastleId.get(id) ?? [];
      list.push(tour);
      toursCoveringCastleId.set(id, list);
    }
  }
}

/**
 * Tours that visit the castle, at most `limit`: first the tours whose itinerary has it as a stop
 * (`castle_id`), then tours without such stops whose GetYourGuide product covers it
 * (`covers_castles`). Each group is ranked like the /tours listing (popularityScore), ties by name.
 * Feeds the "Tours that visit" block on a castle page: plain internal links, no affiliate link.
 */
export function getToursVisitingCastle(castleId: string, limit = 3): TourVisitingCastle[] {
  if (!toursByCastleId || !toursCoveringCastleId) buildCastleTourIndexes();
  const rank = (list: Tour[]) =>
    list.slice().sort((a, b) => popularityScore(b) - popularityScore(a) || a.name.localeCompare(b.name));
  const byStop = rank(toursByCastleId!.get(castleId) ?? []);
  const seen = new Set(byStop.map((t) => `${t.departure_country}/${t.slug}`));
  const byCovers = rank(toursCoveringCastleId!.get(castleId) ?? []).filter((t) => !seen.has(`${t.departure_country}/${t.slug}`));
  return [...byStop, ...byCovers]
    .slice(0, limit)
    .map((t) => ({ slug: t.slug, country: t.departure_country, name: t.name, duration_label: t.duration_label }));
}

export function getFeaturedTours(limit = 6): Tour[] {
  return getAllTours()
    .filter(t => t.featured)
    .sort((a, b) => {
      return popularityScore(b) - popularityScore(a);
    })
    .slice(0, limit);
}

export function getAllTourCountries(): TourCountry[] {
  const tours = getAllTours();
  const map = new Map<string, Tour[]>();
  for (const tour of tours) {
    const arr = map.get(tour.departure_country) ?? [];
    arr.push(tour);
    map.set(tour.departure_country, arr);
  }
  return Array.from(map.entries()).map(([slug, arr]) => ({
    slug,
    name: arr[0].departure_city.split(',')[0],
    tour_count: arr.length,
    hero_image: arr[0].hero_image,
  }));
}

export function getAllTourCountrySlugs(): string[] {
  const tours = getAllTours();
  return [...new Set(tours.map(t => t.departure_country))];
}

export function getAllTourParams(): { country: string; slug: string }[] {
  return getAllTours().map(t => ({ country: t.departure_country, slug: t.slug }));
}
