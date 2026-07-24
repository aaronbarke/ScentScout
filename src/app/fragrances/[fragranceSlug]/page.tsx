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
      <nav className="text-sm text-faint">
        <Link href="/fragrances" className="hover:underline">
          Fragrances
        </Link>{" "}
        / <span className="text-body">{fragrance.name}</span>
      </nav>

      <header>
        <div className="eyebrow">
          {fragrance.brandName}
        </div>
        <h1 className="font-display text-[2.6rem] leading-tight text-ink">{fragrance.name}</h1>
        {fragrance.releaseYear && (
          <p className="mt-1 text-sm text-muted">Released {fragrance.releaseYear}</p>
        )}
      </header>

      <section>
        <h2 className="mb-3 eyebrow">
          Exact variants ({fragrance.variants.length})
        </h2>
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {fragrance.variants.map((v) => (
            <li key={v.canonicalSku}>
              <Link
                href={`/fragrances/${fragrance.slug}/${v.variantPath}`}
                className="flex items-center gap-3 bg-surface p-4 hover:bg-raised"
              >
                <div>
                  <div className="font-medium">
                    {concentrationLabel(v.concentration)} · {v.sizeMl}ml
                  </div>
                  <div className="mt-1">
                    <PresentationTag presentation={v.presentation} label={presentationLabel(v.presentation)} />
                  </div>
                </div>
                <span className="ml-auto text-sm text-accent">Compare →</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-faint">
          Each variant is compared separately — a tester is never combined with a retail bottle, and
          different sizes or concentrations are never merged.
        </p>
      </section>
    </div>
  );
}
