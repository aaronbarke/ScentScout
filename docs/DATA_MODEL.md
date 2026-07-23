# ScentScout — Data Model

Canonical entities. **Money = integer cents. Time = UTC (`timestamptz`).** Implemented with
Drizzle; every change ships as a migration in `drizzle/migrations/`. (Schema itself lands in
Phase 1.)

## Catalog

### `brands`
`id` · `name` · `slug` · `normalized_name` · `official_url` · `created_at` · `updated_at`

### `fragrances` (the fragrance family)
`id` · `brand_id` → brands · `name` · `slug` · `flanker_name` · `release_year` · `image_url` ·
`created_at` · `updated_at`

### `product_variants` (an exact comparable product)
`id` · `fragrance_id` → fragrances · `concentration` · `size_ml` · `presentation` · `condition`
· `gender_marketing` · `canonical_sku` · `created_at` · `updated_at`
- **`presentation` ∈ { retail, tester, refill, unboxed, gift_set }** — never combined.
- `canonical_sku` is a stable natural key used for idempotent seeding.

## Retailers & listings

### `retailers`
`id` · `name` · `slug` · `base_url` · `retailer_type` · `affiliate_program` · `enabled` ·
`trust_score` · `default_shipping_policy` · `created_at` · `updated_at`
- **`retailer_type` ∈ { official_brand, department_store, authorized_boutique,
  gray_market_discounter, marketplace, decant_store }**

### `retailer_products`
`id` · `retailer_id` → retailers · `external_id` · `url` · `raw_title` · `raw_brand` ·
`raw_description` · `gtin` · `parsed_fragrance_name` · `parsed_concentration` ·
`parsed_size_ml` · `parsed_presentation` · `matched_variant_id` → product_variants ·
`match_status` · `match_confidence` · `match_method` · `last_seen_at` · `created_at` ·
`updated_at`
- `parsed_*` hold what the adapter extracted (ADR-008), so matching compares clean attributes
  instead of re-deriving them from `raw_title`.
- **`match_status` ∈ { exact, probable, manual_review, rejected, unmatched }**
- Retains raw evidence (`raw_*`) so matches stay auditable.

### `price_observations` — **append-only**
`id` · `retailer_product_id` → retailer_products · `listed_price_cents` ·
`coupon_discount_cents` · `shipping_price_cents` · `estimated_delivered_price_cents` ·
`currency` · `in_stock` · `stock_text` · `shipping_days_min` · `shipping_days_max` ·
`shipping_text` · `coupon_id` → coupons · `observed_at` · `source_run_id` → scrape_runs
- Never updated or deleted. `estimated_delivered_price_cents` is null when required shipping is
  unknown (the UI shows "plus unknown shipping" instead of a fabricated total).

### `coupons`
`id` · `retailer_id` → retailers · `code` · `discount_type` · `discount_value` ·
`minimum_order_cents` · `maximum_discount_cents` · `starts_at` · `expires_at` ·
`last_verified_at` · `verification_status` · `created_at` · `updated_at`
- **`verification_status` ∈ { verified, reported, expired, invalid, unknown }**
- **Only `verified` coupons may affect the primary delivered-price calculation.**

## Users, watchlists & alerts

### `watchlists`
`id` · `user_id` · `product_variant_id` → product_variants · `created_at`

### `alert_rules`
`id` · `user_id` · `product_variant_id` → product_variants · `maximum_delivered_price_cents` ·
`retailer_ids` · `presentation` · `maximum_shipping_days` · `require_verified_coupon` ·
`require_exact_match` · `enabled` · `last_triggered_at` · `created_at` · `updated_at`

### `alert_events`
`id` · `alert_rule_id` → alert_rules · `price_observation_id` → price_observations ·
`delivery_status` · `deduplication_key` · `created_at` · `sent_at`
- `deduplication_key` prevents duplicate notifications for the same condition.

## Operations & health

### `scrape_runs`
`id` · `retailer_id` → retailers · `started_at` · `completed_at` · `status` ·
`pages_attempted` · `pages_succeeded` · `products_found` · `observations_created` ·
`error_summary`

### `retailer_health`
`retailer_id` → retailers · `last_success_at` · `consecutive_failures` · `success_rate_24h` ·
`parser_version` · `disabled_reason` · `updated_at`

### `match_reviews`
`id` · `retailer_product_id` → retailer_products · `suggested_variant_id` → product_variants ·
`original_confidence` · `review_status` · `reviewed_by` · `review_notes` · `created_at` ·
`reviewed_at`

## Invariants

- Presentations never mix; body products never mix with fragrances.
- Price observations are append-only; corrections are new rows.
- Only verified coupons affect the primary delivered total.
- Delivered total is omitted when required shipping is unknown.
- Every offer carries an `observed_at` for freshness; matches carry confidence + method.
