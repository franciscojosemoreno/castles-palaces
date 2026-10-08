#!/usr/bin/env node
// Fase 4 — lint for leaked internal notes / working data in visitor-facing
// copy. Runs in `prebuild` and as `npm run lint:copy`. Exits 1 on any error-
// level finding. Never modifies data — report only.
//
// Scope: the fields actually rendered to a visitor (see FIELD SCOPE below),
// across data/castles/**/*.json and data/tours/**/*.json. Structured price/
// rating/id fields, gyg_featured_tours[].note, and any URL (affiliate or
// internal link target) are out of scope by construction — see "masking"
// below for how URLs inside prose are excluded from the content rules
// without excluding the surrounding sentence.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ALLOW_PATH = path.join(__dirname, 'lint-public-copy.allow.json');
const ALLOW = JSON.parse(fs.readFileSync(ALLOW_PATH, 'utf8'));
const ALLOWED_REVIEW_FIGURE = new Set(
  (ALLOW.reviewFigure || []).map(e => `${e.file}\u0000${e.field}\u0000${e.snippet}`)
);

const UK_LIKE_COUNTRIES = new Set(['england', 'scotland', 'wales', 'northern-ireland', 'gibraltar', 'jersey', 'isle-of-man']);

// ---------------------------------------------------------------------------
// FIELD SCOPE — only what a visitor actually sees rendered on the page.
// ---------------------------------------------------------------------------
function castleFields(d) {
  const out = [];
  const push = (field, val) => { if (typeof val === 'string' && val) out.push([field, val]); };
  push('tagline', d.tagline);
  push('description', d.description);
  push('history', d.history);
  push('how_to_visit', d.how_to_visit);
  push('architectural_style', d.architectural_style);
  push('visit_duration', d.visit_duration);
  push('meta_description', d.meta_description);
  const oh = d.opening_hours || {};
  push('opening_hours.seasonal_note', oh.seasonal_note);
  (d.highlights || []).forEach((h, i) => push(`highlights[${i}]`, h));
  (d.faqs || []).forEach((faq, i) => {
    push(`faqs[${i}].question`, faq.question);
    push(`faqs[${i}].answer`, faq.answer);
  });
  const hotel = d.hotel || {};
  push('hotel.how_to_stay', hotel.how_to_stay);
  push('hotel.non_guest_access_note', hotel.non_guest_access_note);
  if (d.hero_image) push('hero_image.alt', d.hero_image.alt);
  return out;
}

function tourFields(d) {
  const out = [];
  const push = (field, val) => { if (typeof val === 'string' && val) out.push([field, val]); };
  push('tagline', d.tagline);
  push('overview', d.overview);
  const meta = d.meta || {};
  push('meta.description', meta.description);
  (d.highlights || []).forEach((h, i) => push(`highlights[${i}]`, h));
  (d.tips || []).forEach((t, i) => push(`tips[${i}]`, t));
  (d.excluded || []).forEach((t, i) => push(`excluded[${i}]`, t));
  (d.included || []).forEach((t, i) => push(`included[${i}]`, t));
  (d.faqs || []).forEach((faq, i) => {
    push(`faqs[${i}].question`, faq.question);
    push(`faqs[${i}].answer`, faq.answer);
  });
  (d.itinerary || []).forEach((it, i) => push(`itinerary[${i}].description`, it.description));
  if (d.hero_image) push('hero_image.alt', d.hero_image.alt);
  return out;
}

// TITLE/LABEL FIELDS — short rendered titles and badges (castle/tour
// names, GYG featured-tour titles, pass labels, meta titles) are a second
// place a price, review figure, or product id can leak and go stale
// independently of the structured price_from/rating/tour_id fields.
// Scanned separately from castleFields()/tourFields(): those prose fields
// legitimately use "€" throughout (e.g. "~€6 per adult"), so running a
// price-shaped pattern there would be almost entirely false positives.
function castleTitleFields(d) {
  const out = [];
  const push = (field, val) => { if (typeof val === 'string' && val) out.push([field, val]); };
  push('name', d.name);
  push('local_name', d.local_name);
  push('built_label', d.built_label);
  push('meta_title', d.meta_title);
  if (d.hotel) push('hotel.hotel_name', d.hotel.hotel_name);
  (d.gyg_featured_tours || []).forEach((t, i) => {
    push(`gyg_featured_tours[${i}].title`, t.title);
    push(`gyg_featured_tours[${i}].pass_label`, t.pass_label);
    push(`gyg_featured_tours[${i}].pass_badge_label`, t.pass_badge_label);
  });
  return out;
}

