/**
 * Labeled Stocklana demo bootstrap: real Privy DID → folio-demo owner → mint.
 * Never invents did:privy:… — fails closed if Privy/Supabase/session secret miss.
 */
import { errResult, okResult, type AdapterResult } from "../adapters/types";
import { attachUserToDemoTenant } from "./demo-tenant";
import { ensureBootstrapPrivyUser, FOLIO_BOOTSTRAP_CUSTOM_ID } from "./privy-users";
import {
  mintFolioSession,
  verifyFolioSessionCookieValue,
  type FolioSession,
} from "./session";
import { resolveTenantMemberships } from "./tenants";

export type BootstrapDemoSessionResult = {
  session: FolioSession;
  cookieValue: string;
  setCookie: string;
  userId: string;
  tenantId: string;
  memberships: number;
  privyCreated: boolean;
  note: string;
  /** True when mint verifies and folio-demo membership is present. */
  multiTenantSessionReady: boolean;
};

/**
 * End-to-end demo desk session without a browser Privy login.
 * Uses Privy REST custom_auth id `folio-demo-bootstrap` — real DID only.
 */
export async function buildBootstrapDemoSession(): Promise<
  AdapterResult<BootstrapDemoSessionResult>
> {
  const source = "folio.session.bootstrap-demo";

  const privyUser = await ensureBootstrapPrivyUser();
  if (!privyUser.ok) {
    return errResult(source, privyUser.reason, privyUser.detail);
  }

  const attached = await attachUserToDemoTenant({
    userId: privyUser.data.userId,
  });
  if (!attached.ok) {
    return errResult(source, attached.reason, attached.detail);
  }

  const memberships = await resolveTenantMemberships({
    userId: privyUser.data.userId,
  });
  if (!memberships.ok) {
    return errResult(
      source,
      "tenants_resolve_failed",
      memberships.detail ??
        memberships.reason ??
        "Tenant membership lookup failed after attach — refusing invent-empty mint.",
    );
  }

  const tenants = memberships.data;
  if (tenants.length === 0) {
    return errResult(
      source,
      "bootstrap_memberships_empty",
      "Attach succeeded but membership lookup returned empty — refuse mint.",
    );
  }

  const minted = mintFolioSession({
    userId: privyUser.data.userId,
    tenants,
    activeTenantId: attached.data.tenantId,
  });
  if (!minted.ok) {
    return errResult(source, minted.reason, minted.detail);
  }

  const verified = verifyFolioSessionCookieValue(minted.data.cookieValue);
  if (!verified.ok) {
    return errResult(
      source,
      "bootstrap_verify_failed",
      verified.detail ?? verified.reason,
    );
  }

  const hasDemo = verified.data.tenants.some(
    (t) =>
      t.tenantId === attached.data.tenantId ||
      t.slug === "folio-demo" ||
      t.role === "owner",
  );
  const multiTenantSessionReady =
    verified.ok &&
    verified.data.userId === privyUser.data.userId &&
    verified.data.tenants.length >= 1 &&
    hasDemo;

  if (!multiTenantSessionReady) {
    return errResult(
      source,
      "bootstrap_not_ready",
      "Mint verified but folio-demo membership missing on cookie — fail-closed.",
    );
  }

  return okResult("mainnet-read", source, {
    session: minted.data.session,
    cookieValue: minted.data.cookieValue,
    setCookie: minted.data.setCookie,
    userId: privyUser.data.userId,
    tenantId: attached.data.tenantId,
    memberships: tenants.length,
    privyCreated: privyUser.data.created,
    multiTenantSessionReady: true,
    note: `Labeled bootstrap · ${FOLIO_BOOTSTRAP_CUSTOM_ID} · ${privyUser.data.userId.slice(0, 20)}… · folio-demo owner · ${tenants.length} membership(s)${privyUser.data.created ? " · Privy user created" : " · Privy user reused"}`,
  });
}
