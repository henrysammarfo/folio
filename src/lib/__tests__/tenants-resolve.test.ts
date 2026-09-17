import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveTenantMemberships } from "../auth/tenants";

const KEYS = [
  "PRIVY_APP_ID",
  "PRIVY_APP_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FOLIO_SESSION_SECRET",
] as const;

describe("resolveTenantMemberships", () => {
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) {
      prev[k] = process.env[k];
      delete process.env[k];
    }
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of KEYS) {
      if (prev[k] == null) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  it("fail-closes without auth keys", async () => {
    const res = await resolveTenantMemberships({ userId: "did:privy:alice" });
    expect(res.ok).toBe(false);
  });

  it("fail-closes on missing userId even when keys present", async () => {
    process.env["PRIVY_APP_ID"] = "did:privy:test";
    process.env["PRIVY_APP_SECRET"] = "secret";
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    process.env["FOLIO_SESSION_SECRET"] = "test-session-secret-32b";

    const res = await resolveTenantMemberships({ userId: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("tenants_user_missing");
  });

  it("embeds slug/displayName/wallet when Supabase join succeeds", async () => {
    process.env["PRIVY_APP_ID"] = "did:privy:test";
    process.env["PRIVY_APP_SECRET"] = "secret";
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    process.env["FOLIO_SESSION_SECRET"] = "test-session-secret-32b";

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            tenant_id: "11111111-1111-1111-1111-111111111111",
            user_id: "did:privy:alice",
            role: "owner",
            wallet_address: "Wallet1111111111111111111111111111111111111",
            tenants: { slug: "folio-demo", display_name: "FOLIO demo desk" },
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await resolveTenantMemberships({ userId: "did:privy:alice" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data[0]).toMatchObject({
      role: "owner",
      slug: "folio-demo",
      displayName: "FOLIO demo desk",
      walletAddress: "Wallet1111111111111111111111111111111111111",
    });
    expect(decodeURIComponent(String(fetchMock.mock.calls[0]?.[0]))).toMatch(
      /tenants\(slug,display_name\)/,
    );
  });
});
