import type { HotelCountrySummary } from '@/lib/hotel-directory';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.castles-palaces.com';

function absoluteUrl(url: string): string {
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
}

interface CastleHotelsIndexStructuredDataProps {
  countries: HotelCountrySummary[];
}

/** Structured data for the /castle-hotels landing page. */
export function CastleHotelsIndexStructuredData({ countries }: CastleHotelsIndexStructuredDataProps) {
  const pageUrl = `${BASE_URL}/castle-hotels`;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Castle Hotels', item: pageUrl },
    ],
  };

  const collectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Castle Hotels in Europe',
    description: 'Sleep inside Europe’s historic castles and palaces, country by country.',
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      name: 'Castle Hotel Destinations',
      numberOfItems: countries.length,
      itemListElement: countries.map((country, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CollectionPage',
          name: `${country.name} Castle Hotels`,
          url: `${BASE_URL}/castle-hotels/${country.slug}`,
          image: absoluteUrl(country.heroImage.url),
        },
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }} />
    </>
  );
}

interface CastleHotelsCountryStructuredDataProps {
  countrySlug: string;
  countryName: string;
  castles: { id: string; country: string; name: string; tagline: string; hero_image: { url: string } }[];
}

/** Structured data for /castle-hotels/[country] — mirrors CountryStructuredData's pattern but for the hotel listing. */
export function CastleHotelsCountryStructuredData({ countrySlug, countryName, castles }: CastleHotelsCountryStructuredDataProps) {
  const pageUrl = `${BASE_URL}/castle-hotels/${countrySlug}`;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Castle Hotels', item: `${BASE_URL}/castle-hotels` },
      { '@type': 'ListItem', position: 3, name: countryName, item: pageUrl },
    ],
  };

  const collectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${countryName} Castle Hotels`,
    description: `${castles.length} historic castles and palaces you can stay overnight in, across ${countryName}.`,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      name: `Castle Hotels in ${countryName}`,
      numberOfItems: castles.length,
      itemListElement: castles.map((castle, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'LodgingBusiness',
          name: castle.name,
          url: `${BASE_URL}/castles/${castle.country}/${castle.id}`,
          image: absoluteUrl(castle.hero_image.url),
          description: castle.tagline,
        },
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }} />
    </>
  );
}
