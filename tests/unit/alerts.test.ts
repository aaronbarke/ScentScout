import { describe, it, expect } from "vitest";
import {
  evaluateAlert,
  buildDeduplicationKey,
  dedupeKeys,
  MAX_OBSERVATION_AGE_HOURS,
  RULE_COOLDOWN_HOURS,
  type AlertRuleInput,
  type AlertCandidate,
} from "@/domain/alerts";

const NOW = new Date("2026-07-23T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

const VARIANT = "variant-1";
const RETAILER = "retailer-1";

function rule(overrides: Partial<AlertRuleInput> = {}): AlertRuleInput {
  return {
    id: "rule-1",
    userId: "user-1",
    productVariantId: VARIANT,
    maximumDeliveredPriceCents: 25_000,
    retailerIds: null,
    presentation: null,
    maximumShippingDays: null,
    requireVerifiedCoupon: false,
    requireExactMatch: true,
    enabled: true,
    lastTriggeredAt: null,
    ...overrides,
  };
}

function candidate(overrides: Partial<AlertCandidate> = {}): AlertCandidate {
  return {
    observationId: "obs-1",
    retailerId: RETAILER,
    productVariantId: VARIANT,
    matchStatus: "exact",
    presentation: "retail",
    listedPriceCents: 24_000,
    deliveredPriceCents: 24_000,
    hasVerifiedCoupon: false,
    inStock: true,
    shippingDaysMax: 3,
    observedAt: hoursAgo(1),
    ...overrides,
  };
}

describe("evaluateAlert — fires only when everything checks out", () => {
  it("fires on a fresh, in-stock, exactly-matched offer under the threshold", () => {
    const d = evaluateAlert(rule(), candidate(), NOW);
    expect(d.fire).toBe(true);
    expect(d.reasons.join(" ")).toMatch(/price_ok/);
  });

  it("does not fire when the delivered price is above the threshold", () => {
    const d = evaluateAlert(rule(), candidate({ deliveredPriceCents: 26_000 }), NOW);
    expect(d.fire).toBe(false);
    expect(d.reasons[0]).toMatch(/above_threshold/);
  });

  it("fires exactly at the threshold (inclusive)", () => {
    expect(evaluateAlert(rule(), candidate({ deliveredPriceCents: 25_000 }), NOW).fire).toBe(true);
  });

  it("respects a disabled rule", () => {
    expect(evaluateAlert(rule({ enabled: false }), candidate(), NOW).fire).toBe(false);
  });
});

describe("never alerts from uncertain or invalid data", () => {
  it("refuses a manual_review match when the rule requires exact", () => {
    const d = evaluateAlert(rule(), candidate({ matchStatus: "manual_review" }), NOW);
    expect(d.fire).toBe(false);
    expect(d.reasons[0]).toMatch(/match_uncertain/);
  });

  it("refuses rejected/unmatched even if the rule does not require exact", () => {
    for (const status of ["rejected", "unmatched"] as const) {
      const d = evaluateAlert(
        rule({ requireExactMatch: false }),
        candidate({ matchStatus: status }),
        NOW,
      );
      expect(d.fire).toBe(false);
      expect(d.reasons[0]).toMatch(/match_invalid/);
    }
  });

  it("never crosses presentations — a tester never satisfies a retail rule", () => {
    const d = evaluateAlert(
      rule({ presentation: "retail" }),
      candidate({ presentation: "tester" }),
      NOW,
    );
    expect(d.fire).toBe(false);
    expect(d.reasons[0]).toMatch(/presentation_mismatch/);
  });

  it("never fires for a different variant", () => {
    const d = evaluateAlert(rule(), candidate({ productVariantId: "other-variant" }), NOW);
    expect(d.fire).toBe(false);
    expect(d.reasons[0]).toMatch(/variant_mismatch/);
  });
});

describe("never alerts from stale data", () => {
  it("refuses an observation older than the freshness window", () => {
    const d = evaluateAlert(
      rule(),
      candidate({ observedAt: hoursAgo(MAX_OBSERVATION_AGE_HOURS + 1) }),
      NOW,
    );
    expect(d.fire).toBe(false);
    expect(d.reasons[0]).toMatch(/observation_stale/);
  });

  it("accepts an observation just inside the window", () => {
    const d = evaluateAlert(
      rule(),
      candidate({ observedAt: hoursAgo(MAX_OBSERVATION_AGE_HOURS - 0.5) }),
      NOW,
    );
    expect(d.fire).toBe(true);
  });

  it("refuses a future-dated observation", () => {
    const d = evaluateAlert(rule(), candidate({ observedAt: hoursAgo(-5) }), NOW);
    expect(d.fire).toBe(false);
    expect(d.reasons[0]).toMatch(/observation_in_future/);
  });
});

describe("stock and shipping honesty", () => {
  it("treats unknown stock as NOT in stock", () => {
    const d = evaluateAlert(rule(), candidate({ inStock: null }), NOW);
    expect(d.fire).toBe(false);
    expect(d.reasons[0]).toMatch(/stock_unknown/);
  });

  it("does not fire when out of stock", () => {
    expect(evaluateAlert(rule(), candidate({ inStock: false }), NOW).fire).toBe(false);
  });

  it("never proves a price limit from an unknown delivered total", () => {
    const d = evaluateAlert(rule(), candidate({ deliveredPriceCents: null }), NOW);
    expect(d.fire).toBe(false);
    expect(d.reasons[0]).toMatch(/delivered_price_unknown/);
  });

  it("fires without a delivered total when the rule sets no price limit", () => {
    const d = evaluateAlert(
      rule({ maximumDeliveredPriceCents: null }),
      candidate({ deliveredPriceCents: null }),
      NOW,
    );
    expect(d.fire).toBe(true);
  });

  it("cannot satisfy a delivery-speed limit when shipping days are unknown", () => {
    const d = evaluateAlert(
      rule({ maximumShippingDays: 5 }),
      candidate({ shippingDaysMax: null }),
      NOW,
    );
    expect(d.fire).toBe(false);
    expect(d.reasons[0]).toMatch(/shipping_days_unknown/);
  });

  it("rejects an offer that is too slow", () => {
    const d = evaluateAlert(
      rule({ maximumShippingDays: 2 }),
      candidate({ shippingDaysMax: 9 }),
      NOW,
    );
    expect(d.fire).toBe(false);
    expect(d.reasons[0]).toMatch(/too_slow/);
  });
});

describe("rule restrictions", () => {
  it("honors a retailer allow-list", () => {
    expect(
      evaluateAlert(rule({ retailerIds: ["other-retailer"] }), candidate(), NOW).fire,
    ).toBe(false);
    expect(evaluateAlert(rule({ retailerIds: [RETAILER] }), candidate(), NOW).fire).toBe(true);
  });

  it("requires a verified coupon when asked — unverified never counts", () => {
    expect(
      evaluateAlert(rule({ requireVerifiedCoupon: true }), candidate({ hasVerifiedCoupon: false }), NOW)
        .fire,
    ).toBe(false);
    expect(
      evaluateAlert(rule({ requireVerifiedCoupon: true }), candidate({ hasVerifiedCoupon: true }), NOW)
        .fire,
    ).toBe(true);
  });

  it("enforces the cooldown between alerts for one rule", () => {
    const recent = evaluateAlert(
      rule({ lastTriggeredAt: hoursAgo(RULE_COOLDOWN_HOURS - 1) }),
      candidate(),
      NOW,
    );
    expect(recent.fire).toBe(false);
    expect(recent.reasons[0]).toMatch(/cooldown_active/);

    const old = evaluateAlert(
      rule({ lastTriggeredAt: hoursAgo(RULE_COOLDOWN_HOURS + 1) }),
      candidate(),
      NOW,
    );
    expect(old.fire).toBe(true);
  });
});

describe("deduplication", () => {
  it("produces a stable key for the same condition", () => {
    const k1 = buildDeduplicationKey("rule-1", candidate());
    const k2 = buildDeduplicationKey("rule-1", candidate({ observationId: "obs-2" }));
    expect(k1).toBe(k2);
  });

  it("changes the key when the price changes", () => {
    const k1 = buildDeduplicationKey("rule-1", candidate({ deliveredPriceCents: 24_000 }));
    const k2 = buildDeduplicationKey("rule-1", candidate({ deliveredPriceCents: 23_000 }));
    expect(k1).not.toBe(k2);
  });

  it("never dedups a delivered-price alert against a listed-price one", () => {
    const delivered = buildDeduplicationKey("rule-1", candidate({ deliveredPriceCents: 24_000 }));
    const listed = buildDeduplicationKey(
      "rule-1",
      candidate({ deliveredPriceCents: null, listedPriceCents: 24_000 }),
    );
    expect(delivered).not.toBe(listed);
  });

  it("separates keys by rule and by retailer", () => {
    expect(buildDeduplicationKey("rule-1", candidate())).not.toBe(
      buildDeduplicationKey("rule-2", candidate()),
    );
    expect(buildDeduplicationKey("rule-1", candidate())).not.toBe(
      buildDeduplicationKey("rule-1", candidate({ retailerId: "retailer-2" })),
    );
  });

  it("drops keys already sent and collapses duplicates within a batch", () => {
    const k = buildDeduplicationKey("rule-1", candidate());
    expect(dedupeKeys([k, k], [])).toEqual([k]);
    expect(dedupeKeys([k], [k])).toEqual([]);
  });
});
