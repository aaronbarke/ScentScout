import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/db/client";
import {
  alertRules,
  alertEvents,
  productVariants,
  retailerProducts,
  priceObservations,
  retailers,
  brands,
  fragrances,
} from "@/db/schema";
import { evaluateAlert, type AlertCandidate, type AlertRuleInput } from "./evaluate";
import { buildDeduplicationKey } from "./dedup";

export interface AlertRunSummary {
  rulesEvaluated: number;
  candidatesEvaluated: number;
  alertsCreated: number;
  suppressedDuplicates: number;
  /** Reason -> count, for observability into why alerts did not fire. */
  blockedReasons: Record<string, number>;
}

export interface PendingAlert {
  alertEventId: string;
  alertRuleId: string;
  userId: string;
  deduplicationKey: string;
  brandName: string;
  fragranceName: string;
  canonicalSku: string;
  retailerName: string;
  deliveredPriceCents: number | null;
  listedPriceCents: number | null;
}

/**
 * Evaluate every enabled alert rule against the freshest offer per retailer and
 * record the alerts that should be sent.
 *
 * Alerts are only *recorded* here (delivery_status `pending`); sending is a
 * separate step so a delivery failure can never silently lose an alert, and a
 * crash mid-run cannot double-notify (the unique deduplication_key guards that).
 */
export async function runAlerts(now: Date = new Date()): Promise<AlertRunSummary> {
  const summary: AlertRunSummary = {
    rulesEvaluated: 0,
    candidatesEvaluated: 0,
    alertsCreated: 0,
    suppressedDuplicates: 0,
    blockedReasons: {},
  };

  const rules = await db.select().from(alertRules).where(eq(alertRules.enabled, true));
  summary.rulesEvaluated = rules.length;
  if (rules.length === 0) return summary;

  const variantIds = [...new Set(rules.map((r) => r.productVariantId))];

  // Listings matched to any watched variant.
  const listings = await db
    .select({
      listingId: retailerProducts.id,
      retailerId: retailerProducts.retailerId,
      matchStatus: retailerProducts.matchStatus,
      variantId: productVariants.id,
      presentation: productVariants.presentation,
    })
    .from(retailerProducts)
    .innerJoin(productVariants, eq(productVariants.id, retailerProducts.matchedVariantId))
    .where(inArray(retailerProducts.matchedVariantId, variantIds));

  if (listings.length === 0) return summary;

  // Newest observation per listing.
  const observations = await db
    .select({
      observationId: priceObservations.id,
      retailerProductId: priceObservations.retailerProductId,
      listedPriceCents: priceObservations.listedPriceCents,
      couponDiscountCents: priceObservations.couponDiscountCents,
      deliveredPriceCents: priceObservations.estimatedDeliveredPriceCents,
      inStock: priceObservations.inStock,
      shippingDaysMax: priceObservations.shippingDaysMax,
      observedAt: priceObservations.observedAt,
    })
    .from(priceObservations)
    .where(inArray(priceObservations.retailerProductId, listings.map((l) => l.listingId)))
    .orderBy(desc(priceObservations.observedAt));

  const latestByListing = new Map<string, (typeof observations)[number]>();
  for (const o of observations) {
    if (!latestByListing.has(o.retailerProductId)) latestByListing.set(o.retailerProductId, o);
  }

  // Build candidates per variant.
  const candidatesByVariant = new Map<string, AlertCandidate[]>();
  for (const l of listings) {
    const o = latestByListing.get(l.listingId);
    if (!o) continue;
    const candidate: AlertCandidate = {
      observationId: o.observationId,
      retailerId: l.retailerId,
      productVariantId: l.variantId,
      matchStatus: l.matchStatus,
      presentation: l.presentation,
      listedPriceCents: o.listedPriceCents,
      deliveredPriceCents: o.deliveredPriceCents,
      // Ingestion only ever applies a *verified* coupon discount.
      hasVerifiedCoupon: (o.couponDiscountCents ?? 0) > 0,
      inStock: o.inStock,
      shippingDaysMax: o.shippingDaysMax,
      observedAt: o.observedAt,
    };
    const list = candidatesByVariant.get(l.variantId) ?? [];
    list.push(candidate);
    candidatesByVariant.set(l.variantId, list);
  }

  for (const r of rules) {
    const candidates = candidatesByVariant.get(r.productVariantId) ?? [];
    const ruleInput: AlertRuleInput = {
      id: r.id,
      userId: r.userId,
      productVariantId: r.productVariantId,
      maximumDeliveredPriceCents: r.maximumDeliveredPriceCents,
      retailerIds: r.retailerIds,
      presentation: r.presentation,
      maximumShippingDays: r.maximumShippingDays,
      requireVerifiedCoupon: r.requireVerifiedCoupon,
      requireExactMatch: r.requireExactMatch,
      enabled: r.enabled,
      lastTriggeredAt: r.lastTriggeredAt,
    };

    for (const c of candidates) {
      summary.candidatesEvaluated++;
      const decision = evaluateAlert(ruleInput, c, now);
      if (!decision.fire) {
        const key = decision.reasons[0]?.split(":")[0] ?? "unknown";
        summary.blockedReasons[key] = (summary.blockedReasons[key] ?? 0) + 1;
        continue;
      }

      const deduplicationKey = buildDeduplicationKey(r.id, c);
      // The UNIQUE constraint is the real guard; onConflictDoNothing makes a
      // concurrent run a no-op rather than an error.
      const inserted = await db
        .insert(alertEvents)
        .values({
          alertRuleId: r.id,
          priceObservationId: c.observationId,
          deduplicationKey,
          deliveryStatus: "pending",
        })
        .onConflictDoNothing({ target: alertEvents.deduplicationKey })
        .returning({ id: alertEvents.id });

      if (inserted.length === 0) {
        summary.suppressedDuplicates++;
        continue;
      }

      summary.alertsCreated++;
      await db.update(alertRules).set({ lastTriggeredAt: now }).where(eq(alertRules.id, r.id));
      // One alert per rule per run — the best qualifying offer already fired.
      break;
    }
  }

  return summary;
}

