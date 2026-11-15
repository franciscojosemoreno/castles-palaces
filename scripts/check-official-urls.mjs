#!/usr/bin/env node
// Checks that every external "official" link in the content still works: the domain resolves (DNS) and the
// page answers 200. Meant to be run BY HAND about once a month — it needs the network, so it is NOT part of
// prebuild (a flaky site must never break a deploy):
//
//   npm run check:official-urls                 # check everything, write the report, exit 1 on a dead link
//   npm run check:official-urls -- --only=italy # only data files whose path contains "italy"
//   npm run check:official-urls -- --no-text    # only the official_*_url fields, not domains written in prose
//
// What it reads (data/castles, data/tours, data/routes, data/guides):
//   - every `official_*_url` field (e.g. official_tickets_url);
//   - every other http(s) URL and every bare domain written in the copy ("check heritagemalta.mt for hours"),
//     except the affiliate / booking / reference hosts in SKIP_HOSTS below and this site's own domain.
//
// Result per link: OK (200) | BLOCKED (403/429/999/503: the site answers but refuses scripts — verify in a
// browser, never counts as a failure) | NO_DNS (the domain does not exist: fix it) | HTTP_<code> (404, 410, 5xx…)
// | ERROR (timeout / TLS). NO_DNS, HTTP_4xx/5xx and ERROR make the script exit 1.
//
// Known-good exceptions (a site that refuses scripts but loads fine for people) go in
// scripts/official-urls.allow.json: [{ "host": "example.org", "reason": "403 to scripts, loads in a browser" }].
// The full machine-readable result is written to scripts/.check-official-urls-report.json.
//
// When a domain is dead: find the castle's real site (operator, municipality or heritage body), use it only
// if it answers 200 and the page is clearly about the castle; otherwise remove the link and the domain from
// the text and say "check the official website for current opening hours and prices".

import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith('--only=')) || '').slice('--only='.length);
const includeText = !args.includes('--no-text');

const SKIP_HOSTS = [
  'getyourguide.com', 'booking.com', 'tiqets.com', 'viator.com', 'awin1.com', 'tkqlhce.com', 'jdoqocy.com', 'anrdoezrs.net',
  'dpbolvw.net', 'kqzyfj.com', 'wikipedia.org', 'wikimedia.org', 'wikidata.org', 'google.com', 'goo.gl', 'maps.app.goo.gl',
  'openstreetmap.org', 'youtube.com', 'youtu.be', 'facebook.com', 'instagram.com', 'x.com', 'twitter.com', 'tripadvisor.com',
  'castles-palaces.com', 'unesco.org', 'schema.org', 'w3.org',
];
const allowFile = path.join(ROOT, 'scripts/official-urls.allow.json');
const ALLOW = new Set((fs.existsSync(allowFile) ? JSON.parse(fs.readFileSync(allowFile, 'utf-8')) : []).map((e) => e.host));

const URL_RE = /https?:\/\/[^\s"'<>)\]]+/g;
const TLDS = 'com|org|net|eu|info|travel|museum|scot|wales|cymru|uk|ie|fr|de|at|ch|it|es|pt|nl|be|lu|pl|cz|sk|hu|ro|bg|gr|hr|si|rs|ba|me|al|mk|md|ua|lt|lv|ee|fi|se|no|dk|is|tr|mt|cy|ge|am|az|by|ru|il|ma|tn|eg|jo|lb';
const BARE_RE = new RegExp(`(?<![@/\\w.-])((?:[a-z0-9-]+\\.)+(?:${TLDS}))(?![\\w-])`, 'gi');

function* jsonFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* jsonFiles(full);
    else if (entry.name.endsWith('.json')) yield full;
  }
}

const hostOf = (url) => url.replace(/^https?:\/\//i, '').split(/[/?#]/)[0].split(':')[0].toLowerCase();
const skipped = (host) => SKIP_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));

// url -> [{ file, field }]
const links = new Map();
function add(url, file, field) {
  const clean = url.replace(/[.,;:]+$/, '');
  if (skipped(hostOf(clean))) return;
  if (!links.has(clean)) links.set(clean, []);
  links.get(clean).push({ file, field });
}

