import type { RankingSummary } from "../types";
import { SearchIcon } from "./icons";

interface ResearchInterestRankProps {
  rankingSummary: RankingSummary;
}

function formatPercent(score: number) {
  return `${Math.round(score * 100)}%`;
}

function getInitials(displayName: string) {
  return displayName
    .split(" ")
    .slice(0, 2)
    .map((segment) => segment[0])
    .join("");
}

export function ResearchInterestRank({
  rankingSummary
}: ResearchInterestRankProps) {
  if (rankingSummary.hidden) {
    return (
      <section class="panel rank-panel">
        <p class="panel-label">Research Interest Rank</p>
        <h2>Rank is paused</h2>
        <p class="rank-intro">
          The Research Interest Rank is paused during a sensitive review period.
        </p>
      </section>
    );
  }

  if (rankingSummary.politicians.length === 0) {
    return (
      <section class="panel rank-panel">
        <p class="panel-label">Research Interest Rank</p>
        <h2>No public rank yet</h2>
        <p class="rank-intro">
          Rows stay hidden until enough people do the 10.
        </p>
      </section>
    );
  }

  return (
    <section class="panel rank-panel">
      <div class="panel-header">
        <div>
          <p class="panel-label">Research Interest Rank</p>
          <h2>Aggregate curiosity today</h2>
        </div>
        <div class="panel-meta">
          <span>{rankingSummary.sampleSize.toLocaleString()} eligible impressions</span>
          <span>Threshold {rankingSummary.threshold.toLocaleString()}</span>
        </div>
      </div>

      <p class="rank-intro">
        Aggregate actions only. Research fills the bar; Skip still counts toward
        the sample. No public row shows individual choices.
      </p>

      <div class="rank-list rank-list-side" role="list">
        {rankingSummary.politicians.map((politician, index) => (
          <article key={politician.id} class="rank-row rank-row-side" role="listitem">
            <div class="rank-order rank-order-plain">
              <span>{index + 1}</span>
            </div>

            <div class="rank-identity">
              {politician.imageUrl ? (
                <img class="avatar-image" src={politician.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
              ) : (
                <div class="avatar-badge" aria-hidden="true">{getInitials(politician.displayName)}</div>
              )}
              <div>
                <strong>{politician.displayName}</strong>
                <span>
                  {politician.roleLabel}
                  {politician.partyLabel ? ` - ${politician.partyLabel}` : ""}
                </span>
                <div class="rank-score-line">
                  <strong>{formatPercent(politician.researchInterestScore)}</strong>
                  <span class="score-subtle">
                    {politician.researchActions.toLocaleString()} Research actions
                  </span>
                </div>
              </div>
            </div>

            <div class="rank-side-graph">
              <div class="score-bar" aria-hidden="true">
                <span style={{ width: `${Math.round(politician.researchInterestScore * 100)}%` }} />
              </div>
              <span class="score-subtle">{politician.eligibleImpressions.toLocaleString()} impressions</span>
            </div>

            <div class="rank-actions">
              <a
                class="table-search-link"
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  politician.searchQuery ?? politician.displayName
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <SearchIcon />
                Look up
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
