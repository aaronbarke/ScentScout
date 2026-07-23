/**
 * Estimated delivered price before tax (ADR-003):
 *
 *   listed price − verified coupon discount + required shipping
 *
 * Two rules are absolute:
 *  - If required shipping is UNKNOWN (null), there is NO delivered total. We
 *    return null so the UI shows "$X plus unknown shipping" instead of a
 *    fabricated number. Unknown shipping is never treated as free.
 *  - Only *verified* coupon discounts may be passed in. Callers must not pass
 *    unverified coupon values into the primary total.
 *
 * All values are integer cents.
 */
export interface DeliveredPriceInput {
  listedPriceCents: number | null;
  /** Discount from a VERIFIED coupon only. Defaults to 0. */
  verifiedCouponDiscountCents?: number;
  /** null = unknown shipping; 0 = genuinely free shipping. */
  shippingPriceCents: number | null;
}

export function estimateDeliveredPriceCents(input: DeliveredPriceInput): number | null {
  const { listedPriceCents, shippingPriceCents } = input;
  const discount = input.verifiedCouponDiscountCents ?? 0;

  if (listedPriceCents === null) return null;
  // UNKNOWN shipping ⇒ no delivered total. This is the whole point.
  if (shippingPriceCents === null) return null;

  const total = listedPriceCents - discount + shippingPriceCents;
  return total < 0 ? 0 : total;
}

/** True when we can show a delivered total at all. */
export function hasDeliveredPrice(input: DeliveredPriceInput): boolean {
  return estimateDeliveredPriceCents(input) !== null;
}
