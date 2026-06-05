import fs from 'fs';
import path from 'path';
import { Route } from '@/types';

const ROUTES_DIR = path.join(process.cwd(), 'data/routes');

export function getAllRoutes(): Route[] {
  if (!fs.existsSync(ROUTES_DIR)) return [];
  const files = fs.readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.json'));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(ROUTES_DIR, f), 'utf-8')) as Route);
}

export function getRouteBySlug(slug: string): Route | null {
  const filePath = path.join(ROUTES_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Route;
}

export function getRoutesByCastle(castleId: string): Route[] {
  return getAllRoutes().filter((r) => r.castles.includes(castleId));
}
