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
          <p class="panel-label">Methodology</p>
          <h2>What this rank means</h2>
        </div>
      </div>
      <ul class="methodology-list">
        <li>Research counts as the positive signal.</li>
        <li>Skip counts as an impression, not a positive signal.</li>
        <li>Google Search can be tracked separately, but it does not define the rank.</li>
        <li>Rows remain hidden when the sample is below the minimum threshold.</li>
        <li>Freeze mode can pause or hide rankings during sensitive election periods.</li>
        <li>Raw swipe events are intended for short retention only.</li>
      </ul>
      <div class="methodology-actions">
        <button class="ghost-cta" type="button" onClick={onStart}>
          Back to daily 10
        </button>
        <button class="text-link-button" type="button" onClick={onSeeRankings}>
          Open Research Interest Rank
        </button>
      </div>
    </section>
  );
}
