import { errResult, okResult, type AdapterResult } from "../adapters/types";
import { verifyPrivyAccessToken } from "./privy";
import { mintFolioSession, type FolioSession } from "./session";
import { resolveTenantMemberships } from "./tenants";

export type PrivySessionBundle = {
  session: FolioSession;
  cookieValue: string;
  setCookie: string;
  note: string;
};

/**
 * Privy token → verified identity → tenant memberships → signed folio_session.
 * Fail-closed if Privy rejects OR tenant lookup fails (never invent empty tenants on error).
 * Empty memberships after a successful lookup are allowed and labeled.
 */
export async function buildSessionFromPrivyToken(input: {
  accessToken: string;
  walletAddress?: string | null;
}): Promise<AdapterResult<PrivySessionBundle>> {
  const source = "folio.session.privy";
  const identity = await verifyPrivyAccessToken(input.accessToken);
  if (!identity.ok) {
    return errResult(source, identity.reason, identity.detail);
  }

  const tenantsRes = await resolveTenantMemberships({
    userId: identity.data.userId,
  });
  if (!tenantsRes.ok) {
    return errResult(
      source,
      "tenants_resolve_failed",
      tenantsRes.detail ??
        tenantsRes.reason ??
        "Tenant membership lookup failed — refusing to mint a session with invented empty tenants.",
    );
  }

  const tenants = tenantsRes.data;
  const minted = mintFolioSession({
    userId: identity.data.userId,
    walletAddress: input.walletAddress ?? identity.data.walletAddress,
    tenants,
  });
  if (!minted.ok) {
    return errResult(source, minted.reason, minted.detail);
  }

  return okResult("mainnet-read", source, {
    session: minted.data.session,
    cookieValue: minted.data.cookieValue,
    setCookie: minted.data.setCookie,
    note: tenants.length
      ? `httpOnly folio_session ready · ${tenants.length} tenant membership(s) resolved`
      : "httpOnly folio_session ready · no tenant memberships (empty after successful lookup)",
  });
}
