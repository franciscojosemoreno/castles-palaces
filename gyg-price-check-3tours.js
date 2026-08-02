/**
 * Paste into Chrome DevTools console while on any getyourguide.com page.
 * Fetches EUR price, rating, and reviews for 3 tours needed for Ojcow, Grand Ducal, Kreuzenstein.
 * Results print to console — copy and send to Claude Code.
 */
const TOURS = [
  { id: '1240321', slug: 'ojcow-castle', url: 'https://www.getyourguide.com/krakow-l40/krakow-ojcow-national-park-castles-hidden-gems-tour-t1240321/' },
  { id: '1351380', slug: 'grand-ducal-palace', url: 'https://www.getyourguide.com/luxembourg-l430/luxembourg-power-palaces-royal-secrets-walking-tour-t1351380/' },
  { id: '860342',  slug: 'kreuzenstein-castle', url: 'https://www.getyourguide.com/vienna-l7/vienna-day-trip-castles-around-vienna-underground-lake-t860342/' },
];

async function getPrice(tour) {
  try {
    const html = await fetch(tour.url + '?currency=EUR').then(r => r.text());

    // Method 1: og:price:amount (most reliable, SSR'd)
    const ogPrice = html.match(/property="og:price:amount"\s+content="([0-9.]+)"/)?.[1]
      || html.match(/og:price:amount.*?content="([0-9.]+)"/)?.[1];

    // Method 2: __NEXT_DATA__ fromPrice
    let nextPrice = null;
    const nd = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (nd) {
      const parsed = JSON.parse(nd);
      const str = JSON.stringify(parsed);
      const m = str.match(/"fromPrice":([0-9.]+)/);
      nextPrice = m ? m[1] : null;
    }

    // Rating / reviews from __NEXT_DATA__ or inline JSON
    let rating = null, reviews = null;
    if (nd) {
      const str = JSON.stringify(JSON.parse(nd));
      rating  = str.match(/"rating":([0-9.]+)/)?.[1];
      reviews = str.match(/"reviewsCount":(\d+)/)?.[1]
        || str.match(/"numberOfReviews":(\d+)/)?.[1];
    }

    return {
      slug:    tour.slug,
      tour_id: tour.id,
      price:   ogPrice || nextPrice || 'NOT_FOUND',
      method:  ogPrice ? 'og:price' : nextPrice ? 'next-data' : 'none',
      rating:  rating ? parseFloat(rating) : null,
      reviews: reviews ? parseInt(reviews) : null,
    };
  } catch (e) {
    return { slug: tour.slug, tour_id: tour.id, error: e.message };
  }
}

(async () => {
  console.log('Fetching prices for 3 tours...');
  const results = await Promise.all(TOURS.map(getPrice));
  console.log('\n=== RESULTS — copy this to Claude Code ===');
  console.log(JSON.stringify(results, null, 2));
  results.forEach(r => {
    if (r.error) console.warn(`❌ ${r.slug}: ${r.error}`);
    else console.log(`✓ ${r.slug}  t${r.tour_id}  €${r.price} [${r.method}]  ${r.rating}★/${r.reviews} reviews`);
  });
})();
