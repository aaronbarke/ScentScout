import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseLuckyscentHtml } from "@/retailers/luckyscent/adapter";
import { parsedRetailerProductSchema } from "@/domain/retailers";

const FIXTURE = readFileSync(
  join(process.cwd(), "tests/fixtures/retailers/luckyscent/gris-charnel.html"),
  "utf8",
);
const PAGE_URL = "https://www.luckyscent.com/products/gris-charnel-by-bdk-parfums";
const OBSERVED = new Date("2026-07-22T00:00:00Z");

const parsed = parseLuckyscentHtml(FIXTURE, PAGE_URL, OBSERVED);
const bySize = (ml: number) => parsed.find((p) => p.sizeMl === ml);

describe("Luckyscent parser (fixture)", () => {
  it("returns one parsed product per size variant", () => {
    expect(parsed).toHaveLength(3);
    expect(parsed.map((p) => p.sizeMl).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([1, 10, 100]);
  });

  it("survives a malformed ld+json block without losing valid ones", () => {
    // The fixture contains an intentionally broken block before the good one.
    expect(parsed.length).toBeGreaterThan(0);
  });

  it("every result satisfies the shared contract", () => {
    for (const p of parsed) {
      expect(parsedRetailerProductSchema.safeParse(p).success).toBe(true);
    }
  });

  it("separates brand from fragrance name (no pollution)", () => {
    const full = bySize(100)!;
    expect(full.brand).toBe("BDK Parfums");
    expect(full.fragranceName).toBe("Gris Charnel");
  });

  it("converts price strings to exact integer cents", () => {
    expect(bySize(100)!.listedPriceCents).toBe(29000);
    expect(bySize(10)!.listedPriceCents).toBe(6000);
    expect(bySize(1)!.listedPriceCents).toBe(600);
    for (const p of parsed) expect(Number.isInteger(p.listedPriceCents)).toBe(true);
  });

  it("reports shipping as UNKNOWN (null), never assumed free", () => {
    for (const p of parsed) {
      expect(p.shippingPriceCents).toBeNull();
      expect(p.shippingDaysMin).toBeNull();
      expect(p.shippingDaysMax).toBeNull();
    }
  });

  it("extracts GTIN where published and null where absent", () => {
    expect(bySize(100)!.gtin).toBe("3760035450184");
    expect(bySize(10)!.gtin).toBe("3760035450559");
    expect(bySize(1)!.gtin).toBeNull(); // the 1ml sample has no barcode
  });

  it("captures a stable external id (SKU) per variant", () => {
    expect(bySize(100)!.externalId).toBe("856003");
    expect(bySize(10)!.externalId).toBe("856003_R");
  });

  it("maps availability and condition", () => {
    expect(bySize(100)!.inStock).toBe(true);
    expect(bySize(100)!.condition).toBe("new");
    expect(bySize(100)!.currency).toBe("USD");
  });

  it("marks everything as retail presentation (authorized boutique)", () => {
    for (const p of parsed) expect(p.presentation).toBe("retail");
  });

  it("keeps travel/sample sizes distinct from the full bottle so matching can reject them", () => {
    // 10ml and 1ml must NOT be conflated with the canonical 100ml variant.
    expect(bySize(100)!.sizeMl).toBe(100);
    expect(bySize(10)!.sizeMl).toBe(10);
    expect(bySize(1)!.sizeMl).toBe(1);
    const urls = new Set(parsed.map((p) => p.url));
    expect(urls.size).toBe(3);
  });

  it("stamps the observation time it was given", () => {
    for (const p of parsed) expect(p.observedAt.toISOString()).toBe(OBSERVED.toISOString());
  });
});

describe("Luckyscent parser resilience", () => {
  it("returns [] for a page with no JSON-LD (not an out-of-stock signal)", () => {
    expect(parseLuckyscentHtml("<html><body>nothing here</body></html>", PAGE_URL)).toEqual([]);
  });

  it("returns [] for entirely malformed JSON-LD", () => {
    const html = `<html><head><script type="application/ld+json">{ broken</script></head></html>`;
    expect(parseLuckyscentHtml(html, PAGE_URL)).toEqual([]);
  });
});
