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

#### Phase 7 adapter build (2026-07-24) — corrections to the corrections

Building the adapter disproved two claims made in the 2026-07-23 note below. Recorded here
because the earlier note is wrong and would mislead:

- **The same URL alternates between two JSON-LD shapes across requests.** Repeated fetches of
  the identical Amouage URL returned, on different attempts, a bare `Product` with a single
  `offers` object *and* a `ProductGroup` with `hasVariant[]` holding 3 sizes. The claim that the
  page has "no hasVariant, one offer per URL" was based on a single sample. The adapter handles
  both shapes; fixtures were captured for each.
- **Sizes are NOT client-rendered.** They are present in the variant *names*
  ("… Spray 1.7 oz", "… Spray Vial"), in ounces. No browser rendering is needed, so Playwright
  stays unused — as intended.
- `priceCurrency` appears as both `"USD"` (group shape) and the invalid `"US"` (single shape);
  normalize both.
- `manufacturer.name` being the clean brand was **confirmed**: "Byredo" / "Bdk Parfums" /
  "Amouage", versus the polluted `brand.name` ("Bal d'Afrique Byredo", "Bdk Gris Charnel").

#### Phase 7 live re-inspection (2026-07-23) — corrections to the above

Fetched `robots.txt`, the gzipped `products_sitemap1.xml.gz` (13,745 URLs), and two product
pages. Findings that **change the adapter design**:

- **`manufacturer.name` is the clean brand.** On the Amouage Reflection page,
  `brand.name` = `"Amouage Reflection"` (polluted, as expected) but
  `manufacturer.name` = `"Amouage"` — clean. The adapter should prefer `manufacturer.name`
  and treat `brand.name` as untrusted, rather than parsing the brand out of the title.
- **`@type` is `ProductGroup` but there is no `hasVariant`.** The page carries exactly **one**
  `Offer` object (not an array), so one URL exposes **one** purchasable variant — unlike
  Luckyscent, where a ProductGroup exposed three. `parseProduct` returning 0..N (ADR-007) still
  holds; FragranceNet simply returns 1.
- **Other sizes are client-rendered.** No `sizeName`/`listPrice`/`salePrice` keys, no size
  `<select>`, no embedded size JSON. Retrieval priority says Playwright is the **last resort**,
  and rendering a page purely to enumerate sizes is not justified — so we ingest the single
  advertised offer and simply do not claim sizes we cannot see.
- `priceCurrency: "US"` confirmed (invalid ISO — normalize to `USD`). `gtin`/`mpn` are null, so
  FragranceNet gives **no** strong identifier; matching leans on title normalization.
- The default offer is often the **smallest** size — e.g. Amouage Reflection resolves to a
  `"Spray Vial"` at $13.99, which is a sample and must not match a 100ml retail variant.

**Matching traps found in the sitemap** (all real URLs, all must be handled correctly):
`bdk-parfums/bdk-gris-charnel/extrait-de-parfum` (different flanker from the EDP),
`creed/creed-aventus/cologne` (Aventus Cologne is a distinct flanker),
`byredo/bal-dafrique-byredo/body-lotion` (**body product** — must be rejected),
`bdk-parfums-variety/set-3-piece-mini-…` (**gift set**), plus `kim-kardashian-true-reflections`
and `chris-adams-reflection` (unrelated brands that share a word with a catalog fragrance).

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


---

## Third retailer — FragranceX and Jomashop probed (2026-07-24)

Both were checked before any adapter work, per ADR-006. **Access is permitted for both** — neither
has a blanket `Disallow: /`, neither publishes a bot-specific block, and neither disallows product
paths. Nothing here required bypassing any protection. The blocker in both cases is data quality,
not permission.

### FragranceX — permitted, but the page data cannot be attributed to a variant

- `robots.txt`: 7 wildcard disallow rules, all search/widget/admin paths (`/*searchSortExpression`,
  `/widgets/`, `/blog/wp-admin/`). Product pages allowed. Sitemap index published.
- Each product page carries **two** `Product` blocks sharing one `@id`: the first holds
  `additionalProperty` (clean `Brand`, `Fragrance Name`, `Volume`, `Gender`), the second holds
  `productID`, `brand.name` and `offers`.
- **Genuinely valuable**: it is the first retailer we have found that *publishes shipping* —
  `OfferShippingDetails` gives a **$6.95** flat rate, **free over $49**, plus handling (0–1 days)
  and transit (2–5 days). Every retailer so far reports unknown shipping, so this would be the
  first source able to produce a real delivered total and a real delivery-speed signal.
- **The blocker**: the `offers` array carries **no size, no sku and no name** — just two bare
  prices ($8.99, $19.99) with identical URLs. There is no deterministic way to attribute a price
  to an exact variant, and exact-variant attribution is the whole product. No size/price pairing
  exists elsewhere in the static HTML either: no `<select>`, no `data-size`, no embedded product
  JSON.
- Additionally suggestive: both offer prices appeared in page text inside
  `<div class="slider-price"><span>As low as</span>…` blocks, i.e. a related-products carousel,
  which would mean the prices may not belong to this product at all. A follow-up regex check for
  this was **inconclusive** (it matched nothing on a later fetch, and the page varies between
  requests), so this is recorded as a suspicion rather than a finding. It does not change the
  conclusion: the missing size alone blocks matching.

### Jomashop — permitted, but client-rendered

- `robots.txt`: 28 wildcard disallow rules covering cart/account/checkout/search infrastructure.
  Product paths allowed. Sitemap published.
- Category pages (e.g. `creed-fragrances.html`) return ~81 KB of HTML containing **zero product
  links** — the listing is rendered client-side. Sitemap children expose category URLs, not
  product URLs.
- Reaching products would require Playwright, which our retrieval priority reserves as a last
  resort. Rendering a catalogue purely to enumerate products is not a justified use of it.

### Conclusion

Neither can be built responsibly from static HTTP today. This **confirms ADR-006's ordering**:
the third retailer should come from an **affiliate feed**, not page scraping. FragranceX's CJ feed
is documented as carrying **UPC and MPN** — the strongest matching signal available to us, and it
would also carry sizes explicitly, solving exactly the gap found above. Jomashop also distributes
via CJ.

**This is now blocked on a business step, not an engineering one**: the CJ affiliate application
has to be submitted and approved before the third retailer can proceed.
