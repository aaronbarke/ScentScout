import { formatCents } from "@/lib/format";

export interface ChartPoint {
  t: number; // epoch ms
  priceCents: number;
}

/**
 * Minimal dependency-free price sparkline. Renders a filled line over the
 * price series; with a single point it shows a marker and a flat baseline.
 */
export function PriceHistoryChart({ points }: { points: ChartPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-line-strong text-sm text-faint">
        No price history yet
      </div>
    );
  }

  const W = 640;
  const H = 160;
  const PAD = 24;
  const sorted = [...points].sort((a, b) => a.t - b.t);

  const prices = sorted.map((p) => p.priceCents);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const spanP = maxP - minP || 1;
  const minT = sorted[0].t;
  const maxT = sorted[sorted.length - 1].t;
  const spanT = maxT - minT || 1;

  const x = (t: number) => PAD + ((t - minT) / spanT) * (W - 2 * PAD);
  // A flat series has no range to scale against — centre it rather than pinning
  // it to the baseline, which would read as "the price collapsed to zero".
  const flat = maxP === minP;
  const y = (p: number) => (flat ? H / 2 : H - PAD - ((p - minP) / spanP) * (H - 2 * PAD));

  const coords = sorted.map((p) => [x(p.t), y(p.priceCents)] as const);
  const line = coords.map(([cx, cy], i) => `${i === 0 ? "M" : "L"}${cx.toFixed(1)},${cy.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${H - PAD} L${coords[0][0].toFixed(1)},${H - PAD} Z`;

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" role="img" aria-label="Price history">
        <defs>
          <linearGradient id="ph-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="text-accent">
          {coords.length > 1 && !flat && <path d={area} fill="url(#ph-fill)" />}
          {coords.length > 1 && <path d={line} fill="none" stroke="currentColor" strokeWidth={2} />}
          {coords.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={3} fill="currentColor" />
          ))}
        </g>
        {/* With a flat series a high/low pair is noise — label it once. */}
        {flat ? (
          <text x={PAD} y={H / 2 - 12} className="fill-current text-[11px] opacity-60">
            {formatCents(minP)}
          </text>
        ) : (
          <>
            <text x={PAD} y={14} className="fill-current text-[10px] opacity-50">{formatCents(maxP)}</text>
            <text x={PAD} y={H - 6} className="fill-current text-[10px] opacity-50">{formatCents(minP)}</text>
          </>
        )}
      </svg>
    </figure>
  );
}
