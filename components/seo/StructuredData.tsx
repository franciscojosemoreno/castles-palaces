import { Castle } from '@/types';

interface StructuredDataProps {
  castle: Castle;
  url: string;
}

const COUNTRY_CODES: Record<string, string> = {
  albania: 'AL',
  austria: 'AT',
  belgium: 'BE',
  bosnia: 'BA',
  bulgaria: 'BG',
  croatia: 'HR',
  cyprus: 'CY',
  'czech-republic': 'CZ',
  denmark: 'DK',
  england: 'GB',
  estonia: 'EE',
  finland: 'FI',
  france: 'FR',
  georgia: 'GE',
  germany: 'DE',
  greece: 'GR',
  hungary: 'HU',
  ireland: 'IE',
  italy: 'IT',
  latvia: 'LV',
  lithuania: 'LT',
  luxembourg: 'LU',
  montenegro: 'ME',
  netherlands: 'NL',
  'north-macedonia': 'MK',
  'northern-ireland': 'GB',
  norway: 'NO',
  poland: 'PL',
  portugal: 'PT',
  romania: 'RO',
  scotland: 'GB',
  serbia: 'RS',
  slovakia: 'SK',
  slovenia: 'SI',
  spain: 'ES',
  sweden: 'SE',
  switzerland: 'CH',
  turkey: 'TR',
  wales: 'GB',
};

export default function StructuredData({ castle, url }: StructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castlespalaces.com';
  const fullUrl = `${baseUrl}${url}`;
  const absoluteImage = castle.hero_image.url.startsWith('http')
    ? castle.hero_image.url
    : `${baseUrl}${castle.hero_image.url}`;

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
      addressCountry: COUNTRY_CODES[castle.country] ?? castle.country.toUpperCase().slice(0, 2),
    },
    ...(castle.price_adult !== undefined && {
      priceRange: castle.price_adult === 0 ? 'Free' : `€${castle.price_adult}`,
    }),
    ...(castle.opening_hours?.seasonal_note && {
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        description: castle.opening_hours.seasonal_note,
      },
    }),
    dateModified: castle.last_updated,
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
