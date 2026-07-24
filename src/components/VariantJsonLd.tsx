import type { VariantOfferBoard } from "@/domain/pricing/offers";
import { concentrationLabel, presentationLabel } from "@/lib/format";

/**
 * Schema.org markup for an exact-variant page.
 *
 * The honesty rules that govern the UI govern this too — arguably more so,
 * because a rich result is read without the caveats beside it:
 *
 * - `availability` is emitted only when stock is actually known. Unknown stock
 *   is left absent, never asserted as InStock.
 * - `shippingDetails` is never emitted. Every retailer we currently ingest
 *   leaves shipping unpublished, and claiming free shipping in structured data
 *   would be a straightforwardly false statement to a search engine.
 * - Prices are the listed prices we observed, in the currency observed.
 */
export function VariantJsonLd({
  board,
  url,
  concentration,
  sizeMl,
  presentation,
}: {
  board: VariantOfferBoard;
  url: string;
  concentration: string;
  sizeMl: number;
  presentation: string;
}) {
  const priced = board.offers.filter((o) => o.listedPriceCents !== null);
  const prices = priced.map((o) => o.listedPriceCents as number);

  const offers =
    prices.length === 0
      ? undefined
      : prices.length === 1
        ? {
            "@type": "Offer",
            price: (prices[0] / 100).toFixed(2),
            priceCurrency: "USD",
            url,
            ...(priced[0].inStock === null
              ? {}
              : {
                  availability: priced[0].inStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                }),
          }
        : {
            "@type": "AggregateOffer",
            offerCount: prices.length,
            lowPrice: (Math.min(...prices) / 100).toFixed(2),
            highPrice: (Math.max(...prices) / 100).toFixed(2),
            priceCurrency: "USD",
            url,
          };

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${board.brandName} ${board.fragranceName}`,
    sku: board.canonicalSku,
    brand: { "@type": "Brand", name: board.brandName },
    url,
    size: `${sizeMl} ml`,
    additionalProperty: [
      // Human labels, not our internal enum values — this is published data.
      { "@type": "PropertyValue", name: "Concentration", value: concentrationLabel(concentration) },
      { "@type": "PropertyValue", name: "Presentation", value: presentationLabel(presentation) },
    ],
    ...(offers ? { offers } : {}),
  };

  return (
    <script
      type="application/ld+json"
      // Serialized server-side from our own data, never from retailer HTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
