create table if not exists public.politician_vote_records (
  politician_id uuid not null references public.politicians(id) on delete cascade,
  vote_event_id text not null check (char_length(trim(vote_event_id)) between 1 and 160 and vote_event_id !~ '[<>]'),
  title text not null check (char_length(trim(title)) between 1 and 500 and title !~ '[<>]'),
  start_date date,
  option text not null check (char_length(trim(option)) between 1 and 80 and option !~ '[<>]'),
  source_url text not null check (
    source_url ~ '^https://'
    and char_length(source_url) <= 1000
    and source_url !~ '[<>]'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (politician_id, vote_event_id)
);

create index if not exists politician_vote_records_politician_date_idx
on public.politician_vote_records(politician_id, start_date desc);

drop trigger if exists politician_vote_records_set_updated_at on public.politician_vote_records;
create trigger politician_vote_records_set_updated_at
before update on public.politician_vote_records
for each row execute function public.set_updated_at();

alter table public.politician_vote_records enable row level security;
revoke all on table public.politician_vote_records from anon, authenticated;
