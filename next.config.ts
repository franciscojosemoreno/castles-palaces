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
    ];
  },
};

export default nextConfig;
