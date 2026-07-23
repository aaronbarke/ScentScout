import { pgEnum } from "drizzle-orm/pg-core";

/** Presentation — never combined across values. */
export const presentationEnum = pgEnum("presentation", [
  "retail",
  "tester",
  "refill",
  "unboxed",
  "gift_set",
]);

/** Condition — MVP tracks new products only. */
export const conditionEnum = pgEnum("condition", ["new"]);

/** Canonical concentration values (matching engine normalizes aliases to these). */
export const concentrationEnum = pgEnum("concentration", [
  "eau_de_parfum",
  "eau_de_toilette",
  "parfum",
  "extrait_de_parfum",
  "eau_de_cologne",
  "eau_fraiche",
  "elixir",
]);

/** Gender marketing label. */
export const genderMarketingEnum = pgEnum("gender_marketing", [
  "masculine",
  "feminine",
  "unisex",
]);

/** Retailer classification. */
export const retailerTypeEnum = pgEnum("retailer_type", [
  "official_brand",
  "department_store",
  "authorized_boutique",
  "gray_market_discounter",
  "marketplace",
  "decant_store",
]);

/** Match outcome for a retailer listing against the canonical catalog. */
export const matchStatusEnum = pgEnum("match_status", [
  "exact",
  "probable",
  "manual_review",
  "rejected",
  "unmatched",
]);

/** How a match was produced. Deterministic checks approve production matches. */
export const matchMethodEnum = pgEnum("match_method", [
  "deterministic",
  "manual",
  "llm_assisted",
]);

/** Coupon discount shape. `discount_value` is percent for percentage, cents for fixed_amount. */
export const couponDiscountTypeEnum = pgEnum("coupon_discount_type", [
  "percentage",
  "fixed_amount",
]);

/** Only `verified` coupons may affect the primary delivered-price total. */
export const couponVerificationStatusEnum = pgEnum("coupon_verification_status", [
  "verified",
  "reported",
  "expired",
  "invalid",
  "unknown",
]);

/** Scrape-run lifecycle. */
export const scrapeRunStatusEnum = pgEnum("scrape_run_status", [
  "running",
  "success",
  "partial",
  "failed",
]);

/** Alert-event delivery lifecycle. */
export const alertDeliveryStatusEnum = pgEnum("alert_delivery_status", [
  "pending",
  "sent",
  "failed",
  "suppressed",
]);

/** Admin review outcome for an uncertain match. */
export const matchReviewStatusEnum = pgEnum("match_review_status", [
  "pending",
  "approved",
  "rejected",
]);
