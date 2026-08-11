# Castle Page Content Standards

Reference for all batch generation and editing passes. Read this before writing any castle JSON field.

## `history` field — the most important rule

**The history field must be flowing prose. Never a timeline or a list of fragments.**

### What it must be

Complete sentences with proper subjects, articles, and connective tissue. The register should match the rest of the page's editorial voice — authoritative, specific, written for an interested reader rather than a search index.

A correct history field reads like this (Blarney Castle):

> The site of Blarney has been inhabited and fortified since the earliest medieval period. The first castle on the rock was reputedly built by Cormac MacCarthy around 1210, but the substantial tower that survives today was constructed in 1446 by Cormac Laidir ('the Strong') MacCarthy... The most famous Blarney story concerns Queen Elizabeth I and Dermot McCarthy. The Queen, exasperated by McCarthy's eloquent but entirely hollow promises of submission to the Crown, reportedly declared his correspondence 'all Blarney'...

And this (Château de Chambord):

> François I came to the throne in 1515, fought the Battle of Marignano, and immediately began transforming France into a Renaissance monarchy to rival the Italian city-states he had just encountered. Chambord was the architectural expression of that ambition...

### What it must never be

**LOG format** — a `year: event` timeline:

> ❌ 1729: Victor Amadeus II commissions Filippo Juvarra. 1733: Construction complete. 1800: Napoleon uses the palace. 1861: Italian unification.

**FRAGMENT format** — sentences missing their subject:

> ❌ Built by John de Courcy from 1177 as the principal stronghold. Expanded and reinforced through the 12th and 13th centuries. Used as a military base as late as World War II.

Both formats look like notes — they read like the research stage before the writing stage. The published `history` field is the writing stage.

### Practical rules

- **Open with a narrative sentence**, not a year or a passive construction. The opening should establish what kind of place this is and why it matters historically.
- **Weave dates into prose** rather than leading with them. "In 1717, Victor Amadeus II commissioned Juvarra..." not "1717: Victor Amadeus II commissions Juvarra..."
- **Preserve every real fact** from the source material — dates, names, events, people. A rewrite for register must not drop or invent factual content.
- **Length**: 130–250 words is the normal range. Longer is fine for sites with unusually rich history (Mystras, Heidelberg). Shorter is fine for smaller sites where the key facts are genuinely limited.
- **Vary the opening approach** across different castles. Not every history should start with "The castle was built in..." or "X has dominated the landscape since...". Read the description field above it and open the history differently.
- **Avoid the `description` field's exact sentences** — some overlap is expected and fine, but outright duplication of a sentence from the description above reads as lazy.

### Self-check before writing

Before finalising a `history` field, count the `year:` occurrences. If you see three or more instances of the pattern `NNNN:` (four-digit year followed by a colon), you have written a LOG, not prose. Rewrite it.

---

## `description` field

Multi-paragraph narrative, 300–600 words. This is the main editorial piece — it should tell the reader why this specific castle is worth visiting and what makes it distinctive from other castles in the same country or period. Avoid generic castle descriptions that could apply to any fortified building.

## `how_to_visit` field

Practical getting-there and on-site guidance. Supports markdown bold (`**text**`) and line breaks. Should be specific — specific bus numbers, specific journey times, specific combinations with nearby castles. Minimum ~80 words; longer for sites that are genuinely hard to reach or have complex logistics.

### Fixed 4-part structure — required on every castle

Every `how_to_visit` field must use exactly these four bold subheadings, in this order:

```
**Getting there:** …

**Tickets:** …

**Practical tips:** …

**Combine with:** …
```

#### Rules per section

**Getting there** — directions and transit from the nearest city. Specific: route numbers, journey times, whether car is needed. Mention the public-transport option first if one exists; note where car is the only practical option.

**Tickets** — walk-up admission price, what's included, advance-booking requirements. If a GYG featured tour exists: mention the tour name, tour_id, price, and star rating in the body prose here. Do not put the tour name or tour_id in the subheading itself — tour products are unstable (prices change, tours get delisted) and the subheading should survive a tour change without needing a header rewrite.

> ✅ `**Tickets:** Walk-up entry is €10. The GYG guided hike (t412336, from €75, 5★/25 reviews) includes the entrance fee and is timed to arrive at sunset…`
> ❌ `**GYG guided hike + sunset (~€75, t412336):** …` ← tour name as subheading

**Practical tips** — one or two genuinely useful things that visitors commonly miss, get wrong, or that make the difference between a good and a bad visit. Best time to arrive, what to prioritise, what's overrated, crowd or seasonal notes, what to wear. Don't invent generic filler — only write what's specifically true about this castle and you can back from context.

**Combine with** — name one or two specific nearby castles already published on the site, and link to them with internal markdown links: `[Castle Name](/castles/country/castle-id)`. Pick pairings that are genuinely practical (within a day-trip range from the same city or along the same route). Skip this section only if there is no reasonable on-site pairing — but actively look for one in `nearby_castles` before skipping. Do not force a weak pairing just to fill the section.

#### What not to do

- **No tour name or tour_id as a subheading.** This was the "GYG-first" format used in some July–August 2026 batches and has been deprecated. All tour information belongs in the Tickets body text.
- **No extra subheadings.** Some May 2026 castles had 5+ subheadings (Getting there, Tickets, The Gloriette, Zoo, Christmas Market…). Consolidate contextual/practical content into the Practical tips block.
- **No plain prose without structure.** Every published castle must have the four bold subheadings — unstructured paragraphs are not acceptable regardless of content quality.

## `highlights` field (array)

Five bullet points, each 20–40 words. Should be genuinely distinctive claims — the architectural feature, historical event, or collection element that makes this castle worth a trip. Avoid generic superlatives ("most beautiful castle in...") without specific supporting content.

## `faqs` field (array)

Three FAQs per castle. Questions should be what a prospective visitor actually asks — not rhetorical or self-promotional. Answers should add information not already in the description or quick facts.

## `tagline` field

One sentence, under 20 words. Should be the single most memorable thing about the castle — the specific claim that differentiates it. Not a generic summary.

---

## Tour data rules (REGLA #3)

- ≤1 reviews → `rating: null`, `reviews: 0`, `is_top_pick: false`
- >1 reviews AND rating ≥ 4.8 → `is_top_pick: true`
- >1 reviews AND rating < 4.8 → `is_top_pick: false`

`price_from` is always in EUR. `booking_url_override` always includes the full affiliate suffix (`?partner_id=XDLEZT9&utm_medium=online_publisher`). `gyg_url` (on tour files) does NOT include the affiliate suffix — the component adds it.
