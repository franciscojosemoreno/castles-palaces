import { Castle } from '@/types';
import { getGYGSearchUrl } from '@/lib/gyg';
import { getPrimaryCta, isHotelOnly, getCurrencySymbol } from '@/lib/hotels';
import { getEntryPrice } from '@/lib/entry-price';

interface CastleQuickFactsProps {
  castle: Castle;
}

function getGYGUrl(castle: Castle): string {
  return castle.gyg_featured_tours?.[0]?.booking_url_override ?? getGYGSearchUrl(castle.name);
}

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const DAY_ABBR: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

/** Derives a compact one-line hours string from the Mon–Sun day fields. */
function formatHoursShort(oh: Castle['opening_hours']): string {
  if (!oh) return 'Check official website';

  const allVals = DAYS.map(d => oh[d]).filter(Boolean) as string[];
  if (allVals.length === 0) return 'Check official website';

  // All 7 days identical and a real HH:MM time range → "Daily HH:MM–HH:MM".
  // A "Daily" prefix only reads correctly in front of an actual time range —
  // every non-"Closed" day value in the dataset that isn't a time range (e.g.
  // "By appointment", "Open access (ruins)") falls through to the grouping
  // logic below instead, which renders it as "Mon–Sun <text>".
  if (allVals.length === 7 && new Set(allVals).size === 1 && allVals[0].toLowerCase() !== 'closed' && /\d{1,2}:\d{2}/.test(allVals[0])) {
    return `Daily ${allVals[0]}`;
  }

  // Group consecutive days with same value
  const dayHours = DAYS.map(d => ({ abbr: DAY_ABBR[d], h: oh[d] })).filter(x => x.h) as { abbr: string; h: string }[];
  const groups: { days: string[]; h: string }[] = [];
  for (const { abbr, h } of dayHours) {
    const last = groups[groups.length - 1];
    if (last && last.h === h) last.days.push(abbr);
    else groups.push({ days: [abbr], h });
  }

  const openParts: string[] = [];
  const closedParts: string[] = [];
  for (const { days, h } of groups) {
    const label = days.length === 1 ? days[0]
      : days.length === 2 ? `${days[0]} & ${days[1]}`
      : `${days[0]}–${days[days.length - 1]}`;
    if (h.toLowerCase() === 'closed') closedParts.push(label);
    else openParts.push(`${label} ${h}`);
  }

  const parts = [...openParts];
  if (closedParts.length) {
    parts.push(`Closed ${closedParts.join(', ')}`);
  }

  return parts.join('. ') || 'Check official website';
}

export default function CastleQuickFacts({ castle }: CastleQuickFactsProps) {
  const hotelOnly = isHotelOnly(castle);
  const primaryCta = getPrimaryCta(castle);
  const entryPrice = getEntryPrice(castle);

  const facts = [
    castle.opening_hours && {
      icon: '🕐',
      label: 'Hours',
      value: formatHoursShort(castle.opening_hours),
    },
    hotelOnly && {
      icon: '🏨',
      label: 'Rooms from',
      value: castle.hotel!.price_from_night != null
        ? `${getCurrencySymbol(castle.hotel!.currency)}${castle.hotel!.price_from_night} / night`
        : 'Check rates',
      // Not a live link while the booking listing is paused — same rule the primary CTA already follows.
      href: castle.hotel!.booking_paused ? undefined : castle.hotel!.booking_url,
    },
    // The entry price row — "Entry from", "Guided tour from", "Day-visit entry" … — comes from getEntryPrice
    // (lib/entry-price.js), the same function that writes the price shown in the ⌘K search.
    entryPrice && {
      icon: '🎟️',
      label: entryPrice.label,
      value: entryPrice.value,
      // When the value is this castle's own real price (not the pass), don't link it to
      // the pass's booking page — only the "Get Tickets & Tours" CTA below does that.
      // A hotel-only castle's day-visit price has no tour to link to.
      href: hotelOnly || (castle.gyg_featured_tours?.[0]?.multi_site_pass && castle.price_adult != null)
        ? undefined
        : getGYGUrl(castle) ?? undefined,
    },
    castle.hotel?.star_category && {
      icon: '🏨',
      label: 'Hotel rating',
      value: `${'★'.repeat(castle.hotel.star_category)} ${castle.hotel.star_category}-Star Hotel`,
    },
    castle.visit_duration && {
      icon: '⏱',
      label: 'Duration',
      value: castle.visit_duration,
    },
    castle.best_season && {
      icon: '🌤',
      label: 'Best time',
      // Strip editorial commentary after em-dash, en-dash, semicolon, or opening paren
      value: castle.best_season.split(/\s*[—–;(]/)[0].trim(),
    },
    castle.booking_required && {
      icon: '📅',
      label: 'Booking',
      value: `Required${castle.booking_advance_days ? ` — book ${castle.booking_advance_days}+ days ahead` : ''}`,
    },
    castle.nearest_city && {
      icon: '🚂',
      label: 'Nearest city',
      value: castle.nearest_city,
    },
  ].filter(Boolean) as { icon: string; label: string; value: string; href?: string }[];

  return (
    <div className="bg-[#f5f0e8] rounded-lg p-5 border border-stone-200">
      <h2 className="font-serif font-bold text-[#1761a0] text-lg mb-4">Quick Facts</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {facts.map((fact) => (
          <div key={fact.label} className="flex gap-3 items-start min-w-0">
            <span className="text-lg flex-shrink-0 mt-0.5">{fact.icon}</span>
            <div className="min-w-0 flex-1">
              <dt className="text-xs text-stone-500 uppercase tracking-wider">{fact.label}</dt>
              <dd className="text-sm font-medium mt-0.5 leading-snug break-words">
                {fact.href ? (
                  <a
                    href={fact.href}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="text-[#1761a0] hover:underline"
                  >
                    {fact.value}
                  </a>
                ) : (
                  <span className="text-[#1a1a1a]">{fact.value}</span>
                )}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      {primaryCta.disabled ? (
        <span
          className="mt-5 w-full flex items-center justify-center gap-2 bg-stone-200 text-stone-500 text-sm font-semibold py-2.5 px-4 rounded-md cursor-not-allowed"
          aria-disabled="true"
        >
          {primaryCta.label}
        </span>
      ) : (
        <a
          href={primaryCta.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-5 w-full flex items-center justify-center gap-2 bg-[#1761a0] text-white text-sm font-semibold py-2.5 px-4 rounded-md hover:bg-[#1761a0]/90 transition-colors"
        >
          {primaryCta.label}
        </a>
      )}
    </div>
  );
}
