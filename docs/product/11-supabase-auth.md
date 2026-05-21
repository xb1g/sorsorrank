# Supabase Auth Decision

Date: 2026-05-21

## Decision

Use Supabase Auth for both:

- anonymous visitor sessions for the low-friction daily 10 flow; and
- optional email/password account creation for visitors who want to return to the same streak/session.

Accounts must not become public political profiles. The Auth user exists to give the browser a Supabase-issued session and JWT before consent-backed actions are stored.

## Why Anonymous First

- It keeps the consent-first daily 10 flow low-friction.
- It avoids collecting email, phone, or social identity for a sensitive civic interaction.
- It lets Edge Functions verify a Supabase Auth JWT instead of trusting client-generated visitor IDs.
- It preserves the existing server-side consent, deck, swipe, ranking, and share function boundaries.

## Account Creation

The public app can offer optional email/password sign up and sign in through Supabase Auth.

Rules:

- Do not require an account before the consent gate.
- Do not show public user profiles.
- Do not expose personal political labels, badges, or choice histories.
- If the visitor already has an anonymous session, convert that session with `auth.updateUser({ email, password })` so the same Supabase user ID can continue.
- Keep email confirmation enabled unless counsel and security review approve a different setting.

## Backend Contract

The public client still does not write directly to application tables. Edge Functions remain the only write surface for:

- consent records
- card impressions
- swipe events
- daily aggregates
- share events
- contact/takedown requests

Functions accept either:

- a verified Supabase Auth JWT from an anonymous session; or
- the existing server-signed visitor token fallback.

In both cases, the stored key remains a salted visitor hash. Raw Supabase user IDs are not stored in app tables.

## Required Setup

Frontend env:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
VITE_TURNSTILE_SITE_KEY=YOUR_TURNSTILE_SITE_KEY
```

Supabase project setup:

- Enable anonymous sign-ins in Supabase Auth.
- Configure CAPTCHA/Turnstile for anonymous sign-ins when public traffic is allowed.
- Keep Row Level Security enabled and direct table grants revoked.
- Keep Edge Function writes behind the service-role server path.
- Keep fallback visitor-token minting rate-limited separately from Supabase Auth JWT traffic.

## Product Boundary

User-facing framing should remain consent, privacy, daily research participation, and aggregate curiosity. Account copy should be limited to returning to the same streak/session.
