import type { Metadata } from "next";
import { SearchBox } from "@/components/SiteHeader";
import { FragranceCard } from "@/components/FragranceCard";
import { listCatalog } from "@/domain/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All fragrances",
  description: "Browse every fragrance ScentScout tracks, grouped by brand.",
};

export default async function FragrancesPage() {
  const catalog = await listCatalog();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All fragrances</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {catalog.length} fragrances across {new Set(catalog.map((f) => f.brandName)).size} brands.
        </p>
      </div>
      <SearchBox />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.map((f) => (
          <FragranceCard key={f.fragranceId} fragrance={f} />
        ))}
      </div>
    </div>
  );
}
