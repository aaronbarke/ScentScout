import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db/client";
import {
  watchlists,
  alertRules,
  alertEvents,
  productVariants,
  fragrances,
  brands,
} from "@/db/schema";

/**
 * Watchlist + alert-rule persistence. Every function is scoped by `userId` —
 * a user can only ever read or mutate their own rows.
 */

export async function isWatching(userId: string, productVariantId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: watchlists.id })
    .from(watchlists)
    .where(and(eq(watchlists.userId, userId), eq(watchlists.productVariantId, productVariantId)))
    .limit(1);
  return row !== undefined;
}

/** Idempotent — watching twice is a no-op (unique on user+variant). */
export async function addToWatchlist(userId: string, productVariantId: string): Promise<void> {
  await db.insert(watchlists).values({ userId, productVariantId }).onConflictDoNothing();
}

export async function removeFromWatchlist(userId: string, productVariantId: string): Promise<void> {
  await db
    .delete(watchlists)
    .where(and(eq(watchlists.userId, userId), eq(watchlists.productVariantId, productVariantId)));
}

export interface WatchlistEntry {
  productVariantId: string;
  canonicalSku: string;
  concentration: string;
  sizeMl: number;
  presentation: string;
  fragranceName: string;
  fragranceSlug: string;
  brandName: string;
}

export async function listWatchlist(userId: string): Promise<WatchlistEntry[]> {
  return db
    .select({
      productVariantId: productVariants.id,
      canonicalSku: productVariants.canonicalSku,
      concentration: productVariants.concentration,
      sizeMl: productVariants.sizeMl,
      presentation: productVariants.presentation,
      fragranceName: fragrances.name,
      fragranceSlug: fragrances.slug,
      brandName: brands.name,
    })
    .from(watchlists)
    .innerJoin(productVariants, eq(productVariants.id, watchlists.productVariantId))
    .innerJoin(fragrances, eq(fragrances.id, productVariants.fragranceId))
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(eq(watchlists.userId, userId))
    .orderBy(desc(watchlists.createdAt));
}

export interface CreateAlertRuleInput {
  userId: string;
  productVariantId: string;
  maximumDeliveredPriceCents: number | null;
  maximumShippingDays?: number | null;
  requireVerifiedCoupon?: boolean;
}

export async function createAlertRule(input: CreateAlertRuleInput): Promise<string> {
  const [row] = await db
    .insert(alertRules)
    .values({
      userId: input.userId,
      productVariantId: input.productVariantId,
      maximumDeliveredPriceCents: input.maximumDeliveredPriceCents,
      maximumShippingDays: input.maximumShippingDays ?? null,
      requireVerifiedCoupon: input.requireVerifiedCoupon ?? false,
    })
    .returning({ id: alertRules.id });
  return row.id;
}

/** Scoped delete — a user can only delete their own rule. */
export async function deleteAlertRule(userId: string, ruleId: string): Promise<void> {
  await db.delete(alertRules).where(and(eq(alertRules.id, ruleId), eq(alertRules.userId, userId)));
}

export interface AlertRuleSummary {
  id: string;
  productVariantId: string;
  maximumDeliveredPriceCents: number | null;
  maximumShippingDays: number | null;
  requireVerifiedCoupon: boolean;
  enabled: boolean;
  lastTriggeredAt: Date | null;
  canonicalSku: string;
  fragranceName: string;
  fragranceSlug: string;
  brandName: string;
  concentration: string;
  sizeMl: number;
  presentation: string;
}

export async function listAlertRules(userId: string): Promise<AlertRuleSummary[]> {
  return db
    .select({
      id: alertRules.id,
      productVariantId: alertRules.productVariantId,
      maximumDeliveredPriceCents: alertRules.maximumDeliveredPriceCents,
      maximumShippingDays: alertRules.maximumShippingDays,
      requireVerifiedCoupon: alertRules.requireVerifiedCoupon,
      enabled: alertRules.enabled,
      lastTriggeredAt: alertRules.lastTriggeredAt,
      canonicalSku: productVariants.canonicalSku,
      fragranceName: fragrances.name,
      fragranceSlug: fragrances.slug,
      brandName: brands.name,
      concentration: productVariants.concentration,
      sizeMl: productVariants.sizeMl,
      presentation: productVariants.presentation,
    })
    .from(alertRules)
    .innerJoin(productVariants, eq(productVariants.id, alertRules.productVariantId))
    .innerJoin(fragrances, eq(fragrances.id, productVariants.fragranceId))
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(eq(alertRules.userId, userId))
    .orderBy(desc(alertRules.createdAt));
}

/** A user's alert history, newest first. */
export async function listAlertHistory(userId: string, limit = 25) {
  return db
    .select({
      id: alertEvents.id,
      createdAt: alertEvents.createdAt,
      deliveryStatus: alertEvents.deliveryStatus,
      sentAt: alertEvents.sentAt,
      canonicalSku: productVariants.canonicalSku,
      fragranceName: fragrances.name,
      brandName: brands.name,
    })
    .from(alertEvents)
    .innerJoin(alertRules, eq(alertRules.id, alertEvents.alertRuleId))
    .innerJoin(productVariants, eq(productVariants.id, alertRules.productVariantId))
    .innerJoin(fragrances, eq(fragrances.id, productVariants.fragranceId))
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(eq(alertRules.userId, userId))
    .orderBy(desc(alertEvents.createdAt))
    .limit(limit);
}