function tourTitleFields(d) {
  const out = [];
  const push = (field, val) => { if (typeof val === 'string' && val) out.push([field, val]); };
  push('name', d.name);
  const meta = d.meta || {};
  push('meta.title', meta.title);
  return out;
}

// URL fields scanned ONLY for the gyg-locale-domain rule — never for the
// content rules (product-id/usd/review-figure/jargon/grammar), and never
// touched/rewritten by anything in this script.
function urlFields(d) {
  const out = [];
  for (const t of d.gyg_featured_tours || []) {
    if (t.booking_url_override) out.push(['gyg_featured_tours[].booking_url_override', t.booking_url_override]);
  }
  if (d.gyg_url) out.push(['gyg_url', d.gyg_url]);
  if (d.official_tickets_url) out.push(['official_tickets_url', d.official_tickets_url]);
  return out;
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

function countryOf(relPath) {
  return relPath.split('/')[2];
}

// ---------------------------------------------------------------------------
// MASKING — a markdown link "[text](url)" renders to a visitor as just the
// clickable "text", so that's what every content rule should see too: the
// brackets, parens and url are dropped entirely rather than blanked in
// place, which would otherwise leave an artifact like "Castle]( )" that the
// grammar rule misreads as empty parens. A bare https:// URL is dropped to
// a neutral placeholder word (never meant to be read as prose anyway).
// Offsets shift as a result; snippets are for a human to recognize the
// spot, not a byte-exact position, so that trade-off is fine here.
// ---------------------------------------------------------------------------
function maskLinksAndUrls(text) {
  let out = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  out = out.replace(/https?:\/\/\S+/g, 'URL');
  return out;
}

// ---------------------------------------------------------------------------
// RULES
// ---------------------------------------------------------------------------
const WORD_LIMIT = 25;
function trimWords(s, n = WORD_LIMIT) {
  const words = s.trim().split(/\s+/);
  if (words.length <= n) return words.join(' ');
  return words.slice(0, n).join(' ') + '…';
}
function contextOf(text, start, end) {
  const s = Math.max(0, start - 80);
  const e = Math.min(text.length, end + 80);
  return trimWords(text.slice(s, e).replace(/\s+/g, ' '));
}

const BEER_EXCEPTION = /first batch of a new style of beer/i;

const ERROR_RULES = [
  {
    name: 'product-id',
    pattern: /\bt\d{3,8}\b/g,
  },
  {
    name: 'usd',
    pattern: /\$\s?\d|\bUSD\b/g,
  },
  {
    name: 'review-figure',
    pattern: /\d\.\d\s*★|\d+\s+(verified\s+)?reviews?\b|rating of \d|\d\.\d\s*stars?\b/gi,
    allow: true,
  },
  {
    name: 'internal-jargon',
    pattern: /\bbatch\b|REGLA\s?#|per (the )?brief\b|site policy\b|rating:\s*null|\bnull\b|\bundefined\b|\bTBD\b|\bTODO\b|New Activity\b|no reviews yet\b|is_top_pick\b|independent (GYG )?(corroborating )?signals?\b|confirmed per\b|Includes list\b|✓|✗|⚠️/gi,
    filter(m, text) {
      if (/batch/i.test(m[0]) && BEER_EXCEPTION.test(text)) return false;
      if (m[0] === '⚠️') return 'warning-only'; // demoted, see WARNING_RULES
      return true;
    },
  },
  {
    name: 'grammar',
    pattern: /[ ]{2,}|\(\s*\)|,\s*\)|\s,|—\s*—|\.[A-Z][a-z]/g,
    filter(m, text, start) {
      // domain / abbreviation false positives for the ".[A-Z][a-z]" branch
      if (/^\.[A-Z][a-z]$/.test(m[0])) {
        const before = text.slice(Math.max(0, start - 30), start + 1);
        if (/[a-z0-9-]+\.(com|org|net|info|cat|it|de|at|es|fr|pl|cz|se|dk|fi|gr|pt|sk|si|hr|ro|md|ge|al)$/i.test(before)) return false;
        if (/\b(vs|St|Mr|Mrs|Dr|Jr|Sr|etc|approx|Ave|No|c)\.$/i.test(before)) return false;
      }
      return true;
    },
  },
];

const WARNING_RULES = [
  { name: 'warning-icon', pattern: /⚠️/g },
  { name: 'bare-gyg', pattern: /\bGYG\b/g },
  { name: 'meta-over-160', isFieldLevel: true },
  { name: 'stale-price-near-gyg', pattern: /€\d+(\.\d+)?/g, needsContext: /\bGYG\b|\btour\b/i },
];

