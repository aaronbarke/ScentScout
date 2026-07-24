import type { VariantOfferBoard } from "@/domain/pricing/offers";
import { GuidanceBadge } from "./GuidanceBadge";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { formatCents, freshnessLabel } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 font-display text-xl text-ink tabular">{value}</div>
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
        <span className="text-sm text-muted">{board.guidance.summary}</span>
        {m.latestObservedAt && (
          <span className="ml-auto text-xs text-faint">{freshnessLabel(m.latestObservedAt)}</span>
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
      <div className="text-body">
        <PriceHistoryChart points={chartPoints} />
        <div className="mt-1 text-xs text-faint">
          {m.observationCount} observation{m.observationCount === 1 ? "" : "s"} over {m.coverageDays} day
          {m.coverageDays === 1 ? "" : "s"}
        </div>
      </div>

      {/* Offers */}
      <div>
        <h2 className="mb-3 eyebrow">
          Where to buy ({board.offers.length})
        </h2>
        {board.offers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-muted">
            No matched offers yet for this exact variant. We only show offers we can match with
            confidence — never a different size, concentration, or presentation.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {board.offers.map((o) => (
              <li key={o.offerId} className="flex flex-wrap items-center gap-3 bg-surface p-4">
                <div className="min-w-0">
                  <div className="font-medium text-ink">{o.retailerName}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                    {o.notes.map((n, i) => (
                      <span key={i}>{n}</span>
                    ))}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-display text-2xl text-ink tabular">
                    {o.deliveredPriceCents !== null ? formatCents(o.deliveredPriceCents) : formatCents(o.listedPriceCents)}
                  </div>
                  <div className="text-xs text-faint">
                    {o.deliveredPriceCents !== null
                      ? "delivered before tax"
                      : "plus unknown shipping"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-faint">
          Estimated delivered prices are before tax and include verified discounts and required
          shipping. The cheapest advertised price isn&apos;t always the best deal.
        </p>
      </div>
    </div>
  );
}
