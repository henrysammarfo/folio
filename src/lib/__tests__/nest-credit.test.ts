import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchNestCreditVaults } from "../adapters/nest-credit";
import { fetchNestUsdStatus } from "../adapters/nestusd";

describe("Nest.credit vs NestUSD honesty", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads live NestUSD risk+config without claiming FOLIO CPI", async () => {
    const risk = {
      generatedAt: "2026-09-20T23:00:00.000Z",
      stats: {
        paused: false,
        nusdSupply: "1000",
        totalDebt: "100",
      },
      collateralRows: [
        {
          symbol: "AAPLx",
          borrowLtvBps: 5000,
          liquidationThresholdBps: 6000,
          depositsPaused: false,
          borrowsPaused: false,
          withdrawsPaused: false,
          totalDebt: "10",
          totalDepositsRaw: "100",
        },
      ],
    };
    const cfg = {
      cluster: "mainnet-beta",
      mints: { nUSD: "BKvheJ3skKvXqUbfroAgCf8dFfUKJM4W38raUaygLiUS" },
      collateral: [
        {
          symbol: "AAPLx",
          mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/v1/risk")) {
          return new Response(JSON.stringify(risk), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.includes("/v1/config")) {
          return new Response(JSON.stringify(cfg), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("{}", { status: 404 });
      }),
    );

    const res = await fetchNestUsdStatus();
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.mode).toBe("mainnet-read");
    expect(res.data.status).toBe("live");
    expect(res.data.collaterals[0]?.symbol).toBe("AAPLx");
    expect(res.data.collaterals[0]?.borrowLtv).toBeCloseTo(0.5);
    expect(res.data.appUrl).toMatch(/nestusd\.com/);
  });

  it("fail-closes NestUSD when risk API is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 503 })),
    );
    const res = await fetchNestUsdStatus();
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toMatch(/nestusd_/);
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
