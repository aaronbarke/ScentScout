import Link from "next/link";
import { SearchBox } from "@/components/SiteHeader";
import { PresentationTag } from "@/components/GuidanceBadge";
import { listCatalog, getCatalogStats } from "@/domain/catalog/queries";
import { presentationLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [catalog, stats] = await Promise.all([listCatalog(), getCatalogStats()]);

  const [lead, ...rest] = catalog;
  const featured = rest.slice(0, 6);
  const houses = [...new Set(catalog.map((f) => f.brandName))].sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-24">
      {/* Hero: asymmetric and open — no card wrapper. */}
      <section className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="eyebrow">Exact-variant price comparison</p>
          <h1 className="mt-5 font-display text-[2.75rem] leading-[1.05] text-ink sm:text-[4rem]">
            Buy the <em className="italic text-accent">exact</em> fragrance —
            <br className="hidden sm:block" /> at the best delivered price.
          </h1>
        </div>
        <div className="flex items-end lg:col-span-4">
          <p className="max-w-sm text-[15px] leading-relaxed text-body">
            We compare a single exact variant — house, fragrance, size, concentration and
            presentation — and never mix a tester with a retail bottle. The price includes required
            shipping, or we say plainly that shipping is unknown.
          </p>
        </div>

        <div className="lg:col-span-12">
          <SearchBox />
        </div>

        <dl className="grid grid-cols-3 border-t border-line pt-5 sm:max-w-lg lg:col-span-12">
          {[
            { n: stats.variants, l: "exact variants" },
            { n: stats.fragrances, l: "fragrances" },
            { n: stats.brands, l: "houses" },
          ].map((s) => (
            <div key={s.l}>
              <dt className="font-display text-3xl tabular text-ink">{s.n}</dt>
              <dd className="eyebrow mt-1">{s.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Selected fragrances: one lead item, then a compact index. */}
      <section>
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <h2 className="font-display text-2xl text-ink">Selected fragrances</h2>
          <Link href="/fragrances" className="eyebrow transition-colors hover:text-accent">
            View all →
          </Link>
        </div>

        <div className="grid gap-x-12 lg:grid-cols-12">
          {lead && (
            <Link
              href={`/fragrances/${lead.slug}`}
              className="group block border-b border-line py-8 lg:col-span-5 lg:border-r lg:border-b-0 lg:pr-12"
            >
              <p className="eyebrow">{lead.brandName}</p>
              <h3 className="mt-2 font-display text-4xl leading-tight text-ink transition-colors group-hover:text-accent">
                {lead.name}
              </h3>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {[...new Set(lead.variants.map((v) => v.presentation))].map((p) => (
                  <PresentationTag key={p} presentation={p} label={presentationLabel(p)} />
                ))}
              </div>
              <p className="mt-4 text-sm text-muted">
                {lead.variants.length} exact variants ·{" "}
                {[...new Set(lead.variants.map((v) => v.sizeMl))]
                  .sort((a, b) => a - b)
                  .map((s) => `${s}ml`)
                  .join(" / ")}
              </p>
            </Link>
          )}

          <ul className="lg:col-span-7">
            {featured.map((f) => (
              <li key={f.fragranceId}>
                <Link
                  href={`/fragrances/${f.slug}`}
                  className="group flex items-baseline gap-4 border-b border-line py-4"
                >
                  <span className="eyebrow w-32 shrink-0 truncate">{f.brandName}</span>
                  <span className="font-display text-xl text-ink transition-colors group-hover:text-accent">
                    {f.name}
                  </span>
                  <span className="ml-auto shrink-0 text-xs tabular text-faint">
                    {f.variants.length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Principles as rule-separated columns rather than boxes. */}
      <section className="grid gap-x-12 gap-y-8 border-t border-line pt-10 sm:grid-cols-3">
        {[
          {
            n: "01",
            title: "Exact matching",
            body: "Retail, tester, refill, gift set and body products are never silently combined. Uncertain matches go to review, not to your screen.",
          },
          {
            n: "02",
            title: "Honest delivered price",
            body: "Verified discounts plus required shipping. When a retailer doesn't publish shipping, we say so instead of inventing a total.",
          },
          {
            n: "03",
            title: "Buy-now guidance",
            body: "Grounded in observed price history — and it says “not enough history yet” when that is the truth.",
          },
        ].map((c) => (
          <div key={c.n}>
            <p className="font-display text-2xl tabular text-accent">{c.n}</p>
            <h3 className="mt-2 font-display text-xl text-ink">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
          </div>
        ))}
      </section>

      {/* House index — the typographic directory fragrance sites use. */}
      <section className="border-t border-line pt-10">
        <h2 className="eyebrow">Houses</h2>
        <ul className="mt-5 columns-2 gap-x-12 sm:columns-3 lg:columns-4">
          {houses.map((h) => (
            <li key={h} className="mb-2 break-inside-avoid">
              <Link
                href={`/search?q=${encodeURIComponent(h)}`}
                className="font-display text-lg text-body transition-colors hover:text-accent"
              >
                {h}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
