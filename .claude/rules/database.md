# Rules: Database (`src/db/**`, `drizzle/**`)

- **Drizzle is the single source of truth for schema.** Define tables in `src/db/schema`,
  generate SQL migrations into `drizzle/migrations/`, and apply them. Never hand-edit the
  database structure outside a migration, and never change a table without a migration.
- **Money is integer cents** — use `integer` (or `bigint` where needed) columns named
  `*_cents`. Never store money as `numeric`/`real`/`float`. **Time is UTC** — use
  `timestamp with time zone`; store and compare in UTC.
- **`price_observations` is append-only.** No `UPDATE`/`DELETE` of historical rows in app
  code. Corrections are new observations, never overwrites.
- Encode enums explicitly and keep them in sync with the domain:
  - `product_variants.presentation`: `retail | tester | refill | unboxed | gift_set`
  - `retailer_products.match_status`: `exact | probable | manual_review | rejected | unmatched`
  - `retailers.retailer_type`: `official_brand | department_store | authorized_boutique |
    gray_market_discounter | marketplace | decant_store`
  - `coupons.verification_status`: `verified | reported | expired | invalid | unknown`
- Seeds must be **idempotent** — safe to run repeatedly (upsert on a stable natural key /
  `canonical_sku`, never blind insert).
- Validate all env config (`DATABASE_URL`, `DIRECT_URL`, …) with Zod at startup; fail fast on
  missing/invalid values.
- Keep retailer-specific concerns out of the schema layer — the schema is domain-canonical.
