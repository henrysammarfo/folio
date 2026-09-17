import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ensureBootstrapPrivyUser } from "../auth/privy-users";
import { buildBootstrapDemoSession } from "../auth/bootstrap-demo-session";

describe("ensureBootstrapPrivyUser", () => {
  const prev: Record<string, string | undefined> = {};
  const keys = ["PRIVY_APP_ID", "PRIVY_APP_SECRET"];

  beforeEach(() => {
    for (const k of keys) {
      prev[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of keys) {
      if (prev[k] == null) delete process.env[k];
      else process.env[k] = prev[k];
    }
    vi.unstubAllGlobals();
  });

  it("fails closed without Privy keys", async () => {
    const res = await ensureBootstrapPrivyUser();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("privy_keys_missing");
  });

  it("returns real DID on create — never invents", async () => {
    process.env["PRIVY_APP_ID"] = "app_test";
    process.env["PRIVY_APP_SECRET"] = "secret_test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: "did:privy:bootstrap_user_1" }),
        json: async () => ({ id: "did:privy:bootstrap_user_1" }),
      })),
    );
    const res = await ensureBootstrapPrivyUser();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.userId).toBe("did:privy:bootstrap_user_1");
      expect(res.data.created).toBe(true);
    }
  });

  it("rejects non-privy ids", async () => {
    process.env["PRIVY_APP_ID"] = "app_test";
    process.env["PRIVY_APP_SECRET"] = "secret_test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: "fake-user" }),
        json: async () => ({ id: "fake-user" }),
      })),
    );
    const res = await ensureBootstrapPrivyUser();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("privy_user_id_invalid");
  });
});

describe("buildBootstrapDemoSession", () => {
  const prev: Record<string, string | undefined> = {};
  const keys = [
    "PRIVY_APP_ID",
    "PRIVY_APP_SECRET",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_JWT_SECRET",
    "FOLIO_SESSION_SECRET",
  ];

  beforeEach(() => {
    for (const k of keys) {
      prev[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of keys) {
      if (prev[k] == null) delete process.env[k];
      else process.env[k] = prev[k];
    }
    vi.unstubAllGlobals();
  });

  it("fails closed without keys", async () => {
    const res = await buildBootstrapDemoSession();
    expect(res.ok).toBe(false);
  });

  it("mints+verifies when Privy+Supabase path succeeds", async () => {
    process.env["PRIVY_APP_ID"] = "app_test";
    process.env["PRIVY_APP_SECRET"] = "secret_test";
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    process.env["FOLIO_SESSION_SECRET"] = "test-session-secret-32bytes!!";

    const tenantId = "11111111-1111-4111-8111-111111111111";
    const userId = "did:privy:bootstrap_user_2";

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();

        if (url.includes("auth.privy.io/api/v1/users") && method === "POST") {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ id: userId }),
            json: async () => ({ id: userId }),
          };
        }
        if (url.includes("/rest/v1/tenants") && method === "POST") {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify([{ id: tenantId, slug: "folio-demo" }]),
            json: async () => [{ id: tenantId, slug: "folio-demo" }],
          };
        }
        if (url.includes("/rest/v1/tenant_members") && method === "POST") {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify([
                {
                  tenant_id: tenantId,
                  user_id: userId,
                  role: "owner",
                },
              ]),
            json: async () => [
              { tenant_id: tenantId, user_id: userId, role: "owner" },
            ],
          };
        }
        if (url.includes("/rest/v1/tenant_members") && method === "DELETE") {
          return { ok: true, status: 204, text: async () => "", json: async () => ({}) };
        }
        if (url.includes("/rest/v1/tenant_members") && method === "GET") {
          return {
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify([
                {
                  tenant_id: tenantId,
                  user_id: userId,
                  role: "owner",
                  wallet_address: null,
                  tenants: {
                    id: tenantId,
                    slug: "folio-demo",
                    display_name: "FOLIO demo desk",
                  },
                },
              ]),
            json: async () => [
              {
                tenant_id: tenantId,
                user_id: userId,
                role: "owner",
                wallet_address: null,
                tenants: {
                  id: tenantId,
                  slug: "folio-demo",
                  display_name: "FOLIO demo desk",
                },
              },
            ],
          };
        }
        return {
          ok: false,
          status: 404,
          text: async () => `unexpected ${method} ${url}`,
          json: async () => ({}),
        };
      }),
    );

    const res = await buildBootstrapDemoSession();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.multiTenantSessionReady).toBe(true);
      expect(res.data.userId).toBe(userId);
      expect(res.data.memberships).toBeGreaterThanOrEqual(1);
      expect(res.data.session.tenants[0]?.slug).toBe("folio-demo");
      expect(res.data.cookieValue.includes(".")).toBe(true);
    }
  });
});
