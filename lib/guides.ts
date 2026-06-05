import fs from 'fs';
import path from 'path';
import { Guide } from '@/types';

const GUIDES_DIR = path.join(process.cwd(), 'data/guides');

export function getAllGuides(): Guide[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.json'));
  return files
    .map((f) => JSON.parse(fs.readFileSync(path.join(GUIDES_DIR, f), 'utf-8')) as Guide)
    .sort((a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime());
}

export function getGuideBySlug(slug: string): Guide | null {
  const filePath = path.join(GUIDES_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Guide;
}

export function getGuidesByCountry(country: string): Guide[] {
  return getAllGuides().filter((g) => g.country === country);
}
