import { describe, it, expect } from "vitest";
import { computePriceMetrics, type ObservationPoint } from "@/domain/pricing/history";
import { buyNowGuidance, isHighConfidence } from "@/domain/pricing/guidance";

const NOW = new Date("2026-07-23T00:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

/** Build a daily series ending today; `price(i)` where i=0 is oldest. */
function series(count: number, price: (i: number) => number, inStock: (i: number) => boolean | null = () => true): ObservationPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    observedAt: daysAgo(count - 1 - i),
    listedPriceCents: price(i),
    inStock: inStock(i),
  }));
}

describe("computePriceMetrics", () => {
  it("returns an empty shape for no valid observations", () => {
    const m = computePriceMetrics([]);
    expect(m.currentPriceCents).toBeNull();
    expect(m.observationCount).toBe(0);
    expect(m.allTimeLowCents).toBeNull();
  });

  it("ignores null/zero prices as invalid", () => {
    const m = computePriceMetrics(
      [
        { observedAt: daysAgo(2), listedPriceCents: null, inStock: true },
        { observedAt: daysAgo(1), listedPriceCents: 0, inStock: true },
        { observedAt: daysAgo(0), listedPriceCents: 29000, inStock: true },
      ],
      NOW,
    );
    expect(m.observationCount).toBe(1);
    expect(m.currentPriceCents).toBe(29000);
  });

  it("computes current, lows, median and all-time low", () => {
    // 40 days: prices 30000 down to 26000 then back up, current 28000.
    const obs = series(40, (i) => (i < 20 ? 30000 - i * 200 : 26200 + (i - 20) * 90));
    const m = computePriceMetrics(obs, NOW);
    expect(m.currentPriceCents).toBe(obs[obs.length - 1].listedPriceCents);
    expect(m.allTimeLowCents).toBe(Math.min(...obs.map((o) => o.listedPriceCents!)));
    expect(m.low30Cents).not.toBeNull();
    expect(m.median90Cents).not.toBeNull();
    expect(m.observationCount).toBe(40);
  });

  it("windows lows by recency (30 vs 180 day)", () => {
    const obs: ObservationPoint[] = [
      { observedAt: daysAgo(120), listedPriceCents: 20000, inStock: true }, // old cheap
      { observedAt: daysAgo(10), listedPriceCents: 30000, inStock: true },
      { observedAt: daysAgo(0), listedPriceCents: 29000, inStock: true },
    ];
    const m = computePriceMetrics(obs, NOW);
    expect(m.low30Cents).toBe(29000); // 120-day-old 20000 excluded from 30d
    expect(m.low180Cents).toBe(20000);
    expect(m.allTimeLowCents).toBe(20000);
  });

  it("percentile: current at the minimum is 0% below", () => {
    const obs = series(30, (i) => 30000 - i * 100); // strictly decreasing → current is min
    const m = computePriceMetrics(obs, NOW);
    expect(m.pricePercentile).toBe(0);
  });

  it("percentile: current at the maximum is ~high", () => {
    const obs = series(30, (i) => 27000 + i * 100); // increasing → current is max
    const m = computePriceMetrics(obs, NOW);
    expect(m.pricePercentile).toBeGreaterThanOrEqual(96);
  });

  it("counts stock transitions and ignores unknown stock", () => {
    const obs: ObservationPoint[] = [
      { observedAt: daysAgo(4), listedPriceCents: 29000, inStock: true },
      { observedAt: daysAgo(3), listedPriceCents: 29000, inStock: null }, // unknown ignored
      { observedAt: daysAgo(2), listedPriceCents: 29000, inStock: false },
      { observedAt: daysAgo(1), listedPriceCents: 29000, inStock: true },
      { observedAt: daysAgo(0), listedPriceCents: 29000, inStock: true },
    ];
    const m = computePriceMetrics(obs, NOW);
    expect(m.stockTransitions).toBe(2); // true→false, false→true
  });

  it("reports coverage and freshness in days", () => {
    const obs: ObservationPoint[] = [
      { observedAt: daysAgo(45), listedPriceCents: 29000, inStock: true },
      { observedAt: daysAgo(3), listedPriceCents: 29000, inStock: true },
    ];
    const m = computePriceMetrics(obs, NOW);
    expect(m.coverageDays).toBe(42);
    expect(m.freshnessDays).toBe(3);
  });
});

describe("buyNowGuidance", () => {
  it("says insufficient history under 20 observations", () => {
    const g = buyNowGuidance(computePriceMetrics(series(10, () => 29000), NOW));
    expect(g.label).toBe("insufficient_history");
    expect(g.highConfidence).toBe(false);
  });

  it("says insufficient history when coverage < 30 days even with many points", () => {
    // 25 observations but all within 5 days.
    const obs = Array.from({ length: 25 }, (_, i) => ({
      observedAt: new Date(NOW.getTime() - (i % 5) * 86_400_000),
      listedPriceCents: 29000,
      inStock: true as boolean | null,
    }));
    expect(buyNowGuidance(computePriceMetrics(obs, NOW)).label).toBe("insufficient_history");
  });

  it("flags an exceptional price within 3% of the 180-day low", () => {
    // 60 days hovering ~30000, dropping to 25000 today (the 180d low).
    const obs = series(60, (i) => (i === 59 ? 25000 : 30000 - (i % 7) * 100));
    const m = computePriceMetrics(obs, NOW);
    expect(isHighConfidence(m)).toBe(true);
    expect(buyNowGuidance(m).label).toBe("exceptional_price");
  });

  it("calls a bottom-quartile price good", () => {
    // 60 days: mostly 30000, current 26000 (near the low but not the 180 low of 25500).
    const obs = series(60, (i) => (i === 59 ? 26000 : i % 10 === 0 ? 25500 : 30000));
    const g = buyNowGuidance(computePriceMetrics(obs, NOW));
    expect(["good_price", "exceptional_price"]).toContain(g.label);
  });

  it("calls a mid-range price normal and a top price expensive", () => {
    const normal = series(60, (i) => (i === 59 ? 28000 : 26000 + (i % 20) * 200));
    expect(["normal_price", "good_price"]).toContain(
      buyNowGuidance(computePriceMetrics(normal, NOW)).label,
    );
    const expensive = series(60, (i) => (i === 59 ? 31000 : 26000 + (i % 15) * 100));
    expect(buyNowGuidance(computePriceMetrics(expensive, NOW)).label).toBe("expensive");
  });

  it("does not call a price exceptional when data is stale", () => {
    // Enough points and coverage, but the latest observation is 40 days old.
    const obs = Array.from({ length: 40 }, (_, i) => ({
      observedAt: new Date(NOW.getTime() - (40 + i) * 86_400_000),
      listedPriceCents: i === 0 ? 25000 : 30000,
      inStock: true as boolean | null,
    }));
    const m = computePriceMetrics(obs, NOW);
    expect(isHighConfidence(m)).toBe(false);
    expect(buyNowGuidance(m).label).not.toBe("exceptional_price");
  });
});
