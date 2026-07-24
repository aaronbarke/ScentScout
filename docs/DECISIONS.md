# ScentScout — Decision Records (ADRs)

Meaningful product/architecture decisions are recorded here. Format: Status · Date · Decision ·
Reason · Alternatives · Consequences.

---

## ADR-001: Next.js 16 + mandated stack

Status: Accepted

Date: 2026-07-22

Decision:
Build on the mandated stack — Next.js (App Router) + TypeScript + Tailwind + shadcn/ui,
PostgreSQL via Supabase, Drizzle ORM, Zod, Cheerio (+ Playwright only when static HTTP is
insufficient), Vitest, Playwright Test, Resend, Sentry, Graphify. `create-next-app` provisioned
**Next.js 16.2.11** with React 19.2 (the current major).

Reason:
The stack is required by the product brief. We adopt the current Next.js major that
`create-next-app` installs rather than pinning an older line, to start on supported, maintained
versions.

Alternatives:
Pin to Next.js 15 (closer to prior training data, but older and soon to lag). Rejected in favor
of the current major.

Consequences:
Next.js 16 has breaking changes versus older Next; its scaffold ships an `AGENTS.md` warning to
consult `node_modules/next/dist/docs/` before writing framework-specific code. We follow that in
later phases. Node 23 emits an EBADENGINE warning for one transitive ESLint dep — non-fatal.

---

## ADR-002: ScentScout is its own git repository with a public GitHub remote

Status: Accepted

Date: 2026-07-22

Decision:
ScentScout lives at `Projects/ScentScout/` as its **own** git repository (default branch
`main`), with the GitHub remote `github.com/aaronbarke/ScentScout` created **public**.

Reason:
The brief calls for a dedicated GitHub remote and independent phase-by-phase push workflow. The
surrounding `Projects/` directory is a separate repo containing several independent projects; a
nested standalone repo matches that established pattern. Public visibility was chosen by the
project owner.

Alternatives:
(a) Track ScentScout inside the parent `Projects` repo — rejected; the brief wants an isolated
remote and history. (b) Private repo — the owner opted for public.

Consequences:
The parent repo sees `ScentScout/` as an untracked directory (as with sibling projects). All
ScentScout commits/pushes target its own `origin/main`. Secrets must never be committed —
enforced by `.gitignore` and the security rules.

---

## ADR-003: Definition of "estimated delivered price before tax"

Status: Accepted

Date: 2026-07-22

Decision:
`estimated delivered price before tax = listed price − verified coupon discount + required
shipping`. Only **verified** coupons affect this primary total. When required shipping is
**unknown**, no delivered total is shown — the UI displays the listed price with an explicit
"plus unknown shipping" note.

Reason:
Delivered cost, not sticker price, is what shoppers actually pay; honesty about unknowns and
unverified discounts is a core differentiator. Tax is excluded from the MVP (no per-ZIP tax
estimation).

Alternatives:
(a) Assume free shipping when unknown — rejected; misleads users. (b) Apply unverified coupons
to the headline total — rejected; overstates discounts. (c) Include tax — deferred (out of MVP
scope).

Consequences:
`price_observations.estimated_delivered_price_cents` is null when shipping is unknown. The price
engine and UI must handle the "unknown shipping" state everywhere. Changing this definition (or
adding tax) requires a new ADR.

---

## ADR-004: Deterministic checks are the sole authority for production matches

Status: Accepted

Date: 2026-07-22

Decision:
Production product matches are approved only by deterministic normalization + contradiction +
confidence checks. An LLM may **suggest** a candidate match for the admin review queue, but is
never the sole authority for an automatic production match.

Reason:
Exact variant integrity (testers vs. retail, refills vs. bottles, flanker/concentration/size)
is the product's foundation; silent or probabilistic mismatches would undermine trust. Determinism
keeps every decision auditable and reproducible.

Alternatives:
LLM-driven auto-matching — rejected as sole authority; non-deterministic and hard to audit.
Introducing an LLM anywhere in the production match-approval path requires a new ADR.

Consequences:
Every matching decision carries an auditable reason list; uncertain cases route to
`match_reviews`. Matching thresholds/weights are documented in `MATCHING_ENGINE.md`; changing
them requires a new ADR.

---

## ADR-005: Canonical SKU scheme and testers as first-class variants

Status: Accepted

Date: 2026-07-22

