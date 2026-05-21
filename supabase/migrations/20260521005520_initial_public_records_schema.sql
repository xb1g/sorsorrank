create table public.source_documents (
  id bigint generated always as identity primary key,
  source_key text not null unique,
  title text not null,
  source_type text not null check (
    source_type in (
      'official_website',
      'government_pdf',
      'provided_csv',
      'open_data',
      'civic_data_project',
      'newsroom',
      'other'
    )
  ),
  publisher text,
  source_url text,
  local_path text,
  license_name text,
  license_url text,
  attribution_text text,
  commercial_use_allowed boolean,
  retrieved_at timestamptz,
  published_on date,
  reliability text not null default 'unreviewed' check (
    reliability in (
      'official',
      'provided_unverified',
      'third_party',
      'unreviewed'
    )
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_documents_has_locator check (
    source_url is not null or local_path is not null
  )
);

create table public.political_parties (
  id bigint generated always as identity primary key,
  name_th text not null unique,
  name_en text,
  status text not null default 'active' check (
    status in ('active', 'inactive', 'unknown')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.public_offices (
  id bigint generated always as identity primary key,
  name_th text not null,
  name_en text,
  body_th text,
  body_en text,
  country_code text not null default 'TH',
  level text not null default 'national' check (
    level in ('national', 'provincial', 'local', 'other')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_offices_unique_name unique (name_th, body_th, country_code)
);

create table public.public_figures (
  id bigint generated always as identity primary key,
  slug text not null unique,
  display_name_th text not null,
  display_name_en text,
  sort_name_th text,
  figure_type text not null default 'person' check (
    figure_type in ('person', 'organization')
  ),
  roster_category text not null default 'public_figure' check (
    roster_category in (
      'officeholder',
      'former_officeholder',
      'party_official',
      'active_candidate',
      'other_public_figure',
      'public_figure'
    )
  ),
  active_candidate_status text not null default 'unknown' check (
    active_candidate_status in ('unknown', 'not_active', 'active', 'former_candidate')
  ),
  election_jurisdiction text,
  legal_review_status text not null default 'pending' check (
    legal_review_status in ('pending', 'approved', 'rejected')
  ),
  royal_exclusion_checked_at timestamptz,
  status text not null default 'draft' check (
    status in ('draft', 'active', 'archived')
  ),
  search_query text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_figures_slug_format check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint public_figures_display_name_not_blank check (
    length(btrim(display_name_th)) > 0
  )
);

create table public.public_figure_terms (
  id bigint generated always as identity primary key,
  figure_id bigint not null references public.public_figures(id) on delete cascade,
  office_id bigint not null references public.public_offices(id) on delete restrict,
  party_id bigint references public.political_parties(id) on delete restrict,
  source_document_id bigint not null references public.source_documents(id) on delete restrict,
  role_title_th text not null,
  role_title_en text,
  election_method text not null default 'unknown' check (
    election_method in (
      'constituency',
      'party_list',
      'appointed',
      'ex_officio',
      'unknown',
      'other'
    )
  ),
  province_th text,
  district_number smallint,
  list_number smallint,
  term_start date not null,
  term_end date,
  verification_status text not null default 'needs_review' check (
    verification_status in ('needs_review', 'source_linked', 'approved', 'rejected')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_figure_terms_date_order check (
    term_end is null or term_end >= term_start
  ),
  constraint public_figure_terms_constituency_has_district check (
    election_method <> 'constituency' or district_number is not null
  ),
  constraint public_figure_terms_party_list_has_number check (
    election_method <> 'party_list' or list_number is not null
  ),
  constraint public_figure_terms_unique_source unique (
    figure_id,
    office_id,
    role_title_th,
    term_start,
    source_document_id
  )
);

create table public.source_citations (
  id bigint generated always as identity primary key,
  source_document_id bigint not null references public.source_documents(id) on delete cascade,
  locator_type text not null default 'line' check (
    locator_type in ('line', 'page', 'url_fragment', 'row', 'other')
  ),
  locator text not null,
  excerpt text not null,
  created_at timestamptz not null default now(),
  constraint source_citations_unique_locator unique (
    source_document_id,
    locator_type,
    locator
  )
);

create table public.public_record_facts (
  id bigint generated always as identity primary key,
  figure_id bigint not null references public.public_figures(id) on delete cascade,
  term_id bigint references public.public_figure_terms(id) on delete set null,
  source_citation_id bigint not null references public.source_citations(id) on delete restrict,
  fact_type text not null check (
    fact_type in (
      'identity',
      'office_term',
      'party_affiliation',
      'committee',
      'vote',
      'bill',
      'attendance',
      'budget',
      'asset_disclosure',
      'promise',
      'other'
    )
  ),
  claim_text text not null,
  claim_date date,
  verification_status text not null default 'needs_review' check (
    verification_status in ('needs_review', 'source_linked', 'approved', 'rejected')
  ),
  visibility_status text not null default 'draft' check (
    visibility_status in ('draft', 'published', 'hidden')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_record_facts_claim_not_blank check (
    length(btrim(claim_text)) > 0
  ),
  constraint public_record_facts_unique_citation unique (
    figure_id,
    fact_type,
    source_citation_id,
    claim_text
  )
);

create table public.consent_records (
  id bigint generated always as identity primary key,
  visitor_key_hash text not null,
  consent_version text not null,
  privacy_notice_version text not null,
  purpose text not null default 'aggregate_research_interest',
  accepted_at timestamptz,
  declined_at timestamptz,
  withdrawn_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  constraint consent_records_decision_present check (
    accepted_at is not null or declined_at is not null
  )
);

create table public.swipe_events (
  id bigint generated always as identity primary key,
  visitor_key_hash text not null,
  figure_id bigint not null references public.public_figures(id) on delete restrict,
  action text not null check (action in ('research', 'skip')),
  card_impression_id text not null,
  idempotency_key text not null unique,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create table public.daily_research_interest_aggregates (
  aggregate_date date not null,
  figure_id bigint not null references public.public_figures(id) on delete restrict,
  eligible_impressions integer not null default 0,
  eligible_unique_visitors integer not null default 0,
  research_actions integer not null default 0,
  skip_actions integer not null default 0,
  publication_status text not null default 'hidden' check (
    publication_status in ('hidden', 'public', 'frozen')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (aggregate_date, figure_id),
  constraint daily_research_interest_non_negative check (
    eligible_impressions >= 0
    and eligible_unique_visitors >= 0
    and research_actions >= 0
    and skip_actions >= 0
  ),
  constraint daily_research_interest_counts_fit check (
    research_actions + skip_actions <= eligible_impressions
  )
);

create table public.takedown_requests (
  id bigint generated always as identity primary key,
  requester_contact text not null,
  request_type text not null check (
    request_type in (
      'takedown',
      'correction',
      'data_subject_request',
      'legal_order',
      'election_authority_request',
      'other'
    )
  ),
  affected_entity_type text,
  affected_entity_id bigint,
  message text not null,
  status text not null default 'open' check (
    status in ('open', 'hidden_pending_review', 'resolved', 'rejected')
  ),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.compliance_reviews (
  id bigint generated always as identity primary key,
  review_type text not null check (
    review_type in ('roster', 'copy', 'launch', 'election_window', 'vendor', 'data_flow')
  ),
  target_type text not null,
  target_id bigint,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected')
  ),
  reviewer_id text,
  notes text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id text,
  action text not null,
  target_type text not null,
  target_id bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index public_figure_terms_figure_id_idx
  on public.public_figure_terms (figure_id);

create index public_figure_terms_office_id_idx
  on public.public_figure_terms (office_id);

create index public_figure_terms_party_id_idx
  on public.public_figure_terms (party_id);

create index public_figure_terms_source_document_id_idx
  on public.public_figure_terms (source_document_id);

create index source_citations_source_document_id_idx
  on public.source_citations (source_document_id);

create index public_record_facts_figure_type_date_idx
  on public.public_record_facts (figure_id, fact_type, claim_date);

create index public_record_facts_source_citation_id_idx
  on public.public_record_facts (source_citation_id);

create index consent_records_visitor_key_hash_created_at_idx
  on public.consent_records (visitor_key_hash, created_at desc);

create index swipe_events_visitor_date_idx
  on public.swipe_events (visitor_key_hash, occurred_on);

create index swipe_events_figure_date_idx
  on public.swipe_events (figure_id, occurred_on);

create index swipe_events_expires_at_idx
  on public.swipe_events (expires_at);

create index daily_research_interest_public_idx
  on public.daily_research_interest_aggregates (aggregate_date, publication_status)
  where publication_status = 'public';

create index takedown_requests_status_created_at_idx
  on public.takedown_requests (status, created_at);

create index compliance_reviews_status_type_idx
  on public.compliance_reviews (status, review_type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create trigger set_source_documents_updated_at
  before update on public.source_documents
  for each row execute function public.set_updated_at();

create trigger set_political_parties_updated_at
  before update on public.political_parties
  for each row execute function public.set_updated_at();

create trigger set_public_offices_updated_at
  before update on public.public_offices
  for each row execute function public.set_updated_at();

create trigger set_public_figures_updated_at
  before update on public.public_figures
  for each row execute function public.set_updated_at();

create trigger set_public_figure_terms_updated_at
  before update on public.public_figure_terms
  for each row execute function public.set_updated_at();

create trigger set_public_record_facts_updated_at
  before update on public.public_record_facts
  for each row execute function public.set_updated_at();

create trigger set_daily_research_interest_updated_at
  before update on public.daily_research_interest_aggregates
  for each row execute function public.set_updated_at();

alter table public.source_documents enable row level security;
alter table public.political_parties enable row level security;
alter table public.public_offices enable row level security;
alter table public.public_figures enable row level security;
alter table public.public_figure_terms enable row level security;
alter table public.source_citations enable row level security;
alter table public.public_record_facts enable row level security;
alter table public.consent_records enable row level security;
alter table public.swipe_events enable row level security;
alter table public.daily_research_interest_aggregates enable row level security;
alter table public.takedown_requests enable row level security;
alter table public.compliance_reviews enable row level security;
alter table public.admin_audit_logs enable row level security;

alter table public.source_documents force row level security;
alter table public.political_parties force row level security;
alter table public.public_offices force row level security;
alter table public.public_figures force row level security;
alter table public.public_figure_terms force row level security;
alter table public.source_citations force row level security;
alter table public.public_record_facts force row level security;
alter table public.consent_records force row level security;
alter table public.swipe_events force row level security;
alter table public.daily_research_interest_aggregates force row level security;
alter table public.takedown_requests force row level security;
alter table public.compliance_reviews force row level security;
alter table public.admin_audit_logs force row level security;
