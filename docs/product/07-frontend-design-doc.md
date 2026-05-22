# Frontend Design Doc: SorsorRank

## Purpose

This document turns the product, safety, growth, and technical docs into a buildable frontend direction. It should guide the next implementation pass before visual polish or backend wiring.

The product is daily political Tinder: swipe your Daily Deck of 10 public-figure cards, tap Google to do your own research, share your Match Card, and see the aggregate Crush Rank.

## Design Register

SorsorRank is a product interface built for group-chat virality on mobile. Tinder ergonomics, civic substance. The design should make the swipe mechanic irresistible and the safety guarantees legible.

Primary scene: a user opens a friend link on mobile, sees a consent gate, understands that swipes are stored only for aggregate curiosity (not romantic or political preference), completes 10 cards, and shares a Match Card to their group chat.

## North-Star Flow

```text
friend link or direct visit
  -> consent and privacy gate
  -> Daily Deck (10 cards, Crush / Pass)
  -> Google Search handoff as needed
  -> completion → Match Card
  -> Challenge a friend
  -> Crush Rank
```

The current frontend should be reshaped around this order. Sign-in or account creation should not be the core gate unless a future product decision adds accounts.

## Screen System

### 1. Consent Gate

Goal: earn explicit consent before storing political-interaction data.

Content:

- One-line promise: "Swipe your 10. Search for yourself. See who Thailand is crushing on."
- Plain privacy note: swipes are used only for aggregate Crush Rank.
- Disclaimer: "Not a poll, endorsement, prediction, or voting guide. Crush = research curiosity, not romantic or political support."
- Links: How Crush Rank works, privacy, contact.
- Actions: `Start my Daily Deck`, `How Crush Rank works`, `Decline`.

States:

- Loading consent version.
- Accepted.
- Declined, with read-only methodology access.
- Error accepting consent.
- Offline or slow-network retry.

### 2. Daily Deck

Goal: make 10 fast swipe decisions without implying endorsement, romantic preference, or moral judgment.

Card content:

- Name.
- Optional role or party for disambiguation.
- Google Search button.
- `Crush` action (swipe right or tap).
- `Pass` action (swipe left or tap).
- Progress meter: `3/10`.
- Match % (above sample threshold only): "72% of today's swipers crushed on this person — not a poll."

Interaction:

- Tinder-style swipe gesture required.
- Tap buttons required as fallback.
- Google Search opens in a new tab.
- Action should lock while the write is pending.
- Duplicate taps should show prior success, not count twice.
- Card tilt on drag hints at Crush (warm/right) vs Pass (cool/left) — no explicit red/green judgment.

States:

- Loading deck.
- No active roster.
- Freeze mode active.
- Already did Daily Deck today.
- Swipe write failed.
- Duplicate swipe.
- Long name.
- Small mobile viewport.
- Reduced motion.

### 3. Match Card (Daily Done)

Goal: create a shareable swipe-participation moment, not a preference disclosure.

Content:

- "You swiped your Daily Deck."
- Date.
- Hot Streak count with 🔥 icon.
- Match Card preview.
- Actions: `Challenge a friend`, `See today's Crush Rank`, `Come back tomorrow`.
- Optional: Match % reveal for each of today's cards.

Share-card rules:

- Include app name, date, and challenge link.
- Do not include public-figure names.
- Do not include Crush or Pass history.
- Do not imply support, romantic preference, ranking victory, or ideology.
- Hearts and flames allowed.

### 4. Crush Rank

Goal: show collective research interest with methodology context.

Required elements:

- Title: `Crush Rank`.
- Subtitle: "Collective research interest — not a poll or endorsement."
- Date range.
- Sample size.
- Minimum threshold note.
- Methodology link ("How Crush Rank works").
- Disclaimer: "Crush = research curiosity, not romantic, sexual, electoral, or moral preference."

Row content:

- Rank number.
- Name.
- Optional role or party.
- Match % bar.
- 🔥 icon for top 3.
- Google Search button.

Ranking behavior:

- Hide rows below threshold.
- Show freeze state if rankings are paused.
- Avoid "winner", "leader", "most popular", or "most supported" in UI copy.

### 5. Battle Mode (Outside Election Windows Only)