Decision:
`canonical_sku = "<fragranceSlug>-<concentrationCode>-<sizeMl>ml-<presentation>"` (e.g.
`le-labo-santal-33-edp-100ml-retail`). Fragrance slugs are brand-prefixed and globally unique.
The `<concentrationCode>-<sizeMl>ml-<presentation>` tail doubles as the public exact-variant URL
segment. Testers (and refills) are seeded as their own variant rows, never derived from or
merged with retail. The seed catalog concentration enum gained `absolu` (for Byredo Bal
d'Afrique Absolu), via additive migration `0001`.

Reason:
A deterministic, human-readable natural key makes the seed idempotent (upsert on `canonical_sku`)
and gives stable, indexable URLs for free. Because presentation and concentration are baked into
the key, retail/tester/refill and EDP/EDT can never collide — enforcing the "never combine
presentations/concentrations" rule at the identity level. Modeling testers as real variants
reflects how they are actually sold and keeps their price history separate.

Alternatives:
Opaque UUID/serial SKUs (rejected: not idempotent-friendly or URL-usable); deriving testers
from retail at query time (rejected: conflates distinct products and their price histories).

Consequences:
The catalog seed (`src/db/seed/catalog.ts`) is the source of truth; `scripts/validate-catalog.ts`
and unit tests enforce SKU uniqueness and presentation/concentration separation. Adding a new
concentration requires an additive enum migration.

---

## ADR-006: Retailer integration order, evidence-led

Status: Accepted

Date: 2026-07-22

Decision:
Integrate retailers in this order: **1) Luckyscent, 2) FragranceNet, 3) FragranceX or Jomashop
(whichever affiliate feed is approved first), 4) Nordstrom.** No adapter is written against a
retailer until its access evidence is recorded in `docs/RETAILER_RESEARCH.md`.

Reason:
Verified against live evidence rather than assumption. Luckyscent's JSON-LD exposes a
`ProductGroup` with cleanly separated brand, an explicit `size` field, correct `USD`, and
**GTIN-13** per variant — the strongest possible signal for deterministic exact matching, and
retrievable with static HTTP (no browser automation). FragranceNet follows because it adds
discount pricing and **tester** coverage, and its quirks (brand field polluted with the
fragrance name, `priceCurrency: "US"`, oz-only sizes) are a realistic normalization stress test.
Nordstrom is last: the most restrictive `robots.txt` of the set and likely client-rendered,
which would force Playwright — our explicit last resort.

Alternatives:
Starting with a discounter (more price movement, testers) — rejected as the first adapter
because validating the matching engine against the *cleanest* data first isolates matching bugs
from parsing bugs. Starting with an affiliate feed — deferred: feeds require approval, a
business step not yet completed.

