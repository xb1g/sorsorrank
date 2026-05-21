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
- Explicit withdrawal/deletion path for stored interaction data.
- Methodology page explaining what the rank means and does not mean.
- Takedown/contact page.
- Admin-managed roster.
- Freeze mode for legally sensitive periods.
- Counsel-approved launch gate before public rankings or active-candidate coverage.

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
- Paid political promotion, influencer seeding, or targeted ads.
- Public rankings for active candidates during an election window.
- Google-click tracking as a ranking input.
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
- Google click can be measured separately only after separate consent and counsel review; in MVP it is client-only and never required for ranking.
- Do not call the result popularity, support, approval, vote intent, or winning.
- Hide ranks below the minimum sample threshold.
- Default public threshold: hide any figure with fewer than 100 eligible consented card impressions in the ranking period, and let counsel raise this threshold.
- Hide all active-candidate ranks during election windows unless Thai counsel approves the exact roster, copy, timing, and display.
- Do not publish demographic, district-level, or micro-geographic breakdowns.

## Product Copy Principles

Use:

- "Research"
- "Skip"
- "Do your 10"
- "Research Interest Rank"
- "People chose to research..."
- "Not a poll. Not an endorsement."

Avoid in CTAs, share cards, rank labels, and promotional copy:

- "Vote"
- "Support"
- "Best"
- "Winner"
- "Approval"
- "Odds"
- "Hot"
- "Match"
- "Crush"

## Conservative Defaults And Open Decisions

Defaults until legal review says otherwise:

- Roster scope: public officeholders and public political figures who are not active candidates in a current election.
- Active candidates: excluded from public rankings and share surfaces during election windows.
- Public ranks: disabled in private alpha.
- Raw swipe retention: 7 days maximum, separate from legally required infrastructure traffic logs if counsel says those apply.
- Google Search clicks: client-only outbound behavior in MVP; do not store as political interaction data.

Open decisions:

- First language: Thai-only or bilingual.
- Whether the product needs an age gate or parental-consent flow before any underage users are targeted.
- Exact minimum sample size before public ranking.
- Whether active candidates can ever be shown outside public rankings after legal review.
