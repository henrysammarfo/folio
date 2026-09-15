import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJupiterQuote, fetchJupiterTokenPrice } from "../adapters/jupiter";
import { cacheClearForTests } from "../adapters/ttl-cache";

describe("Jupiter TTL cache + rate-limit honesty", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cacheClearForTests();
  });

  it("caches successful quotes and labels subsequent hits as cached", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          outputMint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
          inAmount: "1000000",
          outAmount: "400000000",
          otherAmountThreshold: "398000000",
          slippageBps: 50,
          priceImpactPct: "0.01",
          routePlan: [{}],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const first = await fetchJupiterQuote({
      outputMint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
      amountRaw: 1_000_000,
      outputDecimals: 8,
    });
    const second = await fetchJupiterQuote({
      outputMint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
      amountRaw: 1_000_000,
      outputDecimals: 8,
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.source).toMatch(/cached/);
    expect(second.data.outUiAmount).toBeCloseTo(4);
  });

  it("on 429 without cache, fail-closes with jupiter_rate_limited", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Too many requests", { status: 429 })),
    );
    const res = await fetchJupiterQuote({
      outputMint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
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
        new Response(
          JSON.stringify({
            inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            outputMint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
            inAmount: "1000000",
            outAmount: "400000000",
            otherAmountThreshold: "398000000",
            slippageBps: 50,
            routePlan: [{}],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(new Response("Too many requests", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);

    const warm = await fetchJupiterQuote({
      outputMint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
      amountRaw: 1_000_000,
      outputDecimals: 8,
    });
    expect(warm.ok).toBe(true);

    // Expire fresh TTL while keeping stale window by rewriting stored expiresAt via second call after clearing fresh path:
    // Force bypass of fresh cache by advancing time.
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(Date.now() + 25_000);
    const stale = await fetchJupiterQuote({
      outputMint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
      amountRaw: 1_000_000,
      outputDecimals: 8,
    });
    vi.useRealTimers();

    expect(stale.ok).toBe(true);
    if (!stale.ok) return;
    expect(stale.source).toMatch(/stale-cache|429/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("labels price 429 without inventing a usdPrice", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate", { status: 429 })),
    );
    const res = await fetchJupiterTokenPrice(
      "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toBe("jupiter_rate_limited");
  });
});