// ---------------------------------------------------------------------------
// MAIN SCAN
// ---------------------------------------------------------------------------
function scanField(rel, field, rawText, countsErr, countsWarn, errors, warnings, falsePositives) {
  const masked = maskLinksAndUrls(rawText);

  for (const rule of ERROR_RULES) {
    if (!rule.pattern) continue;
    for (const m of masked.matchAll(rule.pattern)) {
      const fpCheck = rule.filter ? rule.filter(m, masked, m.index) : true;
      if (fpCheck === false) {
        falsePositives.push({ file: rel, field, rule: rule.name, snippet: contextOf(masked, m.index, m.index + m[0].length), reason: 'domain/abbreviation or legitimate exception' });
        continue;
      }
      if (fpCheck === 'warning-only') {
        warnings.push({ file: rel, field, rule: 'warning-icon', snippet: contextOf(rawText, m.index, m.index + m[0].length) });
        countsWarn['warning-icon'] = (countsWarn['warning-icon'] || 0) + 1;
        continue;
      }
      if (rule.name === 'review-figure' && rule.allow) {
        const snippet = contextOf(masked, m.index, m.index + m[0].length);
        const key = `${rel}\u0000${field}\u0000${m[0]}`;
        if (ALLOWED_REVIEW_FIGURE.has(key)) {
          falsePositives.push({ file: rel, field, rule: rule.name, snippet, reason: 'allow-listed in lint-public-copy.allow.json' });
          continue;
        }
      }
      errors.push({ file: rel, field, rule: rule.name, snippet: contextOf(masked, m.index, m.index + m[0].length) });
      countsErr[rule.name] = (countsErr[rule.name] || 0) + 1;
      countsErr[`${rule.name}::${countryOf(rel)}`] = (countsErr[`${rule.name}::${countryOf(rel)}`] || 0) + 1;
    }
  }

  // warnings: bare GYG acronym (counted per country, not per-match reported individually in errors table)
  for (const m of masked.matchAll(/\bGYG\b/g)) {
    warnings.push({ file: rel, field, rule: 'bare-gyg', snippet: contextOf(rawText, m.index, m.index + m[0].length) });
    countsWarn['bare-gyg'] = (countsWarn['bare-gyg'] || 0) + 1;
    countsWarn[`bare-gyg::${countryOf(rel)}`] = (countsWarn[`bare-gyg::${countryOf(rel)}`] || 0) + 1;
  }

  // warning: stale € price mentioned alongside "GYG"/"tour" in prose
  for (const m of masked.matchAll(/€\d+(\.\d+)?/g)) {
    const windowText = masked.slice(Math.max(0, m.index - 80), m.index + 80);
    if (/\bGYG\b|\btour\b/i.test(windowText)) {
      warnings.push({ file: rel, field, rule: 'stale-price-near-gyg', snippet: contextOf(masked, m.index, m.index + m[0].length) });
      countsWarn['stale-price-near-gyg'] = (countsWarn['stale-price-near-gyg'] || 0) + 1;
    }
  }

  if (field === 'meta_description' || field === 'meta.description') {
    if (rawText.length > 160) {
      warnings.push({ file: rel, field, rule: 'meta-over-160', snippet: `${rawText.length} chars` });
      countsWarn['meta-over-160'] = (countsWarn['meta-over-160'] || 0) + 1;
    }
  }
}

function scanUrlField(rel, field, url, errors, countsErr) {
  const m = url.match(/getyourguide\.(es|de|fr|it|nl|pt|pl|ru|sv|da|no|fi)\b/);
  if (m) {
    const fixed = url.replace(/getyourguide\.(es|de|fr|it|nl|pt|pl|ru|sv|da|no|fi)\b/, 'getyourguide.com');
    errors.push({ file: rel, field, rule: 'gyg-locale-domain', snippet: url, fixed });
    countsErr['gyg-locale-domain'] = (countsErr['gyg-locale-domain'] || 0) + 1;
    countsErr[`gyg-locale-domain::${countryOf(rel)}`] = (countsErr[`gyg-locale-domain::${countryOf(rel)}`] || 0) + 1;
  }
}

