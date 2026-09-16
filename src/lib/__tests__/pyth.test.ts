import { afterEach, describe, expect, it, vi } from "vitest";
import {
  divergeBps,
  equityUsFeedId,
  fetchPythEquityPrice,
  fetchPythOndoUsdPrice,
  fetchPythXStockUsdPrice,
  ondoUsdFeedId,
  pythApiKeyPresent,
  pythBountyFeedSymbols,
  xStockUsdFeedId,
} from "../adapters/pyth";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("pythApiKeyPresent", () => {
  it("is false when unset / blank", () => {
    expect(pythApiKeyPresent({})).toBe(false);
    expect(pythApiKeyPresent({ PYTH_API_KEY: "  " })).toBe(false);
  });

  it("is true when set", () => {
    expect(pythApiKeyPresent({ PYTH_API_KEY: "pk_test" })).toBe(true);
  });
});

describe("Pyth feed maps (Stocklana Equity.US + Crypto.xStock)", () => {
  it("maps Equity.US AAPL/NVDA/TSLA", () => {
    expect(equityUsFeedId("AAPL")).toMatch(/^[a-f0-9]{64}$/);
    expect(equityUsFeedId("NVDA")).toMatch(/^[a-f0-9]{64}$/);
    expect(equityUsFeedId("TSLA")).toMatch(/^[a-f0-9]{64}$/);
    expect(equityUsFeedId("ZZZZ")).toBeNull();
  });

  it("maps Crypto.AAPLX/NVDAX/TSLAX USD from xStock symbols", () => {
    expect(xStockUsdFeedId("AAPLx")).toBe(
      "978e6cc68a119ce066aa830017318563a9ed04ec3a0a6439010fc11296a58675",
    );
    expect(xStockUsdFeedId("NVDAx")).toMatch(/^[a-f0-9]{64}$/);
    expect(xStockUsdFeedId("TSLAx")).toMatch(/^[a-f0-9]{64}$/);
    expect(xStockUsdFeedId("ZZZZx")).toBeNull();
  });

  it("maps Crypto.AAPLON/USD Ondo feed from underlying", () => {
    expect(ondoUsdFeedId("AAPL")).toBe(
      "e6734de88a83d9d2fb33072adab319004700aefd069653aba30ba9e3cac056f2",
    );
    expect(ondoUsdFeedId("ZZZZ")).toBeNull();
  });

  it("lists Stocklana bounty feed symbols for AAPLx even without a key", () => {
    expect(pythBountyFeedSymbols("AAPLx")).toEqual({
      equityUs: "Equity.US.AAPL/USD",
      cryptoXStock: "Crypto.AAPLX/USD",
      cryptoOndo: "Crypto.AAPLON/USD",
    });
  });
});

describe("fetchPythEquityPrice", () => {
  it("fail-closes immediately without PYTH_API_KEY (no fetch)", async () => {
    vi.stubEnv("PYTH_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchPythEquityPrice("AAPL");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("pyth_api_key_missing");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends Bearer token and parses Hermes payload when keyed", async () => {
    vi.stubEnv("PYTH_API_KEY", "test-pyth-key");
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer test-pyth-key");
        return new Response(
          JSON.stringify({
            parsed: [
              {
                price: {
                  price: "10000000000",
                  conf: "1000000",
                  expo: -8,
                  publish_time: 1_700_000_000,
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchPythEquityPrice("AAPL");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.price).toBe(100);
      expect(res.data.underlying).toBe("AAPL");
      expect(res.data.feedSymbol).toBe("Equity.US.AAPL/USD");
      expect(res.mode).toBe("mainnet-read");
    }
    expect(fetchMock).toHaveBeenCalled();
  });
});

describe("fetchPythXStockUsdPrice", () => {
  it("fail-closes without key", async () => {
    vi.stubEnv("PYTH_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchPythXStockUsdPrice("AAPLx");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("pyth_api_key_missing");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses Crypto.AAPLX/USD map when keyed", async () => {
    vi.stubEnv("PYTH_API_KEY", "test-pyth-key");
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            parsed: [
              {
                price: {
                  price: "20000000000",
                  conf: "1000000",
                  expo: -8,
                  publish_time: 1_700_000_000,
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchPythXStockUsdPrice("AAPLx");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.price).toBe(200);
      expect(res.data.feedSymbol).toBe("Crypto.AAPLX/USD");
    }
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain(
      "978e6cc68a119ce066aa830017318563a9ed04ec3a0a6439010fc11296a58675",
    );
  });
});

describe("fetchPythOndoUsdPrice", () => {
  it("fail-closes without key", async () => {
    vi.stubEnv("PYTH_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchPythOndoUsdPrice("AAPL");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("pyth_api_key_missing");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses Crypto.AAPLON/USD map when keyed", async () => {
    vi.stubEnv("PYTH_API_KEY", "test-pyth-key");
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            parsed: [
              {
                price: {
                  price: "15000000000",
                  conf: "1000000",
                  expo: -8,
                  publish_time: 1_700_000_000,
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchPythOndoUsdPrice("AAPL");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.price).toBe(150);
      expect(res.data.feedSymbol).toBe("Crypto.AAPLON/USD");
    }
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain(
      "e6734de88a83d9d2fb33072adab319004700aefd069653aba30ba9e3cac056f2",
    );
  });
});

describe("divergeBps (pyth)", () => {
  it("passes inside band and fails outside", () => {
    expect(divergeBps(100, 100.4, 75).pass).toBe(true);
    expect(divergeBps(100, 102, 75).pass).toBe(false);
  });
});
