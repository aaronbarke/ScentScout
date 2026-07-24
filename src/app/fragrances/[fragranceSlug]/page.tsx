import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFragrance } from "@/domain/catalog/queries";
import { PresentationTag } from "@/components/GuidanceBadge";
import { concentrationLabel, presentationLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ fragranceSlug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { fragranceSlug } = await params;
  const f = await getFragrance(fragranceSlug);
  if (!f) return { title: "Fragrance not found" };
  return {
    title: `${f.brandName} ${f.name}`,
    description: `Compare exact variants of ${f.brandName} ${f.name} by delivered price and price history.`,
  };
}

export default async function FragrancePage({ params }: Params) {
  const { fragranceSlug } = await params;
  const fragrance = await getFragrance(fragranceSlug);
  if (!fragrance) notFound();

  return (
    <div className="space-y-12">
      <nav className="text-xs text-faint">
        <Link href="/fragrances" className="transition-colors hover:text-accent">
          Fragrances
        </Link>
        <span className="mx-2">/</span>
        <span className="text-muted">{fragrance.name}</span>
      </nav>

      <header className="grid gap-x-12 gap-y-4 border-b border-line pb-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">{fragrance.brandName}</p>
          <h1 className="mt-4 font-display text-[3rem] leading-[1.05] text-ink">{fragrance.name}</h1>
        </div>
        <div className="flex items-end lg:col-span-5">
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {fragrance.releaseYear ? `Released ${fragrance.releaseYear}. ` : ""}
            Each variant below is compared separately — a tester is never combined with a retail
            bottle, and different sizes or concentrations are never merged.
          </p>
        </div>
      </header>

      <section>
        <h2 className="border-b border-line pb-3 eyebrow">
          Exact variants · {fragrance.variants.length}
        </h2>
        <ol>
          {fragrance.variants.map((v, i) => (
            <li key={v.canonicalSku}>
              <Link
                href={`/fragrances/${fragrance.slug}/${v.variantPath}`}
                className="group flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-line py-5"
              >
                <span className="font-display text-lg tabular text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-2xl text-ink transition-colors group-hover:text-accent">
                  {concentrationLabel(v.concentration)}
                </span>
                <span className="font-display text-2xl tabular text-body">{v.sizeMl}ml</span>
                <PresentationTag presentation={v.presentation} label={presentationLabel(v.presentation)} />
                <span className="ml-auto shrink-0 text-xs uppercase tracking-[0.12em] text-accent">
                  Compare →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
