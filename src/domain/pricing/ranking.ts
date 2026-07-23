/**
 * Delivery-aware ranking of offers for one canonical variant.
 *
 * The cheapest advertised price is NOT automatically best. Ranking weighs stock
 * state, whether a delivered total is even knowable, delivered price, delivery
 * speed, data freshness, and retailer trust — in that priority order. Pure.
 */

export interface RankableOffer {
  offerId: string;
  retailerName: string;
  listedPriceCents: number | null;
  /** null = shipping unknown, so no trustworthy delivered total. */
  deliveredPriceCents: number | null;
  inStock: boolean | null;
  shippingDaysMax: number | null;
  observedAt: Date;
  trustScore: number;
}

export interface RankedOffer extends RankableOffer {
  rank: number;
  /** Short, honest notes about why this offer sits where it does. */
  notes: string[];
}

const DAY_MS = 86_400_000;

/** In-stock (true) ranks above unknown (null), which ranks above out-of-stock. */
function stockTier(inStock: boolean | null): number {
  if (inStock === true) return 0;
  if (inStock === null) return 1;
  return 2;
}

/**
 * Compare two offers. Returns <0 when `a` should rank before `b`.
 * Deterministic; ties fall through to offerId so ordering is stable.
 */
function compareOffers(a: RankableOffer, b: RankableOffer): number {
  // 1. In stock first.
  const stock = stockTier(a.inStock) - stockTier(b.inStock);
  if (stock !== 0) return stock;

  // 2. A knowable delivered total beats an unknown-shipping offer — we won't
  //    rank a "looks cheap but shipping unknown" offer above a known total.
  const aKnown = a.deliveredPriceCents !== null;
  const bKnown = b.deliveredPriceCents !== null;
  if (aKnown !== bKnown) return aKnown ? -1 : 1;

  // 3. Lower price wins (delivered when known, else listed as a fallback basis).
  const aPrice = a.deliveredPriceCents ?? a.listedPriceCents;
  const bPrice = b.deliveredPriceCents ?? b.listedPriceCents;
  if (aPrice !== null && bPrice !== null && aPrice !== bPrice) return aPrice - bPrice;
  if (aPrice === null && bPrice !== null) return 1;
  if (aPrice !== null && bPrice === null) return -1;

  // 4. Faster delivery.
  const aDays = a.shippingDaysMax ?? Number.POSITIVE_INFINITY;
  const bDays = b.shippingDaysMax ?? Number.POSITIVE_INFINITY;
  if (aDays !== bDays) return aDays - bDays;

  // 5. Fresher data.
  if (a.observedAt.getTime() !== b.observedAt.getTime()) {
    return b.observedAt.getTime() - a.observedAt.getTime();
  }

  // 6. More trusted retailer.
  if (a.trustScore !== b.trustScore) return b.trustScore - a.trustScore;

  return a.offerId.localeCompare(b.offerId);
}

function notesFor(o: RankableOffer, now: Date): string[] {
  const notes: string[] = [];
  if (o.inStock === false) notes.push("out of stock");
  else if (o.inStock === null) notes.push("stock unknown");
  if (o.deliveredPriceCents === null) notes.push("shipping unknown — delivered total not shown");
  if (o.shippingDaysMax !== null) notes.push(`arrives in up to ${o.shippingDaysMax} days`);
  const ageDays = Math.floor((now.getTime() - o.observedAt.getTime()) / DAY_MS);
  if (ageDays >= 7) notes.push(`price is ${ageDays} days old`);
  return notes;
}

export function rankOffers(offers: RankableOffer[], now: Date = new Date()): RankedOffer[] {
  return [...offers]
    .sort(compareOffers)
    .map((o, i) => ({ ...o, rank: i + 1, notes: notesFor(o, now) }));
}
