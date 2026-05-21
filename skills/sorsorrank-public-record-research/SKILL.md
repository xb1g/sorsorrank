---
name: sorsorrank-public-record-research
description: Use when researching Thai public figures for SorsorRank, validating source-backed public records, preparing database seed facts, or deciding whether data is safe to publish.
---

# SorsorRank Public Record Research

## Goal

Prepare factual, source-backed public-figure data for SorsorRank without creating unsupported claims, opinion labels, or election-risky framing.

## Source Priority

Use the strongest available source for each fact:

1. Official government, parliament, election, budget, procurement, court, or regulator source.
2. Project-provided source file with clear provenance, such as a roster CSV.
3. Reputable newsroom or civic-data project, only as secondary support.

Do not publish a fact without a citation. If a fact is from a project-provided CSV but not yet tied to an official URL, mark it `source_linked` and keep public visibility as `draft`.

Parliament Watch by WeVis is useful for understanding parliament vote and bill data, but its about page states the data is under Creative Commons Attribution-NonCommercial 4.0 International and documents OCR/scraping limitations. Store its license and attribution in `source_documents`, use it as secondary/civic-data support, and verify publishable claims against original parliament sources or get permission before commercial use.

## Allowed Data

Allowed:

- Legal/display name.
- Public role or office.
- Party affiliation when source-backed.
- Term start and end dates.
- Election method, province, district number, or party-list number.
- Committee membership, bills, votes, attendance, budget records, asset disclosures, or promise-tracker facts when each item has a source.

Not allowed:

- Allegations, accusations, insults, negative labels, or scandal summaries.
- AI-generated biographies or political summaries.
- User comments or free-text political opinions.
- Nickname jokes, animal icons, caricatures, or meme framing for real people.
- Monarchy, royal-family, or royal-institution content.
- "Good", "bad", "best", "worst", "trusted", "corrupt", "lazy", "support", "approval", "winner", or election-prediction labels.

## Workflow

1. Identify the person and exact public role requested.
2. Search official sources first. If using a provided CSV, inspect the header, row count, and exact matching row.
3. Extract only fields that are explicitly present or directly supported.
4. Record source provenance in `source_documents`.
5. Record precise line/page/URL citation in `source_citations`.
6. Insert person identity into `public_figures` as `draft` unless counsel has approved publication.
7. Insert role/term data into `public_figure_terms`.
8. Insert each public claim into `public_record_facts` with `visibility_status='draft'`.
9. Leave `active_candidate_status='unknown'` unless a current official source confirms active or not active.
10. Keep `legal_review_status='pending'` until counsel or the configured reviewer approves.

## Database Mapping

For roster CSV rows like:

```text
role,prefix,name,party,label,province,district_number,list_number,start_date,end_date
```

Map fields as:

- `prefix + name` -> `public_figures.display_name_th`
- neutral romanized slug -> `public_figures.slug`
- `party` -> `political_parties.name_th`
- `role` -> `public_offices.name_th` and `public_figure_terms.role_title_th`
- `label='แบ่งเขต'` -> `election_method='constituency'`
- `label='บัญชีรายชื่อ'` -> `election_method='party_list'`
- `province` -> `public_figure_terms.province_th`
- `district_number` -> `public_figure_terms.district_number`
- `list_number` -> `public_figure_terms.list_number`
- `start_date` -> `public_figure_terms.term_start`
- `end_date` -> `public_figure_terms.term_end`

## Output Checklist

Before claiming the data is ready:

- Every fact has a source document and citation.
- Every source document has license/provenance fields when known.
- Noncommercial third-party datasets are not used in commercial/public launch paths without permission or counsel approval.
- No unsupported current-role inference was made from historical data.
- No active-candidate status was guessed.
- Real-person record is draft until review.
- Search query is neutral: name only, plus role/party only if needed.
- No raw political opinion data is included in research tables.
