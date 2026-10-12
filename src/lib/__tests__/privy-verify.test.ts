import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { verifyPrivyAccessToken } from "../auth/privy";

const KEYS = [
  "PRIVY_APP_ID",
  "PRIVY_APP_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "FOLIO_SESSION_SECRET",
] as const;

describe("verifyPrivyAccessToken", () => {
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) {
      prev[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of KEYS) {
      if (prev[k] == null) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  it("fail-closes without auth keys", async () => {
    const res = await verifyPrivyAccessToken("tok_test");
    expect(res.ok).toBe(false);
  });

  it("fail-closes on empty token even when keys present", async () => {
    process.env["PRIVY_APP_ID"] = "did:privy:test";
    process.env["PRIVY_APP_SECRET"] = "secret";
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    process.env["FOLIO_SESSION_SECRET"] = "test-session-secret-32b";

    const res = await verifyPrivyAccessToken("");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("privy_token_missing");
  });

  it("prefers Solana linked wallet over EVM primary for email users", async () => {
    process.env["PRIVY_APP_ID"] = "did:privy:test";
    process.env["PRIVY_APP_SECRET"] = "secret";
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_ANON_KEY"] = "anon";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    process.env["FOLIO_SESSION_SECRET"] = "test-session-secret-32b";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            id: "did:privy:email-user",
            email: { address: "u@example.com" },
            wallet: {
              address: "0x1111111111111111111111111111111111111111",
              chain_type: "ethereum",
            },
            linked_accounts: [
              {
                type: "wallet",
                address: "0x1111111111111111111111111111111111111111",
                chain_type: "ethereum",
              },
              {
                type: "wallet",
                address: "SoL111111111111111111111111111111111111111",
                chain_type: "solana",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const res = await verifyPrivyAccessToken("privy_tok");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.walletAddress).toBe(
        "SoL111111111111111111111111111111111111111",
      );
    }
  });
});
