import { describe, expect, it, beforeEach } from "vitest";
import {
  cacheClearForTests,
  cacheGet,
  cacheSet,
  cacheSingleflight,
} from "../adapters/ttl-cache";
import { XSTOCK_CATALOG } from "../xstock-catalog";

describe("ttl-cache singleflight", () => {
  beforeEach(() => cacheClearForTests());

  it("dedupes concurrent producers for one key", async () => {
    let runs = 0;
    const make = () =>
      cacheSingleflight("sf:test", async () => {
        runs += 1;
        await new Promise((r) => setTimeout(r, 30));
        cacheSet("sf:test", { ok: true }, 5_000);
        return { ok: true as const };
      });
    const [a, b, c] = await Promise.all([make(), make(), make()]);
    expect(runs).toBe(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
    expect(cacheGet<{ ok: boolean }>("sf:test")?.value.ok).toBe(true);
  });
});

describe("xstock catalog depth", () => {
  it("lists more than the old 23-name desk board", () => {
    expect(XSTOCK_CATALOG.length).toBeGreaterThan(40);
    expect(XSTOCK_CATALOG.some((r) => r.lane === "meme")).toBe(true);
    expect(XSTOCK_CATALOG.some((r) => r.symbol === "UBERx")).toBe(true);
  });
});
