"use client";

import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions";

const EMPTY: AuthState = {};

const FIELD =
  "w-full border-b border-line-strong bg-transparent px-1 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent";

export default function LoginPage() {
  const [signInState, signInAction, signingIn] = useActionState(signIn, EMPTY);
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, EMPTY);
  const state = signInState.error || signInState.message ? signInState : signUpState;
  const busy = signingIn || signingUp;

  return (
    <div className="mx-auto grid max-w-4xl gap-x-16 gap-y-10 py-6 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Your account</p>
        <h1 className="mt-4 font-display text-[2.75rem] leading-tight text-ink">Sign in</h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
          Track an exact variant and be told when its delivered price reaches your number — never
          a different size, concentration or presentation.
        </p>
      </div>

      <form className="space-y-7">
        <div>
          <label htmlFor="email" className="eyebrow">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`mt-2 ${FIELD}`}
          />
        </div>
        <div>
          <label htmlFor="password" className="eyebrow">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            className={`mt-2 ${FIELD}`}
          />
          <p className="mt-2 text-xs text-faint">At least 8 characters.</p>
        </div>

        {state.error && (
          <p role="alert" className="border-l-2 border-critical bg-critical-soft px-3 py-2 text-sm text-critical">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="border-l-2 border-positive bg-positive-soft px-3 py-2 text-sm text-positive">
            {state.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-6 pt-1">
          <button
            formAction={signInAction}
            disabled={busy}
            className="bg-accent px-7 py-3 text-xs uppercase tracking-[0.14em] text-accent-contrast transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
          <button
            formAction={signUpAction}
            disabled={busy}
            className="border-b border-line-strong pb-1 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {signingUp ? "Creating…" : "Create account"}
          </button>
        </div>
      </form>
    </div>
  );
}
