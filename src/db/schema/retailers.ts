import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  real,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { productVariants } from "./catalog";
import {
  retailerTypeEnum,
  matchStatusEnum,
  matchMethodEnum,
  couponDiscountTypeEnum,
  couponVerificationStatusEnum,
} from "./enums";

/** Retailers we ingest offers from. */
export const retailers = pgTable("retailers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  baseUrl: text("base_url").notNull(),
  retailerType: retailerTypeEnum("retailer_type").notNull(),
  affiliateProgram: text("affiliate_program"),
  enabled: boolean("enabled").notNull().default(true),
  // 0–100; not money, so a small int scale is fine.
  trustScore: integer("trust_score").notNull().default(50),
  defaultShippingPolicy: text("default_shipping_policy"),
  ...timestamps(),
});

/**
 * A listing on a retailer, linked to a canonical variant once matched.
 * Raw evidence (`raw_*`) is preserved so matches stay auditable.
 * `match_confidence` is a 0–1 score (not money → `real` is acceptable).
 */
export const retailerProducts = pgTable(
  "retailer_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    retailerId: uuid("retailer_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "cascade" }),
    externalId: text("external_id"),
    url: text("url").notNull(),
    rawTitle: text("raw_title").notNull(),
    rawBrand: text("raw_brand"),
    rawDescription: text("raw_description"),
    matchedVariantId: uuid("matched_variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    matchStatus: matchStatusEnum("match_status").notNull().default("unmatched"),
    matchConfidence: real("match_confidence"),
    matchMethod: matchMethodEnum("match_method"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    unique("retailer_products_retailer_external_uq").on(t.retailerId, t.externalId),
    index("retailer_products_retailer_id_idx").on(t.retailerId),
    index("retailer_products_matched_variant_id_idx").on(t.matchedVariantId),
    index("retailer_products_match_status_idx").on(t.matchStatus),
  ],
);

/**
 * Coupons. `discount_value` is percent (percentage) or cents (fixed_amount).
 * Only `verified` coupons may affect the primary delivered-price total.
 */
export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    retailerId: uuid("retailer_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    discountType: couponDiscountTypeEnum("discount_type").notNull(),
    discountValue: integer("discount_value").notNull(),
    minimumOrderCents: integer("minimum_order_cents"),
    maximumDiscountCents: integer("maximum_discount_cents"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    verificationStatus: couponVerificationStatusEnum("verification_status")
      .notNull()
      .default("unknown"),
    ...timestamps(),
  },
  (t) => [
    unique("coupons_retailer_code_uq").on(t.retailerId, t.code),
    index("coupons_retailer_id_idx").on(t.retailerId),
  ],
);
