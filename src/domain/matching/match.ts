import {
  normalizeBrand,
  normalizeFragranceName,
  normalizeConcentration,
  classifyPresentation,
  isBodyProduct,
  sizesMatch,
} from "./normalize";
import { parseSizeMl } from "@/retailers/shared/size";
import type {
  MatchInput,
  CandidateVariant,
  MatchDecision,
  MatchReason,
  CandidateEvaluation,
} from "./types";

/** Confidence weights (docs/MATCHING_ENGINE.md). */
export const WEIGHTS = {
  brand: 0.25,
  fragrance: 0.3,
  flanker: 0.15,
  concentration: 0.1,
  size: 0.1,
  presentation: 0.1,
} as const;

/** Thresholds. Anything below `review` is not a match. */
export const THRESHOLDS = { exact: 0.95, review: 0.8 } as const;

/** Two candidates this close are treated as ambiguous — never auto-matched. */
export const AMBIGUITY_EPSILON = 0.001;

/**
 * Derive the attributes we compare with, preferring what the adapter parsed and
 * falling back to the raw title. Absent values stay null (UNKNOWN) — never
 * defaulted.
 */
export function deriveAttributes(input: MatchInput) {
  const haystack = [input.rawTitle, input.brand, input.fragranceName, input.concentration]
    .filter(Boolean)
    .join(" ");

  return {
    brand: normalizeBrand(input.brand),
    fragrance: normalizeFragranceName(input.fragranceName),
    flanker: normalizeFragranceName(input.flankerName),
    concentration: normalizeConcentration(input.concentration) ?? normalizeConcentration(haystack),
    sizeMl: input.sizeMl ?? parseSizeMl(input.rawTitle),
    presentation: input.presentation ?? classifyPresentation(haystack),
    isBody: isBodyProduct(haystack),
    haystack,
  };
}

type Derived = ReturnType<typeof deriveAttributes>;

/**
 * Evaluate one candidate. Any contradiction rejects outright — contradictions
 * are absolute and are never outweighed by other signals.
 */
export function evaluateCandidate(
  derived: Derived,
  candidate: CandidateVariant,
): CandidateEvaluation {
  const reasons: MatchReason[] = [];
  let confidence = 0;

  // ---- Contradictions (any one → reject) ----
  if (derived.isBody) {
    reasons.push({
      code: "body_product_contradiction",
      detail: "listing is a body/ancillary product, not a fragrance",
    });
    return { candidate, confidence: 0, contradicted: true, reasons };
  }

  const candBrand = normalizeBrand(candidate.brandName);
  if (derived.brand && candBrand && derived.brand !== candBrand) {
    reasons.push({
      code: "brand_contradiction",
      detail: `listing brand '${derived.brand}' ≠ canonical '${candBrand}'`,
    });
    return { candidate, confidence: 0, contradicted: true, reasons };
  }

  const candFragrance = normalizeFragranceName(candidate.fragranceName);
  if (derived.fragrance && candFragrance && derived.fragrance !== candFragrance) {
    reasons.push({
      code: "fragrance_contradiction",
      detail: `listing fragrance '${derived.fragrance}' ≠ canonical '${candFragrance}'`,
    });
    return { candidate, confidence: 0, contradicted: true, reasons };
  }

  const candFlanker = normalizeFragranceName(candidate.flankerName);
  if (derived.flanker !== candFlanker && (derived.flanker || candFlanker)) {
    // Only a contradiction when the listing actually asserts a flanker value.
    if (derived.flanker) {
      reasons.push({
        code: "flanker_contradiction",
        detail: `listing flanker '${derived.flanker}' ≠ canonical '${candFlanker || "(none)"}'`,
      });
      return { candidate, confidence: 0, contradicted: true, reasons };
    }
  }

  if (derived.concentration && derived.concentration !== candidate.concentration) {
    reasons.push({
      code: "concentration_contradiction",
      detail: `listing '${derived.concentration}' ≠ canonical '${candidate.concentration}'`,
    });
    return { candidate, confidence: 0, contradicted: true, reasons };
  }

  if (derived.sizeMl !== null && derived.sizeMl !== undefined && !sizesMatch(derived.sizeMl, candidate.sizeMl)) {
    reasons.push({
      code: "size_contradiction",
      detail: `listing ${derived.sizeMl}ml ≠ canonical ${candidate.sizeMl}ml`,
    });
    return { candidate, confidence: 0, contradicted: true, reasons };
  }

  if (derived.presentation && derived.presentation !== candidate.presentation) {
    reasons.push({
      code: "presentation_contradiction",
      detail: `listing '${derived.presentation}' ≠ canonical '${candidate.presentation}' (never combined)`,
    });
    return { candidate, confidence: 0, contradicted: true, reasons };
  }

  // ---- Positive signals ----
  if (derived.brand && derived.brand === candBrand) {
    confidence += WEIGHTS.brand;
    reasons.push({ code: "brand_exact", detail: derived.brand, weight: WEIGHTS.brand });
  } else {
    reasons.push({ code: "brand_unknown", detail: "listing brand missing" });
  }

  if (derived.fragrance && derived.fragrance === candFragrance) {
    confidence += WEIGHTS.fragrance;
    reasons.push({ code: "fragrance_exact", detail: derived.fragrance, weight: WEIGHTS.fragrance });
  } else {
    reasons.push({ code: "fragrance_unknown", detail: "listing fragrance name missing" });
  }

  if (derived.flanker === candFlanker) {
    confidence += WEIGHTS.flanker;
    reasons.push({
      code: "flanker_exact",
      detail: candFlanker || "(both none)",
      weight: WEIGHTS.flanker,
    });
  }

  if (derived.concentration === candidate.concentration) {
    confidence += WEIGHTS.concentration;
    reasons.push({
      code: "concentration_exact",
      detail: candidate.concentration,
      weight: WEIGHTS.concentration,
    });
  } else {
    reasons.push({
      code: "concentration_unknown",
      detail: "listing does not publish a concentration",
    });
  }

  if (sizesMatch(derived.sizeMl ?? null, candidate.sizeMl)) {
    confidence += WEIGHTS.size;
    reasons.push({ code: "size_exact", detail: `${candidate.sizeMl}ml`, weight: WEIGHTS.size });
  } else {
    reasons.push({ code: "size_unknown", detail: "listing size missing" });
  }

  if (derived.presentation === candidate.presentation) {
    confidence += WEIGHTS.presentation;
    reasons.push({
      code: "presentation_exact",
      detail: candidate.presentation,
      weight: WEIGHTS.presentation,
    });
  } else {
    reasons.push({ code: "presentation_unknown", detail: "listing presentation missing" });
  }

  return {
    candidate,
    confidence: Number(confidence.toFixed(4)),
    contradicted: false,
    reasons,
  };
}

