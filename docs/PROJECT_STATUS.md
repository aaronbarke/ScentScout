# Project Status

## Current Milestone

Phase 1 — Database & canonical catalog ✅ COMPLETE (next: Phase 2)

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

- Nothing blocking. Phase 2 underway: adapter contract landed; retailer access research
  complete (`docs/RETAILER_RESEARCH.md`, ADR-006) — Luckyscent selected as first adapter.

## Next Tasks

1. Phase 2 first adapter: **Luckyscent** (JSON-LD, static retrieval) — shared fetch helpers
   (rate limit/retry/timeout/jitter), JSON-LD parsing, sanitized fixtures, parser tests,
   scrape-run logging, retailer-health tracking, single-URL CLI.
2. Then FragranceNet (adds discount + tester coverage).

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
- Unit tests: PASS — Vitest, 29/29 (catalog, slug helpers, retailer contracts, env resolution)
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
