#!/usr/bin/env node
// Fase 3 — strips GYG product IDs, in-prose prices, and review/rating figures
// from visitor-facing text. Dry-run by default; pass --apply to write files.
//
// Scope: data/castles/**/*.json and data/tours/**/*.json, rendered fields only.
// Never touches gyg_featured_tours[], .note, affiliate URLs, or structured prices.
//
// Usage:
//   node scripts/clean-gyg-prose.mjs                # dry run, writes report JSON
//   node scripts/clean-gyg-prose.mjs --apply         # writes changes to disk
//   node scripts/clean-gyg-prose.mjs --apply=castles # apply only to data/castles
//   node scripts/clean-gyg-prose.mjs --apply=tours   # apply only to data/tours

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const applyArg = args.find(a => a.startsWith('--apply'));
const APPLY = !!applyArg;
const APPLY_SCOPE = applyArg && applyArg.includes('=') ? applyArg.split('=')[1] : 'all';

// Brief specifies \bt\d{5,8}\b; widened to \bt\d{3,8}\b after confirming (against
// each page's own booking_url_override) that real GYG ids as short as 3 digits
// leak into prose (t852, t7975, t437...), and that 0 false positives exist for
// 1-2 digit "tN" tokens anywhere in the dataset. Flagged in the report.
const ID_RE = /\bt\d{3,8}\b/;
const ID_RE_G = /\bt\d{3,8}\b/g;
const RATING_HINT_RE = /\d+(\.\d+)?\s*★|\d[\d,]*\s*reviews?\b|rating of \d(\.\d)?|top\s*rated/i;

