import { BackendRuleError } from "./errors";
import type { BackendState, DailyDeck, DailyDeckCard } from "./types";

interface PublishManualDailyDeckRequest {
  deckDate: string;
  politicianIds: string[];
  adminId: string;
  now: Date;
}

interface AutoPublishDailyDeckRequest {
  deckDate: string;
  adminId: string;
  now: Date;
}

interface PublishedDailyDeckResult {
  deckDate: string;
  politicianIds: string[];
}

export function publishManualDailyDeck(
  state: BackendState,
  request: PublishManualDailyDeckRequest
): PublishedDailyDeckResult {
  const selectedPoliticianIds = validateDeckPoliticianIds(state, request.politicianIds);
  const politicianIds = completeDeckPoliticianIds(state, request.deckDate, selectedPoliticianIds, true);
  savePublishedDeck(state, {
    deckDate: request.deckDate,
    politicianIds,
    selectionMode: "manual",
    adminId: request.adminId,
    now: request.now
  });

  return {
    deckDate: request.deckDate,
    politicianIds
  };
}

export function autoPublishDailyDeck(
  state: BackendState,
  request: AutoPublishDailyDeckRequest
): PublishedDailyDeckResult {
  const existing = getDailyDeckPoliticianIds(state, request.deckDate);
  if (existing.length >= state.dailyLimit) {
    return {
      deckDate: request.deckDate,
      politicianIds: existing
    };
  }

  const politicianIds = completeDeckPoliticianIds(state, request.deckDate, existing, false);

  savePublishedDeck(state, {
    deckDate: request.deckDate,
    politicianIds,
    selectionMode: "auto_pick",
    adminId: request.adminId,
    now: request.now
  });

  return {
    deckDate: request.deckDate,
    politicianIds
  };
}

export function getDailyDeckPoliticianIds(state: BackendState, deckDate: string): string[] {
  if (!state.dailyDecks.some((deck) => deck.deckDate === deckDate && deck.status === "published")) {
    return [];
  }

  return state.dailyDeckCards
    .filter((card) => card.deckDate === deckDate)
    .sort((left, right) => left.position - right.position)
    .map((card) => card.politicianId);
}

function validateDeckPoliticianIds(state: BackendState, politicianIds: string[]) {
  const uniqueIds = new Set(politicianIds);
  if (politicianIds.length === 0 || politicianIds.length > state.dailyLimit || uniqueIds.size !== politicianIds.length) {
    throw new BackendRuleError("InvalidDailyDeckError");
  }

  const activeIds = new Set(
    state.politicians
      .filter((politician) => politician.status === "active")
      .map((politician) => politician.id)
  );

  for (const politicianId of politicianIds) {
    if (!activeIds.has(politicianId)) {
      throw new BackendRuleError("PoliticianNotFoundError");
    }
  }

  return politicianIds;
}

function completeDeckPoliticianIds(
  state: BackendState,
  deckDate: string,
  selectedPoliticianIds: string[],
  preserveIssuedPositions: boolean
) {
  const politicianIds: string[] = Array.from({ length: state.dailyLimit }, () => "");
  const selected = new Set<string>();

  if (preserveIssuedPositions) {
    const issuedPoliticianIds = new Set(
      state.cardImpressions
        .filter((impression) => impression.occurredOn === deckDate)
        .map((impression) => impression.politicianId)
    );
    const issuedCards = state.dailyDeckCards.filter((card) => {
      return card.deckDate === deckDate && issuedPoliticianIds.has(card.politicianId);
    });

    for (const card of issuedCards) {
      politicianIds[card.position - 1] = card.politicianId;
      selected.add(card.politicianId);
    }
  }

  for (const politicianId of selectedPoliticianIds) {
    if (selected.has(politicianId)) {
      continue;
    }

    const openIndex = politicianIds.findIndex((candidate) => candidate === "");
    if (openIndex < 0) {
      break;
    }

    politicianIds[openIndex] = politicianId;
    selected.add(politicianId);
  }

  const fillPoliticianIds = state.politicians
    .filter((politician) => politician.status === "active" && !selected.has(politician.id))
    .sort((left, right) => {
      const leftScore = dailySelectionScore(deckDate, left.id);
      const rightScore = dailySelectionScore(deckDate, right.id);
      if (leftScore !== rightScore) {
        return leftScore.localeCompare(rightScore);
      }

      return left.id.localeCompare(right.id);
    })
    .slice(0, politicianIds.filter((politicianId) => politicianId === "").length)
    .map((politician) => politician.id);

  for (const fillPoliticianId of fillPoliticianIds) {
    const openIndex = politicianIds.findIndex((candidate) => candidate === "");
    if (openIndex < 0) {
      break;
    }
    politicianIds[openIndex] = fillPoliticianId;
  }

  return politicianIds.filter(Boolean);
}

function savePublishedDeck(
  state: BackendState,
  request: {
    deckDate: string;
    politicianIds: string[];
    selectionMode: DailyDeck["selectionMode"];
    adminId: string;
    now: Date;
  }
) {
  const nowIso = request.now.toISOString();
  const existingDeck = state.dailyDecks.find((deck) => deck.deckDate === request.deckDate);
  if (existingDeck) {
    existingDeck.selectionMode = request.selectionMode;
    existingDeck.dailyLimit = state.dailyLimit;
    existingDeck.generatedAt = nowIso;
    existingDeck.publishedAt = nowIso;
    existingDeck.updatedBy = request.adminId;
  } else {
    state.dailyDecks.push({
      deckDate: request.deckDate,
      status: "published",
      selectionMode: request.selectionMode,
      dailyLimit: state.dailyLimit,
      generatedAt: nowIso,
      publishedAt: nowIso,
      createdBy: request.adminId,
      updatedBy: request.adminId
    });
  }

  state.dailyDeckCards = state.dailyDeckCards.filter((card) => card.deckDate !== request.deckDate);
  state.dailyDeckCards.push(
    ...request.politicianIds.map((politicianId, index) => {
      return {
        deckDate: request.deckDate,
        position: index + 1,
        politicianId
      } satisfies DailyDeckCard;
    })
  );
}

function dailySelectionScore(deckDate: string, politicianId: string) {
  let hash = 0;
  const input = `${deckDate}:${politicianId}`;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}
