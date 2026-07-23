# Project Status

## Current Milestone

Phase 1 — Database & canonical catalog (IN PROGRESS)

## Completed

- **Phase 0** — foundation (scaffold, docs, rules, ignore files, graphify, public repo). ✅
- **Phase 1 so far:**
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

## In Progress

- **Blocked on user:** live `db:migrate` + `db:seed` run — waiting for Supabase connection
  strings in `.env` (`DATABASE_URL`, `DIRECT_URL`). All Phase 1 *code* is validated (typecheck,
  lint, build, generate, catalog:validate, tests); only the live DB run remains.

## Next Tasks

1. Once `.env` is set: `npm run db:migrate` then `npm run db:seed`; re-run seed to confirm
   idempotency (no duplicates); optionally spot-check with `npm run db:studio`.
2. Close Phase 1; final commit `feat(catalog): add canonical fragrance database`.
3. Begin Phase 2 — retailer adapter framework + first adapter.

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
- Unit tests: PASS — Vitest, 11/11 (catalog + slug helpers)
- DB migrate/seed: PENDING — needs Supabase `.env`
- Integration/e2e tests: not yet wired (Phase 2+/5+)

## Last Graphify Update

2026-07-22 — code graph 318 nodes / 346 edges / 39 communities (AST-only; docs still pending a
semantic key).

## Latest GitHub Commit

- Hash: 38f473e (pre-schema; updated on next push)
- Message: chore(dev): run dev/start server on port 3004
- Branch: main
- Push status: pushed to origin/main
- Remote: https://github.com/aaronbarke/ScentScout (public)
