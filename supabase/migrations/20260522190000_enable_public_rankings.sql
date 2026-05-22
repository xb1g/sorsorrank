-- 20260522190000_enable_public_rankings.sql
-- Enables public rankings and enforces the election blackout rule by excluding active candidates.

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
where politician.status = 'active'
  and politician.active_candidate = false;

-- Enable the public rankings
update public.app_config
set value = 'true'::jsonb
where key = 'rankings_public';
