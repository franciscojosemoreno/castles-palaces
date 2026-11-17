# scripts/

## lint-public-copy.mjs — Fase 4

Catches internal production/editorial notes (product ids, stale $ prices,
exact review/rating figures, "REGLA #" / "Includes list" / ✓ / ✗ style
verification jargon, non-`.com` GetYourGuide affiliate domains, and basic
grammar artifacts left by text edits) before they reach visitor-facing
copy. Runs automatically in `prebuild`, and on demand:

```sh
npm run lint:copy          # scan everything, print findings, exit 0 (report only)
npm run lint:copy:strict   # same scan, but exit 1 on any error — what prebuild runs
npm run lint:copy:test     # fixture tests for the rule engine itself
```

`prebuild` always runs with `LINT_COPY_STRICT=1`, so `npm run build` fails
on any error. Plain `npm run lint:copy` (no env var) exits 0 even with
errors, for a quick local look at the current findings without blocking
anything.

It only ever reads `data/castles/**/*.json` and `data/tours/**/*.json` —
it never writes to them. The full machine-readable result (every error,
warning, false positive discarded, and the GYG-locale-domain migration
table) is written to `scripts/.lint-public-copy-report.json` on every run.

### Scope

Only fields actually rendered to a visitor — see `castleFields()` /
`tourFields()` in the script for the exact list. `gyg_featured_tours[].note`,
structured price/rating/id fields, and any URL (affiliate or internal link
target) are out of scope by construction: a markdown link `[text](url)` is
reduced to its visible `text` before any content rule runs, so a product id
or domain that only appears inside a link target never trips a content rule.

### Rules

Error rules (fail the build): `product-id`, `usd`, `review-figure`,
`internal-jargon`, `gyg-locale-domain`, `grammar`, `currency-gbp-wrong-country`,
`title-price` (title/label fields only — see `castleTitleFields()`/`tourTitleFields()`),
`top-rated-claim-below-threshold` ("Top Rated"/"highly rated"/etc. claimed
about a GYG product that doesn't clear `shouldShowTopRated()` in
`lib/rating-thresholds.ts`), `bare-gyg` ("GYG" as a bare acronym in prose —
promoted from a warning once Fase 3b brought the site-wide baseline to 0).
`internal-jargon` also catches `tour_id` (a literal field name leaked into
prose) and `confirmed included` (an internal-verification phrase —
promoted from a warning once Fase 3c's cleanup pass brought its baseline
to 0, the same pattern used for `bare-gyg`).
Warning rules (reported, never fail the build): `warning-icon` (⚠️),
`meta-over-160`, `stale-price-near-gyg`.

### Adding an exception

Only the `review-figure` rule has a whitelist, in
`scripts/lint-public-copy.allow.json`. Add an entry only once a human has
confirmed the flagged text is legitimate (e.g. a hotel's own Booking.com
guest-review score, which is not a GYG figure):

```json
{ "file": "data/castles/country/slug.json", "field": "description", "snippet": "the exact matched text" }
```

No other rule has a whitelist mechanism on purpose — if a rule is
genuinely too broad (e.g. flagging a historical construction cost quoted
in £ as a currency-consistency error), fix the rule's pattern/filter in
`lint-public-copy.mjs` itself and add a fixture case to
`lint-public-copy.test.mjs` proving the corrected behavior, rather than
exempting individual files.

### New content batches

Any new or edited castle/tour page must pass `npm run lint:copy` (it runs
automatically before `npm run build`) before it ships. If the lint fails on
something that turns out to be legitimate, fix the rule (see above) — don't
work around it by rephrasing the content to dodge the pattern.

## check-country-codes.mjs

Fails the build when a country folder in `data/castles/` has no ISO 3166-1
alpha-2 code in `lib/country-codes.json`. That file is also what
`components/seo/StructuredData.tsx` reads for the JSON-LD `addressCountry`, so a
missing entry can never silently emit a wrong code. Runs first in `prebuild`
and on demand:

```sh
npm run check:countries
```

A failure looks like `Missing ISO country code for: <folder>`. Add the folder to
`lib/country-codes.json` (England, Scotland, Wales and Northern Ireland are `GB`;
Kosovo uses the user-assigned `XK`), then build again. The component also throws
the same message at render time as a backstop.

## check-url-case.mjs

