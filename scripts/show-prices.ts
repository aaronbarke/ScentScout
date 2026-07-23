import "dotenv/config";
import { queryClient } from "@/db/client";
import { getVariantOfferBoard } from "@/domain/pricing/offers";

/**
 * Show the offer board, history metrics, and buy-now guidance for a variant.
 *
 *   npm run prices -- --variant le-labo-santal-33-edp-100ml-retail
 */
function fmt(cents: number | null): string {
  return cents === null ? "—" : `$${(cents / 100).toFixed(2)}`;
}

async function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--variant");
  const sku = i >= 0 ? argv[i + 1] : undefined;
  if (!sku) {
    console.error("Usage: npm run prices -- --variant <canonicalSku>");
    process.exitCode = 1;
    return;
  }

  const board = await getVariantOfferBoard(sku);
  if (!board) {
    console.error(`No variant with canonical SKU '${sku}'.`);
    process.exitCode = 1;
    return;
  }

  console.log(`${board.brandName} — ${board.fragranceName}  [${board.canonicalSku}]\n`);

  const m = board.metrics;
  console.log("History:");
  console.log(`  current      ${fmt(m.currentPriceCents)}`);
  console.log(`  30/90/180 low ${fmt(m.low30Cents)} / ${fmt(m.low90Cents)} / ${fmt(m.low180Cents)}`);
  console.log(`  all-time low ${fmt(m.allTimeLowCents)}`);
  console.log(`  percentile   ${m.pricePercentile ?? "—"}`);
  console.log(`  observations ${m.observationCount}  coverage ${m.coverageDays}d  fresh ${m.freshnessDays ?? "—"}d`);
  console.log(`\nGuidance: ${board.guidance.label}  (high confidence: ${board.guidance.highConfidence})`);
  console.log(`  ${board.guidance.summary}\n`);

  console.log(`Offers (${board.offers.length}):`);
  if (board.offers.length === 0) {
    console.log("  (no matched offers yet — nothing to compare)");
  }
  for (const o of board.offers) {
    console.log(
      `  #${o.rank} ${o.retailerName.padEnd(14)} listed ${fmt(o.listedPriceCents)}  delivered ${fmt(o.deliveredPriceCents)}`,
    );
    for (const n of o.notes) console.log(`       · ${n}`);
  }
}

main()
  .catch((err) => {
    console.error("show-prices failed:", (err as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await queryClient.end();
  });