// ---- known pre-existing defects (rule d), fixed as direct overrides ----
const KNOWN_DEFECT_FIXES = [
  {
    file: 'data/castles/albania/lekuresi-castle.json',
    field: 'description',
    before: 'The GYG-listed tour that visits Lëkurësi (€117 discounted from €117, 5.5 hours, live guide in English and Italian) is primarily a Butrint National Park day trip from Saranda.',
    after: 'The GYG-listed tour that visits Lëkurësi (5.5 hours, live guide in English and Italian) is primarily a Butrint National Park day trip from Saranda.',
  },
  {
    file: 'data/castles/albania/lekuresi-castle.json',
    field: 'description',
    before: 'at the edge of the Butrint lagoon lagoon);',
    after: 'at the edge of the Butrint lagoon);',
  },
  {
    // Compound sentence describing two different products' prices in one
    // clause: "£17" is the on-site guided-tour add-on (keep, non-GYG), while
    // "£148" is the same GYG day trip's price restated in GBP (its EUR price
    // is removed a few words later by the normal pipeline) — too specific a
    // shape to generalize into the segment classifier safely.
    file: 'data/castles/england/muncaster-castle.json',
    field: 'highlights',
    arrayIndex: 1,
    before: 'The guided tour (from £17, day trip from Windermere £148) — the GYG-listed day trip',
    after: 'The guided tour from £17 — the GYG-listed day trip',
  },
  // --- sentences that lost their subject/article, or their distinction
  // between two different products, once the id+price+rating parenthetical
  // was stripped. Rewritten with "A GYG guided tour…" / "A separate…" per
  // the user's explicit instruction, rather than patched with a bare "The".
  {
    file: 'data/castles/poland/royal-castle-warsaw.json',
    field: 'how_to_visit',
    before: "GYG tour t211323 (4.8★, 90 reviews, from €127) provides a licensed guide and skip-the-line access to the castle interior. Tour t411892 (4.7★, 1,678 reviews, from ~€24) is an Old Town walking tour covering the castle exterior and Castle Square",
    after: "A GYG guided tour provides a licensed guide and skip-the-line access to the castle interior. A separate walking tour covers the castle exterior and Castle Square",
  },
  {
    file: 'data/castles/scotland/palace-of-holyroodhouse.json',
    field: 'how_to_visit',
    before: "Tour t708012 combines a guided walk of Edinburgh's Harry Potter filming and inspiration locations — the Royal Mile, Greyfriars Kirkyard, Victoria Street — with palace entry. Tour t1039489 covers both Edinburgh Castle and Holyroodhouse on a single booking",
    after: "A GYG guided walk combines Edinburgh's Harry Potter filming and inspiration locations — the Royal Mile, Greyfriars Kirkyard, Victoria Street — with palace entry. A separate combined ticket covers both Edinburgh Castle and Holyroodhouse on a single booking",
  },
  {
    file: 'data/castles/italy/norman-swabian-castle-bari.json',
    field: 'how_to_visit',
    before: 'GYG tour t1063460 covers general admission.',
    after: 'The GYG tour covers general admission.',
  },
  {
    file: 'data/castles/sweden/skokloster-castle.json',
    field: 'how_to_visit',
    before: 'GYG tour t1126543 covers the guided tour, required for interior access.',
    after: 'The GYG tour covers the guided tour, required for interior access.',
  },
  {
    file: 'data/castles/switzerland/castel-grande.json',
    field: 'how_to_visit',
    before: 'GYG tour t1128427 is the entry ticket.',
    after: 'The GYG tour is the entry ticket.',
  },
  {
    file: 'data/castles/romania/mogosoaia-palace.json',
    field: 'how_to_visit',
    before: "GYG tour t1014906 is among the cheapest admission tickets in the site's inventory",
    after: "The GYG tour is among the cheapest admission tickets in the site's inventory",
  },
  {
    file: 'data/castles/germany/pillnitz-castle.json',
    field: 'faqs',
    arrayIndex: 0, // faqs[0].answer
    before: "GYG's own product description for tour t57948 explicitly states",
    after: "GYG's own product description for this tour explicitly states",
  },
  {
    file: 'data/castles/italy/le-castella-fortress.json',
    field: 'faqs',
    arrayIndex: 1, // faqs[1].answer
    before: 'The GYG listing for tour t1269839 contains an inconsistency',
    after: 'The GYG listing for this tour contains an inconsistency',
  },
  // --- Spinalonga: the GYG tour price (€38) and the derived total (€58)
  // are restated as plain prose in 4 separate fields, each a sentence away
  // from the id-bearing parenthetical the normal pipeline already cleans —
  // too far apart for the sentence-local heuristics to catch safely. The
  // independent €20 island-entry fee (non-GYG) is kept in every case.
  {
    file: 'data/castles/greece/spinalonga-island-fortress.json',
    field: 'description',
    before: 'The realistic total cost for most adult visitors is approximately €58 — €38 for the GYG tour plus €20 for island entry.',
    after: 'Most adult visitors should budget the GYG tour price plus a separate €20 for island entry.',
  },
  {
    file: 'data/castles/greece/spinalonga-island-fortress.json',
    field: 'how_to_visit',
    before: 'Total realistic cost for most adult visitors: approximately €58 (€38 GYG + €20 entry).',
    after: 'Total realistic cost for most adult visitors: the GYG tour price plus a separate €20 for island entry.',
  },
  {
    file: 'data/castles/greece/spinalonga-island-fortress.json',
    field: 'highlights',
    arrayIndex: 3,
    before: 'Budget approximately €58 total per adult (€38 GYG + €20 entry) for the complete experience.',
    after: 'Budget the GYG tour price plus a separate €20 per adult for island entry.',
  },
  {
    file: 'data/castles/greece/spinalonga-island-fortress.json',
    field: 'faqs',
    arrayIndex: 0, // faqs[0].answer
    before: 'Budget approximately €58 total per adult (€38 GYG + €20 entry).',
    after: 'Budget the GYG tour price plus a separate €20 per adult for island entry.',
  },
  // --- Kost Castle: remove the internal "⚠️" warning-emoji marker (not
  // requested by the brief's pattern list, but the same category of
  // internal-process flagging as Fase 2's "⚠️ REGLA #3 note" bullet), while
  // keeping the per-group pricing explanation itself — that IS the point of
  // the sentence, so the €599 figure stays per the explicit instruction to
  // preserve group-pricing explanations.
  {
    file: 'data/castles/czech-republic/kost-castle.json',
    field: 'highlights',
    arrayIndex: 5,
    before: 'GYG private day trip from Prague (~€599 per group of up to 2, GYG t976544) — the GYG product combines the Bohemian Paradise rock formations with Kost Castle and a restaurant lunch in a 6-hour private programme from Prague; ⚠️ the €599 price is per group of UP TO 2 people',
    after: 'GYG private day trip from Prague (per group of up to 2) — the GYG product combines the Bohemian Paradise rock formations with Kost Castle and a restaurant lunch in a 6-hour private programme from Prague; the €599 price is per group of up to 2 people',
  },
  // seasonal_note: not part of the normal field list below (see the report
  // note on opening_hours.seasonal_note actually feeding SEO structured
  // data — flagged separately, this is the one instance fixed by explicit
  // request rather than a project-wide pass).
  {
    file: 'data/castles/czech-republic/kost-castle.json',
    field: 'opening_hours_seasonal_note_DIRECT',
    before: 'The GYG private group day trip from Prague (t976544, rating: null — New Activity, no reviews, from $681.75 per group for up to 2 people, 6 hours) includes Bohemian Paradise rock formations + Kost Castle + restaurant lunch and hotel pickup. ⚠️ $681.75 is per group of up to 2 people — for a solo visitor this costs the full $681.75; for two people sharing, ~$341 each.',
    after: 'The GYG private group day trip from Prague (per group for up to 2 people, 6 hours) includes Bohemian Paradise rock formations + Kost Castle + restaurant lunch and hotel pickup. The €599 price is per group of up to 2 people — for a solo visitor this costs the full €599; for two people sharing, ~€300 each.',
  },
];

