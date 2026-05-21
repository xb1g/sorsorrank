interface MethodologyPanelProps {
  compact?: boolean;
  onStart: () => void;
  onSeeRankings: () => void;
}

export function MethodologyPanel({
  compact = false,
  onStart,
  onSeeRankings
}: MethodologyPanelProps) {
  return (
    <section class={`panel methodology-panel ${compact ? "is-compact" : ""}`}>
      <div class="panel-header">
        <div>
          <p class="panel-label">How it works</p>
          <h2>What moves the leaderboard</h2>
        </div>
      </div>
      <ul class="methodology-list">
        <li>Approve is the up signal in the current prototype.</li>
        <li>Disapprove still counts as activity, but it is tracked separately.</li>
        <li>Google Search is extra context, it does not decide the board by itself.</li>
        <li>Low-sample rows can stay hidden until enough people weigh in.</li>
        <li>Freeze mode can pause the board during sensitive election windows.</li>
        <li>Raw swipe events are still meant to stay short-lived.</li>
      </ul>
      <div class="methodology-actions">
        <button class="ghost-cta" type="button" onClick={onStart}>
          Back to the deck
        </button>
        <button class="text-link-button" type="button" onClick={onSeeRankings}>
          Open leaderboard
        </button>
      </div>
    </section>
  );
}
