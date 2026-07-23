import { ozToMl } from "./money";

/**
 * Parse a retailer size string into millilitres.
 * Handles "100ml", "10ml Travel Size", "1ml spray", "3.4 oz", "2.4 fl oz".
 * Returns null when no size is expressible — callers must not guess.
 */
export function parseSizeMl(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const s = value.toLowerCase();

  const ml = s.match(/(\d+(?:\.\d+)?)\s*(?:ml|milliliters?|millilitres?)\b/);
  if (ml) {
    const n = Number(ml[1]);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }

  const oz = s.match(/(\d+(?:\.\d+)?)\s*(?:fl\.?\s*)?(?:oz|ounces?)\b/);
  if (oz) {
    const n = Number(oz[1]);
    return Number.isFinite(n) && n > 0 ? ozToMl(n) : null;
  }

  return null;
}

/**
 * True when a size label denotes a sample/decant/travel item. These are out of
 * MVP scope; we still parse them faithfully and let matching reject them on
 * size, but flagging is useful for diagnostics.
 */
export function looksLikeSampleOrTravel(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /\b(sample|decant|travel|spray vial|vial|atomizer)\b/i.test(value);
}