// Words that, when found immediately before a product-only parenthetical
// (one with no GYG id inside), mark it as safe GYG-product metadata to clean
// (rule b/c). Words that mark the rating/review itself as the sentence's
// topic — never auto-clean, always flag manual — take priority when both
// appear, by proximity (closest word to the parenthetical wins).
const PRODUCT_WORDS = [
  'tour', 'tours', 'trip', 'trips', 'ticket', 'tickets', 'pass', 'passes',
  'excursion', 'excursions', 'visit', 'visits', 'walk', 'walks', 'listing',
  'listings', 'activity', 'activities', 'itinerary', 'itineraries', 'circuit',
  'circuits', 'programme', 'programmes', 'program', 'programs', 'experience',
  'experiences', 'tasting', 'tastings', 'variant', 'variants', 'outing',
  'outings', 'package', 'packages', 'product', 'products', 'walking',
  'hiking', 'cruise', 'cruises', 'entry', 'entries', 'guide', 'guides',
  'hike', 'hikes', 'access', 'admission', 'booking',
];
const BLOCK_WORDS = ['rating', 'ratings', 'review', 'reviews', 'rated'];
const LOOKBACK_WINDOW = 80;

function nearestKeyword(before) {
  const seg = before.slice(-LOOKBACK_WINDOW);
  let bestPos = -1, bestKind = null;
  for (const w of PRODUCT_WORDS) {
    const re = new RegExp('\\b' + w + '\\b', 'ig');
    let m;
    while ((m = re.exec(seg))) if (m.index > bestPos) { bestPos = m.index; bestKind = 'product'; }
  }
  for (const w of BLOCK_WORDS) {
    const re = new RegExp('\\b' + w + '\\b', 'ig');
    let m;
    while ((m = re.exec(seg))) if (m.index > bestPos) { bestPos = m.index; bestKind = 'block'; }
  }
  return bestKind;
}

