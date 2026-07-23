import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { retailerProducts, coupons } from "./retailers";
import { scrapeRuns } from "./ops";

/**
 * Price observations — **APPEND-ONLY**. Never UPDATE or DELETE these rows in
 * app code; corrections are new observations. All money is integer cents.
 *
 * `shipping_price_cents` null = shipping unknown; in that case
 * `estimated_delivered_price_cents` is also null (the UI shows
 * "plus unknown shipping" rather than a fabricated total).
 */
export const priceObservations = pgTable(
  "price_observations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    retailerProductId: uuid("retailer_product_id")
      .notNull()
      .references(() => retailerProducts.id, { onDelete: "cascade" }),
    listedPriceCents: integer("listed_price_cents"),
    couponDiscountCents: integer("coupon_discount_cents").notNull().default(0),
    shippingPriceCents: integer("shipping_price_cents"),
    estimatedDeliveredPriceCents: integer("estimated_delivered_price_cents"),
    currency: text("currency").notNull().default("USD"),
    inStock: boolean("in_stock"),
    stockText: text("stock_text"),
    shippingDaysMin: integer("shipping_days_min"),
    shippingDaysMax: integer("shipping_days_max"),
    shippingText: text("shipping_text"),
    couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
    sourceRunId: uuid("source_run_id").references(() => scrapeRuns.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("price_observations_retailer_product_id_idx").on(t.retailerProductId),
    index("price_observations_observed_at_idx").on(t.observedAt),
  ],
);
