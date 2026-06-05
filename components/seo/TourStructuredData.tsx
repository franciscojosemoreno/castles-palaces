interface TourStructuredDataProps {
  tour: {
    name: string;
    description?: string;
    hero_image?: { url: string; alt: string };
    price?: number;
    currency?: string;
    duration?: string;
    departure_city?: string;
    departure_country?: string;
    slug?: string;
  };
  url: string;
}

export default function TourStructuredData({ tour, url }: TourStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castlespalaces.com';
  const fullUrl = `${baseUrl}${url}`;
  const currencyCode = tour.currency ?? 'EUR';

  const absoluteImage = tour.hero_image?.url
    ? tour.hero_image.url.startsWith('http')
      ? tour.hero_image.url
      : `${baseUrl}${tour.hero_image.url}`
    : undefined;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.name,
    description: tour.description ?? '',
    url: fullUrl,
    ...(absoluteImage && { image: absoluteImage }),
    ...(tour.price && {
      offers: {
        '@type': 'Offer',
        price: tour.price,
        priceCurrency: currencyCode,
        availability: 'https://schema.org/InStock',
      },
    }),
    ...(tour.duration && { duration: tour.duration }),
    touristType: 'History enthusiast',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