/** Alerts recorded but not yet delivered, with everything needed to render an email. */
export async function listPendingAlerts(limit = 50): Promise<PendingAlert[]> {
  return db
    .select({
      alertEventId: alertEvents.id,
      alertRuleId: alertEvents.alertRuleId,
      userId: alertRules.userId,
      deduplicationKey: alertEvents.deduplicationKey,
      brandName: brands.name,
      fragranceName: fragrances.name,
      canonicalSku: productVariants.canonicalSku,
      retailerName: retailers.name,
      deliveredPriceCents: priceObservations.estimatedDeliveredPriceCents,
      listedPriceCents: priceObservations.listedPriceCents,
    })
    .from(alertEvents)
    .innerJoin(alertRules, eq(alertRules.id, alertEvents.alertRuleId))
    .innerJoin(priceObservations, eq(priceObservations.id, alertEvents.priceObservationId))
    .innerJoin(retailerProducts, eq(retailerProducts.id, priceObservations.retailerProductId))
    .innerJoin(retailers, eq(retailers.id, retailerProducts.retailerId))
    .innerJoin(productVariants, eq(productVariants.id, alertRules.productVariantId))
    .innerJoin(fragrances, eq(fragrances.id, productVariants.fragranceId))
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(eq(alertEvents.deliveryStatus, "pending"))
    .limit(limit);
}

/** Mark an alert delivered (or failed) after a send attempt. */
export async function markAlertDelivered(
  alertEventId: string,
  status: "sent" | "failed",
  sentAt: Date = new Date(),
): Promise<void> {
  await db
    .update(alertEvents)
    .set({ deliveryStatus: status, sentAt: status === "sent" ? sentAt : null })
    .where(eq(alertEvents.id, alertEventId));
}
