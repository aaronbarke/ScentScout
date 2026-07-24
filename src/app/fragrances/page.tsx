import type { Metadata } from "next";
import { SearchBox } from "@/components/SiteHeader";
import { FragranceCard } from "@/components/FragranceCard";
import { listCatalog, type FragranceSummary } from "@/domain/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All fragrances",
  description: "Browse every fragrance ScentScout tracks, arranged by house.",
};

export default async function FragrancesPage() {
  const catalog = await listCatalog();

  // Group into a house-by-house directory.
  const byHouse = new Map<string, FragranceSummary[]>();
  for (const f of catalog) {
    byHouse.set(f.brandName, [...(byHouse.get(f.brandName) ?? []), f]);
  }
  const houses = [...byHouse.keys()].sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-14">
      <header className="grid gap-x-12 gap-y-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">The catalogue</p>
          <h1 className="mt-4 font-display text-[2.75rem] leading-tight text-ink">
            All fragrances
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            {catalog.length} fragrances across {houses.length} houses. Each fragrance opens to its
            exact variants — size, concentration and presentation kept strictly separate.
          </p>
        </div>
        <div className="flex items-end lg:col-span-5">
          <SearchBox />
        </div>
      </header>

      <div className="space-y-12">
        {houses.map((house) => (
          <section key={house}>
            <h2 className="border-b border-line-strong pb-2 font-display text-xl text-ink">
              {house}
            </h2>
            <div>
              {byHouse.get(house)!.map((f) => (
                <FragranceCard key={f.fragranceId} fragrance={f} showBrand={false} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