Goal: secondary engagement mechanic — two figures side-by-side.

Content:

- "Who would you rather research?"
- Figure A name + Google button.
- Figure B name + Google button.
- `A` / `B` / `Skip this pair` actions.

Rules:

- Fully disabled during any active election window or for any active-candidate roster row.
- Separate aggregate from main Crush Rank.
- Same sample threshold and freeze-mode rules as Crush Rank.
- Show "Battle Mode is paused during the election period" message when frozen.

### 6. How Crush Rank Works (Methodology)

Goal: make the ranking meaning understandable before public sharing.

Sections:

- What Crush counts as (research interest — user chose to look this person up).
- What Pass counts as (an impression, not a signal).
- Key line verbatim: "Crush Rank measures research interest, not romantic, sexual, electoral, or moral preference."
- Whether Google clicks are tracked.
- Why low-sample rows are hidden.
- What freeze mode means.
- Raw-event retention policy.
- Contact and takedown path.

### 7. Contact and Takedown

Goal: clear safety path without public debate surfaces.

Fields:

- Contact email.
- Request type.
- Public figure or roster item.
- Explanation.
- Optional evidence link.

Do not show public comments or public submissions.

## Visual Direction

Tinder-for-politics energy with civic guardrails.

Recommended style:

- Tinted dark neutral base for focus and mobile readability.
- Hot pink or coral for the Crush action and progress.
- Cool blue-gray for Pass.
- Warm amber/orange for Hot Streak and top-3 Crush Rank flames.
- Rounded tactile cards with depth — feels physical and swipeable.
- Large touch targets.
- Crush Rank rows with Match % bars; top 3 get 🔥.
- Hearts (❤️ / 🤍) and flames (🔥) allowed in Hot Streak and Match Card.

Avoid:

- Campaign-poster imagery.
- Party-color dominant chrome.
- Electoral flag aesthetics as primary UI element.
- Romantic or sexual descriptors applied to any individual figure in UI copy.
- Pure black, pure white, heavy glass effects.

Use OKLCH tokens for the CSS pass.

## Component Inventory

Core components:

- `AppShell`: top-level route and state holder.
- `ConsentGate`: privacy and consent entry.
- `DailyDeck`: card stack, progress, actions.
- `PublicFigureCard`: sparse card content with Match %.
- `GoogleSearchButton`: external research handoff.
- `MatchCard` (was `DailyDone`): completion and sharing.
- `ShareCardPreview`: Match Card artifact.
- `CrushRank` (was `ResearchInterestRank`): aggregate ranking list.
- `BattleMode`: two-figure side-by-side (disabled in election windows).
- `MethodologyPanel` ("How Crush Rank works"): explanatory copy.
- `FreezeBanner`: election or review pause state.
- `ContactForm`: takedown path.
- `StatePanel`: loading, empty, error, offline, success.

Existing components to rename or reshape:

- `IntroOverlay` → consent-aware entry or remove.
- `AuthPanel` → `MatchCard` / `ConsentGate`; remove unless accounts are deliberately added.
- `LeaderboardPanel` → `CrushRank`.
- `SwipeDeckPanel` → strip hosted blurbs; align labels to Crush, Pass, Google Search.

## Data Contract For Frontend

Deck card:

```ts
type DeckCard = {
  id: string;
  displayName: string;
  roleLabel?: string;
  partyLabel?: string;
  searchQuery: string;
  impressionId: string;
  matchPercent?: number;       // null if below threshold
  matchPercentLabel?: string;  // "not a poll" disclaimer text
};
```

Swipe request:

```ts
type SwipeRequest = {
  politicianId: string;
  action: "crush" | "pass";
  impressionId: string;
  idempotencyKey: string;
};
```

Crush Rank row:

```ts
type CrushRankRow = {
  politicianId: string;
  displayName: string;
  roleLabel?: string;
  partyLabel?: string;
  eligibleImpressions: number;
  crushActions: number;
  crushRankScore: number;   // crush_actions / eligible_impressions
  matchPercent: number;     // crushRankScore * 100
  hiddenBelowThreshold: boolean;
};
```

Battle Mode pair result:

