# AGENTS.md

## Project

SorsorRank is Tinder for Thai public figures. Users get 10 daily public-figure cards, swipe to Crush or Pass, jump to Google for their own research, and contribute to aggregate Crush Rank — a collective research-interest leaderboard.

Read these docs before product, design, or implementation work:

- `docs/product/README.md`
- `docs/product/01-prd.md`
- `docs/product/02-viral-growth.md`
- `docs/product/03-frontend-handoff.md`
- `docs/product/04-safety-compliance.md`
- `docs/product/05-technical-plan.md`
- `docs/product/06-eng-review-static-architecture.md`

## Product Direction

Optimize for fun and virality — Tinder-style swipe ergonomics, civic substance underneath.

The core loop is:

```text
finish Daily Deck (10 swipes)
  -> see Match Card with flame/heart moment
  -> share Match Card to group chat
  -> friend taps link
  -> friend sees consent gate
  -> friend does their Daily Deck
  -> Crush Rank updates after threshold
```

Build toward:

- Daily Deck ritual (10-card swipe session).
- Match Card share moment after completion.
- Hot Streak for consecutive Daily Decks.
- Fast Google Search handoff before or after swiping.
- Crush Rank leaderboard (aggregate research interest).
- Match % per card (shown above sample threshold).
- Battle Mode: two figures side-by-side, "Who would you rather research?" (disabled during election windows).
- Group-chat-friendly challenge links.

Do not build toward:

- Voting advice.
- Candidate endorsement.
- Approval ratings.
- Election predictions.
- User political identity badges.
- Comments, debate feeds, quote posts, or accusations.
- AI-generated political summaries or claims.
- Romantic, sexual, or moral framing of public figures.
- Battle Mode during any active election window or for any active-candidate roster row.

## Vocabulary

Use this language:

- Crush (swipe action — "chose to research this person")
- Pass (skip action)
- Swipe your 10
- Daily Deck
- Match Card (completion share)
- Crush Rank
- Hot Streak
- Match % (per-card aggregate)
- Battle Mode
- Collective crush energy
- Public figure
- Not a poll or endorsement

Avoid this language:

- Vote
- Support
- Endorse
- Best
- Winner
- Leading
- Approval
- Odds
- Prediction
- Momentum
- Romantic / sexual language applied to figures
- Any framing suggesting the app predicts or influences elections

The word "research" may appear in methodology context ("Crush Rank measures research interest") but should not be used as a primary CTA. The primary CTA is Crush / Pass.

## Content Rules

Cards must stay sparse:

- Name.
- Optional role/party for disambiguation.
- Google Search button.
- Crush / Pass actions.
- Match % (shown only above sample threshold, labeled "of today's swipers crushed on this figure — not a poll").

Do not host:

- Bios.
- Allegations.
- Accusations.
- Search snippets.
- Editorial descriptions.
- Negative labels.
- User-submitted political text.
- AI summaries.
- Romantic or sexual descriptors.

## Safety and Thai-Law Guardrails

This project touches political opinions and public figures. Treat safety as product scope, not polish.

Non-negotiables:

- Consent before storing Crush/Pass swipe actions.
- Clear privacy notice.
- Aggregate-first ranking.
- Short raw-event retention.
- No sale or ad targeting from political interaction data.
- Contact/takedown path.
- Methodology page ("How Crush Rank works") before public rankings.
- Freeze mode before broad launch.
- Roster audit trail.
- No monarchy, royal family, or royal-institution content. Crush framing does **not** apply to the monarchy — they are not in the roster at all.

As of 2026-05-22, Bangkok and Pattaya local elections are set for 2026-06-28. Active candidates for those races must be excluded from public Crush Rank, Match %, Battle Mode, and Match Card share. See `docs/product/04-safety-compliance.md` for the exact election-window blackout rules.

This is not legal advice. Public launch in Thailand needs Thai counsel review of exact copy, flow, data model, roster, and timing.

## Frontend Guidance

The frontend should feel like Tinder for politics: fast, swipeable, mobile-first, and deeply shareable.

Preferred feel:

- Tinder-style card physics: drag, tilt, snap-away.
- Hearts and flame icons allowed.
- Red/pink/orange palette for CTAs, streaks, and top-3 Crush Rank.
- Daily Deck = ritual. Match Card = shareable reward.
- Readable Thai and English names at any card size.

Avoid:

- Campaign-poster styling.
- Dark-pattern streak pressure.
- Romantic or sexual framing of individual public figures in UI copy.
- Any visual signal that could be read as election endorsement (candidate photos with party colors as primary chrome, flag colors dominant, etc.).

Every user-facing screen needs loading, empty, error, success, offline/slow-network, long-name, and small-mobile states.

Preferred stack direction:

- Static-hosted frontend.
- Vite build.
- Preact or vanilla TypeScript.
- Plain CSS/CSS modules.
- CSS transitions/Web Animations API or one small motion helper.
- No Next.js, SSR, server components, or heavyweight routing unless a future requirement genuinely needs it.

The app can be hosted as static files, but the product cannot be pure static if it needs real daily limits, aggregate ranks, abuse controls, retention cleanup, and admin roster updates. Use a small serverless/BaaS API for dynamic behavior.

## Data and Architecture

Prefer boring primitives:

- `politicians`
- `consent_records`
- short-retention `swipe_events` (now stores `crush` or `pass`)
- `daily_crush_rank_aggregates`
- `battle_mode_aggregates`
- short-retention rate-limit keys
- `takedown_requests`
- `admin_audit_logs`

Default Crush Rank formula:

```text
crush_rank_score = crush_actions / eligible_card_impressions
```

Important rules:

- `Crush` is the positive signal.
- `Pass` counts as an impression, not a positive signal.
- Match % = `crush_actions / eligible_card_impressions` × 100, per-figure, per-day window. Display only above sample threshold.
- Google click can be tracked separately, but must not be required for ranking.
- Hide ranks below sample threshold.
- Do not store raw IPs in analytics tables.
- Raw swipe events should expire quickly; recommended default is 7 days maximum.
- Battle Mode aggregates separately from main Crush Rank; same threshold and freeze rules apply.

## Testing Expectations

Any implementation should cover:

- Cannot swipe without consent.
- 10th swipe succeeds and 11th fails.
- Duplicate tap/swipe does not double count.
- Crush action increments aggregate.
- Pass increments impression but not crush count.
- Crush Rank hides below sample threshold.
- Match % hides below sample threshold; label reads "not a poll".
- Freeze mode pauses or hides Crush Rank, Match %, Battle Mode, and Match Card share.
- Battle Mode is fully disabled during any active election window.
- Long politician names do not break layout.
- XSS in roster names is escaped.
- Unauthorized admin routes are blocked.
- Public copy does not contain banned terms (vote, endorse, support, approval, odds, prediction, winner, momentum).
- Share card copy does not contain names of crushed/passed figures or political preference disclosure.

## Working Style

Keep changes small and explicit. If a choice could affect legal posture, privacy, ranking meaning, or viral share copy, document the decision in `docs/product/` before implementing it.

When in doubt, protect the product thesis: fun swipe loop, no hosted political claims, no endorsement framing, Crush Rank = research interest not a poll.
