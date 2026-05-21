# Technical Plan

This is implementation guidance for a static-hosted, mobile-first app. The frontend should stay lightweight: Vite static build, Preact or vanilla TypeScript, no Next.js/SSR requirement. Dynamic behavior lives behind a small serverless/BaaS API.

Pure static hosting alone is not enough for real daily limits, aggregate rankings, abuse prevention, takedown intake, or admin roster controls. The recommended shape is:

```text
static mobile frontend
  -> tiny serverless/BaaS API
  -> database + retention cleanup
```

Recommended default stack:

- Frontend: Vite + Preact or vanilla TypeScript.
- Hosting: static hosting/CDN.
- Backend: Supabase Edge Functions plus Postgres/RLS, or Cloudflare Pages Functions plus D1/KV.
- First recommendation: Supabase, because the product needs relational aggregates, retention jobs, and simple admin data sooner than it needs global edge coordination.

Do not expose direct client writes to sensitive tables. Put swipe recording, rate limiting, and aggregate updates behind server-side functions.

Compliance default: private alpha can exist before final legal review only if public rankings are off, active candidates are excluded, share cards are neutral, and no paid or targeted growth is running. Public rankings, active-candidate coverage, Google-click tracking, paid promotion, or Thailand-targeted growth require counsel approval.

## Core Objects

### Politician

Fields:

- `id`
- `display_name`
- `slug`
- `role_label`
- `party_label`
- `roster_category`: officeholder, former_officeholder, party_official, active_candidate, other_public_figure
- `is_active_candidate`
- `election_jurisdiction`
- `legal_review_status`: pending, approved, rejected
- `royal_exclusion_checked_at`
- `source_url`
- `reviewed_by`
- `reviewed_at`
- `status`: draft, active, archived
- `search_query`
- `created_at`
- `updated_at`

Rules:

- No bios.
- No allegations.
- No long descriptions.
- Escape all display text.
- Search query is neutral: name plus optional role/party only.
- Active candidates cannot become publicly rankable without approved legal review.
- Monarchy, royal family, and royal-institution content is blocked at roster review.

### Consent Record

Fields:

- `id`
- `visitor_key`
- `consent_version`
- `privacy_notice_version`
- `accepted_at`
- `declined_at`
- `withdrawn_at`
- `deletion_requested_at`

Rules:

- Swipes require accepted consent.
- Re-consent when privacy copy changes.
- Declined consent should not create a persistent server-side visitor profile beyond what is needed for security/rate limiting.

### Swipe Event

Short-retention event for abuse prevention and debugging.

Fields:

- `id`
- `visitor_key_hash`
- `politician_id`
- `action`: research, skip
- `card_impression_id`
- `idempotency_key`
- `occurred_on`
- `created_at`
- `expires_at`

Rules:

- 7-day retention recommended.
- Idempotency key prevents double-counting.
- Do not store raw IP in analytics tables.
- Hash visitor keys with an application secret and rotate any rate-limit salts.
- Do not persist raw user-agent strings in swipe analytics.
- Do not store Google Search clicks in MVP.

### Daily Aggregate

Fields:

- `date`
- `politician_id`
- `eligible_impressions`
- `eligible_unique_visitors`
- `research_actions`
- `skip_actions`
- `minimum_sample_met`
- `publication_status`: hidden, public, frozen

Rank formula:

```
research_interest_score = research_actions / eligible_impressions
```

Hide rows below minimum sample threshold.

Default public threshold:

- At least 100 eligible consented card impressions per public figure per ranking period.
- No active-candidate row is public during an election window unless counsel approves the exact release.
- No demographic, district-level, or micro-geographic breakdowns.

### Share Event

Fields:

- `id`
- `visitor_key_hash`
- `share_type`: completion, streak, rank_snapshot
- `created_at`

Rules:

- Do not store politician preference in share events.
- Rank snapshot sharing is disabled during election freeze.
- Completion cards must not include names or action history.

### Takedown Request

Fields:

- `id`
- `requester_contact`
- `request_type`: takedown, correction, data_subject_request, legal_order, election_authority_request, other
- `affected_entity_type`
- `affected_entity_id`
- `message`
- `status`: open, hidden_pending_review, resolved, rejected
- `created_at`
- `resolved_at`

