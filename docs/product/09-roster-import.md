# Roster CSV Import

Date: 2026-05-21

## Source

Local CSV: `C:\Users\volko\Downloads\สภาผู้แทนราษฎร-27-members.csv`

The file is treated as roster data only. It is not used for biographies, claims, snippets, allegations, summaries, or user-facing political analysis.

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

## Safety Notes

The import script rejects roster text containing markup characters or royal-institution guardrail terms before writing rows. It also writes one `admin_audit_logs` entry for the import batch.

Rankings remain controlled by `app_config.rankings_public` and the sample threshold. This import does not make rankings public and does not change freeze or legal-review settings.
