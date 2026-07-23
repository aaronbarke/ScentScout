import type { Concentration, Presentation } from "@/lib/catalog-slug";
import {
  BRAND_ALIASES,
  CONCENTRATION_ALIASES,
  PRESENTATION_KEYWORDS,
  BODY_PRODUCT_PATTERN,
} from "./aliases";

/**
 * Canonical text form: lowercase, accent-stripped, punctuation-free, single
 * spaces. "L'Homme Idéal" → "lhomme ideal", "Bal d'Afrique" → "bal dafrique".
 * Apostrophes are removed (not spaced) so "Angels' Share" → "angels share".
 */
export function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/['’`]/g, "") // apostrophes vanish
    .replace(/[^a-z0-9]+/g, " ") // everything else becomes a separator
    .trim()
    .replace(/\s+/g, " ");
}

/** Normalize a brand, resolving known aliases (MFK → maison francis kurkdjian). */
export function normalizeBrand(value: string | null | undefined): string {
  const base = normalizeText(value);
  if (!base) return "";
  return BRAND_ALIASES[base] ?? base;
}

/** Normalize a fragrance name for comparison. */
export function normalizeFragranceName(value: string | null | undefined): string {
  return normalizeText(value);
}

/**
 * Resolve a concentration from free text, longest alias first so
 * "eau de parfum" wins over "parfum". Returns null when absent — callers must
 * treat null as UNKNOWN, never as a default.
 */
export function normalizeConcentration(value: string | null | undefined): Concentration | null {
  const text = normalizeText(value);
  if (!text) return null;

  const aliases = Object.keys(CONCENTRATION_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const pattern = new RegExp(`(^|\\s)${alias.replace(/\s+/g, "\\s+")}($|\\s)`);
    if (pattern.test(text)) return CONCENTRATION_ALIASES[alias];
  }
  return null;
}

/**
 * Classify presentation from free text. Returns null when nothing indicates a
 * presentation — the caller decides whether a retailer's default applies.
 * Never guesses "retail" merely because no keyword matched.
 */
export function classifyPresentation(value: string | null | undefined): Presentation | null {
  if (!value) return null;
  for (const { pattern, presentation } of PRESENTATION_KEYWORDS) {
    if (pattern.test(value)) return presentation;
  }
  return null;
}

/** True when the text denotes a body/ancillary product, never a fragrance variant. */
export function isBodyProduct(value: string | null | undefined): boolean {
  if (!value) return false;
  return BODY_PRODUCT_PATTERN.test(value);
}

/**
 * Sizes are considered equal within a small tolerance, because ounce-derived
 * sizes round imprecisely (2.4 fl oz → 71 ml vs. a canonical 70 ml). The
 * tolerance is far below the gap between real fragrance sizes, so it can never
 * conflate e.g. 10 ml with 100 ml.
 */
export const SIZE_TOLERANCE_ML = 2;

export function sizesMatch(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return false;
  return Math.abs(a - b) <= SIZE_TOLERANCE_ML;
}
