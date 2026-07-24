import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { retailerProducts, matchReviews, productVariants } from "@/db/schema";
import { isHumanDecision, type MatchDecision } from "./types";

/**
 * Manual review API. Admins correct matching decisions through these functions
 * — never by editing the database directly.
 */

/**
 * True when an admin has already ruled on this listing.
 *
 * A human decision outranks the automatic matcher: re-running matching must
 * never silently undo an approval or a rejection an admin made deliberately.
 */
export async function hasHumanDecision(retailerProductId: string): Promise<boolean> {
  const [row] = await db
    .select({ status: matchReviews.reviewStatus })
    .from(matchReviews)
    .where(eq(matchReviews.retailerProductId, retailerProductId))
    .limit(1);
  return isHumanDecision(row?.status);
}

/**
 * Persist a decision onto the listing, queueing a review when uncertain.
 *
 * Returns false without writing when an admin has already decided this listing
 * — see `hasHumanDecision`.
 */
export async function applyDecision(
  retailerProductId: string,
  decision: MatchDecision,
): Promise<boolean> {
  if (await hasHumanDecision(retailerProductId)) return false;

  await db
    .update(retailerProducts)
    .set({
      matchedVariantId: decision.status === "exact" ? decision.variantId : null,
      matchStatus: decision.status,
      matchConfidence: decision.confidence,
      matchMethod: decision.method,
      updatedAt: new Date(),
    })
    .where(eq(retailerProducts.id, retailerProductId));

  // Anything not auto-matched and not outright unmatched needs a human.
  if (decision.status === "manual_review" || decision.status === "probable") {
    const existing = await db
      .select({ id: matchReviews.id })
      .from(matchReviews)
      .where(eq(matchReviews.retailerProductId, retailerProductId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(matchReviews).values({
        retailerProductId,
        suggestedVariantId: decision.variantId,
        originalConfidence: decision.confidence,
        reviewStatus: "pending",
        reviewNotes: decision.reasons.map((r) => `${r.code}: ${r.detail}`).join("\n"),
      });
    }
  }

  return true;
}

export interface PendingReview {
  reviewId: string;
  retailerProductId: string;
  rawTitle: string;
  url: string;
  suggestedVariantId: string | null;
  suggestedSku: string | null;
  originalConfidence: number | null;
  reviewNotes: string | null;
}

/** List reviews awaiting an admin decision. */
export async function listPendingReviews(limit = 50): Promise<PendingReview[]> {
  const rows = await db
    .select({
      reviewId: matchReviews.id,
      retailerProductId: matchReviews.retailerProductId,
      rawTitle: retailerProducts.rawTitle,
      url: retailerProducts.url,
      suggestedVariantId: matchReviews.suggestedVariantId,
      suggestedSku: productVariants.canonicalSku,
      originalConfidence: matchReviews.originalConfidence,
      reviewNotes: matchReviews.reviewNotes,
    })
    .from(matchReviews)
    .innerJoin(retailerProducts, eq(retailerProducts.id, matchReviews.retailerProductId))
    .leftJoin(productVariants, eq(productVariants.id, matchReviews.suggestedVariantId))
    .where(eq(matchReviews.reviewStatus, "pending"))
    .orderBy(desc(matchReviews.createdAt))
    .limit(limit);

  return rows;
}

/**
 * Approve a review, binding the listing to a variant. `variantId` may override
 * the suggestion when the admin knows better.
 */
export async function approveReview(
  reviewId: string,
  reviewedBy: string | null,
  variantId?: string,
  notes?: string,
): Promise<void> {
  const [review] = await db
    .select()
    .from(matchReviews)
    .where(eq(matchReviews.id, reviewId))
    .limit(1);
  if (!review) throw new Error(`Review ${reviewId} not found`);

  const finalVariantId = variantId ?? review.suggestedVariantId;
  if (!finalVariantId) throw new Error("Cannot approve a review without a variant");

  await db.transaction(async (tx) => {
    await tx
      .update(matchReviews)
      .set({
        reviewStatus: "approved",
        reviewedBy,
        reviewedAt: new Date(),
        suggestedVariantId: finalVariantId,
        reviewNotes: notes ?? review.reviewNotes,
      })
      .where(eq(matchReviews.id, reviewId));

    await tx
      .update(retailerProducts)
      .set({
        matchedVariantId: finalVariantId,
        matchStatus: "exact",
        matchMethod: "manual",
        updatedAt: new Date(),
      })
      .where(eq(retailerProducts.id, review.retailerProductId));
  });
}

/** Reject a review; the listing is marked rejected and stays unmatched. */
export async function rejectReview(
  reviewId: string,
  reviewedBy: string | null,
  notes?: string,
): Promise<void> {
  const [review] = await db
    .select()
    .from(matchReviews)
    .where(eq(matchReviews.id, reviewId))
    .limit(1);
  if (!review) throw new Error(`Review ${reviewId} not found`);

  await db.transaction(async (tx) => {
    await tx
      .update(matchReviews)
      .set({
        reviewStatus: "rejected",
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: notes ?? review.reviewNotes,
      })
      .where(eq(matchReviews.id, reviewId));

    await tx
      .update(retailerProducts)
      .set({
        matchedVariantId: null,
        matchStatus: "rejected",
        matchMethod: "manual",
        updatedAt: new Date(),
      })
      .where(eq(retailerProducts.id, review.retailerProductId));
  });
}

/** Listings still needing a matching pass. */
export async function listUnmatched(limit = 200) {
  return db
    .select({
      id: retailerProducts.id,
      rawTitle: retailerProducts.rawTitle,
      rawBrand: retailerProducts.rawBrand,
      gtin: retailerProducts.gtin,
      url: retailerProducts.url,
    })
    .from(retailerProducts)
    .where(inArray(retailerProducts.matchStatus, ["unmatched"]))
    .limit(limit);
}

export interface SiblingVariant {
  variantId: string;
  canonicalSku: string;
  concentration: string;
  sizeMl: number;
  presentation: string;
}

/**
 * Variants of the same fragrance as `variantId`.
 *
 * The matcher routes a listing to review precisely when it cannot choose
 * between siblings (a tester and a retail bottle of the same size tie), so the
 * reviewer needs the alternatives in front of them to make the call.
 */
export async function listSiblingVariants(variantId: string): Promise<SiblingVariant[]> {
  const [target] = await db
    .select({ fragranceId: productVariants.fragranceId })
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);
  if (!target) return [];

  return db
    .select({
      variantId: productVariants.id,
      canonicalSku: productVariants.canonicalSku,
      concentration: productVariants.concentration,
      sizeMl: productVariants.sizeMl,
      presentation: productVariants.presentation,
    })
    .from(productVariants)
    .where(eq(productVariants.fragranceId, target.fragranceId))
    .orderBy(productVariants.sizeMl, productVariants.presentation);
}
