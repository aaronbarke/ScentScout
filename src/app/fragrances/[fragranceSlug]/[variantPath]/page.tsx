import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVariantHeader } from "@/domain/catalog/queries";
import { getVariantOfferBoard } from "@/domain/pricing/offers";
import { OfferBoard } from "@/components/OfferBoard";
import { PresentationTag } from "@/components/GuidanceBadge";
import { variantDescriptor, presentationLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ fragranceSlug: string; variantPath: string }> };

const skuOf = (fragranceSlug: string, variantPath: string) => `${fragranceSlug}-${variantPath}`;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { fragranceSlug, variantPath } = await params;
  const header = await getVariantHeader(skuOf(fragranceSlug, variantPath));
  if (!header) return { title: "Variant not found" };
  const title = `${header.brandName} ${header.fragranceName} — ${variantDescriptor(
    header.concentration,
    header.sizeMl,
    header.presentation,
  )}`;
  return {
    title,
    description: `Where to buy ${header.brandName} ${header.fragranceName} (${header.sizeMl}ml ${presentationLabel(
      header.presentation,
    )}) at the best delivered price, with price history and buy-now guidance.`,
  };
}

export default async function VariantPage({ params }: Params) {
  const { fragranceSlug, variantPath } = await params;
  const sku = skuOf(fragranceSlug, variantPath);

  const [header, board] = await Promise.all([
    getVariantHeader(sku),
    getVariantOfferBoard(sku),
  ]);
  if (!header || !board) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-400">
        <Link href="/fragrances" className="hover:underline">
          Fragrances
        </Link>{" "}
        /{" "}
        <Link href={`/fragrances/${header.fragranceSlug}`} className="hover:underline">
          {header.fragranceName}
        </Link>{" "}
        / <span className="text-slate-600 dark:text-slate-300">{header.sizeMl}ml</span>
      </nav>

      <header>
        <div className="text-sm font-medium uppercase tracking-wide text-slate-400">
          {header.brandName}
        </div>
        <h1 className="text-3xl font-bold">{header.fragranceName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span>{variantDescriptor(header.concentration, header.sizeMl, header.presentation)}</span>
          <PresentationTag presentation={header.presentation} label={presentationLabel(header.presentation)} />
        </div>
      </header>

      <OfferBoard board={board} chartPoints={board.series} />
    </div>
  );
}
