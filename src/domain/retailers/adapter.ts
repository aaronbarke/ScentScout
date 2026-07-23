import type {
  RawRetailerListing,
  RawRetailerProductPage,
  ParsedRetailerProduct,
  RetailerHealthResult,
} from "./schemas";

/** Input for enumerating candidate listings on a retailer. */
export interface DiscoveryInput {
  /** Cap on listings to enumerate in this pass. */
  limit?: number;
  /** Optional narrowing hints (brand/fragrance terms) when the surface supports it. */
  query?: string;
  /** Only consider listings changed since this instant, when supported. */
  since?: Date;
}

/** Input for fetching one product page. */
export interface ProductFetchInput {
  url: string;
  externalId?: string | null;
}

/**
 * The contract every retailer integration implements.
 *
 * Retrieval priority (prefer cheaper, more stable sources first):
 *   1. affiliate/retailer feed → 2. JSON-LD → 3. embedded page JSON
 *   → 4. static HTML (Cheerio) → 5. Playwright → 6. manual/disable
 *
 * Implementations MUST NOT bypass CAPTCHAs, authentication, access controls, or
 * anti-bot protections, and MUST treat a fetch/parse failure as "unknown"
 * rather than as evidence a product is out of stock.
 */
export interface RetailerAdapter {
  readonly retailerSlug: string;
  /** Bumped when parsing logic changes; recorded in retailer_health. */
  readonly parserVersion: string;

  discoverProducts(input: DiscoveryInput): Promise<RawRetailerListing[]>;
  fetchProduct(input: ProductFetchInput): Promise<RawRetailerProductPage>;
  /**
   * One product URL can expose several purchasable variants (sizes), so this
   * returns 0..N parsed products — see ADR-007. Returning `[]` means "nothing
   * parseable here", which is NOT the same as "out of stock".
   */
  parseProduct(input: RawRetailerProductPage): Promise<ParsedRetailerProduct[]>;
  healthCheck(): Promise<RetailerHealthResult>;
}
