import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchCoinGeckoXStockPrice,
  fetchEquityReferencePrice,
} from "../adapters/equity-ref";

const ENV_KEYS = ["PYTH_API_KEY", "FINNHUB_API_KEY"] as const;

afterEach(() => {
  vi.unstubAllGlobals();
  for (const k of ENV_KEYS) delete process.env[k];
});

describe("fetchEquityReferencePrice free cascade", () => {
  it("falls back to Yahoo chart when Pyth is not entitled", async () => {
    delete process.env["PYTH_API_KEY"];
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
        return { ok: false, status: 403, text: async () => "Not entitled" };
      }),
    );

    const res = await fetchEquityReferencePrice("AAPL");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.provider).toBe("yahoo-chart");
    expect(res.data.feedSymbol).toBe("YAHOO:AAPL");
    expect(res.data.price).toBe(200.5);
    expect(res.source).toMatch(/yahoo/i);
  });

  it("prefers Finnhub when free key present and Pyth fails", async () => {
    process.env["PYTH_API_KEY"] = "test-pyth";
    process.env["FINNHUB_API_KEY"] = "test-finnhub";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("pyth") || url.includes("hermes") || url.includes("dourolabs")) {
          return {
            ok: false,
            status: 403,
            text: async () => "Not entitled",
          };
        }
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
