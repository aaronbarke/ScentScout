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
