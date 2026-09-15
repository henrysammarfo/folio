import { describe, expect, it } from "vitest";
import {
  isLikelySolanaPubkey,
  mergeTokenAccountRows,
} from "../adapters/wallet-balances";

describe("wallet balance helpers", () => {
  it("accepts likely base58 pubkeys and rejects junk", () => {
    expect(
      isLikelySolanaPubkey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    ).toBe(true);
    expect(isLikelySolanaPubkey("not-a-key")).toBe(false);
    expect(isLikelySolanaPubkey("")).toBe(false);
  });

  it("merges multiple ATAs for the same mint", () => {
    const rows = [
      {
        account: {
          data: {
            parsed: {
              info: {
                mint: "Mint111111111111111111111111111111111111111",
                tokenAmount: {
                  amount: "100000000",
                  decimals: 8,
                  uiAmount: 1,
                  uiAmountString: "1",
                },
              },
            },
          },
        },
      },
      {
        account: {
          data: {
            parsed: {
              info: {
                mint: "Mint111111111111111111111111111111111111111",
                tokenAmount: {
                  amount: "50000000",
                  decimals: 8,
                  uiAmount: 0.5,
                  uiAmountString: "0.5",
                },
              },
            },
          },
        },
      },
    ];
    const byMint = mergeTokenAccountRows(rows as never, "spl-token");
    expect(byMint["Mint111111111111111111111111111111111111111"]?.uiAmount).toBe(
      1.5,
    );
  });

  it("filters to watchlist mints when provided", () => {
    const rows = [
      {
        account: {
          data: {
            parsed: {
              info: {
                mint: "KeepMint11111111111111111111111111111111111",
                tokenAmount: { amount: "1", decimals: 0, uiAmount: 1 },
              },
            },
          },
        },
      },
      {
        account: {
          data: {
            parsed: {
              info: {
                mint: "DropMint11111111111111111111111111111111111",
                tokenAmount: { amount: "9", decimals: 0, uiAmount: 9 },
              },
            },
          },
        },
      },
    ];
    const byMint = mergeTokenAccountRows(
      rows as never,
      "token-2022",
      new Set(["KeepMint11111111111111111111111111111111111"]),
    );
    expect(Object.keys(byMint)).toEqual([
      "KeepMint11111111111111111111111111111111111",
    ]);
  });
});
