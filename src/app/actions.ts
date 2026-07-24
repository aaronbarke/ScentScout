"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import {
  addToWatchlist,
  removeFromWatchlist,
  createAlertRule,
  deleteAlertRule,
} from "@/domain/alerts/watchlists";
import { ensureProfile } from "@/domain/accounts/profiles";

/** All external input is validated at the boundary. */
const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type AuthState = { error?: string; message?: string };

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/account");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) return { error: error.message };

  // With email confirmation on, there is no session until the link is clicked.
  if (data.session) redirect("/account");
  return { message: "Check your email for a confirmation link to finish signing up." };
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

const uuid = z.string().uuid();

export async function toggleWatch(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await ensureProfile(user.id, user.email);

  const variantId = uuid.parse(formData.get("variantId"));
  const watching = formData.get("watching") === "true";

  if (watching) await removeFromWatchlist(user.id, variantId);
  else await addToWatchlist(user.id, variantId);

  const path = formData.get("path");
  if (typeof path === "string" && path.startsWith("/")) revalidatePath(path);
  revalidatePath("/account");
}

const ruleSchema = z.object({
  variantId: uuid,
  // Dollars in the form; stored as integer cents.
  maximumPrice: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0), "Enter a valid price."),
});

export async function createRule(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // An alert needs somewhere to be delivered; capture it as the rule is made.
  await ensureProfile(user.id, user.email);

  const parsed = ruleSchema.parse({
    variantId: formData.get("variantId"),
    maximumPrice: formData.get("maximumPrice") ?? undefined,
  });

  await createAlertRule({
    userId: user.id,
    productVariantId: parsed.variantId,
    // Money is integer cents — round at the boundary, never store a float.
    maximumDeliveredPriceCents:
      parsed.maximumPrice === null ? null : Math.round(parsed.maximumPrice * 100),
  });

  // Watching and alerting go together.
  await addToWatchlist(user.id, parsed.variantId);
  revalidatePath("/account");
}

export async function removeRule(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await deleteAlertRule(user.id, uuid.parse(formData.get("ruleId")));
  revalidatePath("/account");
}
