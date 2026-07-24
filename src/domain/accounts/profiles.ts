import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userProfiles } from "@/db/schema";

/**
 * Mirror the signed-in user's email so background jobs have somewhere to send.
 *
 * Called from authenticated mutations rather than from a read path — a page
 * render should not have write side effects. Idempotent, and it refreshes the
 * address if the user changed it.
 */
export async function ensureProfile(userId: string, email: string | null | undefined): Promise<void> {
  if (!email) return;
  await db
    .insert(userProfiles)
    .values({ id: userId, email })
    .onConflictDoUpdate({
      target: userProfiles.id,
      set: { email, updatedAt: new Date() },
    });
}

/** The notification address for a user, or null if we never captured one. */
export async function getProfileEmail(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ email: userProfiles.email })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1);
  return row?.email ?? null;
}
