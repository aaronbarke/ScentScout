import type { Concentration, Presentation } from "@/lib/catalog-slug";

/**
 * Explicit alias dictionaries. Matching is deterministic, so every mapping is
 * declared here rather than inferred at runtime.
 */

/** Normalized brand alias → canonical normalized brand name. */
export const BRAND_ALIASES: Record<string, string> = {
  mfk: "maison francis kurkdjian",
  "francis kurkdjian": "maison francis kurkdjian",
  "maison francis kurkdjian paris": "maison francis kurkdjian",
  pdm: "parfums de marly",
  "parfum de marly": "parfums de marly",
  lelabo: "le labo",
  "le labo fragrances": "le labo",
  "by kilian": "kilian",
  "kilian paris": "kilian",
  bdk: "bdk parfums",
  "bdk parfums paris": "bdk parfums",
  initio: "initio parfums prives",
  "initio parfums privés": "initio parfums prives",
  margiela: "maison margiela",
  "maison martin margiela": "maison margiela",
  replica: "maison margiela",
  "creed boutique": "creed",
  "diptyque paris": "diptyque",
};

/**
 * Concentration aliases, longest-phrase-first at lookup time so that
 * "eau de parfum" is not shadowed by "parfum".
 */
export const CONCENTRATION_ALIASES: Record<string, Concentration> = {
  "eau de parfum spray": "eau_de_parfum",
  "eau de parfum intense": "eau_de_parfum",
  "eau de parfum": "eau_de_parfum",
  edp: "eau_de_parfum",
  "eau de toilette spray": "eau_de_toilette",
  "eau de toilette": "eau_de_toilette",
  edt: "eau_de_toilette",
  "extrait de parfum": "extrait_de_parfum",
  extrait: "extrait_de_parfum",
  "parfum extrait": "extrait_de_parfum",
  "absolu de parfum": "absolu",
  absolu: "absolu",
  "eau de cologne": "eau_de_cologne",
  cologne: "eau_de_cologne",
  edc: "eau_de_cologne",
  "eau fraiche": "eau_fraiche",
  elixir: "elixir",
  "pure parfum": "parfum",
  parfum: "parfum",
};

/** Presentation keywords. Order matters — first hit wins. */
export const PRESENTATION_KEYWORDS: Array<{ pattern: RegExp; presentation: Presentation }> = [
  { pattern: /\b(tester|tstr|test er|tester box|display box)\b/i, presentation: "tester" },
  { pattern: /\b(refill|recharge|refillable cartridge|eco refill)\b/i, presentation: "refill" },
  { pattern: /\b(gift set|giftset|coffret|discovery set|collection set|\d+\s*pc(?:s|\.)? set)\b/i, presentation: "gift_set" },
  { pattern: /\b(unboxed|no box|without box|damaged box|open box)\b/i, presentation: "unboxed" },
  // "NIB" / "new in box" explicitly denotes ordinary retail.
  { pattern: /\b(nib|new in box|brand new sealed|retail)\b/i, presentation: "retail" },
];

/**
 * Body/ancillary products that must NEVER be matched to a fragrance variant.
 */
export const BODY_PRODUCT_PATTERN =
  /\b(body lotion|body cream|body milk|body oil|body wash|shower gel|shower oil|bath gel|deodorant|antiperspirant|hair mist|hair perfume|shampoo|conditioner|soap|candle|diffuser|room spray|after ?shave balm|balm)\b/i;
