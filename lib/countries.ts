import fs from 'fs';
import path from 'path';
import { Country } from '@/types';

const COUNTRIES_FILE = path.join(process.cwd(), 'data/countries.json');

export function getAllCountries(): Country[] {
  const content = fs.readFileSync(COUNTRIES_FILE, 'utf-8');
  return JSON.parse(content) as Country[];
}

export function getCountryBySlug(slug: string): Country | null {
  const countries = getAllCountries();
  return countries.find((c) => c.slug === slug) ?? null;
}
