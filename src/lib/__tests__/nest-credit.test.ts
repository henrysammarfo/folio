import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchNestCreditVaults } from "../adapters/nest-credit";
import { fetchNestUsdStatus } from "../adapters/nestusd";

describe("Nest.credit vs NestUSD honesty", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps NestUSD borrow capacity fail-closed (never invents Ready)", async () => {
    const res = await fetchNestUsdStatus();
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toBe("nestusd_endpoint_unverified");
    expect(res.detail ?? "").toMatch(/Nest\.credit|not NestUSD|fail-closed/i);
  });

  it("reads Nest.credit vault TVL without claiming NestUSD borrow", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [
              {
                name: "Nest Alpha Vault",
                slug: "nest-alpha-vault",
                tvl: 12_000_000,
                solana: { mintAddress: "8qujzAXj2nz99CmeiCgPPc2JxEuDNYvPffzRomroJnee" },
              },
              {
                name: "Nest Credit Vault",
                slug: "nest-credit-vault",
                tvl: 35_000,
                solana: null,
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const res = await fetchNestCreditVaults();
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.mode).toBe("mainnet-read");
    expect(res.data.vaultCount).toBe(2);
    expect(res.data.solanaOftCount).toBe(1);
    expect(res.data.totalTvlUsd).toBeCloseTo(12_035_000);
    expect(res.data.note).toMatch(/not NestUSD/i);
  });
});
