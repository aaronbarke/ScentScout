import { eq, or, ilike, asc, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { brands, fragrances, productVariants, retailerProducts, priceObservations } from "@/db/schema";
import { variantPath } from "@/lib/catalog-slug";

/** A variant flattened for listing/detail pages, including its public URL path. */
export interface VariantSummary {
  variantId: string;
  canonicalSku: string;
  variantPath: string;
  concentration: string;
  sizeMl: number;
  presentation: string;
  genderMarketing: string | null;
}

export interface FragranceSummary {
  fragranceId: string;
  name: string;
  slug: string;
  flankerName: string | null;
  releaseYear: number | null;
  brandName: string;
  brandSlug: string;
  variants: VariantSummary[];
}

function toVariantSummary(r: {
  variantId: string;
  canonicalSku: string;
  concentration: string;
  sizeMl: number;
  presentation: string;
  genderMarketing: string | null;
}): VariantSummary {
  return {
    ...r,
    variantPath: variantPath(
      r.concentration as Parameters<typeof variantPath>[0],
      r.sizeMl,
      r.presentation as Parameters<typeof variantPath>[2],
    ),
  };
}

const VARIANT_COLUMNS = {
  variantId: productVariants.id,
  canonicalSku: productVariants.canonicalSku,
  concentration: productVariants.concentration,
  sizeMl: productVariants.sizeMl,
  presentation: productVariants.presentation,
  genderMarketing: productVariants.genderMarketing,
  fragranceId: fragrances.id,
  fragranceName: fragrances.name,
  fragranceSlug: fragrances.slug,
  flankerName: fragrances.flankerName,
  releaseYear: fragrances.releaseYear,
  brandName: brands.name,
  brandSlug: brands.slug,
} as const;

function groupIntoFragrances(rows: Array<Record<string, unknown>>): FragranceSummary[] {
  const byFragrance = new Map<string, FragranceSummary>();
  for (const r of rows as Array<{
    fragranceId: string;
    fragranceName: string;
    fragranceSlug: string;
    flankerName: string | null;
    releaseYear: number | null;
    brandName: string;
    brandSlug: string;
    variantId: string;
    canonicalSku: string;
    concentration: string;
    sizeMl: number;
    presentation: string;
    genderMarketing: string | null;
  }>) {
    let f = byFragrance.get(r.fragranceId);
    if (!f) {
      f = {
        fragranceId: r.fragranceId,
        name: r.fragranceName,
        slug: r.fragranceSlug,
        flankerName: r.flankerName,
        releaseYear: r.releaseYear,
        brandName: r.brandName,
        brandSlug: r.brandSlug,
        variants: [],
      };
      byFragrance.set(r.fragranceId, f);
    }
    f.variants.push(toVariantSummary(r));
  }
  for (const f of byFragrance.values()) {
    f.variants.sort((a, b) => a.sizeMl - b.sizeMl || a.presentation.localeCompare(b.presentation));
  }
  return [...byFragrance.values()];
}

/** Every fragrance with its variants, ordered by brand then name. */
export async function listCatalog(): Promise<FragranceSummary[]> {
  const rows = await db
    .select(VARIANT_COLUMNS)
    .from(productVariants)
    .innerJoin(fragrances, eq(fragrances.id, productVariants.fragranceId))
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .orderBy(asc(brands.name), asc(fragrances.name));
  return groupIntoFragrances(rows);
}

/** One fragrance (by slug) with its variants, or null. */
export async function getFragrance(slug: string): Promise<FragranceSummary | null> {
  const rows = await db
    .select(VARIANT_COLUMNS)
    .from(fragrances)
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .innerJoin(productVariants, eq(productVariants.fragranceId, fragrances.id))
    .where(eq(fragrances.slug, slug));
  const grouped = groupIntoFragrances(rows);
  return grouped[0] ?? null;
}

/** Header info for a single variant (renders even with no offers), or null. */
export async function getVariantHeader(canonicalSku: string) {
  const [row] = await db
    .select({
      canonicalSku: productVariants.canonicalSku,
      concentration: productVariants.concentration,
      sizeMl: productVariants.sizeMl,
      presentation: productVariants.presentation,
      genderMarketing: productVariants.genderMarketing,
      fragranceName: fragrances.name,
      fragranceSlug: fragrances.slug,
      flankerName: fragrances.flankerName,
      brandName: brands.name,
      brandSlug: brands.slug,
    })
    .from(productVariants)
    .innerJoin(fragrances, eq(fragrances.id, productVariants.fragranceId))
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(eq(productVariants.canonicalSku, canonicalSku))
    .limit(1);
  return row ?? null;
}

/** Search fragrances by brand or fragrance name. */
export async function searchFragrances(query: string): Promise<FragranceSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q}%`;
  const rows = await db
    .select(VARIANT_COLUMNS)
    .from(productVariants)
    .innerJoin(fragrances, eq(fragrances.id, productVariants.fragranceId))
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(or(ilike(fragrances.name, like), ilike(brands.name, like), ilike(brands.normalizedName, like)))
    .orderBy(asc(brands.name), asc(fragrances.name));
  return groupIntoFragrances(rows);
}

export interface CatalogStats {
  brands: number;
  fragrances: number;
  variants: number;
  retailers: number;
}

/** Headline counts for the homepage. */
export async function getCatalogStats(): Promise<CatalogStats> {
  const [b] = await db.select({ n: sql<number>`count(*)::int` }).from(brands);
  const [f] = await db.select({ n: sql<number>`count(*)::int` }).from(fragrances);
  const [v] = await db.select({ n: sql<number>`count(*)::int` }).from(productVariants);
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(retailerProducts);
  return { brands: b.n, fragrances: f.n, variants: v.n, retailers: r.n };
}

/** Variants that currently have at least one in-stock matched offer (for /deals). */
export async function listVariantsWithOffers(): Promise<
  Array<{ canonicalSku: string; fragranceName: string; brandName: string; fragranceSlug: string; variantPath: string; concentration: string; sizeMl: number; presentation: string }>
> {
  const rows = await db
    .selectDistinct({
      canonicalSku: productVariants.canonicalSku,
      concentration: productVariants.concentration,
      sizeMl: productVariants.sizeMl,
      presentation: productVariants.presentation,
      fragranceName: fragrances.name,
      fragranceSlug: fragrances.slug,
      brandName: brands.name,
    })
    .from(retailerProducts)
    .innerJoin(productVariants, eq(productVariants.id, retailerProducts.matchedVariantId))
    .innerJoin(fragrances, eq(fragrances.id, productVariants.fragranceId))
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(eq(retailerProducts.matchStatus, "exact"));

  return rows.map((r) => ({
    ...r,
    variantPath: variantPath(
      r.concentration as Parameters<typeof variantPath>[0],
      r.sizeMl,
      r.presentation as Parameters<typeof variantPath>[2],
    ),
  }));
}

/** Recent in-stock observations, newest first (for /restocks). */
export async function listRecentRestocks(limit = 20) {
  return db
    .select({
      canonicalSku: productVariants.canonicalSku,
      fragranceName: fragrances.name,
      brandName: brands.name,
      fragranceSlug: fragrances.slug,
      concentration: productVariants.concentration,
      sizeMl: productVariants.sizeMl,
      presentation: productVariants.presentation,
      listedPriceCents: priceObservations.listedPriceCents,
      observedAt: priceObservations.observedAt,
    })
    .from(priceObservations)
    .innerJoin(retailerProducts, eq(retailerProducts.id, priceObservations.retailerProductId))
    .innerJoin(productVariants, eq(productVariants.id, retailerProducts.matchedVariantId))
    .innerJoin(fragrances, eq(fragrances.id, productVariants.fragranceId))
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(eq(priceObservations.inStock, true))
    .orderBy(sql`${priceObservations.observedAt} desc`)
    .limit(limit);
}
