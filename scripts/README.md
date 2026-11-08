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
