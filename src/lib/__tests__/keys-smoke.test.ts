import { describe, expect, it } from "vitest";
import {
  classifyKeySmokeBaseline,
  summarizeKeySmoke,
  type KeySmokeEnv,
} from "../keys-smoke";

const allMissing: KeySmokeEnv = {
  bitquery: false,
  pyth: false,
  privy: false,
  supabase: false,
  sessionSecret: true,
  agentRouter: true,
  broadcastPaused: true,
};

describe("keys smoke baseline honesty", () => {
  it("fail-closes multi-tenant and skips missing probes without inventing ok", () => {
    const rows = classifyKeySmokeBaseline(allMissing);
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId.broadcast?.status).toBe("ok");
    expect(byId.session_secret?.status).toBe("ok");
    expect(byId.bitquery?.status).toBe("skipped");
    expect(byId.pyth?.status).toBe("skipped");
    expect(byId.privy?.status).toBe("skipped");
    expect(byId.supabase?.status).toBe("skipped");
    expect(byId.multi_tenant?.status).toBe("fail-closed");
    expect(byId.agentrouter?.status).toBe("ok");

    const summary = summarizeKeySmoke(rows);
    expect(summary.blockingMissing).toEqual(
      expect.arrayContaining(["bitquery", "pyth", "privy", "supabase"]),
    );
    expect(summary.probeReady).toEqual([]);
  });

  it("marks multi-tenant ready only when Privy + Supabase + session secret", () => {
    const rows = classifyKeySmokeBaseline({
      ...allMissing,
      privy: true,
      supabase: true,
      bitquery: true,
      pyth: true,
    });
    const mt = rows.find((r) => r.id === "multi_tenant");
    expect(mt?.status).toBe("ok");
    const summary = summarizeKeySmoke(rows);
    expect(summary.blockingMissing).toEqual([]);
    expect(summary.probeReady).toEqual(
      expect.arrayContaining(["bitquery", "pyth", "privy", "supabase"]),
    );
  });

  it("refuses unpaused broadcast as ok theater", () => {
    const rows = classifyKeySmokeBaseline({
      ...allMissing,
      broadcastPaused: false,
    });
    expect(rows.find((r) => r.id === "broadcast")?.status).toBe("fail-closed");
  });
});