Fails the build when an internal URL could contain capital letters. Vercel is
case-sensitive, so `/castles/Bulgaria/kaliakra-fortress` is a 404 even though the
castle page exists. Two checks, both automatic:

- **`prebuild` (data):** folders and file names under `data/castles` and
  `data/tours` are lowercase, every castle's `country` equals its folder and its
  `id` equals its file name (cards, the map, search and the JSON-LD breadcrumb
  build `/castles/<country>/<id>` from those fields), tour `slug` and
  `visited_countries` are lowercase, and `data/countries.json` slugs too.
- **`postbuild` (output):** no href, JSON-LD value or sitemap `<loc>` in the generated
  HTML points at `/castles/`, `/castle-hotels/` or `/tours/` with a capital letter.

```sh
npm run check:urls          # data check
node scripts/check-url-case.mjs --built   # output check, after `next build`
```

A failure prints `Capital letters in URL source: <file>: <value>`. Make the field
lowercase and equal to the folder / file name. `proxy.ts` and `next.config.ts` also
redirect capitalised incoming URLs with a 301, but our own links must never need it.

## check-nearby.mjs

Fails the build when a castle's Nearby data is wrong. Every castle page has two blocks
that come from its JSON:

- **Nearby Castles** = `nearby_castles` (manual list), shown closest first with the
  distance. Only castles within **150 km** (`MAX_NEARBY_DISTANCE_KM` in `lib/castles.ts`).
- **More castles in <country>** = `more_castles_in_country` (max 4): same-country castles
  that are too far to be nearby but worth linking between important pages.

```sh
npm run check:nearby
```

Failures it reports: an id that is not a published castle, a castle listing itself, an id
twice (or in both lists), a `nearby_castles` entry farther than 150 km (the only exception
is a remote castle with nothing within 150 km but something within 500 km: at most 2 entries; with nothing within 500 km, like Angra do Heroísmo, `nearby_castles` stays empty and `more_castles_in_country` holds the 4 nearest same-country castles), a
`more_castles_in_country` entry in another country, within 150 km, or more than 4 entries.
A castle with no `nearby_castles` gets its block from the coordinates at render time (same
150 km cap, and its 2 nearest if nothing is within 150 km), so there is nothing to check.

## check-markdown.mjs

Fails the build when copy has Markdown the page cannot render as intended. Plain-text fields
(castle `description`, `history`, `highlights`, `tagline`, `architectural_style`, FAQ answers;
tour itinerary stops, `excluded`, `meeting_point`) are drawn by `components/ui/InlineText.tsx`,
which understands `[text](url)`, `**bold**` and `*italic*` (the syntax lives in
`lib/inline-markdown.js`). A link becomes a real `<a>` only when its target is a page of this
site that exists (`lib/internal-links.js`: published castle, tour, route, guide, country hub or
static page; relative path or castles-palaces.com). External or broken targets print only the
text, so the check treats them as errors, together with `##` headings, `- ` list lines, `` `code` ``,
images, HTML and unbalanced `**` in those fields.

```sh
npm run check:markdown        # also part of prebuild
npm run test:inline-markdown  # fixtures for the parser, the stripper and the link resolver
```

Structured data (JSON-LD) never carries Markdown: `stripMarkdown` cleans `tagline`,
`opening_hours.seasonal_note` and FAQ answers before they are written. The editorial fields
(`how_to_visit`, `how_to_stay`, tour `overview`/`tips`/FAQ, hub FAQ) go through
`renderEditorialHtml` (`lib/markdown.ts`) and may link to external sites; an internal link there
to a page that does not exist (a 404) fails the build too; external links are not checked.

## check-prices.mjs

Fails the build when a visible price does not come from the castle's active GetYourGuide tour in
EUR (rule of 2026-11-14). Two checks: (1) data — for every published castle, what
`lib/entry-price.js` hands to Quick Facts, the search and the JSON-LD is null without an active
tour and otherwise `€N` or `€N / group`; (2) source — no page,
component or lib file other than the shared function (allow-list in the script) reads `price_adult`
or `price_currency`, so a new hub card, map or bar cannot start printing the official admission.

```sh
npm run check:prices      # also part of prebuild
```

To show a castle's official admission, write it in the description (How to Visit > Tickets), in its
own currency ("Admission is £10.40 for adults (Cadw)"); never in a price field of the page.

## check-official-urls.mjs

