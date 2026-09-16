import { errResult, okResult, type AdapterResult } from "./types";
import { cacheGet, cacheGetStale, cacheSet } from "./ttl-cache";

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const QUOTE_TTL_MS = 20_000;
const PRICE_TTL_MS = 30_000;
/** On HTTP 429, serve last good quote/price only within this window (honest · cached). */
const STALE_MAX_MS = 120_000;

export type JupiterQuote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  slippageBps: number;
  priceImpactPct: string | null;
  routePlanLength: number;
  outUiAmount: number;
  inUiAmount: number;
};

export type JupiterTokenPrice = {
  mint: string;
  usdPrice: number;
  liquidity: number | null;
  decimals: number | null;
  /** Issuer/stock reference when Jupiter attaches stockData. */
  stockRefPrice: number | null;
  scaledUiMultiplier: number | null;
  blockId: number | null;
};

function quoteCacheKey(params: {
  inputMint: string;
  outputMint: string;
  amountRaw: number;
  slippageBps: number;
}): string {
  return `jup.quote:${params.inputMint}:${params.outputMint}:${Math.floor(params.amountRaw)}:${params.slippageBps}`;
}

function rateLimitedDetail(status: number, body: string): {
  reason: string;
  detail: string;
} {
  if (status === 429) {
    return {
      reason: "jupiter_rate_limited",
      detail:
        "HTTP 429 — Jupiter rate limit. Fail-closed unless a short TTL cache hit; set JUPITER_API_KEY if available.",
    };
  }
  return {
    reason: status >= 500 ? "jupiter_http_error" : "jupiter_http_error",
    detail: `HTTP ${status} ${body.slice(0, 200)}`,
  };
}

