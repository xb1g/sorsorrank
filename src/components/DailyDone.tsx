import { useState } from "preact/hooks";
import type { ConsentState } from "../types";
import { AccountPanel } from "./AccountPanel";

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
  onCreateShare,
  onAuthChange
}: DailyDoneProps) {
  const [shareCopy, setShareCopy] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCreateShare() {
    setIsSharing(true);
    setErrorMessage("");
    try {
      const share = await onCreateShare();
      setShareCopy(share.copy);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถสร้างการ์ดสำหรับแชร์ได้");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div class="content-column profile-brutalist">
      <div class="profile-hero">
        <div class="profile-title-row">
          <h2 class="profile-hero-title">สำเร็จ</h2>
          <span class="profile-auth-status">
            10 / 10
          </span>
        </div>
        
        <p class="account-desc-sharp" style={{ marginTop: "8px" }}>
          คุณทำครบ 10 ใบแล้ว<br />
          ตัวเลือกของคุณเป็นส่วนตัวและจะถูกนับรวมในความอยากรู้โดยรวม
          จะไม่มีการ์ดสาธารณะใดแสดงว่าคุณได้รู้เรื่องใหม่หรือข้ามใคร
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
            ดูดัชนีการค้นพบใหม่
          </button>
        </div>
      </div>

      <div class="profile-section-divider"></div>

      <div class="profile-hero">
        <div class="account-header-sharp">
          <span class="panel-label-sharp">แชร์การ์ด</span>
          <strong class="account-title-sharp">{shareCopy || "ฉันค้นคว้าบุคคลสาธารณะ 10 คนวันนี้ ถึงตาคุณแล้ว"}</strong>
          <p class="account-desc-sharp">ส่ง 10 ใบนี้เข้าแชทกลุ่มโดยไม่ต้องเปิดเผยตัวเลือกของคุณ</p>
        </div>
        
        <div class="profile-hero-actions">
          <button class="primary-cta sharp-cta wide" type="button" onClick={handleCreateShare} disabled={isSharing}>
            {isSharing ? "กำลังสร้าง..." : "ท้าเพื่อน"}
          </button>
          {errorMessage ? <p class="inline-error-sharp" style={{ marginTop: "12px" }}>{errorMessage}</p> : null}
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
  );
}
