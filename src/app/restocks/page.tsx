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
        <h1 className="text-2xl font-bold">Recent restocks</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Variants most recently observed in stock. A parser failure is never treated as
          out-of-stock, so this reflects genuine availability signals.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
          No in-stock observations yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
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
                  className="flex flex-wrap items-center gap-3 bg-white p-4 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {r.brandName} — {r.fragranceName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {variantDescriptor(r.concentration, r.sizeMl, r.presentation)}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-semibold">{formatCents(r.listedPriceCents)}</div>
                    <div className="text-[11px] text-slate-400">{freshnessLabel(r.observedAt)}</div>
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
