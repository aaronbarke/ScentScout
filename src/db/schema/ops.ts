import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { retailers, retailerProducts } from "./retailers";
import { productVariants } from "./catalog";
import { scrapeRunStatusEnum, matchReviewStatusEnum } from "./enums";

/** One ingestion run for a retailer. */
export const scrapeRuns = pgTable(
  "scrape_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    retailerId: uuid("retailer_id")
      .notNull()
      .references(() => retailers.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    status: scrapeRunStatusEnum("status").notNull().default("running"),
    pagesAttempted: integer("pages_attempted").notNull().default(0),
    pagesSucceeded: integer("pages_succeeded").notNull().default(0),
    productsFound: integer("products_found").notNull().default(0),
    observationsCreated: integer("observations_created").notNull().default(0),
    errorSummary: text("error_summary"),
  },
  (t) => [index("scrape_runs_retailer_id_idx").on(t.retailerId)],
);

/** Rolling health per retailer (one row per retailer). */
export const retailerHealth = pgTable("retailer_health", {
  retailerId: uuid("retailer_id")
    .primaryKey()
    .references(() => retailers.id, { onDelete: "cascade" }),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  successRate24h: real("success_rate_24h"),
  parserVersion: text("parser_version"),
  disabledReason: text("disabled_reason"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Admin review queue for uncertain matches. */
export const matchReviews = pgTable(
  "match_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    retailerProductId: uuid("retailer_product_id")
      .notNull()
      .references(() => retailerProducts.id, { onDelete: "cascade" }),
    suggestedVariantId: uuid("suggested_variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    originalConfidence: real("original_confidence"),
    reviewStatus: matchReviewStatusEnum("review_status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    index("match_reviews_retailer_product_id_idx").on(t.retailerProductId),
    index("match_reviews_review_status_idx").on(t.reviewStatus),
  ],
);
