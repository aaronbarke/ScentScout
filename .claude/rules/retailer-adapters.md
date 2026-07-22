# Rules: Retailer adapters (`src/retailers/**`)

- **All retailer-specific logic lives inside that retailer's adapter directory.** Selectors,
  URL patterns, quirks, and parsing assumptions never leak into `src/domain/**` or shared code.
  Cross-cutting helpers go in `src/retailers/shared/`.
- Every adapter implements the shared `RetailerAdapter` interface and returns the normalized
  `ParsedRetailerProduct` shape (validated with Zod). Do not invent per-retailer output shapes.
- **Retrieval priority (prefer cheaper, more stable sources first):**
  1. Affiliate / retailer-supported product feed
  2. JSON-LD
  3. Embedded page JSON
  4. Static HTML selectors (Cheerio)
  5. Playwright — **only** when static HTTP retrieval is insufficient
  6. Manual data entry / temporarily disabling the retailer
- Use bounded retries, timeouts, rate limits, and jitter. Be a polite client.
- **Never bypass CAPTCHAs, authentication, access controls, or anti-bot protections.** Only
  ingest from permitted, stable sources; confirm a retailer is accessible before building it.
- **A parse/fetch failure is not proof of out-of-stock.** Record the failure in scrape-run /
  retailer-health state; do not emit a fake "out of stock" observation.
- Preserve original source evidence (raw title/brand/description) on every parsed product so
  matching decisions stay auditable.
- Tests use **saved, sanitized fixtures** in `tests/fixtures/retailers/`, never live sites.
- Do not commit raw private scraper diagnostics or unsanitized captured HTML.
