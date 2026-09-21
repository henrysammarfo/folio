import { describe, expect, it, vi, afterEach } from "vitest";
import {
  findReserveBySymbol,
  fetchKaminoDepositTx,
  KAMINO_USDC_RESERVE,
} from "../adapters/kamino-ktx";
import type { KaminoReserve } from "../adapters/kamino";

describe("kamino-ktx", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("finds reserve by symbol case-insensitively", () => {
    const reserves: KaminoReserve[] = [
      {
        symbol: "AAPLx",
        mint: "mintA",
        reserve: "resA",
        maxLtv: 0.4,
        borrowApy: 0.05,
        supplyApy: 0.01,
        totalSupply: 1,
        totalBorrow: 0,
        totalSupplyUsd: 100,
        totalBorrowUsd: 0,
      },
    ];
    expect(findReserveBySymbol(reserves, "aaplx")?.reserve).toBe("resA");
    expect(findReserveBySymbol(reserves, "USDC")).toBeUndefined();
  });

  it("returns deposit tx when ktx responds with transaction", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ transaction: "AQID" }),
      })),
    );
    const res = await fetchKaminoDepositTx({
      wallet: "7vf…2ka".padEnd(44, "1"),
      reserve: "resA".padEnd(44, "2"),
      amount: "0.1",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.transaction).toBe("AQID");
      expect(res.data.action).toBe("deposit");
    }
  });

  it("exports USDC reserve for borrow path", () => {
    expect(KAMINO_USDC_RESERVE.length).toBeGreaterThan(32);
  });
});
