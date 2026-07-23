/**
 * Money parsing shared by adapters. Retailers publish prices as strings
 * ("290.0", "$1,299.99"); we store integer cents and never floats.
 */

/**
 * Convert a retailer price string/number to integer cents, or null if it isn't
 * a usable price. Uses Math.round to absorb binary float error — e.g.
 * 19.99 * 100 === 1998.9999999999998, which must become 1999, not 1998.
 */
export function parsePriceToCents(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  let n: number;
  if (typeof value === "number") {
    n = value;
  } else if (typeof value === "string") {
    // Strip currency symbols, thousands separators and whitespace.
    const cleaned = value.replace(/[^0-9.\-]/g, "");
    if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
    n = Number(cleaned);
  } else {
    return null;
  }

  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Normalize a currency code. Some retailers emit "US" instead of "USD". */
export function normalizeCurrency(value: unknown, fallback = "USD"): string {
  if (typeof value !== "string") return fallback;
  const c = value.trim().toUpperCase();
  if (c === "US" || c === "USD" || c === "$") return "USD";
  return /^[A-Z]{3}$/.test(c) ? c : fallback;
}

/** Ounces → millilitres (1 fl oz US ≈ 29.5735 ml), rounded to the nearest ml. */
export function ozToMl(oz: number): number {
  return Math.round(oz * 29.5735);
}
