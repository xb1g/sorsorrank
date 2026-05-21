# Technical Plan

This is implementation guidance, not a final framework choice. The repo is currently greenfield, so the first engineering plan should choose the stack and map these concepts into concrete files.

## Core Objects

### Politician

Fields:

- `id`
- `display_name`
- `slug`
- `role_label`
- `party_label`
- `status`: draft, active, archived
- `search_query`
- `created_at`
- `updated_at`

Rules:

- No bios.
- No allegations.
- No long descriptions.
- Escape all display text.

### Consent Record

Fields:

- `id`
- `visitor_key`
- `consent_version`
- `accepted_at`
- `declined_at`

Rules:

- Swipes require accepted consent.
- Re-consent when privacy copy changes.

### Swipe Event

Short-retention event for abuse prevention and debugging.

Fields:

- `id`
- `visitor_key_hash`
- `politician_id`
- `action`: research, skip
- `card_impression_id`
- `occurred_on`
- `created_at`

Rules:

- 7-day retention recommended.
- Idempotency key prevents double-counting.
- Do not store raw IP in analytics tables.

### Daily Aggregate

Fields:

- `date`
- `politician_id`
- `eligible_impressions`
- `research_actions`
- `skip_actions`

Rank formula:

```
research_interest_score = research_actions / eligible_impressions
```

Hide rows below minimum sample threshold.

### Share Event

Fields:

- `id`
- `visitor_key_hash`
- `share_type`: completion, streak, rank_snapshot
- `created_at`

Rules:

- Do not store politician preference in share events.

### Admin Audit Log

Fields:

- `id`
- `admin_id`
- `action`
- `target_type`
- `target_id`
- `metadata`
- `created_at`

## Routes / API Shape

Suggested routes:

- `GET /` - landing/consent/deck entry.
- `POST /consent` - accept/decline versioned consent.
- `GET /deck` - next eligible cards.
- `POST /swipes` - record research/skip action.
- `GET /rankings` - public aggregate ranking.
- `GET /methodology` - plain-language methodology.
- `GET /contact` - takedown/contact page.
- `POST /contact` - submit request.
- `GET /share/:id` - share landing page.
- `GET /admin/roster` - admin roster.
- `POST /admin/roster` - create/update roster entries.
- `POST /admin/freeze` - toggle freeze mode.

## Data Flow

```
visitor
  -> consent
  -> deck card
  -> Google Search optional
  -> research/skip
  -> raw short-retention event
  -> daily aggregate
  -> rank page
  -> share card
```

## Error Handling

Required named errors:

- `ConsentRequiredError`
- `DailyLimitExceededError`
- `DuplicateSwipeError`
- `PoliticianNotFoundError`
- `FreezeModeActiveError`
- `InsufficientSampleError`
- `RateLimitExceededError`
- `UnauthorizedAdminError`

Every error needs:

- user-visible message
- structured log
- test coverage

## Feature Flags

- `swipe_enabled`
- `rankings_public`
- `share_cards_enabled`
- `election_freeze`
- `admin_roster_enabled`

## Observability

Metrics:

- consent accept rate
- deck starts
- 10-card completion rate
- research action rate
- skip action rate
- Google Search click rate
- share creation rate
- share visitor conversion
- daily active swipers
- rank page views
- duplicate swipe rejects
- daily limit hits
- freeze mode toggles
- takedown requests

Do not log full raw political preference histories.

## Test Plan

Unit tests:

- rank formula
- sample threshold
- daily limit
- duplicate/idempotency handling
- consent versioning
- retention cleanup

Integration tests:

- cannot swipe without consent
- 10th swipe succeeds, 11th fails
- research action increments aggregate
- skip action increments impression but not research count
- freeze mode pauses or hides ranking
- rank below sample threshold hidden

Frontend/system tests:

- mobile swipe flow
- tap-button fallback
- long-name layout
- share completion card after 10
- user already done today
- declined-consent read-only path

Security tests:

- XSS in roster names
- unauthorized admin access
- direct object reference attempts
- rate-limit abuse
- copy regression for banned terms

## Rollout

1. Build private alpha with small roster.
2. Verify data retention and aggregation.
3. Test share cards in group chats.
4. Add methodology/contact pages.
5. Enable public rank only after threshold and review.
6. Keep freeze mode ready before any larger public launch.
