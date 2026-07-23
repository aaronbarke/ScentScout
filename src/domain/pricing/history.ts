/**
 * Historical price metrics, computed from append-only observations.
 *
 * Metric basis is the **listed price** (the consistently-available signal),
 * not the delivered price — delivered price is often null because shipping is
 * unknown, and mixing bases would corrupt percentiles. See ADR-009.
 *
 * All money is integer cents; time is UTC. Pure functions only — no I/O.
 */

export interface ObservationPoint {
  observedAt: Date;
  listedPriceCents: number | null;
  inStock: boolean | null;
}

const DAY_MS = 86_400_000;

export interface PriceMetrics {
  /** Most recent valid listed price. */
  currentPriceCents: number | null;
  low30Cents: number | null;
  low90Cents: number | null;
  low180Cents: number | null;
  allTimeLowCents: number | null;
  median30Cents: number | null;
  median90Cents: number | null;
  /** Percent of valid observations priced strictly below the current price (0–100). */
  pricePercentile: number | null;
  /** Count of valid (positive, non-null) price observations. */
  observationCount: number;
  /** Number of in-stock ↔ out-of-stock transitions across the series. */
  stockTransitions: number;
  /** Days between the earliest and latest valid observation. */
  coverageDays: number;
  /** Age of the most recent valid observation, in whole days. */
  freshnessDays: number | null;
  latestObservedAt: Date | null;
}

function isValid(o: ObservationPoint): o is ObservationPoint & { listedPriceCents: number } {
  return o.listedPriceCents !== null && o.listedPriceCents > 0;
}

function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function within(o: { observedAt: Date }, now: Date, days: number): boolean {
  return now.getTime() - o.observedAt.getTime() <= days * DAY_MS;
}

/** Count stock-state changes, ignoring observations with unknown (null) stock. */
function countStockTransitions(ordered: ObservationPoint[]): number {
  let transitions = 0;
  let last: boolean | null = null;
  for (const o of ordered) {
    if (o.inStock === null) continue;
    if (last !== null && o.inStock !== last) transitions++;
    last = o.inStock;
  }
  return transitions;
}

export function computePriceMetrics(
  observations: ObservationPoint[],
  now: Date = new Date(),
): PriceMetrics {
  const ordered = [...observations].sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime());
  const valid = ordered.filter(isValid);

  const empty: PriceMetrics = {
    currentPriceCents: null,
    low30Cents: null,
    low90Cents: null,
    low180Cents: null,
    allTimeLowCents: null,
    median30Cents: null,
    median90Cents: null,
    pricePercentile: null,
    observationCount: 0,
    stockTransitions: countStockTransitions(ordered),
    coverageDays: 0,
    freshnessDays: null,
    latestObservedAt: null,
  };
  if (valid.length === 0) return empty;

  const prices = valid.map((o) => o.listedPriceCents);
  const latest = valid[valid.length - 1];
  const current = latest.listedPriceCents;

  const pricesIn = (days: number) => valid.filter((o) => within(o, now, days)).map((o) => o.listedPriceCents);
  const lowOf = (arr: number[]) => (arr.length ? Math.min(...arr) : null);

  const p30 = pricesIn(30);
  const p90 = pricesIn(90);
  const p180 = pricesIn(180);

  const below = prices.filter((p) => p < current).length;
  const pricePercentile = Math.round((below / prices.length) * 100);

  const earliest = valid[0].observedAt;
  const coverageDays = Math.round((latest.observedAt.getTime() - earliest.getTime()) / DAY_MS);
  const freshnessDays = Math.max(0, Math.floor((now.getTime() - latest.observedAt.getTime()) / DAY_MS));

  return {
    currentPriceCents: current,
    low30Cents: lowOf(p30),
    low90Cents: lowOf(p90),
    low180Cents: lowOf(p180),
    allTimeLowCents: Math.min(...prices),
    median30Cents: median([...p30].sort((a, b) => a - b)),
    median90Cents: median([...p90].sort((a, b) => a - b)),
    pricePercentile,
    observationCount: valid.length,
    stockTransitions: countStockTransitions(ordered),
    coverageDays,
    freshnessDays,
    latestObservedAt: latest.observedAt,
  };
}
