import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import {
  retailers,
  retailerProducts,
  priceObservations,
  scrapeRuns,
  retailerHealth,
} from "@/db/schema";
import { estimateDeliveredPriceCents } from "@/domain/pricing/delivered-price";
import type { RetailerAdapter, ParsedRetailerProduct } from "./index";

export interface IngestSummary {
  runId: string;
  retailerSlug: string;
  pagesAttempted: number;
  pagesSucceeded: number;
  productsFound: number;
  observationsCreated: number;
  errors: string[];
}

/**
 * Persist one parsed product: upsert the listing, then append an observation.
 *
 * Observations are APPEND-ONLY — we never update or delete prior rows.
 * `estimated_delivered_price_cents` stays null whenever shipping is unknown.
 */
async function persistParsed(
  retailerId: string,
  runId: string,
  p: ParsedRetailerProduct,
): Promise<void> {
  // Prefer the retailer's own id; fall back to the URL so we still get a
  // stable natural key for the upsert.
  const externalId = p.externalId ?? p.url;

  const [listing] = await db
    .insert(retailerProducts)
    .values({
      retailerId,
      externalId,
      url: p.url,
      rawTitle: p.rawTitle,
      rawBrand: p.brand,
      rawDescription: null,
      gtin: p.gtin,
      parsedFragranceName: p.fragranceName,
      parsedConcentration: p.concentration,
      parsedSizeMl: p.sizeMl,
      parsedPresentation: p.presentation,
      matchStatus: "unmatched", // the matching engine decides; never guess here
      lastSeenAt: p.observedAt,
    })
    .onConflictDoUpdate({
      target: [retailerProducts.retailerId, retailerProducts.externalId],
      set: {
        url: p.url,
        rawTitle: p.rawTitle,
        rawBrand: p.brand,
        gtin: p.gtin,
        parsedFragranceName: p.fragranceName,
        parsedConcentration: p.concentration,
        parsedSizeMl: p.sizeMl,
        parsedPresentation: p.presentation,
        lastSeenAt: p.observedAt,
        updatedAt: new Date(),
      },
    })
    .returning({ id: retailerProducts.id });

  const estimatedDelivered = estimateDeliveredPriceCents({
    listedPriceCents: p.listedPriceCents,
    shippingPriceCents: p.shippingPriceCents,
    // No verified coupon is applied at ingestion time.
  });

  await db.insert(priceObservations).values({
    retailerProductId: listing.id,
    listedPriceCents: p.listedPriceCents,
    couponDiscountCents: 0,
    shippingPriceCents: p.shippingPriceCents,
    estimatedDeliveredPriceCents: estimatedDelivered,
    currency: p.currency,
    inStock: p.inStock,
    stockText: p.stockText,
    shippingDaysMin: p.shippingDaysMin,
    shippingDaysMax: p.shippingDaysMax,
    shippingText: p.shippingText,
    couponId: null,
    observedAt: p.observedAt,
    sourceRunId: runId,
  });
}

async function updateHealth(
  retailerId: string,
  adapter: RetailerAdapter,
  succeeded: boolean,
  reason: string | null,
): Promise<void> {
  const now = new Date();
  const existing = await db
    .select({ consecutiveFailures: retailerHealth.consecutiveFailures })
    .from(retailerHealth)
    .where(eq(retailerHealth.retailerId, retailerId))
    .limit(1);

  const prevFailures = existing[0]?.consecutiveFailures ?? 0;
  const consecutiveFailures = succeeded ? 0 : prevFailures + 1;

  await db
    .insert(retailerHealth)
    .values({
      retailerId,
      lastSuccessAt: succeeded ? now : null,
      consecutiveFailures,
      parserVersion: adapter.parserVersion,
      disabledReason: reason,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: retailerHealth.retailerId,
      set: {
        ...(succeeded ? { lastSuccessAt: now } : {}),
        consecutiveFailures,
        parserVersion: adapter.parserVersion,
        disabledReason: reason,
        updatedAt: now,
      },
    });
}

/**
 * Ingest a set of product URLs for one retailer, recording a scrape run.
 *
 * A fetch/parse failure is recorded as a run error — it NEVER produces a
 * fabricated "out of stock" observation.
 */
export async function ingestUrls(
  adapter: RetailerAdapter,
  urls: string[],
): Promise<IngestSummary> {
  const [retailer] = await db
    .select({ id: retailers.id, enabled: retailers.enabled })
    .from(retailers)
    .where(eq(retailers.slug, adapter.retailerSlug))
    .limit(1);

  if (!retailer) {
    throw new Error(
      `Retailer '${adapter.retailerSlug}' is not in the database. Run: npm run db:seed`,
    );
  }
  if (!retailer.enabled) {
    throw new Error(`Retailer '${adapter.retailerSlug}' is disabled; refusing to ingest.`);
  }

  const [run] = await db
    .insert(scrapeRuns)
    .values({ retailerId: retailer.id, status: "running", pagesAttempted: 0 })
    .returning({ id: scrapeRuns.id });

  const summary: IngestSummary = {
    runId: run.id,
    retailerSlug: adapter.retailerSlug,
    pagesAttempted: 0,
    pagesSucceeded: 0,
    productsFound: 0,
    observationsCreated: 0,
    errors: [],
  };

  for (const url of urls) {
    summary.pagesAttempted++;
    try {
      const page = await adapter.fetchProduct({ url });
      const parsed = await adapter.parseProduct(page);
      summary.pagesSucceeded++;
      summary.productsFound += parsed.length;

      for (const p of parsed) {
        await persistParsed(retailer.id, run.id, p);
        summary.observationsCreated++;
      }
    } catch (err) {
      // Do NOT write an observation here: a failure is not an out-of-stock signal.
      summary.errors.push(`${url}: ${(err as Error).message}`);
    }
  }

  const status =
    summary.pagesSucceeded === 0 && summary.pagesAttempted > 0
      ? "failed"
      : summary.errors.length > 0
        ? "partial"
        : "success";

  await db
    .update(scrapeRuns)
    .set({
      completedAt: new Date(),
      status,
      pagesAttempted: summary.pagesAttempted,
      pagesSucceeded: summary.pagesSucceeded,
      productsFound: summary.productsFound,
      observationsCreated: summary.observationsCreated,
      errorSummary: summary.errors.length ? summary.errors.slice(0, 20).join("\n") : null,
    })
    .where(eq(scrapeRuns.id, run.id));

  await updateHealth(
    retailer.id,
    adapter,
    status !== "failed",
    status === "success" ? null : summary.errors[0] ?? null,
  );

  return summary;
}

/** Narrow helper used by admin tooling to find a listing by retailer + external id. */
export async function findListing(retailerId: string, externalId: string) {
  return db
    .select()
    .from(retailerProducts)
    .where(and(eq(retailerProducts.retailerId, retailerId), eq(retailerProducts.externalId, externalId)))
    .limit(1);
}
