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

## In Progress

- Idempotent catalog seed (~40–50 verified exact variants) + `scripts/seed-catalog.ts`.
- `scripts/validate-catalog.ts` and DB/schema tests (Vitest).
- **Blocked on user:** live `db:migrate` + `db:seed` run — waiting for Supabase connection
  strings in `.env` (`DATABASE_URL`, `DIRECT_URL`). Schema is validated by typecheck + generate.

## Next Tasks

1. Assemble the verified catalog dataset (brands → fragrances → variants; retail + tester).
2. Write idempotent seed (upsert on `canonical_sku`) + catalog validation + tests.
3. Once `.env` is set: `npm run db:migrate` then `npm run db:seed`; verify idempotency.
4. Close Phase 1; commit `feat(catalog): add canonical fragrance database`.

## Known Issues

- Node 23 EBADENGINE warning (transitive ESLint dep); 3 inherited npm-audit advisories from the
  Next 16 scaffold — not force-fixed to avoid breaking changes.

## Decisions Needed

- None outstanding.

## Latest Validation

- Typecheck: PASS (exit 0)
- Lint: PASS (0 errors, 0 warnings)
- Build: PASS (exit 0)
- DB generate: PASS — `drizzle-kit generate`, 13 tables
- DB migrate/seed: PENDING — needs Supabase `.env`
- Unit/integration/e2e tests: in progress (Vitest wiring)

## Last Graphify Update

2026-07-22 — code graph 294 nodes / 299 edges / 38 communities (AST-only; docs still pending a
semantic key).

## Latest GitHub Commit

- Hash: 38f473e (pre-schema; updated on next push)
- Message: chore(dev): run dev/start server on port 3004
- Branch: main
- Push status: pushed to origin/main
- Remote: https://github.com/aaronbarke/ScentScout (public)
