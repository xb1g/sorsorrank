export type SwipeAction = "research" | "skip";

export interface VoteRecord {
  voteEventId: string;
  title: string;
  startDate?: string;
  option: string;
  sourceUrl: string;
}

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
  voteRecords?: VoteRecord[];
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

export interface SwipeHistoryItem {
  id: string;
  action: SwipeAction;
  createdAt: string;
  displayName: string;
  roleLabel?: string;
  partyLabel?: string;
  searchQuery?: string;
  imageUrl?: string;
}

export interface SwipeHistory {
  date: string;
  items: SwipeHistoryItem[];
}

export interface AdminDailyDeckCard {
  position: number;
  politicianId: string;
  displayName: string;
  roleLabel?: string;
  partyLabel?: string;
  searchQuery?: string;
  imageUrl?: string;
  imageSourceUrl?: string;
  infoSourceUrl?: string;
  featuredPriority?: number;
}

export interface AdminRosterOption {
  id: string;
  displayName: string;
  roleLabel?: string;
  partyLabel?: string;
  searchQuery: string;
  imageUrl?: string;
  imageSourceUrl?: string;
  infoSourceUrl?: string;
  featuredPriority?: number;
  updatedAt?: string;
}

export interface AdminDailyDeckState {
  date: string;
  today: string;
  cards: AdminDailyDeckCard[];
  roster: AdminRosterOption[];
}
