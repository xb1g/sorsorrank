import { useEffect, useState } from "preact/hooks";
import type { ConsentState, DeckState, SwipeHistoryItem } from "../types";
import { fetchSwipeHistory } from "../services/api";
import { SearchIcon } from "./icons";
import { AccountPanel } from "./AccountPanel";

interface UserProfileProps {
  consentState: ConsentState;
  deckState: DeckState | null;
  onViewRankings: () => void;
  onViewDeck: () => void;
  onAuthChange: () => Promise<void> | void;
}

export function UserProfile({ consentState, deckState, onViewRankings, onViewDeck, onAuthChange }: UserProfileProps) {
  const totalDone = deckState?.usedToday ?? 0;
  const dailyLimit = deckState?.dailyLimit ?? 10;
  const streakCount = deckState?.streakCount ?? 0;
  const progressPercent = Math.min((totalDone / dailyLimit) * 100, 100);
  const canSwipe = consentState.hasConsented && !deckState?.doneToday && !deckState?.freezeMode;

  const [history, setHistory] = useState<SwipeHistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    fetchSwipeHistory()
      .then((data) => {
        if (!cancelled) setHistory(data.items);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const researchCount = history?.filter((i) => i.action === "research").length ?? 0;
  const skipCount = history?.filter((i) => i.action === "skip").length ?? 0;

  return (
    <div class="content-column profile-brutalist">
      <div class="profile-hero">
        <div class="profile-title-row">
          <h2 class="profile-hero-title">บัญชีของคุณ</h2>
          <span class="profile-auth-status" data-active={consentState.authMode === "supabase-account"}>
            {consentState.authMode === "supabase-account"
              ? consentState.authEmail ?? "บัญชีผู้ใช้"
              : consentState.authMode === "supabase-anonymous"
              ? "ผู้ใช้แบบไม่ระบุตัวตน"
              : consentState.authMode === "visitor-token"
              ? "ผู้ใช้ชั่วคราว"
              : "โหมดทดลอง"}
          </span>
        </div>
        
        <div class="profile-raw-stats">
          <div class="raw-stat">
            <span class="raw-label">สตรีคปัจจุบัน</span>
            <strong class="raw-value">{streakCount} <span class="raw-unit">วัน</span></strong>
          </div>
          <div class="raw-stat">
            <span class="raw-label">ทำแล้ววันนี้</span>
            <strong class="raw-value">{totalDone}<span class="raw-slash">/</span><span class="raw-limit">{dailyLimit}</span></strong>
          </div>
        </div>

        <div class="profile-progress-edge">
          <div class="progress-fill" style={{ width: `${progressPercent}%` }} data-complete={progressPercent === 100} />
        </div>

        <div class="profile-hero-actions">
          {canSwipe ? (
            <button class="primary-cta sharp-cta wide" type="button" onClick={onViewDeck}>
              <SearchIcon />
              ทำ 10 ใบต่อ
            </button>
          ) : deckState?.doneToday ? (
            <div class="edge-message success-edge">
              <strong>ครบ 10 ใบแล้ววันนี้</strong>
              <span> กลับมาใหม่พรุ่งนี้</span>
            </div>
          ) : (
            <div class="edge-message">
              <span>ยังไม่เริ่มวันนี้</span>
            </div>
          )}
          <button class="ghost-cta sharp-cta wide" style={{ marginTop: "12px" }} type="button" onClick={onViewRankings}>
            ดูอันดับความสนใจค้นคว้า
          </button>
        </div>
      </div>

      <div class="profile-section-divider"></div>

      <div class="profile-auth-integration">
        <AccountPanel consentState={consentState} onAuthChange={onAuthChange} />
      </div>

      <div class="profile-section-divider"></div>

      <div class="profile-history-section">
        <div class="history-header-sharp">
          <h3 class="history-title">ประวัติวันนี้</h3>
          <span class="history-meta">
            {historyLoading
              ? "กำลังโหลด..."
              : `ค้นคว้า ${researchCount} · ข้าม ${skipCount} · รวม ${history?.length ?? 0}`}
          </span>
        </div>

        {historyLoading ? (
          <div class="history-loading-edge" />
        ) : history && history.length > 0 ? (
          <div class="history-table">
            {history.map((item) => (
              <div key={item.id} class="history-row-sharp">
                <div class="history-figure-sharp">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" class="history-thumb-sharp" loading="lazy" />
                  ) : (
                    <div class="history-placeholder-sharp">
                      {item.displayName.split(" ").slice(0, 2).map((s) => s[0]).join("")}
                    </div>
                  )}
                </div>
                <div class="history-info-sharp">
                  <strong class="history-name-sharp">{item.displayName}</strong>
                  <span class="history-role-sharp">
                    {item.roleLabel}
                    {item.partyLabel ? ` · ${item.partyLabel}` : ""}
                  </span>
                </div>
                <div class="history-action-sharp">
                  <span class={`history-badge-sharp is-${item.action}`}>
                    {item.action === "research" ? "ค้นคว้า" : "ข้าม"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div class="history-empty-sharp">
            <span>ยังไม่มีประวัติวันนี้</span>
          </div>
        )}
      </div>
    </div>
  );
}
