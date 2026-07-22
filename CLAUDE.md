# ScentScout — Claude Code Guide

ScentScout helps fragrance shoppers find **where to buy an exact fragrance variant**, its
**estimated delivered price before tax** (verified discounts + required shipping), how fast it
arrives, whether the price is historically attractive, and whether to buy now or wait — with
precise price/restock alerts and an admin review queue for uncertain matches.

Read this file, then `docs/PROJECT_STATUS.md` and `docs/DECISIONS.md`, at the start of every
major task.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · PostgreSQL · Supabase ·
Drizzle ORM · Zod · Cheerio (+ Playwright only when static HTTP is insufficient) · Vitest ·
Playwright Test · Resend · Sentry · Graphify.

> ⚠️ This project is on **Next.js 16** — a major with breaking changes vs. older Next. See
> `AGENTS.md`; consult `node_modules/next/dist/docs/` before writing Next-specific code.

## Money & time (non-negotiable)

- **All monetary values are integer cents.** Never use floats for money.
- **All timestamps are stored in UTC.**

## Permanent product rules

These must never be violated (full list in `docs/PRODUCT_SPEC.md`):

- Never silently match uncertain variants — low-confidence matches go to admin review.
- Never combine different presentations: retail / tester / refill / unboxed / gift_set stay
  separate. Never mix body products with fragrances.
- Never assume unknown shipping is free. If required shipping is unknown, show
  "`$X plus unknown shipping`" — never a fabricated delivered total.
- Never apply an **unverified** coupon to the primary displayed total.
- Never describe a pre-tax estimate as an exact checkout total.
- Price observations are **append-only** — never overwrite history.
- A parser failure is **not** proof a product is out of stock.
- Never hide stale data or uncertain matches from the user.
- Never bypass CAPTCHAs, auth, access controls, or retailer protections.
- Retailer-specific parsing stays inside that retailer's adapter — never in shared domain code.
- An LLM may *suggest* a match for review, but **deterministic checks approve production matches**.
- No schema change without a migration. No new dependency without documenting why. No admin
  feature without authorization.

## Directory map

- `src/domain/{catalog,matching,pricing,alerts,retailers}` — retailer-agnostic business logic.
- `src/retailers/{shared,retailer-*}` — per-retailer adapters (selectors/quirks live here only).
- `src/db` — Drizzle schema & client. `drizzle/migrations` — SQL migrations.
- `src/jobs` · `src/email` · `src/lib` — jobs, Resend email, shared utilities.
- `scripts/` — seed/validate/run CLIs. `tests/{unit,integration,e2e,fixtures}` — tests + fixtures.
- Path-specific rules: `.claude/rules/{database,retailer-adapters,testing,security}.md`.

## Workflow: commit & push after every meaningful change set

Before each commit: `git status` → review diff → `npm run typecheck` → `npm run lint` →
relevant tests → update `docs/PROJECT_STATUS.md` (and `docs/DECISIONS.md` if a decision was
made) → `/graphify . --update` → verify no secrets/junk staged. Then commit with a
conventional message and `git push`. Never force-push, never rewrite shared history, never
commit secrets or `.env` files. Do not commit code that failed its relevant validation.

@AGENTS.md

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
