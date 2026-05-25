drop index if exists public.politicians_politigraph_membership_id_uidx;

alter table public.politicians
  drop constraint if exists politicians_politigraph_membership_id_key,
  add constraint politicians_politigraph_membership_id_key unique (politigraph_membership_id);
