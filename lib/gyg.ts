export function getGYGSearchUrl(name: string): string {
  const partnerId = process.env.NEXT_PUBLIC_GYG_PARTNER_ID ?? '';
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(name)}&searchSource=3&src=search_bar&partner_id=${partnerId}`;
}
