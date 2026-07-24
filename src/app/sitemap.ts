import type { MetadataRoute } from "next";
import { listCatalog } from "@/domain/catalog/queries";

/**
 * The sitemap reflects live catalogue state, so it must be generated per
 * request rather than at build time — a cached sitemap would also force a
 * database connection during `next build`, which we deliberately avoid.
 */
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/fragrances`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/deals`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/restocks`, lastModified: now, changeFrequency: "hourly", priority: 0.6 },
    { url: `${SITE_URL}/disclosure`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const catalog = await listCatalog();
    const fragranceRoutes: MetadataRoute.Sitemap = catalog.map((f) => ({
      url: `${SITE_URL}/fragrances/${f.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    // Exact-variant pages are the canonical, indexable comparison pages (ADR-005).
    const variantRoutes: MetadataRoute.Sitemap = catalog.flatMap((f) =>
      f.variants.map((v) => ({
        url: `${SITE_URL}/fragrances/${f.slug}/${v.variantPath}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    );

    return [...staticRoutes, ...fragranceRoutes, ...variantRoutes];
  } catch {
    // A database hiccup must not take the sitemap down entirely — serve the
    // static routes rather than a 500.
    return staticRoutes;
  }
}
