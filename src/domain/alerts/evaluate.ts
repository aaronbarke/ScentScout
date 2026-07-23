/**
 * Pure alert evaluation. No DB, no I/O.
 *
 * An alert is a promise to the user: "tell me when this exact variant is
 * genuinely buyable under my conditions." Every guard here exists so we never
 * send an alert we cannot stand behind — stale data, an uncertain match, an
 * unknown delivered total, or unknown stock all block firing.
 */

export type Presentation = "retail" | "tester" | "refill" | "unboxed" | "gift_set";
export type MatchStatus = "exact" | "probable" | "manual_review" | "rejected" | "unmatched";

/** How old an observation may be and still justify an alert. */
export const MAX_OBSERVATION_AGE_HOURS = 24;
/** Minimum gap between two alerts for the same rule. */
export const RULE_COOLDOWN_HOURS = 12;

export interface AlertRuleInput {
  id: string;
  userId: string;
  productVariantId: string;
  /** Fire only when the delivered total is at or below this. */
  maximumDeliveredPriceCents: number | null;
  /** Restrict to specific retailers; null/empty = any. */
  retailerIds: string[] | null;
  /** Restrict to a presentation; null = any. */
  presentation: Presentation | null;
  maximumShippingDays: number | null;
  requireVerifiedCoupon: boolean;
  requireExactMatch: boolean;
  enabled: boolean;
  lastTriggeredAt: Date | null;
}

/** A candidate offer observation to test a rule against. */
export interface AlertCandidate {
  observationId: string;
  retailerId: string;
  productVariantId: string;
  matchStatus: MatchStatus;
  presentation: Presentation;
  listedPriceCents: number | null;
  /** Null when required shipping is unknown — we then cannot prove a threshold. */
  deliveredPriceCents: number | null;
  /** Whether the delivered total includes a *verified* coupon. */
  hasVerifiedCoupon: boolean;
  /** Null means unknown — never treated as in stock. */
  inStock: boolean | null;
  shippingDaysMax: number | null;
  observedAt: Date;
}

export interface AlertDecision {
  fire: boolean;
  /** Auditable reasons, mirroring the matching engine's style. */
  reasons: string[];
}

function hoursBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 3_600_000;
}

/**
 * Decide whether `candidate` should trigger `rule` at time `now`.
 * Blocking checks run first; the alert fires only if none of them trip.
 */
export function evaluateAlert(
  rule: AlertRuleInput,
  candidate: AlertCandidate,
  now: Date = new Date(),
): AlertDecision {
  const reasons: string[] = [];
  const block = (reason: string): AlertDecision => ({ fire: false, reasons: [reason] });

  if (!rule.enabled) return block("rule_disabled");

  if (candidate.productVariantId !== rule.productVariantId) {
    return block("variant_mismatch: candidate is a different variant");
  }

  // Never alert on an uncertain match.
  if (rule.requireExactMatch && candidate.matchStatus !== "exact") {
    return block(`match_uncertain: status is ${candidate.matchStatus}, not exact`);
  }
  if (candidate.matchStatus === "rejected" || candidate.matchStatus === "unmatched") {
    return block(`match_invalid: status is ${candidate.matchStatus}`);
  }
  reasons.push(`match_ok: ${candidate.matchStatus}`);

  // Never cross presentations (tester vs retail vs refill…).
  if (rule.presentation !== null && candidate.presentation !== rule.presentation) {
    return block(
      `presentation_mismatch: wanted ${rule.presentation}, offer is ${candidate.presentation}`,
    );
  }

  // Never alert from stale data.
  const ageHours = hoursBetween(now, candidate.observedAt);
  if (candidate.observedAt.getTime() > now.getTime()) {
    return block("observation_in_future: refusing to trust a future-dated observation");
  }
  if (ageHours > MAX_OBSERVATION_AGE_HOURS) {
    return block(`observation_stale: ${ageHours.toFixed(1)}h old (max ${MAX_OBSERVATION_AGE_HOURS}h)`);
  }
  reasons.push(`freshness_ok: ${ageHours.toFixed(1)}h old`);

  // Unknown stock is not in stock.
  if (candidate.inStock !== true) {
    return block(
      candidate.inStock === null ? "stock_unknown: not treated as in stock" : "out_of_stock",
    );
  }
  reasons.push("in_stock");

  // Retailer restriction.
  if (rule.retailerIds && rule.retailerIds.length > 0) {
    if (!rule.retailerIds.includes(candidate.retailerId)) {
      return block("retailer_excluded: offer is from a retailer the rule does not cover");
    }
    reasons.push("retailer_allowed");
  }

  // Verified-coupon requirement.
  if (rule.requireVerifiedCoupon && !candidate.hasVerifiedCoupon) {
    return block("coupon_unverified: rule requires a verified coupon");
  }

  // Delivery-speed constraint; unknown speed cannot satisfy a constraint.
  if (rule.maximumShippingDays !== null) {
    if (candidate.shippingDaysMax === null) {
      return block("shipping_days_unknown: cannot prove the delivery-speed limit is met");
    }
    if (candidate.shippingDaysMax > rule.maximumShippingDays) {
      return block(
        `too_slow: ${candidate.shippingDaysMax}d exceeds limit ${rule.maximumShippingDays}d`,
      );
    }
    reasons.push(`shipping_ok: ${candidate.shippingDaysMax}d`);
  }

  // Price threshold. An unknown delivered total can never prove a price limit.
  if (rule.maximumDeliveredPriceCents !== null) {
    if (candidate.deliveredPriceCents === null) {
      return block(
        "delivered_price_unknown: shipping is unknown, so the price limit cannot be proven",
      );
    }
    if (!Number.isInteger(candidate.deliveredPriceCents) || candidate.deliveredPriceCents <= 0) {
      return block("delivered_price_invalid");
    }
    if (candidate.deliveredPriceCents > rule.maximumDeliveredPriceCents) {
      return block(
        `above_threshold: ${candidate.deliveredPriceCents} > ${rule.maximumDeliveredPriceCents}`,
      );
    }
    reasons.push(
      `price_ok: ${candidate.deliveredPriceCents} <= ${rule.maximumDeliveredPriceCents}`,
    );
  }

  // Cooldown — don't spam the same rule.
  if (rule.lastTriggeredAt && hoursBetween(now, rule.lastTriggeredAt) < RULE_COOLDOWN_HOURS) {
    return block(
      `cooldown_active: last alert ${hoursBetween(now, rule.lastTriggeredAt).toFixed(1)}h ago`,
    );
  }

  return { fire: true, reasons };
}
