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
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-900"
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
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-900"
          />
          <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
        </div>

        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {state.message}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            formAction={signInAction}
            disabled={signingIn || signingUp}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
          <button
            formAction={signUpAction}
            disabled={signingIn || signingUp}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {signingUp ? "Creating…" : "Create account"}
          </button>
        </div>
      </form>
    </div>
  );
}
