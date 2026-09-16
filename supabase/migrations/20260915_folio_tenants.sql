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

-- RLS: auth.jwt() ->> 'sub' must equal Privy DID (user_id).
-- FOLIO mints short-lived HS256 user JWTs when SUPABASE_JWT_SECRET is set
-- (see src/lib/auth/supabase-user-jwt.ts). Without the JWT secret, server uses
-- labeled service-role fallback — anon client still must not bypass these policies.
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

-- Desk prefs: any member may read their own row; only owner/trader may write.
-- Mirrors src/lib/auth/role-gates.ts — viewers fail-closed at RLS + app.
drop policy if exists desk_prefs_self_all on public.desk_preferences;

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