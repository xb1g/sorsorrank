import { useState, useEffect } from "preact/hooks";

const messages = [
  "กำลังจัดเด็คใหม่...",
  "เตรียมการ์ดให้คุณ...",
  "โหลดอันดับความสนใจ...",
  "เกือบพร้อมแล้ว...",
];

export function LoadingScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <section class="panel loading-panel">
      <div class="loading-stage">
        <div class="loading-orbits">
          <div class="loading-ring ring-1" />
          <div class="loading-ring ring-2" />
          <div class="loading-ring ring-3" />
          <div class="loading-core">
            <img src="/logo.svg" class="loading-logo" alt="" aria-hidden="true" />
          </div>
        </div>
        <div class="loading-text-block">
          <h2 class="loading-title">SorsorRank</h2>
          <p class="loading-message">{messages[index]}</p>
          <div class="loading-dots">
            <span class="dot" />
            <span class="dot" />
            <span class="dot" />
          </div>
        </div>
      </div>
    </section>
  );
}
