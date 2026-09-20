import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { upsertBetaWaitlist } from "../auth/beta-waitlist";

const KEYS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

describe("upsertBetaWaitlist", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of KEYS) {
      if (saved[k] == null) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("fail-closes without Supabase keys — never invents success", async () => {
    const res = await upsertBetaWaitlist({ email: "a@b.co" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("waitlist_unavailable");
  });

  it("rejects invalid email", async () => {
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    const res = await upsertBetaWaitlist({ email: "not-an-email" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("waitlist_email_invalid");
  });

  it("upserts via service-role when PostgREST returns 201", async () => {
    process.env["SUPABASE_URL"] = "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "service";
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            email: "henry@folio.test",
            created_at: "2026-09-20T00:00:00.000Z",
          },
        ]),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await upsertBetaWaitlist({
      email: "Henry@Folio.Test",
      note: "Stocklana",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.email).toBe("henry@folio.test");
      expect(res.data.upserted).toBe(true);
    }
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/beta_waitlist/);
  });
});
