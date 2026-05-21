import { BackendRuleError } from "./errors";
import type { BackendState, DailyAggregate, RankingRow } from "./types";

export function calculateResearchInterestScore(aggregate: DailyAggregate): number {
  if (aggregate.eligibleImpressions === 0) {
    return 0;
  }

  return aggregate.researchActions / aggregate.eligibleImpressions;
}

export function getRankingRows(state: BackendState, date: string): RankingRow[] {
  if (state.flags.electionFreeze || !state.flags.rankingsPublic) {
    throw new BackendRuleError("FreezeModeActiveError");
  }

  const activeById = new Map(
    state.politicians
      .filter((politician) => politician.status === "active")
      .map((politician) => [politician.id, politician])
  );

  const rows: RankingRow[] = [];

  for (const aggregate of state.aggregates) {
    if (aggregate.date !== date) {
      continue;
    }

    const politician = activeById.get(aggregate.politicianId);
    if (!politician) {
      continue;
    }

    rows.push({
        politicianId: politician.id,
        displayName: politician.displayName,
        roleLabel: politician.roleLabel,
        partyLabel: politician.partyLabel,
        eligibleImpressions: aggregate.eligibleImpressions,
        researchActions: aggregate.researchActions,
        researchInterestScore: calculateResearchInterestScore(aggregate),
        hiddenBelowThreshold: aggregate.eligibleImpressions < state.minRankingSampleSize
    });
  }

  return rows
    .filter((row) => !row.hiddenBelowThreshold)
    .sort((left, right) => {
      if (right.researchInterestScore !== left.researchInterestScore) {
        return right.researchInterestScore - left.researchInterestScore;
      }

      return right.eligibleImpressions - left.eligibleImpressions;
    });
}
