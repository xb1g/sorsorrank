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
    <section class="panel daily-done">
      <p class="panel-label">เคลียร์เด็คแล้ว</p>
      <h1>คุณทำครบ 10 ใบแล้ว</h1>
      <p class="done-copy">
        ตัวเลือกของคุณเป็นส่วนตัวและจะถูกนับรวมในความอยากรู้โดยรวม 
        จะไม่มีการ์ดสาธารณะใดแสดงว่าคุณค้นคว้าหรือข้ามใคร
      </p>

      <div class="auth-save-card">
        <div class="auth-save-copy">
          <span class="panel-label">แชร์การ์ด</span>
          <strong>{shareCopy || "ฉันค้นคว้าบุคคลสาธารณะ 10 คนวันนี้ ถึงตาคุณแล้ว"}</strong>
          <p>ส่ง 10 ใบนี้เข้าแชทกลุ่มโดยไม่ต้องเปิดเผยตัวเลือกของคุณ</p>
        </div>
        <div class="auth-save-actions">
          <button class="primary-cta wide" type="button" onClick={handleCreateShare} disabled={isSharing}>
            {isSharing ? "กำลังสร้าง..." : "ท้าเพื่อน"}
          </button>
          {errorMessage ? <p class="inline-error">{errorMessage}</p> : null}
        </div>
      </div>

      {consentState.authMode !== "supabase-account" ? (
        <AccountPanel consentState={consentState} onAuthChange={onAuthChange} />
      ) : null}

      <div class="done-grid">
        <article class="done-card">
          <span>วันที่</span>
          <strong>{todayLabel}</strong>
        </article>
        <article class="done-card">
          <span>สตรีค</span>
          <strong>{streakCount} วัน</strong>
        </article>
      </div>

      <div class="done-actions">
        <button class="ghost-cta wide" type="button" onClick={onSeeRankings}>
          ดูอันดับความสนใจค้นคว้า
        </button>
      </div>
    </section>
  );
}
