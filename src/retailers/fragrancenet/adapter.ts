import { gunzipSync } from "node:zlib";
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
import { fetchText } from "../shared/http";
import { extractJsonLd, availabilityToInStock } from "../shared/json-ld";
import { parsePriceToCents, normalizeCurrency, ozToMl } from "../shared/money";
import { looksLikeSampleOrTravel } from "../shared/size";

/**
 * FragranceNet — gray-market discounter.
 *
 * Retrieval: static HTTP + JSON-LD (priority 2). Their quirks, all confined to
 * this file per the adapter boundary:
 *
 * 1. The SAME url alternates between two JSON-LD shapes across requests: a
 *    `ProductGroup` with `hasVariant[]` (every purchasable size) and a bare
 *    `Product` carrying a single `offers` object. Both are handled; the group
 *    shape yields more variants when we happen to receive it.
 * 2. `brand.name` is polluted with the fragrance name ("Bal d'Afrique Byredo",
 *    "Bdk Gris Charnel"). `manufacturer.name` is clean ("Byredo", "Bdk Parfums")
 *    and is the trusted source — `brand.name` is kept only as raw evidence.
 * 3. `priceCurrency` is sometimes the invalid code "US" rather than "USD".
 * 4. Size appears only inside the product NAME ("… Spray 3.4 oz"), in ounces.
 * 5. Vials/minis are samples with no usable size — we emit sizeMl: null and let
 *    the matcher refuse them rather than guessing a size that could collide
 *    with a real bottle.
 * 6. Shipping is not published on the product page, so shippingPriceCents is
 *    always null (UNKNOWN) — never 0.
 */
export const FRAGRANCENET_BASE_URL = "https://www.fragrancenet.com";
const PARSER_VERSION = "fragrancenet-jsonld-1.0.0";
const SITEMAP_INDEX = `${FRAGRANCENET_BASE_URL}/sitemaps-us/sitemap_index1.xml`;
const HEALTH_CHECK_URL = `${FRAGRANCENET_BASE_URL}/fragrances/bdk-parfums/bdk-gris-charnel/extrait-de-parfum`;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function nameOf(node: Record<string, unknown> | null): string | null {
  const n = node?.["name"];
  return typeof n === "string" ? n : null;
}

/** Retail noise stripped from a title so the matcher sees the fragrance name. */
const NOISE = [
  /\bspray\b/gi,
  /\beau de parfum\b/gi,
  /\beau de toilette\b/gi,
  /\bextrait de parfum\b/gi,
  /\beau de cologne\b/gi,
  /\bparfum\b/gi,
  /\bcologne\b/gi,
  /\bnew packaging\b/gi,
  /\btravel spray\b/gi,
  /\bbody lotion\b/gi,
  /\bmini\b/gi,
  /\bvial\b/gi,
  // Packaging formats, not part of a fragrance name.
  /\bflacon\b/gi,
  /\bdecanter\b/gi,
  /\brefillable\b/gi,
];

/** Exported for tests: reduce a FragranceNet title to a fragrance name. */
export function cleanFragranceName(rawTitle: string, brand: string | null): string | null {
  let s = rawTitle;
  s = s.replace(/\d+(?:\.\d+)?\s*(?:oz|ml)\b/gi, " ");
  s = s.replace(/\([^)]*\)/g, " ");
  for (const p of NOISE) s = s.replace(p, " ");
  if (brand) {
    // The title is brand-prefixed, but the prefix rarely equals the full
    // manufacturer name: "Bdk Gris Charnel …" is prefixed with "Bdk" while the
    // manufacturer is "Bdk Parfums". Strip leading words one at a time as long
    // as each is part of the brand, so "Bdk" goes but "Gris" stays.
    const brandWords = new Set(
      brand
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0),
    );
    const words = s.trim().split(/\s+/);
    let i = 0;
    while (i < words.length - 1 && brandWords.has(words[i].toLowerCase())) i++;
    s = words.slice(i).join(" ");
  }
  const out = s.replace(/\s{2,}/g, " ").trim();
  return out.length > 0 ? out : null;
}

/** Exported for tests: size lives only in the title, in ounces. */
export function sizeMlFromTitle(rawTitle: string): number | null {
  const oz = rawTitle.match(/(\d+(?:\.\d+)?)\s*oz\b/i);
  if (oz) return Math.round(ozToMl(Number(oz[1])) * 10) / 10;
  const ml = rawTitle.match(/(\d+(?:\.\d+)?)\s*ml\b/i);
  if (ml) return Number(ml[1]);
  return null;
}

/** The concentration text the matcher normalizes; null when absent. */
function concentrationFromTitle(rawTitle: string): string | null {
  const m = rawTitle.match(
    /\b(extrait de parfum|eau de parfum|eau de toilette|eau de cologne|parfum|cologne)\b/i,
  );
  return m ? m[1] : null;
}

