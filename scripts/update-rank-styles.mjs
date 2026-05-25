import fs from 'fs';
const cssPath = 'src/styles.css';
let css = fs.readFileSync(cssPath, 'utf8');

const newStyles = `/* Rank Brutalist Redesign */
.rank-brutalist {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px 16px 40px;
}

.rank-hero {
  display: flex;
  flex-direction: column;
}

.rank-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.rank-table {
  display: flex;
  flex-direction: column;
}

.rank-row-sharp {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 16px;
  padding: 24px 0;
  border-bottom: 1px solid var(--border-subtle);
  align-items: center;
}

.rank-row-sharp:first-child {
  border-top: 1px solid var(--border-subtle);
}

.rank-order-sharp {
  display: flex;
  justify-content: flex-start;
}

.rank-number {
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.05em;
  line-height: 1;
}

.rank-content-sharp {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-identity-sharp {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rank-stats-sharp {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-score-block {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.rank-percent {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.rank-details {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
}

.rank-graph-sharp {
  height: 2px;
  background: oklch(100% 0 0 / 0.05);
  width: 100%;
}

.rank-progress-edge {
  height: 100%;
  width: 100%;
}

.rank-progress-edge .progress-fill {
  height: 100%;
  background: var(--accent-research);
  box-shadow: 0 0 10px var(--accent-research);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.icon-only-cta {
  padding: 12px;
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-muted);
  display: grid;
  place-items: center;
  border-radius: 0;
  transition: all 0.2s ease;
}

.icon-only-cta:hover {
  background: oklch(100% 0 0 / 0.05);
  color: var(--text-primary);
}
`;

fs.writeFileSync(cssPath, css + '\n' + newStyles);