/** Jupiter swap quote — quote-only, never broadcasts. Short TTL cache + honest 429 stale. */
export async function fetchJupiterQuote(params: {
  inputMint?: string;
  outputMint: string;
  amountRaw: number;
  slippageBps?: number;
  /** xStocks AAPLx verified at 8 decimals (2026-09-15). */
  outputDecimals?: number;
}): Promise<AdapterResult<JupiterQuote>> {
  const source = "api.jup.ag/swap/v1/quote";
  const inputMint = params.inputMint ?? USDC_MINT;
  const slippageBps = params.slippageBps ?? 50;
  const outputDecimals = params.outputDecimals ?? 8;
  const cacheKey = quoteCacheKey({
    inputMint,
    outputMint: params.outputMint,
    amountRaw: params.amountRaw,
    slippageBps,
  });

  if (!Number.isFinite(params.amountRaw) || params.amountRaw <= 0) {
    return errResult(source, "jupiter_invalid_amount");
  }

  const fresh = cacheGet<AdapterResult<JupiterQuote>>(cacheKey);
  if (fresh?.value.ok) {
    return {
      ...fresh.value,
      source: `${source} · cached ${Math.round(fresh.ageMs / 1000)}s`,
    };
  }

  try {
    const qs = new URLSearchParams({
      inputMint,
      outputMint: params.outputMint,
      amount: String(Math.floor(params.amountRaw)),
      slippageBps: String(slippageBps),
    });
    const headers: Record<string, string> = { Accept: "application/json" };
    const apiKey = process.env["JUPITER_API_KEY"];
    if (apiKey) headers["x-api-key"] = apiKey;

    const res = await fetch(`https://api.jup.ag/swap/v1/quote?${qs}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) {
        const stale = cacheGetStale<AdapterResult<JupiterQuote>>(cacheKey, STALE_MAX_MS);
        if (stale?.value.ok) {
          return {
            ...stale.value,
            source: `${source} · stale-cache ${Math.round(stale.ageMs / 1000)}s after 429`,
          };
        }
      }
      const { reason, detail } = rateLimitedDetail(res.status, body);
      return errResult(source, reason, detail);
    }
    const json = (await res.json()) as {
      inputMint?: string;
      outputMint?: string;
      inAmount?: string;
      outAmount?: string;
      otherAmountThreshold?: string;
      slippageBps?: number;
      priceImpactPct?: string;
      routePlan?: unknown[];
      error?: string;
    };
    if (!json.outAmount || !json.inAmount) {
      return errResult(source, "jupiter_no_route", json.error ?? "missing outAmount");
    }
    const ok = okResult("quote-only", source, {
      inputMint: json.inputMint ?? inputMint,
      outputMint: json.outputMint ?? params.outputMint,
      inAmount: json.inAmount,
      outAmount: json.outAmount,
      otherAmountThreshold: json.otherAmountThreshold ?? json.outAmount,
      slippageBps: json.slippageBps ?? slippageBps,
      priceImpactPct: json.priceImpactPct ?? null,
      routePlanLength: Array.isArray(json.routePlan) ? json.routePlan.length : 0,
      outUiAmount: Number(json.outAmount) / 10 ** outputDecimals,
      inUiAmount: Number(json.inAmount) / 1_000_000,
    });
    cacheSet(cacheKey, ok, QUOTE_TTL_MS);
    return ok;
  } catch (e) {
    return errResult(source, "jupiter_fetch_failed", String(e));
  }
}

/** Jupiter Price v3 — mainnet venue + optional stockData / scaledUiConfig. */
export async function fetchJupiterTokenPrice(
  mint: string,
): Promise<AdapterResult<JupiterTokenPrice>> {
  const source = "api.jup.ag/price/v3";
  const cacheKey = `jup.price:${mint}`;

  const fresh = cacheGet<AdapterResult<JupiterTokenPrice>>(cacheKey);
  if (fresh?.value.ok) {
    return {
      ...fresh.value,
      source: `${source} · cached ${Math.round(fresh.ageMs / 1000)}s`,
    };
  }

  try {
    const res = await fetch(`https://api.jup.ag/price/v3?ids=${encodeURIComponent(mint)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      if (res.status === 429) {
        const stale = cacheGetStale<AdapterResult<JupiterTokenPrice>>(
          cacheKey,
          STALE_MAX_MS,
        );
        if (stale?.value.ok) {
          return {
            ...stale.value,
            source: `${source} · stale-cache ${Math.round(stale.ageMs / 1000)}s after 429`,
          };
        }
        return errResult(
          source,
          "jupiter_rate_limited",
          "HTTP 429 — Jupiter Price rate limit. Fail-closed without cache; set JUPITER_API_KEY if available.",
        );
      }
      return errResult(source, "jupiter_price_http_error", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as Record<
      string,
      {
        usdPrice?: number;
        liquidity?: number;
        decimals?: number;
        blockId?: number;
        stockData?: { price?: number };
        scaledUiConfig?: { multiplier?: number; newMultiplier?: number };
      }
    >;
    const row = json[mint];
    if (!row || typeof row.usdPrice !== "number" || !Number.isFinite(row.usdPrice)) {
      return errResult(source, "jupiter_price_missing", mint);
    }
    const ok = okResult("mainnet-read", source, {
      mint,
      usdPrice: row.usdPrice,
      liquidity: typeof row.liquidity === "number" ? row.liquidity : null,
      decimals: typeof row.decimals === "number" ? row.decimals : null,
      stockRefPrice:
        typeof row.stockData?.price === "number" ? row.stockData.price : null,
      scaledUiMultiplier:
        typeof row.scaledUiConfig?.multiplier === "number"
          ? row.scaledUiConfig.multiplier
          : typeof row.scaledUiConfig?.newMultiplier === "number"
            ? row.scaledUiConfig.newMultiplier
            : null,
      blockId: typeof row.blockId === "number" ? row.blockId : null,
    });
    cacheSet(cacheKey, ok, PRICE_TTL_MS);
    return ok;
  } catch (e) {
    return errResult(source, "jupiter_price_fetch_failed", String(e));
  }
}
