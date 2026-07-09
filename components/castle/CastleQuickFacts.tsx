import { Castle } from '@/types';
import { getGYGSearchUrl } from '@/lib/gyg';

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

  // All 7 days identical → "Daily HH:MM–HH:MM"
  if (allVals.length === 7 && new Set(allVals).size === 1 && allVals[0].toLowerCase() !== 'closed') {
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
  const facts = [
    {
      icon: '🕐',
      label: 'Hours',
      value: formatHoursShort(castle.opening_hours),
    },
    castle.price_adult !== undefined && {
      icon: '🎟️',
      label: (() => {
        const tour = castle.gyg_featured_tours?.[0];
        if (tour?.type === 'skip_the_line') return 'Skip-the-line from';
        if (tour?.type === 'entry_ticket') return 'Entry via GYG';
        return 'Entry from';
      })(),
      value: (() => {
        const tour = castle.gyg_featured_tours?.[0];
        const useGYGPrice = tour && (tour.type === 'skip_the_line' || tour.type === 'entry_ticket') && tour.price_from;
        const price = useGYGPrice ? tour.price_from : castle.price_adult;
        return price === 0 ? 'Free' : `€${price}`;
      })(),
      href: getGYGUrl(castle) ?? undefined,
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

      {getGYGUrl(castle) && (
        <a
          href={getGYGUrl(castle)!}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-5 w-full flex items-center justify-center gap-2 bg-[#1761a0] text-white text-sm font-semibold py-2.5 px-4 rounded-md hover:bg-[#1761a0]/90 transition-colors"
        >
          Get Tickets &amp; Tours →
        </a>
      )}
    </div>
  );
}
