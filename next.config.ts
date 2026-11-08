import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Block crawlers from indexing Next.js internal data endpoints and static chunks
        source: '/_next/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/tours/scotland/edinburgh-holy-island-bamburgh-alnwick',
        destination: '/tours/scotland/edinburgh-holy-island-alnwick-castle',
        permanent: true,
      },
      // Discontinued GYG tours (retired, no replacement product) — redirect to the primary castle page.
      {
        source: '/tours/england/london-leeds-hever-castles-day-trip',
        destination: '/castles/england/leeds-castle',
        permanent: true,
      },
      {
        source: '/tours/germany/neuschwanstein-hohenschwangau-combined-ticket',
        destination: '/castles/germany/neuschwanstein-castle',
        permanent: true,
      },
      {
        source: '/tours/germany/stuttgart-hohenzollern-castle-day-trip',
        destination: '/castles/germany/hohenzollern-castle',
        permanent: true,
      },
      {
        source: '/tours/spain/belmez-belalcazar-cordoba-excursion',
        destination: '/castles/spain/belmez-castle',
        permanent: true,
      },
      // Old tour slug retired; the same tour_id (1363721) is already covered by this existing page.
      {
        source: '/tours/slovakia/piestany-beckov-trencin-cicmany-tour',
        destination: '/tours/slovakia/bratislava-slovakia-castles-private-tour',
        permanent: true,
      },
      // Old URLs that Google still crawls (Search Console, 8-nov-2026). They came from the tour
      // itinerary template, which built /castles/<tour country>/<stop id> for every stop.
      // statusCode 301 (instead of `permanent`, which is a 308) so they answer a literal 301.
      // Castles listed under the wrong country in the URL:
      ...(
        [
          ['england/caernarfon-castle', 'wales/caernarfon-castle'],
          ['england/conwy-castle', 'wales/conwy-castle'],
          ['austria/bratislava-castle', 'slovakia/bratislava-castle'],
          ['austria/devin-castle', 'slovakia/devin-castle'],
          ['scotland/bamburgh-castle', 'england/bamburgh-castle'],
          ['scotland/alnwick-castle', 'england/alnwick-castle'],
          // Retired ids that point at a castle page with another slug:
          ['czech-republic/cesky-krumlov-old-town', 'czech-republic/cesky-krumlov-castle'],
          ['scotland/loch-ness', 'scotland/urquhart-castle'],
          ['romania/brasov-old-town', 'romania/bran-castle'],
          ['spain/alcazar-of-toledo', 'spain/alcazar-de-toledo'],
        ] as const
      ).map(([from, to]) => ({
        source: `/castles/${from}`,
        destination: `/castles/${to}`,
        statusCode: 301,
      })),
      // Pages that never were castle pages (landscapes, towns, monuments): no matching castle
      // page exists, so they go to the country hub.
      ...(
        [
          ['scotland/glencoe-valley', 'scotland'],
          ['scotland/loch-lomond', 'scotland'],
          ['england/stonehenge', 'england'],
          ['england/bath-city', 'england'],
          ['spain/roman-aqueduct-segovia', 'spain'],
        ] as const
      ).map(([from, hub]) => ({
        source: `/castles/${from}`,
        destination: `/castles/${hub}`,
        statusCode: 301,
      })),
      // Jersey has castle pages (Mont Orgueil, Elizabeth Castle) but no country hub: they are
      // listed in the all-castles directory.
      {
        source: '/castles/jersey',
        destination: '/castles',
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
