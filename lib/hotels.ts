import type { Castle, CastleHotel } from '@/types';
import { getGYGSearchUrl } from '@/lib/gyg';

/**
 * Primary CTA priority for a castle's main booking button:
 * GYG tour (Visit) > hotel booking (Stay) > GYG search fallback.
 * Estado B (both visit + hotel) still resolves "Visit" here — the
 * separate HotelBookingCard carries the "Stay" CTA alongside it.
 */
export function getPrimaryCta(castle: Castle): { label: string; href: string; disabled?: boolean } {
  const tour = castle.gyg_featured_tours?.[0];
  if (tour) {
    return { label: 'Get Tickets & Tours →', href: tour.booking_url_override ?? getGYGSearchUrl(castle.name) };
  }
  if (castle.hotel?.is_hotel) {
    if (castle.hotel.booking_paused) {
      return { label: 'Booking Temporarily Unavailable', href: castle.hotel.booking_url, disabled: true };
    }
    return { label: 'Book Your Stay →', href: castle.hotel.booking_url };
  }
  return { label: 'See Tours →', href: getGYGSearchUrl(castle.name) };
}

/** Whether this castle has no GYG visit product at all — Estado C (hotel-only). */
export function isHotelOnly(castle: Castle): boolean {
  const hasGygProduct = Boolean(castle.gyg_featured_tours?.length) || Boolean(castle.gyg_search_query);
  return Boolean(castle.hotel?.is_hotel) && !hasGygProduct;
}

/** Hotel prices are stored in their native currency (Booking.com charges in the property's local currency, not forced to EUR like GYG tours). */
export function getCurrencySymbol(currency: string): string {
  if (currency === 'GBP') return '£';
  if (currency === 'USD') return '$';
  return '€';
}

/** Short pill label for a hotel's room_location, distinct from HotelBookingCard's full descriptive sentence. */
export const ROOM_LOCATION_BADGE: Record<NonNullable<CastleHotel['room_location']>, string> = {
  castle: 'In the Castle',
  mixed: 'Mixed',
  annex: 'Annex Stay',
};

/** Compact "From €X / night" style price string for hotel listing cards, aware of price_unit. */
export function formatHotelPrice(hotel: CastleHotel): string {
  if (hotel.price_from_night == null) return 'Check rates';
  const amount = `${getCurrencySymbol(hotel.currency)}${hotel.price_from_night}`;
  if (hotel.price_unit === 'property') return `From ${amount} (whole property)`;
  if (hotel.price_unit === 'person') return `From ${amount} / person`;
  return `From ${amount} / night`;
}
