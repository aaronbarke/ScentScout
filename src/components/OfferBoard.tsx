import type { VariantOfferBoard } from "@/domain/pricing/offers";
import { GuidanceBadge } from "./GuidanceBadge";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { formatCents, freshnessLabel } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 font-semibold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

export function OfferBoard({ board, chartPoints }: { board: VariantOfferBoard; chartPoints: { t: number; priceCents: number }[] }) {
  const m = board.metrics;

  return (
    <div className="space-y-6">
      {/* Guidance + current price */}
      <div className="flex flex-wrap items-center gap-3">
        <GuidanceBadge label={board.guidance.label} />
        <span className="text-sm text-slate-500 dark:text-slate-400">{board.guidance.summary}</span>
        {m.latestObservedAt && (
          <span className="ml-auto text-xs text-slate-400">{freshnessLabel(m.latestObservedAt)}</span>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Current" value={formatCents(m.currentPriceCents)} />
        <Stat label="30-day low" value={formatCents(m.low30Cents)} />
        <Stat label="90-day low" value={formatCents(m.low90Cents)} />
        <Stat label="All-time low" value={formatCents(m.allTimeLowCents)} />
      </div>

      {/* Chart */}
      <div className="text-slate-700 dark:text-slate-200">
        <PriceHistoryChart points={chartPoints} />
        <div className="mt-1 text-xs text-slate-400">
          {m.observationCount} observation{m.observationCount === 1 ? "" : "s"} over {m.coverageDays} day
          {m.coverageDays === 1 ? "" : "s"}
        </div>
      </div>

      {/* Offers */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
          Where to buy ({board.offers.length})
        </h2>
        {board.offers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
            No matched offers yet for this exact variant. We only show offers we can match with
            confidence — never a different size, concentration, or presentation.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {board.offers.map((o) => (
              <li key={o.offerId} className="flex flex-wrap items-center gap-3 bg-white p-4 dark:bg-slate-900">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white">{o.retailerName}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                    {o.notes.map((n, i) => (
                      <span key={i}>{n}</span>
                    ))}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {o.deliveredPriceCents !== null ? formatCents(o.deliveredPriceCents) : formatCents(o.listedPriceCents)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {o.deliveredPriceCents !== null
                      ? "delivered before tax"
                      : "plus unknown shipping"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Estimated delivered prices are before tax and include verified discounts and required
          shipping. The cheapest advertised price isn&apos;t always the best deal.
        </p>
      </div>
    </div>
  );
}
