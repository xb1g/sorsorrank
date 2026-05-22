import { useState } from "preact/hooks";
import type { ConsentState } from "../types";
import { AccountPanel } from "./AccountPanel";
import { MatchCardHologram } from "./MatchCardHologram";

interface DailyDoneProps {
  consentState: ConsentState;
  streakCount: number;
  onSeeRankings: () => void;
  onCreateShare: () => Promise<{ copy: string }>;
  onAuthChange: () => Promise<void> | void;
}

const todayLabel = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  day: "numeric",
  year: "numeric"
}).format(new Date());

export function DailyDone({
  consentState,
  streakCount,
  onSeeRankings,
  onCreateShare: _onCreateShare,
  onAuthChange
}: DailyDoneProps) {
  const [showHologram, setShowHologram] = useState(false);

  return (
    <>
      {showHologram && (
        <MatchCardHologram 
          streakCount={streakCount} 
          todayLabel={todayLabel} 
          onClose={() => setShowHologram(false)} 
        />
      )}
    <div class="content-column profile-brutalist">
      <div class="profile-hero">
        <div class="profile-title-row">
          <h2 class="profile-hero-title">สำเร็จ</h2>
          <span class="profile-auth-status">
            10 / 10
          </span>
        </div>
        
        <p class="account-desc-sharp" style={{ marginTop: "8px" }}>
          คุณทำ Daily Deck ของวันนี้ครบแล้ว<br />
          ตัวเลือกของคุณเป็นส่วนตัวและจะถูกนับรวมในความอยากรู้โดยรวม
          จะไม่มีใครเห็นว่าคุณ Crush หรือ Pass ใคร
        </p>

        <div class="profile-raw-stats" style={{ marginTop: "16px" }}>
          <div class="raw-stat">
            <span class="raw-label">วันที่</span>
            <strong class="raw-value" style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)" }}>{todayLabel}</strong>
          </div>
          <div class="raw-stat">
            <span class="raw-label">สตรีคปัจจุบัน</span>
            <strong class="raw-value">{streakCount} <span class="raw-unit">วัน</span></strong>
          </div>
        </div>

        <div class="profile-progress-edge">
          <div class="progress-fill" style={{ width: "100%" }} data-complete={true} />
        </div>

        <div class="profile-hero-actions">
          <button class="ghost-cta sharp-cta wide" type="button" onClick={onSeeRankings}>
            ดู Crush Rank
          </button>
        </div>
      </div>

      <div class="profile-section-divider"></div>

      <div class="profile-hero">
        <div class="account-header-sharp">
          <span class="panel-label-sharp">แชร์การ์ด</span>
          <strong class="account-title-sharp">ฉันทำ Daily Deck ของวันนี้ครบแล้ว ถึงตาคุณแล้ว</strong>
          <p class="account-desc-sharp">ส่ง Match Card เข้าแชทกลุ่มโดยไม่ต้องเปิดเผยตัวเลือกของคุณ</p>
        </div>
        
        <div class="profile-hero-actions">
          <button class="primary-cta sharp-cta wide" type="button" onClick={() => setShowHologram(true)}>
            ท้าเพื่อน
          </button>
        </div>
      </div>

      {consentState.authMode !== "supabase-account" ? (
        <>
          <div class="profile-section-divider"></div>
          <div class="profile-auth-integration">
            <AccountPanel consentState={consentState} onAuthChange={onAuthChange} />
          </div>
        </>
      ) : null}
    </div>
    </>
  );
}
