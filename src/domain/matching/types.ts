import type { Concentration, Presentation } from "@/lib/catalog-slug";

/** What we know about a retailer listing going into matching. */
export interface MatchInput {
  rawTitle: string;
  brand?: string | null;
  fragranceName?: string | null;
  flankerName?: string | null;
  /** Raw concentration text if the retailer published one. */
  concentration?: string | null;
  sizeMl?: number | null;
  presentation?: Presentation | null;
  gtin?: string | null;
}

/** A canonical variant the listing could match, flattened for comparison. */
export interface CandidateVariant {
  variantId: string;
  canonicalSku: string;
  brandName: string;
  fragranceName: string;
  flankerName: string | null;
  concentration: Concentration;
  sizeMl: number;
  presentation: Presentation;
  /** Canonical barcode, when known. */
  gtin?: string | null;
}

export type MatchStatus = "exact" | "probable" | "manual_review" | "rejected" | "unmatched";

export interface MatchReason {
  code: string;
  detail: string;
  /** Score contribution, when the reason carried one. */
  weight?: number;
}

export interface MatchDecision {
  status: MatchStatus;
  variantId: string | null;
  canonicalSku: string | null;
  confidence: number;
  method: "deterministic";
  reasons: MatchReason[];
}

/** Per-candidate evaluation, retained so admins can see why the runner-up lost. */
export interface CandidateEvaluation {
  candidate: CandidateVariant;
  confidence: number;
  contradicted: boolean;
  /**
   * Set when the candidate only survived via an inferred equivalence rather
   * than a literal agreement. Such a candidate can never be auto-approved —
   * `matchProduct` caps it at manual review however high it scores (ADR-013).
   */
  requiresReview?: boolean;
  reasons: MatchReason[];
}

/** Review states that represent a deliberate administrator ruling. */
export type ReviewStatus = "pending" | "approved" | "rejected";

/**
 * True when an admin has ruled on a listing. A human decision outranks the
 * automatic matcher, so re-running matching must skip these listings rather
 * than silently undoing the ruling. Pure so it can be tested without a database.
 */
export function isHumanDecision(status: ReviewStatus | string | null | undefined): boolean {
  return status === "approved" || status === "rejected";
}
