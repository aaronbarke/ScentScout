# Graph Report - .  (2026-07-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 63 nodes · 55 edges · 12 communities (7 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

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
- Community 11

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `scripts` - 6 edges
3. `permissions` - 3 edges
4. `hooks` - 2 edges
5. `paths` - 2 edges
6. `$schema` - 1 edges
7. `allow` - 1 edges
8. `deny` - 1 edges
9. `PreToolUse` - 1 edges
10. `eslintConfig` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (15): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.25
Nodes (7): dependencies, next, react, react-dom, name, private, version

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (6): hooks, PreToolUse, permissions, allow, deny, $schema

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, typecheck

### Community 5 - "Community 5"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

## Knowledge Gaps
- **46 isolated node(s):** `$schema`, `allow`, `deny`, `PreToolUse`, `eslintConfig` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `compilerOptions` connect `Community 0` to `Community 11`, `Community 6`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `scripts` connect `Community 4` to `Community 2`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `$schema`, `allow`, `deny` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._