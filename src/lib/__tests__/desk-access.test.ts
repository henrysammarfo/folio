import { describe, expect, it } from "vitest";
import {
  agentBlockedReason,
  bootstrapBlockedReason,
  deskAccessFromSession,
} from "../auth/desk-access";
import type { FolioSession } from "../auth/session";
import { errResult, okResult } from "../adapters/types";

function session(partial?: Partial<FolioSession>): FolioSession {
  return {
    sessionId: "s1",
    userId: "did:privy:test",
    walletAddress: null,
    tenants: [
      {
        tenantId: "11111111-1111-1111-1111-111111111111",
        userId: "did:privy:test",
        role: "owner",
        walletAddress: null,
        slug: "folio-demo",
        displayName: "FOLIO demo",
      },
    ],
    activeTenantId: "11111111-1111-1111-1111-111111111111",
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    ...partial,
  };
}

describe("deskAccessFromSession", () => {
  it("labels anonymous browse", () => {
    const access = deskAccessFromSession(
      errResult("folio.session", "missing_cookie"),
    );
    expect(access.signedIn).toBe(false);
    expect(access.tenantCount).toBe(0);
    expect(access.note).toMatch(/without a signed session/i);
  });

  it("surfaces active tenant role", () => {
    const access = deskAccessFromSession(
      okResult("mainnet-read", "folio.session", session()),
    );
    expect(access.signedIn).toBe(true);
    expect(access.role).toBe("owner");
    expect(access.tenantCount).toBe(1);
    expect(access.note).toMatch(/owner/i);
  });
});

describe("agentBlockedReason", () => {
  it("blocks anonymous agent runs", () => {
    expect(
      agentBlockedReason(errResult("folio.session", "missing_cookie")),
    ).toMatch(/signed session/i);
  });
  it("allows verified sessions", () => {
    expect(
      agentBlockedReason(okResult("mainnet-read", "folio.session", session())),
    ).toBeNull();
  });
});

describe("bootstrapBlockedReason", () => {
  it("respects FOLIO_ALLOW_BOOTSTRAP_DEMO flag", () => {
    const prev = process.env["FOLIO_ALLOW_BOOTSTRAP_DEMO"];
    delete process.env["FOLIO_ALLOW_BOOTSTRAP_DEMO"];
    expect(bootstrapBlockedReason()).toMatch(/disabled/i);
    process.env["FOLIO_ALLOW_BOOTSTRAP_DEMO"] = "1";
    expect(bootstrapBlockedReason()).toBeNull();
    if (prev == null) delete process.env["FOLIO_ALLOW_BOOTSTRAP_DEMO"];
    else process.env["FOLIO_ALLOW_BOOTSTRAP_DEMO"] = prev;
  });
});
