alter table public.politicians
  add column if not exists image_url text,
  add column if not exists image_source_url text,
  add column if not exists info_source_url text,
  add column if not exists featured_priority integer;

alter table public.politicians
  drop constraint if exists politicians_image_url_check,
  add constraint politicians_image_url_check check (
    image_url is null or (
      image_url ~ '^https://'
      and char_length(image_url) <= 1000
      and image_url !~ '[<>]'
    )
  );

alter table public.politicians
  drop constraint if exists politicians_image_source_url_check,
  add constraint politicians_image_source_url_check check (
    image_source_url is null or (
      image_source_url ~ '^https://'
      and char_length(image_source_url) <= 1000
      and image_source_url !~ '[<>]'
    )
  );

alter table public.politicians
  drop constraint if exists politicians_info_source_url_check,
  add constraint politicians_info_source_url_check check (
    info_source_url is null or (
      info_source_url ~ '^https://'
      and char_length(info_source_url) <= 1000
      and info_source_url !~ '[<>]'
    )
  );

alter table public.politicians
  drop constraint if exists politicians_featured_priority_check,
  add constraint politicians_featured_priority_check check (
    featured_priority is null or featured_priority between 1 and 500
  );

create index if not exists politicians_featured_active_idx
on public.politicians(featured_priority, updated_at desc)
where status = 'active' and featured_priority is not null;

alter table public.politicians
  drop constraint if exists no_royal_institution_roster_text,
  add constraint no_royal_institution_roster_text check (
    lower(display_name || ' ' || coalesce(role_label, '') || ' ' || coalesce(party_label, '') || ' ' || search_query)
      !~ '(monarchy|royal family|royal institution|privy council|\bking\b|\bqueen\b|สถาบันพระมหากษัตริย์|พระมหากษัตริย์|ราชวงศ์)'
  );

drop view if exists public.research_interest_rankings;

create view public.research_interest_rankings as
select
  aggregate.date,
  aggregate.politician_id,
  politician.display_name,
  politician.role_label,
  politician.party_label,
  politician.search_query,
  politician.image_url,
  politician.image_source_url,
  politician.info_source_url,
  politician.featured_priority,
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
