import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DAILY_CARD_LIMIT, MIN_RANKING_SAMPLE_SIZE, CURRENT_CONSENT_VERSION } from "../constants";
import { assertNeutralPublicCopy, findBannedPublicCopyTerms } from "../copyGuard";
import { BackendRuleError } from "../errors";
import { getRankingRows } from "../ranking";
import { validateRosterEntry } from "../roster";
import { recordSwipe, toIsoDate } from "../swipes";
import type { BackendState, PublicFigure, SwipeAction } from "../types";

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
});

function createState(options: { withConsent?: boolean } = {}): BackendState {
  const withConsent = options.withConsent ?? true;
  const state: BackendState = {
    politicians: Array.from({ length: 12 }, (_, index) => createFigure(index + 1)),
    consents: [],
    cardImpressions: [],
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
