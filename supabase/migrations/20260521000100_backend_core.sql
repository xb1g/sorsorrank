create extension if not exists pgcrypto;

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.app_config (key, value)
values
  ('swipe_enabled', 'true'::jsonb),
  ('rankings_public', 'false'::jsonb),
  ('share_cards_enabled', 'true'::jsonb),
  ('election_freeze', 'false'::jsonb),
  ('admin_roster_enabled', 'true'::jsonb),
  ('daily_card_limit', '10'::jsonb),
  ('minimum_ranking_sample_size', '120'::jsonb),
  ('consent_version', '"2026-05-20"'::jsonb),
  ('raw_event_retention_days', '7'::jsonb)
on conflict (key) do nothing;

create table if not exists public.politicians (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(trim(display_name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  role_label text check (role_label is null or char_length(role_label) <= 120),
  party_label text check (party_label is null or char_length(party_label) <= 120),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  search_query text not null check (char_length(trim(search_query)) between 1 and 240),
  active_candidate boolean not null default false,
  legal_reviewed_at timestamptz,
  roster_version integer not null default 1 check (roster_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_markup_in_roster_text check (
    display_name !~ '[<>]' and
    coalesce(role_label, '') !~ '[<>]' and
    coalesce(party_label, '') !~ '[<>]' and
    search_query !~ '[<>]'
  ),
  constraint no_royal_institution_roster_text check (
    lower(display_name || ' ' || coalesce(role_label, '') || ' ' || coalesce(party_label, '') || ' ' || search_query)
      !~ '(monarchy|royal family|royal institution|\\bking\\b|\\bqueen\\b|สถาบันพระมหากษัตริย์|พระมหากษัตริย์|ราชวงศ์)'
  )
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  visitor_key_hash text not null check (visitor_key_hash ~ '^[a-f0-9]{64}$'),
  consent_version text not null,
  privacy_notice_hash text not null check (privacy_notice_hash ~ '^[a-f0-9]{64}$'),
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz not null default now(),
  constraint consent_exactly_one_decision check (
    (accepted_at is not null and declined_at is null) or
    (accepted_at is null and declined_at is not null)
  )
);

create table if not exists public.card_impressions (
  id text primary key check (char_length(id) between 8 and 160),
  visitor_key_hash text not null check (visitor_key_hash ~ '^[a-f0-9]{64}$'),
  politician_id uuid not null references public.politicians(id) on delete restrict,
  occurred_on date not null default current_date,
  issued_at timestamptz not null default now(),
  consumed_at timestamptz,
  unique (visitor_key_hash, politician_id, occurred_on)
);

create table if not exists public.swipe_events (
  id uuid primary key default gen_random_uuid(),
  visitor_key_hash text not null check (visitor_key_hash ~ '^[a-f0-9]{64}$'),
  politician_id uuid not null references public.politicians(id) on delete restrict,
  action text not null check (action in ('research', 'skip')),
  card_impression_id text not null check (char_length(card_impression_id) between 8 and 160),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 160),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (visitor_key_hash, card_impression_id),
  unique (visitor_key_hash, idempotency_key)
);

create table if not exists public.daily_research_interest_aggregates (
  date date not null,
  politician_id uuid not null references public.politicians(id) on delete restrict,
  eligible_impressions integer not null default 0 check (eligible_impressions >= 0),
  research_actions integer not null default 0 check (research_actions >= 0),
  skip_actions integer not null default 0 check (skip_actions >= 0),
  updated_at timestamptz not null default now(),
  primary key (date, politician_id),
  constraint aggregate_counts_fit_impressions check (research_actions + skip_actions = eligible_impressions)
);

create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  visitor_key_hash text not null check (visitor_key_hash ~ '^[a-f0-9]{64}$'),
  share_type text not null check (share_type in ('completion', 'streak', 'rank_snapshot')),
  created_at timestamptz not null default now()
);

create table if not exists public.takedown_requests (
  id uuid primary key default gen_random_uuid(),
  visitor_key_hash text check (visitor_key_hash is null or visitor_key_hash ~ '^[a-f0-9]{64}$'),
  contact_email text not null check (char_length(contact_email) <= 254),
  request_type text not null check (request_type in ('roster_correction', 'takedown', 'privacy', 'other')),
  public_figure text check (public_figure is null or char_length(public_figure) <= 160),
  explanation text not null check (char_length(explanation) between 12 and 4000),
  evidence_url text check (evidence_url is null or char_length(evidence_url) <= 1000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id text not null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limit_keys (
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  bucket text not null,
  points integer not null default 1 check (points >= 0),
  expires_at timestamptz not null,
  primary key (key_hash, bucket)
);

create index if not exists politicians_status_idx on public.politicians(status);
create index if not exists politicians_active_candidate_idx on public.politicians(active_candidate) where active_candidate = true;
create index if not exists consent_records_visitor_version_idx on public.consent_records(visitor_key_hash, consent_version, accepted_at desc);
create index if not exists card_impressions_visitor_day_idx on public.card_impressions(visitor_key_hash, occurred_on, consumed_at);
create index if not exists swipe_events_visitor_day_idx on public.swipe_events(visitor_key_hash, occurred_on);
create index if not exists swipe_events_created_at_idx on public.swipe_events(created_at);
create index if not exists daily_aggregates_date_score_idx on public.daily_research_interest_aggregates(date, eligible_impressions, research_actions);
create index if not exists takedown_requests_status_idx on public.takedown_requests(status, created_at);
create index if not exists rate_limit_keys_expires_at_idx on public.rate_limit_keys(expires_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists politicians_set_updated_at on public.politicians;
create trigger politicians_set_updated_at
before update on public.politicians
for each row execute function public.set_updated_at();

drop trigger if exists takedown_requests_set_updated_at on public.takedown_requests;
create trigger takedown_requests_set_updated_at
before update on public.takedown_requests
for each row execute function public.set_updated_at();

create or replace function public.app_flag_boolean(flag_key text, default_value boolean)
returns boolean
language sql
stable
as $$
  select coalesce(
    (select (value #>> '{}')::boolean from public.app_config where key = flag_key),
    default_value
  );
$$;

create or replace function public.app_config_integer(config_key text, default_value integer)
returns integer
language sql
stable
as $$
  select coalesce(
    (select (value #>> '{}')::integer from public.app_config where key = config_key),
    default_value
  );
$$;

create or replace function public.app_config_text(config_key text, default_value text)
returns text
language sql
stable
as $$
  select coalesce(
    (select value #>> '{}' from public.app_config where key = config_key),
    default_value
  );
$$;

create or replace function public.record_swipe_event(
  p_visitor_key_hash text,
  p_politician_id uuid,
  p_action text,
  p_card_impression_id text,
  p_idempotency_key text,
  p_today date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  existing_event public.swipe_events%rowtype;
  latest_consent public.consent_records%rowtype;
  matched_impression public.card_impressions%rowtype;
  used_today integer;
  daily_limit integer := public.app_config_integer('daily_card_limit', 10);
  current_consent_version text := public.app_config_text('consent_version', '2026-05-20');
begin
  perform pg_advisory_xact_lock(hashtextextended(p_visitor_key_hash || ':' || p_today::text, 0));

  if p_action not in ('research', 'skip') then
    raise exception 'Invalid swipe action' using errcode = '22023';
  end if;

  if public.app_flag_boolean('election_freeze', false) or not public.app_flag_boolean('swipe_enabled', true) then
    raise exception 'FreezeModeActiveError' using errcode = 'P0001';
  end if;

  select *
  into latest_consent
  from public.consent_records
  where visitor_key_hash = p_visitor_key_hash
    and consent_version = current_consent_version
  order by created_at desc
  limit 1;

  if not found or latest_consent.accepted_at is null or latest_consent.declined_at is not null then
    raise exception 'ConsentRequiredError' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.politicians
    where id = p_politician_id
      and status = 'active'
  ) then
    raise exception 'PoliticianNotFoundError' using errcode = 'P0001';
  end if;

  select *
  into existing_event
  from public.swipe_events
  where visitor_key_hash = p_visitor_key_hash
    and (
      idempotency_key = p_idempotency_key or
      card_impression_id = p_card_impression_id
    )
  limit 1;

  if found then
    if existing_event.politician_id <> p_politician_id
      or existing_event.action <> p_action
      or existing_event.card_impression_id <> p_card_impression_id then
      raise exception 'DuplicateSwipeError' using errcode = 'P0001';
    end if;

    select count(*)
    into used_today
    from public.swipe_events
    where visitor_key_hash = p_visitor_key_hash
      and occurred_on = p_today;

    return jsonb_build_object(
      'usedToday', used_today,
      'remaining', greatest(daily_limit - used_today, 0),
      'duplicate', true
    );
  end if;

  select count(*)
  into used_today
  from public.swipe_events
  where visitor_key_hash = p_visitor_key_hash
    and occurred_on = p_today;

  if used_today >= daily_limit then
    raise exception 'DailyLimitExceededError' using errcode = 'P0001';
  end if;

  update public.card_impressions
  set consumed_at = now()
  where id = p_card_impression_id
    and visitor_key_hash = p_visitor_key_hash
    and politician_id = p_politician_id
    and occurred_on = p_today
    and consumed_at is null
  returning * into matched_impression;

  if not found then
    raise exception 'CardImpressionRequiredError' using errcode = 'P0001';
  end if;

  insert into public.swipe_events (
    visitor_key_hash,
    politician_id,
    action,
    card_impression_id,
    idempotency_key,
    occurred_on
  )
  values (
    p_visitor_key_hash,
    p_politician_id,
    p_action,
    p_card_impression_id,
    p_idempotency_key,
    p_today
  );

  insert into public.daily_research_interest_aggregates (
    date,
    politician_id,
    eligible_impressions,
    research_actions,
    skip_actions
  )
  values (
    p_today,
    p_politician_id,
    1,
    case when p_action = 'research' then 1 else 0 end,
    case when p_action = 'skip' then 1 else 0 end
  )
  on conflict (date, politician_id)
  do update set
    eligible_impressions = public.daily_research_interest_aggregates.eligible_impressions + 1,
    research_actions = public.daily_research_interest_aggregates.research_actions + case when p_action = 'research' then 1 else 0 end,
    skip_actions = public.daily_research_interest_aggregates.skip_actions + case when p_action = 'skip' then 1 else 0 end,
    updated_at = now();

  used_today := used_today + 1;

  return jsonb_build_object(
    'usedToday', used_today,
    'remaining', greatest(daily_limit - used_today, 0),
    'duplicate', false
  );
end;
$$;

create or replace function public.cleanup_short_retention(max_age interval default interval '7 days')
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_swipes integer;
  deleted_rate_limits integer;
begin
  delete from public.swipe_events
  where created_at < now() - max_age;
  get diagnostics deleted_swipes = row_count;

  delete from public.card_impressions
  where issued_at < now() - max_age;

  delete from public.rate_limit_keys
  where expires_at < now();
  get diagnostics deleted_rate_limits = row_count;

  return jsonb_build_object(
    'deletedSwipeEvents', deleted_swipes,
    'deletedRateLimitKeys', deleted_rate_limits
  );
end;
$$;

create or replace function public.consume_rate_limit(
  p_key_hash text,
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_points integer;
  current_expiry timestamptz;
begin
  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'Invalid rate limit config' using errcode = '22023';
  end if;

  insert into public.rate_limit_keys (key_hash, bucket, points, expires_at)
  values (p_key_hash, p_bucket, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key_hash, bucket)
  do update set
    points = case
      when public.rate_limit_keys.expires_at < now() then 1
      else public.rate_limit_keys.points + 1
    end,
    expires_at = case
      when public.rate_limit_keys.expires_at < now() then now() + make_interval(secs => p_window_seconds)
      else public.rate_limit_keys.expires_at
    end
  returning points, expires_at into current_points, current_expiry;

  if current_points > p_limit then
    raise exception 'RateLimitExceededError' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'points', current_points,
    'limit', p_limit,
    'expiresAt', current_expiry
  );
end;
$$;

create or replace view public.research_interest_rankings as
select
  aggregate.date,
  aggregate.politician_id,
  politician.display_name,
  politician.role_label,
  politician.party_label,
  politician.search_query,
  aggregate.eligible_impressions,
  aggregate.research_actions,
  aggregate.skip_actions,
  case
    when aggregate.eligible_impressions = 0 then 0::numeric
    else aggregate.research_actions::numeric / aggregate.eligible_impressions::numeric
  end as research_interest_score,
  aggregate.eligible_impressions < public.app_config_integer('minimum_ranking_sample_size', 120) as hidden_below_threshold
from public.daily_research_interest_aggregates aggregate
join public.politicians politician on politician.id = aggregate.politician_id
where politician.status = 'active';

alter table public.app_config enable row level security;
alter table public.politicians enable row level security;
alter table public.consent_records enable row level security;
alter table public.card_impressions enable row level security;
alter table public.swipe_events enable row level security;
alter table public.daily_research_interest_aggregates enable row level security;
alter table public.share_events enable row level security;
alter table public.takedown_requests enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.rate_limit_keys enable row level security;

revoke all on table public.app_config from anon, authenticated;
revoke all on table public.politicians from anon, authenticated;
revoke all on table public.consent_records from anon, authenticated;
revoke all on table public.card_impressions from anon, authenticated;
revoke all on table public.swipe_events from anon, authenticated;
revoke all on table public.daily_research_interest_aggregates from anon, authenticated;
revoke all on table public.share_events from anon, authenticated;
revoke all on table public.takedown_requests from anon, authenticated;
revoke all on table public.admin_audit_logs from anon, authenticated;
revoke all on table public.rate_limit_keys from anon, authenticated;
revoke all on table public.research_interest_rankings from anon, authenticated;

revoke all on function public.record_swipe_event(text, uuid, text, text, text, date) from public, anon, authenticated;
revoke all on function public.cleanup_short_retention(interval) from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;

grant execute on function public.record_swipe_event(text, uuid, text, text, text, date) to service_role;
grant execute on function public.cleanup_short_retention(interval) to service_role;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
