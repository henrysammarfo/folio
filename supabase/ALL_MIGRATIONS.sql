-- FOLIO — idempotent ALL migrations (safe to re-run).
-- Fixes ERROR 42710: policy already exists by dropping policies first.

create extension if not exists "pgcrypto";

-- =============================================================================
-- Tenants / members / prefs
-- =============================================================================

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id text not null,
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

drop policy if exists tenants_member_select on public.tenants;
create policy tenants_member_select on public.tenants
  for select using (
    exists (
      select 1 from public.tenant_members m
      where m.tenant_id = tenants.id
        and m.user_id = coalesce(auth.jwt() ->> 'sub', '')
    )
  );

drop policy if exists tenant_members_self_select on public.tenant_members;
create policy tenant_members_self_select on public.tenant_members
  for select using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists desk_prefs_self_all on public.desk_preferences;
drop policy if exists desk_prefs_self_select on public.desk_preferences;
drop policy if exists desk_prefs_writer_insert on public.desk_preferences;
drop policy if exists desk_prefs_writer_update on public.desk_preferences;
drop policy if exists desk_prefs_writer_delete on public.desk_preferences;

create policy desk_prefs_self_select on public.desk_preferences
  for select using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

create policy desk_prefs_writer_insert on public.desk_preferences
  for insert with check (
    user_id = coalesce(auth.jwt() ->> 'sub', '')
    and exists (
      select 1 from public.tenant_members m
      where m.tenant_id = desk_preferences.tenant_id
        and m.user_id = coalesce(auth.jwt() ->> 'sub', '')
        and m.role in ('owner', 'trader')
    )
  );

create policy desk_prefs_writer_update on public.desk_preferences
  for update using (
    user_id = coalesce(auth.jwt() ->> 'sub', '')
    and exists (
      select 1 from public.tenant_members m
      where m.tenant_id = desk_preferences.tenant_id
        and m.user_id = coalesce(auth.jwt() ->> 'sub', '')
        and m.role in ('owner', 'trader')
    )
  )
  with check (
    user_id = coalesce(auth.jwt() ->> 'sub', '')
    and exists (
      select 1 from public.tenant_members m
      where m.tenant_id = desk_preferences.tenant_id
        and m.user_id = coalesce(auth.jwt() ->> 'sub', '')
        and m.role in ('owner', 'trader')
    )
  );

create policy desk_prefs_writer_delete on public.desk_preferences
  for delete using (
    user_id = coalesce(auth.jwt() ->> 'sub', '')
    and exists (
      select 1 from public.tenant_members m
      where m.tenant_id = desk_preferences.tenant_id
        and m.user_id = coalesce(auth.jwt() ->> 'sub', '')
        and m.role in ('owner', 'trader')
    )
  );

grant select, insert, update, delete on public.tenants to service_role;
grant select, insert, update, delete on public.tenant_members to service_role;
grant select, insert, update, delete on public.desk_preferences to service_role;
grant select on public.tenants to anon, authenticated;
grant select on public.tenant_members to anon, authenticated;
grant select, insert, update, delete on public.desk_preferences to anon, authenticated;

-- =============================================================================
-- Beta waitlist (new)
-- =============================================================================

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
