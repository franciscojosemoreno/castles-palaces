import type { Castle } from '@/types';
import { getGYGSearchUrl } from '@/lib/gyg';

/**
 * Primary CTA priority for a castle's main booking button:
 * GYG tour (Visit) > hotel booking (Stay) > GYG search fallback.
 * Estado B (both visit + hotel) still resolves "Visit" here — the
 * separate HotelBookingCard carries the "Stay" CTA alongside it.
 */
export function getPrimaryCta(castle: Castle): { label: string; href: string } {
  const tour = castle.gyg_featured_tours?.[0];
  if (tour) {
    return { label: 'Get Tickets & Tours →', href: tour.booking_url_override ?? getGYGSearchUrl(castle.name) };
  }
  if (castle.hotel?.is_hotel) {
    return { label: 'Book Your Stay →', href: castle.hotel.booking_url };
  }
  return { label: 'See Tours →', href: getGYGSearchUrl(castle.name) };
}

/** Whether this castle has no GYG visit product at all — Estado C (hotel-only). */
export function isHotelOnly(castle: Castle): boolean {
  return Boolean(castle.hotel?.is_hotel) && !castle.gyg_featured_tours?.length;
}

/** Hotel prices are stored in their native currency (Booking.com charges in the property's local currency, not forced to EUR like GYG tours). */
export function getCurrencySymbol(currency: string): string {
  if (currency === 'GBP') return '£';
  if (currency === 'USD') return '$';
  return '€';
}
