# ScentScout

ScentScout helps fragrance shoppers decide **where to buy an exact fragrance variant** and
**whether to buy now or wait** — going beyond a basic price-comparison site by matching brand,
fragrance, flanker, concentration, size, presentation, and condition exactly, and by showing an
**estimated delivered price before tax** (verified discounts + required shipping) alongside
delivery speed, data freshness, and transparent buy-now guidance.

## What makes it different

1. Exact variant matching — retail bottles, testers, refills, unboxed, gift sets, and body
   products are **never silently combined**.
2. Estimated delivered price before tax includes verified discounts and required shipping (or
   explicitly says shipping is unknown — never guessed).
3. Delivery estimates and data freshness are part of every retailer comparison.
4. Highly specific price/restock alerts.
5. Buy-now guidance grounded in real price history, presented as guidance — never certainty.
6. Low-confidence or ambiguous matches go to an admin review queue.
7. The cheapest advertised price is not assumed to be the best purchase.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · PostgreSQL · Supabase ·
Drizzle ORM · Zod · Cheerio (+ Playwright when needed) · Vitest · Playwright Test · Resend ·
Sentry · Graphify.

> **Note:** This project uses **Next.js 16** (breaking changes vs. older Next). See `AGENTS.md`.

## Conventions

- **All money is integer cents.** **All timestamps are UTC.**
- Price observations are append-only. Only verified coupons affect the primary delivered total.

## Getting started

```bash
cp .env.example .env   # fill in real values (never commit .env)
npm install
npm run dev            # http://localhost:3000
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

Test / DB / catalog scripts (`test`, `test:integration`, `test:e2e`, `db:migrate`, `db:seed`,
`catalog:validate`) are wired up as their phases land — see `docs/PROJECT_STATUS.md`.

## Documentation

Product and engineering docs live in [`docs/`](docs/): product spec, architecture, data model,
retailer adapters, matching engine, price engine, roadmap, decisions (ADRs), and project status.
Codebase memory is in `graphify-out/` — query it with `graphify query "<question>"`.
