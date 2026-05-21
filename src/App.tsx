import { useEffect, useState } from "preact/hooks";
import { ConsentGate } from "./components/ConsentGate";
import { ContactPanel } from "./components/ContactPanel";
import { DailyDone } from "./components/DailyDone";
import { MethodologyPanel } from "./components/MethodologyPanel";
import { ResearchInterestRank } from "./components/ResearchInterestRank";
import { SwipeDeckPanel } from "./components/SwipeDeckPanel";
import {
  acceptConsent,
  fetchConsentState,
  fetchDeckState,
  fetchRankingSummary,
  recordSwipe
} from "./services/api";
import type { ConsentState, DeckCard, DeckState, RankingSummary, SwipeAction } from "./types";

type AppView = "consent" | "deck" | "done" | "rankings" | "methodology" | "contact";

function App() {
  const [rankingSummary, setRankingSummary] = useState<RankingSummary | null>(null);
  const [deckState, setDeckState] = useState<DeckState | null>(null);
  const [consentState, setConsentState] = useState<ConsentState | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [view, setView] = useState<AppView>("consent");

  useEffect(() => {
    let isMounted = true;

    async function loadApp() {
      try {
        const [rankingData, deckData, consentData] = await Promise.all([
          fetchRankingSummary(),
          fetchDeckState(),
          fetchConsentState()
        ]);

        if (!isMounted) {
          return;
        }

        setRankingSummary(rankingData);
        setDeckState(deckData);
        setConsentState(consentData);
        setView(consentData.hasConsented ? "deck" : "consent");
        setStatus("ready");
      } catch (error) {
        console.error("Failed to load app state", error);
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    loadApp();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleAcceptConsent() {
    const nextConsent = await acceptConsent();
    setConsentState(nextConsent);
    setView("deck");
  }

  async function handleSwipe(card: DeckCard, action: SwipeAction) {
    await recordSwipe({
      politicianId: card.id,
      action,
      impressionId: card.impressionId,
      idempotencyKey: `${card.impressionId}-${action}`
    });
  }

  return (
    <div class="app-shell app-shell-contract">
      <header class="topbar">
        <div class="brand-lockup">
          <div class="brand-mark">S</div>
          <div>
            <strong>SorsorRank</strong>
            <span>Research Interest Rank</span>
          </div>
        </div>
        <nav class="topnav">
          <button
            class={`nav-chip ${view === "methodology" ? "is-active" : ""}`}
            type="button"
            onClick={() => setView("methodology")}
          >
            Methodology
          </button>
          <button
            class={`nav-chip ${view === "rankings" ? "is-active" : ""}`}
            type="button"
            onClick={() => setView("rankings")}
          >
            Research Interest Rank
          </button>
          <button
            class={`nav-chip ${view === "contact" ? "is-active" : ""}`}
            type="button"
            onClick={() => setView("contact")}
          >
            Contact
          </button>
        </nav>
      </header>

      <main class={view === "deck" || view === "consent" || view === "done" ? "focus-layout" : "content-layout"}>
        {status === "loading" ? (
          <section class="panel state-panel">
            <h2>Loading</h2>
            <p>Preparing consent, deck, and ranking data.</p>
          </section>
        ) : null}

        {status === "error" ? (
          <section class="panel state-panel error-state">
            <h2>Something failed to load</h2>
            <p>The consent-first flow is in place, but the mocked data source failed.</p>
          </section>
        ) : null}

        {status === "ready" && rankingSummary && deckState && consentState ? (
          <>
            {view === "consent" ? (
              <ConsentGate
                consentState={consentState}
                onAccept={handleAcceptConsent}
                onDecline={() => setView("methodology")}
                onOpenContact={() => setView("contact")}
                onReadMethodology={() => setView("methodology")}
              />
            ) : null}

            {view === "deck" ? (
              <SwipeDeckPanel
                deckState={deckState}
                onSwipe={handleSwipe}
                onComplete={() => setView("done")}
              />
            ) : null}

            {view === "done" ? (
              <DailyDone
                streakCount={deckState.streakCount}
                onSeeRankings={() => setView("rankings")}
                onReadMethodology={() => setView("methodology")}
              />
            ) : null}

            {view === "methodology" ? (
              <MethodologyPanel
                onStart={() => setView(consentState.hasConsented ? "deck" : "consent")}
                onSeeRankings={() => setView("rankings")}
              />
            ) : null}

            {view === "rankings" ? (
              <div class="content-column readable-column">
                <ResearchInterestRank rankingSummary={rankingSummary} />
                <MethodologyPanel
                  compact
                  onStart={() => setView(consentState.hasConsented ? "deck" : "consent")}
                  onSeeRankings={() => setView("rankings")}
                />
              </div>
            ) : null}

            {view === "contact" ? (
              <div class="content-column readable-column">
                <ContactPanel onStart={() => setView(consentState.hasConsented ? "deck" : "consent")} />
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;
