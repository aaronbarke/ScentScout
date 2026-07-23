import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { productVariants } from "./catalog";
import { priceObservations } from "./prices";
import { presentationEnum, alertDeliveryStatusEnum } from "./enums";

// `user_id` references Supabase auth users (uuid). The auth schema is wired in
// Phase 6, so no cross-schema FK is declared yet.

/** A variant a user is watching. */
export const watchlists = pgTable(
  "watchlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("watchlists_user_variant_uq").on(t.userId, t.productVariantId),
    index("watchlists_user_id_idx").on(t.userId),
  ],
);

/** A user's precise price/restock alert rule. */
export const alertRules = pgTable(
  "alert_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    productVariantId: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    maximumDeliveredPriceCents: integer("maximum_delivered_price_cents"),
    // Optional restriction to specific retailers.
    retailerIds: uuid("retailer_ids").array(),
    presentation: presentationEnum("presentation"),
    maximumShippingDays: integer("maximum_shipping_days"),
    requireVerifiedCoupon: boolean("require_verified_coupon").notNull().default(false),
    requireExactMatch: boolean("require_exact_match").notNull().default(true),
    enabled: boolean("enabled").notNull().default(true),
    lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("alert_rules_user_id_idx").on(t.userId),
    index("alert_rules_product_variant_id_idx").on(t.productVariantId),
  ],
);

/**
 * A fired alert. `deduplication_key` is unique to prevent duplicate
 * notifications for the same condition.
 */
export const alertEvents = pgTable(
  "alert_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alertRuleId: uuid("alert_rule_id")
      .notNull()
      .references(() => alertRules.id, { onDelete: "cascade" }),
    priceObservationId: uuid("price_observation_id")
      .notNull()
      .references(() => priceObservations.id, { onDelete: "cascade" }),
    deliveryStatus: alertDeliveryStatusEnum("delivery_status").notNull().default("pending"),
    deduplicationKey: text("deduplication_key").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [index("alert_events_alert_rule_id_idx").on(t.alertRuleId)],
);
