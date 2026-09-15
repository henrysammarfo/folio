import { describe, expect, it } from "vitest";
import { evaluateWashGate, washAllowsSize } from "../adapters/wash";

/** Low-entropy mint fixture — not a secret (avoids GG high-entropy false positives). */
const FIXTURE_XSTOCK = "AAPLxTestMint111111111111111111111111111111";

describe("wash gate", () => {
  it("fail-closes without BITQUERY_API_KEY", async () => {
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
});
