import type { CastleHotel } from '@/types';
import { getCurrencySymbol } from '@/lib/hotels';

interface Props {
  hotel: CastleHotel;
}

const AMENITY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  bar: 'Bar',
  spa: 'Spa',
  golf: 'Golf',
  gardens: 'Gardens',
  fishing: 'Fishing',
  falconry: 'Falconry',
  farm_stay: 'Working Farm',
  self_catering: 'Self-Catering',
};

const ROOM_LOCATION_LABELS: Record<NonNullable<CastleHotel['room_location']>, string> = {
  castle: 'Rooms are within the historic castle building itself',
  annex: 'Rooms are in an adjacent annex, not the original historic structure',
  mixed: 'Rooms are split between the historic building and a newer wing',
};

export default function HotelBookingCard({ hotel }: Props) {
  const symbol = getCurrencySymbol(hotel.currency);
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5">
      <p className="text-[#c9a84c] font-medium text-xs uppercase tracking-wider mb-2">Stay Here</p>
      <h3 className="font-serif font-bold text-[#1a1a1a] text-base leading-snug mb-3">
        {hotel.hotel_name}
      </h3>
      {hotel.star_category && (
        <span className="inline-block bg-stone-100 text-stone-600 text-xs font-medium px-2 py-0.5 rounded-full mb-3">
          {hotel.star_category}-Star Hotel
        </span>
      )}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-bold text-[#1a1a1a] text-sm">
          {hotel.price_from_night != null ? `From ${symbol}${hotel.price_from_night} / night` : 'Check rates'}
        </span>
      </div>
      {hotel.room_location && (
        <p className="text-xs text-stone-500 mb-3">{ROOM_LOCATION_LABELS[hotel.room_location]}</p>
      )}
      {hotel.amenities && hotel.amenities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {hotel.amenities.map((a) => (
            <span
              key={a}
              className="bg-stone-100 text-stone-600 text-[11px] font-medium px-2 py-0.5 rounded-full"
            >
              {AMENITY_LABELS[a] ?? a}
            </span>
          ))}
        </div>
      )}
      <a
        href={hotel.booking_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block w-full bg-[#1761a0] text-white text-sm font-semibold text-center py-2.5 rounded-md hover:bg-[#125489] transition-colors mb-2"
      >
        Book Your Stay →
      </a>
      <p className="text-xs text-stone-400 text-center">
        Booked via Booking.com · Free cancellation on most rates
      </p>
      {hotel.visitable_by_public && (
        <p className="text-xs text-stone-500 text-center mt-3 pt-3 border-t border-stone-100">
          {hotel.non_guest_access_note ?? 'Open to day visitors without booking a room — see How to Stay below.'}
        </p>
      )}
      {!hotel.visitable_by_public && hotel.non_guest_access_note && (
        <p className="text-xs text-stone-500 text-center mt-3 pt-3 border-t border-stone-100">
          {hotel.non_guest_access_note}
        </p>
      )}
    </div>
  );
}
