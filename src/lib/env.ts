import { z } from "zod";

/**
 * Database environment validation.
 *
 * Kept separate from page/runtime code and validated **lazily** so that a
 * missing `.env` never breaks `next build` for pages that don't touch the DB.
 * The DB client and the CLI scripts call `loadDbEnv()`; if config is missing or
 * malformed they fail fast with an actionable message.
 */
const dbEnvSchema = z.object({
  // Pooled connection (Supabase transaction pooler, port 6543) — app runtime.
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//, "must be a postgres connection string (postgresql://…)"),
  // Direct connection (port 5432) — used by drizzle-kit migrations. Optional;
  // falls back to DATABASE_URL when absent.
  DIRECT_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//, "must be a postgres connection string (postgresql://…)")
    .optional(),
});

export type DbEnv = { DATABASE_URL: string; DIRECT_URL: string };

/**
 * True only for a connection string we can actually dial. Guards against the
 * `.env.example` placeholders being left in place (`user:password@host`, or an
 * unreplaced `[YOUR-PASSWORD]`), which would otherwise silently win over a
 * perfectly good DATABASE_URL and hang.
 */
export function isUsablePostgresUrl(value: string | undefined): value is string {
  if (!value) return false;
  if (!/^postgres(ql)?:\/\//.test(value)) return false;
  if (/[[\]]/.test(value)) return false; // unreplaced [YOUR-PASSWORD] placeholder
  try {
    const u = new URL(value);
    if (!u.hostname || u.hostname === "host") return false;
    if (u.username === "user") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * The URL migrations should use. Prefers an explicit, usable DIRECT_URL.
 * Otherwise, for Supabase poolers, derives the session-mode endpoint (port
 * 5432) from the transaction-mode one (6543) — session mode is the appropriate
 * mode for DDL. Falls back to DATABASE_URL unchanged.
 */
export function resolveMigrationUrl(databaseUrl: string, directUrl?: string): string {
  if (isUsablePostgresUrl(directUrl)) return directUrl;
  try {
    const u = new URL(databaseUrl);
    if (u.hostname.endsWith("pooler.supabase.com") && u.port === "6543") {
      u.port = "5432";
      return u.toString();
    }
  } catch {
    // fall through
  }
  return databaseUrl;
}

let cached: DbEnv | null = null;

export function loadDbEnv(): DbEnv {
  if (cached) return cached;

  const parsed = dbEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid database environment configuration:\n${issues}\n\n` +
        `Copy .env.example to .env and set the Supabase connection strings ` +
        `(DATABASE_URL, and DIRECT_URL for migrations).`,
    );
  }

  cached = {
    DATABASE_URL: parsed.data.DATABASE_URL,
    DIRECT_URL: resolveMigrationUrl(parsed.data.DATABASE_URL, parsed.data.DIRECT_URL),
  };
  return cached;
}
