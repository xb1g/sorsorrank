insert into public.source_documents (
  source_key,
  title,
  source_type,
  publisher,
  local_path,
  license_name,
  attribution_text,
  commercial_use_allowed,
  retrieved_at,
  reliability,
  notes
)
values (
  'provided_csv:house-26-members:line-490',
  'สภาผู้แทนราษฎร-26-members.csv',
  'provided_csv',
  'Project-provided roster CSV',
  '/Users/bunyasit/Downloads/สภาผู้แทนราษฎร-26-members.csv',
  'Project-provided source; license not specified',
  'Source: project-provided CSV file สภาผู้แทนราษฎร-26-members.csv',
  null,
  now(),
  'provided_unverified',
  'Project operator provided this CSV. The row is source-linked for ingestion, but it still needs official-source review before public use.'
)
on conflict (source_key) do update set
  title = excluded.title,
  source_type = excluded.source_type,
  publisher = excluded.publisher,
  local_path = excluded.local_path,
  license_name = excluded.license_name,
  attribution_text = excluded.attribution_text,
  commercial_use_allowed = excluded.commercial_use_allowed,
  retrieved_at = excluded.retrieved_at,
  reliability = excluded.reliability,
  notes = excluded.notes,
  updated_at = now();

insert into public.source_documents (
  source_key,
  title,
  source_type,
  publisher,
  source_url,
  license_name,
  license_url,
  attribution_text,
  commercial_use_allowed,
  retrieved_at,
  reliability,
  notes
)
values (
  'parliamentwatch:about:data-methodology',
  'Parliament Watch: เกี่ยวกับข้อมูลในเว็บไซต์',
  'civic_data_project',
  'WeVis',
  'https://parliamentwatch.wevis.info/about#%E0%B9%80%E0%B8%81%E0%B8%B5%E0%B9%88%E0%B8%A2%E0%B8%A7%E0%B8%81%E0%B8%B1%E0%B8%9A%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B9%83%E0%B8%99%E0%B9%80%E0%B8%A7%E0%B9%87%E0%B8%9A%E0%B9%84%E0%B8%8B%E0%B8%95%E0%B9%8C',
  'Creative Commons Attribution-NonCommercial 4.0 International',
  'https://creativecommons.org/licenses/by-nc/4.0/',
  'Data source: Parliament Watch by WeVis. Verify against original parliament sources before publication.',
  false,
  now(),
  'third_party',
  'Parliament Watch documents vote and bill data sources, OCR/scraping process, limitations, and noncommercial attribution terms. Use as secondary/civic-data source unless direct permission or official source verification is complete.'
)
on conflict (source_key) do update set
  title = excluded.title,
  source_type = excluded.source_type,
  publisher = excluded.publisher,
  source_url = excluded.source_url,
  license_name = excluded.license_name,
  license_url = excluded.license_url,
  attribution_text = excluded.attribution_text,
  commercial_use_allowed = excluded.commercial_use_allowed,
  retrieved_at = excluded.retrieved_at,
  reliability = excluded.reliability,
  notes = excluded.notes,
  updated_at = now();

insert into public.political_parties (name_th, status)
values ('ภูมิใจไทย', 'active')
on conflict (name_th) do update set
  status = excluded.status,
  updated_at = now();

insert into public.public_offices (name_th, body_th, country_code, level)
values ('สมาชิกสภาผู้แทนราษฎร', 'สภาผู้แทนราษฎร', 'TH', 'national')
on conflict on constraint public_offices_unique_name do update set
  level = excluded.level,
  updated_at = now();

