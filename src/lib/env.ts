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
    DIRECT_URL: parsed.data.DIRECT_URL ?? parsed.data.DATABASE_URL,
  };
  return cached;
}
