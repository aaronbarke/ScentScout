import { z } from "zod";
import { presentationEnum } from "@/db/schema/enums";

/**
 * Retailer ingestion contracts. These are the ONLY shapes domain code sees —
 * retailer-specific HTML/JSON quirks never cross this boundary.
 *
 * All money is integer cents. `observedAt` is a UTC instant.
 */

/** Integer-cents money, non-negative. Never a float. */
const centsSchema = z.number().int().nonnegative();

/** A listing discovered during crawl/feed enumeration, before full fetch. */
export const rawRetailerListingSchema = z.object({
  externalId: z.string().nullable(),
  url: z.string().url(),
  /** Whatever title the listing surface exposed, if any. */
  rawTitle: z.string().nullable(),
});
export type RawRetailerListing = z.infer<typeof rawRetailerListingSchema>;

/** A fetched product page, pre-parse. `body` is the retrieved payload. */
export const rawRetailerProductPageSchema = z.object({
  externalId: z.string().nullable(),
  url: z.string().url(),
  /** Raw HTML or JSON text as retrieved. */
  body: z.string(),
  /** How the body was obtained — drives the retrieval-priority audit trail. */
  retrievalMethod: z.enum(["feed", "json_ld", "embedded_json", "html", "browser"]),
  httpStatus: z.number().int().nullable(),
  fetchedAt: z.date(),
});
export type RawRetailerProductPage = z.infer<typeof rawRetailerProductPageSchema>;

/**
 * The normalized parse result. Fields are deliberately nullable: an adapter
 * must report "unknown" rather than guess. In particular a null
 * `shippingPriceCents` means shipping is UNKNOWN — never assume free.
 */
export const parsedRetailerProductSchema = z.object({
  externalId: z.string().nullable(),
  url: z.string().url(),
  rawTitle: z.string(),
  brand: z.string().nullable(),
  fragranceName: z.string().nullable(),
  flankerName: z.string().nullable(),
  /** Raw concentration text; the matching engine normalizes it. */
  concentration: z.string().nullable(),
  sizeMl: z.number().positive().nullable(),
  presentation: z.enum(presentationEnum.enumValues).nullable(),
  condition: z.literal("new").nullable(),
  listedPriceCents: centsSchema.nullable(),
  currency: z.string().length(3),
  inStock: z.boolean().nullable(),
  stockText: z.string().nullable(),
  shippingPriceCents: centsSchema.nullable(),
  shippingDaysMin: z.number().int().nonnegative().nullable(),
  shippingDaysMax: z.number().int().nonnegative().nullable(),
  shippingText: z.string().nullable(),
  observedAt: z.date(),
});
export type ParsedRetailerProduct = z.infer<typeof parsedRetailerProductSchema>;

/** Result of an adapter self-check. */
export const retailerHealthResultSchema = z.object({
  healthy: z.boolean(),
  parserVersion: z.string(),
  checkedAt: z.date(),
  /** Populated when `healthy` is false. */
  reason: z.string().nullable(),
});
export type RetailerHealthResult = z.infer<typeof retailerHealthResultSchema>;
