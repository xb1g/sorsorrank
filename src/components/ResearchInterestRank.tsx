import type { RankingSummary } from "../types";
import { SearchIcon } from "./icons";

interface ResearchInterestRankProps {
  rankingSummary: RankingSummary;
}

function formatPercent(score: number) {
  return `${Math.round(score * 100)}%`;
}

function buildTrendPath(points: number[], width: number, height: number) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(max - min, 1);

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function SideTrend({
  approveTrend,
  disapproveTrend
}: {
  approveTrend: number[];
  disapproveTrend: number[];
}) {
  const width = 168;
  const height = 56;

  return (
    <svg class="side-trend" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path class="side-trend-line side-trend-line-approve" d={buildTrendPath(approveTrend, width, height)} />
      <path
        class="side-trend-line side-trend-line-disapprove"
        d={buildTrendPath(disapproveTrend, width, height)}
      />
    </svg>
  );
}

export function ResearchInterestRank({
  rankingSummary
}: ResearchInterestRankProps) {
  return (
    <section class="panel rank-panel">
      <div class="panel-header">
        <div>
          <p class="panel-label">Politician Leaderboard</p>
          <h2>Who people are pushing up and dragging down right now</h2>
        </div>
        <div class="panel-meta">
          <span>{rankingSummary.sampleSize.toLocaleString()} total moves</span>
          <span>50 politicians live</span>
        </div>
      </div>

      <p class="rank-intro">
        Fast read on the board: current score on the left, trend spark on the right, Google
        one tap away if you want the receipts.
      </p>

      <div class="rank-filter-row">
        <button class="filter-pill is-active" type="button">
          All
        </button>
        <button class="filter-pill" type="button">
          Trending
        </button>
        <button class="filter-pill" type="button">
          Biggest swings
        </button>
        <button class="filter-pill" type="button">
          Bangkok
        </button>
      </div>

      <div class="rank-list rank-list-side" role="list">
        {rankingSummary.politicians.map((politician, index) => (
          <article key={politician.id} class="rank-row rank-row-side" role="listitem">
            <div class="rank-order rank-order-plain">
              <span>{index + 1}</span>
            </div>

            <div class="rank-identity">
              <div class="avatar-badge" aria-hidden="true">
                {politician.displayName
                  .split(" ")
                  .slice(0, 2)
                  .map((segment) => segment[0])
                  .join("")}
              </div>
              <div>
                <strong>{politician.displayName}</strong>
                <span>
                  {politician.roleLabel}
                  {politician.partyLabel ? ` · ${politician.partyLabel}` : ""}
                </span>
                <div class="rank-score-line">
                  <strong>{formatPercent(politician.researchInterestScore)}</strong>
                  <span class="score-subtle">
                    {politician.researchActions.toLocaleString()} approves
                  </span>
                </div>
              </div>
            </div>

            <div class="rank-side-graph">
              <div class="mini-legend">
                <span class="mini-legend-item mini-legend-approve">Approve</span>
                <span class="mini-legend-item mini-legend-disapprove">Disapprove</span>
              </div>
              <SideTrend
                approveTrend={politician.approveTrend}
                disapproveTrend={politician.disapproveTrend}
              />
            </div>

            <div class="rank-actions">
              <a
                class="table-search-link"
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  politician.displayName
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <SearchIcon />
                Search
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
