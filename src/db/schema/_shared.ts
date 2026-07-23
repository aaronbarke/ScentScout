import { timestamp } from "drizzle-orm/pg-core";

/**
 * Fresh `created_at` / `updated_at` column builders (UTC, timezone-aware).
 * A factory — not a shared object — so every table gets its own column
 * instances rather than reusing one mutable builder.
 */
export const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
