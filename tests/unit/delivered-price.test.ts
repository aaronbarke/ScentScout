import { describe, it, expect } from "vitest";
import { estimateDeliveredPriceCents, hasDeliveredPrice } from "@/domain/pricing/delivered-price";

describe("estimateDeliveredPriceCents (ADR-003)", () => {
  it("adds required shipping to the listed price", () => {
    expect(
      estimateDeliveredPriceCents({ listedPriceCents: 29000, shippingPriceCents: 995 }),
    ).toBe(29995);
  });

  it("subtracts a verified coupon discount", () => {
    expect(
      estimateDeliveredPriceCents({
        listedPriceCents: 29000,
        verifiedCouponDiscountCents: 2900,
        shippingPriceCents: 0,
      }),
    ).toBe(26100);
  });

  it("returns null when shipping is UNKNOWN — never assumes free", () => {
    expect(
      estimateDeliveredPriceCents({ listedPriceCents: 21900, shippingPriceCents: null }),
    ).toBeNull();
    expect(hasDeliveredPrice({ listedPriceCents: 21900, shippingPriceCents: null })).toBe(false);
  });

  it("distinguishes unknown shipping from genuinely free shipping", () => {
    const free = estimateDeliveredPriceCents({ listedPriceCents: 21900, shippingPriceCents: 0 });
    const unknown = estimateDeliveredPriceCents({
      listedPriceCents: 21900,
      shippingPriceCents: null,
    });
    expect(free).toBe(21900);
    expect(unknown).toBeNull();
    expect(free).not.toBe(unknown);
  });

  it("returns null when there is no listed price", () => {
    expect(
      estimateDeliveredPriceCents({ listedPriceCents: null, shippingPriceCents: 500 }),
    ).toBeNull();
  });

  it("never returns a negative total", () => {
    expect(
      estimateDeliveredPriceCents({
        listedPriceCents: 1000,
        verifiedCouponDiscountCents: 5000,
        shippingPriceCents: 0,
      }),
    ).toBe(0);
  });

  it("always returns integer cents", () => {
    const r = estimateDeliveredPriceCents({
      listedPriceCents: 12345,
      verifiedCouponDiscountCents: 999,
      shippingPriceCents: 777,
    });
    expect(Number.isInteger(r!)).toBe(true);
    expect(r).toBe(12123);
  });
});
