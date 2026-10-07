#!/usr/bin/env node
// Fase 3c — opening_hours.seasonal_note cleanup (castles only).
//
// This field was excluded from Fase 1 (currency), Fase 2 (internal jargon)
// and Fase 3 (ids/prices/ratings) on the assumption it was never rendered.
// It turned out to feed Google's structured data (StructuredData.tsx ->
// OpeningHoursSpecification.description), so it needs the same three
// treatments combined: stale $ -> € (Fase 1 logic), internal jargon removal
// (Fase 2 logic: REGLA #, batch, pilot, New Activity, rating: null,
// confirmed per, independent GYG signals, is_top_pick), and GYG
// id/price/rating stripping (Fase 3 logic).
//
// Dry-run by default; pass --apply to write files. This script only ever
// touches data/castles/*/*.json's opening_hours.seasonal_note field.
//
// Usage:
//   node scripts/clean-seasonal-note.mjs          # dry run, writes report JSON
//   node scripts/clean-seasonal-note.mjs --apply  # writes changes to disk

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const APPLY = process.argv.includes('--apply');

// ---- direct overrides for internal verification-methodology language
// found while sweeping this field by hand: "confirmed ✓ in the GYG
// Includes list", "GYG ✗ confirmed", "independent corroborating signals"
// — all explain HOW an editor verified a fact against GYG's own listing
// structure, not something a visitor needs. The underlying fact (what's
// included/excluded) is kept; only the methodology citation is dropped.
const JARGON_OVERRIDES = [
  { file: 'data/castles/albania/himara-castle.json',
    before: " — two independent corroborating signals: 'Reserved entry tickets' named in the GYG Includes list AND 'Skip the ticket line' listed as a separate feature tag on the product page.",
    after: '.' },
  { file: 'data/castles/cyprus/larnaca-castle.json',
    before: ' — entrance fees confirmed ✓ in the GYG Includes list.',
    after: '.' },
  { file: 'data/castles/georgia/khertvisi-fortress.json',
    before: " ('✓ Visit to Khertvisi Fortress' in the GYG Includes list) but explicitly excludes the entrance fee ('✗ Entrance fee to Khertvisi: 10 GEL').",
    after: ' but explicitly excludes the entrance fee.' },
  { file: 'data/castles/belgium/chateau-de-freyr.json',
    before: 'it includes a confirmed visit to Château de Freÿr (✓ in GYG Includes list) alongside',
    after: 'it includes a visit to Château de Freÿr alongside' },
  { file: 'data/castles/romania/neamt-citadel.json',
    before: "includes Neamț Citadel entrance tickets (✓ confirmed in GYG Includes list: 'Guided tour of Neamț Citadel' and 'Tickets') alongside",
    after: 'includes Neamț Citadel entrance tickets alongside' },
  { file: 'data/castles/malta/inquisitors-palace.json',
    before: "includes Inquisitor's Palace entrance as confirmed in the Includes list (GYG ✓) and in the itinerary text ('entrance ticket included').",
    after: "includes Inquisitor's Palace entrance." },
  { file: 'data/castles/sweden/hallwyl-palace.json',
    before: "provides direct access to the Hallwyl Museum — entrance confirmed ✓ (Access to the Hallwyl Museum, View of the von Hallwyl family's collection and home). Note: audio guide and guided tours are ✗ NOT included",
    after: "provides direct access to the Hallwyl Museum. Note: audio guide and guided tours are not included" },
  { file: 'data/castles/georgia/sighnaghi-fortress.json',
    before: "('climb the fortress wall, and visit one of the towers' — confirmed in the tour description). The tour's 'Entrance fees' ✓ line refers to",
    after: "(climbing the fortress wall and visiting one of the towers). The tour's entrance fees refer to" },
  { file: 'data/castles/georgia/gremi-citadel.json',
    before: "is a full-day private tour that includes Gremi among its confirmed stops — entrance fees ✓ included (GYG confirms: 'Entrance fees for Twins Winery Museum, Gremi and the Tsinandali Museum'). The tour also visits",
    after: 'is a full-day private tour that includes Gremi among its stops, with entrance fees included. The tour also visits' },
  { file: 'data/castles/isle-of-man/peel-castle.json',
    before: 'includes Peel Castle admission (✓) as one of several stops',
    after: 'includes Peel Castle admission as one of several stops' },
  { file: 'data/castles/isle-of-man/peel-castle.json',
    before: 'also includes Peel Castle and Castle Rushen entry (both ✓) — see',
    after: 'also includes Peel Castle and Castle Rushen entry — see' },
  { file: 'data/castles/luxembourg/ansembourg-castle.json',
    before: 'entrance fees are explicitly excluded from the tour price (GYG ✗ confirmed).',
    after: 'entrance fees are explicitly excluded from the tour price.' },
  // --- the 3 manually-flagged sentences from the Fase 3c dry-run, resolved
  // by hand per explicit instruction rather than left for a future pass.
  { file: 'data/castles/belgium/chateau-de-freyr.json',
    before: 'the tour operator has received mixed reviews (2.2★ from 4 reviews) —',
    after: 'the tour operator has received mixed reviews —' },
  { file: 'data/castles/latvia/rundale-palace.json',
    before: 'Rated 5.0 across 3 reviews (Top Rated).',
    after: 'Top Rated on GYG.' },
  { file: 'data/castles/spain/ulldecona-castle.json',
    before: 'The GYG tour (t813736, rating: null — only 1 review, per site REGLA #3) covers',
    after: 'The GYG tour covers' },
  { file: 'data/castles/spain/ulldecona-castle.json',
    before: '(~9h, 6 hours, from Ulldecona)',
    after: '(6 hours, from Ulldecona)' },
];

