import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getAuthProviderStatus,
  mintFolioSession,
  parseFolioSessionCookie,
  FOLIO_SESSION_COOKIE,
} from "../auth/session";

const KEYS = [
  "PRIVY_APP_ID",
  "PRIVY_APP_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FOLIO_SESSION_SECRET",
] as const;

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

    const auth = getAuthProviderStatus(parsed);
    expect(auth.ok).toBe(true);
    if (auth.ok) expect(auth.data.sessionReady).toBe(true);
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
      `${FOLIO_SESSION_COOKIE}=${payload}.tampered-signature`,
    );
    expect(parsed.ok).toBe(false);
  });
});
