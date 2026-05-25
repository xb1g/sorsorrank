import { useMemo, useState, useRef } from "preact/hooks";
import type { DeckCard, DeckState, SwipeAction } from "../types";
import { GoogleIcon, SearchIcon, ParliamentWatchIcon } from "./icons";
import { LoadingScreen } from "./LoadingScreen";

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

interface SwipeDeckPanelProps {
  deckState: DeckState;
  onSwipe: (card: DeckCard, action: SwipeAction) => Promise<void>;
  onComplete: () => void;
}

const effectMap: Record<SwipeAction, string[]> = {
  research: ["mint", "teal", "lime", "mint", "teal", "lime", "mint"],
  skip: ["amber", "amber", "rose", "amber", "rose", "amber", "amber"]
};

function getInitials(displayName: string) {
  return displayName
    .split(" ")
    .slice(0, 2)
    .map((segment) => segment[0])
    .join("");
}

function getRecordDetails(card: DeckCard) {
  const details = [
    { label: "ชื่อ", value: card.displayName },
    { label: "ตำแหน่ง", value: card.roleLabel },
    { label: "พรรค", value: card.partyLabel },
    { label: "คำค้นกลาง", value: card.searchQuery }
  ];

  return details.filter((detail) => Boolean(detail.value));
}

function formatRecordDate(value: string | undefined) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00+07:00`));
}

export function SwipeDeckPanel({
  deckState,
  onSwipe,
  onComplete
}: SwipeDeckPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastAction, setLastAction] = useState<SwipeAction | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(() => new Set());

  const isUnlimited = deckState.dailyLimit > 100;
  const activeCard = deckState.cards.length > 0
    ? deckState.cards[activeIndex % deckState.cards.length]
    : undefined;
  const bubbles = useMemo(() => (lastAction ? effectMap[lastAction] : []), [lastAction]);
  const showImage = Boolean(activeCard?.imageUrl && !failedImageIds.has(activeCard.id));

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dragStartX = useRef(0);

  const dragThreshold = 120; // px to trigger swipe

  function handlePointerDown(e: PointerEvent) {
    if (isBusy) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging || isBusy) return;
    const deltaX = e.clientX - dragStartX.current;
    setDragOffset(deltaX);
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (dragOffset > dragThreshold) {
      handleSwipe("research");
    } else if (dragOffset < -dragThreshold) {
      handleSwipe("skip");
    } else {
      setDragOffset(0); // Snap back
    }
  }

  async function handleSwipe(action: SwipeAction) {
    if (!activeCard || isBusy) {
      return;
    }

    setIsBusy(true);
    setLastAction(action);
    setErrorMessage("");

    try {
      await onSwipe(activeCard, action);
    } catch (error) {
      setIsBusy(false);
      setLastAction(null);
      setDragOffset(0);
      setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถบันทึกการกระทำนี้ได้");
      return;
    }

    window.setTimeout(() => {
      const nextIndex = activeIndex + 1;
      if (nextIndex >= deckState.dailyLimit) {
        onComplete();
        return;
      }

      setActiveIndex(nextIndex);
      setIsExpanded(false);
      setDragOffset(0);
      setIsBusy(false);
    }, 220);
  }

  if (!activeCard) {
    if (!deckState.freezeMode && !deckState.doneToday && deckState.cards.length === 0) {
      return (
        <section class="panel state-panel">
          <p class="panel-label">10 ใบประจำวัน</p>
          <h2>สำรวจครบทั้งหมดแล้ว</h2>
          <p style={{ maxWidth: "60ch", marginInline: "auto" }}>คุณได้สำรวจนักการเมืองที่มีในระบบ ณ ขณะนี้ทั้งหมดแล้ว! ขอบคุณที่ร่วมวิจัยประชาธิปไตยกับเรา คุณสามารถติดตามอันดับความสนใจหรือกลับมาใหม่ในวันพรุ่งนี้</p>
          <button class="btn btn-primary" type="button" onClick={onComplete} style={{ marginTop: "24px" }}>
            ดูผลสรุปวันนี้
          </button>
        </section>
      );
    }

    if (!deckState.freezeMode && !deckState.doneToday) {
      return <LoadingScreen />;
    }

    const stateTitle = deckState.freezeMode
      ? "พักชั่วคราว"
      : "คุณทำครบ 10 ใบแล้ว";
    const stateMessage = deckState.freezeMode
      ? "อันดับความสนใจถูกซ่อนในโหมดตรวจสอบ"
      : deckState.message ?? "กลับมาใหม่พรุ่งนี้สำหรับ 10 ใบชุดต่อไป";

    return (
      <section class="panel state-panel">
        <p class="panel-label">{deckState.freezeMode ? "พักชั่วคราว" : "Daily Deck"}</p>
        <h2>{stateTitle}</h2>
        {stateMessage ? <p>{stateMessage}</p> : null}
      </section>
    );
  }

  return (
    <section class="swipe-deck-container" style={{ width: 'min(720px, 100%)', margin: '0 auto' }}>
      <div class={`swipe-card-frame ${isBusy ? "is-busy" : ""}`}>
        <div class="bubble-layer" aria-hidden="true">
          {bubbles.map((tone, index) => (
            <span key={`${tone}-${index}`} class={`bubble bubble-${tone} bubble-${index + 1}`} />
          ))}
        </div>

        {/* Stack rendering: Back card (next), then Front card (active) */}
        <div class="swipe-stack-container" style={{ position: "relative", height: "65vh", minHeight: "500px", marginTop: "16px" }}>
          
          {/* Card 2 (Next in deck) */}
          {deckState.cards.length > 0 && (isUnlimited || activeIndex + 1 < deckState.cards.length) && (
            <article 
              key={deckState.cards[(activeIndex + 1) % deckState.cards.length].id}
              class="swipe-card swipe-card-behind"
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                transform: `scale(${isBusy ? 1 : 0.92}) translateY(${isBusy ? 0 : 24}px)`,
                opacity: isBusy ? 1 : 0.6,
                pointerEvents: "none",
                transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"
              }}
            >
              {deckState.cards[(activeIndex + 1) % deckState.cards.length].imageUrl ? (
                <img class="full-bleed-img" src={deckState.cards[(activeIndex + 1) % deckState.cards.length].imageUrl} alt="" />
              ) : (
                <div class="full-bleed-avatar">{getInitials(deckState.cards[(activeIndex + 1) % deckState.cards.length].displayName)}</div>
              )}
              <div class="card-gradient-overlay" />
            </article>
          )}

          {/* Card 1 (Active/Front) */}
          <article 
            key={activeCard.id}
            class="swipe-card swipe-card-front"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 10,
              touchAction: "none",
              cursor: isDragging ? "grabbing" : "grab",
              transform: isBusy 
                ? `translate3d(${lastAction === "research" ? "150%" : "-150%"}, 0, 0) rotate(${lastAction === "research" ? 15 : -15}deg)` 
                : `translate3d(${dragOffset}px, 0, 0) rotate(${dragOffset * 0.05}deg)`,
              transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
              boxShadow: isDragging ? "0 20px 40px rgba(0,0,0,0.4)" : "none",
              overflow: "hidden"
            }}
          >
            {/* Full Bleed Image */}
            {showImage ? (
              <img
                class="full-bleed-img"
                src={activeCard.imageUrl}
                alt=""
                loading="eager"
                referrerPolicy="no-referrer"
                onError={() => {
                  setFailedImageIds((current) => new Set(current).add(activeCard.id));
                }}
              />
            ) : (
              <div class="full-bleed-avatar">{getInitials(activeCard.displayName)}</div>
            )}

            {/* Gradient for text readability */}
            <div class="card-gradient-overlay" />

            {/* Visual feedback overlays during drag */}
            <div 
              class="swipe-stamp stamp-research"
              style={{
                opacity: dragOffset > 20 ? Math.min(dragOffset / dragThreshold, 1) : 0,
              }}
            >
              Crush
            </div>
            <div 
              class="swipe-stamp stamp-skip"
              style={{
                opacity: dragOffset < -20 ? Math.min(Math.abs(dragOffset) / dragThreshold, 1) : 0,
              }}
            >
              Pass
            </div>

            <div class="swipe-content bottom-aligned-content">
              <div class="card-header-row">
                <span class="card-badge">การ์ดใบที่ {activeIndex + 1} {isUnlimited ? "/ ∞" : `/ ${deckState.dailyLimit}`}</span>
                <button 
                  class="icon-btn expand-btn" 
                  onPointerDown={(e) => e.stopPropagation()} 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                >
                  {isExpanded ? <CloseIcon /> : <InfoIcon />}
                </button>
              </div>

              <div class="card-typography">
                <h3>{activeCard.displayName}</h3>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                  {activeCard.partyLabel && (
                    <span style={{ padding: "4px 10px", background: "rgba(255,255,255,0.15)", borderRadius: "100px", fontSize: "13px", fontWeight: "500", backdropFilter: "blur(4px)" }}>
                      {activeCard.partyLabel}
                    </span>
                  )}
                  {activeCard.roleLabel?.includes("แบ่งเขต") && activeCard.roleLabel.split(" - ")[2] && (
                    <span style={{ padding: "4px 10px", background: "rgba(255,255,255,0.15)", borderRadius: "100px", fontSize: "13px", fontWeight: "500", backdropFilter: "blur(4px)" }}>
                      📍 จ.{activeCard.roleLabel.split(" - ")[2]}
                    </span>
                  )}
                  {activeCard.roleLabel?.includes("บัญชีรายชื่อ") && (
                    <span style={{ padding: "4px 10px", background: "rgba(255,255,255,0.15)", borderRadius: "100px", fontSize: "13px", fontWeight: "500", backdropFilter: "blur(4px)" }}>
                      บัญชีรายชื่อ
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px", marginTop: "16px", pointerEvents: "auto" }}>
                <a
                  class="search-bar-link"
                  href={`https://www.google.com/search?q=${encodeURIComponent(activeCard.searchQuery)}`}
                  target="_blank"
                  rel="noreferrer"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <GoogleIcon />
                  <span class="search-bar-query" style={{ fontSize: "14px" }}>ค้นหาข้อมูลทั่วไปบน Google</span>
                  <div class="search-bar-icon-right">
                    <SearchIcon />
                  </div>
                </a>
                
                {activeCard.infoSourceUrl ? (
                  <a
                    class="search-bar-link"
                    href={activeCard.infoSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <ParliamentWatchIcon />
                    <span class="search-bar-query" style={{ fontSize: "14px" }}>ดูข้อมูลสาธารณะบน Parliament Watch</span>
                    <div class="search-bar-icon-right">
                      <SearchIcon />
                    </div>
                  </a>
                ) : null}
              </div>

              <div class="action-row">
                <button
                  class="deck-button deck-button-research"
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); handleSwipe("research"); }}
                  disabled={isBusy}
                >
                  Crush
                </button>
                <button
                  class="deck-button deck-button-skip"
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); handleSwipe("skip"); }}
                  disabled={isBusy}
                >
                  Pass
                </button>
              </div>
            </div>

            {/* Drawer */}
            <div 
              class="research-drawer"
              style={{
                transform: isExpanded ? "translateY(0)" : "translateY(100%)",
                opacity: isExpanded ? 1 : 0
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div class="drawer-header">
                <h4>ข้อมูลสาธารณะ</h4>
                <button class="icon-btn" onClick={() => setIsExpanded(false)}><CloseIcon /></button>
              </div>

              <div class="public-record-grid">
                {getRecordDetails(activeCard).map((detail) => (
                  <div class="public-record-row" key={detail.label}>
                    <span>{detail.label}</span>
                    <strong>{detail.value}</strong>
                  </div>
                ))}
              </div>

              <p class="drawer-note">ข้อมูลนี้มาจากชุดข้อมูลสาธารณะสำหรับระบุตัวบุคคล ไม่ใช่การแนะนำหรือจัดอันดับทางการเมือง</p>

              {activeCard.voteRecords?.length ? (
                <div class="vote-record-list">
                  <div class="vote-record-heading">บันทึกสภาล่าสุด</div>
                  {activeCard.voteRecords.map((record) => (
                    <a
                      class="vote-record-item"
                      href={record.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      key={record.voteEventId}
                    >
                      <span class="vote-record-meta">
                        {formatRecordDate(record.startDate) || "ไม่ระบุวันที่"}
                      </span>
                      <strong>{record.title}</strong>
                      <span>บันทึกไว้ว่า: {record.option}</span>
                    </a>
                  ))}
                  <p class="drawer-note">แสดงตามบันทึกสาธารณะ ไม่ใช่การตีความหรือคำแนะนำ</p>
                </div>
              ) : null}

              <div class="source-link-list">
                {activeCard.infoSourceUrl ? (
                  <a class="source-link" href={activeCard.infoSourceUrl} target="_blank" rel="noreferrer">
                    <ParliamentWatchIcon />
                    <span>Parliament Watch</span>
                  </a>
                ) : null}
                {activeCard.imageSourceUrl ? (
                  <a class="source-link" href={activeCard.imageSourceUrl} target="_blank" rel="noreferrer">
                    <SearchIcon />
                    <span>ที่มารูปภาพ</span>
                  </a>
                ) : null}
                <a class="source-link" href={`https://www.google.com/search?q=${encodeURIComponent(activeCard.searchQuery)}`} target="_blank" rel="noreferrer">
                  <GoogleIcon />
                  <span>ค้นเพิ่มบน Google</span>
                </a>
              </div>
            </div>

          </article>
        </div> {/* End stack container */}
      </div>

      {errorMessage ? <p class="inline-error" style={{ textAlign: "center", marginTop: "16px" }}>{errorMessage}</p> : null}
    </section>
  );
}
