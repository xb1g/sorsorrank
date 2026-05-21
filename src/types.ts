export type SwipeAction = "research" | "skip";

export interface Politician {
  id: string;
  displayName: string;
  roleLabel: string;
  partyLabel?: string;
  searchQuery?: string;
  regionLabel?: string;
  imageUrl?: string;
  imageSourceUrl?: string;
  infoSourceUrl?: string;
  featuredPriority?: number;
  researchInterestScore: number;
  researchActions: number;
  eligibleImpressions: number;
  momentum: number;
  sparkline: number[];
}

export interface DeckCard extends Politician {
  searchQuery: string;
  impressionId: string;
}

export interface ConsentState {
  version: string;
  hasConsented: boolean;
  requiresHumanChallenge: boolean;
  backendConnected: boolean;
  authConfigured: boolean;
  isAuthenticated: boolean;
  authMode: "supabase-account" | "supabase-anonymous" | "visitor-token" | "local-demo";
  authUserId?: string;
  authEmail?: string;
  isAnonymousAuth?: boolean;
}

export interface DeckState {
  cards: DeckCard[];
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  streakCount: number;
  doneToday?: boolean;
  freezeMode?: boolean;
  message?: string;
}

export interface RankingSummary {
  generatedAt: string;
  date?: string;
  sampleSize: number;
  threshold: number;
  politicians: Politician[];
  hidden?: boolean;
  message?: string;
  disclaimer?: string;
}

export interface RecordSwipeInput {
  politicianId: string;
  action: SwipeAction;
  impressionId: string;
  idempotencyKey: string;
}

export interface RecordSwipeResult {
  usedToday: number;
  remaining: number;
  streakCount?: number;
  duplicate?: boolean;
}