function parseNode(
  node: Record<string, unknown>,
  group: Record<string, unknown>,
  pageUrl: string,
  observedAt: Date,
): ParsedRetailerProduct | null {
  const offers = asRecord(node["offers"]) ?? asRecord(group["offers"]);
  if (!offers) return null;

  const rawTitle = nameOf(node) ?? nameOf(group);
  if (!rawTitle) return null;

  // manufacturer is clean; brand is polluted (quirk 2).
  const manufacturer = nameOf(asRecord(node["manufacturer"]) ?? asRecord(group["manufacturer"]));
  const rawBrand = nameOf(asRecord(node["brand"]) ?? asRecord(group["brand"]));
  const brand = manufacturer ?? rawBrand;

  const listedPriceCents = parsePriceToCents(offers["price"]);

  // A vial/mini publishes no usable size — report unknown rather than guess.
  const isSample = looksLikeSampleOrTravel(rawTitle) || /\bvial\b/i.test(rawTitle);
  const sizeMl = isSample ? null : sizeMlFromTitle(rawTitle);

  const sku =
    (typeof node["sku"] === "string" && node["sku"]) ||
    (typeof offers["sku"] === "string" && offers["sku"]) ||
    null;

  const url =
    (typeof offers["url"] === "string" && offers["url"]) ||
    (typeof node["url"] === "string" && node["url"]) ||
    pageUrl;

  const candidate: ParsedRetailerProduct = {
    externalId: sku,
    url,
    rawTitle,
    gtin: null,
    mpn: null,
    brand,
    fragranceName: cleanFragranceName(rawTitle, brand),
    // FragranceNet doesn't separate flankers; the matcher derives them.
    flankerName: null,
    concentration: concentrationFromTitle(rawTitle),
    sizeMl,
    // Presentation is not published. We do NOT assume "retail" — the matcher
    // refuses to guess, which is the intended conservative behaviour.
    presentation: null,
    condition: "new",
    listedPriceCents,
    currency: normalizeCurrency(
      typeof offers["priceCurrency"] === "string" ? offers["priceCurrency"] : "USD",
    ),
    inStock: availabilityToInStock(offers["availability"]),
    stockText: typeof offers["availability"] === "string" ? offers["availability"] : null,
    // Quirk 6: shipping unknown, never 0.
    shippingPriceCents: null,
    shippingDaysMin: null,
    shippingDaysMax: null,
    shippingText: null,
    observedAt,
  };

  const result = parsedRetailerProductSchema.safeParse(candidate);
  return result.success ? result.data : null;
}

/** Exported for fixture tests — never touches the network. */
export function parseFragranceNetHtml(
  html: string,
  pageUrl: string,
  observedAt: Date = new Date(),
): ParsedRetailerProduct[] {
  const blocks = extractJsonLd(html) as unknown[];
  const group = blocks
    .map(asRecord)
    .find((b): b is Record<string, unknown> => String(b?.["@type"] ?? "").includes("Product"));
  if (!group) return [];

  const variants = Array.isArray(group["hasVariant"])
    ? (group["hasVariant"] as unknown[]).map(asRecord).filter((v): v is Record<string, unknown> => v !== null)
    : [];
  const nodes = variants.length > 0 ? variants : [group];

  const out: ParsedRetailerProduct[] = [];
  const seen = new Set<string>();
  for (const node of nodes) {
    const parsed = parseNode(node, group, pageUrl, observedAt);
    if (!parsed) continue;
    const key = parsed.externalId ?? parsed.rawTitle;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(parsed);
  }
  return out;
}

async function fetchMaybeGzip(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": "ScentScoutBot/0.1 (+https://github.com/aaronbarke/ScentScout)" },
  });
  if (!res.ok) throw new Error(`sitemap ${url} responded ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return url.endsWith(".gz") ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
}

const locsIn = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

export const FragranceNetAdapter: RetailerAdapter = {
  retailerSlug: "fragrancenet",
  parserVersion: PARSER_VERSION,

  async discoverProducts(input: DiscoveryInput): Promise<RawRetailerListing[]> {
    const limit = input.limit ?? 25;
    const index = await fetchMaybeGzip(SITEMAP_INDEX);
    const productMaps = locsIn(index).filter((u) => /products_sitemap/i.test(u));

    const found: RawRetailerListing[] = [];
    for (const map of productMaps) {
      if (found.length >= limit) break;
      const xml = await fetchMaybeGzip(map);
      for (const url of locsIn(xml)) {
        // Fragrance pages only — skip skincare/haircare departments.
        if (!/\/(perfume|cologne|fragrances)\//.test(url)) continue;
        if (input.query && !url.toLowerCase().includes(input.query.toLowerCase())) continue;
        found.push({ externalId: null, url, rawTitle: null });
        if (found.length >= limit) break;
      }
    }
    return found;
  },

  async fetchProduct(input: ProductFetchInput): Promise<RawRetailerProductPage> {
    const res = await fetchText(input.url);
    return {
      externalId: input.externalId ?? null,
      url: input.url,
      body: res.body,
      retrievalMethod: "json_ld",
      httpStatus: res.status,
      fetchedAt: res.fetchedAt,
    };
  },

  async parseProduct(input: RawRetailerProductPage): Promise<ParsedRetailerProduct[]> {
    return parseFragranceNetHtml(input.body, input.url, input.fetchedAt);
  },

  async healthCheck(): Promise<RetailerHealthResult> {
    const checkedAt = new Date();
    try {
      const page = await this.fetchProduct({ url: HEALTH_CHECK_URL });
      const parsed = parseFragranceNetHtml(page.body, HEALTH_CHECK_URL, checkedAt);
      const priced = parsed.filter((p) => p.listedPriceCents !== null);
      return {
        healthy: priced.length > 0,
        parserVersion: PARSER_VERSION,
        checkedAt,
        reason:
          priced.length > 0
            ? null
            : `parsed ${parsed.length} node(s) but none carried a price`,
      };
    } catch (err) {
      return {
        healthy: false,
        parserVersion: PARSER_VERSION,
        checkedAt,
        reason: (err as Error).message,
      };
    }
  },
};
