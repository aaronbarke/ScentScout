# Graph Report - ScentScout  (2026-07-24)

## Corpus Check
- 126 files · ~62,472 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 675 nodes · 1195 edges · 47 communities (33 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4bcf7b18`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- ScentScout — Roadmap
- Project Status
- graphify reference: extra exports and benchmark
- ScentScout — Product Spec
- ScentScout — Claude Code Guide
- ScentScout — Retailer Adapters
- ScentScout
- ScentScout — Architecture
- ScentScout — Price Engine
- graphify reference: query, path, explain
- ScentScout — Decision Records (ADRs)
- ScentScout — Matching Engine
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- AGENTS.md
- CLAUDE.md
- database.md
- retailer-adapters.md
- security.md
- testing.md
- extraction-spec.md
- run.ts
- offers.ts
- adapter.ts
- watchlists.ts
- FragranceCard.tsx
- Evidence
- run-retailer.ts
- middleware.ts

## God Nodes (most connected - your core abstractions)
1. `scripts` - 18 edges
2. `compilerOptions` - 16 edges
3. `ScentScout — Decision Records (ADRs)` - 13 edges
4. `variantDescriptor()` - 12 edges
5. `What You Must Do When Invoked` - 12 edges
6. `productVariants` - 11 edges
7. `formatCents()` - 11 edges
8. `presentationLabel()` - 11 edges
9. `parseNode()` - 11 edges
10. `ScentScout — Roadmap` - 11 edges

## Surprising Connections (you probably didn't know these)
- `DealsPage()` --indirect_call--> `v()`  [INFERRED]
  src/app/deals/page.tsx → tests/unit/matching.test.ts
- `parseLuckyscentHtml()` --indirect_call--> `v()`  [INFERRED]
  src/retailers/luckyscent/adapter.ts → tests/unit/matching.test.ts
- `main()` --calls--> `matchProduct()`  [EXTRACTED]
  scripts/match-listings.ts → src/domain/matching/match.ts
- `seed()` --calls--> `canonicalSku()`  [EXTRACTED]
  scripts/seed-catalog.ts → src/lib/catalog-slug.ts
- `validate()` --calls--> `canonicalSku()`  [EXTRACTED]
  scripts/validate-catalog.ts → src/lib/catalog-slug.ts

## Import Cycles
- None detected.

## Communities (47 total, 14 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (45): dependencies, cheerio, dotenv, drizzle-orm, next, postgres, react, react-dom (+37 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (37): main(), Db, env, queryClient, brands, fragrances, productVariants, alertDeliveryStatusEnum (+29 more)

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (6): hooks, PreToolUse, permissions, allow, deny, $schema

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (43): seed(), CURRENT_YEAR, errors, validate(), catalog, Gender, SeedBrand, SeedFragrance (+35 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (59): fmt(), main(), DealsPage(), metadata, FragrancePage(), generateMetadata(), Params, generateMetadata() (+51 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (19): `alert_events`, `alert_rules`, `brands`, Catalog, `coupons`, `fragrances` (the fragrance family), Invariants, `match_reviews` (+11 more)

### Community 12 - "ScentScout — Roadmap"
Cohesion: 0.17
Nodes (11): Acceptance (MVP definition of done), Phase 0 — Project foundation ✅ (in progress), Phase 1 — Database & canonical catalog, Phase 2 — Retailer framework & first adapter, Phase 3 — Exact product matching, Phase 4 — Price history & ranking, Phase 5 — Public website, Phase 6 — Accounts & alerts (+3 more)

### Community 13 - "Project Status"
Cohesion: 0.18
Nodes (10): Completed, Current Milestone, Decisions Needed, In Progress, Known Issues, Last Graphify Update, Latest GitHub Commit, Latest Validation (+2 more)

### Community 14 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 15 - "ScentScout — Product Spec"
Cohesion: 0.22
Nodes (8): Admin surfaces (authorization-gated), Definition of done (MVP), MVP scope, Permanent product rules (must never be violated), Primary differentiators, Public surfaces, Purpose, ScentScout — Product Spec

### Community 16 - "ScentScout — Claude Code Guide"
Cohesion: 0.25
Nodes (7): Directory map, graphify, Money & time (non-negotiable), Permanent product rules, ScentScout — Claude Code Guide, Stack, Workflow: commit & push after every meaningful change set

### Community 17 - "ScentScout — Retailer Adapters"
Cohesion: 0.25
Nodes (7): Interface, MVP retailers, Normalized output (`ParsedRetailerProduct`), Operational rules, Retrieval priority, ScentScout — Retailer Adapters, Testing

### Community 18 - "ScentScout"
Cohesion: 0.25
Nodes (7): Conventions, Documentation, Getting started, ScentScout, Scripts, Stack, What makes it different

### Community 20 - "ScentScout — Architecture"
Cohesion: 0.29
Nodes (6): Cross-cutting conventions, External services, Key boundaries, Layers, Overview, ScentScout — Architecture

### Community 21 - "ScentScout — Price Engine"
Cohesion: 0.29
Nodes (6): Buy-now guidance labels, Data integrity, Estimated delivered price (before tax), Historical metrics, Ranking, ScentScout — Price Engine

### Community 22 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 23 - "ScentScout — Decision Records (ADRs)"
Cohesion: 0.14
Nodes (13): ADR-001: Next.js 16 + mandated stack, ADR-002: ScentScout is its own git repository with a public GitHub remote, ADR-003: Definition of "estimated delivered price before tax", ADR-004: Deterministic checks are the sole authority for production matches, ADR-005: Canonical SKU scheme and testers as first-class variants, ADR-006: Retailer integration order, evidence-led, ADR-007: parseProduct returns many variants; GTIN/MPN added to the parse contract, ADR-008: Persist adapter-parsed attributes; keep the matching engine I/O-free (+5 more)

### Community 24 - "ScentScout — Matching Engine"
Cohesion: 0.33
Nodes (5): Audit trail, Confidence scoring, Contradiction checks (auto-reject), Normalize, ScentScout — Matching Engine

### Community 25 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 26 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 27 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 37 - "run.ts"
Cohesion: 0.12
Nodes (20): main(), buildDeduplicationKey(), dedupeKeys(), AlertCandidate, AlertDecision, AlertRuleInput, evaluateAlert(), hoursBetween() (+12 more)

### Community 39 - "offers.ts"
Cohesion: 0.10
Nodes (26): ADR-0009, couponDiscountCents(), CouponLike, ADR-0003, buyNowGuidance(), Guidance, GuidanceLabel, isHighConfidence() (+18 more)

### Community 40 - "adapter.ts"
Cohesion: 0.06
Nodes (49): ADR-0007, DiscoveryInput, ProductFetchInput, RetailerAdapter, centsSchema, ParsedRetailerProduct, parsedRetailerProductSchema, RawRetailerListing (+41 more)

### Community 41 - "watchlists.ts"
Cohesion: 0.11
Nodes (31): AccountPage(), metadata, pathFor(), AuthState, createRule(), credentialsSchema, removeRule(), ruleSchema (+23 more)

### Community 42 - "FragranceCard.tsx"
Cohesion: 0.36
Nodes (6): url, DbEnv, dbEnvSchema, isUsablePostgresUrl(), loadDbEnv(), resolveMigrationUrl()

### Community 43 - "Evidence"
Cohesion: 0.15
Nodes (12): Evidence, FragranceNet — gray-market discounter, FragranceX — gray-market discounter, Jomashop — gray-market discounter, Luckyscent — authorized boutique (Shopify), Nordstrom — department store, Phase 7 adapter build (2026-07-24) — corrections to the corrections, Phase 7 live re-inspection (2026-07-23) — corrections to the above (+4 more)

### Community 44 - "run-retailer.ts"
Cohesion: 0.20
Nodes (11): ADAPTERS, main(), parseArgs(), DeliveredPriceInput, estimateDeliveredPriceCents(), hasDeliveredPrice(), ADR-0003, ingestUrls() (+3 more)

## Knowledge Gaps
- **289 isolated node(s):** `$schema`, `allow`, `deny`, `PreToolUse`, `url` (+284 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Db` connect `Community 2` to `watchlists.ts`, `Community 5`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `retailerProducts` connect `Community 2` to `Community 5`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `productVariants` connect `Community 2` to `watchlists.ts`, `Community 5`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `$schema`, `allow`, `deny` to the rest of the system?**
  _289 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09000584453535944 - nodes in this community are weakly interconnected._