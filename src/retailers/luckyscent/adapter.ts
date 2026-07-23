import type {
  RetailerAdapter,
  DiscoveryInput,
  ProductFetchInput,
  RawRetailerListing,
  RawRetailerProductPage,
  ParsedRetailerProduct,
  RetailerHealthResult,
} from "@/domain/retailers";
import { parsedRetailerProductSchema } from "@/domain/retailers";
import { fetchText, RetrievalError } from "../shared/http";
import { extractJsonLd, findByType, availabilityToInStock } from "../shared/json-ld";
import { parsePriceToCents, normalizeCurrency } from "../shared/money";
import { parseSizeMl } from "../shared/size";

/**
 * Luckyscent — authorized boutique (Shopify storefront).
 *
 * Retrieval: static HTTP + JSON-LD (priority 2). Their Shopify
 * `/products/<handle>.json` endpoint returns 404 (merchant-disabled); we treat
 * that as unavailable and do NOT route around it. See docs/RETAILER_RESEARCH.md.
 *
 * Their JSON-LD is a `ProductGroup` whose `hasVariant[]` holds one entry per
 * size, each with `size`, `sku`, often `gtin`, and an `offers` block. Shipping
 * is NOT published, so `shippingPriceCents` is always null (UNKNOWN) here —
 * never 0.
 */
export const LUCKYSCENT_BASE_URL = "https://www.luckyscent.com";
const PARSER_VERSION = "luckyscent-jsonld-1.0.0";

/** Stable product URL used for health checks. */
const HEALTH_CHECK_URL = `${LUCKYSCENT_BASE_URL}/products/gris-charnel-by-bdk-parfums`;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function brandName(node: Record<string, unknown>): string | null {
  const b = node["brand"];
  if (typeof b === "string") return b;
  const rec = asRecord(b);
  const n = rec?.["name"];
  return typeof n === "string" ? n : null;
}

/**
 * Turn one JSON-LD variant node into a ParsedRetailerProduct.
 * Returns null when the node lacks the minimum usable data.
 */
function parseVariant(
  variant: Record<string, unknown>,
  group: { name: string | null; brand: string | null; url: string },
  observedAt: Date,
): ParsedRetailerProduct | null {
  const offers = asRecord(variant["offers"]);
  const rawTitle = typeof variant["name"] === "string" ? variant["name"] : group.name;
  if (!rawTitle) return null;

  const url =
    (typeof variant["url"] === "string" && variant["url"]) ||
    (offers && typeof offers["url"] === "string" && offers["url"]) ||
    group.url;

  // Prefer the explicit `size` field; fall back to the variant title.
  const sizeMl = parseSizeMl(variant["size"]) ?? parseSizeMl(rawTitle);

  const gtin =
    ["gtin13", "gtin12", "gtin14", "gtin8", "gtin"]
      .map((k) => variant[k])
      .find((v): v is string => typeof v === "string" && v.length > 0) ?? null;

  const itemCondition = offers?.["itemCondition"];
  const condition =
    typeof itemCondition === "string" && itemCondition.toLowerCase().includes("newcondition")
      ? ("new" as const)
      : null;

  const candidate = {
    externalId: typeof variant["sku"] === "string" ? variant["sku"] : null,
    url,
    rawTitle,
    gtin,
    mpn: typeof variant["mpn"] === "string" ? variant["mpn"] : null,
    brand: group.brand,
    // Luckyscent's ProductGroup name is the clean fragrance name.
    fragranceName: group.name,
    flankerName: null,
    // Not published in their JSON-LD; the matching engine infers it elsewhere.
    concentration: null,
    sizeMl,
    // Luckyscent is an authorized boutique selling retail bottles only.
    presentation: "retail" as const,
    condition,
    listedPriceCents: parsePriceToCents(offers?.["price"]),
    currency: normalizeCurrency(offers?.["priceCurrency"]),
    inStock: availabilityToInStock(offers?.["availability"]),
    stockText: typeof offers?.["availability"] === "string" ? (offers["availability"] as string) : null,
    // Shipping is not published on the product page → UNKNOWN, never assumed free.
    shippingPriceCents: null,
    shippingDaysMin: null,
    shippingDaysMax: null,
    shippingText: null,
    observedAt,
  };

  const result = parsedRetailerProductSchema.safeParse(candidate);
  return result.success ? result.data : null;
}

