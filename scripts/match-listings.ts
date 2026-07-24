import "dotenv/config";
import { inArray } from "drizzle-orm";
import { db, queryClient } from "@/db/client";
import { retailerProducts } from "@/db/schema";
import { matchProduct } from "@/domain/matching";
import type { MatchInput } from "@/domain/matching";
import { loadCandidates } from "@/domain/matching/candidates";
import { applyDecision, listPendingReviews } from "@/domain/matching/review";

/**
 * Run the deterministic matching engine over retailer listings.
 *
 *   npm run match                 # match listings that are still unmatched
 *   npm run match -- --all        # re-evaluate every listing
 *   npm run match -- --dry-run    # report only, write nothing
 *   npm run match -- --reviews    # list the pending manual-review queue
 */
async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const all = argv.includes("--all");
  const showReviews = argv.includes("--reviews");

  if (showReviews) {
    const pending = await listPendingReviews();
    if (pending.length === 0) {
      console.log("No pending match reviews.");
      return;
    }
    console.log(`${pending.length} pending review(s):\n`);
    for (const r of pending) {
      console.log(`• ${r.rawTitle}`);
      console.log(`  suggested : ${r.suggestedSku ?? "(none)"}  confidence=${r.originalConfidence}`);
      console.log(`  url       : ${r.url}`);
      if (r.reviewNotes) {
        for (const line of r.reviewNotes.split("\n")) console.log(`    - ${line}`);
      }
      console.log();
    }
    return;
  }

  const candidates = await loadCandidates();
  console.log(`Loaded ${candidates.length} canonical variants.`);

  const listings = await db
    .select({
      id: retailerProducts.id,
      rawTitle: retailerProducts.rawTitle,
      rawBrand: retailerProducts.rawBrand,
      gtin: retailerProducts.gtin,
      fragranceName: retailerProducts.parsedFragranceName,
      concentration: retailerProducts.parsedConcentration,
      sizeMl: retailerProducts.parsedSizeMl,
      presentation: retailerProducts.parsedPresentation,
    })
    .from(retailerProducts)
    .where(all ? undefined : inArray(retailerProducts.matchStatus, ["unmatched"]));

  console.log(`Evaluating ${listings.length} listing(s)${dryRun ? " (dry run)" : ""}.\n`);

  const tally: Record<string, number> = {};
  let protectedCount = 0;

  for (const l of listings) {
    const input: MatchInput = {
      rawTitle: l.rawTitle,
      brand: l.rawBrand,
      fragranceName: l.fragranceName,
      concentration: l.concentration,
      sizeMl: l.sizeMl,
      presentation: l.presentation,
      gtin: l.gtin,
    };

    const decision = matchProduct(input, candidates);
    tally[decision.status] = (tally[decision.status] ?? 0) + 1;

    console.log(`${decision.status.toUpperCase().padEnd(14)} ${l.rawTitle}`);
    console.log(`  → ${decision.canonicalSku ?? "(no variant)"}  confidence=${decision.confidence}`);
    const key = decision.reasons.filter(
      (r) => r.code.endsWith("_contradiction") || r.code.endsWith("_unknown") || r.code === "ambiguous_candidates",
    );
    for (const r of key) console.log(`     · ${r.code}: ${r.detail}`);

    if (!dryRun) {
      const written = await applyDecision(l.id, decision);
      if (!written) {
        protectedCount++;
        console.log("     · skipped: an admin already decided this listing");
      }
    }
  }

  console.log("\nSummary:");
  for (const [status, n] of Object.entries(tally)) console.log(`  ${status.padEnd(14)} ${n}`);
  if (protectedCount > 0) {
    console.log(`  ${"protected".padEnd(14)} ${protectedCount} (human decisions left untouched)`);
  }
  if (dryRun) console.log("\n(dry run — nothing was written)");
}

main()
  .catch((err) => {
    console.error("match-listings failed:", (err as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await queryClient.end();
  });
