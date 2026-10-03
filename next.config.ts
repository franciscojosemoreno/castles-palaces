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
    ];
  },
};

export default nextConfig;
