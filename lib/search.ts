// Ranking for the ⌘K search (components/search/SearchModal.tsx). Self-contained on purpose (no imports), so
// it can be tested directly with `node lib/search.test.mjs`.
//
// Order of results, best first:
//   1. the castle name STARTS with the query            ("edin"     -> Edinburgh Castle)
//   2. the query is INSIDE the name                      ("chambord" -> Château de Chambord)
//   3. the query starts a word of the region or country  ("deeside"  -> castles in Royal Deeside)
//   4. fuzzy matches (typos, other languages), ONLY when the three tiers above give fewer than 5 results
// Inside a tier: featured castles first (name matches inside a word come after those at a word start), then A–Z.

export interface SearchableEntry {
  name: string;
  country: string;
  region: string | null;
  featured: boolean;
}

export interface NormalizedEntry extends SearchableEntry {
  _name: string;
  _country: string;
  _region: string;
}

export const MIN_QUERY_LENGTH = 2;
export const MAX_RESULTS = 8;
/** Fuzzy matching is only added when the exact tiers return fewer results than this. */
export const FUZZY_ONLY_BELOW = 5;

/** Lower case, no accents, hyphens as spaces, apostrophes dropped ("Master's" ~ "masters"), single spaces. */
export function normalizeSearchText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Region texts are partly descriptive ("1 mile west of Saffron Walden, 15 miles south of Cambridge"); distance
// words must not make "mil" find a castle because of "mile".
const DISTANCE_WORDS = new Set(['mile', 'miles', 'km', 'kms', 'kilometre', 'kilometres', 'kilometer', 'kilometers', 'minute', 'minutes', 'mins', 'hour', 'hours']);
const withoutDistanceWords = (text: string) => text.split(' ').filter((w) => !DISTANCE_WORDS.has(w)).join(' ');

export function normalizeEntries<T extends SearchableEntry>(entries: T[]): Array<T & NormalizedEntry> {
  return entries.map((e) => ({
    ...e,
    _name: normalizeSearchText(e.name),
    _country: normalizeSearchText(e.country),
    _region: withoutDistanceWords(normalizeSearchText(e.region ?? '')),
  }));
}

const startsAWord = (haystack: string, q: string) => haystack.startsWith(q) || haystack.includes(` ${q}`);
const featuredThenName = (a: NormalizedEntry, b: NormalizedEntry) =>
  Number(b.featured) - Number(a.featured) || a._name.localeCompare(b._name);

/**
 * @param entries   normalised search entries (normalizeEntries)
 * @param rawQuery  what the user typed
 * @param fuzzy     fuzzy search over the same entries, given the normalised query (the modal passes Fuse.js)
 */
export function rankSearch<T extends NormalizedEntry>(entries: T[], rawQuery: string, fuzzy: (normalizedQuery: string) => T[]): T[] {
  const q = normalizeSearchText(rawQuery);
  if (q.length < MIN_QUERY_LENGTH) return [];

  const starts: T[] = [];
  const inside: T[] = [];
  const place: T[] = [];
  for (const e of entries) {
    if (e._name.startsWith(q)) starts.push(e);
    else if (e._name.includes(q)) inside.push(e);
    else if (startsAWord(e._region, q) || startsAWord(e._country, q)) place.push(e);
  }
  starts.sort(featuredThenName);
  inside.sort((a, b) => Number(startsAWord(b._name, q)) - Number(startsAWord(a._name, q)) || featuredThenName(a, b));
  place.sort(featuredThenName);

  const results = [...starts, ...inside, ...place];
  if (results.length < FUZZY_ONLY_BELOW) {
    const seen = new Set<T>(results);
    for (const e of fuzzy(q)) {
      if (!seen.has(e)) {
        seen.add(e);
        results.push(e);
      }
    }
  }
  return results.slice(0, MAX_RESULTS);
}
