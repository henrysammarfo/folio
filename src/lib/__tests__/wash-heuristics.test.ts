import { describe, expect, it } from "vitest";
import {
  evaluateWashGate,
  scoreSignerTape,
  scoreWashTrades,
  washAllowsSize,
} from "../adapters/wash";

/** Low-entropy mint fixture — not a secret (avoids GG high-entropy false positives). */
const FIXTURE_XSTOCK = "AAPLxTestMint111111111111111111111111111111";

describe("scoreWashTrades", () => {
  it("fail-closes on empty sample", () => {
    const s = scoreWashTrades([]);
    expect(s.pass).toBe(false);
    expect(s.pressure).toBe("unknown");
    expect(s.sampleSize).toBe(0);
  });

  it("passes a clean two-sided sample", () => {
    const s = scoreWashTrades([
      {
        buyer: "A",
        seller: "B",
        feePayer: "A",
        amountUsd: 10,
        signature: "1",
        protocol: "raydium",
      },
      {
        buyer: "C",
        seller: "D",
        feePayer: "C",
        amountUsd: 12,
        signature: "2",
        protocol: "orca",
      },
    ]);
    expect(s.pass).toBe(true);
    expect(s.pressure).toBe("low");
  });

  it("flags identical buy/sell accounts", () => {
    const s = scoreWashTrades([
      {
        buyer: "A",
        seller: "A",
        feePayer: "A",
        amountUsd: 10,
        signature: "1",
        protocol: "raydium",
      },
      {
        buyer: "A",
        seller: "A",
        feePayer: "A",
        amountUsd: 11,
        signature: "2",
        protocol: "raydium",
      },
      {
        buyer: "B",
        seller: "C",
        feePayer: "B",
        amountUsd: 9,
        signature: "3",
        protocol: "orca",
      },
    ]);
    expect(s.pass).toBe(false);
    expect(["elevated", "high"]).toContain(s.pressure);
  });

  it("raises pressure when notional dwarfs sampled USD tape", () => {
    const s = scoreWashTrades(
      [
        {
          buyer: "A",
          seller: "B",
          feePayer: "A",
          amountUsd: 10,
          signature: "1",
          protocol: "raydium",
        },
        {
          buyer: "C",
          seller: "D",
          feePayer: "C",
          amountUsd: 12,
          signature: "2",
          protocol: "orca",
        },
      ],
      { notionalUsd: 10_000 },
    );
    expect(s.pass).toBe(false);
    expect(s.pressure).toBe("elevated");
  });
});

describe("scoreSignerTape (Gecko free path)", () => {
  it("fail-closes on empty", () => {
    const s = scoreSignerTape([]);
    expect(s.pass).toBe(false);
    expect(s.pressure).toBe("unknown");
  });

  it("flags concentrated signer", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      signer: i < 5 ? "WHALE" : `u${i}`,
      amountUsd: 20,
    }));
    const s = scoreSignerTape(rows);
    expect(s.pass).toBe(false);
    expect(["elevated", "high"]).toContain(s.pressure);
  });
});

describe("wash gate", () => {
  it("fail-closes on unknown mint even with free fallback", async () => {
    const prev = process.env["BITQUERY_API_KEY"];
    delete process.env["BITQUERY_API_KEY"];
    const wash = await evaluateWashGate({
      symbol: "AAPLx",
      mint: FIXTURE_XSTOCK,
      notionalUsd: 100,
    });
    expect(wash.ok).toBe(false);
    expect(washAllowsSize(wash)).toBe(false);
    if (prev != null) process.env["BITQUERY_API_KEY"] = prev;
  });

  it("scores live AAPLx mint via free Gecko path when Bitquery is down", async () => {
    const prev = process.env["BITQUERY_API_KEY"];
    process.env["BITQUERY_API_KEY"] = "ory_at_forced_invalid_for_fallback_test";
    let wash = await evaluateWashGate({
      symbol: "AAPLx",
      mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
      notionalUsd: 1,
    });
    if (!wash.ok) {
      // Free API can 429 under parallel vitest — one retry
      await new Promise((r) => setTimeout(r, 1200));
      wash = await evaluateWashGate({
        symbol: "AAPLx",
        mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
        notionalUsd: 1,
      });
    }
    expect(wash.ok).toBe(true);
    if (wash.ok) {
      expect(wash.source).toMatch(/gecko/i);
      expect(wash.data.sampleSize).toBeGreaterThan(0);
    }
    if (prev != null) process.env["BITQUERY_API_KEY"] = prev;
    else delete process.env["BITQUERY_API_KEY"];
  }, 45_000);
});
