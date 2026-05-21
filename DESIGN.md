# Design

## Summary

SorsorRank is a mobile-first civic research product with a calm game feel. The design system should make the daily 10 feel quick and tactile while keeping political framing neutral, sparse, and legally cautious.

Physical scene: a user opens a group-chat link on a phone in bright ambient light, understands the consent promise in under 10 seconds, finishes 10 cards with thumb-sized controls, and shares that they participated without disclosing political preference.

## Design Goals

- Make the daily 10 feel finishable, not heavy.
- Keep every public-figure card sparse and claim-free.
- Put Google Search handoff before the Research or Skip decision.
- Make consent, methodology, thresholds, and freeze mode visible without killing momentum.
- Make rankings feel like aggregate curiosity, not a race.

## Color

Use a restrained product palette with one primary accent and two neutral layers. Define colors as OKLCH tokens before the next visual pass.

Recommended token direction:

```css
:root {
  --surface-page: oklch(15% 0.018 230);
  --surface-panel: oklch(20% 0.016 230);
  --surface-raised: oklch(25% 0.018 230);
  --text-primary: oklch(96% 0.006 230);
  --text-secondary: oklch(76% 0.018 235);
  --text-muted: oklch(63% 0.02 235);
  --accent-research: oklch(78% 0.14 160);
  --accent-skip: oklch(72% 0.08 58);
  --border-subtle: oklch(38% 0.02 230 / 0.55);
  --focus-ring: oklch(82% 0.13 190);
}
```

Rules:

- Do not use pure black or pure white.
- Do not use red and green as a moral pair for Research and Skip.
- Research can use mint or teal as an action accent.
- Skip should be neutral-warm, not danger red.
- Ranking bars and sparklines should avoid race or victory language. Prefer one calm accent with muted comparison marks.

## Typography

Use `Noto Sans Thai` for Thai readability and a neutral Latin fallback. Inter is acceptable for Latin text if weights and spacing are tuned.

Type scale:

- Display: 40px, 46px line height, 800 weight, only for landing or done-state hero copy.
- Screen title: 28px, 34px line height, 800 weight.
- Section title: 20px, 28px line height, 700 weight.
- Body: 16px, 26px line height, 500 weight.
- Label: 12px, 16px line height, 700 weight, letter spacing only for short English labels.
- Button: 16px to 18px, 700 or 800 weight.

Rules:

- Cap prose at 65 to 75 characters per line.
- Do not use display styling for table labels, consent notes, or methodology text.
- Long Thai and English names must wrap cleanly without clipping.

## Layout

Primary layout is a single-column mobile task flow:

1. Consent gate.
2. Daily 10 deck.
3. Done state with neutral share card.
4. Research Interest Rank.
5. Methodology and contact paths.

Desktop can widen the ranking page, but the deck should stay focused and phone-shaped rather than becoming a giant dashboard.

Spacing rhythm:

- Page padding: 16px mobile, 24px tablet, 32px desktop.
- Panel padding: 20px mobile, 24px desktop.
- Touch target minimum: 44px, preferred 52px for primary actions.
- Card corner radius: 28px mobile, 32px for share preview.
- Dense ranking rows: 64px to 76px, with role text allowed to wrap.

Avoid nested cards unless the inner object is a real artifact, such as a share-card preview.

## Components

### Consent Gate

Purpose: obtain explicit consent before storing swipe actions.

Required content:

- "Do your 10. Search for yourself. See what people are researching."
- Clear notice that SorsorRank is not a poll, endorsement, prediction, approval rating, or voting guide.
- Purpose statement: swipes are used only for aggregate Research Interest Rank.
- Links to methodology, privacy, and contact.

States:

- Loading consent version.
- Consent accepted.
- Consent declined with read-only methodology path.
- Consent API error.
- Offline or slow-network retry.

### Daily Deck

Required card content:

- Name.
- Optional role or party for disambiguation.
- Google Search button.
- Research action.
- Skip action.
- Progress meter.

Rules:

- No bios, blurbs, allegations, accusations, snippets, or AI summaries.
- Google Search must be visible before Research or Skip.
- Buttons must work without gestures.
- Swipe gesture can be additive, but should not be required.
- The 10th card leads to Daily Done. The 11th action must be blocked server-side and represented clearly.

### Daily Done

Purpose: reward completion and create neutral sharing.

Required content:

- "You did your 10."
- Date.
- Streak if available.
- Share-card preview.
- "Challenge a friend" action.
- "See Research Interest Rank" action.

The share preview must not include names, skipped people, researched people, political preference, support language, or candidate-specific imagery.

### Rankings

Title: `Research Interest Rank`.

Required context:

- Date range.
- Sample size.
- Minimum sample threshold.
- Methodology link.
- Disclaimer: "Aggregate curiosity, not vote intent."

Rows:

- Rank number.
- Name.
- Optional role or party.
- Research-interest score or quiet bar.
- Google Search button.

Avoid:

- Big winner styling.
- Leaderboard celebration language.
- Red or green up/down morality.
- "Top politicians people follow" copy.
- Sparklines that imply prediction or race momentum unless methodology explicitly supports trend history.

### Methodology

Write in plain language:

- What Research means.
- What Skip means.
- What Google clicks do and do not affect.
- Why low-sample rows are hidden.
- Why rankings can be frozen.
- How to contact or request takedown.

### Freeze Mode

Show an inline banner or full deck pause state:

"Research rankings are paused during a sensitive election period."

Keep methodology and contact accessible. Avoid alarmist language.

## Motion

Motion should convey state:

- Drag with slight card tilt.
- Snap-away after action.
- Progress tick after successful write.
- Completion burst after the 10th card.
- Share preview slide-up.

Rules:

- Animate `transform` and `opacity`, not layout properties.
- Default duration: 160ms to 240ms.
- Use ease-out quart or similar.
- Respect `prefers-reduced-motion`.
- Do not animate rankings as a competition.

## Copy

Use:

- Research.
- Skip.
- Do your 10.
- Research Interest Rank.
- Public figure.
- Aggregate curiosity.
- Not a poll or endorsement.

Avoid in public UI and share copy:

- Vote.
- Support.
- Endorse.
- Best.
- Winner.
- Leading.
- Approval.
- Odds.
- Prediction.
- Hot.
- Match.
- Crush.

## Current UI Corrections

The existing implementation is visually polished but should be corrected before shipping:

- Move consent before any stored swipe action. Current auth flow appears after 10 cards, which conflicts with the product docs.
- Remove hosted card blurbs from deck data. Cards should not host summaries or explanatory political copy beyond role or party.
- Rename ranking copy away from popularity framing. Use Research Interest Rank and aggregate curiosity language.
- Soften Skip color away from red or danger semantics.
- Replace login and signup chrome with consent, methodology, and challenge entry until real accounts are part of product scope.
- Add explicit freeze, threshold, empty, offline, duplicate-swipe, and already-done states.
- Replace hex and rgba tokens with OKLCH design tokens in the next CSS pass.

## Implementation Notes

- Keep Vite plus Preact.
- Keep plain CSS or CSS modules.
- Do not add Next.js, SSR, server components, heavy routers, or large animation libraries for v1.
- Server-owned actions must cover consent, deck, swipes, rankings, share creation, contact, admin roster, and freeze mode.
- Client-side mock data is acceptable only for prototypes. Production ranking and daily limits need server-side enforcement.
