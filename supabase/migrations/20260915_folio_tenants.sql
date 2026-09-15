-- FOLIO multi-tenant membership (Supabase / Postgres)
-- Apply after SUPABASE_* keys land. RLS: users only see their tenant rows.

create extension if not exists "pgcrypto";

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id text not null, -- Privy DID / subject
  wallet_address text,
  role text not null check (role in ('owner', 'trader', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table if not exists public.desk_preferences (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id text not null,
  corporate_action_alerts boolean not null default true,
  strict_fail_closed boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_members_user_id_idx
  on public.tenant_members (user_id);

create index if not exists desk_preferences_user_id_idx
  on public.desk_preferences (user_id);

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.desk_preferences enable row level security;

-- Placeholder policies: replace auth.uid()/JWT claim mapping once Privy→Supabase is wired.
-- Until then, service-role server only — anon client must not read memberships.
create policy tenants_member_select on public.tenants
  for select using (
    exists (
      select 1 from public.tenant_members m
      where m.tenant_id = tenants.id
        and m.user_id = coalesce(auth.jwt() ->> 'sub', '')
    )
  );

create policy tenant_members_self_select on public.tenant_members
  for select using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

create policy desk_prefs_self_all on public.desk_preferences
  for all using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));
