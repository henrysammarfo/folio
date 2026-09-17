import { describe, expect, it } from "vitest";
import {
  compareApiOnchainMultiplier,
  effectiveScaledUiMultiplier,
} from "../adapters/scaled-ui";

describe("effectiveScaledUiMultiplier", () => {
  it("uses newMultiplier once effective timestamp has passed", () => {
    expect(effectiveScaledUiMultiplier(1, 1.003269, 100, 100)).toBe(1.003269);
    expect(effectiveScaledUiMultiplier(1, 1.003269, 100, 99)).toBe(1);
  });
});

describe("compareApiOnchainMultiplier", () => {
  it("never invents a match when either side is missing", () => {
    expect(compareApiOnchainMultiplier(null, 1.003).status).toBe("unavailable");
    expect(compareApiOnchainMultiplier(1.003, null).status).toBe("unavailable");
    expect(compareApiOnchainMultiplier(0, 1.003).status).toBe("unavailable");
  });

  it("matches within 1 bps band", () => {
    const r = compareApiOnchainMultiplier(1.003269, 1.003269);
    expect(r.status).toBe("match");
    expect(r.deltaBps).toBe(0);
  });

  it("flags mismatch outside band without inventing green", () => {
    const r = compareApiOnchainMultiplier(1.0, 1.01, 1);
    expect(r.status).toBe("mismatch");
    expect(r.deltaBps).toBeGreaterThan(1);
    expect(r.note).toMatch(/diverge/i);
  });
});
