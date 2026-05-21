# Frontend Handoff

This doc is for the frontend build. The vibe should be fun, quick, and social, but not a dating app clone and not a campaign site.

## Product Feel

- Fast.
- Mobile-first.
- Swipeable.
- Group-chat friendly.
- Calm enough for politics.
- More "daily challenge" than "dating game."
- Lightweight enough to host as static files.
- Animated and tactile without a bulky app framework.

Avoid hearts, flame icons, red/green judgment colors, "hot/not," "match," "crush," or anything that turns public figures into romantic/sexual objects.

## Main Screens

### 1. Landing / Consent

Purpose: explain the deal quickly and get consent before storing actions.

Primary copy:

> Do your 10. Search for yourself. See what people are researching.

Required notes:

- "This is not a poll, endorsement, or election forecast."
- "We show names and link you to Google. We do not host political claims."
- "Your swipes are used only for aggregate research-interest ranking."
- "You can withdraw consent or ask us to delete stored interaction data."

Actions:

- `Start my 10`
- `Read methodology`

Rules:

- Consent must be explicit and unbundled from marketing.
- Do not store swipes, Google clicks, share events, or persistent visitor identifiers before consent.
- If the user declines consent, allow methodology/contact access but no swiping.

### 2. Swipe Deck

Card content:

- Name.
- Optional role/party only if needed to disambiguate.
- Google Search button.
- `Research` action.
- `Skip` action.
- Progress meter: `3/10`.

Interaction notes:

- Google button should be obvious and available before the user decides.
- Card should not contain claims, photos with unclear rights, bios, accusations, promises, or editorial text.
- Search query must be neutral: name plus optional role/party only. Do not append scandal, corruption, crime, praise, attack, or campaign terms.
- Use stable layout for long names.
- Support tap buttons even if swipe gestures exist.

### 3. Daily Done

Shown after card 10.

Content:

- "You did your 10."
- Streak count if available.
- Share card preview.
- CTA: `Challenge a friend`.
- CTA: `See today's rank`.

### 4. Rankings

Content:

- Title: `Research Interest Rank`.
- Date range.
- Sample size.
- List of ranked public figures.
- Methodology link.
- Disclaimer: "Aggregate curiosity, not a poll."

Ranking row:

- Rank number.
- Name.
- Optional role/party.
- Research-interest score or simple bar.
- Google Search button.

Rules:

- Hide ranks during freeze mode.
- Hide active-candidate rows during election windows unless counsel has approved the exact release.
- Hide rows below the minimum sample threshold.
- Do not show demographic, district-level, or user-segment rankings.

### 5. Methodology

Plain-language explanation:

- What counts.
- What does not count.
- Why some ranks are hidden.
- Why this is not a poll.
- How to contact/takedown.

### 6. Freeze Mode

If enabled:

- Swipe deck can be paused.
- Rankings can be hidden or frozen.
- Show message: "Research rankings are paused during a sensitive election period."
- Keep methodology/contact pages accessible.
- Disable rank snapshot sharing.
- Disable public share previews for any active-candidate content.

## Share Cards

### Completion Card

Required:

- App name.
- "I researched 10 public figures today."
- Date.
- Challenge link.

Do not include:

- Names of researched/skipped people.
- Political preference.
- "Winning" language.
- Active-candidate or election-window context.

### Rank Snapshot

Required:

- "Research Interest Rank"
- Date range.
- Sample size.
- "Not a poll or endorsement."

Rules:

- Disabled during election freeze.
- Disabled for active-candidate rosters.

## Visual Direction

Suggested direction:

- Clean high-contrast interface.
- Playful motion: springy card drag, snap-away decisions, progress ticks, completion burst.
- Cards can feel tactile, but page chrome should be minimal.
- Typography should be readable under Thai and English names.
- Keep buttons large enough for mobile thumbs.
- Prefer CSS transitions/Web Animations API or a tiny animation helper over heavy UI frameworks.
- Respect reduced-motion settings.
- Keep initial JavaScript small; the first screen should feel instant on mobile data.

## Static Frontend Stack Direction

Preferred frontend shape:

- Vite static build.
- Preact or vanilla TypeScript.
- CSS modules/plain CSS.
- Web Animations API or a small motion helper.
- No Next.js, SSR, server components, or heavyweight routing.

The frontend should be deployable to static hosting such as Cloudflare Pages, Netlify, GitHub Pages, or any CDN that serves built files.

## State Checklist

Every screen should define:

- Loading.
- Empty.
- Error.
- Success.
- Offline/slow network.
- Long-name layout.
- Small mobile viewport.

Critical edge states:

- No active roster.
- User declines consent.
- User already did 10 today.
- Duplicate tap/swipe.
- Google link fails to open.
- Ranking below sample threshold.
- Freeze mode active.

## Banned UI Copy

Do not use in CTAs, share cards, rank labels, or promotional copy:

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

Use:

- research
- skip
- curiosity
- public figure
- research interest
- daily 10