/**
 * Match a listing against candidate variants.
 *
 * Deterministic and auditable: every decision carries its reasons. Ties between
 * surviving candidates force manual review — we never break a tie by guessing.
 */
export function matchProduct(input: MatchInput, candidates: CandidateVariant[]): MatchDecision {
  const derived = deriveAttributes(input);
  const evaluations = candidates.map((c) => evaluateCandidate(derived, c));
  const survivors = evaluations
    .filter((e) => !e.contradicted)
    .sort((a, b) => b.confidence - a.confidence);

  if (survivors.length === 0) {
    // Every candidate contradicts. Summarize by reason code rather than
    // emitting one line per catalog entry — the audit trail should be
    // readable, and the counts are the useful signal.
    const counts = new Map<string, { detail: string; n: number }>();
    for (const e of evaluations) {
      for (const r of e.reasons) {
        if (!r.code.endsWith("_contradiction")) continue;
        const seen = counts.get(r.code);
        if (seen) seen.n++;
        else counts.set(r.code, { detail: r.detail, n: 1 });
      }
    }
    const contradictions: MatchReason[] = [...counts.entries()]
      .sort((a, b) => b[1].n - a[1].n)
      .map(([code, { detail, n }]) => ({
        code,
        detail: n > 1 ? `${detail} (+${n - 1} more candidate${n > 2 ? "s" : ""})` : detail,
      }));

    return {
      status: candidates.length === 0 ? "unmatched" : "rejected",
      variantId: null,
      canonicalSku: null,
      confidence: 0,
      method: "deterministic",
      reasons: contradictions.length
        ? contradictions
        : [{ code: "no_candidates", detail: "no candidate variants supplied" }],
    };
  }

  const best = survivors[0];
  const runnerUp = survivors[1];
  const reasons = [...best.reasons];

  // Ambiguity guard: two candidates equally plausible ⇒ a human decides.
  if (runnerUp && Math.abs(best.confidence - runnerUp.confidence) < AMBIGUITY_EPSILON) {
    reasons.push({
      code: "ambiguous_candidates",
      detail: `tied with '${runnerUp.candidate.canonicalSku}' at ${runnerUp.confidence}`,
    });
    return {
      status: "manual_review",
      variantId: best.candidate.variantId,
      canonicalSku: best.candidate.canonicalSku,
      confidence: best.confidence,
      method: "deterministic",
      reasons,
    };
  }

  let status: MatchDecision["status"];
  if (best.confidence >= THRESHOLDS.exact) status = "exact";
  else if (best.confidence >= THRESHOLDS.review) status = "manual_review";
  else status = "unmatched";

  reasons.push({
    code: "threshold",
    detail: `confidence ${best.confidence} → ${status}`,
  });

  return {
    status,
    variantId: status === "unmatched" ? null : best.candidate.variantId,
    canonicalSku: status === "unmatched" ? null : best.candidate.canonicalSku,
    confidence: best.confidence,
    method: "deterministic",
    reasons,
  };
}
