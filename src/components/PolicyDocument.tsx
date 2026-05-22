import { ChevronLeftIcon } from "./icons";

interface PolicyDocumentProps {
  type: "privacy" | "terms";
  onBack: () => void;
}

export function PolicyDocument({ type, onBack }: PolicyDocumentProps) {
  const isPrivacy = type === "privacy";

  return (
    <div class="policy-wrapper">
      <header class="topbar" style={{ position: "sticky", top: 0, zIndex: 20 }}>
        <button class="ghost-cta" type="button" onClick={onBack} style={{ minHeight: "40px" }}>
          <ChevronLeftIcon /> กลับ
        </button>
        <span class="panel-label" style={{ margin: 0 }}>
          {isPrivacy ? "นโยบายความเป็นส่วนตัว" : "ข้อกำหนดการใช้งาน"}
        </span>
      </header>
      
      <section class="panel policy-document">
        <div class="policy-content" style={{ textAlign: 'center', padding: '40px 0' }}>
          <h1>{isPrivacy ? "ประกาศความเป็นส่วนตัว" : "ข้อกำหนดการใช้งาน"}</h1>
          <p style={{ marginTop: '24px', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            แพลตฟอร์มนี้จัดทำขึ้นเพื่อการค้นคว้าวิจัย และเพื่อความสนุกสนานเท่านั้น! 🎉
          </p>
        </div>
      </section>
    </div>
  );
}
