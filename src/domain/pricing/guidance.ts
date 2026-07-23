import type { PriceMetrics } from "./history";

/**
 * Buy-now guidance from price metrics (docs/PRICE_ENGINE.md). Presented as
 * guidance, never as certainty. Pure function.
 */

export type GuidanceLabel =
  | "exceptional_price"
  | "good_price"
  | "normal_price"
  | "expensive"
  | "insufficient_history";

export interface Guidance {
  label: GuidanceLabel;
  /** Human-readable one-liner. */
  summary: string;
  /** True when there is enough data to trust the guidance. */
  highConfidence: boolean;
}

/** Thresholds (docs/PRICE_ENGINE.md). */
export const GUIDANCE = {
  minObservations: 20,
  minCoverageDays: 30,
  /** "Exceptional" also requires data no older than this. */
  maxFreshnessDays: 14,
  /** Within this fraction of the 180-day low counts as "exceptional". */
  exceptionalWithin: 0.03,
  goodPercentile: 25,
  normalPercentile: 70,
} as const;

/** Enough valid, recent, well-spread data to trust a guidance label. */
export function isHighConfidence(m: PriceMetrics): boolean {
  return (
    m.observationCount >= GUIDANCE.minObservations &&
    m.coverageDays >= GUIDANCE.minCoverageDays &&
    m.freshnessDays !== null &&
    m.freshnessDays <= GUIDANCE.maxFreshnessDays
  );
}

export function buyNowGuidance(m: PriceMetrics): Guidance {
  const highConfidence = isHighConfidence(m);

  // Not enough history — never dress up thin data as a strong signal.
  if (
    m.currentPriceCents === null ||
    m.observationCount < GUIDANCE.minObservations ||
    m.coverageDays < GUIDANCE.minCoverageDays
  ) {
    return {
      label: "insufficient_history",
      summary: "Not enough price history yet to judge this deal.",
      highConfidence: false,
    };
  }

  // Exceptional: within 3% of the tracked 180-day low, with confident data.
  if (
    highConfidence &&
    m.low180Cents !== null &&
    m.currentPriceCents <= Math.round(m.low180Cents * (1 + GUIDANCE.exceptionalWithin))
  ) {
    return {
      label: "exceptional_price",
      summary: "Within 3% of the lowest price we've tracked in 180 days.",
      highConfidence,
    };
  }

  const pct = m.pricePercentile ?? 100;
  if (pct <= GUIDANCE.goodPercentile) {
    return {
      label: "good_price",
      summary: "In the lowest 25% of tracked prices.",
      highConfidence,
    };
  }
  if (pct <= GUIDANCE.normalPercentile) {
    return {
      label: "normal_price",
      summary: "A typical price for this variant.",
      highConfidence,
    };
  }
  return {
    label: "expensive",
    summary: "Higher than most prices we've tracked.",
    highConfidence,
  };
}

/** Combine price guidance with a short delivery note (e.g. "fast delivery"). */
export function withDeliveryContext(g: Guidance, deliveryNote: string | null): string {
  const base = g.summary;
  return deliveryNote ? `${base} ${deliveryNote}` : base;
}
