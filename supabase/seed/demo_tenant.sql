-- Optional seed after 20260915_folio_tenants.sql
-- Replace privy_did_here with a real Privy subject (did:privy:…).
-- Service-role insert only — anon clients cannot invent memberships.

insert into public.tenants (slug, display_name)
values ('folio-demo', 'FOLIO demo desk')
on conflict (slug) do nothing;

insert into public.tenant_members (tenant_id, user_id, role)
select t.id, 'privy_did_here', 'owner'
from public.tenants t
where t.slug = 'folio-demo'
on conflict (tenant_id, user_id) do nothing;

insert into public.desk_preferences (tenant_id, user_id, corporate_action_alerts, strict_fail_closed)
select t.id, 'privy_did_here', true, true
from public.tenants t
where t.slug = 'folio-demo'
on conflict (tenant_id, user_id) do nothing;
