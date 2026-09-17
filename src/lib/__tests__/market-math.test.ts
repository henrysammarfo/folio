import { describe, expect, it } from "vitest";
import { divergeBps, economicShares, illustrativeBorrow } from "../market-math";

describe("economicShares", () => {
  it("applies live-scale multipliers, not fantasy 4.0×", () => {
    expect(economicShares(12.5, 1.0032690125398187)).toBeCloseTo(12.540862656747734, 10);
    expect(economicShares(12.5, 4)).not.toBeCloseTo(12.540862656747734, 2);
  });
});

describe("divergeBps", () => {
  it("passes inside band", () => {
    const d = divergeBps(100, 100.4, 75);
    expect(d.pass).toBe(true);
    expect(d.divergeBps).toBeLessThan(75);
  });
  it("fails outside band", () => {
    const d = divergeBps(100, 102, 75);
    expect(d.pass).toBe(false);
  });
});

describe("illustrativeBorrow", () => {
  it("uses Kamino-style maxLtv fractions", () => {
    expect(illustrativeBorrow(10_000, 0.4)).toBe(4_000);
  });
});
