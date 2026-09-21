-- FOLIO — beta waitlist ONLY (use if tenants already exist).
-- Paste into Supabase SQL Editor and Run.

create table if not exists public.beta_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  wallet text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beta_waitlist_email_lower check (email = lower(email))
);

create unique index if not exists beta_waitlist_email_uidx
  on public.beta_waitlist (email);

alter table public.beta_waitlist enable row level security;

comment on table public.beta_waitlist is
  'Closed beta waitlist — service-role writes from FOLIO joinBetaWaitlist; never localStorage.';

grant select, insert, update, delete on public.beta_waitlist to service_role;
