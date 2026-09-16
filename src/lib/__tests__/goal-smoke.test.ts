import { describe, expect, it } from "vitest";
import {
  classifyGoalRequirements,
  summarizeGoalSmoke,
  type GoalSmokeInput,
} from "../goal-smoke";

const base: GoalSmokeInput = {
  approvedLabUi: "netro-density",
  broadcastPaused: true,
  broadcastFunded: false,
  multiplierOk: true,
  multiplierLabel: "1.003269×",
  jupiterQuoteOk: true,
  kaminoOk: true,
  scaledUiOk: true,
  nestUsdUnavailable: true,
  washLive: false,
  washFailClosed: true,
  pythLive: false,
  pythFailClosed: true,
  bitqueryKey: false,
  pythKey: false,
  privyKey: false,
  supabaseKey: false,
  sessionSecret: true,
  multiTenantSessionReady: false,
};

describe("goal-smoke", () => {
  it("marks premium UI / spend / honesty / broadcast done without Empire keys", () => {
    const rows = classifyGoalRequirements(base);
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId.premium_ui?.status).toBe("done");
    expect(byId.spend_cap?.status).toBe("done");
    expect(byId.honesty?.status).toBe("done");
    expect(byId.broadcast?.status).toBe("done");
    expect(byId.empire?.status).toBe("partial");
    expect(byId.multi_tenant?.status).toBe("blocked");
    expect(summarizeGoalSmoke(rows).shipReady).toBe(false);
  });

  it("calls out grants SQL when schema not ready but keys present", () => {
    const rows = classifyGoalRequirements({
      ...base,
      privyKey: true,
      supabaseKey: true,
      supabaseSchemaReady: false,
    });
    expect(rows.find((r) => r.id === "multi_tenant")?.detail).toMatch(/20260916_folio_tenants_grants/);
  });

  it("shipReady only when wash+Pyth live and multi-tenant armed", () => {
    const rows = classifyGoalRequirements({
      ...base,
      washLive: true,
      washFailClosed: false,
      pythLive: true,
      pythFailClosed: false,
      bitqueryKey: true,
      pythKey: true,
      privyKey: true,
      supabaseKey: true,
      multiTenantSessionReady: true,
    });
    expect(summarizeGoalSmoke(rows).shipReady).toBe(true);
    expect(rows.every((r) => r.status === "done")).toBe(true);
  });

  it("never marks NestUSD-ready theater as honest", () => {
    const rows = classifyGoalRequirements({
      ...base,
      nestUsdUnavailable: false,
    });
    expect(rows.find((r) => r.id === "honesty")?.status).toBe("partial");
  });
});
