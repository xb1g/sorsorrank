# Frontend Design Doc: SorsorRank

## Purpose

This document turns the product, safety, growth, and technical docs into a buildable frontend direction. It should guide the next implementation pass before visual polish or backend wiring.

The product is a daily civic research challenge: finish 10 sparse public-figure cards, search externally, share neutral participation, and view aggregate Research Interest Rank after thresholds are met.

## Design Register

SorsorRank is a product interface, not a marketing surface. The design should serve a short mobile task and make the rules legible.

Primary scene: a user opens a friend link on mobile, sees a consent gate, understands that swipes are stored only for aggregate curiosity, completes 10 cards, and shares a neutral completion card.

## North-Star Flow

```text
friend link or direct visit
  -> consent and privacy gate
  -> daily 10-card deck
  -> Google Search handoff as needed
  -> Research or Skip action
  -> completion state
  -> neutral share card
  -> Research Interest Rank
```

The current frontend should be reshaped around this order. Sign-in or account creation should not be the core gate unless a future product decision adds accounts.

## Screen System

### 1. Consent Gate

Goal: earn explicit consent before storing political-interaction data.

Content:

- One-line promise: "Do your 10. Search for yourself. See what people are researching."
- Plain privacy note: swipes are used only for aggregate Research Interest Rank.
- Disclaimer: "Not a poll, endorsement, prediction, approval rating, or voting guide."
- Links: methodology, privacy, contact.
- Actions: `Start my 10`, `Read methodology`, `Decline`.

States:

- Loading consent version.
- Accepted.
- Declined, with read-only methodology access.
- Error accepting consent.
- Offline or slow-network retry.

### 2. Daily Deck

Goal: make 10 sparse decisions fast without implying judgment or endorsement.

Card content:

- Name.
- Optional role or party for disambiguation.
- Google Search button.
- Research action.
- Skip action.
- Progress meter, such as `3/10`.

Interaction:

- Tap buttons are required.
- Swipe gesture is optional enhancement.
- Google Search opens in a new tab.
- Action should lock while the write is pending.
- Duplicate taps should show prior success, not count twice.

States:

- Loading deck.
- No active roster.
- Freeze mode active.
- Already did 10 today.
- Swipe write failed.
- Duplicate swipe.
- Long name.
- Small mobile viewport.
- Reduced motion.

### 3. Daily Done

Goal: create a shareable participation moment, not a preference disclosure.

Content:

- "You did your 10."
- Date.
- Streak count if enabled.
- Share-card preview.
- Actions: `Challenge a friend`, `See Research Interest Rank`, `Come back tomorrow`.

Share-card rules:

- Include app name, date, and challenge link.
- Do not include public-figure names.
- Do not include Research or Skip history.
- Do not imply support, ranking victory, or ideology.

### 4. Research Interest Rank

Goal: show aggregate curiosity with methodology context.

Required elements:

- Title: `Research Interest Rank`.
- Date range.
- Sample size.
- Minimum threshold.
- Methodology link.
- Disclaimer: "Aggregate curiosity, not vote intent."

Row content:

- Rank number.
- Name.
- Optional role or party.
- Research-interest score or quiet bar.
- Google Search button.

Ranking behavior:

- Hide rows below threshold.
- Show freeze state if rankings are paused.
- Avoid "top", "most followed", "winner", "leader", or popularity framing in UI copy.

### 5. Methodology

Goal: make the ranking meaning understandable before public sharing.

Sections:

- What Research counts as.
- What Skip counts as.
- Whether Google clicks are tracked.
- Why low-sample rows are hidden.
- What freeze mode means.
- Raw-event retention policy.
- Contact and takedown path.

### 6. Contact and Takedown

Goal: provide a clear safety path without creating public debate surfaces.

Fields:

- Contact email.
- Request type.
- Public figure or roster item.
- Explanation.
- Optional evidence link.

Do not show public comments or public submissions.

## Visual Direction

The current dark, mint-accented direction is usable, but it should be made less dashboard-like and less victory-coded.

Recommended style:

- Tinted dark neutral base for focus and mobile readability.
- Mint or teal for the Research action and current progress.
- Warm neutral amber for Skip, not red.
- Rounded tactile cards with restrained depth.
- Large touch targets.
- Calm ranking rows with quiet bars.
- No campaign-poster imagery, hearts, flames, or romantic metaphors.

Use OKLCH tokens for the next CSS pass. Avoid pure black, pure white, and decorative glass effects.

## Component Inventory

Core components:

