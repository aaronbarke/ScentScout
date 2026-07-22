# ScentScout — Product Spec

## Purpose

ScentScout helps fragrance shoppers determine:

- Where to purchase an **exact** fragrance variant.
- Its **actual cost** after verified discounts and required shipping (before tax).
- How quickly it is expected to arrive.
- Whether the current price is historically attractive.
- Whether to buy now or wait.
- When a specific fragrance returns to stock or reaches a target price.

It must be more useful than a basic fragrance price-comparison website.

## Primary differentiators

1. Exact matching of brand, fragrance, flanker, concentration, size, presentation, and condition.
2. Retail bottles, testers, refills, unboxed products, gift sets, and body products are **never
   silently combined**.
3. Estimated delivered price **before tax** includes verified discounts and required shipping.
4. Delivery estimates and data freshness are shown in retailer comparisons.
5. Users can create highly specific price and restock alerts.
6. Buy-now guidance is transparent and based on real price history.
7. Low-confidence or ambiguous matches go to an admin review queue.
8. The cheapest advertised price is **not** automatically the best purchase.

## Permanent product rules (must never be violated)

- Never silently match uncertain fragrance variants.
- Never combine tester and retail prices.
- Never combine refills and complete bottles.
- Never combine gift sets and individual bottles.
- Never combine body products and fragrances.
- Never assume unknown shipping is free.
- Never apply an unverified coupon to the primary displayed total.
- Never describe a pre-tax estimate as an exact checkout total.
- Never overwrite historical price observations.
- Never treat a parser failure as proof that a product is out of stock.
- Never hide stale data or uncertain matches from the user.
- Never bypass CAPTCHAs, authentication, access controls, or retailer protections.
- Never place retailer-specific parsing logic in shared domain code.
- Never use an LLM as the sole authority for a production product match.
- Never add features outside the active roadmap phase without documenting the decision.
- Never change the database schema without a migration.
- Never add a dependency without explaining its purpose.
- Never expose admin functionality without authorization.
- Never send alerts from stale, uncertain, or invalid observations.
- Never commit code that has not passed relevant validation.

## MVP scope

**In:** US retailers · USD · new products · ~40–50 canonical variants · four retailers · retail
and tester as separate variants · exact product comparison · price history · delivery-aware
rankings · buy-now guidance · user accounts · watchlists · email alerts · admin review tools ·
affiliate-link support · mobile-responsive pages.

**Out (initially):** native mobile apps · international pricing · used fragrances · social
reviews · collection sharing · AI fragrance recommendations · automatic per-ZIP tax estimates ·
ML price prediction · hundreds of retailers · full sample/decant comparison · marketplace
seller listings.

## Public surfaces

Homepage · search results · fragrance family pages · exact product-variant pages · retailer
pages · deals page · recent-restocks page · login/account · watchlist · alert management ·
alert history.

Every current offer must show: retailer · exact matched variant · listed price · verified
discount · shipping cost or unknown status · estimated delivered price before tax · estimated
delivery range · stock state · observation timestamp · data freshness · match confidence ·
retailer type. Users must never accidentally compare different sizes, concentrations, or
presentations. Exact-variant URLs are stable and indexable, e.g.
`/fragrances/le-labo-another-13/edp-100ml-retail`.

## Admin surfaces (authorization-gated)

Unmatched listings · ambiguous matches · match approvals/rejections · parser failures ·
retailer health · coupon verification · duplicate products · stale listings · scrape-run
details · manual product URL submission · adapter run controls · disabled-retailer management.
Admins correct matching errors through tools, never by directly editing the database.

## Definition of done (MVP)

≥40 exact variants · four retailers producing valid observations · ≥90% of supported listings
match correctly · every uncertain match enters manual review · testers/retail and refills/
bottles always separated · append-only observations · coupons have verification states ·
shipping included or explicitly unknown · every offer shows freshness · history uses only
comparable variants · detailed alerts with dedup · retailer failures visible to admins · every
adapter has fixture-based tests · mobile-usable · outbound clicks tracked · affiliate
disclosures shown · no secrets/private data in git history · all production validation passes ·
all completed work committed and pushed.