insert into public.public_figures (
  slug,
  display_name_th,
  sort_name_th,
  roster_category,
  active_candidate_status,
  legal_review_status,
  royal_exclusion_checked_at,
  status,
  search_query
)
values (
  'anutin-charnvirakul',
  'นายอนุทิน ชาญวีรกูล',
  'อนุทิน ชาญวีรกูล',
  'officeholder',
  'unknown',
  'pending',
  now(),
  'draft',
  'นายอนุทิน ชาญวีรกูล'
)
on conflict (slug) do update set
  display_name_th = excluded.display_name_th,
  sort_name_th = excluded.sort_name_th,
  roster_category = excluded.roster_category,
  active_candidate_status = excluded.active_candidate_status,
  legal_review_status = excluded.legal_review_status,
  royal_exclusion_checked_at = excluded.royal_exclusion_checked_at,
  status = excluded.status,
  search_query = excluded.search_query,
  updated_at = now();

with source_doc as (
  select id from public.source_documents
  where source_key = 'provided_csv:house-26-members:line-490'
),
figure as (
  select id from public.public_figures
  where slug = 'anutin-charnvirakul'
),
office as (
  select id from public.public_offices
  where name_th = 'สมาชิกสภาผู้แทนราษฎร'
    and body_th = 'สภาผู้แทนราษฎร'
    and country_code = 'TH'
),
party as (
  select id from public.political_parties
  where name_th = 'ภูมิใจไทย'
)
insert into public.public_figure_terms (
  figure_id,
  office_id,
  party_id,
  source_document_id,
  role_title_th,
  election_method,
  list_number,
  term_start,
  term_end,
  verification_status
)
select
  figure.id,
  office.id,
  party.id,
  source_doc.id,
  'สมาชิกสภาผู้แทนราษฎร',
  'party_list',
  1,
  date '2023-05-24',
  date '2025-12-12',
  'source_linked'
from figure, office, party, source_doc
on conflict on constraint public_figure_terms_unique_source do update set
  party_id = excluded.party_id,
  election_method = excluded.election_method,
  list_number = excluded.list_number,
  term_end = excluded.term_end,
  verification_status = excluded.verification_status,
  updated_at = now();

with source_doc as (
  select id from public.source_documents
  where source_key = 'provided_csv:house-26-members:line-490'
)
insert into public.source_citations (
  source_document_id,
  locator_type,
  locator,
  excerpt
)
select
  source_doc.id,
  'line',
  '490',
  'สมาชิกสภาผู้แทนราษฎร,นาย,อนุทิน ชาญวีรกูล,ภูมิใจไทย,บัญชีรายชื่อ,,,1,2023-05-24,2025-12-12'
from source_doc
on conflict on constraint source_citations_unique_locator do update set
  excerpt = excluded.excerpt;

with figure as (
  select id from public.public_figures
  where slug = 'anutin-charnvirakul'
),
source_doc as (
  select id from public.source_documents
  where source_key = 'provided_csv:house-26-members:line-490'
),
term as (
  select t.id
  from public.public_figure_terms t, figure, source_doc
  where t.figure_id = figure.id
    and t.source_document_id = source_doc.id
    and t.role_title_th = 'สมาชิกสภาผู้แทนราษฎร'
    and t.term_start = date '2023-05-24'
),
citation as (
  select c.id
  from public.source_citations c, source_doc
  where c.source_document_id = source_doc.id
    and c.locator_type = 'line'
    and c.locator = '490'
)
insert into public.public_record_facts (
  figure_id,
  term_id,
  source_citation_id,
  fact_type,
  claim_text,
  claim_date,
  verification_status,
  visibility_status
)
select
  figure.id,
  term.id,
  citation.id,
  'office_term',
  'The provided House of Representatives 26th members CSV lists นายอนุทิน ชาญวีรกูล as a party-list member of the House of Representatives for พรรคภูมิใจไทย, list number 1, from 2023-05-24 to 2025-12-12.',
  date '2023-05-24',
  'source_linked',
  'draft'
from figure, term, citation
on conflict on constraint public_record_facts_unique_citation do update set
  term_id = excluded.term_id,
  claim_date = excluded.claim_date,
  verification_status = excluded.verification_status,
  visibility_status = excluded.visibility_status,
  updated_at = now();