Rules:

- Hide or freeze affected public content pending counsel review when the request alleges illegality, election influence, defamation, monarchy/royal-institution content, or sensitive personal data misuse.
- Preserve legal orders and authority requests in the audit log.

### Compliance Review

Fields:

- `id`
- `review_type`: roster, copy, launch, election_window, vendor, data_flow
- `target_type`
- `target_id`
- `status`: pending, approved, rejected
- `reviewer_id`
- `notes`
- `created_at`
- `approved_at`

Rules:

- Public rankings require approved launch and copy reviews.
- Active-candidate coverage requires approved roster and election-window reviews.
- Vendor changes touching personal data require data-flow review.

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
- `GET /privacy` - privacy notice and data rights.
- `POST /privacy/request` - data-subject request intake.
- `GET /admin/compliance` - admin compliance review queue.
- `POST /admin/compliance` - approve/reject compliance review.

For static hosting, `GET` routes can be client-side routes served by the static app. Mutations should map to serverless functions:

- `accept-consent`
- `get-deck`
- `record-swipe`
- `get-rankings`
- `create-share`
- `submit-contact`
- `submit-privacy-request`
- `admin-roster`
- `admin-freeze`
- `admin-compliance`

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

Do not create a server-side card impression, share event, persistent visitor key, or Google-click event before consent. If the app needs a pre-consent demo, it must be local-only and must not update aggregates.

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
- `LegalReviewRequiredError`
- `ActiveElectionFreezeError`
- `DataSubjectRequestError`

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
- `active_candidate_roster_enabled`
- `public_rank_active_candidates_enabled`
- `google_click_tracking_enabled`
- `paid_growth_enabled`
- `compliance_review_required`

Safe defaults:

- `rankings_public=false` in private alpha.
- `active_candidate_roster_enabled=false`.
- `public_rank_active_candidates_enabled=false`.
- `google_click_tracking_enabled=false`.
- `paid_growth_enabled=false`.
- `compliance_review_required=true`.

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
Keep infrastructure/security logs separate from political interaction analytics. If counsel requires computer-traffic retention, satisfy it in access-controlled security logs and do not join those logs to swipe behavior for analytics.

## Test Plan

Unit tests:

- rank formula
- sample threshold
- daily limit
- duplicate/idempotency handling
- consent versioning
- retention cleanup
- legal-review gate
- active-candidate election-window gate
- privacy withdrawal/deletion request intake

Integration tests:

- cannot swipe without consent
- 10th swipe succeeds, 11th fails
- research action increments aggregate
- skip action increments impression but not research count
- freeze mode pauses or hides ranking
- rank below sample threshold hidden
- active candidate is hidden during election freeze
- public ranking cannot publish without approved compliance review
- Google click tracking is off by default
- privacy request creates a reviewable ticket

Frontend/system tests:

- mobile swipe flow
- tap-button fallback
- long-name layout
- share completion card after 10
- user already done today
- declined-consent read-only path
- consent withdrawal path
- freeze-mode share disabling

Security tests:

- XSS in roster names
- unauthorized admin access
- direct object reference attempts
- rate-limit abuse
- copy regression for banned terms
- neutral search-query validation
- no pre-consent server writes
- no raw IP or raw user-agent in swipe analytics

## Rollout

1. Build private alpha with small roster.
2. Keep public ranks off and exclude active candidates.
3. Verify consent, withdrawal, data retention, and aggregation.
4. Test share cards in group chats without public-figure names.
5. Add methodology/contact/privacy pages.
6. Complete legal, roster, vendor, and election-calendar reviews.
7. Enable public rank only after threshold and review.
8. Keep freeze mode ready before any larger public launch.

## Architecture Decision

Chosen direction: **static frontend plus serverless/BaaS backend**.

Rejected:

- Pure static only: cannot safely store aggregates or enforce daily limits.
- Next.js full-stack app: heavier than needed for this product and not required for static hosting.
- Direct frontend-to-database writes for swipes: too easy to abuse and too risky for sensitive political interaction data.
