#!/usr/bin/env node
// Fase 3b — replaces the bare acronym "GYG" with "GetYourGuide" across
// visitor-rendered prose. Dry-run by default; writes to disk only with an
// explicit --apply=castles or --apply=tours flag.
//
// Field scope is intentionally imported from lint-public-copy.mjs rather
// than redefined here, so this script always touches exactly the fields
// the lint already treats as visible/rendered — never urlFields() (GYG
// affiliate links, partner_id) and never a JSON key or code identifier.
//
// Safety model: this script never serializes a whole file through
// JSON.stringify (which was verified to silently reformat ~160 files —
// collapsing/expanding arrays, dropping trailing zeros off lat/lng — an
// unacceptable side effect for a text-only rename). Instead, for each
// flagged field it replaces that field's *exact* JSON-encoded substring
// (JSON.stringify(oldValue) -> JSON.stringify(newValue)) directly in the
// raw file text. Verified across the whole dataset that every such
// encoded substring appears exactly once per file, so this is equivalent
// to a surgical single-field edit — every other byte in the file,
// including unrelated formatting quirks, is left alone.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  castleFields, tourFields, castleTitleFields, tourTitleFields, walkFiles, countryOf,
} from './lint-public-copy.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GYG_WORD_RE = /\bGYG\b/;
const GYG_WORD_RE_G = /\bGYG\b/g;
const MD_LINK_TARGET_RE = /\]\(([^)]*)\)/g;

function replaceGygOutsideLinkTargets(text) {
  const targets = [];
  let protected_ = text.replace(MD_LINK_TARGET_RE, (_, url) => {
    targets.push(url);
    return `](\u0000${targets.length - 1}\u0000)`;
  });
  protected_ = protected_.replace(GYG_WORD_RE_G, 'GetYourGuide');
  protected_ = protected_.replace(/\u0000(\d+)\u0000/g, (_, i) => targets[Number(i)]);
  return protected_;
}

// Any "GYG" that survives *inside* a markdown link target is a deliberate
// non-substitution (reported, never auto-fixed) — this should be empty on
// the current dataset (verified during the dry-run audit).
function findGygInsideLinkTargets(text) {
  const hits = [];
  for (const m of text.matchAll(MD_LINK_TARGET_RE)) {
    if (GYG_WORD_RE.test(m[1])) hits.push(m[1]);
  }
  return hits;
}

// A genuine third-party quote containing the literal string "GYG" inside
// real quotation marks (not an apostrophe, and not two unrelated quoted
// spans straddling an unquoted "GYG" in between) — reported, never
// auto-fixed. Pairs quote marks sequentially (1st+2nd bound a span,
// 3rd+4th the next, etc.), since this dataset only uses straight double
// quotes for both open and close. Verified empty on the current dataset
// during the dry-run audit.
function findGygInsideThirdPartyQuote(text) {
  const positions = [];
  for (const m of text.matchAll(/["“”]/g)) positions.push(m.index);
  for (let i = 0; i + 1 < positions.length; i += 2) {
    const span = text.slice(positions[i] + 1, positions[i + 1]);
    if (GYG_WORD_RE.test(span)) return span;
  }
  return null;
}

function processFile(filePath, kind, mode, results) {
  const rel = path.relative(ROOT, filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  const d = JSON.parse(raw);
  const country = countryOf(rel);

  const proseFields = kind === 'castle' ? castleFields(d) : tourFields(d);
  const titleFields = kind === 'castle' ? castleTitleFields(d) : tourTitleFields(d);
  const allFields = [...proseFields, ...titleFields];

  let newRaw = raw;
  let fileChanged = false;

  for (const [field, oldValue] of allFields) {
    if (!GYG_WORD_RE.test(oldValue)) continue;

    const linkTargetHits = findGygInsideLinkTargets(oldValue);
    for (const hit of linkTargetHits) {
      results.nonSubstituted.push({ file: rel, field, reason: 'inside markdown link target', detail: hit });
    }
    const quoteHit = findGygInsideThirdPartyQuote(oldValue);
    if (quoteHit) {
      results.nonSubstituted.push({ file: rel, field, reason: 'inside a literal third-party quote', detail: quoteHit });
    }

    const newValue = replaceGygOutsideLinkTargets(oldValue);
    if (newValue === oldValue) continue; // every GYG was inside a protected span

    const occurrences = (oldValue.match(GYG_WORD_RE_G) || []).length;
    const afterGetYourGuideCount = (newValue.match(/GetYourGuide/g) || []).length;

    results.changes.push({
      file: rel, kind, country, field, before: oldValue, after: newValue,
      occurrences, afterGetYourGuideCount,
      beforeLen: oldValue.length, afterLen: newValue.length,
    });

    if ((mode === 'apply-castles' && kind === 'castle') || (mode === 'apply-tours' && kind === 'tour')) {
      const encodedOld = JSON.stringify(oldValue);
      const encodedNew = JSON.stringify(newValue);
      if (!newRaw.includes(encodedOld)) {
        throw new Error(`Could not locate exact encoded field in raw text: ${rel} | ${field}`);
      }
      newRaw = newRaw.replace(encodedOld, encodedNew);
      fileChanged = true;
    }
  }

  if (fileChanged) {
    fs.writeFileSync(filePath, newRaw);
    results.filesWritten.push(rel);
  }
}

function main() {
  const args = process.argv.slice(2);
  const applyArg = args.find((a) => a.startsWith('--apply='));
  const mode = applyArg === '--apply=castles' ? 'apply-castles'
    : applyArg === '--apply=tours' ? 'apply-tours'
    : 'dry-run';

  const results = { changes: [], nonSubstituted: [], filesWritten: [] };

  const castleFiles = walkFiles(path.join(ROOT, 'data/castles'));
  const tourFiles = walkFiles(path.join(ROOT, 'data/tours'));

  for (const f of castleFiles) processFile(f, 'castle', mode, results);
  for (const f of tourFiles) processFile(f, 'tour', mode, results);

  fs.writeFileSync(
    path.join(ROOT, 'scripts', '.rename-gyg-prose-report.json'),
    JSON.stringify(results, null, 2)
  );

  const totalOccurrences = results.changes.reduce((s, c) => s + c.occurrences, 0);
  const filesAffected = new Set(results.changes.map((c) => c.file)).size;

  console.log(`rename-gyg-prose — mode: ${mode}`);
  console.log(`  fields changed: ${results.changes.length}`);
  console.log(`  files affected: ${filesAffected}`);
  console.log(`  total "GYG" occurrences replaced: ${totalOccurrences}`);
  console.log(`  non-substituted matches (reported, not fixed): ${results.nonSubstituted.length}`);
  if (mode !== 'dry-run') {
    console.log(`  files written: ${results.filesWritten.length}`);
  } else {
    console.log('  (dry run — no files written. Use --apply=castles or --apply=tours to write.)');
  }
}

main();