// A £ amount outside the UK-like countries is only a currency-consistency
// problem when it's actually a GYG/tour price quoted in the wrong
// currency — not when it's a historical construction cost or similar fact
// that happens to be denominated in pounds (e.g. "built for £500 in
// 1832"). Scoped to within 80 characters of one of those product words,
// same distance used by the stale-price-near-gyg warning.
const CURRENCY_CONTEXT_RE = /\bGYG\b|\btour\b|\bticket\b|\badmission\b|\bentry\b/i;
function scanCurrencyConsistency(rel, d, allFields, errors, countsErr) {
  const country = countryOf(rel);
  if (UK_LIKE_COUNTRIES.has(country)) return;
  for (const [field, text] of allFields) {
    const masked = maskLinksAndUrls(text);
    for (const m of masked.matchAll(/£\d/g)) {
      const window = masked.slice(Math.max(0, m.index - 80), Math.min(masked.length, m.index + m[0].length + 80));
      if (!CURRENCY_CONTEXT_RE.test(window)) continue;
      errors.push({ file: rel, field, rule: 'currency-gbp-wrong-country', snippet: contextOf(masked, m.index, m.index + m[0].length) });
      countsErr['currency-gbp-wrong-country'] = (countsErr['currency-gbp-wrong-country'] || 0) + 1;
    }
  }
}

// title-price: a single combined rule for title/label fields (see
// castleTitleFields()/tourTitleFields() above) covering price, price-unit,
// review figures, product ids, and the same internal-jargon phrases the
// prose rule catches — all of which are a maintenance liability in a
// title specifically because the title is a second, easily-forgotten copy
// of data that already lives in a structured field (price_from, rating,
// reviews, tour_id).
const TITLE_PRICE_PATTERN = /[€£$]\s?\d|\b(?:EUR|USD|GBP)\b|\bfrom\s+[€£$]|\/\s?person\b|\bper person\b|\bper group\b|\/pp\b|\d\.\d\s*★|\d+\s+reviews?\b|rated\s+\d|\bt\d{3,8}\b|\bbatch\b|REGLA\s?#|per (the )?brief\b|site policy\b|rating:\s*null|\bnull\b|\bundefined\b|\bTBD\b|\bTODO\b|New Activity\b|no reviews yet\b|is_top_pick\b|independent (GYG )?(corroborating )?signals?\b|confirmed per\b|Includes list\b|✓|✗|⚠️/gi;

// A price/price-unit token in a title field is only a "stale GYG price"
// problem when the title is actually quoting a live tour price — not every
// price-shaped string in a title field is one. A meta_title noting a
// country house "Sold for £15,000" in 1907 is a historical fact, not a
// GYG listing price, and won't go stale the way a tour price does.
const HISTORICAL_SALE_RE = /\bsold (for|at)\b|\bauctioned?\b|\bbought for\b|\bpurchase price\b/i;

function scanTitleFields(rel, fields, errors, countsErr, falsePositives) {
  for (const [field, rawText] of fields) {
    for (const m of rawText.matchAll(TITLE_PRICE_PATTERN)) {
      const token = m[0];
      const isMoneyLike = /[€£$]|EUR|USD|GBP|per\s+(person|group)|\/\s?p(p|erson)\b/i.test(token);
      if (isMoneyLike && HISTORICAL_SALE_RE.test(rawText)) {
        falsePositives.push({ file: rel, field, rule: 'title-price', snippet: contextOf(rawText, m.index, m.index + token.length), reason: 'historical sale price, not a GYG tour price' });
        continue;
      }
      if (token === '⚠️') continue; // already reported as a warning by the prose scan elsewhere
      errors.push({ file: rel, field, rule: 'title-price', snippet: contextOf(rawText, m.index, m.index + token.length) });
      countsErr['title-price'] = (countsErr['title-price'] || 0) + 1;
      countsErr[`title-price::${countryOf(rel)}`] = (countsErr[`title-price::${countryOf(rel)}`] || 0) + 1;
    }
  }
}

// top-rated-claim-below-threshold (warning, Fase 5 §3): prose asserting
// "Top Rated"/"highly rated"/etc. about this castle's or tour's own GYG
// product, when that product doesn't actually clear the same threshold
// GYGFeaturedTour.tsx/TourCard.tsx use to show the badge. Mirrors
// lib/rating-thresholds.ts — keep these numbers in sync with that file.
const TOP_RATED_CLAIM_RE = /Top Rated|top-rated|highest-rated|best-rated|highly rated/gi;
const MIN_REVIEWS_FOR_TOP_RATED = 10;
const TOP_RATED_MIN_RATING = 4.8;
function claimedTourMeetsThreshold(rating, reviews) {
  return rating != null && reviews != null && reviews >= MIN_REVIEWS_FOR_TOP_RATED && rating >= TOP_RATED_MIN_RATING;
}

