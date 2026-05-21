import { BackendRuleError } from "./errors";
import type { BackendState, DailyAggregate, RecordSwipeRequest, RecordSwipeResult, SwipeEvent } from "./types";

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function hasAcceptedConsent(state: BackendState, visitorKeyHash: string): boolean {
  const latestDecision = state.consents
    .filter((record) => {
      return record.visitorKeyHash === visitorKeyHash && record.consentVersion === state.consentVersion;
    })
    .sort((left, right) => {
      const leftTime = left.acceptedAt ?? left.declinedAt ?? "";
      const rightTime = right.acceptedAt ?? right.declinedAt ?? "";
      return rightTime.localeCompare(leftTime);
    })[0];

  return Boolean(latestDecision?.acceptedAt) && !latestDecision?.declinedAt;
}

export function recordSwipe(state: BackendState, request: RecordSwipeRequest): RecordSwipeResult {
  if (state.flags.electionFreeze || !state.flags.swipeEnabled) {
    throw new BackendRuleError("FreezeModeActiveError");
  }

  if (!hasAcceptedConsent(state, request.visitorKeyHash)) {
    throw new BackendRuleError("ConsentRequiredError");
  }

  const politician = state.politicians.find((candidate) => {
    return candidate.id === request.politicianId && candidate.status === "active";
  });

  if (!politician) {
    throw new BackendRuleError("PoliticianNotFoundError");
  }

  const occurredOn = toIsoDate(request.now);
  const duplicate = state.swipeEvents.find((event) => {
    return (
      event.visitorKeyHash === request.visitorKeyHash &&
      (event.idempotencyKey === request.idempotencyKey ||
        event.cardImpressionId === request.cardImpressionId)
    );
  });

  if (duplicate) {
    if (
      duplicate.politicianId !== request.politicianId ||
      duplicate.action !== request.action ||
      duplicate.cardImpressionId !== request.cardImpressionId
    ) {
      throw new BackendRuleError("DuplicateSwipeError");
    }

    const duplicateUsedToday = countDailySwipes(state, request.visitorKeyHash, occurredOn);
    return {
      usedToday: duplicateUsedToday,
      remaining: Math.max(state.dailyLimit - duplicateUsedToday, 0),
      duplicate: true
    };
  }

  const usedToday = countDailySwipes(state, request.visitorKeyHash, occurredOn);
  if (usedToday >= state.dailyLimit) {
    throw new BackendRuleError("DailyLimitExceededError");
  }

  const impression = state.cardImpressions.find((candidate) => {
    return (
      candidate.id === request.cardImpressionId &&
      candidate.visitorKeyHash === request.visitorKeyHash &&
      candidate.politicianId === request.politicianId &&
      candidate.occurredOn === occurredOn &&
      !candidate.consumedAt
    );
  });

  if (!impression) {
    throw new BackendRuleError("CardImpressionRequiredError");
  }

  impression.consumedAt = request.now.toISOString();

  const event: SwipeEvent = {
    visitorKeyHash: request.visitorKeyHash,
    politicianId: request.politicianId,
    action: request.action,
    cardImpressionId: request.cardImpressionId,
    idempotencyKey: request.idempotencyKey,
    occurredOn,
    createdAt: request.now.toISOString()
  };

  state.swipeEvents.push(event);
  incrementAggregate(state, occurredOn, request.politicianId, request.action);

  const nextUsedToday = usedToday + 1;
  return {
    usedToday: nextUsedToday,
    remaining: Math.max(state.dailyLimit - nextUsedToday, 0),
    duplicate: false
  };
}

function countDailySwipes(state: BackendState, visitorKeyHash: string, date: string): number {
  return state.swipeEvents.filter((event) => {
    return event.visitorKeyHash === visitorKeyHash && event.occurredOn === date;
  }).length;
}

function incrementAggregate(
  state: BackendState,
  date: string,
  politicianId: string,
  action: "research" | "skip"
) {
  let aggregate = state.aggregates.find((candidate) => {
    return candidate.date === date && candidate.politicianId === politicianId;
  });

  if (!aggregate) {
    aggregate = {
      date,
      politicianId,
      eligibleImpressions: 0,
      researchActions: 0,
      skipActions: 0
    } satisfies DailyAggregate;
    state.aggregates.push(aggregate);
  }

  aggregate.eligibleImpressions += 1;

  if (action === "research") {
    aggregate.researchActions += 1;
  } else {
    aggregate.skipActions += 1;
  }
}
