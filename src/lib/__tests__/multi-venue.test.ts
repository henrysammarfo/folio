import { describe, expect, it, vi } from "vitest";
import { resolveMultiVenuePrice } from "../adapters/multi-venue";

vi.mock("../adapters/jupiter", () => ({
  fetchJupiterTokenPrice: vi.fn(async () => ({
    ok: true,
    mode: "mainnet-read",
    source: "jupiter",
    data: { usdPrice: 100, stockRefPrice: 99, liquidity: 1_000_000 },
  })),
}));

vi.mock("../adapters/gecko-price", () => ({
  fetchGeckoTerminalTokenPrice: vi.fn(async () => ({
    ok: true,
    mode: "mainnet-read",
    source: "gecko",
    data: { mint: "m", usdPrice: 101, liquidity: 50_000, provider: "geckoterminal" },
  })),
}));

vi.mock("../adapters/pools", () => ({
  fetchRaydiumPoolsForMint: vi.fn(async () => ({
    ok: true,
    mode: "mainnet-read",
    source: "raydium",
    data: {
      mint: "m",
      raydium: [
        {
          poolId: "p",
          type: "amm",
          mintA: "a",
          mintB: "b",
          symbolA: "A",
          symbolB: "USDC",
          tvl: 2_000_000,
          volume24h: 100,
        },
      ],
      note: "awareness",
    },
  })),
}));

vi.mock("../adapters/solami-tape", () => ({
  fetchSolamiTokenPrice: vi.fn(async () => ({
    ok: false,
    mode: "unavailable",
    source: "api.solami.dev",
    reason: "solami_api_key_missing",
    detail: "missing",
  })),
}));

describe("resolveMultiVenuePrice", () => {
  it("returns Jupiter primary with free-tape + Raydium venues", async () => {
    const m = await resolveMultiVenuePrice("Mint111111111111111111111111111111111111111");
    expect(m.primary?.venueId).toBe("jupiter");
    expect(m.primary?.usdPrice).toBe(100);
    const ids = m.venues.map((v) => v.id);
    expect(ids).toEqual(["jupiter", "free-tape", "raydium", "solami"]);
    expect(m.venues.find((v) => v.id === "free-tape")?.usdPrice).toBe(101);
    expect(m.venues.find((v) => v.id === "raydium")?.liquidity).toBe(2_000_000);
    expect(m.venues.find((v) => v.id === "raydium")?.usdPrice).toBeNull();
    expect(m.venues.find((v) => v.id === "solami")?.status).toBe("off");
  });
});