- `AppShell`: top-level route and state holder.
- `ConsentGate`: privacy and consent entry.
- `DailyDeck`: card stack, progress, actions.
- `PublicFigureCard`: sparse card content.
- `GoogleSearchButton`: external research handoff.
- `DailyDone`: completion and sharing.
- `ShareCardPreview`: neutral challenge artifact.
- `ResearchInterestRank`: aggregate ranking list.
- `MethodologyPanel`: explanatory copy.
- `FreezeBanner`: election or review pause state.
- `ContactForm`: takedown path.
- `StatePanel`: loading, empty, error, offline, success.

Existing components to rename or reshape:

- `IntroOverlay` should become a consent-aware entry or be removed.
- `AuthPanel` should become `DailyDone` or `ConsentGate`, unless accounts are deliberately added.
- `LeaderboardPanel` should become `ResearchInterestRank`.
- `SwipeDeckPanel` should remove hosted blurbs and align labels to Research, Skip, and Google Search.

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
};
```

Swipe request:

```ts
type SwipeRequest = {
  politicianId: string;
  action: "research" | "skip";
  impressionId: string;
  idempotencyKey: string;
};
```

Ranking row:

```ts
type RankingRow = {
  politicianId: string;
  displayName: string;
  roleLabel?: string;
  partyLabel?: string;
  eligibleImpressions: number;
  researchActions: number;
  researchInterestScore: number;
  hiddenBelowThreshold: boolean;
};
```

Feature flags:

- `swipe_enabled`.
- `rankings_public`.
- `share_cards_enabled`.
- `election_freeze`.
- `admin_roster_enabled`.

## Motion Rules

Motion should be tactile and functional:

- Drag tilt on card.
- Snap-away after successful action.
- Progress tick after server success.
- Completion burst after card 10.
- Share card slide-up.

Performance and accessibility:

- Animate transform and opacity only.
- Default duration: 160ms to 240ms.
- Respect `prefers-reduced-motion`.
- Do not choreograph page loads.
- Do not animate rankings as a race.

## Copy Rules

Preferred:

- Research.
- Skip.
- Do your 10.
- Research Interest Rank.
- Public figure.
- Aggregate curiosity.
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
- Hot.
- Match.
- Crush.

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
- Current deck data includes explanatory blurbs, which violates sparse-card rules.
- Ranking copy reads too close to popularity tracking.
- Some action colors imply red or green judgment.
- Current auth copy suggests accounts and history before the product docs establish that scope.
- The table-heavy desktop ranking is useful for inspection but should not drive the mobile-first experience.
- Existing screenshots show good tactile polish but need stronger small-mobile and consent states.

## Current Prototype Deviation

The current frontend prototype may temporarily label the two deck actions as `Approve` and
`Disapprove` at the user's request. This is a UI-only deviation for prototype testing.
The visible leaderboard surface may also use `Daily Approval Pulse` language instead of
`Research Interest Rank` while this prototype framing is being tested.
Frontend-facing freeze, threshold, consent, and share-copy states may use `pulse` and
`tap` wording so the prototype stays internally consistent.

Important:

- Internal action semantics and backend contracts remain `research` and `skip`.
- This wording conflicts with the neutral framing in the main product and safety docs.
- Before any public launch or backend coupling, copy should be reviewed and likely restored
  to neutral language.

The current prototype may also:

- show a post-completion login prompt that asks users to save results to the leaderboard
  before real account infrastructure exists;
- show per-politician `Approve` and `Disapprove` trend graphs in the leaderboard UI, even
  though the underlying mock contract is still derived from the existing prototype ranking
  data.

Important:

- These are frontend-only scaffolds for integration planning.
- Real auth and historical trend lines need dedicated backend ownership before launch.

## Build Sequence

1. Replace auth-first and intro-first flow with consent-first flow.
2. Strip deck cards to sparse content.
3. Rename leaderboard language to Research Interest Rank.
4. Add Daily Done with neutral share-card preview.
5. Add methodology, contact, freeze, threshold, no-roster, already-done, duplicate, offline, and error states.
6. Convert visual tokens to OKLCH.
7. Add copy regression checks for banned terms in public UI strings.
8. Add responsive tests for long Thai and English names.

## Non-Negotiable Acceptance Criteria

- User cannot record Research or Skip without consent.
- 10th swipe succeeds and 11th fails.
- Duplicate tap does not double count.
- Skip increments impression, not research count.
- Research increments research count.
- Ranks hide below threshold.
- Freeze mode pauses or hides rankings.
- Public cards do not host claims or summaries.
- Share cards reveal participation only.
- Long names do not break layout.
- Public UI avoids banned terms except in methodology disclaimers or internal docs.
