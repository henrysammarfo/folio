import { describe, expect, it } from "vitest";
import {
  positionHealth,
  positionStatusLabel,
  scaledUiHealthLabel,
} from "../position-health";

describe("position health honesty", () => {
  it("never Verified on paper qty even with live feeds + chain match", () => {
    expect(
      positionHealth({
        qtySource: "paper",
        multiplierOk: true,
        assetOk: true,
        priceOk: true,
        scaledUiStatus: "match",
      }),
    ).toBe("Review");
  });

  it("Verified only when wallet-read + live feeds + Scaled UI match", () => {
    expect(
      positionHealth({
        qtySource: "wallet-read",
        multiplierOk: true,
        assetOk: true,
        priceOk: true,
        scaledUiStatus: "match",
      }),
    ).toBe("Verified");
  });

  it("wallet-read with Scaled UI mismatch stays Review (not Verified)", () => {
    expect(
      positionHealth({
        qtySource: "wallet-read",
        multiplierOk: true,
        assetOk: true,
        priceOk: true,
        scaledUiStatus: "mismatch",
      }),
    ).toBe("Review");
  });

  it("wallet-read with Scaled UI unavailable stays Review (not Verified)", () => {
    expect(
      positionHealth({
        qtySource: "wallet-read",
        multiplierOk: true,
        assetOk: true,
        priceOk: true,
        scaledUiStatus: "unavailable",
      }),
    ).toBe("Review");
  });

  it("Unavailable when multiplier missing", () => {
    expect(
      positionHealth({
        qtySource: "wallet-read",
        multiplierOk: false,
        assetOk: true,
        priceOk: true,
        scaledUiStatus: "match",
      }),
    ).toBe("Unavailable");
  });
});

describe("position Scaled UI labels", () => {
  it("labels match / mismatch / off without inventing pass", () => {
    expect(scaledUiHealthLabel("match")).toBe("chain match");
    expect(scaledUiHealthLabel("mismatch")).toBe("chain mismatch");
    expect(scaledUiHealthLabel("unavailable")).toBe("chain off");
  });

  it("status copy surfaces chain honesty for wallet-read Review", () => {
    expect(
      positionStatusLabel({
        health: "Verified",
        qtySource: "wallet-read",
        scaledUiStatus: "match",
      }),
    ).toBe("Wallet-verified");
    expect(
      positionStatusLabel({
        health: "Review",
        qtySource: "wallet-read",
        scaledUiStatus: "mismatch",
      }),
    ).toBe("Wallet · chain mismatch");
    expect(
      positionStatusLabel({
        health: "Review",
        qtySource: "wallet-read",
        scaledUiStatus: "unavailable",
      }),
    ).toBe("Wallet · chain off");
    expect(
      positionStatusLabel({
        health: "Review",
        qtySource: "paper",
        scaledUiStatus: "match",
      }),
    ).toBe("Live · paper");
  });
});
