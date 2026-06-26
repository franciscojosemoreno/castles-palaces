import fs from 'fs';
import path from 'path';
import { Country } from '@/types';

const COUNTRIES_FILE = path.join(process.cwd(), 'data/countries.json');
const FALLBACK_IMAGE_URL = '/images/hero-home.jpg';

function publicFileExists(url: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', url));
}

function withImageFallback(country: Country): Country {
  return {
    ...country,
    hero_image: publicFileExists(country.hero_image.url)
      ? country.hero_image
      : { ...country.hero_image, url: FALLBACK_IMAGE_URL },
    thumbnail_image: country.thumbnail_image
      ? publicFileExists(country.thumbnail_image.url)
        ? country.thumbnail_image
        : { ...country.thumbnail_image, url: FALLBACK_IMAGE_URL }
      : country.thumbnail_image,
  };
}

export function getAllCountries(): Country[] {
  const content = fs.readFileSync(COUNTRIES_FILE, 'utf-8');
  const countries = JSON.parse(content) as Country[];
  return countries.map(withImageFallback);
}

export function getCountryBySlug(slug: string): Country | null {
  const countries = getAllCountries();
  return countries.find((c) => c.slug === slug) ?? null;
}
