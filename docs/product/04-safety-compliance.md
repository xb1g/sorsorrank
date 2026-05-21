# Safety and Thai-Law Guardrails

This is not legal advice. Before public launch in Thailand, have Thai counsel review the exact product flow, copy, data model, launch timing, and roster.

## Current Timing Note

As of 2026-05-20, national parliamentary election activity from February 2026 is past, but Bangkok/Pattaya local elections are reported for 2026-06-28. If the roster includes active local candidates or launch activity targets those races, treat the election window as near-term, not far away.

Reference sources:

- Election Commission of Thailand homepage listing Bangkok election timing: https://www.ect.go.th/
- Thairath English report on Bangkok/Pattaya elections on 2026-06-28: https://en.thairath.co.th/news/politic/2925973
- PDPA Section 26 English translation including political opinions as sensitive personal data: https://pdpathailand.com/pdpa/content_eng/article26_eng.php

## Product Boundaries

SorsorRank must be framed as:

- Research interest.
- Daily curiosity.
- Aggregate participation.

SorsorRank must not be framed as:

- Voting advice.
- Candidate support.
- Approval rating.
- Election polling.
- Forecasting.
- Odds.
- Campaigning.

## PDPA Precautions

Swipe behavior can reveal or infer political opinions. Treat interaction data as sensitive unless counsel says otherwise.

Requirements:

- Explicit consent before storing swipes.
- Plain privacy notice.
- Purpose limitation: aggregate research-interest ranking only.
- Data minimization.
- Short raw-event retention.
- Deletion/contact path.
- No sale, ad targeting, or third-party sharing of political interaction data.
- No public user-level political profiles.

Recommended retention:

- Raw swipe events: 7 days maximum.
- Aggregates: retained by day/public figure.
- Rate-limit keys: short retention and rotated.
- Takedown/admin audit logs: retained as needed for operations.

## Defamation and Computer Crime Risk

Do not host:

- Allegations.
- Accusations.
- User comments.
- AI summaries.
- Negative labels.
- "Corrupt," "criminal," "dangerous," or similar tags.
- Scraped search snippets.

Allowed:

- Name.
- Optional role/party for disambiguation.
- Google Search link.
- Aggregate research-interest rank.
- Methodology.

## Election Risk

Required controls:

- Freeze mode.
- Public rank threshold.
- Methodology page.
- Neutral share copy.
- No paid boosting.
- No campaign accounts.
- No candidate coordination.
- No vote-intention language.

Freeze mode should be available before launch. It can:

- Pause swiping.
- Hide rankings.
- Freeze ranking updates.
- Show a banner explaining the pause.

## Roster Rules

Exclude:

- Monarchy, royal family, and royal-institution topics.
- Private citizens.
- Minors.
- People included only because of scandal/accusation.

Prefer:

- Public officeholders.
- Public political figures.
- People whose identity is already public in a civic context.

For active candidates:

- Add only after legal review.
- Consider hiding from public ranks during active campaign windows.

## Copy Red Lines

Banned terms in public UI/share copy:

- vote
- support
- endorse
- best
- winner
- leading
- approval
- odds
- prediction
- hot
- match
- crush

Required disclaimer near rankings:

> Research Interest Rank is an aggregate curiosity signal. It is not a poll, endorsement, prediction, approval rating, or voting guide.

## Launch Checklist

- Counsel reviewed exact copy and flow.
- Consent screen approved.
- Privacy notice live.
- Methodology page live.
- Contact/takedown page live.
- Freeze mode tested.
- Raw retention cleanup tested.
- Share cards reviewed.
- Roster reviewed.
- Minimum sample threshold configured.
