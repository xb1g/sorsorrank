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

function TrendGraph({
  approveTrend,
  disapproveTrend
}: {
  approveTrend: number[];
  disapproveTrend: number[];
}) {
  const width = 248;
  const height = 72;
  const approvePath = buildTrendPath(approveTrend, width, height);
  const disapprovePath = buildTrendPath(disapproveTrend, width, height);
  const approveNow = approveTrend[approveTrend.length - 1];
  const disapproveNow = disapproveTrend[disapproveTrend.length - 1];

  return (
    <div class="trend-graph-card">
      <div class="trend-legend">
        <span class="trend-legend-item trend-legend-approve">
          <i />
          Approve {Math.round(approveNow)}%
        </span>
        <span class="trend-legend-item trend-legend-disapprove">
          <i />
          Disapprove {Math.round(disapproveNow)}%
        </span>
      </div>

      <svg class="trend-graph" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path class="trend-grid-line" d={`M0,18 L${width},18`} />
        <path class="trend-grid-line" d={`M0,36 L${width},36`} />
        <path class="trend-grid-line" d={`M0,54 L${width},54`} />
        <path class="trend-line-approve" d={approvePath} />
        <path class="trend-line-disapprove" d={disapprovePath} />
      </svg>

      <div class="trend-axis">
        <span>May 16</span>
        <span>May 18</span>
        <span>May 20</span>
      </div>
    </div>
  );
}

export function ResearchInterestRank({
  rankingSummary
}: ResearchInterestRankProps) {
  return (
    <section class="panel rank-panel">
      <div class="panel-header">
        <div>
          <p class="panel-label">Leaderboard</p>
          <h2>Top 50 Thai politicians by current user results</h2>
        </div>
        <div class="panel-meta">
          <span>{rankingSummary.sampleSize.toLocaleString()} sample actions</span>
          <span>Threshold {rankingSummary.threshold}</span>
        </div>
      </div>

      <p class="rank-intro">
        Each row shows the current approve and disapprove split plus a short trend view so
        people can inspect how sentiment is moving over time.
      </p>

      <div class="rank-notes">
        <span>Date range: May 16 to May 20, 2026</span>
        <span>Approve and disapprove lines update after new daily swipes</span>
        <span>Search stays available for extra context</span>
      </div>

      <div class="rank-list" role="list">
        {rankingSummary.politicians.map((politician, index) => (
          <article key={politician.id} class="rank-row rank-row-graph" role="listitem">
            <div class="rank-order">
              <span>{index + 1}</span>
            </div>

            <div class="rank-main">
              <div class="figure-cell">
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
                </div>
              </div>

              <TrendGraph
                approveTrend={politician.approveTrend}
                disapproveTrend={politician.disapproveTrend}
              />
            </div>

            <div class="rank-side">
              <strong>{formatPercent(politician.researchInterestScore)}</strong>
              <span>{politician.researchActions.toLocaleString()} approve-weighted actions</span>
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