// ---- segment classifiers for parenthetical metadata ----
function classifySegment(seg) {
  const s = seg.trim();
  if (/^(GYG\s+)?t\d{3,8}$/.test(s)) return 'id';
  if (/^is_top_pick(:\s*(true|false))?$/i.test(s)) return 'flag';
  // prices: "€89", "from €167", "€124/person", "from ~€24", "~€45"
  if (/^(from\s+)?~?[€£][\d,]+(\.\d+)?(\s*(per\s+[a-z\s]+|\/\s*person))?$/i.test(s)) return 'price';
  // ratings/reviews: strip every recognised rating/review token (star rating
  // with or without a decimal, "TOP RATED", review counts incl. thousands
  // separators, "no reviews", "N verified reviews", "rating of N") and any
  // leftover slashes/commas/whitespace used to glue them together; if nothing
  // but those tokens was present, the whole segment is rating/review noise.
  const strippedForRating = s
    .replace(/\d+(\.\d+)?\s*★/gi, '')
    .replace(/top\s*rated/gi, '')
    .replace(/\d[\d,]*\s*reviews?\b/gi, '')
    .replace(/review\s+so\s+far/gi, '')
    .replace(/no\s+reviews?/gi, '')
    .replace(/\d+\s*verified/gi, '')
    .replace(/rating\s+of\s+\d(\.\d)?/gi, '')
    .replace(/[\/,\s]+/g, '');
  if (strippedForRating === '' && /\d|★|rated/i.test(s)) return 'rating';
  return 'keep';
}

const RULE_FOR_CLASS = { id: 'a', flag: 'a', price: 'b', rating: 'c' };

// Split on commas, but never inside a thousands-separated number (1,042).
function splitSegments(inner) {
  const PLACEHOLDER = '\u0001';
  const protected_ = inner.replace(/(\d),(\d{3})\b/g, `$1${PLACEHOLDER}$2`);
  return protected_.split(',').map(s => s.trim().replace(new RegExp(PLACEHOLDER, 'g'), ',')).filter(Boolean);
}

