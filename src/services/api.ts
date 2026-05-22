import { dailyDeck, rankingSummary } from "../data/mockPoliticians";
import {
  ensureSupabaseAnonymousSession,
  getSupabaseAccessToken,
  getSupabaseAuthSnapshot,
  getSupabasePublishableKey
} from "./supabaseAuth";
import type {
  ConsentState,
  DeckCard,
  DeckState,
  Politician,
  RankingSummary,
  RecordSwipeInput,
  RecordSwipeResult,
  SwipeHistory
} from "../types";

const APP_LATENCY_MS = 220;
const CONSENT_KEY = "sorsorrank-consent-version";
const VISITOR_TOKEN_KEY = "sorsorrank-visitor-token";
const CONSENT_VERSION = "2026-05-20";

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const configuredApiBase = readConfigValue(env.VITE_API_BASE_URL)?.replace(/\/$/, "");
const configuredSupabaseUrl = readConfigValue(env.VITE_SUPABASE_URL)?.replace(/\/$/, "");
const API_BASE_URL = configuredApiBase ?? (configuredSupabaseUrl ? `${configuredSupabaseUrl}/functions/v1` : "");
const TURNSTILE_SITE_KEY = readConfigValue(env.VITE_TURNSTILE_SITE_KEY) ?? "";

function readConfigValue(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || /^YOUR_/i.test(trimmed) || trimmed.includes("YOUR_PROJECT")) {
    return undefined;
  }
  return trimmed;
}

function wait(duration: number) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function backendEnabled() {
  return API_BASE_URL.length > 0;
}

function readVisitorToken() {
  return window.localStorage.getItem(VISITOR_TOKEN_KEY);
}

function writeVisitorToken(token: string | undefined) {
  if (token) {
    window.localStorage.setItem(VISITOR_TOKEN_KEY, token);
  }
}