Consequences:
Phase 2's first adapter targets Luckyscent via JSON-LD. Tester coverage does not arrive until
FragranceNet (authorized boutiques don't sell testers), so tester variants stay unpopulated
until then. Luckyscent's travel/decant sizes (10ml, 1ml) are out of MVP scope and must be
rejected by size contradiction, not silently matched. Retailer-specific quirks stay inside each
adapter directory. `robots.txt` is re-checked before enabling any retailer.

---

## ADR-007: parseProduct returns many variants; GTIN/MPN added to the parse contract

Status: Accepted

Date: 2026-07-22

Decision:
`RetailerAdapter.parseProduct()` returns `ParsedRetailerProduct[]` (0..N) rather than a single
product, and `ParsedRetailerProduct` gains `gtin` and `mpn` (both nullable, both required keys).

Reason:
Evidence from the live Luckyscent page: one product URL exposes a schema.org `ProductGroup`
whose `hasVariant[]` holds three separately purchasable sizes (100ml, 10ml travel, 1ml sample),
each with its own SKU, price, availability and barcode. A one-URL-one-product signature cannot
represent that without silently discarding variants — which would violate the rule against
combining differently-sized products. Returning an empty array is the honest representation of
"nothing parseable here", explicitly distinct from "out of stock".

GTIN is the single strongest deterministic matching signal available (Luckyscent publishes
GTIN-13 per variant; FragranceX's affiliate feed carries UPC and MPN), so the parse contract
must be able to carry it through to the matching engine.

Alternatives:
(a) Keep the singular signature and emit only the "primary" variant — rejected; drops real
purchasable products and their price history. (b) Add a separate `parseVariants()` method —
rejected as redundant; the multi-result case is the normal case, not the exception.

Consequences:
This deviates from the interface sketch in the original brief; the brief described it as
"similar to" the final shape, and the deviation is evidence-led. Ingestion iterates results and
writes one append-only observation per variant. Out-of-scope sizes (10ml/1ml decants) are parsed
faithfully and left for the matching engine to reject on size contradiction rather than being
filtered at parse time — parsing reports what exists; matching decides what counts.

---

## ADR-008: Persist adapter-parsed attributes; keep the matching engine I/O-free

Status: Accepted

Date: 2026-07-22

Decision:
`retailer_products` gains `gtin`, `parsed_fragrance_name`, `parsed_concentration`,
`parsed_size_ml` and `parsed_presentation` (migration `0002`). The matching engine consumes
those columns rather than re-deriving attributes from `raw_title`. Separately,
`src/domain/matching/index.ts` exports **only pure logic**; the DB-touching `candidates.ts` and
`review.ts` must be imported directly.

Reason:
Adapters already extract clean attributes using retailer-specific knowledge — Luckyscent's
JSON-LD gives `"Gris Charnel"` as the fragrance name and `"100ml"` as an explicit size field.
Re-deriving from the raw title (`"Gris Charnel - 100ml"`) would be lossy and would push
retailer-shaped string heuristics into shared domain code, violating the adapter boundary.
Persisting the parsed values keeps parsing in the adapter and matching purely comparative.

The barrel split was forced by a real failure: re-exporting `candidates.ts` from the matching
index pulled `@/db/client` into every consumer, so `loadDbEnv()` ran at import time and the pure
unit tests (and any future page importing matching) demanded a live `DATABASE_URL`.

Alternatives:
(a) Re-derive attributes from `raw_title` at match time — rejected as lossy and a layering
violation. (b) Keep one barrel and lazily initialize the DB client — rejected; hiding I/O behind
lazy init makes the dependency harder to see, not absent.

Consequences:
Ingestion writes the parsed attributes on every upsert, so re-ingesting refreshes them. The
matching engine stays a pure function of (listing attributes, candidate variants), which is why
it is exhaustively unit-testable without a database. GTIN is stored as evidence for admin review
and future GTIN-keyed matching; it is not yet used as a scoring signal because canonical
variants do not carry barcodes.

---

## ADR-009: Price-history metrics use the listed-price basis

Status: Accepted

Date: 2026-07-23

Decision:
Historical metrics (lows, medians, percentile, all-time low) and the buy-now guidance are
computed over the **listed price**, not the delivered price. Delivery-aware *ranking* of current
offers still uses the delivered total when it is known.

Reason:
Delivered price is frequently null because shipping is unknown (e.g. every Luckyscent offer —
they don't publish shipping on the product page). Mixing a delivered basis with a listed basis
across a time series would corrupt percentiles and lows, and dropping unknown-shipping
observations would throw away most of the history. The listed price is the consistently
observable signal, so it is the honest basis for "is this historically cheap?". Ranking is a
point-in-time comparison of concrete offers, where a known delivered total is the better basis
and is available per offer.

Alternatives:
(a) Delivered-price basis for history — rejected; too sparse and would silently exclude
unknown-shipping offers. (b) Fall back to listed only when delivered is null — rejected; a mixed
basis makes percentiles meaningless.

Consequences:
`computePriceMetrics` reads `listedPriceCents`; a valid observation is one with a positive
listed price. Guidance thresholds (20 observations, 30 days coverage, within 3% of the 180-day
low for "exceptional") operate on that basis. The offer board shows the delivered total per
offer when known and "shipping unknown" otherwise, independent of the history basis.

---

## ADR-010: Web layer — hand-rolled Tailwind components, dynamic data pages, dependency-free chart

Status: Accepted

Date: 2026-07-23

Decision:
The Phase 5 public site is built with hand-rolled Tailwind components rather than shadcn/ui for
now. Data-driven pages are `export const dynamic = "force-dynamic"`, and the price-history chart
is a dependency-free inline SVG.

Reason:
- **shadcn/ui deferred**: the stack lists shadcn/ui, but its installer adds Radix dependencies
  and a component-registry workflow that is friction on Next 16 + Tailwind 4 + React 19. The MVP
  UI needs are simple (cards, badges, tables, a search box), and clean Tailwind delivers them
  now with zero setup risk. shadcn primitives can be layered in later where interactivity
  (dialogs, comboboxes) actually warrants them — the visual language already matches.
- **force-dynamic**: every catalog/offer page reflects live DB state, so static prerender is
  wrong and would also force a database connection at build time. Marking them dynamic keeps
  `next build` DB-free and data fresh.
- **Inline SVG chart**: avoids shipping a charting library for a single sparkline, keeps the
  bundle small, and renders fine server-side.

Alternatives:
(a) Run `npx shadcn init` now — rejected as premature setup cost for little MVP benefit.
(b) ISR/static pages with revalidation — deferred; adds cache-invalidation complexity before
there is meaningful traffic. (c) A chart library (Recharts/visx) — rejected for one sparkline.

Consequences:
Introducing shadcn/ui later is a non-breaking addition (same Tailwind tokens). If any page needs
static/ISR for performance, that is a per-page change. The chart component is intentionally
minimal and will grow (axes, tooltips) as real multi-point history accrues.

---

## ADR-011: Alerts are recorded first, delivered second

Status: Accepted

Date: 2026-07-23

Decision:
`runAlerts()` only *records* alerts as `alert_events` rows with
`delivery_status = 'pending'`. Sending email is a separate step that flips the row to `sent` or
`failed`. With no `RESEND_API_KEY`, `sendAlertEmail` returns `skipped` and the row stays
`pending` — we never mark an unsent alert as delivered.

Reason:
Splitting decision from delivery means a mail-provider outage or a crash mid-run can never lose
an alert or silently double-send one. The unique `deduplication_key` is the authoritative guard:
`onConflictDoNothing` turns a concurrent or repeated run into a no-op instead of a second
notification. It also lets the alert engine be fully tested with no mail provider configured.

Alternatives:
(a) Send inline during evaluation — rejected; a delivery failure would either lose the alert or
force a risky retry that can double-notify. (b) Treat a missing API key as success — rejected;
that would lie about delivery.

Consequences:
A pending queue exists (`listPendingAlerts`) and needs a delivery worker (wired when a Resend key
is added). Alerts fire at most once per rule per run; the cooldown
(`RULE_COOLDOWN_HOURS = 12`) plus the price-sensitive dedup key control frequency.

---

## ADR-012: Visual identity — warm editorial palette on semantic tokens

Status: Accepted

Date: 2026-07-23

Decision:
The UI uses a warm bone/ink palette with a single bronze accent and an editorial display serif
(Cormorant Garamond) for headings, wordmark and prices. All colour is expressed as **semantic
CSS variables** (`--canvas`, `--surface`, `--raised`, `--ink`, `--body`, `--muted`, `--faint`,
`--line`, `--accent`, plus `positive`/`caution`/`critical`) registered with Tailwind via
`@theme inline`. Components use tokens (`bg-surface`, `text-muted`, `border-line`) and carry
**no `dark:` variants**.

Reason:
The first pass was default Tailwind indigo-on-slate, which reads as a SaaS dashboard rather than
fragrance retail — a category whose visual language is warm neutrals, generous whitespace,
restraint and editorial serifs. Semantic tokens fix the deeper problem: with `dark:` variants
every colour decision had to be made and maintained twice, and dark mode had drifted to a cold
blue-black. One token set that flips at the `:root` level guarantees the two themes stay in sync
and halves the markup.

Alternatives:
(a) Keep per-utility `dark:` variants — rejected; duplicated intent and already drifting.
(b) A photographic/luxury-brand treatment — rejected for now; we have no product imagery rights,
and a type-and-space-led design degrades gracefully without images.
(c) Adopt shadcn/ui's default theme — rejected; the same generic look this ADR is correcting
(shadcn remains available for primitives, per ADR-010).

Consequences:
New components must use semantic tokens, never raw palette utilities (`slate-*`, `indigo-*`);
a raw-palette reference is now a review smell. Guidance and presentation badges are deliberately
muted — price guidance is advice, not a claim, so it must not read as promotional. Prices use
`tabular` figures so columns align. A visible `:focus-visible` ring is defined globally for
keyboard accessibility.

---

## ADR-013: Flanker-vs-concentration equivalence is evidence, never proof

Status: Accepted

Date: 2026-07-24

Decision:
When a canonical fragrance name is exactly a listing's fragrance name plus a suffix that **is**
the concentration both sides already agree on, the matcher treats them as the same product
instead of rejecting on `fragrance_contradiction`. Such a candidate is scored normally but is
**capped at `manual_review`** — `matchProduct` downgrades `exact` to `manual_review` and records
`inferred_equivalence_capped` in the audit trail.

Reason:
We model a concentration flanker as its own fragrance ("Gris Charnel Extrait", per ADR-005).
Retailers commonly publish the same bottle as fragrance "Gris Charnel" with concentration
"Extrait de Parfum". Neither modelling is wrong, but a literal name comparison rejects a listing
that is genuinely the same product — this blocked every FragranceNet flanker listing from
matching. The bridge is deterministic (no LLM, no fuzzy distance) and deliberately narrow: it
cannot invent a concentration, requires both sides to already agree on it, and cannot join two
names differing by anything else. Even so it is an *inference about modelling*, not observed
evidence, so auto-approving it would violate "never silently match uncertain variants".

Alternatives:
(a) Reject as before — rejected; loses real matches and leaves comparison pages empty.
(b) Auto-approve at `exact` — rejected; an inference is not proof, and a wrong bind would show
users a different concentration as the same product. (c) Fuzzy string distance between names —
rejected; non-deterministic in effect and would bridge genuinely different fragrances
("Reflection" vs "Reflection Man"). (d) Restructure the catalogue to store flankers as
concentrations — rejected; ADR-005's separation is what keeps EDP and Extrait price histories
distinct, and changing it would be a far larger change than the problem warrants.

Consequences:
Flanker listings now reach the review queue rather than being rejected, which makes the admin
review UI load-bearing for multi-retailer coverage. `CandidateEvaluation` gained
`requiresReview`; any future inferred equivalence should set it rather than inventing a second
capping mechanism. Observed in practice: the FragranceNet Gris Charnel Extrait listing reaches
review and additionally trips the ambiguity guard (tied between the retail and tester variants,
since FragranceNet does not publish a presentation) — both safeguards engaging as designed.

---

## ADR-014: Admin access is an allow-list that fails closed

Status: Accepted

Date: 2026-07-24

Decision:
`/admin/**` is gated by `isAdminEmail(email, process.env.ADMIN_EMAILS)` — a comma-separated
allow-list. An unset, empty or whitespace-only list grants **nobody** access. Every admin server
action calls `requireAdmin()` itself; the page-level check is not relied upon. An unauthorized
visitor gets a deliberately vague "Not available" page, and admin routes are `robots: noindex`.

Reason:
The security rules require every admin route and mutation to be authorization-gated. Server
actions are independently reachable over the network, so guarding only the page that renders the
buttons would leave the mutations open — the check has to live on the mutation. Failing closed
matters because the natural bug (treating an unset env var as "no restriction") would silently
publish the review queue on a fresh deployment.

Alternatives:
(a) Real RBAC with a roles table — deferred; correct eventually, but the allow-list is
sufficient for a single-operator MVP and much less to get wrong now. (b) Checking only in the
page — rejected as insecure. (c) A 404 for non-admins — the vague page is equivalent in what it
reveals and simpler than faking a not-found.

Consequences:
`ADMIN_EMAILS` must be set for anyone to reach the queue, and the operator must also hold an
account (auth supplies the email). Replacing this with RBAC later means changing `getAdminUser`
only. The predicate is pure and unit-tested, including the substring case
("me@example.com.evil.com" must not pass).


---

## ADR-015: The third retailer waits for an affiliate feed

Status: Accepted

Date: 2026-07-24

Decision:
No third retailer adapter is built from page scraping. FragranceX and Jomashop are both deferred
until a CJ affiliate feed is approved, and the retailer registry keeps them `enabled: false`.

Reason:
Both were probed and both are *permitted* to crawl — the blocker is data quality. FragranceX's
JSON-LD offers carry prices with **no size, sku or name**, so a price cannot be attributed to an
exact variant; ingesting it would attach prices to products we cannot prove they belong to, which
is precisely the silent corruption the matching rules exist to prevent. Jomashop renders its
listings client-side, and using Playwright merely to enumerate a catalogue is not the "static
retrieval is insufficient" case our retrieval priority reserves it for.

The feed solves the actual problem rather than working around it: FragranceX's CJ feed carries
UPC/MPN and explicit sizes, which is both a stronger matching signal than anything we parse today
and the missing attribution the page lacks.

Alternatives:
(a) Ingest FragranceX offers with `sizeMl: null` — rejected; every such listing would be
unmatchable, so it would add rows and no comparisons. (b) Infer size by pairing the offer prices
with the sizes mentioned in prose — rejected; ordering is an assumption, and a wrong pairing shows
a user the wrong price for a bottle. (c) Drive Jomashop with Playwright — rejected per retrieval
priority. (d) Pick a different fourth retailer instead — Nordstrom remains last by ADR-006
(most restrictive robots, likely client-rendered).

Consequences:
Multi-retailer coverage stays at two (Luckyscent, FragranceNet) until the CJ application is
approved — a business step outside the codebase. Worth noting for when it lands: FragranceX
publishes **real shipping** ($6.95, free over $49, 2–6 days), so it would be the first source
capable of producing a genuine delivered total rather than "plus unknown shipping".
