import { describe, expect, it } from "vitest";
import {
  activeMembership,
  canWriteDeskPrefs,
  prefsWriteBlockedReason,
} from "../auth/role-gates";
import type { FolioSession, TenantMembership } from "../auth/session";

const OWNER: TenantMembership = {
  tenantId: "11111111-1111-1111-1111-111111111111",
  userId: "did:privy:alice",
  role: "owner",
  walletAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  slug: "alpha",
  displayName: "Alpha Desk",
};

const VIEWER: TenantMembership = {
  tenantId: "22222222-2222-2222-2222-222222222222",
  userId: "did:privy:alice",
  role: "viewer",
  walletAddress: null,
  slug: "beta",
  displayName: "Beta Desk",
};

const TRADER: TenantMembership = {
  ...VIEWER,
  tenantId: "33333333-3333-3333-3333-333333333333",
  role: "trader",
  slug: "gamma",
  displayName: "Gamma Desk",
};

function sessionOf(
  tenants: TenantMembership[],
  activeTenantId?: string | null,
): FolioSession {
  return {
    sessionId: "sess-test",
    userId: "did:privy:alice",
    walletAddress: "11111111111111111111111111111111",
    tenants,
    activeTenantId: activeTenantId ?? tenants[0]?.tenantId ?? null,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  };
}

describe("canWriteDeskPrefs", () => {
  it("allows owner and trader only", () => {
    expect(canWriteDeskPrefs("owner")).toBe(true);
    expect(canWriteDeskPrefs("trader")).toBe(true);
    expect(canWriteDeskPrefs("viewer")).toBe(false);
    expect(canWriteDeskPrefs(null)).toBe(false);
    expect(canWriteDeskPrefs(undefined)).toBe(false);
  });
});

describe("activeMembership", () => {
  it("resolves the active tenant membership", () => {
    const s = sessionOf([OWNER, VIEWER], VIEWER.tenantId);
    expect(activeMembership(s)?.tenantId).toBe(VIEWER.tenantId);
    expect(activeMembership(s)?.role).toBe("viewer");
  });

  it("returns null when no tenants", () => {
    expect(activeMembership(sessionOf([]))).toBeNull();
  });
});

describe("prefsWriteBlockedReason", () => {
  it("blocks missing membership", () => {
    expect(prefsWriteBlockedReason(null)).toMatch(/No active tenant membership/);
  });

  it("blocks viewer role", () => {
    expect(prefsWriteBlockedReason(VIEWER)).toMatch(/viewer is read-only/);
  });

  it("allows owner and trader", () => {
    expect(prefsWriteBlockedReason(OWNER)).toBeNull();
    expect(prefsWriteBlockedReason(TRADER)).toBeNull();
  });
});
