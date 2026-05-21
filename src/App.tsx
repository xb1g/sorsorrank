import { useEffect, useState } from "preact/hooks";
import { ConsentGate } from "./components/ConsentGate";
import { DailyDone } from "./components/DailyDone";
import { ResearchInterestRank } from "./components/ResearchInterestRank";
import { SwipeDeckPanel } from "./components/SwipeDeckPanel";
import {
  acceptConsent,
  createCompletionShare,
  fetchConsentState,
  fetchDeckState,
  fetchRankingSummary,
  getTurnstileSiteKey,
  recordSwipe
} from "./services/api";
import type { ConsentState, DeckCard, DeckState, RankingSummary, SwipeAction } from "./types";

type AppView = "consent" | "deck" | "done" | "rankings";

function App() {
  const [rankingSummary, setRankingSummary] = useState<RankingSummary | null>(null);
  const [deckState, setDeckState] = useState<DeckState | null>(null);
  const [consentState, setConsentState] = useState<ConsentState | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [flowError, setFlowError] = useState("");
  const [isAcceptingConsent, setIsAcceptingConsent] = useState(false);
  const [view, setView] = useState<AppView>("consent");

  useEffect(() => {
    let isMounted = true;

    async function loadApp() {
      try {
        const [rankingData, consentData] = await Promise.all([
          fetchRankingSummary(),
          fetchConsentState()
        ]);
        const deckData = consentData.hasConsented ? await fetchDeckState() : null;

        if (!isMounted) {
          return;
        }

        setRankingSummary(rankingData);
        setDeckState(deckData);
        setConsentState(consentData);
        setView(consentData.hasConsented ? (deckData?.doneToday ? "done" : "deck") : "consent");
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

  async function handleAuthChange() {
    const nextConsent = await fetchConsentState();
    setConsentState(nextConsent);

    if (!nextConsent.hasConsented && view !== "rankings") {
      setDeckState(null);
      setView("consent");
    }
  }

  async function handleAcceptConsent(humanChallengeToken?: string) {
    setIsAcceptingConsent(true);
    setFlowError("");

    try {
      const nextConsent = await acceptConsent(humanChallengeToken);
      const nextDeck = await fetchDeckState();
      setConsentState(nextConsent);
      setDeckState(nextDeck);
      setView(nextDeck.doneToday ? "done" : "deck");
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : "Consent could not be recorded.");
    } finally {
      setIsAcceptingConsent(false);
    }
  }

  async function handleSwipe(card: DeckCard, action: SwipeAction) {
    const result = await recordSwipe({
      politicianId: card.id,
      action,
      impressionId: card.impressionId,
      idempotencyKey: `${card.impressionId}-${action}`
    });

    setDeckState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        usedToday: result.usedToday,
        remaining: result.remaining
      };
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
            class={`nav-chip ${view === "rankings" ? "is-active" : ""}`}
            type="button"
            onClick={() => setView("rankings")}
          >
            Rank
          </button>
        </nav>
      </header>

      <main class={view === "deck" || view === "consent" || view === "done" ? "focus-layout" : "content-layout"}>
        {status === "loading" ? (
          <section class="panel state-panel">
            <h2>Loading today's research loop</h2>
            <p>Checking consent, deck state, and aggregate rank.</p>
          </section>
        ) : null}

        {status === "error" ? (
          <section class="panel state-panel error-state">
            <h2>App state could not load</h2>
            <p>Check the backend URL or try again shortly.</p>
          </section>
        ) : null}

        {status === "ready" && rankingSummary && consentState ? (
          <>
            {view === "consent" ? (
              <ConsentGate
                consentState={consentState}
                turnstileSiteKey={getTurnstileSiteKey()}
                isAccepting={isAcceptingConsent}
                errorMessage={flowError}
                onAccept={handleAcceptConsent}
                onDecline={() => setView("rankings")}
              />
            ) : null}

            {view === "deck" && deckState ? (
              <SwipeDeckPanel
                deckState={deckState}
                onSwipe={handleSwipe}
                onComplete={() => setView("done")}
              />
            ) : null}

            {view === "done" && deckState ? (
              <DailyDone
                consentState={consentState}
                streakCount={deckState.streakCount}
                onCreateShare={createCompletionShare}
                onSeeRankings={() => setView("rankings")}
                onAuthChange={handleAuthChange}
              />
            ) : null}

            {view === "rankings" ? (
              <div class="content-column readable-column">
                <ResearchInterestRank rankingSummary={rankingSummary} />
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;