```ts
type BattlePairResult = {
  pairId: string;
  figureA: { politicianId: string; displayName: string; crushPercent: number };
  figureB: { politicianId: string; displayName: string; crushPercent: number };
  hiddenBelowThreshold: boolean;
};
```

Feature flags:

- `swipe_enabled`
- `crush_rank_public`
- `share_cards_enabled`
- `election_freeze`
- `battle_mode_enabled`
- `admin_roster_enabled`

## Motion Rules

Motion should feel like Tinder — physical, tactile, immediate:

- Drag tilt on card (left = Pass hint, right = Crush hint).
- Snap-away after successful action with directional velocity.
- Heart/flame particle burst on Crush action (optional, reduced-motion off).
- Progress tick after server success.
- Completion burst (confetti/hearts) after card 10.
- Match Card slide-up.

Performance and accessibility:

- Animate transform and opacity only.
- Default duration: 160ms to 240ms.
- Respect `prefers-reduced-motion`: snap without particle effects.
- Do not choreograph page loads.
- Do not animate Crush Rank as a race.

## Copy Rules

Preferred:

- Crush.
- Pass.
- Swipe your 10.
- Daily Deck.
- Crush Rank.
- Match Card.
- Match %.
- Hot Streak.
- Collective crush energy.
- Public figure.
- Research curiosity.
- Not a poll or endorsement.

Banned in public UI and share copy:

- Vote.
- Support.
- Endorse.
- Best.
- Winner.
- Leading.
- Approval.
- Odds.
- Prediction.
- Momentum.
- Romantic or sexual descriptors applied to any individual figure.

## Current Repo Findings

Source files read:

- `src/App.tsx`.
- `src/components/AuthPanel.tsx`.
- `src/components/IntroOverlay.tsx`.
- `src/components/LeaderboardPanel.tsx`.
- `src/components/SwipeDeckPanel.tsx`.
- `src/components/icons.tsx`.
- `src/data/mockPoliticians.ts`.
- `src/services/api.ts`.
- `src/styles.css`.
- `src/types.ts`.

Design issues to fix before shipping:

- Consent is not the first gate in the current flow.
- Current deck data includes explanatory blurbs (violates sparse-card rules).
- Ranking copy reads too close to popularity tracking.
- Some action colors imply red/green moral judgment.
- Current auth copy suggests accounts and history before that scope is decided.
- Table-heavy desktop ranking should not drive mobile-first experience.
- Swipe action names need to align with Crush / Pass vocabulary.

## Current Prototype Deviation

The current prototype may use `Approve`/`Disapprove` or `Research`/`Skip` labels. Backend contracts should be updated to `crush`/`pass` before launch. All public-facing copy should use Crush Rank vocabulary. Internal mechanics and aggregate semantics are unchanged: Crush = research interest signal, Pass = impression with no positive signal.

## Build Sequence

1. Replace auth-first and intro-first flow with consent-first flow.
2. Strip deck cards to sparse content (no blurbs or summaries).
3. Add Tinder-style swipe physics; relabel actions to Crush / Pass.
4. Add Match % display per card (above threshold, labeled "not a poll").
5. Rename leaderboard to Crush Rank; add Match % bars and 🔥 top-3 icons.
6. Rename completion screen to Match Card; add Hot Streak with 🔥 icon.
7. Add Battle Mode screen (disabled during election windows).
8. Add methodology, contact, freeze, threshold, no-roster, already-done, duplicate, offline, and error states.
9. Convert visual tokens to OKLCH; apply warm/cool Crush/Pass palette.
10. Add copy regression checks for banned terms in public UI strings.
11. Add responsive tests for long Thai and English names.

## Non-Negotiable Acceptance Criteria

- User cannot record Crush or Pass without consent.
- 10th swipe succeeds and 11th fails.
- Duplicate tap does not double count.
- Pass increments impression, not crush count.
- Crush increments crush count.
- Crush Rank hides below threshold.
- Match % hides below threshold; label reads "not a poll".
- Freeze mode pauses or hides Crush Rank, Match %, Battle Mode, and Match Card Crush Rank link.
- Battle Mode fully disabled during any active election window.
- Public cards do not host claims or summaries.
- Match Cards reveal participation only (no figure names, no Crush/Pass history).
- Long names do not break layout.
- Public UI avoids banned terms except in methodology disclaimers.
