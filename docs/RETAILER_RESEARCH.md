# Retailer Access Research (Phase 2)

Evidence gathered 2026-07-22 to satisfy the rule: *confirm permitted and stable retrieval
before implementing each adapter*. No adapter is written against a retailer until it appears
here with a permitted verdict.

Method: read each site's `robots.txt` (the machine-readable crawl policy), check for an
affiliate/product feed (top of our retrieval priority), and inspect one live product page for
structured data (JSON-LD).

## Summary

| Retailer | Type | robots.txt (product pages) | Affiliate feed | Structured data | Verdict |
| --- | --- | --- | --- | --- | --- |
| **Luckyscent** | authorized_boutique | Allowed | Yes (program exists) | **ProductGroup + GTIN-13 + explicit size** | ✅ Best data — **recommended first** |
| **FragranceNet** | gray_market_discounter | Allowed | Rakuten, product feeds | JSON-LD Product (quirky) | ✅ Permitted — recommended second |
| **FragranceX** | gray_market_discounter | (not yet checked) | **CJ, daily feed w/ UPC+MPN** | not yet checked | ✅ Best feed — pending robots check |
| **Jomashop** | gray_market_discounter | Allowed | CJ, product feeds | not yet checked | ✅ Permitted |
| **Nordstrom** | department_store | Base `/s/` allowed; `/s/*/*/full*`, `/s/*/*/lite*` disallowed | Rakuten feed | not yet checked | ⚠️ Permitted but most restrictive |

**No candidate had a blanket `Disallow: /`.** None required bypassing any protection.

## Evidence

### Luckyscent — authorized boutique (Shopify)

- `robots.txt`: disallows admin/cart/checkout/filtered-sort URLs only; **product pages allowed**.
  Some SEO bots (BLEXBot, AwarioRssBot, LinkUpBot) are fully banned; AhrefsBot gets
  `Crawl-delay: 10`. General crawlers are not restricted. Sitemap published.
- `/products/<handle>.json` (Shopify's product endpoint) returns **404** — disabled by the
  merchant. We must not try to work around that; JSON-LD is the supported path.
- JSON-LD on `/products/gris-charnel-by-bdk-parfums` is excellent:

  ```
  ProductGroup  name="Gris Charnel"  brand="BDK Parfums"   (3 variants)
    100ml             sku 856003     gtin13 3760035450184  USD 290.00  InStock
    10ml Travel Size  sku 856003_R   gtin13 3760035450559  USD  60.00  InStock
    1ml spray         sku 856003_S   gtin  null            USD   6.00  InStock
  ```

- Why this matters: **brand is cleanly separated** from fragrance name, **size is an explicit
  field** (no oz→ml guessing), and **GTIN-13 is present** — a near-decisive signal for exact
  variant matching. Prices are correct `USD`.
- Caveat: carries the niche houses in our catalog (BDK, Xerjoff, Amouage, Initio) but, as an
  authorized boutique, **does not sell testers** — so tester variants need a discounter.
- Caveat: the 10ml/1ml entries are travel/decant sizes that are **out of MVP scope**; the
  matching engine must reject them against our 100ml retail variant (size contradiction).

### FragranceNet — gray-market discounter

- `robots.txt`: disallows `/ni/`, `/all/`, `/corpdisc/`, `/newsletter/`, `/wsdata/`, `/signup`,
  `/search`. **Product pages allowed.** No crawl-delay, no blanket disallow. Sitemap published.
- Affiliate: **Rakuten Advertising**; approved affiliates get banners, text links, and
  **product data feeds**. Commission 1–5%, 10-day cookie.
- JSON-LD on the MFK Grand Soir page parses, but with **real quirks to handle**:

  ```
  name        "Maison Francis Kurkdjian Grand Soir Eau De Parfum Spray 2.4 oz"
  brand.name  "Maison Francis Kurkdjian Grand Soir"   <-- brand polluted with fragrance name
  sku         "295309"
  offers      price 459.99  priceCurrency "US"        <-- NOT a valid ISO code (should be USD)
              availability InStock, itemCondition NewCondition
  gtin/mpn    null
  ```

  So the adapter must: normalize `"US"` → `"USD"`; **not trust `brand.name`** (parse brand from
  the title instead); convert oz → ml (`2.4 oz` ≈ 70 ml, which matches our Grand Soir 70ml
  variant). These belong in the FragranceNet adapter only — never in shared domain code.
- Value: carries **testers**, which our catalog models as first-class variants.

### Jomashop — gray-market discounter

- `robots.txt`: disallows admin/customer/checkout/search paths (`/app/`, `/customer/`,
  `/checkout/`, `/search?*`, `/*.php$`, …). **Product pages allowed.** No crawl-delay, no
  blanket disallow. Sitemap published.
- Affiliate: **CJ Affiliate**, with product feeds.

### FragranceX — gray-market discounter

- Affiliate: **CJ Affiliate**, described as having an optimized **daily-updated product feed**
  including titles, descriptions, images, **UPCs, MPNs**, brand and category data.
- UPC/MPN would be the single strongest matching signal available. **robots.txt and page
  structure still to be checked** before any adapter work.

### Nordstrom — department store

- `robots.txt`: no blanket disallow, but the **most restrictive** of the set — blocks
  `/s/*/*/full*`, `/s/*/*/lite*`, `/s/*/write-review*`, `/s/*/sizeAndFitInfo*`, plus checkout,
  account and many API endpoints. Base product pages under `/s/` appear allowed.
- Affiliate: **Rakuten Advertising** feed, whose required fields map well to our model (product
  name, URL, image, retail price, SKU, in-stock flag, currency).
- Heavy client-side rendering is likely, which would push us toward Playwright — explicitly the
  last resort in our retrieval priority. Defer.

## Recommendation

1. **First adapter: Luckyscent.** Best structured data by a wide margin (ProductGroup, GTIN-13,
   explicit size, correct currency), robots-permitted, static-HTML/JSON-LD retrieval — no
   browser automation needed — and it carries the niche houses already in our catalog. It gives
   the matching engine its strongest possible signal to be validated against first.
2. **Second: FragranceNet.** Adds discount pricing and **tester** coverage, and its messy
   JSON-LD is a realistic stress test for normalization (oz→ml, bad currency code, polluted
   brand field).
3. **Third: FragranceX or Jomashop** — decide once the affiliate feed is approved; FragranceX's
   UPC/MPN feed is the more valuable if granted.
4. **Last: Nordstrom** — most restrictive robots rules and likely browser-rendered.

## Standing constraints

- Affiliate feeds require **application and approval** (a business step). Until approved, use
  polite static retrieval of pages robots.txt permits: bounded retries, timeouts, rate limits,
  jitter, and a descriptive user agent.
- Never bypass CAPTCHAs, auth, access controls, or anti-bot measures. Luckyscent's disabled
  `.json` endpoint is treated as "not available", not as something to route around.
- Re-check `robots.txt` before enabling any new retailer, and record the verdict here.
