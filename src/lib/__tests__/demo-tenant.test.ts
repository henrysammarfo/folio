import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { attachUserToDemoTenant } from "../auth/demo-tenant";

describe("attachUserToDemoTenant", () => {
  const prev: Record<string, string | undefined> = {};
  const keys = [
    "PRIVY_APP_ID",
    "PRIVY_APP_SECRET",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
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

  it("refuses placeholder privy_did_here subjects", async () => {
    process.env["PRIVY_APP_ID"] = "did:privy:test";
    process.env["PRIVY_APP_SECRET"] = "secret";
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    process.env["FOLIO_SESSION_SECRET"] = "test-session-secret-32bytes!!";
    const res = await attachUserToDemoTenant({ userId: "privy_did_here" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("attach_user_invalid");
  });
});
