/**
 * Pure alert logic only — no DB imports.
 *
 * DB-touching modules (watchlists.ts, rules.ts, run.ts) are deliberately NOT
 * re-exported here, so unit tests and server components can import the pure
 * engine without requiring DATABASE_URL. Import those directly when needed.
 */
export * from "./evaluate";
export * from "./dedup";