function splitSentences(text) {
  const parts = [];
  let last = 0;
  // allow a trailing closing quote/paren between the sentence-ending
  // punctuation and the following whitespace, e.g. "...tour price.' The..."
  const re = /([.!?]+['"’”)]?(?=\s|$))|(\n\n)/g;
  let m;
  while ((m = re.exec(text))) {
    parts.push(text.slice(last, m.index + m[0].length));
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function countDistinctIds(sentence) {
  const m = sentence.match(ID_RE_G);
  return m ? new Set(m).size : 0;
}

function cleanParenSegments(inner, changes) {
  const segs = splitSegments(inner);
  const kept = [];
  for (const seg of segs) {
    const cls = classifySegment(seg);
    if (cls === 'keep') kept.push(seg);
    else changes.push({ rule: RULE_FOR_CLASS[cls], before: seg, after: '' });
  }
  return kept;
}

function cleanSentence(sentence, ctx) {
  const changes = [];
  const manual = [];
  const distinctIds = countDistinctIds(sentence);

  if (distinctIds >= 2) {
    manual.push({ ...ctx, reason: 'multiple distinct GYG product IDs in one sentence', snippet: sentence.trim() });
    return { text: sentence, changes, manual };
  }

  let out = sentence;

  // Step 1: parens that directly contain an id or an is_top_pick flag.
  out = out.replace(/\(([^()]*)\)/g, (whole, inner) => {
    if (!ID_RE.test(inner) && !/is_top_pick/i.test(inner)) return whole;
    const kept = cleanParenSegments(inner, changes);
    if (kept.length === 0) return '\u0000EMPTY\u0000';
    return '(' + kept.join(', ') + ')';
  });
  out = out.replace(/\s?\u0000EMPTY\u0000/g, '');

  // Step 2: any remaining bare id, optionally followed by a parenthetical with
  // no id inside (same-sentence metadata attached to the product mention).
  if (ID_RE.test(out)) {
    out = out.replace(/\bt\d{3,8}\b(\s*)(\(([^()]*)\))?/, (whole, _sp, parenWhole, inner) => {
      changes.push({ rule: 'a', before: whole.match(ID_RE)[0], after: '' });
      if (!parenWhole) return '';
      const kept = cleanParenSegments(inner, changes);
      if (kept.length === 0) return '';
      return ' (' + kept.join(', ') + ')';
    });
  }

  // Step 3: parenthetical rating/price blocks with NO id anywhere in the
  // sentence — classify by the nearest preceding keyword. Product-attached
  // ones are cleaned automatically; everything else is flagged manual. A
  // price-only parenthetical (no star/review signal) is only eligible when
  // the sentence itself mentions "GYG" literally — otherwise an unrelated
  // walk-up/transport price sitting after an ordinary noun would wrongly
  // get swept into the manual-review pile. Rare compound sentences that
  // genuinely describe two different products' prices in one clause (seen
  // once, Muncaster Castle) are handled as a direct KNOWN_DEFECT_FIXES
  // override instead of trying to generalize this heuristic further.
  const sentenceMentionsGYG = /\bGYG\b/i.test(sentence);
  const priceOnlyRe = /[€£][\d,]+(\.\d+)?/;
  out = out.replace(/\(([^()]*)\)/g, (whole, inner, offset) => {
    const before = out.slice(0, offset);
    const isRating = RATING_HINT_RE.test(inner);
    const isPriceOnly = !isRating && sentenceMentionsGYG && priceOnlyRe.test(inner);
    if (!isRating && !isPriceOnly) return whole;
    const kind = nearestKeyword(before);
    if (kind !== 'product') {
      // only flag manual for rating figures — a price-only paren that isn't
      // clearly product-attached is more likely an unrelated walk-up/transport
      // price than a hidden GYG figure, so it's left alone rather than noised
      // into the manual-review pile.
      if (isRating) {
        manual.push({ ...ctx, reason: 'standalone rating/review figure outside GYG-ID metadata — may be the point of the sentence', snippet: sentence.trim() });
      }
      return whole;
    }
    const kept = cleanParenSegments(inner, changes);
    if (kept.length === 0) return '\u0000EMPTY\u0000';
    return '(' + kept.join(', ') + ')';
  });
  out = out.replace(/\s?\u0000EMPTY\u0000/g, '');

  // Step 4: any remaining bare rating/review figures with no parens at all.
  // Always conservative: flag manual, never auto-remove free-floating figures.
  if (RATING_HINT_RE.test(out) && !manual.length) {
    manual.push({ ...ctx, reason: 'bare rating/review figure outside parentheses — may be the point of the sentence', snippet: sentence.trim() });
  }

  // Step 5: any remaining bare id tokens (no attached parens at all) — strip.
  out = out.replace(ID_RE_G, (m) => {
    changes.push({ rule: 'a', before: m, after: '' });
    return '';
  });

  // whitespace / punctuation cleanup from removals.
  out = out.replace(/[ ]{2,}/g, ' ');
  out = out.replace(/\(\s*\)/g, '');
  out = out.replace(/\s+([.,;:!?])/g, '$1');
  out = out.replace(/,\s*\)/g, ')');
  out = out.replace(/\(\s*,/g, '(');
  out = out.replace(/,\s*,/g, ',');

  return { text: out, changes, manual };
}

function cleanField(text, ctx) {
  if (!text || (!ID_RE.test(text) && !RATING_HINT_RE.test(text) && !/is_top_pick/i.test(text))) {
    return { text, changes: [], manual: [] };
  }
  const sentences = splitSentences(text);
  const allChanges = [];
  const allManual = [];
  const rebuilt = sentences.map(s => {
    if (!ID_RE.test(s) && !RATING_HINT_RE.test(s) && !/is_top_pick/i.test(s)) return s;
    const { text: cleaned, changes, manual } = cleanSentence(s, ctx);
    allChanges.push(...changes);
    allManual.push(...manual);
    return cleaned;
  }).join('');
  return { text: rebuilt, changes: allChanges, manual: allManual };
}

// ---- field extraction ----
function castleFields(d) {
  const out = [];
  for (const k of ['description', 'history', 'how_to_visit', 'architectural_style', 'meta_description']) {
    if (typeof d[k] === 'string') out.push([k, d[k]]);
  }
  (d.highlights || []).forEach((h, i) => { if (typeof h === 'string') out.push([`highlights[${i}]`, h]); });
  (d.faqs || []).forEach((faq, i) => {
    if (typeof faq.question === 'string') out.push([`faqs[${i}].question`, faq.question]);
    if (typeof faq.answer === 'string') out.push([`faqs[${i}].answer`, faq.answer]);
  });
  const hotel = d.hotel || {};
  if (typeof hotel.how_to_stay === 'string') out.push(['hotel.how_to_stay', hotel.how_to_stay]);
  if (typeof hotel.non_guest_access_note === 'string') out.push(['hotel.non_guest_access_note', hotel.non_guest_access_note]);
  return out;
}

function tourFields(d) {
  const out = [];
  if (typeof d.overview === 'string') out.push(['overview', d.overview]);
  const meta = d.meta || {};
  if (typeof meta.description === 'string') out.push(['meta.description', meta.description]);
  (d.highlights || []).forEach((h, i) => { if (typeof h === 'string') out.push([`highlights[${i}]`, h]); });
  (d.tips || []).forEach((t, i) => { if (typeof t === 'string') out.push([`tips[${i}]`, t]); });
  (d.faqs || []).forEach((faq, i) => {
    if (typeof faq.question === 'string') out.push([`faqs[${i}].question`, faq.question]);
    if (typeof faq.answer === 'string') out.push([`faqs[${i}].answer`, faq.answer]);
  });
  (d.itinerary || []).forEach((it, i) => {
    if (typeof it.description === 'string') out.push([`itinerary[${i}].description`, it.description]);
  });
  return out;
}

function setField(d, fieldPath, value) {
  const m = fieldPath.match(/^([a-zA-Z_]+)\[(\d+)\](?:\.(\w+))?$/);
  if (m) {
    const [, arr, idx, sub] = m;
    if (sub) d[arr][Number(idx)][sub] = value;
    else d[arr][Number(idx)] = value;
    return;
  }
  if (fieldPath.includes('.')) {
    const [a, b] = fieldPath.split('.');
    d[a][b] = value;
  } else {
    d[fieldPath] = value;
  }
}

function walkFiles(dir) {
  const out = [];
  for (const country of fs.readdirSync(dir)) {
    const countryDir = path.join(dir, country);
    if (!fs.statSync(countryDir).isDirectory()) continue;
    for (const file of fs.readdirSync(countryDir)) {
      if (file.endsWith('.json')) out.push(path.join(countryDir, file));
    }
  }
  return out;
}

function main() {
  const report = {
    counts: { a: 0, b: 0, c: 0, d: 0 },
    manual: [],
    metaOverLength: [],
    samples: [],
    residualIds: [],
    filesAffectedBefore: new Set(),
    filesAffectedAfter: new Set(),
  };

  const castleFiles = walkFiles(path.join(ROOT, 'data/castles'));
  const tourFiles = walkFiles(path.join(ROOT, 'data/tours'));

  function process(files, getter, kind) {
    for (const filePath of files) {
      const rel = path.relative(ROOT, filePath);
      const raw = fs.readFileSync(filePath, 'utf8');
      const d = JSON.parse(raw);
      let fileChanged = false;

      for (const fix of KNOWN_DEFECT_FIXES) {
        if (path.join(ROOT, fix.file) !== filePath) continue;
        const isFaq = fix.field === 'faqs';
        const isSeasonalNote = fix.field === 'opening_hours_seasonal_note_DIRECT';
        const current = isSeasonalNote ? d.opening_hours?.seasonal_note
          : fix.arrayIndex == null ? d[fix.field]
          : isFaq ? d.faqs[fix.arrayIndex].answer : d[fix.field][fix.arrayIndex];
        if (typeof current === 'string' && current.includes(fix.before)) {
          report.counts.d++;
          const fieldLabel = isSeasonalNote ? 'opening_hours.seasonal_note'
            : fix.arrayIndex == null ? fix.field
            : isFaq ? `faqs[${fix.arrayIndex}].answer` : `${fix.field}[${fix.arrayIndex}]`;
          report.samples.push({ file: rel, field: fieldLabel, before: fix.before, after: fix.after, rule: 'd' });
          const updated = current.replace(fix.before, fix.after);
          if (isSeasonalNote) d.opening_hours.seasonal_note = updated;
          else if (fix.arrayIndex == null) d[fix.field] = updated;
          else if (isFaq) d.faqs[fix.arrayIndex].answer = updated;
          else d[fix.field][fix.arrayIndex] = updated;
          fileChanged = true;
        }
      }

      const fields = getter(d);
      let hadIdOrRating = false;
      for (const [fieldPath, text] of fields) {
        if (ID_RE.test(text) || RATING_HINT_RE.test(text)) hadIdOrRating = true;
        const ctx = { file: rel, field: fieldPath };
        const { text: cleaned, changes, manual } = cleanField(text, ctx);
        if (changes.length) {
          for (const c of changes) report.counts[c.rule]++;
          report.samples.push({ file: rel, field: fieldPath, before: text, after: cleaned, rule: [...new Set(changes.map(c => c.rule))].join('') });
          fileChanged = true;
        }
        for (const mnl of manual) report.manual.push(mnl);
        if (fieldPath.includes('meta') && cleaned !== text && cleaned.length > 160) {
          report.metaOverLength.push({ file: rel, field: fieldPath, length: cleaned.length, text: cleaned });
        }
        if (changes.length) setField(d, fieldPath, cleaned);
      }
      if (hadIdOrRating) report.filesAffectedBefore.add(rel);

      if (fileChanged) {
        const scopeOk = APPLY_SCOPE === 'all' || (APPLY_SCOPE === 'castles' && kind === 'castle') || (APPLY_SCOPE === 'tours' && kind === 'tour');
        if (APPLY && scopeOk) {
          fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n');
        }
      }

      // use the already-processed in-memory object (d), never re-read from
      // disk here — in dry-run mode disk still holds the pre-cleanup text.
      const fieldsAfter = getter(d);
      for (const [fieldPath, text] of fieldsAfter) {
        if (ID_RE.test(text) || RATING_HINT_RE.test(text)) {
          report.filesAffectedAfter.add(rel);
        }
        const ids = text.match(ID_RE_G);
        if (ids) for (const id of ids) report.residualIds.push({ file: rel, field: fieldPath, id });
      }
    }
  }

  process(castleFiles, castleFields, 'castle');
  process(tourFiles, tourFields, 'tour');

  const out = {
    counts: report.counts,
    manualCount: report.manual.length,
    manual: report.manual,
    residualIdsCount: report.residualIds.length,
    residualIds: report.residualIds,
    metaOverLength: report.metaOverLength,
    filesAffectedBefore: report.filesAffectedBefore.size,
    filesAffectedAfter: report.filesAffectedAfter.size,
    filesAffectedAfterList: [...report.filesAffectedAfter],
    totalSamples: report.samples.length,
    samples: report.samples,
    apply: APPLY,
    applyScope: APPLY_SCOPE,
  };

  const outPath = path.join(ROOT, 'scripts', '.clean-gyg-prose-report.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Mode: ${APPLY ? `APPLY (scope=${APPLY_SCOPE})` : 'DRY RUN'}`);
  console.log('Counts:', report.counts);
  console.log('Manual flagged:', report.manual.length);
  console.log('Residual IDs remaining:', report.residualIds.length);
  console.log('Meta fields over 160 chars after cleanup:', report.metaOverLength.length);
  console.log('Files affected before:', report.filesAffectedBefore.size);
  console.log('Files affected after:', report.filesAffectedAfter.size);
  console.log('Full report written to', path.relative(ROOT, outPath));
}

main();
