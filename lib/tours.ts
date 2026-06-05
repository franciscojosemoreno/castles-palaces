import fs from 'fs';
import path from 'path';
import type { Tour, TourCountry } from '@/types/tours';

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
    const scoreA = (a.rating ?? 0) * Math.log10((a.review_count ?? 1) + 1);
    const scoreB = (b.rating ?? 0) * Math.log10((b.review_count ?? 1) + 1);
    return scoreB - scoreA;
  });
}

export function getToursByCountry(country: string): Tour[] {
  return getAllTours().filter(t => t.departure_country === country);
}

export function getTourBySlug(country: string, slug: string): Tour | undefined {
  return getAllTours().find(t => t.departure_country === country && t.slug === slug);
}

export function getFeaturedTours(limit = 6): Tour[] {
  return getAllTours()
    .filter(t => t.featured)
    .sort((a, b) => {
      const scoreA = (a.rating ?? 0) * Math.log10((a.review_count ?? 1) + 1);
      const scoreB = (b.rating ?? 0) * Math.log10((b.review_count ?? 1) + 1);
      return scoreB - scoreA;
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
