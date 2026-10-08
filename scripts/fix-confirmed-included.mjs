#!/usr/bin/env node
// Fase 3c — mechanically replaces "confirmed included" with "included" (or
// "Confirmed included" -> "Included" at a sentence start) across visitor-
// rendered prose. One genuinely different case (the Isle of Man tour's
// Laxey Wheel line, where "confirmed" negated an uncertain inclusion
// status rather than restating a confirmed one) was fixed by hand first
// and is expected to no longer match here.
//
// Dry-run by default; writes to disk only with --apply. Same safety model
// as rename-gyg-prose.mjs: never serializes a whole file through
// JSON.stringify (verified elsewhere to silently reformat arrays and
// numbers) — only replaces each flagged field's exact JSON-encoded
// substring in the raw file text.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castleFields, tourFields, walkFiles } from './lint-public-copy.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PATTERN = /\bconfirmed included\b/gi;

function replaceConfirmedIncluded(text) {
  return text.replace(PATTERN, (m) => (m[0] === 'C' ? 'Included' : 'included'));
}

function processFile(filePath, kind, apply, results) {
  const rel = path.relative(ROOT, filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  const d = JSON.parse(raw);

  const fields = kind === 'castle' ? castleFields(d) : tourFields(d);

  let newRaw = raw;
  let fileChanged = false;

  for (const [field, oldValue] of fields) {
    if (typeof oldValue !== 'string' || !PATTERN.test(oldValue)) continue;

    const newValue = replaceConfirmedIncluded(oldValue);
    if (newValue === oldValue) continue;

    results.changes.push({ file: rel, field, before: oldValue, after: newValue });

    if (apply) {
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
  const apply = process.argv.includes('--apply');
  const results = { changes: [], filesWritten: [] };

  for (const f of walkFiles(path.join(ROOT, 'data/castles'))) processFile(f, 'castle', apply, results);
  for (const f of walkFiles(path.join(ROOT, 'data/tours'))) processFile(f, 'tour', apply, results);

  fs.writeFileSync(
    path.join(ROOT, 'scripts', '.fix-confirmed-included-report.json'),
    JSON.stringify(results, null, 2)
  );

  const filesAffected = new Set(results.changes.map((c) => c.file)).size;
  console.log(`fix-confirmed-included — mode: ${apply ? 'apply' : 'dry-run'}`);
  console.log(`  fields changed: ${results.changes.length}`);
  console.log(`  files affected: ${filesAffected}`);
  if (!apply) console.log('  (dry run — no files written. Use --apply to write.)');
  else console.log(`  files written: ${results.filesWritten.length}`);
}

main();
