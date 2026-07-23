import { describe, it, expect } from "vitest";
import { parsedRetailerProductSchema } from "@/domain/retailers";

const base = {
  externalId: "abc-123",
  url: "https://example.com/p/1",
  rawTitle: "Le Labo Santal 33 EDP 100ml",
  gtin: null,
  mpn: null,
  brand: "Le Labo",
  fragranceName: "Santal 33",
  flankerName: null,
  concentration: "EDP",
  sizeMl: 100,
  presentation: "retail" as const,
  condition: "new" as const,
  listedPriceCents: 31500,
  currency: "USD",
  inStock: true,
  stockText: "In stock",
  shippingPriceCents: 0,
  shippingDaysMin: 2,
  shippingDaysMax: 5,
  shippingText: "Free standard shipping",
  observedAt: new Date("2026-07-22T00:00:00Z"),
};

describe("parsedRetailerProduct contract", () => {
  it("accepts a well-formed parse", () => {
    expect(parsedRetailerProductSchema.safeParse(base).success).toBe(true);
  });

  it("rejects fractional money (cents must be integers)", () => {
    const r = parsedRetailerProductSchema.safeParse({ ...base, listedPriceCents: 315.5 });
    expect(r.success).toBe(false);
  });

  it("rejects negative money", () => {
    const r = parsedRetailerProductSchema.safeParse({ ...base, listedPriceCents: -100 });
    expect(r.success).toBe(false);
  });

  it("allows null shipping to represent UNKNOWN shipping (never assumed free)", () => {
    const r = parsedRetailerProductSchema.safeParse({ ...base, shippingPriceCents: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.shippingPriceCents).toBeNull();
  });

  it("distinguishes unknown shipping (null) from free shipping (0)", () => {
    const unknown = parsedRetailerProductSchema.parse({ ...base, shippingPriceCents: null });
    const free = parsedRetailerProductSchema.parse({ ...base, shippingPriceCents: 0 });
    expect(unknown.shippingPriceCents).toBeNull();
    expect(free.shippingPriceCents).toBe(0);
    expect(unknown.shippingPriceCents).not.toBe(free.shippingPriceCents);
  });

  it("allows null stock rather than forcing a false 'out of stock'", () => {
    const r = parsedRetailerProductSchema.safeParse({ ...base, inStock: null });
    expect(r.success).toBe(true);
  });

  it("rejects an unknown presentation value", () => {
    const r = parsedRetailerProductSchema.safeParse({ ...base, presentation: "body_lotion" });
    expect(r.success).toBe(false);
  });

  it("accepts every supported presentation", () => {
    for (const p of ["retail", "tester", "refill", "unboxed", "gift_set"]) {
      expect(parsedRetailerProductSchema.safeParse({ ...base, presentation: p }).success).toBe(true);
    }
  });

  it("requires a 3-letter currency code", () => {
    expect(parsedRetailerProductSchema.safeParse({ ...base, currency: "US" }).success).toBe(false);
    expect(parsedRetailerProductSchema.safeParse({ ...base, currency: "USD" }).success).toBe(true);
  });
});
