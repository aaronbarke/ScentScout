import type { Metadata } from "next";
import Link from "next/link";
import { listRecentRestocks } from "@/domain/catalog/queries";
import { formatCents, variantDescriptor, freshnessLabel } from "@/lib/format";
import { variantPath } from "@/lib/catalog-slug";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recent restocks",
  description: "Fragrance variants recently seen in stock across tracked retailers.",
};

export default async function RestocksPage() {
  const rows = await listRecentRestocks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[2.1rem] leading-tight text-ink">Recent restocks</h1>
        <p className="mt-1 text-sm text-muted">
          Variants most recently observed in stock. A parser failure is never treated as
          out-of-stock, so this reflects genuine availability signals.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong p-6 text-sm text-muted">
          No in-stock observations yet.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
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
                  className="flex flex-wrap items-center gap-3 bg-surface p-4 hover:bg-raised"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {r.brandName} — {r.fragranceName}
                    </div>
                    <div className="text-xs text-muted">
                      {variantDescriptor(r.concentration, r.sizeMl, r.presentation)}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-medium tabular">{formatCents(r.listedPriceCents)}</div>
                    <div className="text-[11px] text-faint">{freshnessLabel(r.observedAt)}</div>
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