function scanTopRatedClaims(rel, fields, rating, reviews, warnings, countsWarn) {
  const meets = claimedTourMeetsThreshold(rating, reviews);
  if (meets) return; // claim is accurate for this castle's/tour's own GYG product; nothing to flag
  for (const [field, rawText] of fields) {
    const masked = maskLinksAndUrls(rawText);
    for (const m of masked.matchAll(TOP_RATED_CLAIM_RE)) {
      warnings.push({ file: rel, field, rule: 'top-rated-claim-below-threshold', snippet: contextOf(masked, m.index, m.index + m[0].length) });
      countsWarn['top-rated-claim-below-threshold'] = (countsWarn['top-rated-claim-below-threshold'] || 0) + 1;
      countsWarn[`top-rated-claim-below-threshold::${countryOf(rel)}`] = (countsWarn[`top-rated-claim-below-threshold::${countryOf(rel)}`] || 0) + 1;
    }
  }
}

function main() {
  const countsErr = {};
  const countsWarn = {};
  const errors = [];
  const warnings = [];
  const falsePositives = [];
  const starThresholdFindings = [];

  const castleFiles = walkFiles(path.join(ROOT, 'data/castles'));
  const tourFiles = walkFiles(path.join(ROOT, 'data/tours'));

  function processFiles(files, getter, kind) {
    for (const filePath of files) {
      const rel = path.relative(ROOT, filePath);
      const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const fields = getter(d);
      for (const [field, text] of fields) {
        scanField(rel, field, text, countsErr, countsWarn, errors, warnings, falsePositives);
      }
      for (const [field, url] of urlFields(d)) {
        scanUrlField(rel, field, url, errors, countsErr);
      }
      scanCurrencyConsistency(rel, d, fields, errors, countsErr);
      scanTitleFields(rel, kind === 'castle' ? castleTitleFields(d) : tourTitleFields(d), errors, countsErr, falsePositives);
      {
        const ownRating = kind === 'castle' ? d.gyg_featured_tours?.[0]?.rating : d.rating;
        const ownReviews = kind === 'castle' ? d.gyg_featured_tours?.[0]?.reviews : d.review_count;
        scanTopRatedClaims(rel, fields, ownRating, ownReviews, warnings, countsWarn);
      }

      if (kind === 'castle') {
        for (const t of d.gyg_featured_tours || []) {
          if (t.rating != null && t.reviews != null && t.reviews > 1 && t.rating >= 4.8 && t.reviews <= 5) {
            starThresholdFindings.push({ file: rel, tourId: t.tour_id, rating: t.rating, reviews: t.reviews });
          }
        }
      }
    }
  }

  processFiles(castleFiles, castleFields, 'castle');
  processFiles(tourFiles, tourFields, 'tour');

  const report = {
    countsErr, countsWarn,
    totalErrors: errors.length,
    totalWarnings: warnings.length,
    errors, warnings, falsePositives,
    starThresholdFindings,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(ROOT, 'scripts', '.lint-public-copy-report.json'), JSON.stringify(report, null, 2));

  // STRICT mode (LINT_COPY_STRICT=1) exits 1 on any error, failing the
  // build — the eventual steady state, once the baseline is 0. Until then,
  // prebuild runs in warn-only mode: every error still prints, nothing
  // fails, so new regressions are visible in the build log without
  // blocking a deploy on the pre-existing backlog this first pass reported.
  const STRICT = process.env.LINT_COPY_STRICT === '1';

  if (errors.length === 0) {
    console.log(`lint:copy — OK (0 errors, ${warnings.length} warnings)`);
    process.exit(0);
  } else if (STRICT) {
    console.error(`lint:copy — FAILED (${errors.length} errors, ${warnings.length} warnings)\n`);
    for (const e of errors) {
      console.error(`${e.file} | ${e.field} | ${e.rule} | ${e.snippet}`);
    }
    process.exit(1);
  } else {
    console.warn(`lint:copy — WARN-ONLY MODE, not failing the build (${errors.length} errors, ${warnings.length} warnings). Set LINT_COPY_STRICT=1 to enforce.\n`);
    for (const e of errors) {
      console.warn(`${e.file} | ${e.field} | ${e.rule} | ${e.snippet}`);
    }
    process.exit(0);
  }
}

// Only run the full scan when executed directly (`node lint-public-copy.mjs`
// or via npm script) — not when imported by the test fixtures below, which
// need the rule engine but must not perform or report a full repo scan.
if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? '')) {
  main();
}

export { ERROR_RULES, maskLinksAndUrls, UK_LIKE_COUNTRIES, CURRENCY_CONTEXT_RE, TITLE_PRICE_PATTERN, HISTORICAL_SALE_RE, TOP_RATED_CLAIM_RE, claimedTourMeetsThreshold };
