import "dotenv/config";
import { queryClient } from "@/db/client";
import { ingestUrls } from "@/domain/retailers/ingest";
import { LuckyscentAdapter } from "@/retailers/luckyscent/adapter";
import type { RetailerAdapter } from "@/domain/retailers";

/**
 * Run one retailer adapter.
 *
 *   npm run retailer -- --url <productUrl> [--url <another>]
 *   npm run retailer -- --discover 5
 *   npm run retailer -- --health
 *
 * Defaults to the Luckyscent adapter (`--retailer luckyscent`).
 */
const ADAPTERS: Record<string, () => RetailerAdapter> = {
  luckyscent: () => new LuckyscentAdapter(),
};

function parseArgs(argv: string[]) {
  const urls: string[] = [];
  let retailer = "luckyscent";
  let discover: number | null = null;
  let health = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") urls.push(argv[++i]);
    else if (a === "--retailer") retailer = argv[++i];
    else if (a === "--discover") discover = Number(argv[++i] ?? "5");
    else if (a === "--health") health = true;
  }
  return { urls, retailer, discover, health };
}

async function main() {
  const { urls, retailer, discover, health } = parseArgs(process.argv.slice(2));

  const factory = ADAPTERS[retailer];
  if (!factory) {
    console.error(`Unknown retailer '${retailer}'. Known: ${Object.keys(ADAPTERS).join(", ")}`);
    process.exitCode = 1;
    return;
  }
  const adapter = factory();

  if (health) {
    const r = await adapter.healthCheck();
    console.log(
      `health[${adapter.retailerSlug}] healthy=${r.healthy} parser=${r.parserVersion}` +
        (r.reason ? ` reason=${r.reason}` : ""),
    );
    if (!r.healthy) process.exitCode = 1;
    return;
  }

  let targets = urls;
  if (discover !== null) {
    const found = await adapter.discoverProducts({ limit: discover });
    targets = found.map((f) => f.url);
    console.log(`discovered ${targets.length} product URL(s)`);
  }

  if (targets.length === 0) {
    console.error("Nothing to do. Pass --url <productUrl>, --discover <n>, or --health.");
    process.exitCode = 1;
    return;
  }

  const summary = await ingestUrls(adapter, targets);
  console.log(
    [
      `run     : ${summary.runId}`,
      `retailer: ${summary.retailerSlug}`,
      `pages   : ${summary.pagesSucceeded}/${summary.pagesAttempted} succeeded`,
      `products: ${summary.productsFound}`,
      `observed: ${summary.observationsCreated}`,
    ].join("\n"),
  );
  if (summary.errors.length) {
    console.log(`errors  : ${summary.errors.length}`);
    for (const e of summary.errors.slice(0, 10)) console.log(`  - ${e}`);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error("run-retailer failed:", (err as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await queryClient.end();
  });
