/** Presentation helpers shared across the UI. */

export function formatCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

const CONCENTRATION_LABELS: Record<string, string> = {
  eau_de_parfum: "Eau de Parfum",
  eau_de_toilette: "Eau de Toilette",
  parfum: "Parfum",
  extrait_de_parfum: "Extrait de Parfum",
  absolu: "Absolu",
  eau_de_cologne: "Eau de Cologne",
  eau_fraiche: "Eau Fraîche",
  elixir: "Elixir",
};

const PRESENTATION_LABELS: Record<string, string> = {
  retail: "Retail",
  tester: "Tester",
  refill: "Refill",
  unboxed: "Unboxed",
  gift_set: "Gift Set",
};

const GUIDANCE_LABELS: Record<string, string> = {
  exceptional_price: "Exceptional price",
  good_price: "Good price",
  normal_price: "Normal price",
  expensive: "Expensive",
  insufficient_history: "Insufficient history",
};

export const concentrationLabel = (c: string) => CONCENTRATION_LABELS[c] ?? c;
export const presentationLabel = (p: string) => PRESENTATION_LABELS[p] ?? p;
export const guidanceLabel = (g: string) => GUIDANCE_LABELS[g] ?? g;

/** A one-line variant descriptor: "Eau de Parfum · 100ml · Retail". */
export function variantDescriptor(concentration: string, sizeMl: number, presentation: string): string {
  return `${concentrationLabel(concentration)} · ${sizeMl}ml · ${presentationLabel(presentation)}`;
}

/** Human "n days ago" / "today" freshness. */
export function freshnessLabel(date: Date | null): string {
  if (!date) return "no data yet";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "updated today";
  if (days === 1) return "updated yesterday";
  return `updated ${days} days ago`;
}
