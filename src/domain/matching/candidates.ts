import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { brands, fragrances, productVariants } from "@/db/schema";
import type { CandidateVariant } from "./types";

/**
 * Load the canonical catalog, flattened for matching. The catalog is small
 * (tens of variants in the MVP), so we compare against all of it rather than
 * pre-filtering — pre-filtering risks hiding the very candidate that would
 * have revealed an ambiguity.
 */
export async function loadCandidates(): Promise<CandidateVariant[]> {
  const rows = await db
    .select({
      variantId: productVariants.id,
      canonicalSku: productVariants.canonicalSku,
      concentration: productVariants.concentration,
      sizeMl: productVariants.sizeMl,
      presentation: productVariants.presentation,
      fragranceName: fragrances.name,
      flankerName: fragrances.flankerName,
      brandName: brands.name,
    })
    .from(productVariants)
    .innerJoin(fragrances, eq(fragrances.id, productVariants.fragranceId))
    .innerJoin(brands, eq(brands.id, fragrances.brandId));

  return rows.map((r) => ({ ...r, gtin: null }));
}
