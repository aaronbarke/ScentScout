# ScentScout — Price Engine

Computes the estimated delivered price, historical metrics, and buy-now guidance from
**append-only** `price_observations`, over **comparable variants only**. Money is integer cents;
time is UTC.

## Estimated delivered price (before tax)

```
estimated delivered price before tax
  = listed price
  − verified coupon discount
  + required shipping
```

Rules:

- Only **verified** coupons affect this primary total.
- If required **shipping is unknown**, do **not** compute a delivered total. Display the listed
  price with an explicit note, e.g. `$219 plus unknown shipping`.
- Never assume unknown shipping is free. Never present this pre-tax estimate as an exact
  checkout total.

## Historical metrics

Computed per comparable variant from valid observations:

- Current price
- 30-day low · 90-day low · 180-day low · all-time tracked low
- 30-day median · 90-day median
- Current price percentile
- Number of observations
- Number of stock transitions
- Data freshness (age of the latest observation)

## Buy-now guidance labels

- **Exceptional price** — within 3% of the tracked 180-day low **and** data confidence is high.
- **Good price** — in the lowest 25% of tracked valid prices.
- **Normal price** — between the 25th and 70th percentile.
- **Expensive** — above the 70th percentile.
- **Insufficient history** — fewer than 20 valid observations, or less than 30 days of coverage.

Add delivery context, e.g.:

- "Good price, fast delivery"
- "Exceptional price, slow dispatch"
- "Normal price, only retailer currently in stock"

Guidance is presented as guidance, **never as certainty**.

## Ranking

Offers are ranked delivery-aware — the cheapest advertised price is **not** automatically best.
Ranking accounts for delivered price, delivery speed, stock state, data freshness, match
confidence, and retailer type. Different sizes/concentrations/presentations are never mixed in a
comparison.

## Data integrity

- Observations are append-only and duplicate-prevented at ingestion.
- Metrics use only comparable variants and valid observations.
- Alerts never fire from stale, uncertain, or invalid observations.

> Changing the definition of delivered price, or adding tax estimates, requires an ADR in
> `docs/DECISIONS.md`.
