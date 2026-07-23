# Project Status

## Current Milestone

Phase 4 — Price history & ranking ✅ COMPLETE (next: Phase 5 — public website)

## Completed

- **Phase 0** — foundation (scaffold, docs, rules, ignore files, graphify, public repo). ✅
- **Phase 1** — database & canonical catalog: ✅
  - Dependencies: drizzle-orm, postgres (postgres.js), zod, dotenv; dev: drizzle-kit, tsx, vitest.
  - Zod env validation (`src/lib/env.ts`) — lazy, fails fast, doesn't break `next build`.
  - Full Drizzle schema (`src/db/schema/*`) — **13 tables**, 12 enums: brands, fragrances,
    product_variants, retailers, retailer_products, coupons, price_observations, watchlists,
    alert_rules, alert_events, scrape_runs, retailer_health, match_reviews.
  - Drizzle client (`src/db/client.ts`, pooler-safe: `prepare: false`) + `drizzle.config.ts`.
  - Generated migration `drizzle/migrations/0000_far_moonstone.sql` (money = integer cents;
    all timestamps `timestamptz`; `canonical_sku` unique; append-only observations documented).
  - Package scripts: db:generate, db:migrate, db:studio, db:seed, catalog:validate, test.
  - **Verified catalog dataset** (`src/db/seed/catalog.ts`): 13 brands, 19 fragrances,
    **52 variants** — retail/tester/refill, flanker (Bal d'Afrique/Absolu, Gris Charnel/Extrait)
    and concentration (L'Homme Idéal EDT/EDP) separation. Specs verified against official brand
    sites + authorized retailers. Added `absolu` concentration (migration `0001`).
  - Idempotent seed (`scripts/seed-catalog.ts`, upsert on canonical_sku), catalog validation
    (`scripts/validate-catalog.ts`), slug/SKU helpers (`src/lib/catalog-slug.ts`), Vitest config
    + 11 passing catalog tests.

- **Phase 2 (started early, retailer-agnostic only):** adapter contract
  (`src/domain/retailers/`) — Zod schemas for raw listing / raw page / parsed product /
  health result, plus the `RetailerAdapter` interface and retrieval-priority doc. 9 contract
  tests enforce integer-cents money, unknown-shipping (null) vs free (0), nullable stock, and
  presentation validity.

- **Phase 2** — retailer framework & first adapter: ✅
  - Shared helpers: `http.ts` (bounded retries, full-jitter backoff, timeouts, per-host rate
    limit, honest UA), `json-ld.ts` (malformed-block-tolerant extraction), `money.ts`
    (float-safe cents, `"US"`→`USD`), `size.ts` (ml/oz parsing).
  - **Luckyscent adapter** — static HTTP + JSON-LD `ProductGroup`; discovery via sitemap;
    health check. Shipping is not published there, so it always reports `null` (UNKNOWN).
  - Sanitized fixture + 14 parser tests (incl. a deliberately malformed JSON-LD block).
  - Ingestion service: scrape-run logging, retailer-health tracking, append-only observations.
    A fetch/parse failure never writes a fabricated out-of-stock row.
  - `src/domain/pricing/delivered-price.ts` implements ADR-003 with 7 tests.
  - CLI: `npm run retailer -- --url <u> | --discover <n> | --health`.
  - Retailer registry seeded; only access-verified retailers are `enabled`.

- **Phase 4** — price history & ranking: ✅
  - Pure modules (`src/domain/pricing/`, no DB): `history.ts` (30/90/180-day lows, medians,
    percentile, all-time low, stock transitions, coverage, freshness), `guidance.ts`
    (exceptional/good/normal/expensive/insufficient-history), `ranking.ts` (delivery-aware —
    in-stock and known-delivered beat a cheaper unknown-shipping offer), `coupons.ts` (only
    `verified` coupons discount the total).
  - Metric basis is listed price (ADR-009); ranking uses the delivered total when known.
  - Duplicate prevention: re-observing an unchanged offer creates no new observation (verified
    live — re-ingest produced 0 observations) while staying strictly append-only.
  - DB layer `offers.ts` → `getVariantOfferBoard(sku)`: ranked offers + metrics + guidance for
    one variant, never mixing sizes/concentrations/presentations.
  - CLI: `npm run prices -- --variant <sku>`.
  - 33 new calculation tests (history/guidance/ranking/coupons).
  - **Live proof**: approved the Gris Charnel 100ml review via the admin API → offer board shows
    listed $290, delivered "—" (shipping unknown, never fabricated), guidance
    `insufficient_history` (only 3 observations). Exactly the intended honest behaviour.

- **Phase 3** — exact product matching: ✅
  - `src/domain/matching/`: normalization (accent/apostrophe-safe), alias dictionaries
    (MFK/PDM/LeLabo/By Kilian; EDP/EDT/extrait/absolu), oz→ml conversion with a 2ml tolerance,
    presentation classification, body-product detection.
  - Contradiction checks reject outright: brand, fragrance, flanker, concentration, size,
    presentation, and body-product. Contradictions are absolute — never outweighed by score.
  - Confidence scoring per spec (brand .25 / fragrance .30 / flanker .15 / concentration .10 /
    size .10 / presentation .10); ≥.95 exact, .80–.94 manual review, below unmatched.
  - **Ambiguity guard**: two candidates within 0.001 force manual review — ties are never
    broken by guessing.
  - Every decision carries an auditable reason list; `method` is always `deterministic`.
  - Manual-review API (`review.ts`): apply decision, list pending, approve (with override),
    reject. Admins correct matches through these, never by editing the DB.
  - CLI: `npm run match [-- --all|--dry-run|--reviews]`.
  - 23 matching tests covering every "never combine" rule.

- **Live database (Supabase) provisioned and verified:**
  - `db:migrate` applied — 13 tables + 12 enums live.
  - `db:seed` loaded 13 brands / 19 fragrances / **52 variants**.
  - **Idempotency proven** — re-running the seed left counts identical (52/52) with
    0 duplicate SKUs.
  - Separation rules verified in-database: Kilian Angels' Share 50ml exists as three distinct
    rows (retail / tester / refill); Bal d'Afrique vs Bal d'Afrique Absolu are separate
    fragrances. Presentation split: retail 32 / tester 19 / refill 1.
  - Hardened env resolution (`isUsablePostgresUrl`, `resolveMigrationUrl`): placeholder
    connection strings are ignored, and Supabase session mode (5432) is derived from the
    transaction pooler (6543) for DDL. 9 regression tests cover it.

## In Progress

- Nothing blocking. Phase 4 delivered and verified end-to-end against live data.

## Next Tasks

1. **Phase 5 — public website**: homepage, search, fragrance pages, exact-variant pages,
   comparison tables, price-history charts, deals, restocks, responsive layout, SEO, E2E tests.
   The offer board (`getVariantOfferBoard`) already provides the data each variant page needs.
2. Then FragranceNet adapter (adds discount pricing + tester coverage), which will give the
   matcher a published concentration and multi-retailer offers to actually rank.

## Known Issues

- Node 23 EBADENGINE warning (transitive ESLint dep); 3 inherited npm-audit advisories from the
  Next 16 scaffold — not force-fixed to avoid breaking changes.

## Decisions Needed

- None outstanding.

## Latest Validation

- Typecheck: PASS (exit 0)
- Lint: PASS (0 errors, 0 warnings)
- Build: PASS (exit 0)
- DB generate: PASS — `drizzle-kit generate`, 13 tables + migration 0001
- Catalog validate: PASS — 13 brands / 19 fragrances / 52 variants / 52 unique SKUs
- Unit tests: PASS — Vitest, **113/113** (catalog, slug, contracts, env, money/size/JSON-LD
  helpers, Luckyscent fixture parser, delivered price)
- Live ingest: PASS — Luckyscent, 3 variants parsed, 3 observations, run status `success`,
  health `healthy=true`; re-run proved observations append-only (3 → 6, listings stayed 3)
- Live matching: PASS — 52 candidates vs 3 listings → 1 manual_review (100ml, confidence 0.90,
  concentration not published) + 2 rejected (10ml/1ml on size contradiction). Exactly the
  intended conservative behaviour.
- DB migrate: PASS — applied to Supabase (13 tables, 12 enums)
- DB seed: PASS — 52 variants; re-run idempotent (0 duplicate SKUs)
- Integration/e2e tests: not yet wired (Phase 2+/5+)

## Last Graphify Update

2026-07-22 — code graph refreshed after Phase 1 close (AST-only; docs still pending a semantic key).

## Latest GitHub Commit

- Hash: (this commit) feat(catalog): complete Phase 1 — live migrate + idempotent seed
- Message: feat(catalog): complete Phase 1 with live Supabase migrate and seed
- Branch: main
- Push status: pushed to origin/main
- Remote: https://github.com/aaronbarke/ScentScout (public)
