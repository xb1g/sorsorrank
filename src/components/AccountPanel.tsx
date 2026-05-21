import { useState } from "preact/hooks";
import type { JSX } from "preact";
import type { ConsentState } from "../types";
import {
  createSupabaseAccount,
  signInSupabaseAccount,
  signOutSupabaseAccount
} from "../services/supabaseAuth";

interface AccountPanelProps {
  consentState: ConsentState;
  onAuthChange: () => Promise<void> | void;
}

type AccountMode = "create" | "sign-in";

export function AccountPanel({ consentState, onAuthChange }: AccountPanelProps) {
  const [mode, setMode] = useState<AccountMode>("create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: JSX.TargetedEvent<HTMLFormElement, Event>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const result =
        mode === "create"
          ? await createSupabaseAccount({ email, password })
          : await signInSupabaseAccount({ email, password });
      setMessage(result.message);
      setPassword("");
      await onAuthChange();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Account action failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      await signOutSupabaseAccount();
      setEmail("");
      setPassword("");
      setMessage("Signed out.");
      await onAuthChange();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Sign out failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!consentState.authConfigured) {
    return (
      <div class="account-panel">
        <div>
          <span class="panel-label">Account</span>
          <strong>Account creation needs Supabase config.</strong>
          <p>Add the Supabase URL and publishable key to enable sign up and sign in.</p>
        </div>
      </div>
    );
  }

  if (consentState.authMode === "supabase-account") {
    return (
      <div class="account-panel">
        <div>
          <span class="panel-label">Account</span>
          <strong>Signed in{consentState.authEmail ? ` as ${consentState.authEmail}` : ""}</strong>
          <p>Your daily 10 stays tied to this Supabase account.</p>
        </div>
        <button class="ghost-cta wide" type="button" onClick={handleSignOut} disabled={isSubmitting}>
          {isSubmitting ? "Signing out..." : "Sign out"}
        </button>
        {message ? <p class="inline-success">{message}</p> : null}
        {errorMessage ? <p class="inline-error">{errorMessage}</p> : null}
      </div>
    );
  }

  return (
    <div class="account-panel">
      <div>
        <span class="panel-label">Account</span>
        <strong>{mode === "create" ? "Create an account" : "Sign in"}</strong>
        <p>
          Optional: save this browser session to return to your streak and daily 10.
          Research and Skip actions still roll up only into aggregate rank.
        </p>
      </div>

      <div class="account-mode-row" role="tablist" aria-label="Account mode">
        <button
          class={mode === "create" ? "is-active" : ""}
          type="button"
          onClick={() => setMode("create")}
        >
          Create
        </button>
        <button
          class={mode === "sign-in" ? "is-active" : ""}
          type="button"
          onClick={() => setMode("sign-in")}
        >
          Sign in
        </button>
      </div>

      <form class="account-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            autocomplete="email"
            value={email}
            onInput={(event) => setEmail(event.currentTarget.value)}
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            autocomplete={mode === "create" ? "new-password" : "current-password"}
            minlength={8}
            value={password}
            onInput={(event) => setPassword(event.currentTarget.value)}
            required
          />
        </label>
        <button class="ghost-cta wide" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Working..." : mode === "create" ? "Create account" : "Sign in"}
        </button>
      </form>

      {message ? <p class="inline-success">{message}</p> : null}
      {errorMessage ? <p class="inline-error">{errorMessage}</p> : null}
    </div>
  );
}
