import { useEffect, useRef, useState } from "preact/hooks";
import type { ConsentState } from "../types";

interface ConsentGateProps {
  consentState: ConsentState;
  turnstileSiteKey: string;
  isAccepting: boolean;
  errorMessage?: string;
  onAccept: (humanChallengeToken?: string) => void | Promise<void>;
  onDecline: () => void;
  onViewPrivacy?: () => void;
  onViewTerms?: () => void;
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
  onDecline,
  onViewPrivacy,
  onViewTerms
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
      <p class="panel-label">ก่อนเริ่มต้น</p>
      <h1>ทำ 10 ใบ ค้นคว้า หรือ ข้าม</h1>
      <p class="consent-copy" style={{ marginBottom: '18px', fontSize: '1.1rem' }}>
        แพลตฟอร์มนี้จัดทำขึ้นเพื่อการค้นคว้าวิจัย และเพื่อความสนุกสนานเท่านั้น 🎉
      </p>
      <div class="consent-meta">
        <span>Consent version {consentState.version}</span>
        <span>{sessionLabel}</span>
      </div>
      {turnstileSiteKey ? (
        <div class="challenge-box" ref={challengeRef}>
          {!challengeReady ? <span>กรุณายืนยันตัวตนก่อนเริ่มต้น</span> : null}
        </div>
      ) : null}
      {errorMessage ? <p class="inline-error">{errorMessage}</p> : null}
      <div class="consent-actions">
        <button class={`primary-cta wide ${!acceptDisabled ? "pulse" : ""}`} type="button" onClick={handleAccept} disabled={acceptDisabled}>
          {isAccepting ? "กำลังเริ่ม..." : "เริ่ม 10 ใบของฉัน"}
        </button>
        <button class="ghost-cta wide" type="button" onClick={onDecline}>
          ดูอันดับความสนใจค้นคว้า
        </button>
      </div>
      <div class="policy-links" style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem' }}>
        <button type="button" class="text-link" onClick={onViewPrivacy} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', margin: '0 8px' }}>
          นโยบายความเป็นส่วนตัว
        </button>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <button type="button" class="text-link" onClick={onViewTerms} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', margin: '0 8px' }}>
          ข้อกำหนดการใช้งาน
        </button>
      </div>
    </section>
  );
}
