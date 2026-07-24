"use client";

import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions";

const EMPTY: AuthState = {};

export default function LoginPage() {
  const [signInState, signInAction, signingIn] = useActionState(signIn, EMPTY);
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, EMPTY);
  const state = signInState.error || signInState.message ? signInState : signUpState;

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="font-display text-[2.1rem] leading-tight text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          Track exact variants and get alerted when the delivered price hits your number.
        </p>
      </div>

      <form className="space-y-3">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
          />
          <p className="mt-1 text-xs text-faint">At least 8 characters.</p>
        </div>

        {state.error && (
          <p role="alert" className="rounded-lg bg-critical-soft p-2 text-sm text-critical">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="rounded-lg bg-positive-soft p-2 text-sm text-positive">
            {state.message}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            formAction={signInAction}
            disabled={signingIn || signingUp}
            className="flex-1 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-contrast hover:bg-accent-strong disabled:opacity-60"
          >
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
          <button
            formAction={signUpAction}
            disabled={signingIn || signingUp}
            className="flex-1 rounded-lg border border-line-strong px-4 py-2 text-sm font-medium hover:bg-raised disabled:opacity-60"
          >
            {signingUp ? "Creating…" : "Create account"}
          </button>
        </div>
      </form>
    </div>
  );
}
