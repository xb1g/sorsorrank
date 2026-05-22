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
      <div class="account-panel-sharp">
        <div class="account-header-sharp">
          <span class="panel-label-sharp">ACCOUNT ERROR</span>
          <strong class="account-title-sharp">Missing Configuration</strong>
          <p class="account-desc-sharp">Supabase URL and publishable key are required to enable sign up and sign in.</p>
        </div>
      </div>
    );
  }

  if (consentState.authMode === "supabase-account") {
    return (
      <div class="account-panel-sharp">
        <div class="account-header-sharp">
          <span class="panel-label-sharp">AUTHENTICATED</span>
          <strong class="account-title-sharp">Signed in as {consentState.authEmail}</strong>
          <p class="account-desc-sharp">Your daily 10 and rank contributions are securely tied to this session.</p>
        </div>
        <button class="ghost-cta sharp-cta wide" type="button" onClick={handleSignOut} disabled={isSubmitting}>
          {isSubmitting ? "Signing out..." : "Sign out"}
        </button>
        {message ? <p class="inline-success-sharp">{message}</p> : null}
        {errorMessage ? <p class="inline-error-sharp">{errorMessage}</p> : null}
      </div>
    );
  }

  return (
    <div class="account-panel-sharp">
      <div class="account-header-sharp">
        <span class="panel-label-sharp">ACCOUNT</span>
        <strong class="account-title-sharp">{mode === "create" ? "Create an account" : "Sign in"}</strong>
        <p class="account-desc-sharp">
          Save your session to retain your streak and progress. All interactions remain completely anonymous and roll up only into aggregate rankings.
        </p>
      </div>

      <div class="account-mode-row-sharp" role="tablist" aria-label="Account mode">
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

      <form class="account-form-sharp" onSubmit={handleSubmit}>
        <label class="form-label-sharp">
          <span class="form-label-text">Email</span>
          <input
            class="form-input-sharp"
            type="email"
            autocomplete="email"
            value={email}
            onInput={(event) => setEmail(event.currentTarget.value)}
            required
          />
        </label>
        <label class="form-label-sharp">
          <span class="form-label-text">Password</span>
          <input
            class="form-input-sharp"
            type="password"
            autocomplete={mode === "create" ? "new-password" : "current-password"}
            minlength={8}
            value={password}
            onInput={(event) => setPassword(event.currentTarget.value)}
            required
          />
        </label>
        <button class="ghost-cta sharp-cta wide account-submit-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Working..." : mode === "create" ? "Create account" : "Sign in"}
        </button>
      </form>

      {message ? <p class="inline-success-sharp">{message}</p> : null}
      {errorMessage ? <p class="inline-error-sharp">{errorMessage}</p> : null}
    </div>
  );
}
