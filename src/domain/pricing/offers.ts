import { eq, and, inArray, desc } from "drizzle-orm";
import { db } from "@/db/client";
import {
  productVariants,
  fragrances,
  brands,
  retailers,
  retailerProducts,
  priceObservations,
} from "@/db/schema";
import { computePriceMetrics, type ObservationPoint, type PriceMetrics } from "./history";
import { buyNowGuidance, type Guidance } from "./guidance";
import { rankOffers, type RankedOffer } from "./ranking";

export interface VariantOfferBoard {
  variantId: string;
  canonicalSku: string;
  brandName: string;
  fragranceName: string;
  offers: RankedOffer[];
  metrics: PriceMetrics;
  guidance: Guidance;
  /** Valid price points (chronological) for charting. */
  series: Array<{ t: number; priceCents: number }>;
}

/**
 * Build the full comparison board for one canonical variant: every current
 * offer (ranked, delivery-aware), the historical metrics, and buy-now guidance.
 *
 * Offers come only from listings matched to THIS variant with status `exact` —
 * so the board never mixes sizes, concentrations or presentations. Metrics use
 * the whole observation history of those comparable listings.
 */
export async function getVariantOfferBoard(
  canonicalSku: string,
  now: Date = new Date(),
): Promise<VariantOfferBoard | null> {
  const [variant] = await db
    .select({
      variantId: productVariants.id,
      canonicalSku: productVariants.canonicalSku,
      brandName: brands.name,
      fragranceName: fragrances.name,
    })
    .from(productVariants)
    .innerJoin(fragrances, eq(fragrances.id, productVariants.fragranceId))
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(eq(productVariants.canonicalSku, canonicalSku))
    .limit(1);

  if (!variant) return null;

  const listings = await db
    .select({
      listingId: retailerProducts.id,
      retailerName: retailers.name,
      trustScore: retailers.trustScore,
    })
    .from(retailerProducts)
    .innerJoin(retailers, eq(retailers.id, retailerProducts.retailerId))
    .where(
      and(
        eq(retailerProducts.matchedVariantId, variant.variantId),
        eq(retailerProducts.matchStatus, "exact"),
      ),
    );

  const listingIds = listings.map((l) => l.listingId);

  // All observations for the matched listings (for history), newest first.
  const allObs = listingIds.length
    ? await db
        .select({
          retailerProductId: priceObservations.retailerProductId,
          listedPriceCents: priceObservations.listedPriceCents,
          shippingPriceCents: priceObservations.shippingPriceCents,
          estimatedDeliveredPriceCents: priceObservations.estimatedDeliveredPriceCents,
          inStock: priceObservations.inStock,
          shippingDaysMax: priceObservations.shippingDaysMax,
          observedAt: priceObservations.observedAt,
        })
        .from(priceObservations)
        .where(inArray(priceObservations.retailerProductId, listingIds))
        .orderBy(desc(priceObservations.observedAt))
    : [];

  const history: ObservationPoint[] = allObs.map((o) => ({
    observedAt: o.observedAt,
    listedPriceCents: o.listedPriceCents,
    inStock: o.inStock,
  }));
  const metrics = computePriceMetrics(history, now);
  const guidance = buyNowGuidance(metrics);

  const series = history
    .filter((h): h is ObservationPoint & { listedPriceCents: number } =>
      h.listedPriceCents !== null && h.listedPriceCents > 0,
    )
    .map((h) => ({ t: h.observedAt.getTime(), priceCents: h.listedPriceCents }))
    .sort((a, b) => a.t - b.t);

  // Current offer per listing = its newest observation.
  const latestByListing = new Map<string, (typeof allObs)[number]>();
  for (const o of allObs) {
    if (!latestByListing.has(o.retailerProductId)) latestByListing.set(o.retailerProductId, o);
  }

  const offers = rankOffers(
    listings
      .filter((l) => latestByListing.has(l.listingId))
      .map((l) => {
        const o = latestByListing.get(l.listingId)!;
        return {
          offerId: l.listingId,
          retailerName: l.retailerName,
          listedPriceCents: o.listedPriceCents,
          deliveredPriceCents: o.estimatedDeliveredPriceCents,
          inStock: o.inStock,
          shippingDaysMax: o.shippingDaysMax,
          observedAt: o.observedAt,
          trustScore: l.trustScore,
        };
      }),
    now,
  );

  return {
    variantId: variant.variantId,
    canonicalSku: variant.canonicalSku,
    brandName: variant.brandName,
    fragranceName: variant.fragranceName,
    offers,
    metrics,
    guidance,
    series,
  };
}
