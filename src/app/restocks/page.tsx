import type { Metadata } from "next";
import Link from "next/link";
import { listRecentRestocks } from "@/domain/catalog/queries";
import { formatCents, variantDescriptor, freshnessLabel } from "@/lib/format";
import { variantPath } from "@/lib/catalog-slug";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recent restocks",
  description: "Fragrance variants recently observed in stock across tracked retailers.",
};

export default async function RestocksPage() {
  const rows = await listRecentRestocks();

  return (
    <div className="space-y-12">
      <header className="grid gap-x-12 gap-y-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">Availability</p>
          <h1 className="mt-4 font-display text-[2.75rem] leading-tight text-ink">
            Recent restocks
          </h1>
        </div>
        <div className="flex items-end lg:col-span-5">
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Variants most recently observed in stock. A parser failure is never recorded as
            out-of-stock, so everything here is a genuine availability signal.
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="border-t border-line py-10 text-sm text-muted">
          No in-stock observations yet.
        </p>
      ) : (
        <ul className="border-t border-line">
          {rows.map((r, i) => {
            const path = variantPath(
              r.concentration as Parameters<typeof variantPath>[0],
              r.sizeMl,
              r.presentation as Parameters<typeof variantPath>[2],
            );
            return (
              <li key={`${r.canonicalSku}-${i}`}>
                <Link
                  href={`/fragrances/${r.fragranceSlug}/${path}`}
                  className="group flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-line py-5"
                >
                  <span className="eyebrow w-36 shrink-0 truncate">{r.brandName}</span>
                  <span className="font-display text-xl text-ink transition-colors group-hover:text-accent">
                    {r.fragranceName}
                  </span>
                  <span className="text-xs text-muted">
                    {variantDescriptor(r.concentration, r.sizeMl, r.presentation)}
                  </span>
                  <span className="ml-auto flex shrink-0 items-baseline gap-6">
                    <span className="text-[11px] text-faint">{freshnessLabel(r.observedAt)}</span>
                    <span className="font-display text-xl tabular text-ink">
                      {formatCents(r.listedPriceCents)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
