# Featured Roster Images

Date: 2026-05-21

## Decision

The private-alpha "20-50 well-known public figures" roster is treated as an internal featured deck priority, not as a public popularity ranking.

The frontend may show a portrait image when all of these are true:

- the image URL is stored in `politicians.image_url`;
- the image source is stored in `politicians.image_source_url`;
- the image resolves from Wikimedia/Wikidata or another reviewable source;
- the card still contains only name, optional role/party, Google Search, Research, and Skip.

The app must not display hosted biographies, claims, allegations, search snippets, AI summaries, or editorial descriptions next to these images.

## Database Fields

Featured roster metadata lives on `public.politicians`:

- `image_url`
- `image_source_url`
- `info_source_url`
- `featured_priority`

`featured_priority` controls deck ordering for alpha testing. It must not be labeled as popularity, public support, endorsement, or rank.

## Import

`scripts/import-featured-politicians.ps1` reads the existing local seed list in `src/data/mockPoliticians.ts`, resolves image/source metadata through Wikidata where available, and upserts rows into `public.politicians`.

By default, these legacy featured-seed rows are imported as `status = archived` with no `featured_priority`. They are kept only as a reviewed image/source reserve. They must not replace the current CSV-backed active roster.

The active public deck is sourced from `scripts/import-members-csv.ps1` using the Parliament CSV import, currently `roster_version = 27`. Blank CSV `end_date` values become active rows; non-blank `end_date` values become archived rows.

To activate the legacy featured seed for a limited internal test, run the script with `-ActivateLegacySeed` and document the reason before using it.

Seed roles are normalized before import. Current offices are only shown when verified enough for the alpha roster; otherwise the role label is the neutral `Public political figure`. Party labels from the old frontend seed are not imported because they can drift and are not needed for the sparse card.

The script keeps the same roster safety guardrails as the backend:

- no markup fields;
- no monarchy, royal family, royal institution, or Privy Council framing;
- no active-candidate flag by default;
- `legal_reviewed_at` remains null.

## Public UI

Images are identity aids only. They do not change the research-interest formula and should not be used in share copy.
