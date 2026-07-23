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
  reasons: MatchReason[];
}
