import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { loadDbEnv } from "@/lib/env";
import * as schema from "./schema";

const env = loadDbEnv();

// Supabase's transaction pooler (pgbouncer) does not support prepared
// statements, so disable them on the pooled connection.
const queryClient = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(queryClient, { schema });
export { queryClient };
export type Db = typeof db;
