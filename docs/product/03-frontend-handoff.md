# Frontend Handoff

This doc is for the frontend build. Vibe: Tinder for politics. Fast, swipeable, mobile-first, deeply shareable — but not a campaign site.

## Product Feel

- Tinder-style card physics: drag, tilt, snap-away.
- Mobile-first.
- Group-chat friendly.
- Hearts and flames allowed.
- More "viral swipe challenge" than "civic homework."
- Lightweight enough to host as static files.
- Animated and tactile without a bulky app framework.

Hearts, flame icons, red/pink/orange palette — all allowed. Avoid anything that turns public figures into romantic/sexual objects in copy or that visually implies electoral endorsement (e.g., party-color dominant chrome, flag aesthetics as primary UI).

## Main Screens

### 1. Landing / Consent

Purpose: explain the deal quickly and get consent before storing actions.

Primary copy:

> Swipe your 10. Search for yourself. See who Thailand is crushing on.

Sub-copy:

> "This is not a poll, endorsement, or election forecast. Crush = research curiosity, not romantic or political support."

Required notes:

- "We show names and link you to Google. We do not host political claims."
- "Your swipes are used only for aggregate Crush Rank."
- "You can withdraw consent or ask us to delete stored interaction data."

Actions:

- `Start my Daily Deck`
- `How Crush Rank works`

Rules:

- Consent must be explicit and unbundled from marketing.
- Do not store swipes, Google clicks, share events, or persistent visitor identifiers before consent.
- If the user declines consent, allow methodology/contact access but no swiping.

### 2. Swipe Deck

Card content:

- Name.
- Optional role/party only if needed to disambiguate.
- Google Search button.
- `Crush` action (swipe right / button).
- `Pass` action (swipe left / button).
- Progress meter: `3/10`.
- Match % (above sample threshold only): "72% of swipers crushed on this person — not a poll."

Interaction notes:

- Tinder-style swipe gesture + tap buttons both work.
- Google button should be obvious and available before the user decides.
- Card should not contain claims, photos with unclear rights, bios, accusations, promises, or editorial text.
- Search query must be neutral: name plus optional role/party only. Do not append scandal, corruption, crime, praise, attack, or campaign terms.
- Use stable layout for long names.
- Card tilt on drag should hint at Crush (right, warm color) vs Pass (left, cool color) without using explicit red/green moral judgment.

### 3. Match Card (Daily Done)

Shown after card 10.

Content:

- "You swiped your Daily Deck."
- Hot Streak count with 🔥 icon.
- Match Card preview (shareable).
- CTA: `Challenge a friend`.
- CTA: `See today's Crush Rank`.
- Optional: Match % reveal for today's deck.

Share card copy:

- "I matched with 10 public figures today. Find your political crush."
- Include date, challenge link, "Not a poll or endorsement."

### 4. Crush Rank

Content:

- Title: `Crush Rank`.
- Subtitle: `Collective research interest — not a poll or endorsement.`
- Date range.
- Sample size.
- List of ranked public figures.
- Methodology link ("How Crush Rank works").
- Top 3 get 🔥 icon.

Ranking row:

- Rank number.
- Name.
- Optional role/party.
- Match % bar.
- Google Search button.

Rules:

- Hide Crush Rank during freeze mode.
- Hide active-candidate rows during election windows unless counsel has approved the exact release.
- Hide rows below minimum sample threshold.
- Do not show demographic, district-level, or user-segment rankings.

### 5. Battle Mode (Optional / Non-Election Periods Only)

Two figures side by side.

Content:

- "Who would you rather research?"
- Figure A name + Google button.
- Figure B name + Google button.
- `A` / `B` / `Skip this pair` actions.

Rules:

- Fully disabled during any active election window or for any active-candidate roster row.
- Aggregates separately from main Crush Rank.
- No Battle Mode for any pair that includes an active candidate.
- Same sample threshold and freeze-mode rules as Crush Rank.

### 6. How Crush Rank Works (Methodology)

Plain-language explanation:

- What "Crush" and "Pass" count.
- What does not count (romantic preference, political support, vote intent).
- Why some ranks are hidden (sample threshold, election freeze).
- Why this is not a poll.
- How to contact/takedown.

Key line to include verbatim: "Crush Rank measures research interest, not romantic, sexual, electoral, or moral preference."

### 7. Freeze Mode

If enabled:

- Swipe deck can be paused.
- Crush Rank hidden or frozen.
- Match % hidden.
- Battle Mode disabled.
- Show message: "Crush Rank is paused during a sensitive election period."
- Keep methodology/contact pages accessible.
- Disable Match Card Crush Rank link.
- Disable rank snapshot sharing.

## Share Cards

### Match Card

Required:

- App name.
- "I matched with 10 public figures today."
- Date.
- Challenge link.
- Hearts/flames allowed.

Do not include:

- Names of crushed/passed figures.
- Political preference.
- "Winning" or "leading" language.
- Active-candidate or election-window context.

### Crush Rank Snapshot

Required:

- "Crush Rank"
- Subtitle: "Collective research interest — not a poll or endorsement."
- Date range.
- Sample size.

Rules:

- Disabled during election freeze.
- Disabled for active-candidate rosters.

## Visual Direction

- Tinder-style swipe physics: drag, tilt, snap-away decisions.
- Card tilt on drag hints at Crush (warm) vs Pass (cool) — no explicit red/green.
- Hearts (🤍/❤️) and flames (🔥) allowed in Hot Streak and top-3 Crush Rank.
- Red/pink/orange palette for CTAs, streaks, and top-3 Crush Rank rows.
- Typography readable under Thai and English names.
- Large buttons for mobile thumbs.
- Progress ticks, Match Card confetti moment, springy animations.
- Prefer CSS transitions/Web Animations API or a tiny animation helper.
- Respect reduced-motion settings.
- Keep initial JavaScript small; first screen instant on mobile data.
- Avoid campaign-poster aesthetics, party-color dominant chrome, electoral imagery.

## Static Frontend Stack Direction

Preferred frontend shape:

- Vite static build.
- Preact or vanilla TypeScript.
- CSS modules/plain CSS.
- Web Animations API or a small motion helper.
- No Next.js, SSR, server components, or heavyweight routing.

Deployable to Cloudflare Pages, Netlify, GitHub Pages, or any CDN.

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
- User already did Daily Deck today.
- Duplicate tap/swipe.
- Google link fails to open.
- Crush Rank below sample threshold.
- Freeze mode active.
- Battle Mode disabled (election window message).

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
- momentum
- romantic or sexual descriptors applied to any individual figure

Use:

- crush
- pass
- swipe
- daily deck
- crush rank
- match card
- match %
- hot streak
- collective crush energy
- public figure
- research curiosity
