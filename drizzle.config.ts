import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Migrations use the DIRECT (non-pooled) connection when available.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
