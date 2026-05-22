import { useEffect, useState } from "preact/hooks";
import { ConsentGate } from "./components/ConsentGate";
import { DailyDone } from "./components/DailyDone";
import { LoadingScreen } from "./components/LoadingScreen";
import { PolicyDocument } from "./components/PolicyDocument";
import { ResearchInterestRank } from "./components/ResearchInterestRank";
import { SwipeDeckPanel } from "./components/SwipeDeckPanel";
import { UserProfile } from "./components/UserProfile";
import { CardsIcon, ChartIcon, UserIcon } from "./components/icons";
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

type AppView = "consent" | "deck" | "done" | "rankings" | "profile" | "privacy" | "terms";

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
      {view !== "privacy" && view !== "terms" ? (
        <header class="topbar">
          <div class="brand-lockup">
            <img src="/logo.svg" class="brand-logo" alt="SorsorRank Logo" />
            <div>
              <strong>SorsorRank</strong>
              <span>อันดับความสนใจค้นคว้า</span>
            </div>
          </div>
          <nav class="topnav desktop-nav">
            <button
              class={`nav-chip ${view === "rankings" ? "is-active" : ""}`}
              type="button"
              onClick={() => setView("rankings")}
            >
              อันดับ
            </button>
            <button
              class={`nav-chip ${view === "profile" ? "is-active" : ""}`}
              type="button"
              onClick={() => setView("profile")}
            >
              บัญชี
            </button>
          </nav>
        </header>
      ) : null}

      <main class={view === "deck" || view === "consent" || view === "done" ? "focus-layout" : "content-layout"}>
        {status === "loading" ? <LoadingScreen /> : null}

        {status === "error" ? (
          <section class="panel state-panel error-state">
            <h2>App state could not load</h2>
            <p>Check the backend URL or try again shortly.</p>
          </section>
        ) : null}

        {status === "ready" && view === "consent" ? (
          <ConsentGate
            consentState={consentState!}
            turnstileSiteKey={getTurnstileSiteKey()}
            isAccepting={isAcceptingConsent}
            errorMessage={flowError}
            onAccept={handleAcceptConsent}
            onDecline={() => setView("rankings")}
            onViewPrivacy={() => setView("privacy")}
            onViewTerms={() => setView("terms")}
          />
        ) : null}

        {status === "ready" && view === "privacy" ? (
          <PolicyDocument type="privacy" onBack={() => setView(consentState?.hasConsented ? (deckState?.doneToday ? "done" : "deck") : "consent")} />
        ) : null}

        {status === "ready" && view === "terms" ? (
          <PolicyDocument type="terms" onBack={() => setView(consentState?.hasConsented ? (deckState?.doneToday ? "done" : "deck") : "consent")} />
        ) : null}

        {status === "ready" && rankingSummary && consentState ? (
          <>
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

            {view === "profile" ? (
              <UserProfile
                consentState={consentState}
                deckState={deckState}
                onViewRankings={() => setView("rankings")}
                onViewDeck={() => setView("deck")}
                onAuthChange={handleAuthChange}
              />
            ) : null}
          </>
        ) : null}
      </main>

      {view !== "privacy" && view !== "terms" ? (
        <nav class="bottom-tab-bar">
          <button
            class={`tab-item ${view === "deck" || view === "done" || view === "consent" ? "is-active" : ""}`}
            type="button"
            onClick={() => setView(consentState?.hasConsented ? (deckState?.doneToday ? "done" : "deck") : "consent")}
          >
            <CardsIcon />
            <span>10 ใบ</span>
          </button>
          <button
            class={`tab-item ${view === "rankings" ? "is-active" : ""}`}
            type="button"
            onClick={() => setView("rankings")}
          >
            <ChartIcon />
            <span>อันดับ</span>
          </button>
          <button
            class={`tab-item ${view === "profile" ? "is-active" : ""}`}
            type="button"
            onClick={() => setView("profile")}
          >
            <UserIcon />
            <span>บัญชี</span>
          </button>
        </nav>
      ) : null}
    </div>
  );
}

export default App;
