import type { Metadata } from "next";
import Link from "next/link";
import { listVariantsWithOffers } from "@/domain/catalog/queries";
import { getVariantOfferBoard } from "@/domain/pricing/offers";
import { GuidanceBadge } from "@/components/GuidanceBadge";
import { formatCents, variantDescriptor } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deals",
  description: "Variants currently offered, ranked with honest buy-now guidance from price history.",
};

export default async function DealsPage() {
  const variants = await listVariantsWithOffers();
  const boards = (
    await Promise.all(variants.map((v) => getVariantOfferBoard(v.canonicalSku)))
  ).filter((b): b is NonNullable<typeof b> => b !== null && b.offers.length > 0);

  // Best guidance first, then lowest current price.
  const order = ["exceptional_price", "good_price", "normal_price", "expensive", "insufficient_history"];
  boards.sort(
    (a, b) =>
      order.indexOf(a.guidance.label) - order.indexOf(b.guidance.label) ||
      (a.metrics.currentPriceCents ?? Infinity) - (b.metrics.currentPriceCents ?? Infinity),
  );

  const meta = new Map(variants.map((v) => [v.canonicalSku, v]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deals</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          We rank by price history, not just the lowest sticker price — and we only show variants we
          can match with confidence.
        </p>
      </div>

      {boards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
          No offers tracked yet. As retailers are ingested and matched, deals will appear here.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {boards.map((b) => {
            const v = meta.get(b.canonicalSku)!;
            return (
              <li key={b.canonicalSku}>
                <Link
                  href={`/fragrances/${v.fragranceSlug}/${v.variantPath}`}
                  className="flex flex-wrap items-center gap-3 bg-white p-4 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {b.brandName} — {b.fragranceName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {variantDescriptor(v.concentration, v.sizeMl, v.presentation)}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <GuidanceBadge label={b.guidance.label} />
                    <div className="text-right">
                      <div className="font-semibold">{formatCents(b.metrics.currentPriceCents)}</div>
                      <div className="text-[11px] text-slate-400">{b.offers.length} offer{b.offers.length === 1 ? "" : "s"}</div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
