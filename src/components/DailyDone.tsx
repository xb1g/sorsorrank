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
      <p class="panel-label">Daily Done</p>
      <h1>You did your 10.</h1>
      <p class="done-copy">
        Log in to save today's results to the leaderboard and keep your streak attached to
        your account.
      </p>

      <div class="auth-save-card">
        <div class="auth-save-copy">
          <span class="panel-label">Save progress</span>
          <strong>Save your results to the leaderboard</strong>
          <p>Connect an account to keep today's approve and disapprove activity on your profile.</p>
        </div>
        <div class="auth-save-actions">
          <button class="primary-cta wide" type="button">
            Log in to save
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
          See leaderboard
        </button>
        <button class="text-link-button" type="button" onClick={onReadMethodology}>
          Why does this get saved?
        </button>
      </div>
    </section>
  );
}
