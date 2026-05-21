export type SwipeAction = "research" | "skip";

export interface Politician {
  id: string;
  displayName: string;
  roleLabel: string;
  partyLabel?: string;
  regionLabel?: string;
  imageUrl?: string;
  researchInterestScore: number;
  researchActions: number;
  eligibleImpressions: number;
  momentum: number;
  sparkline: number[];
  approveTrend: number[];
  disapproveTrend: number[];
}

export interface DeckCard extends Politician {
  searchQuery: string;
  impressionId: string;
}

export interface ConsentState {
  version: string;
  hasConsented: boolean;
}

export interface DeckState {
  cards: DeckCard[];
  dailyLimit: number;
  usedToday: number;
  streakCount: number;
}

export interface RankingSummary {
  generatedAt: string;
  sampleSize: number;
  threshold: number;
  politicians: Politician[];
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
  streakCount: number;
}
