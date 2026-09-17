import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildSessionFromPrivyToken } from "../auth/session-from-privy";

const KEYS = [
  "PRIVY_APP_ID",
  "PRIVY_APP_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FOLIO_SESSION_SECRET",
] as const;

function setAuthKeys() {
  process.env["PRIVY_APP_ID"] = "did:privy:test";
  process.env["PRIVY_APP_SECRET"] = "privy-secret";
  process.env["SUPABASE_URL"] = "https://example.supabase.co";
  process.env["SUPABASE_ANON_KEY"] = "anon";
  process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
  process.env["FOLIO_SESSION_SECRET"] = "test-session-secret-32bytes!!";
}

describe("buildSessionFromPrivyToken", () => {
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
    const res = await buildSessionFromPrivyToken({ accessToken: "tok" });
    expect(res.ok).toBe(false);
  });

  it("mints session when Privy + tenants succeed", async () => {
    setAuthKeys();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("auth.privy.io")) {
        return new Response(
          JSON.stringify({
            id: "did:privy:alice",
            wallet: { address: "Alice1111111111111111111111111111111111111" },
            email: { address: "a@example.com" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.includes("tenant_members")) {
        return new Response(
          JSON.stringify([
            {
              tenant_id: "11111111-1111-1111-1111-111111111111",
              user_id: "did:privy:alice",
              role: "owner",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(`unexpected ${url}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await buildSessionFromPrivyToken({ accessToken: "privy_tok" });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.session.userId).toBe("did:privy:alice");
      expect(res.data.session.tenants).toHaveLength(1);
      expect(res.data.session.tenants[0]?.role).toBe("owner");
      expect(res.data.cookieValue).toContain(".");
      expect(res.data.note).toMatch(/1 tenant/);
    }
    expect(fetchMock).toHaveBeenCalled();
  });

  it("fail-closes when tenant lookup errors (no invented empty tenants)", async () => {
    setAuthKeys();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("auth.privy.io")) {
        return new Response(JSON.stringify({ id: "did:privy:bob" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("db down", { status: 503 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await buildSessionFromPrivyToken({ accessToken: "privy_tok" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("tenants_resolve_failed");
  });

  it("allows empty tenants after successful lookup", async () => {
    setAuthKeys();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("auth.privy.io")) {
        return new Response(JSON.stringify({ id: "did:privy:carol" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.includes("tenant_members")) {
        return new Response("[]", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(`unexpected ${url}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await buildSessionFromPrivyToken({ accessToken: "privy_tok" });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.session.tenants).toEqual([]);
      expect(res.data.note).toMatch(/no tenant memberships/i);
    }
  });
});
