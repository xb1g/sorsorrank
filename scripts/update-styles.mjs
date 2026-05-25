import fs from 'fs';
const cssPath = 'src/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');

const profileStart = css.indexOf('/* Profile Page */');
if (profileStart !== -1) {
  css = css.substring(0, profileStart);
}

const newStyles = `/* Profile Brutalist Redesign */
.profile-brutalist {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px 16px 40px;
}

/* Hero Section */
.profile-hero {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 12px;
}

.profile-hero-title {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--text-primary);
}

.profile-auth-status {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.profile-auth-status[data-active="true"] {
  color: var(--text-secondary);
}

/* Raw Stats */
.profile-raw-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.raw-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.raw-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.raw-value {
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--text-primary);
}

.raw-unit {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-muted);
}

.raw-slash {
  color: var(--border-subtle);
  margin: 0 4px;
}

.raw-limit {
  color: var(--text-muted);
}

/* Progress Edge */
.profile-progress-edge {
  height: 2px;
  background: oklch(100% 0 0 / 0.05);
  width: 100%;
}

.profile-progress-edge .progress-fill {
  height: 100%;
  background: var(--text-secondary);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.profile-progress-edge .progress-fill[data-complete="true"] {
  background: var(--accent-research);
  box-shadow: 0 0 10px var(--accent-research);
}

/* Edge Actions */
.profile-hero-actions {
  margin-top: 8px;
}

.edge-message {
  padding: 16px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.success-edge {
  color: var(--text-secondary);
}

.success-edge strong {
  color: var(--text-primary);
}

/* Sharp CTA */
.sharp-cta {
  border-radius: 0;
  border: 1px solid var(--border-subtle);
}

/* Dividers */
.profile-section-divider {
  height: 1px;
  background: var(--border-subtle);
  width: 100%;
}

/* History Section */
.profile-history-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-header-sharp {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.history-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-secondary);
}

.history-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.history-table {
  display: flex;
  flex-direction: column;
}

.history-row-sharp {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-subtle);
  align-items: center;
}

.history-row-sharp:first-child {
  border-top: 1px solid var(--border-subtle);
}

.history-info-sharp {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-name-sharp {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.history-role-sharp {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.history-badge-sharp {
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid var(--border-subtle);
}

.history-badge-sharp.is-research {
  color: var(--text-primary);
  background: oklch(100% 0 0 / 0.1);
}

.history-badge-sharp.is-skip {
  color: var(--text-muted);
  background: transparent;
}

.history-loading-edge {
  height: 1px;
  background: var(--border-subtle);
  position: relative;
  overflow: hidden;
}

.history-loading-edge::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--text-primary);
  width: 30%;
  animation: shimmer-bar 1s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.history-empty-sharp {
  padding: 32px 0;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-subtle);
}

/* Account Panel Sharp */
.account-panel-sharp {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.account-header-sharp {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-label-sharp {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.account-title-sharp {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.account-desc-sharp {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.account-mode-row-sharp {
  display: flex;
  border-bottom: 1px solid var(--border-subtle);
}

.account-mode-row-sharp button {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.account-mode-row-sharp button.is-active {
  color: var(--text-primary);
  border-bottom-color: var(--text-primary);
}

.account-form-sharp {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-label-sharp {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label-text {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.form-input-sharp {
  padding: 12px 16px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 1rem;
  border-radius: 0;
}

.form-input-sharp:focus {
  outline: none;
  border-color: var(--text-secondary);
  background: oklch(100% 0 0 / 0.02);
}

.account-submit-btn {
  margin-top: 8px;
}

.inline-success-sharp {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--border-subtle);
  background: oklch(100% 0 0 / 0.05);
  color: var(--text-primary);
  font-size: 0.9rem;
  text-align: center;
}

.inline-error-sharp {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 0.9rem;
  text-align: center;
}
`;

fs.writeFileSync(cssPath, css + '\n' + newStyles);
