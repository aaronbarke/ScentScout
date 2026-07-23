import { concentrationEnum, presentationEnum } from "@/db/schema/enums";

export type Concentration = (typeof concentrationEnum.enumValues)[number];
export type Presentation = (typeof presentationEnum.enumValues)[number];

/** Short URL/SKU code per concentration. */
const CONCENTRATION_CODE: Record<Concentration, string> = {
  eau_de_parfum: "edp",
  eau_de_toilette: "edt",
  parfum: "parfum",
  extrait_de_parfum: "extrait",
  absolu: "absolu",
  eau_de_cologne: "edc",
  eau_fraiche: "fraiche",
  elixir: "elixir",
};

export function concentrationCode(c: Concentration): string {
  return CONCENTRATION_CODE[c];
}

/**
 * Public URL segment / variant discriminator, e.g. `edp-100ml-retail`.
 * Also the exact-variant path in `/fragrances/<fragranceSlug>/<variantPath>`.
 */
export function variantPath(c: Concentration, sizeMl: number, p: Presentation): string {
  return `${CONCENTRATION_CODE[c]}-${sizeMl}ml-${p}`;
}

/**
 * Stable natural key for idempotent seeding, e.g.
 * `le-labo-santal-33-edp-100ml-retail`. Because presentation and concentration
 * are part of the key, retail/tester/refill and EDP/EDT never collide.
 */
export function canonicalSku(
  fragranceSlug: string,
  c: Concentration,
  sizeMl: number,
  p: Presentation,
): string {
  return `${fragranceSlug}-${variantPath(c, sizeMl, p)}`;
}
