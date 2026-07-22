# ScentScout — Roadmap

Work proceeds in phases. **Do not begin a phase until the previous phase passes its acceptance
criteria and has been committed and pushed to GitHub.** Each phase ends with: run validation →
update docs → refresh Graphify → commit → push → report commit hash.

## Phase 0 — Project foundation ✅ (in progress)

Next.js scaffold · Git repo · GitHub remote · Graphify install + initial graph · `CLAUDE.md` ·
`.claude/rules/` · `docs/*` · `.gitignore` / `.claudeignore` / `.graphifyignore` · initial
commit. **No product features.**
Commit: `chore(project): initialize ScentScout foundation`.

## Phase 1 — Database & canonical catalog

PostgreSQL + Drizzle · env validation (Zod) · schema · migrations · initial brands · fragrance
families · ~40–50 exact variants · idempotent seed script · catalog validation script · DB
tests. Seed must be safe to run repeatedly.
Commit: `feat(catalog): add canonical fragrance database`.

## Phase 2 — Retailer framework & first adapter

Shared adapter interface · raw + parsed Zod schemas · first retailer adapter · static retrieval
· JSON-LD parsing · saved fixtures · parser tests · scrape-run logging · retailer-health
tracking · one-product URL CLI. **One retailer only.**
Commit: `feat(retailers): add first retailer ingestion adapter`.

## Phase 3 — Exact product matching

Normalization · alias dictionaries · unit conversion · presentation classification ·
contradiction checks · confidence scoring · match audit info · manual-review APIs · matching
tests.
Commit: `feat(matching): implement exact fragrance variant matching`.

## Phase 4 — Price history & ranking

Append-only observations · duplicate prevention · coupon verification · shipping-aware pricing ·
historical metrics · buy-now guidance · delivery-aware ranking · calculation tests.
Commit: `feat(pricing): add delivered-price history engine`.

## Phase 5 — Public website

Homepage · search · fragrance pages · exact-variant pages · comparison tables · price-history
charts · deals · restocks · responsive layout · SEO metadata · E2E tests.
Commit: `feat(web): build public fragrance comparison experience`.

## Phase 6 — Accounts & alerts

Supabase auth · watchlists · detailed alert rules · alert evaluation · Resend emails ·
deduplication · alert history · unsubscribe · notification settings · alert tests.
Commit: `feat(alerts): add watchlists and price notifications`.

## Phase 7 — Four retailers & admin tools

Four working adapters · protected admin interface · match-review tools · coupon review ·
retailer-health dashboard · stale-listing handling · failed-scrape diagnostics · manual URL
submission. Commit each adapter separately when practical. Confirm permitted, stable retrieval
before implementing each adapter.
Commits: `feat(retailers): add <name> adapter` · `feat(admin): add retailer operations dashboard`.

## Phase 8 — Launch & monetization

Affiliate-link support · outbound click tracking · affiliate disclosure · privacy policy ·
terms · analytics · Sentry · deployment config · sitemap · search indexing · email onboarding.
Commit: `feat(launch): add production and affiliate infrastructure`.

## Acceptance (MVP definition of done)

See `PRODUCT_SPEC.md` → "Definition of done (MVP)".
