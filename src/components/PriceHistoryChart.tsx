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
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400 dark:border-slate-700">
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
  const y = (p: number) => H - PAD - ((p - minP) / spanP) * (H - 2 * PAD);

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
        <g className="text-indigo-500">
          {coords.length > 1 && <path d={area} fill="url(#ph-fill)" />}
          {coords.length > 1 && <path d={line} fill="none" stroke="currentColor" strokeWidth={2} />}
          {coords.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={3} fill="currentColor" />
          ))}
        </g>
        <text x={PAD} y={14} className="fill-slate-400 text-[10px]">{formatCents(maxP)}</text>
        <text x={PAD} y={H - 6} className="fill-slate-400 text-[10px]">{formatCents(minP)}</text>
      </svg>
    </figure>
  );
}
