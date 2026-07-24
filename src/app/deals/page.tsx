import type { Metadata } from "next";
import Link from "next/link";
import { listVariantsWithOffers } from "@/domain/catalog/queries";
import { getVariantOfferBoard } from "@/domain/pricing/offers";
import { GuidanceBadge } from "@/components/GuidanceBadge";
import { formatCents, variantDescriptor } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deals",
  description: "Variants currently offered, ranked by price history rather than sticker price.",
};

export default async function DealsPage() {
  const variants = await listVariantsWithOffers();
  const boards = (
    await Promise.all(variants.map((v) => getVariantOfferBoard(v.canonicalSku)))
  ).filter((b): b is NonNullable<typeof b> => b !== null && b.offers.length > 0);

  const order = ["exceptional_price", "good_price", "normal_price", "expensive", "insufficient_history"];
  boards.sort(
    (a, b) =>
      order.indexOf(a.guidance.label) - order.indexOf(b.guidance.label) ||
      (a.metrics.currentPriceCents ?? Infinity) - (b.metrics.currentPriceCents ?? Infinity),
  );

  const meta = new Map(variants.map((v) => [v.canonicalSku, v]));

  return (
    <div className="space-y-12">
      <header className="grid gap-x-12 gap-y-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">Ranked by history</p>
          <h1 className="mt-4 font-display text-[2.75rem] leading-tight text-ink">Deals</h1>
        </div>
        <div className="flex items-end lg:col-span-5">
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Ordered by how a price compares with its own history — not by the lowest sticker price.
            Only variants we can match with confidence appear here.
          </p>
        </div>
      </header>

      {boards.length === 0 ? (
        <p className="border-t border-line py-10 text-sm text-muted">
          No offers tracked yet. As retailers are ingested and matched, deals appear here.
        </p>
      ) : (
        <ol className="border-t border-line">
          {boards.map((b, i) => {
            const v = meta.get(b.canonicalSku)!;
            return (
              <li key={b.canonicalSku}>
                <Link
                  href={`/fragrances/${v.fragranceSlug}/${v.variantPath}`}
                  className="group flex flex-wrap items-baseline gap-x-5 gap-y-3 border-b border-line py-6"
                >
                  <span className="font-display text-lg tabular text-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="eyebrow">{b.brandName}</p>
                    <p className="mt-1 font-display text-2xl text-ink transition-colors group-hover:text-accent">
                      {b.fragranceName}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {variantDescriptor(v.concentration, v.sizeMl, v.presentation)}
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-6">
                    <GuidanceBadge label={b.guidance.label} />
                    <div className="text-right">
                      <div className="font-display text-2xl tabular text-ink">
                        {formatCents(b.metrics.currentPriceCents)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-faint">
                        {b.offers.length} offer{b.offers.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
