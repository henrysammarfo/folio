import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isSupabaseUserJwtConfigured,
  mintSupabaseUserJwt,
  resolveSupabaseRestAuth,
} from "../auth/supabase-user-jwt";

const KEYS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",
] as const;

describe("supabase user JWT", () => {
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

  it("fail-closes mint without SUPABASE_JWT_SECRET", () => {
    const res = mintSupabaseUserJwt("did:privy:alice");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("supabase_jwt_secret_missing");
  });

  it("mints HS256 JWT with sub = Privy DID when secret present", () => {
    process.env["SUPABASE_JWT_SECRET"] = "test-supabase-jwt-secret-32b!!";
    const res = mintSupabaseUserJwt("did:privy:alice");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.path).toBe("user-jwt");
    const parts = res.data.token.split(".");
    expect(parts).toHaveLength(3);
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf8"),
    ) as { sub?: string; role?: string };
    expect(payload.sub).toBe("did:privy:alice");
    expect(payload.role).toBe("authenticated");
  });

  it("prefers user-jwt rest auth over service-role when JWT secret set", () => {
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon-key";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service-key";
    process.env["SUPABASE_JWT_SECRET"] = "test-supabase-jwt-secret-32b!!";
    expect(isSupabaseUserJwtConfigured()).toBe(true);
    const rest = resolveSupabaseRestAuth("did:privy:alice");
    expect(rest.ok).toBe(true);
    if (!rest.ok) return;
    expect(rest.data.path).toBe("user-jwt");
    expect(rest.data.apikey).toBe("anon-key");
    expect(rest.data.authorization.startsWith("Bearer ey")).toBe(true);
    expect(rest.data.authorization).not.toContain("service-key");
  });

  it("falls back to service-role when JWT secret missing", () => {
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon-key";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service-key";
    expect(isSupabaseUserJwtConfigured()).toBe(false);
    const rest = resolveSupabaseRestAuth("did:privy:alice");
    expect(rest.ok).toBe(true);
    if (!rest.ok) return;
    expect(rest.data.path).toBe("service-role");
    expect(rest.data.authorization).toBe("Bearer service-key");
  });
});
