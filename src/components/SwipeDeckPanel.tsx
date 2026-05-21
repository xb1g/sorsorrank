import { useMemo, useState } from "preact/hooks";
import type { DeckCard, DeckState, SwipeAction } from "../types";
import { ChevronRightIcon, SearchIcon } from "./icons";

interface SwipeDeckPanelProps {
  deckState: DeckState;
  onSwipe: (card: DeckCard, action: SwipeAction) => Promise<void>;
  onComplete: () => void;
}

const effectMap: Record<SwipeAction, string[]> = {
  research: ["mint", "teal", "lime", "mint", "teal", "lime", "mint"],
  skip: ["amber", "amber", "rose", "amber", "rose", "amber", "amber"]
};

export function SwipeDeckPanel({
  deckState,
  onSwipe,
  onComplete
}: SwipeDeckPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [lastAction, setLastAction] = useState<SwipeAction | null>(null);

  const activeCard = deckState.cards[activeIndex];
  const remaining = Math.max(deckState.dailyLimit - activeIndex, 0);
  const progressLabel = `${Math.min(activeIndex + 1, deckState.dailyLimit)}/${deckState.dailyLimit}`;
  const completion = Math.min((activeIndex / deckState.dailyLimit) * 100, 100);
  const bubbles = useMemo(() => (lastAction ? effectMap[lastAction] : []), [lastAction]);

  async function handleSwipe(action: SwipeAction) {
    if (!activeCard || isBusy) {
      return;
    }

    setIsBusy(true);
    setLastAction(action);
    await onSwipe(activeCard, action);

    window.setTimeout(() => {
      const nextIndex = activeIndex + 1;
      if (nextIndex >= deckState.dailyLimit) {
        onComplete();
        return;
      }

      setActiveIndex(nextIndex);
      setIsBusy(false);
    }, 220);
  }

  if (!activeCard) {
    return null;
  }

  return (
    <section class="panel swipe-panel centered-flow-panel">
      <div class="panel-header">
        <div>
          <p class="panel-label">Daily deck</p>
          <h2>Do your 10</h2>
        </div>
        <div class="panel-meta">
          <span>{remaining} left today</span>
          <span>Streak {deckState.streakCount}</span>
        </div>
      </div>

      <div class="progress-row">
        <div class="progress-copy">
          <span>Progress</span>
          <strong>{progressLabel}</strong>
        </div>
        <div class="progress-track" aria-hidden="true">
          <div class="progress-fill" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div class={`swipe-card-frame ${isBusy ? "is-busy" : ""}`}>
        <div class="bubble-layer" aria-hidden="true">
          {bubbles.map((tone, index) => (
            <span key={`${tone}-${index}`} class={`bubble bubble-${tone} bubble-${index + 1}`} />
          ))}
        </div>

        <article class="swipe-card">
          <div class="portrait-shell">
            <div class="portrait-glow" />
            <div class="portrait-card">
              <div class="portrait-avatar">
                {activeCard.displayName
                  .split(" ")
                  .slice(0, 2)
                  .map((segment) => segment[0])
                  .join("")}
              </div>
              <div class="portrait-chart">
                <div />
                <div />
                <div />
                <div />
                <div />
              </div>
            </div>
          </div>

          <div class="swipe-content">
            <div>
              <p class="panel-label">Card {activeIndex + 1}</p>
              <h3>{activeCard.displayName}</h3>
              <p class="role-line">
                {activeCard.roleLabel}
                {activeCard.partyLabel ? ` · ${activeCard.partyLabel}` : ""}
              </p>
            </div>

            <a
              class="read-more-link"
              href={`https://www.google.com/search?q=${encodeURIComponent(activeCard.searchQuery)}`}
              target="_blank"
              rel="noreferrer"
            >
              <SearchIcon />
              Google Search
              <ChevronRightIcon />
            </a>

            <div class="action-row">
              <button
                class="deck-button deck-button-research"
                type="button"
                onClick={() => handleSwipe("research")}
                disabled={isBusy}
              >
                Approve
              </button>
              <button
                class="deck-button deck-button-skip"
                type="button"
                onClick={() => handleSwipe("skip")}
                disabled={isBusy}
              >
                Disapprove
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
