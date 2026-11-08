import { Castle } from '@/types';
import { getCurrencySymbol } from '@/lib/hotels';
import countryCodes from '@/lib/country-codes.json';
import { getCastleLastModified } from '@/lib/lastmod';

interface StructuredDataProps {
  castle: Castle;
  url: string;
}

// ISO 3166-1 alpha-2 codes keyed by the country folder in data/castles/ (single source of truth,
// shared with scripts/check-country-codes.mjs, which fails the build when a folder is missing).
// England, Scotland, Wales and Northern Ireland are "GB"; Kosovo uses the user-assigned "XK".
const COUNTRY_CODES: Record<string, string> = countryCodes;

function getCountryCode(country: string): string {
  const code = COUNTRY_CODES[country];
  if (!code) throw new Error(`Missing ISO country code for: ${country}`);
  return code;
}

export default function StructuredData({ castle, url }: StructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.castles-palaces.com';
  const fullUrl = `${baseUrl}${url}`;
  const absoluteImage = castle.hero_image.url.startsWith('http')
    ? castle.hero_image.url
    : `${baseUrl}${castle.hero_image.url}`;

  const lastModified = getCastleLastModified(castle.country, castle.id, castle.last_updated);

  const touristAttraction = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: castle.name,
    description: castle.tagline,
    url: fullUrl,
    image: absoluteImage,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: castle.lat,
      longitude: castle.lng,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: castle.address ?? '',
      addressCountry: getCountryCode(castle.country),
    },
    ...(castle.price_adult != null && {
      priceRange: castle.price_adult === 0 ? 'Free' : `${getCurrencySymbol(castle.price_currency ?? 'EUR')}${castle.price_adult}`,
    }),
    ...(castle.opening_hours?.seasonal_note && {
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        description: castle.opening_hours.seasonal_note,
      },
    }),
    // Date of the last git commit that touched this ficha (lib/lastmod.ts), not the hand-entered
    // last_updated field, so it matches the sitemap <lastmod> and the visible "Last updated" line.
    ...(lastModified && { dateModified: lastModified }),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Castles', item: `${baseUrl}/castles` },
      {
        '@type': 'ListItem',
        position: 3,
        name: castle.country.charAt(0).toUpperCase() + castle.country.slice(1).replace(/-/g, ' '),
        item: `${baseUrl}/castles/${castle.country}`,
      },
      { '@type': 'ListItem', position: 4, name: castle.name, item: fullUrl },
    ],
  };

  const schemas: object[] = [touristAttraction, breadcrumb];

  if (castle.faqs && castle.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: castle.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
