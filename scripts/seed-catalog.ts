import "dotenv/config";
import { db, queryClient } from "@/db/client";
import { brands, fragrances, productVariants } from "@/db/schema";
import { catalog } from "@/db/seed/catalog";
import { canonicalSku } from "@/lib/catalog-slug";

/**
 * Idempotent catalog seed. Safe to run repeatedly: every upsert targets a
 * stable unique key (brand.slug, fragrance.slug, product_variant.canonical_sku),
 * so re-runs update rather than duplicate.
 */
async function seed() {
  const now = new Date();
  let brandCount = 0;
  let fragranceCount = 0;
  let variantCount = 0;

  await db.transaction(async (tx) => {
    for (const b of catalog) {
      const [brandRow] = await tx
        .insert(brands)
        .values({
          name: b.name,
          slug: b.slug,
          normalizedName: b.normalizedName,
          officialUrl: b.officialUrl,
        })
        .onConflictDoUpdate({
          target: brands.slug,
          set: {
            name: b.name,
            normalizedName: b.normalizedName,
            officialUrl: b.officialUrl,
            updatedAt: now,
          },
        })
        .returning({ id: brands.id });
      brandCount++;

      for (const f of b.fragrances) {
        const [fragranceRow] = await tx
          .insert(fragrances)
          .values({
            brandId: brandRow.id,
            name: f.name,
            slug: f.slug,
            flankerName: f.flankerName,
            releaseYear: f.releaseYear,
          })
          .onConflictDoUpdate({
            target: fragrances.slug,
            set: {
              brandId: brandRow.id,
              name: f.name,
              flankerName: f.flankerName,
              releaseYear: f.releaseYear,
              updatedAt: now,
            },
          })
          .returning({ id: fragrances.id });
        fragranceCount++;

        for (const v of f.variants) {
          const sku = canonicalSku(f.slug, v.concentration, v.sizeMl, v.presentation);
          await tx
            .insert(productVariants)
            .values({
              fragranceId: fragranceRow.id,
              concentration: v.concentration,
              sizeMl: v.sizeMl,
              presentation: v.presentation,
              condition: "new",
              genderMarketing: f.gender,
              canonicalSku: sku,
            })
            .onConflictDoUpdate({
              target: productVariants.canonicalSku,
              set: {
                fragranceId: fragranceRow.id,
                concentration: v.concentration,
                sizeMl: v.sizeMl,
                presentation: v.presentation,
                genderMarketing: f.gender,
                updatedAt: now,
              },
            });
          variantCount++;
        }
      }
    }
  });

  console.log(
    `✓ Seeded ${brandCount} brands, ${fragranceCount} fragrances, ${variantCount} variants (idempotent).`,
  );
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await queryClient.end();
  });
