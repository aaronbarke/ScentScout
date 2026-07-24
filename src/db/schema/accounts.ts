import { pgTable, uuid, text, index } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";

/**
 * Notification destination for a signed-in user.
 *
 * `auth.users` lives in Supabase's own schema and reading it needs the service
 * role key, which this application deliberately never holds. So we mirror just
 * the address we need, captured from the session during an authenticated
 * mutation. `id` is the Supabase auth user id.
 */
export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    ...timestamps(),
  },
  (t) => [index("user_profiles_email_idx").on(t.email)],
);
