# Rules: Testing (`tests/**`, `*.test.ts`)

- **Unit / integration:** Vitest. **End-to-end:** Playwright Test.
- Layout:
  - `tests/unit/` — pure logic (normalization, matching, price math). Fast, no I/O.
  - `tests/integration/` — DB / adapter-parsing against fixtures.
  - `tests/e2e/` — Playwright flows over the running app.
  - `tests/fixtures/retailers/` — saved, sanitized retailer HTML/JSON. **Fixtures only — never
    hit live retailer sites in tests.**
- Every retailer adapter ships **fixture-based parser regression tests**. When a parser breaks,
  add a fixture that reproduces it before fixing.
- Cover the non-negotiables explicitly:
  - Testers never match retail bottles; refills never match complete bottles; gift sets never
    match individual bottles; body products never match fragrances.
  - Money stays integer cents end-to-end; no float drift.
  - Delivered price is not shown when required shipping is unknown.
  - Only `verified` coupons affect the primary delivered total.
  - Price observations are append-only; alerts never fire from stale/uncertain/invalid data.
  - Duplicate alerts are deduplicated.
- Sanitize fixtures: strip secrets, cookies, PII, and auth tokens before committing.
- **Do not claim validation passed unless the command actually completed successfully.**
