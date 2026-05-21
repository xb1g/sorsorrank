import { dailyDeck, rankingSummary } from "../data/mockPoliticians";
import type {
  ConsentState,
  DeckState,
  RankingSummary,
  RecordSwipeInput,
  RecordSwipeResult
} from "../types";

const APP_LATENCY_MS = 220;
const DAILY_LIMIT = 10;
const CONSENT_KEY = "sorsorrank-consent-version";
const CONSENT_VERSION = "2026-05-20";

function wait(duration: number) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

export async function fetchRankingSummary(): Promise<RankingSummary> {
  await wait(APP_LATENCY_MS);
  return rankingSummary;
}

export async function fetchConsentState(): Promise<ConsentState> {
  await wait(120);
  return {
    version: CONSENT_VERSION,
    hasConsented: window.localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION
  };
}

export async function acceptConsent(): Promise<ConsentState> {
  await wait(160);
  window.localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
  return {
    version: CONSENT_VERSION,
    hasConsented: true
  };
}

export async function fetchDeckState(): Promise<DeckState> {
  await wait(APP_LATENCY_MS);
  return {
    cards: dailyDeck,
    dailyLimit: DAILY_LIMIT,
    usedToday: 0,
    streakCount: 4
  };
}

export async function recordSwipe(_input: RecordSwipeInput): Promise<RecordSwipeResult> {
  await wait(140);
  return {
    usedToday: 1,
    remaining: 9,
    streakCount: 4
  };
}
