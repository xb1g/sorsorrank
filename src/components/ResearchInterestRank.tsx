import type { RankingSummary } from "../types";
import { GoogleIcon, SearchIcon } from "./icons";

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
        <p class="panel-label">อันดับความสนใจค้นคว้า</p>
        <h2>หยุดการจัดอันดับชั่วคราว</h2>
        <p class="rank-intro">
          อันดับความสนใจค้นคว้าหยุดพักชั่วคราวในช่วงที่มีความอ่อนไหว
        </p>
      </section>
    );
  }

  if (rankingSummary.politicians.length === 0) {
    return (
      <section class="panel rank-panel">
        <p class="panel-label">อันดับความสนใจค้นคว้า</p>
        <h2>ยังไม่มีอันดับสาธารณะ</h2>
        <p class="rank-intro">
          ข้อมูลจะยังถูกซ่อนไว้จนกว่าจะมีคนทำครบ 10 ใบมากพอ
        </p>
      </section>
    );
  }

  return (
    <section class="panel rank-panel">
      <div class="panel-header">
        <div>
          <p class="panel-label">อันดับความสนใจค้นคว้า</p>
          <h2>ความอยากรู้โดยรวมวันนี้</h2>
        </div>
        <div class="panel-meta">
          <span>การแสดงผลที่เข้าข่าย {rankingSummary.sampleSize.toLocaleString()} ครั้ง</span>
          <span>เกณฑ์ขั้นต่ำ {rankingSummary.threshold.toLocaleString()}</span>
        </div>
      </div>

      <p class="rank-intro">
        คำนวณจากข้อมูลรวมเท่านั้น การค้นคว้าจะเพิ่มหลอดคะแนน การข้ามยังคงนับเป็นกลุ่มตัวอย่าง จะไม่มีการแสดงตัวเลือกส่วนบุคคล
      </p>

      <div class="rank-list rank-list-side" role="list">
        {rankingSummary.politicians.map((politician, index) => (
          <article key={politician.id} class="rank-row rank-row-side" role="listitem">
            <div class="rank-order">
              <span>#{index + 1}</span>
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
                    ถูกค้นคว้า {politician.researchActions.toLocaleString()} ครั้ง
                  </span>
                </div>
              </div>
            </div>

            <div class="rank-side-graph">
              <div class="score-bar" aria-hidden="true">
                <span style={{ width: `${Math.round(politician.researchInterestScore * 100)}%` }} />
              </div>
              <span class="score-subtle">การแสดงผล {politician.eligibleImpressions.toLocaleString()} ครั้ง</span>
            </div>

            <div class="rank-actions">
              <a
                class="search-bar-link"
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  politician.searchQuery ?? politician.displayName
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <GoogleIcon />
                <span class="search-bar-query">{politician.searchQuery ?? politician.displayName}</span>
                <div class="search-bar-icon-right">
                  <SearchIcon />
                </div>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
