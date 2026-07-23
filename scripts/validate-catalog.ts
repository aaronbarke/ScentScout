import { catalog } from "@/db/seed/catalog";
import { canonicalSku } from "@/lib/catalog-slug";

/**
 * Validates the seed catalog's internal integrity WITHOUT a database. Run in CI
 * and before seeding. Exits non-zero on any violation.
 */
const MIN_VARIANTS = 40;
const CURRENT_YEAR = new Date().getUTCFullYear();

function validate(): string[] {
  const errors: string[] = [];
  const brandSlugs = new Set<string>();
  const fragranceSlugs = new Set<string>();
  const skus = new Set<string>();

  let fragranceCount = 0;
  let variantCount = 0;

  for (const b of catalog) {
    if (brandSlugs.has(b.slug)) errors.push(`Duplicate brand slug: ${b.slug}`);
    brandSlugs.add(b.slug);
    if (!b.name || !b.normalizedName) errors.push(`Brand ${b.slug} missing name/normalizedName`);

    if (b.fragrances.length === 0) errors.push(`Brand ${b.slug} has no fragrances`);

    for (const f of b.fragrances) {
      fragranceCount++;
      if (fragranceSlugs.has(f.slug)) errors.push(`Duplicate fragrance slug: ${f.slug}`);
      fragranceSlugs.add(f.slug);
      if (!f.slug.startsWith(b.slug)) {
        errors.push(`Fragrance slug '${f.slug}' should be prefixed with brand slug '${b.slug}'`);
      }
      if (f.variants.length === 0) errors.push(`Fragrance ${f.slug} has no variants`);
      if (f.releaseYear !== undefined && (f.releaseYear < 1900 || f.releaseYear > CURRENT_YEAR + 1)) {
        errors.push(`Fragrance ${f.slug} has implausible release year ${f.releaseYear}`);
      }

      for (const v of f.variants) {
        variantCount++;
        if (!Number.isInteger(v.sizeMl) || v.sizeMl <= 0) {
          errors.push(`Variant of ${f.slug} has invalid sizeMl: ${v.sizeMl}`);
        }
        const sku = canonicalSku(f.slug, v.concentration, v.sizeMl, v.presentation);
        if (skus.has(sku)) errors.push(`Duplicate canonical SKU: ${sku}`);
        skus.add(sku);
      }
    }
  }

  if (variantCount < MIN_VARIANTS) {
    errors.push(`Catalog has ${variantCount} variants; MVP requires at least ${MIN_VARIANTS}.`);
  }

  // Report (stderr-free summary on success).
  console.log(
    `Catalog: ${catalog.length} brands, ${fragranceCount} fragrances, ${variantCount} variants, ${skus.size} unique SKUs.`,
  );
  return errors;
}

const errors = validate();
if (errors.length > 0) {
  console.error(`\n✗ Catalog validation failed with ${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("✓ Catalog validation passed.");