Checks that every external "official" link in the content still works: `official_*_url` fields and any
other external URL or bare domain written in the copy ("check heritagemalta.mt for hours"). For each one
it looks up the DNS and requests the page; the result is OK (200), BLOCKED (403/429/503/999: the site
refuses scripts, check it in a browser), NO_DNS (the domain does not exist), HTTP_<code> or ERROR.
It needs the network, so it is **not** part of prebuild: run it by hand about once a month.

```sh
npm run check:official-urls                  # everything; exit 1 on NO_DNS / HTTP_4xx/5xx / ERROR
npm run check:official-urls -- --only=italy  # only data files whose path contains "italy"
npm run check:official-urls -- --no-text     # only the official_*_url fields
```

(`npm run check:urls` is the older, offline check of capital letters in internal URLs — see
check-url-case.mjs.) The full result is written to `scripts/.check-official-urls-report.json`. A site that
refuses scripts but loads for people goes in `scripts/official-urls.allow.json` as
`{ "host": "example.org", "reason": "…" }`.

When a domain is dead: find the castle's real site (operator, municipality or heritage body); use it only
if it answers 200 and the page is clearly about the castle (the name in the title or the content). If you
cannot verify one, remove the link and the domain from the text and say "check the official website for
current opening hours and prices" (no URL). Sites with an expired TLS certificate do not count as
working.

## lib/country-hub.js (country and hotel hubs)

Not a script, but what feeds `/castles/[country]` and `/castle-hotels/[country]`: the title, meta description,
second intro paragraph, "by region" list, "Palaces in …" list and three FAQs are generated from each country's
castle data, so a new country gets the same hub with no hand-written copy. Anything written in
`data/countries.json` (`seo_title_override`, `seo_description_override`, `intro_paragraph_2`, `hub_faqs`) wins
over the generated text. Titles are at most 60 characters without the site suffix and fall back from
"Castles, Palaces and Fortresses to Visit" to "Castles, Palaces & Forts", "Castles & Palaces" and "Sites to
Visit". The region list is hidden when no region has two or more castles; region spellings that mean the same
place are merged in `REGION_ALIASES`. Tests: `npm run test:country-hub`.

## generate-lastmod.mjs

Writes `lib/lastmod.generated.json`: the date of the last git commit that touched each
content file (`data/castles`, `data/tours`, `data/routes`, `data/guides` and the static
pages `about`, `contact`, `quiz`). `lib/lastmod.ts` reads it for the sitemap `<lastmod>`,
the JSON-LD `dateModified` and the "Last updated <Month YYYY>" line on every castle page,
so those dates move only when a page really changes. Runs in `prebuild`:

```sh
node scripts/generate-lastmod.mjs
```

- **Full git history (your machine):** regenerates the file. A file with uncommitted
  changes gets today's date, so building before the commit already writes the commit-day
  date. **Commit `lib/lastmod.generated.json` together with the content change.**
- **Shallow clone (Vercel):** keeps the committed file. A shallow clone cannot tell when a
  file last changed (git reports the oldest commit it has for every untouched file), so
  the committed file is the source of truth there. A file missing from it falls back to the
  ficha's `last_updated` field and the script prints how many are missing.
- Hubs use the newest date among the pages they list; a page with no date omits `<lastmod>`.

## generate-search-index.js

Generates `public/search-index.json` at build time. Runs via `npm run
prebuild` (now `generate-search-index.js && lint-public-copy.mjs`). The
`SearchModal` fetches this file lazily on first open.

Each entry carries `price_label` (`"From €20"`, `"Free"` or `null`). It is computed by
`lib/entry-price.js` — the same function that writes the "Entry from…" row of Quick Facts
and the JSON-LD `priceRange` — so every visible price is the **active GetYourGuide tour's
price, in EUR**. A castle without an active tour (`gyg_featured_tours[0]` with a `price_from`)
shows no price anywhere; `price_adult` / `price_currency` are only for the description text.
A castle whose own entry is free still shows the tour's price; that the entry is free goes in
the description (How to Visit > Tickets). A multi-site pass is a GetYourGuide product in EUR, so
its price is shown ("Pass from €124" in Quick Facts, "From €124" in the search). Tests:
`npm run test:entry-price`.

The order of the results lives in `lib/search.ts` (`npm run test:search`): name starts with
the query, then query inside the name, then region/country, and fuzzy matching only when
that gives fewer than 5 results.
