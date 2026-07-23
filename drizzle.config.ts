import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { resolveMigrationUrl } from "./src/lib/env";

// Migrations prefer an explicit, usable DIRECT_URL; otherwise the Supabase
// session-mode endpoint derived from DATABASE_URL. Placeholder values left
// over from .env.example are ignored rather than silently used.
const url = resolveMigrationUrl(process.env.DATABASE_URL ?? "", process.env.DIRECT_URL);

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
