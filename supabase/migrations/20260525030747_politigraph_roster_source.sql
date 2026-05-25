alter table public.politicians
  add column if not exists politigraph_person_id text,
  add column if not exists politigraph_membership_id text;

alter table public.politicians
  drop constraint if exists politicians_politigraph_person_id_check,
  add constraint politicians_politigraph_person_id_check check (
    politigraph_person_id is null or (
      politigraph_person_id ~ '^[0-9a-fA-F-]{36}$'
      and politigraph_person_id !~ '[<>]'
    )
  );

alter table public.politicians
  drop constraint if exists politicians_politigraph_membership_id_check,
  add constraint politicians_politigraph_membership_id_check check (
    politigraph_membership_id is null or (
      politigraph_membership_id ~ '^[0-9a-fA-F-]{36}$'
      and politigraph_membership_id !~ '[<>]'
    )
  );
