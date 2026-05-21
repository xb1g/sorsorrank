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
      <p class="panel-label">Consent</p>
      <h1>Do your 10. Search for yourself. See what people are researching.</h1>
      <p class="consent-copy">
        Swipes are used only for aggregate Research Interest Rank. This is not a poll,
        endorsement, prediction, approval rating, or voting guide.
      </p>
      <div class="consent-meta">
        <span>Consent version {consentState.version}</span>
        <span>Storage starts only after explicit consent</span>
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
          Start my 10
        </button>
        <button class="ghost-cta wide" type="button" onClick={onReadMethodology}>
          Read methodology
        </button>
        <button class="text-link-button" type="button" onClick={onDecline}>
          Decline
        </button>
      </div>
    </section>
  );
}
