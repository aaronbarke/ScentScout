import { pgTable, uuid, text, integer, index } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import {
  concentrationEnum,
  conditionEnum,
  genderMarketingEnum,
  presentationEnum,
} from "./enums";

/** Brands (Le Labo, Creed, …). */
export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  normalizedName: text("normalized_name").notNull(),
  officialUrl: text("official_url"),
  ...timestamps(),
});

/** Fragrance families (a fragrance, optionally a flanker of a base name). */
export const fragrances = pgTable(
  "fragrances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    flankerName: text("flanker_name"),
    releaseYear: integer("release_year"),
    imageUrl: text("image_url"),
    ...timestamps(),
  },
  (t) => [index("fragrances_brand_id_idx").on(t.brandId)],
);

/**
 * Product variants — an exact comparable product. Presentations
 * (retail/tester/refill/unboxed/gift_set) are always distinct rows and never
 * combined. `canonical_sku` is the stable natural key for idempotent seeding.
 */
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fragranceId: uuid("fragrance_id")
      .notNull()
      .references(() => fragrances.id, { onDelete: "cascade" }),
    concentration: concentrationEnum("concentration").notNull(),
    sizeMl: integer("size_ml").notNull(),
    presentation: presentationEnum("presentation").notNull(),
    condition: conditionEnum("condition").notNull().default("new"),
    genderMarketing: genderMarketingEnum("gender_marketing"),
    canonicalSku: text("canonical_sku").notNull().unique(),
    ...timestamps(),
  },
  (t) => [index("product_variants_fragrance_id_idx").on(t.fragranceId)],
);
