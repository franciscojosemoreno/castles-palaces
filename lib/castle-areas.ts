import { Castle } from '@/types';

// Presentation-only labels for area keys the site already knows how to name well.
// Grouping itself always comes from each castle's own `region`/`address` data —
// this map never changes which castles land in a group, only how the group reads.
const AREA_LABEL_OVERRIDES: Record<string, string> = {
  'Birgu (Vittoriosa)': 'Birgu (Vittoriosa), the Three Cities',
};

function firstSegment(value: string): string {
  return value.split(',')[0].trim();
}

/** Derives a short area label for a castle from its own `region` (falling back to
 * `address` when `region` is a generic administrative name rather than a place),
 * with an override to the island name when `region` mentions "Gozo". */
export function getCastleAreaLabel(castle: Castle): string {
  const region = castle.region ?? '';
  if (region.includes('Gozo')) return 'Gozo';

  let area = firstSegment(region);
  if (!area || area.includes('Region')) {
    area = castle.address ? firstSegment(castle.address) : area;
  }
  return AREA_LABEL_OVERRIDES[area] ?? area;
}

export interface CastleAreaGroup {
  label: string;
  castles: Castle[];
}

/** Groups castles by area label, preserving the input order both across and within groups. */
export function getCastleAreaGroups(castles: Castle[]): CastleAreaGroup[] {
  const groups: CastleAreaGroup[] = [];
  const indexByLabel = new Map<string, number>();

  for (const castle of castles) {
    const label = getCastleAreaLabel(castle);
    if (!label) continue;
    const existingIndex = indexByLabel.get(label);
    if (existingIndex === undefined) {
      indexByLabel.set(label, groups.length);
      groups.push({ label, castles: [castle] });
    } else {
      groups[existingIndex].castles.push(castle);
    }
  }
  return groups;
}