function walk(value, file, trail) {
  if (typeof value === 'string') {
    const field = trail.join('.');
    const last = trail[trail.length - 1] || '';
    if (/^official_.*_url$/.test(last)) {
      if (/^https?:\/\//i.test(value)) add(value, file, field);
      return;
    }
    if (!includeText) return;
    for (const m of value.matchAll(URL_RE)) add(m[0], file, field);
    const rest = value.replace(URL_RE, ' ');
    for (const m of rest.matchAll(BARE_RE)) add(`https://${m[1].toLowerCase()}`, file, field);
  } else if (Array.isArray(value)) {
    value.forEach((v) => walk(v, file, [...trail, '[]']));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, file, [...trail, k]);
  }
}

for (const top of ['castles', 'tours', 'routes', 'guides']) {
  for (const file of jsonFiles(path.join(ROOT, 'data', top))) {
    const rel = path.relative(ROOT, file);
    if (only && !rel.includes(only)) continue;
    walk(JSON.parse(fs.readFileSync(file, 'utf-8')), rel, []);
  }
}

const UA = 'castles-palaces-link-check/1.0 (monthly check of official links)';
const dnsCache = new Map();
async function resolves(host) {
  if (!dnsCache.has(host)) {
    dnsCache.set(host, dns.lookup(host).then(() => true, () => false));
  }
  return dnsCache.get(host);
}

async function request(url, method) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(url, { method, redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
    await res.body?.cancel();
    return { status: res.status, final: res.url };
  } finally {
    clearTimeout(timer);
  }
}

async function check(url) {
  const host = hostOf(url);
  if (ALLOW.has(host)) return { url, result: 'OK', note: 'allow-listed' };
  // A bare domain written in prose may exist only with "www." (or only without it).
  const candidates = [host, host.startsWith('www.') ? host.slice(4) : `www.${host}`];
  let live = null;
  for (const c of candidates) if (await resolves(c)) { live = c; break; }
  if (!live) return { url, result: 'NO_DNS' };
  const target = url.replace(host, live);
  try {
    let r = await request(target, 'HEAD');
    if (r.status >= 400) r = await request(target, 'GET');
    if (r.status >= 200 && r.status < 300) return { url, result: 'OK', status: r.status, final: r.final };
    // A redirect that never lands (cookie / consent walls) or a bot wall: needs a human with a browser.
    if ([403, 429, 503, 999].includes(r.status) || (r.status >= 300 && r.status < 400)) return { url, result: 'BLOCKED', status: r.status };
    return { url, result: `HTTP_${r.status}`, status: r.status, final: r.final };
  } catch (e) {
    return { url, result: 'ERROR', note: String(e.cause?.code || e.name || e).slice(0, 60) };
  }
}

// Small pool, and one request at a time per host, so a monthly run never hammers a site.
const queue = [...links.keys()];
const results = [];
const hostBusy = new Set();
async function worker() {
  while (queue.length) {
    const i = queue.findIndex((u) => !hostBusy.has(hostOf(u)));
    if (i === -1) { await new Promise((r) => setTimeout(r, 200)); continue; }
    const [url] = queue.splice(i, 1);
    const host = hostOf(url);
    hostBusy.add(host);
    try { results.push(await check(url)); } finally { hostBusy.delete(host); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

const order = { NO_DNS: 0, ERROR: 1, BLOCKED: 3, OK: 4 };
results.sort((a, b) => (order[a.result] ?? 2) - (order[b.result] ?? 2) || a.url.localeCompare(b.url));
const counts = {};
for (const r of results) counts[r.result] = (counts[r.result] || 0) + 1;

const report = results.map((r) => ({ ...r, used_in: links.get(r.url) }));
fs.writeFileSync(path.join(ROOT, 'scripts/.check-official-urls-report.json'), JSON.stringify(report, null, 2));

const failing = results.filter((r) => r.result !== 'OK' && r.result !== 'BLOCKED');
console.log(`check-official-urls: ${results.length} links — ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
for (const r of failing) {
  console.error(`  ${r.result}${r.status ? ` ${r.status}` : ''}${r.note ? ` (${r.note})` : ''}  ${r.url}`);
  for (const u of links.get(r.url).slice(0, 3)) console.error(`      ${u.file} · ${u.field}`);
}
const blocked = results.filter((r) => r.result === 'BLOCKED');
if (blocked.length) console.log(`  ${blocked.length} site(s) refused the script (403/429/503): open them in a browser — see scripts/.check-official-urls-report.json`);
process.exit(failing.length ? 1 : 0);
