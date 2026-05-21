interface DailyDoneProps {
  streakCount: number;
  onSeeRankings: () => void;
  onReadMethodology: () => void;
}

const todayLabel = "May 20, 2026";

export function DailyDone({
  streakCount,
  onSeeRankings,
  onReadMethodology
}: DailyDoneProps) {
  return (
    <section class="panel daily-done">
      <p class="panel-label">Deck cleared</p>
      <h1>You finished your 10.</h1>
      <p class="done-copy">
        Log in to lock today's picks onto the leaderboard and keep your streak from falling
        off.
      </p>

      <div class="auth-save-card">
        <div class="auth-save-copy">
          <span class="panel-label">Save the run</span>
          <strong>Save your results to the Politician Leaderboard</strong>
          <p>Connect an account so today's approve and disapprove moves stay with your profile.</p>
        </div>
        <div class="auth-save-actions">
          <button class="primary-cta wide" type="button">
            Log in and save it
          </button>
          <button class="ghost-cta wide" type="button">
            Continue with Google
          </button>
        </div>
      </div>

      <div class="done-grid">
        <article class="done-card">
          <span>Date</span>
          <strong>{todayLabel}</strong>
        </article>
        <article class="done-card">
          <span>Streak</span>
          <strong>{streakCount} days</strong>
        </article>
      </div>

      <div class="done-actions">
        <button class="ghost-cta wide" type="button" onClick={onSeeRankings}>
          Open leaderboard
        </button>
        <button class="text-link-button" type="button" onClick={onReadMethodology}>
          Why does this count?
        </button>
      </div>
    </section>
  );
}