const ID_RE = /\bt\d{3,8}\b/;
const ID_RE_G = /\bt\d{3,8}\b/g;
const RATING_HINT_RE = /\d+(\.\d+)?\s*★|\d[\d,]*\s*reviews?\b|rating of \d(\.\d)?|top\s*rated/i;
// \d{1,3}(,\d{3})* requires a comma to be a true thousands separator (always
// followed by exactly 3 digits) — a bare /[\d,]+/ would also swallow a
// sentence comma that happens to follow the number (e.g. "$79, 4.9★").
const DOLLAR_RE = /\$\d{1,3}(,\d{3})*(\.\d+)?/;
const DOLLAR_RE_G = /\$\d{1,3}(,\d{3})*(\.\d+)?/g;

// ---- Fase 2 jargon tokens (REGLA, batch, pilot, status labels) ----
// No leading ",?\s*" here: a comma right before the jargon phrase is almost
// always the separator for whatever came before it (e.g. "t813736, rating:
// null"), not part of the phrase itself. Eating it glued the previous
// segment straight onto the next one. A dedicated cleanup pass below mops
// up the double-commas/dash-comma artifacts this leaves behind instead.
const JARGON_PATTERNS = [
  [/rating:\s*null\s*(—|-)?\s*/gi, ''],
  [/New Activity\s*(—|-)?\s*/gi, ''],
  [/new activity\s*(—|-)?\s*/gi, ''],
  [/no reviews(\s+yet)?\s*/gi, ''],
  [/per site (REGLA\s*#\d+|policy)\s*/gi, ''],
  [/REGLA\s*#\d+\s*/gi, ''],
  [/confirmed per GYG listing requirements\s*/gi, ''],
  [/is_top_pick(:\s*(true|false))?\s*/gi, ''],
  [/⚠️\s*/g, ''],
];

function cleanupJargonArtifacts(text) {
  let out = text;
  out = out.replace(/,\s*,/g, ',');
  out = out.replace(/\(\s*,/g, '(');
  out = out.replace(/,\s*\)/g, ')');
  out = out.replace(/—\s*,/g, ',');
  out = out.replace(/,\s*—/g, ',');
  out = out.replace(/—\s*\)/g, ')');
  out = out.replace(/\(\s*—/g, '(');
  out = out.replace(/[ ]{2,}/g, ' ');
  out = out.replace(/\(\s*\)/g, '');
  return out;
}

function applyJargon(text) {
  let out = text;
  for (const [pat, repl] of JARGON_PATTERNS) out = out.replace(pat, repl);
  out = cleanupJargonArtifacts(out);
  return out;
}

// ---- price currency fix: stale $ figures restated as the castle's own
// structured EUR price (same ratio-based logic as Fase 1). Only convert a
// $ figure when it sits in the same sentence as the matching tour's own id
// — a page can mention a second, different GYG product (e.g. a "Prestige
// Tasting" variant) with its own unrelated $ price, and blindly reusing the
// one structured price for every $ in the whole field would silently
// relabel that other product's price as the wrong number.
function fixDollar(text, structuredPrice, tourId) {
  if (!structuredPrice) return { text, changed: false, flagged: DOLLAR_RE.test(text) };
  let changed = false;
  let flagged = false;
  const idToken = tourId ? `t${tourId}` : null;
  // Split on semicolons too, finer-grained than the main pipeline's
  // splitSentences: a single run-on sentence can still name two different
  // products in two different clauses (e.g. "...a higher-tier variant; this
  // page covers the standard tour (tNNNNNN)."), and the id only belongs to
  // its own clause. Built like splitSentences (scan + slice) rather than
  // String.split so every character, including whitespace, is preserved.
  const clauses = [];
  { let last = 0; const re = /[.!?;]+['"’”)]?(?=\s|$)|\n\n/g; let m;
    while ((m = re.exec(text))) { clauses.push(text.slice(last, m.index + m[0].length)); last = m.index + m[0].length; }
    if (last < text.length) clauses.push(text.slice(last)); }
  const out = clauses.map(clause => {
    if (!DOLLAR_RE.test(clause)) return clause;
    const sameClauseHasId = idToken && clause.includes(idToken);
    return clause.replace(DOLLAR_RE_G, (m) => {
      const usd = parseFloat(m.slice(1).replace(/,/g, ''));
      const ratio = usd / structuredPrice;
      if (sameClauseHasId && ratio >= 0.6 && ratio <= 1.6) {
        changed = true;
        return `€${structuredPrice}`;
      }
      flagged = true;
      return m;
    });
  }).join('');
  return { text: out, changed, flagged };
}

const PRODUCT_WORDS = [
  'tour', 'tours', 'trip', 'trips', 'ticket', 'tickets', 'pass', 'passes',
  'excursion', 'excursions', 'visit', 'visits', 'walk', 'walks', 'listing',
  'listings', 'activity', 'activities', 'itinerary', 'itineraries', 'circuit',
  'circuits', 'programme', 'programmes', 'program', 'programs', 'experience',
  'experiences', 'tasting', 'tastings', 'variant', 'variants', 'outing',
  'outings', 'package', 'packages', 'product', 'products', 'walking',
  'hiking', 'cruise', 'cruises', 'entry', 'entries', 'guide', 'guides',
  'hike', 'hikes', 'access', 'admission', 'booking', 'bundle', 'pickup',
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

function classifySegment(seg) {
  const s = seg.trim();
  if (/^(GYG\s+)?t\d{3,8}$/.test(s)) return 'id';
  if (/^is_top_pick(:\s*(true|false))?$/i.test(s)) return 'flag';
  // $ included alongside €/£: any dollar figure still present at this point
  // already failed the same-clause-id safe-conversion check in fixDollar,
  // so it gets removed like any other GYG price (rule b) rather than left
  // in the text or guessed at.
  if (/^(from\s+)?~?[€£$][\d,]+(\.\d+)?(\s*(per\s+[a-z\s]+|\/\s*person))?$/i.test(s)) return 'price';
  const stripped = s
    .replace(/\d+(\.\d+)?\s*★/gi, '')
    .replace(/top\s*rated/gi, '')
    .replace(/\d[\d,]*\s*reviews?\b/gi, '')
    .replace(/review\s+so\s+far/gi, '')
    .replace(/no\s+reviews?/gi, '')
    .replace(/\d+\s*verified/gi, '')
    .replace(/rating\s+of\s+\d(\.\d)?/gi, '')
    .replace(/[\/,\s]+/g, '');
  if (stripped === '' && /\d|★|rated/i.test(s)) return 'rating';
  return 'keep';
}
const RULE_FOR_CLASS = { id: 'a', flag: 'a', price: 'b', rating: 'c' };

function splitSegments(inner) {
  const PLACEHOLDER = '\u0001';
  const protected_ = inner.replace(/(\d),(\d{3})\b/g, `$1${PLACEHOLDER}$2`);
  return protected_.split(',').map(s => s.trim().replace(new RegExp(PLACEHOLDER, 'g'), ',')).filter(Boolean);
}

function splitSentences(text) {
  const parts = [];
  let last = 0;
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

  out = out.replace(/\(([^()]*)\)/g, (whole, inner) => {
    if (!ID_RE.test(inner) && !/is_top_pick/i.test(inner)) return whole;
    const kept = cleanParenSegments(inner, changes);
    if (kept.length === 0) return '\u0000EMPTY\u0000';
    return '(' + kept.join(', ') + ')';
  });
  out = out.replace(/\s?\u0000EMPTY\u0000/g, '');

  if (ID_RE.test(out)) {
    out = out.replace(/\bt\d{3,8}\b(\s*)(\(([^()]*)\))?/, (whole, _sp, parenWhole, inner) => {
      changes.push({ rule: 'a', before: whole.match(ID_RE)[0], after: '' });
      if (!parenWhole) return '';
      const kept = cleanParenSegments(inner, changes);
      if (kept.length === 0) return '';
      return ' (' + kept.join(', ') + ')';
    });
  }

  const sentenceMentionsGYG = /\bGYG\b/i.test(sentence);
  const priceOnlyRe = /[€£$][\d,]+(\.\d+)?/;
  out = out.replace(/\(([^()]*)\)/g, (whole, inner, offset) => {
    const before = out.slice(0, offset);
    const isRating = RATING_HINT_RE.test(inner);
    const isPriceOnly = !isRating && sentenceMentionsGYG && priceOnlyRe.test(inner);
    if (!isRating && !isPriceOnly) return whole;
    const kind = nearestKeyword(before);
    if (kind !== 'product') {
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

  if (RATING_HINT_RE.test(out) && !manual.length) {
    manual.push({ ...ctx, reason: 'bare rating/review figure outside parentheses — may be the point of the sentence', snippet: sentence.trim() });
  }

  out = out.replace(ID_RE_G, (m) => {
    changes.push({ rule: 'a', before: m, after: '' });
    return '';
  });

  // any $ figure still standing at this point already failed the
  // same-clause-id safe-conversion check — strip it bare, same as rule b
  // for € / £, rather than leave it or guess at a conversion.
  out = out.replace(DOLLAR_RE_G, (m) => {
    changes.push({ rule: 'b', before: m, after: '' });
    return '';
  });

  out = out.replace(/[ ]{2,}/g, ' ');
  out = out.replace(/\(\s*\)/g, '');
  out = out.replace(/\s+([.,;:!?])/g, '$1');
  out = out.replace(/,\s*\)/g, ')');
  out = out.replace(/\(\s*,/g, '(');
  out = out.replace(/,\s*,/g, ',');

  return { text: out, changes, manual };
}

function cleanField(text, ctx) {
  if (!text || (!ID_RE.test(text) && !RATING_HINT_RE.test(text) && !/is_top_pick/i.test(text) && !DOLLAR_RE.test(text))) {
    return { text, changes: [], manual: [] };
  }
  const sentences = splitSentences(text);
  const allChanges = [];
  const allManual = [];
  const rebuilt = sentences.map(s => {
    if (!ID_RE.test(s) && !RATING_HINT_RE.test(s) && !/is_top_pick/i.test(s) && !DOLLAR_RE.test(s)) return s;
    const { text: cleaned, changes, manual } = cleanSentence(s, ctx);
    allChanges.push(...changes);
    allManual.push(...manual);
    return cleaned;
  }).join('');
  return { text: rebuilt, changes: allChanges, manual: allManual };
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
    counts: { a: 0, b: 0, c: 0, jargon: 0, dollarFixed: 0 },
    manual: [],
    dollarRemoved: [],
    samples: [],
    filesAffectedBefore: new Set(),
    filesAffectedAfter: new Set(),
  };

  // already fixed by hand in the Fase 3 manual-resolution commit (663560c) —
  // skip so this Fase 3c pass only reports on the genuinely untouched rest.
  const ALREADY_FIXED = new Set([
    'data/castles/belgium/chateau-de-bioul.json',
    'data/castles/estonia/palmse-manor.json',
    'data/castles/estonia/sagadi-manor.json',
    'data/castles/france/chateau-de-la-greffiere.json',
    'data/castles/france/chateau-du-moulin-a-vent.json',
    'data/castles/france/chateau-olivier.json',
    'data/castles/france/chateau-picque-caillou.json',
    'data/castles/germany/wurzburg-residence.json',
    'data/castles/greece/fortezza-of-rethymno.json',
    'data/castles/italy/cardaneto-castle.json',
    'data/castles/italy/castello-tricerchi.json',
    'data/castles/italy/colonna-palace.json',
    'data/castles/italy/govone-castle.json',
    'data/castles/italy/priamar-fortress.json',
    'data/castles/luxembourg/clervaux-castle.json',
    'data/castles/northern-ireland/castle-ward.json',
    'data/castles/scotland/black-watch-castle.json',
    'data/castles/spain/castell-de-tossa-de-mar.json',
    'data/castles/spain/denia-castle.json',
    'data/castles/turkey/dolmabahce-palace.json',
    'data/castles/czech-republic/kost-castle.json',
  ]);

  const castleFiles = walkFiles(path.join(ROOT, 'data/castles'))
    .filter(f => !ALREADY_FIXED.has(path.relative(ROOT, f)));

  for (const filePath of castleFiles) {
    const rel = path.relative(ROOT, filePath);
    const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const text = d.opening_hours && d.opening_hours.seasonal_note;
    if (typeof text !== 'string' || !text) continue;

    const hadIssue = ID_RE.test(text) || RATING_HINT_RE.test(text) || DOLLAR_RE.test(text)
      || /REGLA|rating:\s*null|new activity|no reviews|is_top_pick|⚠️/i.test(text);
    if (hadIssue) report.filesAffectedBefore.add(rel);
    if (!hadIssue) continue;

    let fileChanged = false;
    let current = text;

    // Step -1: hand-drafted overrides for internal verification-methodology
    // phrasing (✓/✗, "Includes list", "independent corroborating signals")
    // found while sweeping this field — see JARGON_OVERRIDES above.
    for (const ov of JARGON_OVERRIDES) {
      if (ov.file !== rel) continue;
      if (current.includes(ov.before)) {
        current = current.replace(ov.before, ov.after);
        report.counts.jargon2 = (report.counts.jargon2 || 0) + 1;
        fileChanged = true;
      }
    }

    // Step 0: jargon removal (Fase 2 style)
    const beforeJargon = current;
    current = applyJargon(current);
    if (current !== beforeJargon) {
      report.counts.jargon++;
      fileChanged = true;
    }

    // Step 0b: stale $ -> structured € (Fase 1 style)
    const tours = d.gyg_featured_tours || [];
    const structuredPrice = tours.length === 1 ? tours[0].price_from : null;
    const structuredTourId = tours.length === 1 ? tours[0].tour_id : null;
    const { text: afterDollar, changed: dollarChanged, flagged: dollarFlag } = fixDollar(current, structuredPrice, structuredTourId);
    if (dollarChanged) {
      report.counts.dollarFixed++;
      fileChanged = true;
    }
    current = afterDollar;

    // Step 1: id/price/rating cleanup (Fase 3 style). Any $ left over from
    // Step 0b (no safe same-clause id to convert against) is removed here
    // like any other price — never left in the text, never guessed at.
    const ctx = { file: rel, field: 'opening_hours.seasonal_note' };
    const { text: cleaned, changes, manual } = cleanField(current, ctx);
    if (changes.length) {
      for (const c of changes) report.counts[c.rule]++;
      fileChanged = true;
    }
    for (const c of changes) {
      if (c.before.includes('$')) report.dollarRemoved.push({ file: rel, before: c.before });
    }
    for (const m of manual) report.manual.push(m);

    if (fileChanged) {
      report.samples.push({ file: rel, field: 'opening_hours.seasonal_note', before: text, after: cleaned });
      if (APPLY) {
        d.opening_hours.seasonal_note = cleaned;
        fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n');
      }
    }

    const stillHasIssue = ID_RE.test(cleaned) || RATING_HINT_RE.test(cleaned) || DOLLAR_RE.test(cleaned)
      || /REGLA|rating:\s*null|new activity|no reviews|is_top_pick|⚠️/i.test(cleaned);
    if (stillHasIssue) report.filesAffectedAfter.add(rel);
  }

  const out = {
    counts: report.counts,
    manualCount: report.manual.length,
    manual: report.manual,
    dollarRemovedCount: report.dollarRemoved.length,
    dollarRemoved: report.dollarRemoved,
    filesAffectedBefore: report.filesAffectedBefore.size,
    filesAffectedAfter: report.filesAffectedAfter.size,
    totalSamples: report.samples.length,
    samples: report.samples,
    apply: APPLY,
  };

  fs.writeFileSync(path.join(ROOT, 'scripts', '.clean-seasonal-note-report.json'), JSON.stringify(out, null, 2));
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log('Counts:', report.counts);
  console.log('Manual flagged:', report.manual.length);
  console.log('Dollar amounts removed without conversion:', report.dollarRemoved.length);
  console.log('Files affected before:', report.filesAffectedBefore.size);
  console.log('Files affected after:', report.filesAffectedAfter.size);
}

main();
