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
    <div className="space-y-6">
      <nav className="text-sm text-slate-400">
        <Link href="/fragrances" className="hover:underline">
          Fragrances
        </Link>{" "}
        / <span className="text-slate-600 dark:text-slate-300">{fragrance.name}</span>
      </nav>

      <header>
        <div className="text-sm font-medium uppercase tracking-wide text-slate-400">
          {fragrance.brandName}
        </div>
        <h1 className="text-3xl font-bold">{fragrance.name}</h1>
        {fragrance.releaseYear && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Released {fragrance.releaseYear}</p>
        )}
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Exact variants ({fragrance.variants.length})
        </h2>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {fragrance.variants.map((v) => (
            <li key={v.canonicalSku}>
              <Link
                href={`/fragrances/${fragrance.slug}/${v.variantPath}`}
                className="flex items-center gap-3 bg-white p-4 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <div>
                  <div className="font-medium">
                    {concentrationLabel(v.concentration)} · {v.sizeMl}ml
                  </div>
                  <div className="mt-1">
                    <PresentationTag presentation={v.presentation} label={presentationLabel(v.presentation)} />
                  </div>
                </div>
                <span className="ml-auto text-sm text-indigo-600 dark:text-indigo-400">Compare →</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-400">
          Each variant is compared separately — a tester is never combined with a retail bottle, and
          different sizes or concentrations are never merged.
        </p>
      </section>
    </div>
  );
}
