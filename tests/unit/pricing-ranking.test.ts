import { describe, it, expect } from "vitest";
import { rankOffers, type RankableOffer } from "@/domain/pricing/ranking";
import { couponDiscountCents } from "@/domain/pricing/coupons";

const NOW = new Date("2026-07-23T00:00:00Z");
const offer = (o: Partial<RankableOffer> & { offerId: string }): RankableOffer => ({
  retailerName: "Test",
  listedPriceCents: 30000,
  deliveredPriceCents: 30000,
  inStock: true,
  shippingDaysMax: 5,
  observedAt: NOW,
  trustScore: 70,
  ...o,
});

describe("delivery-aware ranking", () => {
  it("does not rank a cheaper unknown-shipping offer above a known delivered total", () => {
    const cheapUnknown = offer({ offerId: "cheap", listedPriceCents: 28000, deliveredPriceCents: null });
    const dearerKnown = offer({ offerId: "known", deliveredPriceCents: 30000 });
    const [first] = rankOffers([cheapUnknown, dearerKnown], NOW);
    expect(first.offerId).toBe("known");
  });

  it("ranks in-stock above out-of-stock even when the OOS offer is cheaper", () => {
    const cheapOOS = offer({ offerId: "oos", deliveredPriceCents: 25000, inStock: false });
    const dearerInStock = offer({ offerId: "in", deliveredPriceCents: 30000, inStock: true });
    const [first] = rankOffers([cheapOOS, dearerInStock], NOW);
    expect(first.offerId).toBe("in");
  });

  it("prefers the lower delivered total among comparable offers", () => {
    const a = offer({ offerId: "a", deliveredPriceCents: 31000 });
    const b = offer({ offerId: "b", deliveredPriceCents: 29500 });
    const ranked = rankOffers([a, b], NOW);
    expect(ranked[0].offerId).toBe("b");
    expect(ranked.map((r) => r.rank)).toEqual([1, 2]);
  });

  it("breaks a price tie by faster delivery, then freshness, then trust", () => {
    const slow = offer({ offerId: "slow", shippingDaysMax: 10 });
    const fast = offer({ offerId: "fast", shippingDaysMax: 2 });
    expect(rankOffers([slow, fast], NOW)[0].offerId).toBe("fast");
  });

  it("annotates unknown shipping and staleness honestly", () => {
    const stale = offer({
      offerId: "s",
      deliveredPriceCents: null,
      observedAt: new Date(NOW.getTime() - 10 * 86_400_000),
    });
    const [r] = rankOffers([stale], NOW);
    expect(r.notes.some((n) => n.includes("shipping unknown"))).toBe(true);
    expect(r.notes.some((n) => n.includes("10 days old"))).toBe(true);
  });

  it("is deterministic and stable", () => {
    const offers = [offer({ offerId: "x" }), offer({ offerId: "y" }), offer({ offerId: "z" })];
    expect(rankOffers(offers, NOW).map((r) => r.offerId)).toEqual(
      rankOffers([...offers].reverse(), NOW).map((r) => r.offerId),
    );
  });
});

describe("coupon verification (only verified coupons discount the total)", () => {
  const base = {
    discountType: "percentage" as const,
    discountValue: 20,
    minimumOrderCents: null,
    maximumDiscountCents: null,
  };

  it("applies a verified percentage coupon", () => {
    expect(
      couponDiscountCents({ ...base, verificationStatus: "verified" }, 30000, NOW),
    ).toBe(6000);
  });

  it("ignores an unverified/reported/expired/unknown coupon", () => {
    for (const status of ["reported", "expired", "invalid", "unknown"] as const) {
      expect(couponDiscountCents({ ...base, verificationStatus: status }, 30000, NOW)).toBe(0);
    }
  });

  it("respects a minimum order", () => {
    const c = { ...base, verificationStatus: "verified" as const, minimumOrderCents: 40000 };
    expect(couponDiscountCents(c, 30000, NOW)).toBe(0);
    expect(couponDiscountCents(c, 40000, NOW)).toBe(8000);
  });

  it("caps at the maximum discount and never exceeds the order", () => {
    const capped = { ...base, verificationStatus: "verified" as const, maximumDiscountCents: 5000 };
    expect(couponDiscountCents(capped, 30000, NOW)).toBe(5000);

    const fixed = {
      ...base,
      discountType: "fixed_amount" as const,
      discountValue: 99999,
      verificationStatus: "verified" as const,
    };
    expect(couponDiscountCents(fixed, 30000, NOW)).toBe(30000);
  });

  it("honors the validity window", () => {
    const expired = {
      ...base,
      verificationStatus: "verified" as const,
      expiresAt: new Date(NOW.getTime() - 86_400_000),
    };
    expect(couponDiscountCents(expired, 30000, NOW)).toBe(0);
  });

  it("returns integer cents", () => {
    const c = { ...base, discountValue: 15, verificationStatus: "verified" as const };
    const d = couponDiscountCents(c, 12345, NOW);
    expect(Number.isInteger(d)).toBe(true);
  });
});
