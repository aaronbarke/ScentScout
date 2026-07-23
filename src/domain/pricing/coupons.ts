/**
 * Coupon application. ONLY verified coupons may affect the primary delivered
 * total (docs/PRODUCT_SPEC.md, ADR-003). Everything else contributes 0. Pure.
 */

export interface CouponLike {
  discountType: "percentage" | "fixed_amount";
  /** Percent (0–100) for percentage; integer cents for fixed_amount. */
  discountValue: number;
  minimumOrderCents: number | null;
  maximumDiscountCents: number | null;
  verificationStatus: "verified" | "reported" | "expired" | "invalid" | "unknown";
  startsAt?: Date | null;
  expiresAt?: Date | null;
}

/**
 * Discount, in integer cents, a coupon applies to an order. Returns 0 unless
 * the coupon is `verified`, currently in its validity window, and the order
 * meets any minimum. Never exceeds the order total.
 */
export function couponDiscountCents(
  coupon: CouponLike,
  orderCents: number,
  now: Date = new Date(),
): number {
  if (coupon.verificationStatus !== "verified") return 0;
  if (orderCents <= 0) return 0;
  if (coupon.startsAt && now < coupon.startsAt) return 0;
  if (coupon.expiresAt && now > coupon.expiresAt) return 0;
  if (coupon.minimumOrderCents !== null && orderCents < coupon.minimumOrderCents) return 0;

  let discount =
    coupon.discountType === "percentage"
      ? Math.round((orderCents * coupon.discountValue) / 100)
      : coupon.discountValue;

  if (coupon.maximumDiscountCents !== null) {
    discount = Math.min(discount, coupon.maximumDiscountCents);
  }
  return Math.max(0, Math.min(discount, orderCents));
}
