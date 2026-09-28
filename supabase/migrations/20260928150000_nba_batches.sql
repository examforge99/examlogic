create table if not exists public.nba_batches (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  batch_date date not null,
  batch_number integer not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, batch_date, batch_number)
);

alter table public.nba_log add column if not exists batch_id uuid;
alter table public.nba_log add column if not exists status text not null default 'pending';
alter table public.nba_log add column if not exists completed_at timestamptz;

create index if not exists nba_batches_user_date_idx
  on public.nba_batches (user_id, batch_date, batch_number desc);

create unique index if not exists nba_batches_one_active_per_user_day_uidx
  on public.nba_batches (user_id, batch_date)
  where status = 'active';

create index if not exists nba_log_batch_idx
  on public.nba_log (batch_id, status);

create unique index if not exists nba_log_batch_concept_action_uidx
  on public.nba_log (batch_id, concept_window_id, action_type);

create index if not exists nba_log_user_date_status_idx
  on public.nba_log (user_id, fired_at, status);