async function callFunction<T>(
  functionName: string,
  options: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
  } = {}
): Promise<T> {
  if (!backendEnabled()) {
    throw new Error("Backend API base URL is not configured.");
  }

  const method = options.method ?? "GET";
  const headers = new Headers();
  const supabaseToken = await getSupabaseAccessToken();
  const visitorToken = supabaseToken ? "" : readVisitorToken();
  const supabaseKey = getSupabasePublishableKey();

  if (supabaseKey) {
    headers.set("apikey", supabaseKey);
  }

  if (supabaseToken || visitorToken) {
    headers.set("Authorization", `Bearer ${supabaseToken || visitorToken}`);
  }

  if (method === "POST") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}/${functionName}`, {
    method,
    headers,
    body: method === "POST" ? JSON.stringify(options.body ?? {}) : undefined
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function fetchRankingSummary(): Promise<RankingSummary> {
  if (backendEnabled()) {
    const response = await callFunction<BackendRankingResponse>("get-rankings");
    return mapRankingResponse(response);
  }

  await wait(APP_LATENCY_MS);
  return rankingSummary;
}

export async function fetchConsentState(): Promise<ConsentState> {
  const authSnapshot = await getSupabaseAuthSnapshot();
  const hasBackendIdentity = authSnapshot.isAuthenticated || Boolean(readVisitorToken());

  await wait(120);
  return {
    version: CONSENT_VERSION,
    hasConsented: window.localStorage.getItem(CONSENT_KEY) === CONSENT_VERSION && (!backendEnabled() || hasBackendIdentity),
    requiresHumanChallenge: backendEnabled() && Boolean(TURNSTILE_SITE_KEY) && !hasBackendIdentity,
    backendConnected: backendEnabled(),
    authConfigured: authSnapshot.isConfigured,
    isAuthenticated: authSnapshot.isAuthenticated,
    authMode: getFrontendAuthMode(authSnapshot),
    authUserId: authSnapshot.userId,
    authEmail: authSnapshot.email,
    isAnonymousAuth: authSnapshot.isAnonymous
  };
}

export async function acceptConsent(humanChallengeToken?: string): Promise<ConsentState> {
  if (backendEnabled()) {
    const authSession = await ensureSupabaseAnonymousSession(humanChallengeToken);
    const response = await callFunction<BackendConsentResponse>("accept-consent", {
      method: "POST",
      body: {
        accepted: true,
        humanChallengeToken
      }
    });

    if (!authSession) {
      writeVisitorToken(response.visitorToken);
    }
    window.localStorage.setItem(CONSENT_KEY, response.consentVersion);

    return {
      version: response.consentVersion,
      hasConsented: response.canSwipe,
      requiresHumanChallenge: false,
      backendConnected: true,
      authConfigured: Boolean(authSession),
      isAuthenticated: Boolean(authSession || response.visitorToken),
      authMode: authSession
        ? authSession.user.is_anonymous
          ? "supabase-anonymous"
          : "supabase-account"
        : "visitor-token",
      authUserId: authSession?.user.id,
      authEmail: authSession?.user.email,
      isAnonymousAuth: authSession?.user.is_anonymous
    };
  }

  await wait(160);
  window.localStorage.setItem(CONSENT_KEY, CONSENT_VERSION);
  return {
    version: CONSENT_VERSION,
    hasConsented: true,
    requiresHumanChallenge: false,
    backendConnected: false,
    authConfigured: false,
    isAuthenticated: false,
    authMode: "local-demo"
  };
}

export async function fetchDeckState(): Promise<DeckState> {
  if (backendEnabled()) {
    const response = await callFunction<BackendDeckResponse>("get-deck");
    return {
      cards: response.cards.map(mapDeckCard),
      dailyLimit: response.dailyLimit,
      usedToday: response.usedToday,
      remaining: response.remaining,
      streakCount: 0,
      doneToday: response.doneToday,
      freezeMode: response.freezeMode,
      message: response.message
    };
  }

  await wait(APP_LATENCY_MS);
  const localSwipes = Number(window.localStorage.getItem("sorsorrank-local-swipes") ?? "0");
  return {
    cards: dailyDeck,
    dailyLimit: 99999,
    usedToday: localSwipes,
    remaining: 99999,
    streakCount: 4
  };
}

export async function recordSwipe(input: RecordSwipeInput): Promise<RecordSwipeResult> {
  if (backendEnabled()) {
    return callFunction<RecordSwipeResult>("record-swipe", {
      method: "POST",
      body: {
        politicianId: input.politicianId,
        action: input.action,
        impressionId: input.impressionId,
        idempotencyKey: input.idempotencyKey
      }
    });
  }

  await wait(140);
  const currentSwipes = Number(window.localStorage.getItem("sorsorrank-local-swipes") ?? "0");
  const nextSwipes = currentSwipes + 1;
  window.localStorage.setItem("sorsorrank-local-swipes", String(nextSwipes));

  return {
    usedToday: nextSwipes,
    remaining: 99999
  };
}

export async function fetchSwipeHistory(): Promise<SwipeHistory> {
  if (backendEnabled()) {
    return callFunction<SwipeHistory>("get-swipe-history");
  }
  await wait(180);
  return { date: new Date().toISOString().slice(0, 10), items: [] };
}

export async function createCompletionShare() {
  if (backendEnabled()) {
    return callFunction<BackendShareResponse>("create-share", {
      method: "POST",
      body: {
        shareType: "completion"
      }
    });
  }

  await wait(140);
  return {
    id: "mock-share",
    shareType: "completion",
    copy: "I researched 10 public figures today. Your turn.",
    createdAt: new Date().toISOString()
  };
}

export function getTurnstileSiteKey() {
  return TURNSTILE_SITE_KEY;
}

interface BackendConsentResponse {
  accepted: boolean;
  consentVersion: string;
  canSwipe: boolean;
  visitorToken?: string;
}

interface BackendDeckResponse {
  cards: Array<{
    id: string;
    displayName: string;
    roleLabel?: string;
    partyLabel?: string;
    searchQuery: string;
    imageUrl?: string;
    imageSourceUrl?: string;
    infoSourceUrl?: string;
    featuredPriority?: number;
    impressionId: string;
  }>;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  doneToday?: boolean;
  freezeMode?: boolean;
  message?: string;
}

interface BackendRankingResponse {
  generatedAt: string;
  date: string;
  threshold: number;
  sampleSize: number;
  rows?: Array<{
    politicianId: string;
    displayName: string;
    roleLabel?: string;
    partyLabel?: string;
    searchQuery?: string;
    imageUrl?: string;
    imageSourceUrl?: string;
    infoSourceUrl?: string;
    featuredPriority?: number;
    eligibleImpressions: number;
    researchActions: number;
    researchInterestScore: number;
    hiddenBelowThreshold: boolean;
  }>;
  hidden?: boolean;
  message?: string;
  disclaimer?: string;
}

interface BackendShareResponse {
  id: string;
  shareType: string;
  copy: string;
  createdAt: string;
}

function getFrontendAuthMode(
  authSnapshot: Awaited<ReturnType<typeof getSupabaseAuthSnapshot>>
): ConsentState["authMode"] {
  if (authSnapshot.isConfigured) {
    return authSnapshot.isAuthenticated && authSnapshot.isAnonymous === false
      ? "supabase-account"
      : "supabase-anonymous";
  }

  return backendEnabled() ? "visitor-token" : "local-demo";
}

function mapDeckCard(card: BackendDeckResponse["cards"][number]): DeckCard {
  const base = mapRankingRowToPolitician({
    politicianId: card.id,
    displayName: card.displayName,
    roleLabel: card.roleLabel,
    partyLabel: card.partyLabel,
    searchQuery: card.searchQuery,
    eligibleImpressions: 0,
    researchActions: 0,
    researchInterestScore: 0,
    hiddenBelowThreshold: false
  });

  return {
    ...base,
    searchQuery: card.searchQuery,
    imageUrl: card.imageUrl,
    imageSourceUrl: card.imageSourceUrl,
    infoSourceUrl: card.infoSourceUrl,
    featuredPriority: card.featuredPriority,
    impressionId: card.impressionId
  };
}

function mapRankingResponse(response: BackendRankingResponse): RankingSummary {
  return {
    generatedAt: response.generatedAt,
    date: response.date,
    sampleSize: response.sampleSize,
    threshold: response.threshold,
    hidden: response.hidden,
    message: response.message,
    disclaimer: response.disclaimer,
    politicians: (response.rows ?? []).map(mapRankingRowToPolitician)
  };
}

function mapRankingRowToPolitician(row: NonNullable<BackendRankingResponse["rows"]>[number]): Politician {
  return {
    id: row.politicianId,
    displayName: row.displayName,
    roleLabel: row.roleLabel ?? "Public figure",
    partyLabel: row.partyLabel,
    searchQuery: row.searchQuery,
    imageUrl: row.imageUrl,
    imageSourceUrl: row.imageSourceUrl,
    infoSourceUrl: row.infoSourceUrl,
    featuredPriority: row.featuredPriority,
    researchInterestScore: row.researchInterestScore,
    researchActions: row.researchActions,
    eligibleImpressions: row.eligibleImpressions,
    momentum: 0,
    sparkline: []
  };
}
