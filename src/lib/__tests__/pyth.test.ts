import { afterEach, describe, expect, it, vi } from "vitest";
import {
  divergeBps,
  fetchPythEquityPrice,
  pythApiKeyPresent,
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
      expect(res.mode).toBe("mainnet-read");
    }
    expect(fetchMock).toHaveBeenCalled();
  });
});

describe("divergeBps (pyth)", () => {
  it("passes inside band and fails outside", () => {
    expect(divergeBps(100, 100.4, 75).pass).toBe(true);
    expect(divergeBps(100, 102, 75).pass).toBe(false);
  });
});
