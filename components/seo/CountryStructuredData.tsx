import { Castle } from '@/types';

interface CountryStructuredDataProps {
  countrySlug: string;
  countryName: string;
  countryDescription: string;
  heroImageUrl: string;
  castles: Castle[];
}

export default function CountryStructuredData({
  countrySlug,
  countryName,
  countryDescription,
  heroImageUrl,
  castles,
}: CountryStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.castles-palaces.com';
  const pageUrl = `${baseUrl}/castles/${countrySlug}`;
  const absoluteHero = heroImageUrl.startsWith('http') ? heroImageUrl : `${baseUrl}${heroImageUrl}`;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Castles', item: `${baseUrl}/castles` },
      { '@type': 'ListItem', position: 3, name: `Castles in ${countryName}`, item: pageUrl },
    ],
  };

  const collectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Castles in ${countryName}: The Complete Guide`,
    description: countryDescription,
    url: pageUrl,
    image: absoluteHero,
    mainEntity: {
      '@type': 'ItemList',
      name: `Castles and Palaces in ${countryName}`,
      numberOfItems: castles.length,
      itemListElement: castles.map((castle, index) => {
        const castleUrl = `${baseUrl}/castles/${countrySlug}/${castle.id}`;
        const absoluteImage = castle.hero_image.url.startsWith('http')
          ? castle.hero_image.url
          : `${baseUrl}${castle.hero_image.url}`;
        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'TouristAttraction',
            name: castle.name,
            url: castleUrl,
            image: absoluteImage,
            description: castle.tagline,
          },
        };
      }),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }}
      />
    </>
  );
}
