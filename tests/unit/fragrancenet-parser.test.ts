import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseFragranceNetHtml,
  cleanFragranceName,
  sizeMlFromTitle,
} from "@/retailers/fragrancenet/adapter";

const FIXTURES = join(process.cwd(), "tests/fixtures/retailers/fragrancenet");
const load = (name: string) => readFileSync(join(FIXTURES, `${name}.html`), "utf8");

const URL_GROUP = "https://www.fragrancenet.com/cologne/amouage/amouage-reflection/eau-de-parfum";
const URL_EXTRAIT =
  "https://www.fragrancenet.com/fragrances/bdk-parfums/bdk-gris-charnel/extrait-de-parfum";
const URL_LOTION = "https://www.fragrancenet.com/fragrances/byredo/bal-dafrique-byredo/body-lotion";

describe("FragranceNet parser — ProductGroup shape", () => {
  const parsed = parseFragranceNetHtml(load("amouage-reflection-productgroup"), URL_GROUP);

  it("returns every purchasable variant (ADR-007: 0..N)", () => {
    expect(parsed.length).toBeGreaterThan(1);
  });

  it("survives a malformed ld+json block in the same page", () => {
    // Each fixture deliberately carries a broken block before the good one.
    expect(parsed.length).toBeGreaterThan(0);
  });

  it("trusts manufacturer over the polluted brand field", () => {
    // brand.name is "Amouage Reflection"; manufacturer.name is "Amouage".
    for (const p of parsed) expect(p.brand).toBe("Amouage");
  });

  it("keeps money as integer cents", () => {
    for (const p of parsed) {
      if (p.listedPriceCents === null) continue;
      expect(Number.isInteger(p.listedPriceCents)).toBe(true);
      expect(p.listedPriceCents).toBeGreaterThan(0);
    }
  });

  it("never claims shipping is free when it is unpublished", () => {
    for (const p of parsed) expect(p.shippingPriceCents).toBeNull();
  });

  it("records out-of-stock variants as out of stock, not as missing", () => {
    const stock = parsed.map((p) => p.inStock);
    expect(stock).toContain(false);
    expect(stock).toContain(true);
  });

  it("reports no size for a vial rather than guessing one", () => {
    const vial = parsed.find((p) => /vial/i.test(p.rawTitle));
    expect(vial).toBeDefined();
    expect(vial!.sizeMl).toBeNull();
  });

  it("converts ounce sizes to millilitres", () => {
    const oz17 = parsed.find((p) => /1\.7 oz/i.test(p.rawTitle));
    expect(oz17).toBeDefined();
    // 1.7 oz ≈ 50ml
    expect(oz17!.sizeMl).toBeGreaterThan(48);
    expect(oz17!.sizeMl).toBeLessThan(52);
  });

  it("does not assume a presentation", () => {
    for (const p of parsed) expect(p.presentation).toBeNull();
  });

  it("gives each variant a distinct external id", () => {
    const ids = parsed.map((p) => p.externalId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("FragranceNet parser — single Product shape", () => {
  it("parses the one-offer shape the same site also serves", () => {
    const parsed = parseFragranceNetHtml(load("bdk-gris-charnel-extrait"), URL_EXTRAIT);
    expect(parsed.length).toBeGreaterThanOrEqual(1);
    const p = parsed[0];
    expect(p.brand).toBe("Bdk Parfums"); // manufacturer, not "Bdk Gris Charnel"
    expect(p.listedPriceCents).toBeGreaterThan(0);
    expect(p.shippingPriceCents).toBeNull();
  });

  it("normalizes the invalid currency code the API sometimes returns", () => {
    const parsed = parseFragranceNetHtml(load("byredo-bal-dafrique-body-lotion"), URL_LOTION);
    for (const p of parsed) expect(p.currency).toBe("USD");
  });

  it("preserves the raw title so a body product stays detectable downstream", () => {
    const parsed = parseFragranceNetHtml(load("byredo-bal-dafrique-body-lotion"), URL_LOTION);
    expect(parsed.length).toBeGreaterThanOrEqual(1);
    // The matcher rejects body products; the parser must not hide the evidence.
    expect(parsed[0].rawTitle).toMatch(/body lotion/i);
  });
});

describe("FragranceNet parser — degenerate input", () => {
  it("returns [] rather than throwing when there is no JSON-LD", () => {
    expect(parseFragranceNetHtml("<html><body>nothing</body></html>", URL_GROUP)).toEqual([]);
  });

  it("returns [] when every ld+json block is malformed", () => {
    const html = `<script type="application/ld+json">{ broken </script>`;
    expect(parseFragranceNetHtml(html, URL_GROUP)).toEqual([]);
  });
});

describe("title normalization helpers", () => {
  it("strips size, concentration and packaging noise from the name", () => {
    expect(
      cleanFragranceName("Amouage Reflection Eau De Parfum Spray 1.7 oz (New Packaging)", "Amouage"),
    ).toBe("Reflection");
    // The title prefix ("Bdk") is only part of the manufacturer name
    // ("Bdk Parfums"), so brand stripping must work word-by-word.
    expect(
      cleanFragranceName("Bdk Gris Charnel Extrait De Parfum Spray 3.4 oz", "Bdk Parfums"),
    ).toBe("Gris Charnel");
  });

  it("drops packaging formats that are not part of the fragrance name", () => {
    expect(cleanFragranceName("Creed Aventus Cologne Flacon 8.1 oz", "Creed")).toBe("Aventus");
  });

  it("never strips the whole name away, even if it echoes the brand", () => {
    expect(cleanFragranceName("Byredo Byredo", "Byredo")).toBe("Byredo");
  });

  it("reads ounce and millilitre sizes, and reports null when absent", () => {
    expect(sizeMlFromTitle("… Spray 3.4 oz")).toBeCloseTo(100.6, 0);
    expect(sizeMlFromTitle("… 50 ml")).toBe(50);
    expect(sizeMlFromTitle("… Spray Vial")).toBeNull();
  });
});
