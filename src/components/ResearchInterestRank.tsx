import type { RankingSummary } from "../types";
import { SearchIcon } from "./icons";

interface ResearchInterestRankProps {
  rankingSummary: RankingSummary;
}

function formatPercent(score: number) {
  return `${Math.round(score * 100)}%`;
}

export function ResearchInterestRank({ rankingSummary }: ResearchInterestRankProps) {
  if (rankingSummary.hidden) {
    return (
      <div class="content-column rank-brutalist">
        <div class="rank-hero">
          <div class="profile-title-row">
            <h2 class="profile-hero-title">หยุดการจัดอันดับ</h2>
          </div>
          <p class="account-desc-sharp" style={{ marginTop: "8px" }}>
            ดัชนีการค้นพบใหม่หยุดพักชั่วคราวในช่วงที่มีความอ่อนไหว
          </p>
        </div>
      </div>
    );
  }

  if (rankingSummary.politicians.length === 0) {
    return (
      <div class="content-column rank-brutalist">
        <div class="rank-hero">
          <div class="profile-title-row">
            <h2 class="profile-hero-title">ยังไม่มีอันดับสาธารณะ</h2>
          </div>
          <p class="account-desc-sharp" style={{ marginTop: "8px" }}>
            ข้อมูลจะยังถูกซ่อนไว้จนกว่าจะมีคนทำครบ 10 ใบมากพอ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div class="content-column rank-brutalist">
      <div class="rank-hero">
        <div class="profile-title-row">
          <h2 class="profile-hero-title">ดัชนีการค้นพบใหม่</h2>
          <span class="profile-auth-status">
            ล่าสุด: {new Date(rankingSummary.generatedAt).toLocaleDateString("th-TH")}
          </span>
        </div>
        
        <p class="account-desc-sharp" style={{ marginTop: "8px" }}>
          คำนวณจากข้อมูลรวมเท่านั้น การได้รู้เรื่องใหม่จะเพิ่มหลอดคะแนน การข้ามยังคงนับเป็นกลุ่มตัวอย่าง 
          จะไม่มีการแสดงตัวเลือกส่วนบุคคล
        </p>

        <div class="rank-meta" style={{ marginTop: "24px" }}>
          <div class="raw-stat">
            <span class="raw-label">การแสดงผลรวม</span>
            <strong class="raw-value" style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)" }}>
              {rankingSummary.sampleSize.toLocaleString()}
            </strong>
          </div>
          <div class="raw-stat">
            <span class="raw-label">เกณฑ์ขั้นต่ำต่อคน</span>
            <strong class="raw-value" style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)" }}>
              {rankingSummary.threshold.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      <div class="profile-section-divider"></div>

      <div class="rank-table" role="list">
        {rankingSummary.politicians.map((politician, index) => (
          <article key={politician.id} class="rank-row-sharp" role="listitem">
            <div class="rank-order-sharp">
              <span class="rank-number">{index + 1}</span>
            </div>

            <div class="rank-content-sharp">
              <div class="rank-identity-sharp">
                <strong class="history-name-sharp">{politician.displayName}</strong>
                <span class="history-role-sharp">
                  {politician.roleLabel}
                  {politician.partyLabel ? ` · ${politician.partyLabel}` : ""}
                </span>
              </div>

              <div class="rank-stats-sharp">
                <div class="rank-score-block">
                  <strong class="rank-percent">{formatPercent(politician.researchInterestScore)}</strong>
                  <span class="rank-details">
                    รู้เรื่องใหม่ {politician.researchActions.toLocaleString()} / {politician.eligibleImpressions.toLocaleString()}
                  </span>
                </div>
                
                <div class="rank-graph-sharp" aria-hidden="true">
                  <div class="rank-progress-edge">
                    <div 
                      class="progress-fill" 
                      style={{ width: `${Math.round(politician.researchInterestScore * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="rank-actions-sharp">
              <a
                class="ghost-cta sharp-cta icon-only-cta"
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  politician.searchQuery ?? politician.displayName
                )}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Search for ${politician.displayName} on Google`}
              >
                <SearchIcon />
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
