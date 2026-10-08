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

## generate-search-index.js

Generates `public/search-index.json` at build time. Runs via `npm run
prebuild` (now `generate-search-index.js && lint-public-copy.mjs`). The
`SearchModal` fetches this file lazily on first open.
