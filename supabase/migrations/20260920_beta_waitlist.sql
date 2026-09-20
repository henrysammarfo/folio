-- FOLIO closed-beta waitlist — server-only capture (no localStorage).
-- Service-role inserts from joinBetaWaitlist. RLS on with no anon policies → deny public reads.

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

-- Intentionally no SELECT/INSERT policies for anon/authenticated.
-- Server uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) only.
comment on table public.beta_waitlist is
  'Closed beta waitlist — service-role writes from FOLIO joinBetaWaitlist; never localStorage.';
