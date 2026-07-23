/**
 * Alert deduplication. Pure — no DB.
 *
 * The key is deterministic: the same rule + retailer + price point always
 * produces the same string, and `alert_events.deduplication_key` is UNIQUE, so
 * the database is the final guard against double-notifying a user even if two
 * evaluation runs race.
 */

import type { AlertCandidate } from "./evaluate";

/** Bumped only if the key's meaning changes (invalidates prior dedup history). */
export const DEDUP_KEY_VERSION = "v1";

/**
 * Build the deduplication key for a rule firing on a candidate offer.
 *
 * The price basis is part of the key: an alert justified by a *known delivered*
 * total is a different claim than one based on a listed price, and the two must
 * never dedup against each other.
 */
export function buildDeduplicationKey(ruleId: string, candidate: AlertCandidate): string {
  const usingDelivered = candidate.deliveredPriceCents !== null;
  const basis = usingDelivered ? "delivered" : "listed";
  const priceCents = usingDelivered ? candidate.deliveredPriceCents : candidate.listedPriceCents;
  return [DEDUP_KEY_VERSION, ruleId, candidate.retailerId, basis, priceCents ?? "unknown"].join(":");
}

/**
 * Filter decisions down to those not already sent, and not duplicated within
 * this same batch. `alreadySent` is the set of keys already in alert_events.
 */
export function dedupeKeys(keys: string[], alreadySent: Iterable<string>): string[] {
  const seen = new Set(alreadySent);
  const out: string[] = [];
  for (const k of keys) {
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}
