import { getCurrentUser } from "@/lib/supabase/server";

/**
 * Admin authorization.
 *
 * Temporary allow-list based on ADMIN_EMAILS until real RBAC lands. The
 * predicate is pure so it can be tested without env or a database, and it
 * **fails closed**: an unset or empty allow-list grants nobody access, because
 * a misconfigured deployment must not silently open the admin tools.
 */
export function isAdminEmail(
  email: string | null | undefined,
  allowList: string | null | undefined,
): boolean {
  if (!email) return false;
  if (!allowList) return false;

  const allowed = allowList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

/** The signed-in user when they are an admin, otherwise null. */
export async function getAdminUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return isAdminEmail(user.email, process.env.ADMIN_EMAILS) ? user : null;
}

/**
 * Guard for admin pages AND every admin mutation.
 *
 * Server actions are independently reachable, so checking only in the page
 * would leave the mutations open — each action calls this too.
 */
export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) throw new Error("Not authorized");
  return user;
}
