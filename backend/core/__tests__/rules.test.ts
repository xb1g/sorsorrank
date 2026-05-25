import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DAILY_CARD_LIMIT, MIN_RANKING_SAMPLE_SIZE, CURRENT_CONSENT_VERSION } from "../constants";
import { assertNeutralPublicCopy, findBannedPublicCopyTerms } from "../copyGuard";
import {
  autoPublishDailyDeck,
  getDailyDeckPoliticianIds,
  publishManualDailyDeck
} from "../dailyDeck";
import { BackendRuleError } from "../errors";
import { getRankingRows } from "../ranking";
import { validateRosterEntry } from "../roster";
import { recordSwipe, toIsoDate } from "../swipes";
import type { BackendState, PublicFigure, SwipeAction } from "../types";
import { getDrawerVoteRecords } from "../voteRecords";

const today = new Date("2026-05-21T12:00:00.000Z");

describe("backend rules", () => {
  it("rejects stored swipes without consent", () => {
    const state = createState({ withConsent: false });

    assert.throws(
      () => swipe(state, "figure-1", "research", "impression-1"),
      (error) => isBackendError(error, "ConsentRequiredError")
    );
  });

  it("requires the latest consent decision for the current version", () => {
    const state = createState();

    state.consents.push({
      visitorKeyHash: "visitor-hash",
      consentVersion: CURRENT_CONSENT_VERSION,
      declinedAt: new Date("2026-05-21T12:01:00.000Z").toISOString()
    });
    issueImpression(state, "figure-1", "after-decline");

    assert.throws(
      () => swipe(state, "figure-1", "research", "after-decline"),
      (error) => isBackendError(error, "ConsentRequiredError")
    );

    const staleState = createState({ withConsent: false });
    staleState.consents.push({
      visitorKeyHash: "visitor-hash",
      consentVersion: "old-version",
      acceptedAt: today.toISOString()
    });
    issueImpression(staleState, "figure-1", "stale-version");

    assert.throws(
      () => swipe(staleState, "figure-1", "research", "stale-version"),
      (error) => isBackendError(error, "ConsentRequiredError")
    );
  });

  it("allows the 10th swipe and rejects the 11th", () => {
    const state = createState();

    for (let index = 0; index < DAILY_CARD_LIMIT; index += 1) {
      const impressionId = `impression-${index + 1}`;
      issueImpression(state, `figure-${index + 1}`, impressionId);
      const result = swipe(state, `figure-${index + 1}`, "skip", impressionId);
      assert.equal(result.usedToday, index + 1);
    }

    issueImpression(state, "figure-11", "impression-11");
    assert.throws(
      () => swipe(state, "figure-11", "skip", "impression-11"),
      (error) => isBackendError(error, "DailyLimitExceededError")
    );
  });

  it("treats duplicate card taps as idempotent successes", () => {
    const state = createState();

    issueImpression(state, "figure-1", "same-impression");
    const first = swipe(state, "figure-1", "research", "same-impression");
    const second = recordSwipe(state, {
      visitorKeyHash: "visitor-hash",
      politicianId: "figure-1",
      action: "research",
      cardImpressionId: "same-impression",
      idempotencyKey: "same-impression-key",
      now: today
    });

    assert.equal(first.usedToday, 1);
    assert.equal(second.usedToday, 1);
    assert.equal(second.duplicate, true);
    assert.equal(state.swipeEvents.length, 1);
    assert.equal(state.aggregates[0]?.eligibleImpressions, 1);
    assert.equal(state.aggregates[0]?.researchActions, 1);
  });

  it("counts Research and Skip correctly in aggregates", () => {
    const state = createState();

    issueImpression(state, "figure-1", "research-impression");
    issueImpression(state, "figure-1", "skip-impression");
    swipe(state, "figure-1", "research", "research-impression");
    swipe(state, "figure-1", "skip", "skip-impression");

    const aggregate = state.aggregates.find((candidate) => candidate.politicianId === "figure-1");

    assert.equal(aggregate?.eligibleImpressions, 2);
    assert.equal(aggregate?.researchActions, 1);
    assert.equal(aggregate?.skipActions, 1);
  });

  it("rejects forged impressions that were not issued by the backend", () => {
    const state = createState();

    assert.throws(
      () => swipe(state, "figure-1", "research", "fake-impression"),
      (error) => isBackendError(error, "CardImpressionRequiredError")
    );
  });

  it("lets admins publish a future deck and preserves manual order", () => {
    const state = createState();
    const futureDate = "2026-05-24";

    publishManualDailyDeck(state, {
      deckDate: futureDate,
      politicianIds: ["figure-4", "figure-2", "figure-7"],
      adminId: "admin-api",
      now: today
    });

    assert.deepEqual(getDailyDeckPoliticianIds(state, futureDate).slice(0, 3), [
      "figure-4",
      "figure-2",
      "figure-7"
    ]);
  });

  it("auto-picks the same published deck when no deck exists for the date", () => {
    const state = createState();
    const deckDate = "2026-05-22";

    const first = autoPublishDailyDeck(state, {
      deckDate,
      adminId: "public-auto",
      now: today
    });
    const second = autoPublishDailyDeck(state, {
      deckDate,
      adminId: "public-auto",
      now: today
    });

    assert.deepEqual(first.politicianIds, second.politicianIds);
    assert.equal(first.politicianIds.length, DAILY_CARD_LIMIT);
    assert.equal(state.dailyDecks.length, 1);
  });

  it("preserves issued cards when today's deck is changed", () => {
    const state = createState();
    const deckDate = toIsoDate(today);

    publishManualDailyDeck(state, {
      deckDate,
      politicianIds: ["figure-1", "figure-2", "figure-3"],
      adminId: "admin-api",
      now: today
    });
    issueImpression(state, "figure-1", "issued-from-today-deck");

    const result = publishManualDailyDeck(state, {
      deckDate,
      politicianIds: ["figure-3", "figure-2", "figure-1"],
      adminId: "admin-api",
      now: today
    });

    assert.equal(result.politicianIds[0], "figure-1");
    assert.ok(result.politicianIds.includes("figure-3"));
    assert.ok(result.politicianIds.includes("figure-2"));
  });

  it("fills manual partial decks to the daily limit", () => {
    const state = createState();
    const deckDate = "2026-05-24";

    const result = publishManualDailyDeck(state, {
      deckDate,
      politicianIds: ["figure-4", "figure-2"],
      adminId: "admin-api",
      now: today
    });

    assert.equal(result.politicianIds.length, DAILY_CARD_LIMIT);
    assert.deepEqual(result.politicianIds.slice(0, 2), ["figure-4", "figure-2"]);
    assert.equal(new Set(result.politicianIds).size, DAILY_CARD_LIMIT);
  });

  it("auto-pick completes a partial locked deck without moving issued cards", () => {
    const state = createState();
    const deckDate = toIsoDate(today);

    publishManualDailyDeck(state, {
      deckDate,
      politicianIds: ["figure-4", "figure-2"],
      adminId: "admin-api",
      now: today
    });
    issueImpression(state, "figure-4", "issued-card");

    const result = autoPublishDailyDeck(state, {
      deckDate,
      adminId: "admin-api",
      now: today
    });

    assert.equal(result.politicianIds.length, DAILY_CARD_LIMIT);
    assert.deepEqual(result.politicianIds.slice(0, 2), ["figure-4", "figure-2"]);
    assert.equal(new Set(result.politicianIds).size, DAILY_CARD_LIMIT);
  });

  it("manual publish adds selected people into open slots when issued cards exist", () => {
    const state = createState();
    const deckDate = toIsoDate(today);

    autoPublishDailyDeck(state, {
      deckDate,
      adminId: "public-auto",
      now: today
    });
    const original = getDailyDeckPoliticianIds(state, deckDate);
    issueImpression(state, original[0]!, "issued-card");

    const result = publishManualDailyDeck(state, {
      deckDate,
      politicianIds: ["figure-4", "figure-2"],
      adminId: "admin-api",
      now: today
    });

    assert.equal(result.politicianIds[0], original[0]);
    assert.ok(result.politicianIds.includes("figure-4"));
    assert.ok(result.politicianIds.includes("figure-2"));
    assert.equal(result.politicianIds.length, DAILY_CARD_LIMIT);
    assert.equal(new Set(result.politicianIds).size, DAILY_CARD_LIMIT);
  });

  it("rejects inactive rows in a scheduled deck", () => {
    const state = createState();
    state.politicians[1]!.status = "archived";

    assert.throws(
      () =>
        publishManualDailyDeck(state, {
          deckDate: "2026-05-24",
          politicianIds: ["figure-1", "figure-2"],
          adminId: "admin-api",
          now: today
        }),
      (error) => isBackendError(error, "PoliticianNotFoundError")
    );
  });

  it("hides rankings below the configured sample threshold", () => {
    const state = createState();
    const date = toIsoDate(today);

    state.aggregates.push(
      {
        date,
        politicianId: "figure-1",
        eligibleImpressions: MIN_RANKING_SAMPLE_SIZE - 1,
        researchActions: MIN_RANKING_SAMPLE_SIZE - 2,
        skipActions: 1
      },
      {
        date,
        politicianId: "figure-2",
        eligibleImpressions: MIN_RANKING_SAMPLE_SIZE,
        researchActions: MIN_RANKING_SAMPLE_SIZE / 2,
        skipActions: MIN_RANKING_SAMPLE_SIZE / 2
      }
    );

    const rows = getRankingRows(state, date);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.politicianId, "figure-2");
  });

  it("freezes swipes and rankings when election freeze is active", () => {
    const state = createState();
    state.flags.electionFreeze = true;

    assert.throws(
      () => swipe(state, "figure-1", "research", "frozen-impression"),
      (error) => isBackendError(error, "FreezeModeActiveError")
    );
    assert.throws(
      () => getRankingRows(state, toIsoDate(today)),
      (error) => isBackendError(error, "FreezeModeActiveError")
    );
  });

  it("rejects roster fields that could become markup or royal-institution content", () => {
    assert.throws(
      () =>
        validateRosterEntry({
          ...createFigure(1),
          displayName: "<script>alert(1)</script>"
        }),
      (error) => isBackendError(error, "InvalidRosterEntryError")
    );

    assert.throws(
      () =>
        validateRosterEntry({
          ...createFigure(1),
          displayName: "Royal Institution Topic"
        }),
      (error) => isBackendError(error, "InvalidRosterEntryError")
    );
  });

  it("keeps share copy neutral", () => {
    assert.doesNotThrow(() => assertNeutralPublicCopy("I researched 10 public figures today. Your turn."));
    assert.deepEqual(findBannedPublicCopyTerms("Our winner is leading the vote."), [
      "vote",
      "winner",
      "leading"
    ]);
  });

  it("returns only recent factual vote records for the expanded drawer", () => {
    const state = createState();
    state.voteRecords.push(
      createVoteRecord("figure-1", "vote-1", "2025-01-01", "เห็นด้วย"),
      createVoteRecord("figure-1", "vote-2", "2025-04-01", "ไม่เห็นด้วย"),
      createVoteRecord("figure-1", "vote-3", "2025-03-01", "งดออกเสียง"),
      createVoteRecord("figure-1", "vote-4", "2025-02-01", "ไม่ลงคะแนน"),
      createVoteRecord("figure-2", "vote-5", "2025-05-01", "เห็นด้วย")
    );

    const records = getDrawerVoteRecords(state, "figure-1");

    assert.deepEqual(records.map((record) => record.voteEventId), ["vote-2", "vote-3", "vote-4"]);
    assert.deepEqual(Object.keys(records[0]!).sort(), [
      "option",
      "politicianId",
      "sourceUrl",
      "startDate",
      "title",
      "voteEventId"
    ]);
  });
});

