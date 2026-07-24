"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { approveReview, rejectReview } from "@/domain/matching/review";

/**
 * Admin mutations. Each one re-checks authorization itself — server actions are
 * independently reachable, so a page-level guard alone would leave these open.
 */

const uuid = z.string().uuid();

export async function approveMatch(formData: FormData): Promise<void> {
  await requireAdmin();
  const reviewId = uuid.parse(formData.get("reviewId"));
  const rawVariant = formData.get("variantId");
  // An admin may override the suggested variant (e.g. tester vs retail).
  const variantId = typeof rawVariant === "string" && rawVariant ? uuid.parse(rawVariant) : undefined;

  // reviewed_by references auth users; there is no admin-user table yet, so the
  // decision is recorded without an actor id rather than with a fabricated one.
  await approveReview(reviewId, null, variantId);
  revalidatePath("/admin/reviews");
}

export async function rejectMatch(formData: FormData): Promise<void> {
  await requireAdmin();
  const reviewId = uuid.parse(formData.get("reviewId"));
  await rejectReview(reviewId, null);
  revalidatePath("/admin/reviews");
}
