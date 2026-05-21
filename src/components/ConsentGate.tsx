import { useEffect, useRef, useState } from "preact/hooks";
import type { ConsentState } from "../types";

interface ConsentGateProps {
  consentState: ConsentState;
  turnstileSiteKey: string;
  isAccepting: boolean;
  errorMessage?: string;
  onAccept: (humanChallengeToken?: string) => void | Promise<void>;
  onDecline: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export function ConsentGate({
  consentState,
  turnstileSiteKey,
  isAccepting,
  errorMessage,
  onAccept,
  onDecline
}: ConsentGateProps) {
  const challengeRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [challengeToken, setChallengeToken] = useState("");
  const [challengeReady, setChallengeReady] = useState(!turnstileSiteKey);

  useEffect(() => {
    if (!turnstileSiteKey || !challengeRef.current || widgetIdRef.current) {
      return;
    }

    const scriptId = "sorsorrank-turnstile-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const timer = window.setInterval(() => {
      if (!window.turnstile || !challengeRef.current || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(challengeRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token) => {
          setChallengeToken(token);
          setChallengeReady(true);
        },
        "expired-callback": () => {
          setChallengeToken("");
          setChallengeReady(false);
        },
        "error-callback": () => {
          setChallengeToken("");
          setChallengeReady(false);
        }
      });
      window.clearInterval(timer);
    }, 100);

    return () => window.clearInterval(timer);
  }, [turnstileSiteKey]);

  async function handleAccept() {
    await onAccept(challengeToken || undefined);
  }

  const acceptDisabled = isAccepting || !challengeReady;
  const sessionLabel =
    consentState.authMode === "supabase-account"
      ? "Supabase account ready"
      : consentState.authMode === "supabase-anonymous"
      ? consentState.isAuthenticated
        ? "Private Supabase session ready"
        : "Private Supabase session starts with consent"
      : consentState.authMode === "visitor-token"
        ? "Server visitor session"
        : "Local demo mode";

  return (
    <section class="panel consent-gate">
      <p class="panel-label">Before you start</p>
      <h1>Do your 10. Research or Skip.</h1>
      <p class="consent-copy">
        Your Research and Skip actions are stored only in aggregate. No public card
        shows your choices, and this is not a poll, endorsement, prediction, or voting guide.
      </p>
      <div class="consent-meta">
        <span>Consent version {consentState.version}</span>
        <span>Nothing gets saved until you tap in</span>
        <span>{sessionLabel}</span>
      </div>
      {turnstileSiteKey ? (
        <div class="challenge-box" ref={challengeRef}>
          {!challengeReady ? <span>Human check required before starting.</span> : null}
        </div>
      ) : null}
      {errorMessage ? <p class="inline-error">{errorMessage}</p> : null}
      <div class="consent-actions">
        <button class="primary-cta wide" type="button" onClick={handleAccept} disabled={acceptDisabled}>
          {isAccepting ? "Starting..." : "Start my 10"}
        </button>
        <button class="text-link-button" type="button" onClick={onDecline}>
          Show Research Interest Rank
        </button>
      </div>
    </section>
  );
}
