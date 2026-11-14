#!/usr/bin/env node
// Fails the build when copy contains Markdown that the page cannot turn into what the author meant.
//
// Plain-text copy fields (castle description / history / highlights / tagline / architectural_style /
// FAQ answers, tour itinerary stops / excluded / meeting_point) are rendered by components/ui/InlineText,
// which understands [text](url), **bold** and *italic* — and links only when the target is a real page
// of this site. Anything else would reach visitors as raw text, so it is an error here:
//   - a [text](url) whose url is external or not an existing page (the page would print only the text)
//   - ## headings, "- " list lines, `code`, ![images] or <html> in a field that does not render them
//   - a ** or [..](..) left over after the supported syntax has been read (unbalanced or malformed)
// The JSON-LD-only fields (opening_hours.seasonal_note, accessibility) go through stripMarkdown, so they
// may use the same syntax and bullets; only a malformed leftover fails.
// Editorial fields (how_to_visit, how_to_stay, tour overview/tips/FAQ) are converted by renderEditorialHtml;
// a link there to a page that does not exist is reported as a warning.
//
//   node scripts/check-markdown.mjs          (also `npm run check:markdown`, and part of prebuild)

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseInline, tokensToText, stripMarkdown, internalTarget } = require('../lib/inline-markdown.js');
const { resolveInternalLink } = require('../lib/internal-links.js');

const ROOT = process.cwd();
const errors = [];
const warnings = [];

function* jsonFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* jsonFiles(full);
    else if (entry.name.endsWith('.json')) yield full;
  }
}

const list = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === 'string' ? v : null);

/** [fieldLabel, text] pairs for each kind of field. */
function castleFields(c) {
  const plain = [
    ['description', c.description], ['history', c.history], ['tagline', c.tagline],
    ['architectural_style', c.architectural_style],
    ...list(c.highlights).map((t, i) => [`highlights[${i}]`, t]),
    ...list(c.faqs).map((f, i) => [`faqs[${i}].answer`, f?.answer]),
  ];
  const stripped = [['opening_hours.seasonal_note', c.opening_hours?.seasonal_note], ['accessibility', c.accessibility]];
  const editorial = [['how_to_visit', c.how_to_visit], ['hotel.how_to_stay', c.hotel?.how_to_stay]];
  return { plain, stripped, editorial };
}

function tourFields(t) {
  return {
    plain: [
      ['meeting_point', t.meeting_point],
      ...list(t.itinerary).map((s, i) => [`itinerary[${i}].description`, s?.description]),
      ...list(t.excluded).map((x, i) => [`excluded[${i}]`, x]),
    ],
    stripped: [],
    editorial: [
      ['overview', t.overview],
      ...list(t.tips).map((x, i) => [`tips[${i}]`, x]),
      ...list(t.faqs).map((f, i) => [`faqs[${i}].answer`, f?.answer]),
    ],
  };
}

const UNSUPPORTED = [
  [/^#{1,6} /m, '## heading'],
  [/^\s*[-*] \S/m, '"- " list item'],
  [/`[^`]+`/, '`code`'],
  [/!\[[^\]]*\]\([^)]*\)/, '![image]'],
  [/<\/?[a-z][^>]*>/i, '<html> tag'],
];

function leftovers(text) {
  const rest = tokensToText(
    // Only the text tokens count: what the parser could not read as links/bold/italic.
    parseInline(text).filter((t) => t.type === 'text').map((t) => ({ type: 'text', value: t.value })),
  );
  const found = [];
  if (rest.includes('**')) found.push('unbalanced **');
  if (/\[[^\]]*\]\([^)]*\)?|\]\(/.test(rest)) found.push('malformed [text](url)');
  return found;
}

function checkLinks(text, report) {
  for (const m of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    if (!resolveInternalLink(m[2])) report(m[2]);
  }
}

function check(file, { plain, stripped, editorial }) {
  const rel = path.relative(ROOT, file);
  for (const [field, raw] of plain) {
    const text = str(raw);
    if (!text) continue;
    checkLinks(text, (url) => errors.push(`${rel}: ${field}: link "${url}" is external or not an existing page; the page would show only its text`));
    for (const [re, label] of UNSUPPORTED) if (re.test(text)) errors.push(`${rel}: ${field}: ${label} is not rendered in this field`);
    for (const label of leftovers(text)) errors.push(`${rel}: ${field}: ${label}`);
  }
  for (const [field, raw] of stripped) {
    const text = str(raw);
    if (!text) continue;
    const clean = stripMarkdown(text);
    if (/\*\*|\]\(|^#{1,6} /m.test(clean)) errors.push(`${rel}: ${field}: Markdown left in the JSON-LD text after stripping`);
  }
  for (const [field, raw] of editorial) {
    const text = str(raw);
    if (!text) continue;
    // External links are fine here; an internal path that is not a page would be a 404 for the visitor.
    checkLinks(text, (url) => { if (internalTarget(url)) warnings.push(`${rel}: ${field}: internal link "${url}" is not an existing page`); });
  }
}

for (const file of jsonFiles(path.join(ROOT, 'data/castles'))) check(file, castleFields(JSON.parse(fs.readFileSync(file, 'utf-8'))));
for (const file of jsonFiles(path.join(ROOT, 'data/tours'))) check(file, tourFields(JSON.parse(fs.readFileSync(file, 'utf-8'))));

if (warnings.length) {
  console.warn(`check-markdown: ${warnings.length} warning(s)`);
  for (const w of warnings.slice(0, 20)) console.warn(`  ${w}`);
}
if (errors.length) {
  console.error(`check-markdown: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log('check-markdown: ok');
