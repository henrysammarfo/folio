import { errResult, okResult, type AdapterResult } from "../adapters/types";
import { getAuthProviderStatus, type TenantMembership } from "./session";

export type TenantResolveInput = {
  userId: string;
};

type TenantMemberRow = {
  tenant_id?: string;
  user_id?: string;
  role?: string;
  wallet_address?: string | null;
  tenants?:
    | { slug?: string | null; display_name?: string | null }
    | Array<{ slug?: string | null; display_name?: string | null }>
    | null;
};

function tenantEmbed(
  row: TenantMemberRow,
): { slug: string | null; displayName: string | null } {
  const embed = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
  return {
    slug: embed?.slug?.trim() || null,
    displayName: embed?.display_name?.trim() || null,
  };
}

/**
 * Resolve tenant memberships for a Privy subject via Supabase service role.
 * Fail-closed when keys missing or the query errors — never invent tenants.
 * Embeds tenants.slug / display_name when the FK join is available.
 */
export async function resolveTenantMemberships(
  input: TenantResolveInput,
): Promise<AdapterResult<TenantMembership[]>> {
  const source = "supabase.tenant_members";
  const auth = getAuthProviderStatus();
  if (!auth.ok) {
    return errResult(source, "tenants_require_auth_keys", auth.detail ?? auth.reason);
  }
  if (!input.userId?.trim()) {
    return errResult(source, "tenants_user_missing", "Privy subject required.");
  }

  const url = process.env["SUPABASE_URL"]?.trim();
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !serviceKey) {
    return errResult(source, "supabase_keys_missing", "SUPABASE_URL / SERVICE_ROLE_KEY required.");
  }

  try {
    const endpoint = new URL("/rest/v1/tenant_members", url);
    endpoint.searchParams.set("user_id", `eq.${input.userId.trim()}`);
    endpoint.searchParams.set(
      "select",
      "tenant_id,user_id,role,wallet_address,tenants(slug,display_name)",
    );

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return errResult(
        source,
        "supabase_tenants_http_error",
        `HTTP ${res.status} ${body.slice(0, 180)} — fail-closed.`,
      );
    }

    const rows = (await res.json()) as TenantMemberRow[];

    if (!Array.isArray(rows)) {
      return errResult(source, "supabase_tenants_malformed", "Expected array of memberships.");
    }

    const tenants: TenantMembership[] = [];
    for (const row of rows) {
      if (!row.tenant_id || !row.user_id) continue;
      const role =
        row.role === "owner" || row.role === "trader" || row.role === "viewer"
          ? row.role
          : null;
      if (!role) continue;
      const embed = tenantEmbed(row);
      tenants.push({
        tenantId: row.tenant_id,
        userId: row.user_id,
        role,
        walletAddress: row.wallet_address?.trim() || null,
        slug: embed.slug,
        displayName: embed.displayName,
      });
    }

    return okResult("mainnet-read", source, tenants);
  } catch (e) {
    return errResult(source, "supabase_tenants_failed", `${String(e)} — fail-closed.`);
  }
}
