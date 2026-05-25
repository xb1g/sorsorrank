import type { BackendState, PoliticianVoteRecord } from "./types";

export function getDrawerVoteRecords(
  state: BackendState,
  politicianId: string,
  limit = 3
): PoliticianVoteRecord[] {
  return state.voteRecords
    .filter((record) => record.politicianId === politicianId)
    .sort((left, right) => {
      return (right.startDate ?? "").localeCompare(left.startDate ?? "");
    })
    .slice(0, limit);
}
