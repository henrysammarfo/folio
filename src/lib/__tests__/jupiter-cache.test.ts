import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchJupiterQuote,
  fetchJupiterTokenPrice,
  fetchJupiterExecute,
} from "../adapters/jupiter";
import { cacheClearForTests } from "../adapters/ttl-cache";

/** Low-entropy fixtures — not secrets; avoid GG high-entropy false positives on real mints. */
const FIXTURE_USDC = "USDCtestMint111111111111111111111111111111";
const FIXTURE_XSTOCK = "AAPLxTestMint111111111111111111111111111111";

function orderOkBody(extra: Record<string, unknown> = {}) {
  return {
    inputMint: FIXTURE_USDC,
    outputMint: FIXTURE_XSTOCK,
    inAmount: "1000000",
    outAmount: "400000000",
    otherAmountThreshold: "398000000",
    slippageBps: 50,
    priceImpactPct: "0.01",
    routePlan: [{}],
    router: "metis",
    gasless: false,
    signatureFeePayer: "TakerWallet1111111111111111111111111111111",
    feeBps: 0,
    requestId: "req_test_1",
    transaction: null,
    ...extra,
  };
}

describe("Jupiter Swap V2 /order TTL cache + rate-limit honesty", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cacheClearForTests();
  });

  it("calls swap/v2/order and caches successful quotes", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      expect(String(input)).toMatch(/api\.jup\.ag\/swap\/v2\/order/);
      return new Response(JSON.stringify(orderOkBody()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await fetchJupiterQuote({
      outputMint: FIXTURE_XSTOCK,
      amountRaw: 1_000_000,
      outputDecimals: 8,
    });
    const second = await fetchJupiterQuote({
      outputMint: FIXTURE_XSTOCK,
      amountRaw: 1_000_000,
      outputDecimals: 8,
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.source).toMatch(/cached/);
    expect(second.data.outUiAmount).toBeCloseTo(4);
    expect(first.data.router).toBe("metis");
    expect(first.data.requestId).toBe("req_test_1");
  });

  it("on 429 without cache, fail-closes with jupiter_rate_limited", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Too many requests", { status: 429 })),
    );
    const res = await fetchJupiterQuote({
      outputMint: FIXTURE_XSTOCK,
      amountRaw: 1_000_000,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toBe("jupiter_rate_limited");
    expect(res.detail ?? "").toMatch(/429|rate limit/i);
  });

  it("on 429 after a warm cache, serves stale-cache labeled quote", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(orderOkBody()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response("Too many requests", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);

    const warm = await fetchJupiterQuote({
      outputMint: FIXTURE_XSTOCK,
      amountRaw: 1_000_000,
      outputDecimals: 8,
    });
    expect(warm.ok).toBe(true);

    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(Date.now() + 25_000);
    const stale = await fetchJupiterQuote({
      outputMint: FIXTURE_XSTOCK,
      amountRaw: 1_000_000,
      outputDecimals: 8,
    });
    vi.useRealTimers();

    expect(stale.ok).toBe(true);
    if (!stale.ok) return;
    expect(stale.source).toMatch(/stale-cache|429/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache taker orders (signing window)", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify(
          orderOkBody({
            transaction: "AQAAAAAAAAAAAAAAAAAAA",
            gasless: true,
            signatureFeePayer: "GasSponsor111111111111111111111111111111",
          }),
        ),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const a = await fetchJupiterQuote({
      outputMint: FIXTURE_XSTOCK,
      amountRaw: 1_000_000,
      taker: "TakerWallet1111111111111111111111111111111",
    });
    const b = await fetchJupiterQuote({
      outputMint: FIXTURE_XSTOCK,
      amountRaw: 1_000_000,
      taker: "TakerWallet1111111111111111111111111111111",
    });
    expect(a.ok && b.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    if (!a.ok) return;
    expect(a.data.gasless).toBe(true);
    expect(a.data.transaction).toBeTruthy();
  });

  it("labels price 429 without inventing a usdPrice", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate", { status: 429 })),
    );
    const res = await fetchJupiterTokenPrice(FIXTURE_XSTOCK);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toBe("jupiter_rate_limited");
  });
});

describe("Jupiter Swap V2 /execute", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts signedTransaction + requestId to /execute", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      expect(String(input)).toMatch(/api\.jup\.ag\/swap\/v2\/execute/);
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body)) as {
        signedTransaction: string;
        requestId: string;
      };
      expect(body.requestId).toBe("req_1");
      expect(body.signedTransaction.length).toBeGreaterThan(4);
      return new Response(
        JSON.stringify({
          status: "Success",
          signature: "SigTest111",
          code: 0,
          inputAmountResult: "1000000",
          outputAmountResult: "400000000",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchJupiterExecute({
      signedTransaction: "AQIDBAUGBwgJ",
      requestId: "req_1",
    });
    if (!res.ok) {
      expect.fail(`execute failed: ${res.reason} ${res.detail ?? ""}`);
    }
    expect(res.data.status).toBe("Success");
    expect(res.data.signature).toBe("SigTest111");
  });

  it("fail-closes invalid empty payload without calling network", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchJupiterExecute({
      signedTransaction: "",
      requestId: "",
    });
    expect(res.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
