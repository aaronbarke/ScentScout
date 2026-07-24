import Link from "next/link";
import { SearchBox } from "@/components/SiteHeader";
import { FragranceCard } from "@/components/FragranceCard";
import { listCatalog, getCatalogStats } from "@/domain/catalog/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [catalog, stats] = await Promise.all([listCatalog(), getCatalogStats()]);
  const featured = catalog.slice(0, 6);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-line bg-surface p-8">
        <h1 className="max-w-3xl font-display text-[2.6rem] leading-[1.08] text-ink sm:text-6xl">
          Buy the <span className="text-accent">exact</span> fragrance —
          at the best delivered price.
        </h1>
        <p className="mt-3 max-w-2xl text-body">
          ScentScout compares exact variants — brand, fragrance, size, concentration, and
          presentation — and never mixes testers with retail bottles. We estimate the delivered
          price before tax and tell you honestly whether to buy now or wait.
        </p>
        <div className="mt-6">
          <SearchBox />
        </div>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
          <div>
            <dt className="inline font-semibold text-ink">{stats.variants}</dt>{" "}
            exact variants
          </div>
          <div>
            <dt className="inline font-semibold text-ink">{stats.fragrances}</dt>{" "}
            fragrances
          </div>
          <div>
            <dt className="inline font-semibold text-ink">{stats.brands}</dt>{" "}
            brands
          </div>
        </dl>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-ink">Browse fragrances</h2>
          <Link href="/fragrances" className="text-sm font-medium text-accent hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((f) => (
            <FragranceCard key={f.fragranceId} fragrance={f} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Exact matching", body: "Retail, tester, refill, gift set, and body products are never silently combined." },
          { title: "Honest delivered price", body: "Verified discounts plus required shipping — or we say shipping is unknown." },
          { title: "Buy-now guidance", body: "Grounded in real price history, shown as guidance — never as certainty." },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-line bg-surface p-5">
            <h3 className="font-medium tabular">{c.title}</h3>
            <p className="mt-1 text-sm text-muted">{c.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
