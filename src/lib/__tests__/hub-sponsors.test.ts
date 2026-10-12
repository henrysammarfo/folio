import { describe, expect, it } from "vitest";
import { fetchPhantomConnectStatus } from "../adapters/phantom-connect";
import { fetchReflectStatus } from "../adapters/reflect";
import { fetchMeteoraDbcAwareness } from "../adapters/meteora-dbc";
import { fetchSquadsTreasuryStatus } from "../adapters/squads-treasury";

describe("hub sponsor adapters", () => {
  it("Phantom Connect reports injected path without App ID", () => {
    const r = fetchPhantomConnectStatus({} as NodeJS.ProcessEnv);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.injectedPath).toBe(true);
    expect(r.data.embeddedSocialArmed).toBe(false);
    expect(r.data.note).toMatch(/PHANTOM_APP_ID|injected/i);
  });

  it("Phantom Connect arms embedded social when PHANTOM_APP_ID set", () => {
    const r = fetchPhantomConnectStatus({
      PHANTOM_APP_ID: "app_test",
    } as NodeJS.ProcessEnv);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.embeddedSocialArmed).toBe(true);
  });

  it("Squads fails closed without FOLIO_SQUADS_VAULT", async () => {
    const r = await fetchSquadsTreasuryStatus({} as NodeJS.ProcessEnv);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("squads_vault_unconfigured");
  });

  it(
    "Reflect + Meteora DBC live probes return mainnet-read or labeled fail",
    async () => {
      const [reflect, dbc] = await Promise.all([
        fetchReflectStatus(),
        fetchMeteoraDbcAwareness({ pageSize: 2 }),
      ]);
      if (reflect.ok) {
        expect(reflect.mode).toBe("mainnet-read");
        expect(reflect.data.types.length).toBeGreaterThan(0);
        expect(reflect.data.sdkPackage).toBe("@reflectmoney/stable.ts");
      } else {
        expect(reflect.mode).toBe("unavailable");
        expect(reflect.reason).toMatch(/reflect_/);
      }
      if (dbc.ok) {
        expect(dbc.mode).toBe("mainnet-read");
        expect(dbc.data.totalPools).toBeGreaterThan(0);
        expect(dbc.data.note).toMatch(/not xStock/i);
      } else {
        expect(dbc.mode).toBe("unavailable");
        expect(dbc.reason).toMatch(/meteora_dbc_/);
      }
    },
    30_000,
  );
});
