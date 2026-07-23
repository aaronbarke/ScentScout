import type { Metadata } from "next";
import { SearchBox } from "@/components/SiteHeader";
import { FragranceCard } from "@/components/FragranceCard";
import { searchFragrances } from "@/domain/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search fragrances and brands on ScentScout.",
  robots: { index: false },
};

type Search = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Search) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchFragrances(q) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      <SearchBox defaultValue={q} />

      {q.trim() === "" ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Try a fragrance or brand — e.g. “Aventus”, “Le Labo”, “Grand Soir”.
        </p>
      ) : results.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No fragrances match “{q}”.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {results.length} result{results.length === 1 ? "" : "s"} for “{q}”.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((f) => (
              <FragranceCard key={f.fragranceId} fragrance={f} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
