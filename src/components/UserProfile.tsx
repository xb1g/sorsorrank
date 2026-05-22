import { useEffect, useState } from "preact/hooks";
import type { ConsentState, DeckState, SwipeHistoryItem } from "../types";
import { fetchSwipeHistory } from "../services/api";
import { SearchIcon } from "./icons";

interface UserProfileProps {
  consentState: ConsentState;
  deckState: DeckState | null;
  onViewRankings: () => void;
  onViewDeck: () => void;
}

function getInitials(displayName: string) {
  return displayName.split(" ").slice(0, 2).map((s) => s[0]).join("");
}

export function UserProfile({ consentState, deckState, onViewRankings, onViewDeck }: UserProfileProps) {
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
    <div class="content-column readable-column">
      <section class="panel profile-panel">
        <div class="profile-header">
          <div class="profile-avatar">
            <img src="/logo.svg" alt="" class="profile-avatar-img" />
          </div>
          <div class="profile-meta">
            <h2>บัญชีของคุณ</h2>
            <p class="profile-mode">
              {consentState.authMode === "supabase-account"
                ? consentState.authEmail ?? "บัญชีผู้ใช้"
                : consentState.authMode === "supabase-anonymous"
                ? "ผู้ใช้แบบไม่ระบุตัวตน"
                : consentState.authMode === "visitor-token"
                ? "ผู้ใช้ชั่วคราว"
                : "โหมดทดลอง"}
            </p>
          </div>
        </div>

        <div class="profile-stats-row">
          <div class="stat-card">
            <span class="stat-label">ทำแล้ววันนี้</span>
            <strong class="stat-value">{totalDone}/{dailyLimit}</strong>
            <span class="stat-unit">ใบ</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">สตรีค</span>
            <strong class="stat-value">{streakCount}</strong>
            <span class="stat-unit">วัน</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">เหลือวันนี้</span>
            <strong class="stat-value">{Math.max(dailyLimit - totalDone, 0)}</strong>
            <span class="stat-unit">ใบ</span>
          </div>
        </div>

        <div class="profile-progress">
          <div class="profile-progress-header">
            <span>ความคืบหน้าเด็คประจำวัน</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div class="progress-track profile-progress-track">
            <div class="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div class="profile-actions">
          {canSwipe ? (
            <button class="primary-cta wide" type="button" onClick={onViewDeck}>
              <SearchIcon />
              ทำ 10 ใบต่อ
            </button>
          ) : deckState?.doneToday ? (
            <div class="profile-done-badge">
              <strong>ครบ 10 ใบแล้ววันนี้</strong>
              <span>กลับมาใหม่พรุ่งนี้</span>
            </div>
          ) : (
            <div class="profile-inactive-badge">
              <span>ยังไม่เริ่มวันนี้</span>
            </div>
          )}
          <button class="ghost-cta wide" type="button" onClick={onViewRankings}>
            ดูอันดับความสนใจค้นคว้า
          </button>
        </div>
      </section>

      {/* Swipe History */}
      <section class="panel profile-panel">
        <div class="history-header">
          <div>
            <h3>ประวัติวันนี้</h3>
            <p class="history-subtitle">
              {historyLoading
                ? "กำลังโหลด..."
                : `ค้นคว้า ${researchCount} ครั้ง · ข้าม ${skipCount} ครั้ง · รวม ${history?.length ?? 0} ใบ`}
            </p>
          </div>
        </div>

        {historyLoading ? (
          <div class="history-loading">
            <div class="history-loading-bar" />
          </div>
        ) : history && history.length > 0 ? (
          <div class="history-list">
            {history.map((item) => (
              <div key={item.id} class={`history-row history-${item.action}`}>
                <div class="history-figure">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" class="history-thumb" loading="lazy" />
                  ) : (
                    <div class="history-thumb-placeholder">{getInitials(item.displayName)}</div>
                  )}
                </div>
                <div class="history-info">
                  <strong class="history-name">{item.displayName}</strong>
                  <span class="history-role">
                    {item.roleLabel}
                    {item.partyLabel ? ` · ${item.partyLabel}` : ""}
                  </span>
                </div>
                <div class="history-badge-wrapper">
                  <span class={`history-badge history-badge-${item.action}`}>
                    {item.action === "research" ? "ค้นคว้า" : "ข้าม"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div class="history-empty">
            <span>ยังไม่มีประวัติวันนี้</span>
          </div>
        )}
      </section>
    </div>
  );
}
