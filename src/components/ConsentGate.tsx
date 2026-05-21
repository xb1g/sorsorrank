import type { ConsentState } from "../types";

interface ConsentGateProps {
  consentState: ConsentState;
  onAccept: () => void | Promise<void>;
  onDecline: () => void;
  onOpenContact: () => void;
  onReadMethodology: () => void;
}

export function ConsentGate({
  consentState,
  onAccept,
  onDecline,
  onOpenContact,
  onReadMethodology
}: ConsentGateProps) {
  return (
    <section class="panel consent-gate">
      <p class="panel-label">Before you start</p>
      <h1>Do your 10. Check the names. Build the board.</h1>
      <p class="consent-copy">
        Your swipes only feed the Politician Leaderboard. This is not a poll, a prediction,
        or a voting guide.
      </p>
      <div class="consent-meta">
        <span>Consent version {consentState.version}</span>
        <span>Nothing gets saved until you say yes</span>
      </div>
      <div class="consent-links">
        <button class="text-link-button" type="button" onClick={onReadMethodology}>
          Methodology
        </button>
        <button class="text-link-button" type="button">
          Privacy
        </button>
        <button class="text-link-button" type="button" onClick={onOpenContact}>
          Contact
        </button>
      </div>
      <div class="consent-actions">
        <button class="primary-cta wide" type="button" onClick={onAccept}>
          Start ranking
        </button>
        <button class="ghost-cta wide" type="button" onClick={onReadMethodology}>
          See the rules
        </button>
        <button class="text-link-button" type="button" onClick={onDecline}>
          Not right now
        </button>
      </div>
    </section>
  );
}
