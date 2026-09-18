import { describe, expect, it } from "vitest";
import { scoreWashTrades } from "../adapters/wash";

describe("scoreWashTrades", () => {
  it("fail-closes on empty sample", () => {
    const s = scoreWashTrades([]);
    expect(s.pass).toBe(false);
    expect(s.pressure).toBe("unknown");
    expect(s.sampleSize).toBe(0);
  });

  it("passes a clean two-sided sample", () => {
    const s = scoreWashTrades([
      { buyer: "A", seller: "B", feePayer: "A", amountUsd: 10, signature: "1", protocol: "raydium" },
      { buyer: "C", seller: "D", feePayer: "C", amountUsd: 12, signature: "2", protocol: "orca" },
    ]);
    expect(s.pass).toBe(true);
    expect(s.pressure).toBe("low");
  });

  it("flags identical buy/sell accounts", () => {
    const s = scoreWashTrades([
      { buyer: "A", seller: "A", feePayer: "A", amountUsd: 10, signature: "1", protocol: "raydium" },
      { buyer: "A", seller: "A", feePayer: "A", amountUsd: 11, signature: "2", protocol: "raydium" },
      { buyer: "B", seller: "C", feePayer: "B", amountUsd: 9, signature: "3", protocol: "orca" },
    ]);
    expect(s.pass).toBe(false);
    expect(["elevated", "high"]).toContain(s.pressure);
  });
});

  it("raises pressure when notional dwarfs sampled USD tape", () => {
    const s = scoreWashTrades(
      [
        { buyer: "A", seller: "B", feePayer: "A", amountUsd: 10, signature: "1", protocol: "raydium" },
        { buyer: "C", seller: "D", feePayer: "C", amountUsd: 12, signature: "2", protocol: "orca" },
      ],
      { notionalUsd: 10_000 },
    );
    expect(s.pass).toBe(false);
    expect(s.pressure).toBe("elevated");
  });

