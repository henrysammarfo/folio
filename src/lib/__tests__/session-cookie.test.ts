import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getAuthProviderStatus,
  mintFolioSession,
  parseFolioSessionCookie,
  resolveActiveTenantId,
  FOLIO_SESSION_COOKIE,
  type FolioSession,
  type TenantMembership,
} from "../auth/session";

const KEYS = [
  "PRIVY_APP_ID",
  "PRIVY_APP_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FOLIO_SESSION_SECRET",
] as const;

const tenantA: TenantMembership = {
  tenantId: "11111111-1111-1111-1111-111111111111",
  userId: "did:privy:alice",
  role: "owner",
  walletAddress: null,
  slug: "alpha",
  displayName: "Alpha Desk",
};

const tenantB: TenantMembership = {
  tenantId: "22222222-2222-2222-2222-222222222222",
  userId: "did:privy:alice",
  role: "trader",
  walletAddress: null,
  slug: "beta",
  displayName: "Beta Desk",
};

describe("folio session cookie", () => {
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) {
      prev[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of KEYS) {
      if (prev[k] == null) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  it("fail-closes auth without Privy/Supabase keys", () => {
    const auth = getAuthProviderStatus();
    expect(auth.ok).toBe(false);
    if (!auth.ok) {
      expect(["auth_keys_missing", "session_secret_missing"]).toContain(auth.reason);
    }
  });

  it("mints and verifies httpOnly cookie when keys + secret present", () => {
    process.env["PRIVY_APP_ID"] = "did:privy:test";
    process.env["PRIVY_APP_SECRET"] = "secret";
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    process.env["FOLIO_SESSION_SECRET"] = "test-session-secret-32b";

    const minted = mintFolioSession({ userId: "did:privy:alice" });
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;

    const parsed = parseFolioSessionCookie(
      `${FOLIO_SESSION_COOKIE}=${minted.data.cookieValue}`,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.userId).toBe("did:privy:alice");
    expect(parsed.data.activeTenantId).toBeNull();

    const auth = getAuthProviderStatus(parsed);
    expect(auth.ok).toBe(true);
    if (auth.ok) expect(auth.data.sessionReady).toBe(true);
  });

  it("persists membership-validated activeTenantId on mint", () => {
    process.env["PRIVY_APP_ID"] = "did:privy:test";
    process.env["PRIVY_APP_SECRET"] = "secret";
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    process.env["FOLIO_SESSION_SECRET"] = "test-session-secret-32b";
    const minted = mintFolioSession({
      userId: "did:privy:alice",
      tenants: [tenantA, tenantB],
      activeTenantId: tenantB.tenantId,
    });
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    expect(minted.data.session.activeTenantId).toBe(tenantB.tenantId);

    const parsed = parseFolioSessionCookie(
      `${FOLIO_SESSION_COOKIE}=${minted.data.cookieValue}`,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.activeTenantId).toBe(tenantB.tenantId);
  });

  it("rejects invent-a-membership activeTenantId and falls back to first", () => {
    process.env["PRIVY_APP_ID"] = "did:privy:test";
    process.env["PRIVY_APP_SECRET"] = "secret";
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    process.env["FOLIO_SESSION_SECRET"] = "test-session-secret-32b";
    const minted = mintFolioSession({
      userId: "did:privy:alice",
      tenants: [tenantA, tenantB],
      activeTenantId: "99999999-9999-9999-9999-999999999999",
    });
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    expect(minted.data.session.activeTenantId).toBe(tenantA.tenantId);
  });

  it("rejects tampered cookie signatures", () => {
    process.env["PRIVY_APP_ID"] = "did:privy:test";
    process.env["PRIVY_APP_SECRET"] = "secret";
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    process.env["FOLIO_SESSION_SECRET"] = "test-session-secret-32b";

    const minted = mintFolioSession({ userId: "did:privy:alice" });
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;

    const [payload] = minted.data.cookieValue.split(".");
    const parsed = parseFolioSessionCookie(
      `${FOLIO_SESSION_COOKIE}=${payload}.deadbeef`,
    );
    expect(parsed.ok).toBe(false);
  });
});

describe("resolveActiveTenantId", () => {
  const base: FolioSession = {
    sessionId: "s1",
    userId: "did:privy:alice",
    walletAddress: null,
    tenants: [tenantA, tenantB],
    activeTenantId: null,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };

  it("returns the membership-validated active id", () => {
    expect(
      resolveActiveTenantId({ ...base, activeTenantId: tenantB.tenantId }),
    ).toBe(tenantB.tenantId);
  });

  it("falls back to first membership when active is missing or foreign", () => {
    expect(resolveActiveTenantId({ ...base, activeTenantId: null })).toBe(
      tenantA.tenantId,
    );
    expect(
      resolveActiveTenantId({
        ...base,
        activeTenantId: "99999999-9999-9999-9999-999999999999",
      }),
    ).toBe(tenantA.tenantId);
  });
});
