import type { MetadataRoute } from 'next';
import { getAllCastleParams, getPublishedCastles, getAllCountrySlugs } from '@/lib/castles';
import { getAllRoutes } from '@/lib/routes';
import { getAllTourParams, getAllTourCountrySlugs } from '@/lib/tours';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.castles-palaces.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const castleParams = getAllCastleParams();
  const castleCountrySlugs = getAllCountrySlugs();
  const routes = getAllRoutes();
  const tourParams = getAllTourParams();
  const tourCountrySlugs = getAllTourCountrySlugs();

  const castleUrls: MetadataRoute.Sitemap = castleParams.map(({ country, castle }) => ({
    url: `${BASE_URL}/castles/${country}/${castle}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const castleCountryUrls: MetadataRoute.Sitemap = castleCountrySlugs.map((slug) => ({
    url: `${BASE_URL}/castles/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const tourUrls: MetadataRoute.Sitemap = tourParams.map(({ country, slug }) => ({
    url: `${BASE_URL}/tours/${country}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const tourCountryUrls: MetadataRoute.Sitemap = tourCountrySlugs.map((slug) => ({
    url: `${BASE_URL}/tours/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const routeUrls: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${BASE_URL}/routes/${route.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/castles`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/tours`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/routes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/guides`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];

  return [...staticUrls, ...castleUrls, ...castleCountryUrls, ...tourUrls, ...tourCountryUrls, ...routeUrls];
}