function createState(options: { withConsent?: boolean } = {}): BackendState {
  const withConsent = options.withConsent ?? true;
  const state: BackendState = {
    politicians: Array.from({ length: 12 }, (_, index) => createFigure(index + 1)),
    consents: [],
    cardImpressions: [],
    dailyDecks: [],
    dailyDeckCards: [],
    voteRecords: [],
    swipeEvents: [],
    aggregates: [],
    flags: {
      swipeEnabled: true,
      rankingsPublic: true,
      shareCardsEnabled: true,
      electionFreeze: false,
      adminRosterEnabled: true
    },
    consentVersion: CURRENT_CONSENT_VERSION,
    dailyLimit: DAILY_CARD_LIMIT,
    minRankingSampleSize: MIN_RANKING_SAMPLE_SIZE
  };

  if (withConsent) {
    state.consents.push({
      visitorKeyHash: "visitor-hash",
      consentVersion: CURRENT_CONSENT_VERSION,
      acceptedAt: today.toISOString()
    });
  }

  return state;
}

function createVoteRecord(
  politicianId: string,
  voteEventId: string,
  startDate: string,
  option: string
) {
  return {
    politicianId,
    voteEventId,
    title: `Public vote ${voteEventId}`,
    startDate,
    option,
    sourceUrl: `https://politigraph.wevis.info/votes/${voteEventId}`
  };
}

function issueImpression(state: BackendState, politicianId: string, impressionId: string) {
  state.cardImpressions.push({
    id: impressionId,
    visitorKeyHash: "visitor-hash",
    politicianId,
    occurredOn: toIsoDate(today),
    issuedAt: today.toISOString()
  });
}

function createFigure(index: number): PublicFigure {
  return {
    id: `figure-${index}`,
    displayName: `Public Figure ${index}`,
    slug: `public-figure-${index}`,
    roleLabel: "Public figure",
    partyLabel: "Independent",
    status: "active",
    searchQuery: `Public Figure ${index} Thailand`
  };
}

function swipe(state: BackendState, politicianId: string, action: SwipeAction, cardImpressionId: string) {
  return recordSwipe(state, {
    visitorKeyHash: "visitor-hash",
    politicianId,
    action,
    cardImpressionId,
    idempotencyKey: `${cardImpressionId}-key`,
    now: today
  });
}

function isBackendError(error: unknown, code: BackendRuleError["code"]) {
  return error instanceof BackendRuleError && error.code === code;
}
