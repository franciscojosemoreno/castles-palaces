import type { MetadataRoute } from 'next';
import { getAllCastleParams, getPublishedCastles, getAllCountrySlugs } from '@/lib/castles';
import { getAllRoutes } from '@/lib/routes';
import { getAllTourParams, getAllTourCountrySlugs } from '@/lib/tours';
import { getAllHotelCountrySlugs } from '@/lib/hotel-directory';
import { getAllGuides } from '@/lib/guides';
import { getCountryBySlug } from '@/lib/countries';
import {
  getAllCastlesLastModified,
  getAllGuidesLastModified,
  getAllRoutesLastModified,
  getAllToursLastModified,
  getCastleLastModified,
  getCastlesCountryLastModified,
  getGuideLastModified,
  getRouteLastModified,
  getSiteLastModified,
  getStaticPageLastModified,
  getToursCountryLastModified,
  getTourLastModified,
} from '@/lib/lastmod';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.castles-palaces.com';

// <lastmod> is the date of the last git commit that touched the page's data file (see
// lib/lastmod.ts). Hubs take the newest date among the pages they list. A page with no known date
// simply omits <lastmod>: an honest gap is better than the build time, which would claim every
// page changed on every deploy.
const withDate = (date: string | null) => (date ? { lastModified: date } : {});

export default function sitemap(): MetadataRoute.Sitemap {
  const castleParams = getAllCastleParams();
  // A country folder without an entry in data/countries.json has no hub page (e.g. jersey: its
  // castles are listed in /castles), so its /castles/<country> URL is not part of the sitemap.
  const castleCountrySlugs = getAllCountrySlugs().filter((slug) => getCountryBySlug(slug));
  const routes = getAllRoutes();
  const guides = getAllGuides();
  const tourParams = getAllTourParams();
  const tourCountrySlugs = getAllTourCountrySlugs();
  const hotelCountrySlugs = getAllHotelCountrySlugs();

  const castleUrls: MetadataRoute.Sitemap = castleParams.map(({ country, castle }) => ({
    url: `${BASE_URL}/castles/${country}/${castle}`,
    ...withDate(getCastleLastModified(country, castle)),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const castleCountryUrls: MetadataRoute.Sitemap = castleCountrySlugs.map((slug) => ({
    url: `${BASE_URL}/castles/${slug}`,
    ...withDate(getCastlesCountryLastModified(slug)),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const tourUrls: MetadataRoute.Sitemap = tourParams.map(({ country, slug }) => ({
    url: `${BASE_URL}/tours/${country}/${slug}`,
    ...withDate(getTourLastModified(country, slug)),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const tourCountryUrls: MetadataRoute.Sitemap = tourCountrySlugs.map((slug) => ({
    url: `${BASE_URL}/tours/${slug}`,
    ...withDate(getToursCountryLastModified(slug)),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const hotelCountryUrls: MetadataRoute.Sitemap = hotelCountrySlugs.map((slug) => ({
    url: `${BASE_URL}/castle-hotels/${slug}`,
    ...withDate(getCastlesCountryLastModified(slug)),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const routeUrls: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${BASE_URL}/routes/${route.id}`,
    ...withDate(getRouteLastModified(route.id)),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const guideUrls: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${BASE_URL}/guides/${guide.id}`,
    ...withDate(getGuideLastModified(guide.id)),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, ...withDate(getSiteLastModified()), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/castles`, ...withDate(getAllCastlesLastModified()), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/castle-hotels`, ...withDate(getAllCastlesLastModified()), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/map`, ...withDate(getAllCastlesLastModified()), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/tours`, ...withDate(getAllToursLastModified()), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/routes`, ...withDate(getAllRoutesLastModified()), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/guides`, ...withDate(getAllGuidesLastModified()), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/about`, ...withDate(getStaticPageLastModified('app/about/page.tsx')), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/contact`, ...withDate(getStaticPageLastModified('app/contact/page.tsx')), changeFrequency: 'yearly', priority: 0.2 },
  ];

  return [...staticUrls, ...castleUrls, ...castleCountryUrls, ...hotelCountryUrls, ...tourUrls, ...tourCountryUrls, ...routeUrls, ...guideUrls];
}
