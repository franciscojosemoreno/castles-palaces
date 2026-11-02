export function getGYGSearchUrl(name: string): string {
  const partnerId = process.env.NEXT_PUBLIC_GYG_PARTNER_ID ?? '';
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(name)}&searchSource=3&src=search_bar&partner_id=${partnerId}`;
}

// Adds our affiliate tracking params to a stored GYG URL, but only the ones
// it doesn't already carry — some tour JSON files already include partner_id
// and/or utm_medium, and blindly appending would duplicate them.
export function addGYGTrackingParams(url: string): string {
  const partnerId = process.env.NEXT_PUBLIC_GYG_PARTNER_ID;
  if (!partnerId) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('partner_id')) {
      parsed.searchParams.set('partner_id', partnerId);
    }
    if (!parsed.searchParams.has('utm_medium')) {
      parsed.searchParams.set('utm_medium', 'online_publisher');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
