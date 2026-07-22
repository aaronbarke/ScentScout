# ScentScout — Retailer Adapters

Each retailer is integrated through an adapter under `src/retailers/<retailer>/`. All
retailer-specific selectors, URL patterns, and quirks live there and **never** in shared domain
code. Cross-cutting fetch/parse helpers live in `src/retailers/shared/`.

## Interface

```ts
export interface RetailerAdapter {
  readonly retailerSlug: string;

  discoverProducts(input: DiscoveryInput): Promise<RawRetailerListing[]>;
  fetchProduct(input: ProductFetchInput): Promise<RawRetailerProductPage>;
  parseProduct(input: RawRetailerProductPage): Promise<ParsedRetailerProduct>;
  healthCheck(): Promise<RetailerHealthResult>;
}
```

## Normalized output (`ParsedRetailerProduct`)

```ts
export interface ParsedRetailerProduct {
  externalId: string | null;
  url: string;
  rawTitle: string;
  brand: string | null;
  fragranceName: string | null;
  flankerName: string | null;
  concentration: string | null;
  sizeMl: number | null;
  presentation: "retail" | "tester" | "refill" | "unboxed" | "gift_set" | null;
  condition: "new" | null;
  listedPriceCents: number | null;
  currency: string;
  inStock: boolean | null;
  stockText: string | null;
  shippingPriceCents: number | null;
  shippingDaysMin: number | null;
  shippingDaysMax: number | null;
  shippingText: string | null;
  observedAt: Date;
}
```

Raw and parsed shapes are validated with Zod.

## Retrieval priority

Prefer static retrieval over browser automation:

1. Affiliate / retailer-supported product feed
2. JSON-LD
3. Embedded page JSON
4. Static HTML selectors (Cheerio)
5. Playwright — **only** when static HTTP retrieval is insufficient
6. Manual data entry / temporarily disabling the retailer

## Operational rules

- Bounded retries, timeouts, rate limits, and jitter. Be a polite client.
- **Never bypass CAPTCHAs, authentication, access controls, or anti-bot protections.** Confirm a
  retailer permits stable retrieval before building its adapter.
- **A fetch/parse failure is not proof of out-of-stock.** Record it in `scrape_runs` /
  `retailer_health`; never emit a fabricated "out of stock" observation.
- Preserve original source evidence (`rawTitle`, `raw_brand`, `raw_description`) for auditing.
- Money as integer cents; timestamps in UTC.

## Testing

Every adapter ships fixture-based parser regression tests using **saved, sanitized** fixtures in
`tests/fixtures/retailers/`. Tests never hit live retailer sites. Strip secrets/PII/auth tokens
from fixtures before committing.

## MVP retailers

Four US retailers (Phase 7). Candidate retailers must be confirmed to permit stable, allowed
retrieval before an adapter is built — do not assume a given retailer is technically accessible.
Each adapter is committed separately when practical.
