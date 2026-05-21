interface ContactPanelProps {
  onStart: () => void;
}

export function ContactPanel({ onStart }: ContactPanelProps) {
  return (
    <section class="panel contact-panel">
      <div class="panel-header">
        <div>
          <p class="panel-label">Contact</p>
          <h2>Contact and takedown</h2>
        </div>
      </div>

      <p class="contact-copy">
        Use this path for roster corrections, takedown requests, legal contact, or questions
        about methodology and privacy.
      </p>

      <div class="contact-grid">
        <article class="contact-card">
          <span>Contact email</span>
          <strong>team@sorsorrank.example</strong>
        </article>
        <article class="contact-card">
          <span>Request types</span>
          <strong>Roster, takedown, privacy, legal</strong>
        </article>
      </div>

      <form class="contact-form">
        <label class="field">
          <span>Request type</span>
          <select defaultValue="Takedown request">
            <option>Takedown request</option>
            <option>Roster correction</option>
            <option>Privacy question</option>
            <option>Legal contact</option>
          </select>
        </label>

        <label class="field">
          <span>Public figure or roster item</span>
          <input type="text" placeholder="Name or roster item" />
        </label>

        <label class="field">
          <span>Explanation</span>
          <textarea rows={5} placeholder="What should be reviewed or removed?" />
        </label>

        <label class="field">
          <span>Optional evidence link</span>
          <input type="url" placeholder="https://..." />
        </label>
      </form>

      <div class="methodology-actions">
        <button class="primary-cta" type="button">
          Submit request
        </button>
        <button class="text-link-button" type="button" onClick={onStart}>
          Back to daily 10
        </button>
      </div>
    </section>
  );
}
