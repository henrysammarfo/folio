import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveDeskPreferences } from "../auth/session";

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

describe("saveDeskPreferences", () => {
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
    const res = await saveDeskPreferences("t1", "u1", {
      corporateActionAlerts: false,
      strictFailClosed: true,
    });
    expect(res.ok).toBe(false);
  });

  it("upserts prefs when keyed", async () => {
    setAuthKeys();
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            corporate_action_alerts: false,
            strict_fail_closed: true,
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await saveDeskPreferences(
      "11111111-1111-1111-1111-111111111111",
      "did:privy:alice",
      { corporateActionAlerts: false, strictFailClosed: true },
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.corporateActionAlerts).toBe(false);
    expect(res.data.strictFailClosed).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [RequestInfo, RequestInit];
    expect(String(url)).toMatch(/on_conflict=tenant_id%2Cuser_id|on_conflict=tenant_id,user_id/);
    expect(init.method).toBe("POST");
    expect(String(init.headers && (init.headers as Record<string, string>)["Prefer"])).toMatch(
      /merge-duplicates/,
    );
  });
});
