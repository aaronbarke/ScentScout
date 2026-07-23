import { describe, it, expect } from "vitest";
import { parsePriceToCents, normalizeCurrency, ozToMl } from "@/retailers/shared/money";
import { parseSizeMl, looksLikeSampleOrTravel } from "@/retailers/shared/size";
import { availabilityToInStock, extractJsonLd } from "@/retailers/shared/json-ld";

describe("parsePriceToCents", () => {
  it("handles float-error-prone values exactly", () => {
    // 19.99 * 100 === 1998.9999999999998 in IEEE-754; must round to 1999.
    expect(parsePriceToCents("19.99")).toBe(1999);
    expect(parsePriceToCents(19.99)).toBe(1999);
    expect(parsePriceToCents("290.0")).toBe(29000);
    expect(parsePriceToCents("0.07")).toBe(7);
  });

  it("strips currency symbols and thousands separators", () => {
    expect(parsePriceToCents("$1,299.99")).toBe(129999);
    expect(parsePriceToCents(" 60.00 ")).toBe(6000);
  });

  it("returns null for unusable input rather than guessing", () => {
    expect(parsePriceToCents(null)).toBeNull();
    expect(parsePriceToCents(undefined)).toBeNull();
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("call for price")).toBeNull();
    expect(parsePriceToCents(-5)).toBeNull();
  });

  it("always yields integers", () => {
    for (const v of ["1.005", "33.333", "290.0", "19.99"]) {
      expect(Number.isInteger(parsePriceToCents(v)!)).toBe(true);
    }
  });
});

describe("normalizeCurrency", () => {
  it("repairs FragranceNet's non-ISO 'US'", () => {
    expect(normalizeCurrency("US")).toBe("USD");
  });

  it("passes through valid ISO codes and falls back otherwise", () => {
    expect(normalizeCurrency("usd")).toBe("USD");
    expect(normalizeCurrency("EUR")).toBe("EUR");
    expect(normalizeCurrency(undefined)).toBe("USD");
    expect(normalizeCurrency("dollars")).toBe("USD");
  });
});

describe("parseSizeMl", () => {
  it("parses millilitre labels", () => {
    expect(parseSizeMl("100ml")).toBe(100);
    expect(parseSizeMl("10ml Travel Size")).toBe(10);
    expect(parseSizeMl("1ml spray")).toBe(1);
    expect(parseSizeMl("75 ml")).toBe(75);
  });

  it("converts ounces", () => {
    expect(parseSizeMl("3.4 oz")).toBe(ozToMl(3.4)); // ~100ml
    expect(parseSizeMl("2.4 fl oz")).toBe(ozToMl(2.4)); // ~71ml
  });

  it("returns null when no size is expressible", () => {
    expect(parseSizeMl("one size")).toBeNull();
    expect(parseSizeMl(undefined)).toBeNull();
    expect(parseSizeMl("0ml")).toBeNull();
  });
});

describe("looksLikeSampleOrTravel", () => {
  it("flags decants and travel sprays", () => {
    expect(looksLikeSampleOrTravel("10ml Travel Size")).toBe(true);
    expect(looksLikeSampleOrTravel("1ml spray vial")).toBe(true);
    expect(looksLikeSampleOrTravel("100ml")).toBe(false);
  });
});

describe("availabilityToInStock", () => {
  it("maps known schema.org values", () => {
    expect(availabilityToInStock("https://schema.org/InStock")).toBe(true);
    expect(availabilityToInStock("http://schema.org/OutOfStock")).toBe(false);
  });

  it("returns null for unknown values (never a false 'out of stock')", () => {
    expect(availabilityToInStock("https://schema.org/Mystery")).toBeNull();
    expect(availabilityToInStock(undefined)).toBeNull();
    expect(availabilityToInStock(null)).toBeNull();
  });
});

describe("extractJsonLd", () => {
  it("skips malformed blocks but keeps valid ones", () => {
    const html = `<html><head>
      <script type="application/ld+json">{ nope </script>
      <script type="application/ld+json">{"@type":"Product","name":"Good"}</script>
    </head></html>`;
    const nodes = extractJsonLd(html);
    expect(nodes).toHaveLength(1);
    expect((nodes[0] as Record<string, unknown>).name).toBe("Good");
  });

  it("flattens arrays and @graph wrappers", () => {
    const html = `<html><head>
      <script type="application/ld+json">[{"@type":"A"},{"@type":"B"}]</script>
      <script type="application/ld+json">{"@graph":[{"@type":"C"}]}</script>
    </head></html>`;
    expect(extractJsonLd(html)).toHaveLength(3);
  });
});