/**
 * Parse a Luckyscent product page into 0..N variants. Exported separately so
 * fixture tests can exercise parsing without any network access.
 */
export function parseLuckyscentHtml(
  html: string,
  pageUrl: string,
  observedAt: Date = new Date(),
): ParsedRetailerProduct[] {
  const nodes = extractJsonLd(html);

  const group = findByType(nodes, "ProductGroup");
  if (group) {
    const variants = group["hasVariant"];
    const meta = {
      name: typeof group["name"] === "string" ? group["name"] : null,
      brand: brandName(group),
      url: typeof group["url"] === "string" ? group["url"] : pageUrl,
    };
    if (Array.isArray(variants)) {
      return variants
        .map(asRecord)
        .filter((v): v is Record<string, unknown> => v !== null)
        .map((v) => parseVariant(v, meta, observedAt))
        .filter((p): p is ParsedRetailerProduct => p !== null);
    }
  }

  // Fallback: a standalone Product node (no size variants).
  const product = findByType(nodes, "Product");
  if (product) {
    const meta = {
      name: typeof product["name"] === "string" ? product["name"] : null,
      brand: brandName(product),
      url: typeof product["url"] === "string" ? product["url"] : pageUrl,
    };
    const parsed = parseVariant(product, meta, observedAt);
    return parsed ? [parsed] : [];
  }

  // Nothing parseable. This is NOT evidence the product is out of stock.
  return [];
}

export class LuckyscentAdapter implements RetailerAdapter {
  readonly retailerSlug = "luckyscent";
  readonly parserVersion = PARSER_VERSION;

  /**
   * Enumerate product URLs from the published sitemap (the sanctioned
   * discovery surface). Bounded by `limit` — we never crawl the whole store.
   */
  async discoverProducts(input: DiscoveryInput = {}): Promise<RawRetailerListing[]> {
    const limit = Math.max(1, Math.min(input.limit ?? 50, 500));
    const index = await fetchText(`${LUCKYSCENT_BASE_URL}/sitemap.xml`);

    const childUrls = [...index.body.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1])
      .filter((u) => /sitemap_products/i.test(u));

    const listings: RawRetailerListing[] = [];
    for (const child of childUrls) {
      if (listings.length >= limit) break;
      const page = await fetchText(child);
      for (const m of page.body.matchAll(/<loc>([^<]+\/products\/[^<]+)<\/loc>/g)) {
        if (listings.length >= limit) break;
        listings.push({ externalId: null, url: m[1], rawTitle: null });
      }
    }
    return listings;
  }

  async fetchProduct(input: ProductFetchInput): Promise<RawRetailerProductPage> {
    const res = await fetchText(input.url);
    return {
      externalId: input.externalId ?? null,
      url: res.url,
      body: res.body,
      retrievalMethod: "json_ld",
      httpStatus: res.status,
      fetchedAt: res.fetchedAt,
    };
  }

  async parseProduct(input: RawRetailerProductPage): Promise<ParsedRetailerProduct[]> {
    return parseLuckyscentHtml(input.body, input.url, input.fetchedAt);
  }

  async healthCheck(): Promise<RetailerHealthResult> {
    const checkedAt = new Date();
    try {
      const page = await this.fetchProduct({ url: HEALTH_CHECK_URL });
      const parsed = await this.parseProduct(page);
      const withPrice = parsed.filter((p) => p.listedPriceCents !== null);
      if (withPrice.length === 0) {
        return {
          healthy: false,
          parserVersion: PARSER_VERSION,
          checkedAt,
          reason: "health-check page yielded no priced variants (markup may have changed)",
        };
      }
      return { healthy: true, parserVersion: PARSER_VERSION, checkedAt, reason: null };
    } catch (err) {
      const e = err as Error;
      return {
        healthy: false,
        parserVersion: PARSER_VERSION,
        checkedAt,
        reason: e instanceof RetrievalError ? `retrieval failed: ${e.message}` : e.message,
      };
    }
  }
}
