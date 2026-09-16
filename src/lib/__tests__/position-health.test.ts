import { describe, expect, it } from "vitest";

/**
 * Mirror of desk.empire health rules — Verified requires wallet-read + live feeds.
 * Keeps paper qty from claiming Verified theater.
 */
function positionHealth(input: {
  qtySource: "wallet-read" | "paper";
  multiplierOk: boolean;
  assetOk: boolean;
  priceOk: boolean;
}): "Verified" | "Review" | "Unavailable" {
  if (
    input.qtySource === "wallet-read" &&
    input.multiplierOk &&
    input.assetOk &&
    input.priceOk
  ) {
    return "Verified";
  }
  if (input.multiplierOk && (input.assetOk || input.priceOk)) return "Review";
  if (input.multiplierOk) return "Review";
  return "Unavailable";
}

describe("position health honesty", () => {
  it("never Verified on paper qty even with live feeds", () => {
    expect(
      positionHealth({
        qtySource: "paper",
        multiplierOk: true,
        assetOk: true,
        priceOk: true,
      }),
    ).toBe("Review");
  });

  it("Verified only when wallet-read + live multiplier/asset/price", () => {
    expect(
      positionHealth({
        qtySource: "wallet-read",
        multiplierOk: true,
        assetOk: true,
        priceOk: true,
      }),
    ).toBe("Verified");
  });

  it("Unavailable when multiplier missing", () => {
    expect(
      positionHealth({
        qtySource: "wallet-read",
        multiplierOk: false,
        assetOk: true,
        priceOk: true,
      }),
    ).toBe("Unavailable");
  });
});
