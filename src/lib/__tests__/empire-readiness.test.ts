import { describe, expect, it } from "vitest";
import { readEmpireReadiness } from "../desk.empire";

describe("readEmpireReadiness", () => {
  it("fail-closes Empire keys when env empty", () => {
    const r = readEmpireReadiness({
      BROADCAST_PAUSED: "true",
      FOLIO_SESSION_SECRET: "x".repeat(16),
      FOLIO_APPROVED_LAB_UI: "netro-density",
    } as NodeJS.ProcessEnv);
    expect(r.bitqueryKeyPresent).toBe(false);
    expect(r.pythApiKeyPresent).toBe(false);
    expect(r.privyConfigured).toBe(false);
    expect(r.supabaseConfigured).toBe(false);
    expect(r.supabaseSchemaReady).toBe(false);
    expect(r.sessionSecretPresent).toBe(true);
    expect(r.broadcastPaused).toBe(true);
    expect(r.approvedLabUi).toBe("netro-density");
  });

  it("arms multi-tenant flags only when Privy + Supabase both set", () => {
    const r = readEmpireReadiness({
      BROADCAST_PAUSED: "true",
      FOLIO_SESSION_SECRET: "x".repeat(16),
      PRIVY_APP_ID: "did:privy:test",
      PRIVY_APP_SECRET: "secret",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      SUPABASE_JWT_SECRET: "y".repeat(16),
    } as NodeJS.ProcessEnv);
    expect(r.privyConfigured).toBe(true);
    expect(r.supabaseConfigured).toBe(true);
    expect(r.supabaseJwtConfigured).toBe(true);
  });
});
