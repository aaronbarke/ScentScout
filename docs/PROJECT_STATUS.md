# Project Status

## Current Milestone

Phase 0 — Project foundation

## Completed

- Next.js 16 + TypeScript + Tailwind scaffold (App Router, `src/` dir, `@/*` alias).
- Root `CLAUDE.md`, `CLAUDE.local.md` (git-ignored), `README.md`, `.env.example`.
- Ignore files: `.gitignore` (keeps `.env.example`, ignores secrets/artifacts), `.claudeignore`,
  `.graphifyignore`.
- `.claude/settings.json` and path rules: `database.md`, `retailer-adapters.md`, `testing.md`,
  `security.md`.
- Docs: `PRODUCT_SPEC`, `ARCHITECTURE`, `DATA_MODEL`, `RETAILER_ADAPTERS`, `MATCHING_ENGINE`,
  `PRICE_ENGINE`, `ROADMAP`, `DECISIONS` (ADR-001–004), `PROJECT_STATUS`.
- Directory skeleton for `src/{domain,retailers,db,jobs,email,lib,components}`, `scripts/`,
  `drizzle/migrations/`, `tests/{unit,integration,e2e,fixtures/retailers}`.
- `typecheck` script added.

## In Progress

- Git init, GitHub remote (public `aaronbarke/ScentScout`), Graphify graph, initial commit + push.

## Next Tasks

1. Complete Phase 0: initial Graphify graph, validation, commit, push, verify.
2. Begin Phase 1 — PostgreSQL + Drizzle schema, migrations, idempotent catalog seed (~40–50
   variants), catalog validation script, DB tests.

## Known Issues

- Node 23 emits a non-fatal EBADENGINE warning for a transitive ESLint dependency.

## Decisions Needed

- None outstanding. (Retailer selection for Phase 7 will require confirming permitted, stable
  retrieval per retailer before implementation.)

## Latest Validation

- Typecheck: PASS (`npm run typecheck` → `tsc --noEmit`, exit 0)
- Lint: PASS (`npm run lint` → `eslint`, exit 0)
- Unit tests: not yet wired (Phase 1+)
- Integration tests: not yet wired (Phase 2+)
- E2E tests: not yet wired (Phase 5+)
- Build: PASS (`npm run build` → `next build`, exit 0)

## Last Graphify Update

2026-07-22 — initial **code-only (AST)** graph: 63 nodes / 55 edges / 12 communities from 8
code files. Semantic extraction of the 26 docs is **deferred**: no LLM API key is configured in
this environment (only `ANTHROPIC_BASE_URL`). Product concepts currently live in `docs/` and are
referenced from `CLAUDE.md`; they will populate the graph as domain code lands (Phase 1+ AST) or
once an API key enables `graphify extract .` semantic doc indexing. Communities are unlabeled
(`Community N`) for the same reason.

## Latest GitHub Commit

- Hash: _to be recorded_
- Message: chore(project): initialize ScentScout foundation
- Branch: main
- Push status: _to be recorded_
