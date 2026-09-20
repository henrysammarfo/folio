import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parsePaperIntent, runPaperAgent } from "../agent/paper-agent";

/** Low-entropy fixtures — not secrets (GitGuardian high-entropy false positives). */
const FIXTURE_USDC = "USDCtestMint111111111111111111111111111111";
const FIXTURE_XSTOCK = "AAPLxTestMint111111111111111111111111111111";

function assetResponse() {
  return new Response(
    JSON.stringify({
      symbol: "AAPLx",
      name: "Apple",
      underlyingSymbol: "AAPL",
      deployments: [
        {
          network: "Solana",
          address: FIXTURE_XSTOCK,
          decimals: 8,
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function scaledUiRpcResponse(eff = 1.003269) {
  return new Response(
    JSON.stringify({
      result: {
        value: {
          data: {
            parsed: {
              info: {
                decimals: 8,
                extensions: [
                  {
                    extension: "scaledUiAmountConfig",
                    state: {
                      multiplier: String(eff),
                      newMultiplier: String(eff),
                      newMultiplierEffectiveTimestamp: 0,
                    },
                  },
                ],
              },
            },
          },
        },
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function isSolanaRpc(_url: string, init?: RequestInit) {
  return init?.method === "POST" && typeof init.body === "string" && init.body.includes("getAccountInfo");
}

describe("parsePaperIntent", () => {
  it("parses quote intents with spend cap semantics left to runner", () => {
    const intent = parsePaperIntent("quote 25 USDC AAPLx");
    expect(intent).toEqual({ kind: "quote", spendUsdc: 25, symbol: "AAPLx" });
  });
  it("parses truth intents", () => {
    expect(parsePaperIntent("truth NVDAx")).toEqual({ kind: "truth", symbol: "NVDAx" });
  });
  it("parses compare / pair intents", () => {
    expect(parsePaperIntent("compare AAPLx vs MSFTx")).toEqual({
      kind: "compare",
      left: "AAPLx",
      right: "MSFTx",
      spendUsdc: 0.01,
    });
    expect(parsePaperIntent("swap NVDAx to AVGOx 0.05")).toEqual({
      kind: "compare",
      left: "NVDAx",
      right: "AVGOx",
      spendUsdc: 0.05,
    });
    expect(parsePaperIntent("pair NVDAx / AVGOx 5")).toEqual({
      kind: "compare",
      left: "NVDAx",
      right: "AVGOx",
      spendUsdc: 5,
    });
  });
  it("parses credit / network / positions keywords", () => {
    expect(parsePaperIntent("show credit LTV")).toEqual({ kind: "credit" });
    expect(parsePaperIntent("network matrix")).toEqual({ kind: "network" });
    expect(parsePaperIntent("my holdings")).toEqual({ kind: "positions" });
  });
  it("returns unknown for free text", () => {
    expect(parsePaperIntent("buy everything")).toMatchObject({ kind: "unknown" });
  });
});

describe("runPaperAgent live spine", () => {
  const prevKey = process.env["AGENTROUTER_API_KEY"];
  const prevBroadcast = process.env["BROADCAST_PAUSED"];
  const prevBitquery = process.env["BITQUERY_API_KEY"];

  beforeEach(() => {
    delete process.env["AGENTROUTER_API_KEY"];
    delete process.env["BITQUERY_API_KEY"];
    process.env["BROADCAST_PAUSED"] = "true";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (prevKey == null) delete process.env["AGENTROUTER_API_KEY"];
    else process.env["AGENTROUTER_API_KEY"] = prevKey;
    if (prevBroadcast == null) delete process.env["BROADCAST_PAUSED"];
    else process.env["BROADCAST_PAUSED"] = prevBroadcast;
    if (prevBitquery == null) delete process.env["BITQUERY_API_KEY"];
    else process.env["BITQUERY_API_KEY"] = prevBitquery;
  });

  it("attaches live multiplier facts for truth intents (no AgentRouter)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/multiplier")) {
        return new Response(
          JSON.stringify({ currentMultiplier: 1.003269 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.includes("/assets/AAPLx")) return assetResponse();
      if (isSolanaRpc(url, init)) return scaledUiRpcResponse(1.003269);
      return new Response(`unexpected ${url}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await runPaperAgent("truth AAPLx");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.caps.broadcast).toBe(false);
    expect(res.data.spine.truth?.multiplier).toBeCloseTo(1.003269);
    expect(res.data.spine.truth?.pendingMultiplier).toBeNull();
    expect(res.data.spine.truth?.scaledUiStatus).toBe("match");
    expect(res.data.spine.truth?.onchainEffective).toBeCloseTo(1.003269);
    expect(res.data.reply).toMatch(/1\.003269/);
    expect(res.data.reply).toMatch(/on-chain match|Scaled UI/i);
    expect(res.data.reply).toMatch(/no pending newMultiplier|pending CA/i);
    expect(res.data.reply).toMatch(/broadcast=paused/);
    expect(res.data.reply).toMatch(/AgentRouter key missing/);
  });

  it("surfaces pending CA on truth spine when newMultiplier is live", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/multiplier")) {
        return new Response(
          JSON.stringify({
            currentMultiplier: 1.003269,
            newMultiplier: 2.0,
            activationDateTime: 1_800_000_000,
            reason: "split",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.includes("/assets/AAPLx")) return assetResponse();
      if (isSolanaRpc(url, init)) return scaledUiRpcResponse(1.003269);
      return new Response(`unexpected ${url}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await runPaperAgent("truth AAPLx");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.spine.truth?.pendingMultiplier).toBeCloseTo(2);
    expect(res.data.reply).toMatch(/pending CA 2\.000000/);
  });

  it("attaches quote-only spine for quote intents", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/assets/AAPLx?") || (url.includes("/assets/AAPLx") && !url.includes("multiplier"))) {
        return assetResponse();
      }
      if (url.includes("/multiplier")) {
        return new Response(
          JSON.stringify({ currentMultiplier: 1.003269 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (isSolanaRpc(url, init)) return scaledUiRpcResponse(1.003269);
      if (url.includes("api.jup.ag/swap/v2/order")) {
        return new Response(
          JSON.stringify({
            inputMint: FIXTURE_USDC,
            outputMint: FIXTURE_XSTOCK,
            inAmount: "1000000",
            outAmount: "400000000",
            otherAmountThreshold: "398000000",
            slippageBps: 50,
            priceImpactPct: "0.01",
            routePlan: [{}, {}],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(`unexpected ${url}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await runPaperAgent("quote 1 USDC AAPLx");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.caps.broadcast).toBe(false);
    expect(res.data.spine.quote?.outUiAmount).toBeCloseTo(4);
    expect(res.data.spine.quote?.cacheLabel).toBe("live");
    expect(res.data.spine.gates?.washOk).toBe(false);
    expect(res.data.spine.gates?.canReview).toBe(false);
    expect(res.data.spine.gates?.blockedReasons.join(" ")).toMatch(
      /BITQUERY|Gecko|wash_feeds|fail-closed|Wash gate/i,
    );
    expect(res.data.spine.gates?.honestyNotes.join(" ")).toMatch(/Scaled UI/i);
    expect(res.data.reply).toMatch(/quote-only/);
    expect(res.data.reply).toMatch(/\blive\b/);
    expect(res.data.reply).toMatch(/Never a fill|acquire gates blocked/i);
  });

  it("keeps live spine when AgentRouter returns WAF HTML", async () => {
    process.env["AGENTROUTER_API_KEY"] = "test-agentrouter-key";
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/multiplier")) {
        return new Response(
          JSON.stringify({ currentMultiplier: 1.003269 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.includes("/assets/AAPLx")) return assetResponse();
      if (isSolanaRpc(url, init)) return scaledUiRpcResponse(1.003269);
      if (url.includes("/chat/completions")) {
        return new Response("<!doctype html><html><body>WAF</body></html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }
      return new Response(`unexpected ${url}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await runPaperAgent("truth AAPLx");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.nlExpansion).toBe("failed");
    expect(res.data.nlExpansionNote ?? "").toMatch(/WAF|HTML|non-JSON/i);
    expect(res.data.spine.truth?.multiplier).toBeCloseTo(1.003269);
    expect(res.data.spine.truth?.scaledUiStatus).toBe("match");
    expect(res.data.reply).toMatch(/1\.003269/);
    expect(res.data.reply).toMatch(/live spine only|Never a fill/i);
    expect(res.data.caps.broadcast).toBe(false);
  });

  it("labels wash-blocked quote when Bitquery returns dirty tape", async () => {
    process.env["BITQUERY_API_KEY"] = "test-bitquery-key";
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/assets/AAPLx?") || (url.includes("/assets/AAPLx") && !url.includes("multiplier"))) {
        return assetResponse();
      }
      if (url.includes("/multiplier")) {
        return new Response(
          JSON.stringify({ currentMultiplier: 1.003269 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (isSolanaRpc(url, init)) return scaledUiRpcResponse(1.003269);
      if (url.includes("api.jup.ag/swap/v2/order")) {
        return new Response(
          JSON.stringify({
            inputMint: FIXTURE_USDC,
            outputMint: FIXTURE_XSTOCK,
            inAmount: "1000000",
            outAmount: "400000000",
            otherAmountThreshold: "398000000",
            slippageBps: 50,
            priceImpactPct: "0.01",
            routePlan: [{}, {}],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.includes("streaming.bitquery.io")) {
        expect(init?.method).toBe("POST");
        return new Response(
          JSON.stringify({
            data: {
              Solana: {
                DEXTrades: [
                  {
                    Trade: {
                      Dex: { ProtocolName: "test" },
                      Buy: {
                        Account: { Address: "SameWallet" },
                        AmountInUSD: 10,
                      },
                      Sell: {
                        Account: { Address: "SameWallet" },
                        AmountInUSD: 10,
                      },
                    },
                    Transaction: { Signature: "sig1", FeePayer: "SameWallet" },
                  },
                  {
                    Trade: {
                      Dex: { ProtocolName: "test" },
                      Buy: {
                        Account: { Address: "SameWallet" },
                        AmountInUSD: 10,
                      },
                      Sell: {
                        Account: { Address: "SameWallet" },
                        AmountInUSD: 10,
                      },
                    },
                    Transaction: { Signature: "sig2", FeePayer: "SameWallet" },
                  },
                ],
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(`unexpected ${url}`, { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await runPaperAgent("quote 1 USDC AAPLx");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.spine.gates?.washOk).toBe(false);
    expect(res.data.spine.gates?.canReview).toBe(false);
    expect(res.data.reply).toMatch(/acquire gates blocked|wash/i);
  });
});
