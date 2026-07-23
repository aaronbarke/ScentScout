import * as cheerio from "cheerio";

/**
 * Extract and parse every `<script type="application/ld+json">` block from an
 * HTML document. Malformed blocks are skipped rather than throwing — a single
 * bad block must not lose the good ones.
 */
export function extractJsonLd(html: string): unknown[] {
  const $ = cheerio.load(html);
  const out: unknown[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      // A block may be a single node, an array, or an @graph wrapper.
      if (Array.isArray(parsed)) out.push(...parsed);
      else if (parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>)["@graph"])) {
        out.push(...((parsed as Record<string, unknown>)["@graph"] as unknown[]));
      } else out.push(parsed);
    } catch {
      // Skip malformed JSON-LD.
    }
  });

  return out;
}

/** True when a JSON-LD node carries the given schema.org @type. */
export function hasType(node: unknown, type: string): boolean {
  if (!node || typeof node !== "object") return false;
  const t = (node as Record<string, unknown>)["@type"];
  return Array.isArray(t) ? t.includes(type) : t === type;
}

/** First JSON-LD node of the given @type, or null. */
export function findByType(nodes: unknown[], type: string): Record<string, unknown> | null {
  for (const n of nodes) if (hasType(n, type)) return n as Record<string, unknown>;
  return null;
}

/**
 * Map a schema.org availability URL to a boolean.
 * Returns null for unrecognized values — unknown stock is never coerced to false.
 */
export function availabilityToInStock(value: unknown): boolean | null {
  if (typeof value !== "string") return null;
  const v = value.toLowerCase();
  if (v.includes("instock") || v.includes("limitedavailability") || v.includes("onlineonly")) return true;
  if (v.includes("outofstock") || v.includes("soldout") || v.includes("discontinued")) return false;
  if (v.includes("preorder") || v.includes("backorder")) return false;
  return null;
}
