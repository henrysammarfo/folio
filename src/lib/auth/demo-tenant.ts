/**
 * Attach a verified Privy subject to folio-demo as owner (service-role bootstrap).
 * Never invents a Privy subject — caller must pass the session userId.
 */
import { errResult, okResult, type AdapterResult } from "../adapters/types";
import { getAuthProviderStatus } from "./session";
import { resolveTenantMemberships } from "./tenants";

const DEMO_SLUG = "folio-demo";

export async function ensureDemoTenantExists(): Promise<
  AdapterResult<{ tenantId: string; slug: string }>
> {
  const source = "folio.demo-tenant.ensure";
  const url = process.env["SUPABASE_URL"]?.trim()?.replace(/\/$/, "");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !key) {
    return errResult(
      source,
      "supabase_keys_missing",
      "Service-role required to ensure demo tenant.",
    );
  }
  try {
    const upsert = await fetch(`${url}/rest/v1/tenants?on_conflict=slug`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        slug: DEMO_SLUG,
        display_name: "FOLIO demo desk",
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!upsert.ok) {
      const body = await upsert.text().catch(() => "");
      return errResult(
        source,
        "demo_tenant_upsert_failed",
        `HTTP ${upsert.status} ${body.slice(0, 120)}`,
      );
    }
    const rows = (await upsert.json()) as Array<{ id?: string; slug?: string }>;
    const id = rows[0]?.id;
    if (!id) {
      // merge-duplicates may return empty — fetch by slug
      const get = await fetch(
        `${url}/rest/v1/tenants?select=id,slug&slug=eq.${DEMO_SLUG}`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Accept: "application/json",
          },
        },
      );
      const found = (await get.json()) as Array<{ id?: string }>;
      if (!found[0]?.id) {
        return errResult(source, "demo_tenant_missing_id", "Could not resolve folio-demo id.");
      }
      return okResult("mainnet-read", source, {
        tenantId: found[0].id,
        slug: DEMO_SLUG,
      });
    }
    return okResult("mainnet-read", source, { tenantId: id, slug: DEMO_SLUG });
  } catch (e) {
    return errResult(source, "demo_tenant_failed", String(e));
  }
}

export async function attachUserToDemoTenant(input: {
  userId: string;
  walletAddress?: string | null;
}): Promise<
  AdapterResult<{
    tenantId: string;
    userId: string;
    role: "owner";
    memberships: number;
    note: string;
  }>
> {
  const source = "folio.demo-tenant.attach";
  const auth = getAuthProviderStatus();
  if (!auth.ok) {
    return errResult(
      source,
      "attach_requires_auth_keys",
      auth.detail ?? auth.reason,
    );
  }
  const userId = input.userId?.trim();
  if (!userId || userId === "privy_did_here") {
    return errResult(
      source,
      "attach_user_invalid",
      "Real Privy DID required — refuse placeholder seed subjects.",
    );
  }
  const url = process.env["SUPABASE_URL"]?.trim()?.replace(/\/$/, "");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !key) {
    return errResult(
      source,
      "supabase_keys_missing",
      "Service-role required for demo attach.",
    );
  }

  const ensured = await ensureDemoTenantExists();
  if (!ensured.ok) return ensured;

  try {
    const res = await fetch(
      `${url}/rest/v1/tenant_members?on_conflict=tenant_id,user_id`,
      {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          tenant_id: ensured.data.tenantId,
          user_id: userId,
          role: "owner",
          wallet_address: input.walletAddress ?? null,
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return errResult(
        source,
        "attach_http_error",
        `HTTP ${res.status} ${body.slice(0, 140)}`,
      );
    }

    await fetch(`${url}/rest/v1/tenant_members?user_id=eq.privy_did_here`, {
      method: "DELETE",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }).catch(() => null);

    const memberships = await resolveTenantMemberships({ userId });
    const count = memberships.ok ? memberships.data.length : 0;
    return okResult("mainnet-read", source, {
      tenantId: ensured.data.tenantId,
      userId,
      role: "owner" as const,
      memberships: count,
      note:
        count > 0
          ? `Attached as owner of folio-demo · remint session to refresh cookie tenants`
          : "Attached · remint session to refresh cookie tenants",
    });
  } catch (e) {
    return errResult(source, "attach_failed", String(e));
  }
}
