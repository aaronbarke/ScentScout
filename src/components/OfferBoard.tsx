import type { ReactNode } from "react";
import type { VariantOfferBoard } from "@/domain/pricing/offers";
import { GuidanceBadge } from "./GuidanceBadge";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { formatCents, freshnessLabel } from "@/lib/format";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line py-2.5">
      <dt className="eyebrow">{label}</dt>
      <dd className="font-display text-lg tabular text-ink">{value}</dd>
    </div>
  );
}

export function OfferBoard({
  board,
  chartPoints,
  rail,
}: {
  board: VariantOfferBoard;
  chartPoints: { t: number; priceCents: number }[];
  rail?: ReactNode;
}) {
  const m = board.metrics;

  return (
    <div className="grid gap-x-12 gap-y-12 lg:grid-cols-12">
      {/* Main column: offers, then history. */}
      <div className="lg:col-span-7">
        <h2 className="border-b border-line pb-3 eyebrow">
          Where to buy · {board.offers.length}
        </h2>

        {board.offers.length === 0 ? (
          <p className="py-8 text-sm leading-relaxed text-muted">
            No matched offers yet for this exact variant. We only list an offer we can match with
            confidence — never a different size, concentration or presentation.
          </p>
        ) : (
          <ol>
            {board.offers.map((o, i) => (
              <li
                key={o.offerId}
                className="flex items-baseline gap-5 border-b border-line py-5"
              >
                <span className="font-display text-lg tabular text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="font-display text-xl text-ink">{o.retailerName}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {o.notes.map((n, j) => (
                      <span key={j}>{n}</span>
                    ))}
                  </div>
                </div>
                <div className="ml-auto shrink-0 text-right">
                  <div className="font-display text-2xl tabular text-ink">
                    {o.deliveredPriceCents !== null
                      ? formatCents(o.deliveredPriceCents)
                      : formatCents(o.listedPriceCents)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-faint">
                    {o.deliveredPriceCents !== null
                      ? "delivered, before tax"
                      : "plus unknown shipping"}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-4 max-w-prose text-xs leading-relaxed text-faint">
          Estimated delivered prices are before tax and include verified discounts and required
          shipping. The cheapest advertised price isn&apos;t always the best deal.
        </p>

        <div className="mt-12">
          <h2 className="border-b border-line pb-3 eyebrow">Price history</h2>
          <div className="mt-6 text-accent">
            <PriceHistoryChart points={chartPoints} />
          </div>
          <p className="mt-2 text-xs text-faint">
            {m.observationCount} observation{m.observationCount === 1 ? "" : "s"} over{" "}
            {m.coverageDays} day{m.coverageDays === 1 ? "" : "s"}
            {m.latestObservedAt ? ` · ${freshnessLabel(m.latestObservedAt)}` : ""}
          </p>
        </div>
      </div>

      {/* Rail: verdict, figures, and the track controls. */}
      <aside className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <GuidanceBadge label={board.guidance.label} />
          <p className="mt-4 font-display text-2xl leading-snug text-ink">
            {board.guidance.summary}
          </p>

          <dl className="mt-8 border-t border-line">
            <Metric label="Current" value={formatCents(m.currentPriceCents)} />
            <Metric label="30-day low" value={formatCents(m.low30Cents)} />
            <Metric label="90-day low" value={formatCents(m.low90Cents)} />
            <Metric label="All-time low" value={formatCents(m.allTimeLowCents)} />
          </dl>

          {rail && <div className="mt-8">{rail}</div>}
        </div>
      </aside>
    </div>
  );
}
