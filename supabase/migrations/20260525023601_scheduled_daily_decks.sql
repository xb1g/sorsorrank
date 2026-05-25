create table if not exists public.daily_decks (
  deck_date date primary key,
  status text not null default 'published' check (status in ('published')),
  selection_mode text not null check (selection_mode in ('manual', 'auto_pick')),
  daily_limit integer not null check (daily_limit between 1 and 50),
  generated_at timestamptz not null default now(),
  published_at timestamptz not null default now(),
  created_by text not null,
  updated_by text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_deck_cards (
  deck_date date not null references public.daily_decks(deck_date) on delete cascade,
  position integer not null check (position between 1 and 50),
  politician_id uuid not null references public.politicians(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (deck_date, position),
  unique (deck_date, politician_id)
);

create index if not exists daily_deck_cards_politician_idx
on public.daily_deck_cards(politician_id);

drop trigger if exists daily_decks_set_updated_at on public.daily_decks;
create trigger daily_decks_set_updated_at
before update on public.daily_decks
for each row execute function public.set_updated_at();

alter table public.daily_decks enable row level security;
alter table public.daily_deck_cards enable row level security;

revoke all on table public.daily_decks from anon, authenticated;
revoke all on table public.daily_deck_cards from anon, authenticated;
