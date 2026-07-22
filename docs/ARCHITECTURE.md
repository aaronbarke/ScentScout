# ScentScout — Architecture

## Overview

ScentScout is a Next.js 16 (App Router) application backed by PostgreSQL (Supabase) via Drizzle
ORM. Retailer data is ingested by per-retailer **adapters**, normalized, matched against a
**canonical catalog** by a deterministic **matching engine**, recorded as **append-only price
observations**, summarized by a **price engine**, and surfaced on public comparison pages and
through an alert system. Uncertain matches are routed to an **admin review queue**.

```
Retailer site ──> RetailerAdapter (discover → fetch → parse)
                     │  ParsedRetailerProduct (normalized, Zod-validated)
                     ▼
              Matching engine (normalize → contradiction checks → confidence)
                     │              │
             exact/probable     manual_review / unmatched / rejected
                     ▼              ▼
        canonical product_variant   admin review queue
                     │
                     ▼
         Price observation (append-only) ──> Price engine (history, buy-now guidance)
                     │                              │
                     ▼                              ▼
              Alert evaluation ──> Resend email     Public pages (delivery-aware ranking)
```

## Layers

- **`src/app`** — Next.js App Router routes (public pages, `api/`, `admin/`). UI only; delegates
  to domain services.
- **`src/domain`** — retailer-agnostic business logic, split by concern:
  - `catalog/` — canonical brands, fragrances, product variants.
  - `matching/` — normalization, aliases, unit conversion, contradiction checks, scoring.
  - `pricing/` — delivered-price calculation, history metrics, buy-now guidance, ranking.
  - `alerts/` — alert-rule evaluation and deduplication.
  - `retailers/` — adapter contracts and orchestration (the interfaces, not the site quirks).
- **`src/retailers`** — concrete adapters. `shared/` holds cross-cutting fetch/parse helpers;
  each `retailer-*/` holds that retailer's selectors and quirks **and nothing shared**.
- **`src/db`** — Drizzle schema and client. `drizzle/migrations/` — SQL migrations.
- **`src/jobs`** — scheduled ingestion / alert-evaluation jobs and scrape-run bookkeeping.
- **`src/email`** — Resend templates and sending.
- **`src/lib`** — shared utilities (env validation, money/time helpers, logging).
- **`scripts/`** — operational CLIs (seed catalog, run a retailer, validate catalog, backfill).
- **`tests/`** — `unit/`, `integration/`, `e2e/`, and sanitized `fixtures/retailers/`.

## Key boundaries

- **Retailer-specific ⟂ domain.** Anything that knows about a specific retailer's HTML/JSON
  lives only under `src/retailers/<retailer>/`. Domain code consumes the normalized
  `ParsedRetailerProduct` shape.
- **Deterministic matching authority.** An LLM may *suggest* a candidate match for human review,
  but production matches are approved only by deterministic checks (see `MATCHING_ENGINE.md`).
- **Append-only history.** The price engine reads observations; it never mutates them.
- **Authorization at the admin boundary.** All `/admin` routes and admin APIs are gated.

## Cross-cutting conventions

- Money: integer cents everywhere (columns, DTOs, calculations). Time: UTC everywhere.
- Validation: Zod at every external boundary (env, request bodies, parsed retailer data).
- Errors: Sentry, with PII/secrets scrubbed.
- Config: environment variables validated at startup; fail fast when missing/invalid.

## External services

PostgreSQL + Supabase (data & auth) · Resend (email) · Sentry (errors) · retailer product feeds
/ websites (ingestion, permitted sources only) · affiliate networks (outbound links). See
`.env.example` for the configuration surface.

> **Next.js 16 note:** this is a major version with breaking changes; consult
> `node_modules/next/dist/docs/` (and `AGENTS.md`) before writing framework-specific code.
