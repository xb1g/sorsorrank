# Roster CSV Import

Date: 2026-05-21

## Sources

Local CSV: `C:\Users\volko\Downloads\สภาผู้แทนราษฎร-27-members.csv`

The file is treated as roster data only. It is not used for biographies, claims, snippets, allegations, summaries, or user-facing political analysis.

Preferred source for the current House roster is Politigraph GraphQL:

- Endpoint: `https://politigraph.wevis.info/graphql`
- Default assembly: `สภาผู้แทนราษฎร-27`
- Import command: `npm run supabase:import-politigraph -- --dry-run`
- Production import: `npm run supabase:import-politigraph`
- By default, a successful Politigraph import archives older active `roster_version = 27` rows that do not have a `politigraph_membership_id`, preventing duplicate active cards for the same people. Use `-- --keepExistingActive` only for isolated testing.

Politigraph usage limits must be respected: at most 30 requests per 10 seconds, batched request limit 5 operations, alias limit 10 per operation, query depth limit 10, token limit 1,000 per request, and at most 1,000 nodes per query for high-volume types. The importer uses paginated single-operation requests and waits between pages.

Politigraph data is CC BY-NC 4.0. Use requires attribution to WeVis and non-commercial compatibility review before any monetized launch.

## Mapping

CSV rows map into `public.politicians`:

- `prefix + name` -> `display_name`
- `role`, `label`, `province`, `district_number`, `list_number` -> `role_label`
- `party` -> `party_label`
- `display_name`, `role`, `party`, `province` -> `search_query`
- blank `end_date` -> `status = active`
- non-blank `end_date` -> `status = archived`
- `active_candidate = false`
- `legal_reviewed_at = null`
- `roster_version = 27`

Only `status = active` rows are eligible for daily deck cards.

## Politigraph Mapping

GraphQL `Membership` rows for the House member post map into `public.politicians`:

- `Person.prefix + Person.name` -> `display_name`
- `Membership.label`, `province`, `district_number`, `list_number` -> `role_label`
- member `Organization` with `classification = POLITICAL_PARTY` -> `party_label`
- `Person.image` -> `image_url`
- `https://politigraph.wevis.info/` -> `image_source_url`
- Parliament Watch House 27 member page -> `info_source_url`
- `Person.id` -> `politigraph_person_id`
- `Membership.id` -> `politigraph_membership_id`
- blank `end_date` -> `status = active`
- non-blank `end_date` -> `status = archived`

Recent `Person.votes` rows map into `public.politician_vote_records` for the expanded public-record drawer:

- `VoteEvent.id` -> `vote_event_id`
- `VoteEvent.title` -> `title`
- `VoteEvent.start_date` -> `start_date`
- `Vote.option` -> `option`
- first HTTPS `VoteEvent.links.url`, falling back to Politigraph attribution URL -> `source_url`

Only factual row fields are copied. Do not generate issue-position summaries, scores, labels, accusations, or recommendation copy from this data.

## Safety Notes

The import script rejects roster text containing markup characters or royal-institution guardrail terms before writing rows. It also writes one `admin_audit_logs` entry for the import batch.

Rankings remain controlled by `app_config.rankings_public` and the sample threshold. This import does not make rankings public and does not change freeze or legal-review settings.
