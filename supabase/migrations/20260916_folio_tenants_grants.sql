-- FOLIO follow-up: grant PostgREST roles after 20260915_folio_tenants.sql
-- Henry: paste this in Supabase SQL editor NOW (tables exist but service_role got 42501).

grant select, insert, update, delete on public.tenants to service_role;
grant select, insert, update, delete on public.tenant_members to service_role;
grant select, insert, update, delete on public.desk_preferences to service_role;

-- Anon/authenticated: RLS policies gate rows; roles still need table privileges.
grant select on public.tenants to anon, authenticated;
grant select on public.tenant_members to anon, authenticated;
grant select, insert, update, delete on public.desk_preferences to anon, authenticated;
