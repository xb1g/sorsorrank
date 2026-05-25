# PRD: SorsorRank

## One-Liner

Tinder for Thai public figures. Swipe to research. See who Thailand is crushing on today.

## Product Thesis

Most civic products feel like homework. SorsorRank should feel like Tinder for public affairs — fast, tactile, and stupidly shareable. Every swipe sends users to Google to do their own research. The product does not host biographies, claims, allegations, ratings, or endorsements. It creates a daily swipe ritual around collective curiosity, surfaces aggregate Crush Rank, and rewards completion with a Match Card your group chat actually wants to share.

## Target Users

- Young, online Thai users who follow politics through social feeds.
- Friends who want a low-effort conversation starter about public figures.
- Civic-curious users who do not want to read long candidate pages first.
- Researchers or journalists who may later care about aggregate curiosity trends.

## User Promise

"Swipe your 10. See who people are crushing on. Make up your own mind."

## MVP Scope

### Must Have

- Daily Deck capped at 10 cards per user/day.
- Sparse card: name, optional role/party for disambiguation, public-record drawer, source links, Google Search button, Match %.
- Two card actions: `Crush` and `Pass`.
- Public aggregate **Crush Rank**.
- Match Card share moment after 10 swipes.
- Consent/privacy gate before storing swipe actions.
- Explicit withdrawal/deletion path for stored interaction data.
- "How Crush Rank Works" methodology page explaining what the rank means and does not mean.
- Takedown/contact page.
- Admin-managed roster.
- Freeze mode for legally sensitive periods.
- Counsel-approved launch gate before public rankings or active-candidate coverage.

### Should Have

- Hot Streak for consecutive completed Daily Decks (fire icon).
- Shareable Crush Rank snapshot with date and sample size.
- "Challenge a friend to swipe their 10" link.
- Minimum sample threshold before public Crush Rank shows.
- Match % per card (shown above threshold, labeled "not a poll").
- Battle Mode: two figures side-by-side, "Who would you rather research?" — disabled during election windows and for active-candidate roster rows.
- Basic abuse/rate-limit controls.

### Not In Scope

- Voting recommendations.
- Approval ratings or popularity labels.
- Candidate profile pages.
- Hosted bill-vote summaries, issue-position summaries, scores, or labels on swipe cards before counsel review. Factual recorded parliamentary rows may appear only in the expanded public-record drawer with date, title, recorded option, source link, and neutral disclaimer.
- User comments, debate threads, quote posts, or accusations.
- AI summaries of search results.
- Scraping Google results.
- Campaign accounts, paid boosts, or candidate coordination.
- Paid political promotion, influencer seeding, or targeted ads.
- Public Crush Rank for active candidates during an election window.
- Google-click tracking as a ranking input.
- Monarchy, royal family, or royal-institution content. Crush framing does not apply to the monarchy — they are not in the roster at all.
- Romantic or sexual framing of any public figure.

## Success Metrics

- Completion rate: percent of users who finish all 10 cards.
- Share rate: percent of completions that create a Match Card share.
- Invite conversion: percent of share visitors who start swiping.
- Day-2 return rate.
- Hot Streak average length.
- Google Search click rate.
- Crush Rank page views after completion.
- Abuse rate: duplicate/rejected swipe attempts, suspicious rate-limit buckets.
- Safety rate: takedown requests, copy violations, freeze-mode incidents.

## Crush Rank Definition

Default formula for MVP:

```
crush_rank_score = crush_actions / eligible_card_impressions
```

Rules:

- `Crush` means the user swiped right / chose to research this public figure.
- `Pass` counts as a card impression, not a positive signal.
- Google click can be measured separately only after separate consent and counsel review; in MVP it is client-only and never required for ranking.
- Do not call the result popularity, support, approval, vote intent, romantic preference, or winning.
- Hide ranks below the minimum sample threshold.
- Default public threshold: hide any figure with fewer than 100 eligible consented card impressions in the ranking period; counsel may raise this.
- Hide all active-candidate ranks during election windows unless Thai counsel approves the exact roster, copy, timing, and display.
- Do not publish demographic, district-level, or micro-geographic breakdowns.

Match % uses the same formula, surfaced per-card in the swipe deck. Methodology label reads: "of today's swipers chose to research this person — not a poll or endorsement."

## Product Copy Principles

Use:

- "Crush" (swipe right action)
- "Pass" (swipe left action)
- "Swipe your 10"
- "Daily Deck"
- "Crush Rank"
- "Match Card"
- "Hot Streak"
- "Match %"
- "People chose to research..."
- "Not a poll. Not an endorsement."
- "Crush = research curiosity, not romantic or political support."

Avoid in CTAs, share cards, rank labels, and promotional copy:

- "Vote"
- "Support"
- "Best"
- "Winner"
- "Approval"
- "Odds"
- "Prediction"
- "Momentum"
- "Leading"
- Romantic or sexual descriptors applied to figures

## Conservative Defaults And Open Decisions

Defaults until legal review says otherwise:

- Roster scope: public officeholders and public political figures who are not active candidates in a current election.
- Active candidates: excluded from public Crush Rank, Match %, Battle Mode, and Match Card share surfaces during election windows.
- Public Crush Rank: disabled in private alpha.
- Raw swipe retention: 7 days maximum.
- Google Search clicks: client-only outbound behavior in MVP; do not store as political interaction data.
- Card expansion may show factual roster/source metadata from Politigraph or Parliament Watch: role, party, district/list status, source links, image attribution, and recent recorded parliamentary rows limited to date, title, recorded option, and source link. It must not summarize bill voting, issue positions, scandals, campaign promises, or allegations without a separate product and legal review.
- Battle Mode: off by default; enable only after safety review and outside election windows.

Open decisions:

- First language: Thai-only or bilingual.
- Whether the product needs an age gate or parental-consent flow before any underage users are targeted.
- Exact minimum sample size before public ranking.
- Whether active candidates can ever be shown outside public rankings after legal review.
- Battle Mode pair-selection algorithm (random, editorial, or user-requested).
