# Backend Implementation Note

Date: 2026-05-21

## Decision

The backend implementation follows the documented static frontend plus Supabase backend shape:

```text
static Vite frontend
  -> Supabase Edge Functions
  -> Postgres tables with RLS enabled
```

Dynamic writes stay behind server-side functions. The public client should not write directly to `swipe_events`, `daily_research_interest_aggregates`, admin tables, or contact tables.

## Data Model

Implemented tables:

- `politicians`
- `consent_records`
- short-retention `swipe_events`
- short-retention `card_impressions`
- `daily_research_interest_aggregates`
- `share_events`
- `takedown_requests`
- `admin_audit_logs`
- short-retention `rate_limit_keys`
- `app_config`

All app tables have RLS enabled and direct `anon` / `authenticated` grants revoked. Edge Functions use the service role and expose only the documented API surface.

## Swipe Recording

`get-deck` also requires the latest current-version consent decision before issuing `card_impressions`, because issued deck state links a visitor to public figures even before a swipe is stored.

`record_swipe_event` is a Postgres transaction boundary. It enforces:

- latest current-version consent decision is accepted
- freeze mode and swipe flag
- active roster entry
- a server-issued, unused card impression for that visitor, day, and public figure
- one action per idempotency key / impression
- 10-card daily limit
- aggregate update in the same transaction
- a transaction-scoped advisory lock for the visitor/day limit check

`Research` increments both `eligible_impressions` and `research_actions`. `Skip` increments `eligible_impressions` and `skip_actions`.

## Ranking

The implemented formula remains:

```text
research_interest_score = research_actions / eligible_impressions
```

Rows below `minimum_ranking_sample_size` are hidden from the public ranking response. `rankings_public` and `election_freeze` can hide rankings globally.

## Privacy And Retention

Visitors use server-signed visitor tokens. The client can hold the token, but cannot mint arbitrary visitor IDs without `VISITOR_SIGNING_SECRET`.

New visitor-token minting requires a server-verified human challenge. The implementation expects Cloudflare Turnstile by default through `TURNSTILE_SECRET_KEY`. If the challenge secret is missing, public token minting fails closed.

Visitor IDs are hashed with `VISITOR_HASH_SALT` before storage. The backend does not store raw IP addresses in analytics tables. Abuse rate-limit keys are derived from request metadata with `ABUSE_HASH_SALT` and stored only as short-retention hashes. Pre-mint abuse limits are deliberately tighter than post-token request limits so one source cannot push a public figure over the sample threshold by minting many visitors.

Raw swipe events and issued card impressions are intended for short retention only. `cleanup-retention` caps the raw event retention window at 7 days even if the environment variable is misconfigured higher.

## Admin And Safety

Admin routes require `ADMIN_API_TOKEN` and write to `admin_audit_logs`.

Roster validation rejects obvious markup and monarchy, royal-family, or royal-institution text. Active candidates can be represented with `active_candidate`, but launch timing and candidate inclusion still require Thai legal review before public use.

## Required Environment

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VISITOR_SIGNING_SECRET`
- `VISITOR_HASH_SALT`
- `ABUSE_HASH_SALT`
- `TURNSTILE_SECRET_KEY`
- `ADMIN_API_TOKEN`
- `PUBLIC_APP_ORIGIN`
- optional `PRIVACY_NOTICE_HASH`
- optional `RAW_EVENT_RETENTION_DAYS`, capped to 7 by the cleanup function
