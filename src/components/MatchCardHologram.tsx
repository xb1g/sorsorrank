import { useRef, useState, useEffect } from "preact/hooks";
import html2canvas from "html2canvas";

interface MatchCardHologramProps {
  streakCount: number;
  todayLabel: string;
  onClose: () => void;
}

export function MatchCardHologram({ streakCount, todayLabel, onClose }: MatchCardHologramProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3D Tilt State
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shineX, setShineX] = useState(50);
  const [shineY, setShineY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Optional: Device orientation for mobile tilt
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!isHovered && e.beta !== null && e.gamma !== null) {
        // Map beta (-180 to 180) to rotateX (-15 to 15)
        // Map gamma (-90 to 90) to rotateY (-15 to 15)
        const newRotX = Math.max(-15, Math.min(15, (e.beta - 45) / 3)); 
        const newRotY = Math.max(-15, Math.min(15, e.gamma / 3));
        setRotateX(newRotX);
        setRotateY(newRotY);
        
        // Map shine position inversely
        setShineX(50 + newRotY * 3);
        setShineY(50 - newRotX * 3);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);
    }
    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
    };
  }, [isHovered]);

  const handlePointerMove = (e: PointerEvent) => {
    if (!containerRef.current) return;
    setIsHovered(true);

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const percentageX = (x - centerX) / centerX;
    const percentageY = (y - centerY) / centerY;

    // Max rotation 15 degrees
    setRotateX(percentageY * -15);
    setRotateY(percentageX * 15);

    // Map shine position
    setShineX((x / rect.width) * 100);
    setShineY((y / rect.height) * 100);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setShineX(50);
    setShineY(50);
  };

  const handleShare = async () => {
    if (!cardRef.current || isSharing) return;
    setIsSharing(true);
    setError(null);

    // Reset rotation temporarily for a clean snapshot
    const prevRotX = rotateX;
    const prevRotY = rotateY;
    setRotateX(0);
    setRotateY(0);

    // Wait a frame for rotation to reset
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null, // Transparent
        scale: 2, // High res
        logging: false,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );

      if (!blob) throw new Error("Failed to generate image.");

      const file = new File([blob], "sorsorrank-match.png", { type: "image/png" });
      const shareData = {
        title: "SorsorRank",
        text: "ฉันทำ Daily Deck 10 ใบครบแล้ววันนี้ ถึงตาคุณแล้ว!",
        files: [file],
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sorsorrank-match.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการแชร์ ลองอีกครั้ง");
    } finally {
      // Restore rotation
      setRotateX(prevRotX);
      setRotateY(prevRotY);
      setIsSharing(false);
    }
  };

  return (
    <div class="hologram-overlay">
      <div class="hologram-backdrop" onClick={onClose} />
      
      <div 
        class="hologram-scene" 
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        <div 
          class="hologram-card-wrapper"
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: isHovered ? "none" : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
          }}
        >
          <div class="hologram-card" ref={cardRef}>
            
            {/* The liquid silver foil effect */}
            <div 
              class="hologram-foil"
              style={{
                backgroundPosition: `${shineX}% ${shineY}%`
              }}
            />

            {/* Parallax Content Layer */}
            <div class="hologram-content">
              <div class="holo-header">
                <div class="holo-brand">SorsorRank</div>
                <div class="holo-date">{todayLabel}</div>
              </div>
              
              <div class="holo-main">
                <div class="holo-badge">DAILY DECK</div>
                <h2 class="holo-title">10/10<br/>COMPLETED</h2>
                
                {streakCount > 0 && (
                  <div class="holo-streak">
                    <span class="streak-icon">🔥</span>
                    <span class="streak-num">{streakCount}</span>
                    <span class="streak-label">DAY STREAK</span>
                  </div>
                )}
              </div>

              <div class="holo-footer">
                <p>จะไม่มีใครเห็นว่าคุณ Crush หรือ Pass ใคร</p>
              </div>
            </div>
            
            {/* The sharp 1px overlay frame */}
            <div class="hologram-frame" />
          </div>
        </div>
      </div>

      <div class="hologram-actions">
        <button class="primary-cta sharp-cta wide" onClick={handleShare} disabled={isSharing}>
          {isSharing ? "กำลังสร้างภาพ..." : "แชร์ผลลัพธ์"}
        </button>
        {error && <p class="inline-error-sharp">{error}</p>}
        <button class="ghost-cta sharp-cta wide" style={{ marginTop: "12px" }} onClick={onClose}>
          ปิด
        </button>
      </div>
    </div>
  );
}
