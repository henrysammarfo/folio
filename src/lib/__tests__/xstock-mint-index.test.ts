import { describe, expect, it } from "vitest";
import {
  heldXStockSymbolsFromBalances,
  type XStockMintMeta,
} from "../adapters/xstock-mint-index";

describe("heldXStockSymbolsFromBalances", () => {
  const mintA = "MintA111111111111111111111111111111111111111";
  const mintB = "MintB111111111111111111111111111111111111111";
  const mintJunk = "JunkMint11111111111111111111111111111111111";

  const index = new Map<string, XStockMintMeta>([
    [
      mintA,
      {
        symbol: "AAPLx",
        name: "Apple xStock",
        logo: null,
        underlying: "AAPL",
      },
    ],
    [
      mintB,
      {
        symbol: "NVDAx",
        name: "NVIDIA xStock",
        logo: null,
        underlying: "NVDA",
      },
    ],
  ]);

  it("maps wallet ATAs to xStock symbols and skips unknowns / dust", () => {
    const held = heldXStockSymbolsFromBalances(
      {
        [mintA]: { uiAmount: 2.5 },
        [mintB]: { uiAmount: 0 },
        [mintJunk]: { uiAmount: 99 },
      },
      index,
    );
    expect(held.map((h) => h.symbol)).toEqual(["AAPLx"]);
    expect(held[0]?.uiAmount).toBe(2.5);
  });

  it("returns empty when nothing matches — never invents holdings", () => {
    const held = heldXStockSymbolsFromBalances(
      { [mintJunk]: { uiAmount: 1 } },
      index,
    );
    expect(held).toEqual([]);
  });
});
