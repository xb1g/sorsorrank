# PRD: SorsorRank

## One-Liner

A fast, playful way to discover which Thai public figures people are curious enough to research today.

## Product Thesis

Most civic products feel like homework. SorsorRank should feel like a daily social game, but every fun mechanic points users outward to do their own research. The product does not host biographies, claims, allegations, ratings, or endorsements. It creates a light daily ritual around curiosity.

## Target Users

- Young, online Thai users who follow politics through social feeds.
- Friends who want a low-effort conversation starter.
- Civic-curious users who do not want to read long candidate pages first.
- Researchers or journalists who may later care about aggregate curiosity trends.

## User Promise

"Do your 10. See who people are researching. Make up your own mind."

## MVP Scope

### Must Have

- Daily swipe deck capped at 10 cards per user/day.
- Sparse card: name, optional role/party for disambiguation, Google Search button.
- Two card actions: `Research` and `Skip`.
- Public aggregate **Research Interest Rank**.
- Shareable completion card after 10 swipes.
- Consent/privacy gate before storing swipe actions.
- Methodology page explaining what the rank means and does not mean.
- Takedown/contact page.
- Admin-managed roster.
- Freeze mode for legally sensitive periods.

### Should Have

- Streaks based on completing daily 10.
- Shareable rank snapshot with date and sample size.
- "Invite a friend to do their 10" link.
- Minimum sample threshold before public ranks show.
- Basic abuse/rate-limit controls.

### Not In Scope

- Voting recommendations.
- Approval ratings or popularity labels.
- Candidate profile pages.
- User comments, debate threads, quote posts, or accusations.
- AI summaries of search results.
- Scraping Google results.
- Campaign accounts, paid boosts, or candidate coordination.
- Monarchy, royal family, or royal-institution content.

## Success Metrics

- Completion rate: percent of users who finish all 10 cards.
- Share rate: percent of completions that create a share.
- Invite conversion: percent of share visitors who start swiping.
- Day-2 return rate.
- Google Search click rate.
- Ranking page views after completion.
- Abuse rate: duplicate/rejected swipe attempts, suspicious rate-limit buckets.
- Safety rate: takedown requests, copy violations, freeze-mode incidents.

## Ranking Definition

Default rank formula for MVP:

```
research_interest_score = research_actions / eligible_card_impressions
```

Rules:

- `Research` means the user chose to research this public figure.
- `Skip` counts as a card impression, not a positive signal.
- Google click can be measured separately, but should not be required for ranking.
- Do not call the result popularity, support, approval, vote intent, or winning.
- Hide ranks below the minimum sample threshold.

## Product Copy Principles

Use:

- "Research"
- "Skip"
- "Do your 10"
- "Research Interest Rank"
- "People chose to research..."
- "Not a poll. Not voting advice."

Avoid:

- "Vote"
- "Support"
- "Best"
- "Winner"
- "Approval"
- "Odds"
- "Hot"
- "Match"
- "Crush"

## Open Decisions

- First language: Thai-only or bilingual.
- Roster scope: public officeholders only, politicians broadly, or active candidates.
- Minimum sample size before public ranking.
- Raw event retention period. Recommended default: 7 days maximum.
- Whether active candidates are hidden, frozen, or allowed after legal review.
