-- Runway Job Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor

create table if not exists public.jobs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  company        text not null,
  title          text not null,
  status         text not null default 'Applied',
  url            text not null default '',
  applied_date   date,
  contact        text not null default '',
  notes          text not null default '',
  round          text not null default '',
  stage          text not null default '',
  follow_up_date date,
  follow_up_note text not null default '',
  salary_range   text not null default '',
  is_stale       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Index for fast per-user queries
create index if not exists jobs_user_id_idx on public.jobs(user_id);
create index if not exists jobs_status_idx on public.jobs(user_id, status);

-- Auto-update updated_at on row changes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function public.handle_updated_at();

-- Row-Level Security: each user only sees and modifies their own rows
alter table public.jobs enable row level security;

drop policy if exists "Users can manage their own jobs" on public.jobs;
create policy "Users can manage their own jobs"
  on public.jobs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
