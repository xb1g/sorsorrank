export const CURRENT_CONSENT_VERSION = "2026-05-20";
export const DAILY_CARD_LIMIT = 10;
export const MIN_RANKING_SAMPLE_SIZE = 120;
export const RAW_EVENT_RETENTION_DAYS = 7;

export const FEATURE_FLAGS = {
  swipeEnabled: "swipe_enabled",
  rankingsPublic: "rankings_public",
  shareCardsEnabled: "share_cards_enabled",
  electionFreeze: "election_freeze",
  adminRosterEnabled: "admin_roster_enabled"
} as const;

export const BANNED_PUBLIC_COPY_TERMS = [
  "vote",
  "support",
  "endorse",
  "best",
  "winner",
  "leading",
  "approval",
  "odds",
  "prediction",
  "hot",
  "match",
  "crush"
] as const;
