import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchCoinGeckoXStockPrice,
  fetchEquityReferencePrice,
} from "../adapters/equity-ref";

const ENV_KEYS = ["FINNHUB_API_KEY"] as const;

afterEach(() => {
  vi.unstubAllGlobals();
  for (const k of ENV_KEYS) delete process.env[k];
});

describe("fetchEquityReferencePrice live free path (no Pyth)", () => {
  it("uses Yahoo chart when Finnhub key absent", async () => {
    delete process.env["FINNHUB_API_KEY"];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("finance.yahoo.com")) {
          return {
            ok: true,
            json: async () => ({
              chart: {
                result: [
                  {
                    meta: {
                      symbol: "AAPL",
                      regularMarketPrice: 200.5,
                      regularMarketTime: 1_700_000_000,
                      currency: "USD",
                    },
                  },
                ],
              },
            }),
          };
        }
        throw new Error(`unexpected fetch ${url}`);
      }),
    );

    const res = await fetchEquityReferencePrice("AAPL");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.provider).toBe("yahoo-chart");
    expect(res.data.feedSymbol).toBe("YAHOO:AAPL");
    expect(res.data.price).toBe(200.5);
  });

  it("prefers Finnhub when free key present", async () => {
    process.env["FINNHUB_API_KEY"] = "test-finnhub";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("finnhub.io")) {
          return {
            ok: true,
            json: async () => ({ c: 201.25, t: 1_700_000_100 }),
          };
        }
        throw new Error(`unexpected fetch ${url}`);
      }),
    );

    const res = await fetchEquityReferencePrice("AAPL");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.provider).toBe("finnhub");
    expect(res.data.feedSymbol).toBe("FINNHUB:AAPL");
    expect(res.data.price).toBe(201.25);
  });

  it("fail-closes when Yahoo returns no price", async () => {
    delete process.env["FINNHUB_API_KEY"];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ chart: { result: [{ meta: {} }] } }),
      })),
    );
    const res = await fetchEquityReferencePrice("AAPL");
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toBe("equity_ref_unavailable");
  });
});

describe("fetchCoinGeckoXStockPrice", () => {
  it("maps AAPLx to apple-xstock", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ "apple-xstock": { usd: 199.1 } }),
      })),
    );
    const res = await fetchCoinGeckoXStockPrice("AAPLx");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.provider).toBe("coingecko");
    expect(res.data.feedSymbol).toBe("CG:apple-xstock");
    expect(res.data.price).toBe(199.1);
  });
});
