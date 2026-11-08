// Writes lib/lastmod.generated.json: the date of the last git commit that touched each content file.
// The sitemap <lastmod>, the JSON-LD dateModified and the "Last updated" line on every castle page
// read it (lib/lastmod.ts), so the dates reflect real edits instead of the build time.
//
//   node scripts/generate-lastmod.mjs      (runs automatically in `prebuild`)
//
// Why a committed file: a shallow clone (Vercel builds from one) cannot answer "when was this file
// last changed" — git reports the oldest commit it has for every file that did not change inside
// the cloned history. So:
//   - Full git history (local machine): regenerate the file from git. A file with uncommitted
//     changes gets today's date, so building before the commit already writes the commit-day date.
//   - Shallow clone / no git: leave the committed file as it is and only report anything missing.
// Commit lib/lastmod.generated.json together with the content change (the build regenerates it).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'lib/lastmod.generated.json');

// Content directories (every .json inside) and the static pages that have no data file.
const contentDirs = ['data/castles', 'data/tours', 'data/routes', 'data/guides'];
const staticPages = ['app/about/page.tsx', 'app/contact/page.tsx', 'app/quiz/page.tsx'];

function listFiles() {
  const files = [...staticPages];
  const walk = (dir) => {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) return;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.json')) files.push(rel);
    }
  };
  contentDirs.forEach(walk);
  return files.filter((f) => fs.existsSync(path.join(root, f))).sort();
}

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const files = listFiles();
const current = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};

let complete = false;
try {
  complete = git('rev-parse', '--is-shallow-repository').trim() === 'false';
} catch {
  complete = false;
}

if (!complete) {
  const missing = files.filter((f) => !current[f]);
  console.log(`generate-lastmod — shallow clone or no git: keeping the committed lib/lastmod.generated.json (${Object.keys(current).length} dates)`);
  if (missing.length) console.warn(`generate-lastmod — ${missing.length} content files have no date in the committed file (they fall back to the file's last_updated field)`);
  process.exit(0);
}

const dates = {};
const log = git('log', '--format=@%cs', '--name-only', '--', ...contentDirs, ...staticPages);
let day = null;
for (const line of log.split('\n')) {
  if (line.startsWith('@')) day = line.slice(1);
  else if (line.trim() && !dates[line]) dates[line] = day;
}

// Uncommitted (modified, staged or new) files count as changed today.
const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in the local time zone
const status = git('status', '--porcelain', '--untracked-files=all', '--', ...contentDirs, ...staticPages);
for (const line of status.split('\n')) {
  if (!line.trim()) continue;
  const file = line.slice(3).replace(/^"|"$/g, '').split(' -> ').pop();
  dates[file] = today;
}

const out = {};
let missing = 0;
for (const f of files) {
  if (dates[f]) out[f] = dates[f];
  else missing++;
}
const next = JSON.stringify(out, null, 1) + '\n';
if (!fs.existsSync(outFile) || fs.readFileSync(outFile, 'utf8') !== next) fs.writeFileSync(outFile, next);
console.log(`generate-lastmod — OK (${Object.keys(out).length} files dated from git${missing ? `, ${missing} without a commit yet` : ''})`);
