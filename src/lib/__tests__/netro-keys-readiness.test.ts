import { describe, expect, it } from "vitest";
import { buildNetroKeysReadiness } from "../netro-keys-readiness";

describe("buildNetroKeysReadiness", () => {
  it("reports fail-closed misses without inventing greens", () => {
    const keys = buildNetroKeysReadiness({
      bitqueryKeyPresent: false,
      pythApiKeyPresent: false,
      privyConfigured: false,
      supabaseConfigured: false,
      supabaseJwtConfigured: false,
      sessionSecretPresent: true,
      broadcastPaused: true,
      jupiterKeyPresent: false,
    });
    expect(keys.missingCount).toBeGreaterThanOrEqual(4);
    expect(keys.multiTenantLabel).toMatch(/fail-closed/i);
    expect(keys.rows.find((r) => r.id === "bitquery")?.ok).toBe(false);
    expect(keys.rows.find((r) => r.id === "broadcast")?.ok).toBe(true);
    expect(keys.rows.find((r) => r.id === "jupiter")?.status).toMatch(/optional/i);
  });

  it("arms multi-tenant label when Privy + Supabase present", () => {
    const keys = buildNetroKeysReadiness({
      bitqueryKeyPresent: true,
      pythApiKeyPresent: true,
      privyConfigured: true,
      supabaseConfigured: true,
      supabaseJwtConfigured: true,
      supabaseSchemaReady: true,
      sessionSecretPresent: true,
      broadcastPaused: true,
    });
    expect(keys.multiTenantLabel).toMatch(/armed/i);
    expect(keys.missingCount).toBe(0);
    expect(keys.rows.find((r) => r.id === "supabase")?.status).toMatch(/user-JWT/i);
  });

  it("labels schema missing when Supabase keyed but migration not applied", () => {
    const keys = buildNetroKeysReadiness({
      bitqueryKeyPresent: true,
      pythApiKeyPresent: true,
      privyConfigured: true,
      supabaseConfigured: true,
      supabaseJwtConfigured: false,
      supabaseSchemaReady: false,
      sessionSecretPresent: true,
      broadcastPaused: true,
    });
    expect(keys.rows.find((r) => r.id === "supabase")?.status).toMatch(/schema missing/i);
    expect(keys.rows.find((r) => r.id === "pyth")?.status).toMatch(/entitle/i);
  });
});
