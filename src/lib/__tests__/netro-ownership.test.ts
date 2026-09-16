import { describe, expect, it } from "vitest";
import { buildNetroOwnershipSummary } from "../netro-ownership";

describe("buildNetroOwnershipSummary", () => {
  it("labels paper qty when no wallet bound", () => {
    const summary = buildNetroOwnershipSummary({
      walletSource: null,
      rows: [
        {
          symbol: "AAPLx",
          qty: 12.5,
          qtySource: "paper",
          paperValueUsd: 4179,
          health: "Review",
        },
      ],
    });
    expect(summary.walletSourceLabel).toBe("No wallet");
    expect(summary.qtyLabel).toBe("Paper qty");
    expect(summary.verifiedLabel).toBe("0 / 1 verified");
    expect(summary.economicValueLabel).toMatch(/\$4,179/);
    expect(summary.rows[0]?.qtyLabel).toMatch(/paper/);
  });

  it("surfaces inspect + wallet-read without inventing Verified", () => {
    const summary = buildNetroOwnershipSummary({
      walletSource: "inspect",
      note: "Ephemeral inspect (not auth / not multi-tenant)",
      rows: [
        {
          symbol: "AAPLx",
          qty: 0,
          qtySource: "wallet-read",
          paperValueUsd: 0,
          health: "Review",
        },
        {
          symbol: "NVDAx",
          qty: 0,
          qtySource: "wallet-read",
          paperValueUsd: 0,
          health: "Review",
        },
      ],
    });
    expect(summary.walletSourceLabel).toMatch(/Inspect/);
    expect(summary.qtyLabel).toBe("Wallet-read qty");
    expect(summary.verifiedLabel).toBe("0 / 2 verified");
    expect(summary.note).toMatch(/not auth|Ephemeral/);
  });

  it("labels inspect with paper fallback when no SPL qty", () => {
    const summary = buildNetroOwnershipSummary({
      walletSource: "inspect",
      rows: [
        {
          symbol: "AAPLx",
          qty: 12.5,
          qtySource: "paper",
          paperValueUsd: 100,
          health: "Review",
        },
      ],
    });
    expect(summary.qtyLabel).toBe("Inspect · paper fallback");
  });
});
