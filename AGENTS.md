# AGENTS.md

## Project

SorsorRank is a fun, viral civic research swipe app. Users get 10 daily public-figure cards, can jump to Google for their own research, and contribute to aggregate research-interest rankings.

Read these docs before product, design, or implementation work:

- `docs/product/README.md`
- `docs/product/01-prd.md`
- `docs/product/02-viral-growth.md`
- `docs/product/03-frontend-handoff.md`
- `docs/product/04-safety-compliance.md`
- `docs/product/05-technical-plan.md`

## Product Direction

Optimize for fun and virality, but only around participation and curiosity.

The core loop is:

```text
finish 10 swipes
  -> share neutral completion card
  -> friend taps link
  -> friend sees consent gate
  -> friend does 10 swipes
  -> aggregate rank updates after threshold
```

Build toward:

- Daily 10-card ritual.
- Shareable completion cards.
- Streaks around research participation.
- Fast Google Search handoff.
- Aggregate Research Interest Rank.
- Group-chat friendly challenge links.

Do not build toward:

- Voting advice.
- Candidate endorsement.
- Approval ratings.
- Election predictions.
- Head-to-head politician battles.
- User political identity badges.
- Comments, debate feeds, quote posts, or accusations.
- AI-generated political summaries or claims.

## Public Framing

Use this language:

- Research
- Skip
- Do your 10
- Research Interest Rank
- Public figure
- Aggregate curiosity
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
- Hot
- Match
- Crush

## Content Rules

Cards must stay sparse:

- Name.
- Optional role/party for disambiguation.
- Google Search button.
- Research / Skip actions.

Do not host:

- Bios.
- Allegations.
- Accusations.
- Search snippets.
- Editorial descriptions.
- Negative labels.
- User-submitted political text.
- AI summaries.

## Safety and Thai-Law Guardrails

This project touches political opinions and public figures. Treat safety as product scope, not polish.

Non-negotiables:

- Consent before storing swipe actions.
- Clear privacy notice.
- Aggregate-first ranking.
- Short raw-event retention.
- No sale or ad targeting from political interaction data.
- Contact/takedown path.
- Methodology page before public rankings.
- Freeze mode before broad launch.
- Roster audit trail.
- No monarchy, royal family, or royal-institution content.

As of 2026-05-20, national parliamentary election activity from February 2026 is past, but Bangkok/Pattaya local elections are reported for 2026-06-28. If the roster includes active candidates or launch timing overlaps an election window, use freeze/review mode and get Thai legal review.

This is not legal advice. Public launch in Thailand needs Thai counsel review of the exact copy, flow, data model, roster, and timing.

## Frontend Guidance

The frontend should feel fun, fast, and mobile-first, but not like a dating app clone.

Preferred feel:

- Daily challenge.
- Clean civic game.
- Lightweight and tactile.
- Shareable but calm.
- Readable Thai and English names.

Avoid:

- Hearts.
- Flame icons.
- Red/green moral judgment colors.
- Romantic/sexual metaphors.
- Campaign-poster styling.
- Dark-pattern streak pressure.

Every user-facing screen needs loading, empty, error, success, offline/slow-network, long-name, and small-mobile states.

## Data and Architecture

Prefer boring primitives:

- `politicians`
- `consent_records`
- short-retention `swipe_events`
- `daily_research_interest_aggregates`
- short-retention rate-limit keys
- `takedown_requests`
- `admin_audit_logs`

Default rank formula:

```text
research_interest_score = research_actions / eligible_card_impressions
```

Important rules:

- `Research` is the positive signal.
- `Skip` counts as an impression, not a positive signal.
- Google click can be tracked separately, but should not be required for ranking.
- Hide ranks below sample threshold.
- Do not store raw IPs in analytics tables.
- Raw swipe events should expire quickly; recommended default is 7 days maximum.

## Testing Expectations

Any implementation should cover:

- Cannot swipe without consent.
- 10th swipe succeeds and 11th fails.
- Duplicate tap/swipe does not double count.
- Research action increments aggregate.
- Skip increments impression but not research count.
- Ranking hides below sample threshold.
- Freeze mode pauses or hides ranking.
- Long politician names do not break layout.
- XSS in roster names is escaped.
- Unauthorized admin routes are blocked.
- Public copy does not contain banned terms.

## Working Style

Keep changes small and explicit. If a choice could affect legal posture, privacy, ranking meaning, or viral share copy, document the decision in `docs/product/` before implementing it.

When in doubt, protect the product thesis: fun curiosity loop, no hosted political claims, no endorsement framing.
