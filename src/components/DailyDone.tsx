import { useState } from "preact/hooks";
import type { ConsentState } from "../types";
import { AccountPanel } from "./AccountPanel";

interface DailyDoneProps {
  consentState: ConsentState;
  streakCount: number;
  onSeeRankings: () => void;
  onCreateShare: () => Promise<{ copy: string }>;
  onAuthChange: () => Promise<void> | void;
}

const todayLabel = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric"
}).format(new Date());

export function DailyDone({
  consentState,
  streakCount,
  onSeeRankings,
  onCreateShare,
  onAuthChange
}: DailyDoneProps) {
  const [shareCopy, setShareCopy] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCreateShare() {
    setIsSharing(true);
    setErrorMessage("");
    try {
      const share = await onCreateShare();
      setShareCopy(share.copy);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Share card could not be created.");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <section class="panel daily-done">
      <p class="panel-label">Deck cleared</p>
      <h1>You did your 10.</h1>
      <p class="done-copy">
        Your choices stay private and roll up into aggregate curiosity.
        No public card shows who you researched or skipped.
      </p>

      <div class="auth-save-card">
        <div class="auth-save-copy">
          <span class="panel-label">Share card</span>
          <strong>{shareCopy || "I researched 10 public figures today. Your turn."}</strong>
          <p>Send the 10 to group chat without revealing your choices.</p>
        </div>
        <div class="auth-save-actions">
          <button class="primary-cta wide" type="button" onClick={handleCreateShare} disabled={isSharing}>
            {isSharing ? "Creating..." : "Challenge a friend"}
          </button>
          {errorMessage ? <p class="inline-error">{errorMessage}</p> : null}
        </div>
      </div>

      {consentState.authMode !== "supabase-account" ? (
        <AccountPanel consentState={consentState} onAuthChange={onAuthChange} />
      ) : null}

      <div class="done-grid">
        <article class="done-card">
          <span>Date</span>
          <strong>{todayLabel}</strong>
        </article>
        <article class="done-card">
          <span>Streak</span>
          <strong>{streakCount} days</strong>
        </article>
      </div>

      <div class="done-actions">
        <button class="ghost-cta wide" type="button" onClick={onSeeRankings}>
          See Research Interest Rank
        </button>
      </div>
    </section>
  );
}
