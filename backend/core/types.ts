export type SwipeAction = "research" | "skip";
export type PoliticianStatus = "draft" | "active" | "archived";
export type ShareType = "completion" | "streak" | "rank_snapshot";

export interface PublicFigure {
  id: string;
  displayName: string;
  slug: string;
  roleLabel?: string;
  partyLabel?: string;
  status: PoliticianStatus;
  searchQuery: string;
  activeCandidate?: boolean;
  legalReviewedAt?: string;
}

export interface ConsentRecord {
  visitorKeyHash: string;
  consentVersion: string;
  acceptedAt?: string;
  declinedAt?: string;
}

export interface SwipeEvent {
  visitorKeyHash: string;
  politicianId: string;
  action: SwipeAction;
  cardImpressionId: string;
  idempotencyKey: string;
  occurredOn: string;
  createdAt: string;
}

export interface CardImpression {
  id: string;
  visitorKeyHash: string;
  politicianId: string;
  occurredOn: string;
  issuedAt: string;
  consumedAt?: string;
}

export type DailyDeckStatus = "published";
export type DailyDeckSelectionMode = "manual" | "auto_pick";

export interface DailyDeck {
  deckDate: string;
  status: DailyDeckStatus;
  selectionMode: DailyDeckSelectionMode;
  dailyLimit: number;
  generatedAt: string;
  publishedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface DailyDeckCard {
  deckDate: string;
  position: number;
  politicianId: string;
}

export interface DailyAggregate {
  date: string;
  politicianId: string;
  eligibleImpressions: number;
  researchActions: number;
  skipActions: number;
}

export interface PoliticianVoteRecord {
  politicianId: string;
  voteEventId: string;
  title: string;
  startDate?: string;
  option: string;
  sourceUrl: string;
}

export interface FeatureFlags {
  swipeEnabled: boolean;
  rankingsPublic: boolean;
  shareCardsEnabled: boolean;
  electionFreeze: boolean;
  adminRosterEnabled: boolean;
}

export interface BackendState {
  politicians: PublicFigure[];
  consents: ConsentRecord[];
  cardImpressions: CardImpression[];
  dailyDecks: DailyDeck[];
  dailyDeckCards: DailyDeckCard[];
  voteRecords: PoliticianVoteRecord[];
  swipeEvents: SwipeEvent[];
  aggregates: DailyAggregate[];
  flags: FeatureFlags;
  consentVersion: string;
  dailyLimit: number;
  minRankingSampleSize: number;
}

export interface RecordSwipeRequest {
  visitorKeyHash: string;
  politicianId: string;
  action: SwipeAction;
  cardImpressionId: string;
  idempotencyKey: string;
  now: Date;
}

export interface RecordSwipeResult {
  usedToday: number;
  remaining: number;
  duplicate: boolean;
}

export interface RankingRow {
  politicianId: string;
  displayName: string;
  roleLabel?: string;
  partyLabel?: string;
  eligibleImpressions: number;
  researchActions: number;
  researchInterestScore: number;
  hiddenBelowThreshold: boolean;
}
