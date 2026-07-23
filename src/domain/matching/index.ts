// Pure matching logic only — NO database imports.
//
// `candidates.ts` and `review.ts` touch the DB, so they are deliberately not
// re-exported here: importing them would force a live DATABASE_URL on anything
// that only wants the (pure, testable) engine. Import those directly:
//   import { loadCandidates } from "@/domain/matching/candidates";
//   import { applyDecision } from "@/domain/matching/review";
export * from "./types";
export * from "./normalize";
export * from "./aliases";
export * from "./match";
