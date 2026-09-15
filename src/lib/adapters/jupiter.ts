import { errResult, okResult, type AdapterResult } from "./types";

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

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

/** Jupiter swap quote — quote-only, never broadcasts. */
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

  if (!Number.isFinite(params.amountRaw) || params.amountRaw <= 0) {
    return errResult(source, "jupiter_invalid_amount");
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
      return errResult(source, "jupiter_http_error", `HTTP ${res.status} ${body.slice(0, 200)}`);
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
    return okResult("quote-only", source, {
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
  } catch (e) {
    return errResult(source, "jupiter_fetch_failed", String(e));
  }
}

/** Jupiter Price v3 — mainnet venue + optional stockData / scaledUiConfig. */
export async function fetchJupiterTokenPrice(
  mint: string,
): Promise<AdapterResult<JupiterTokenPrice>> {
  const source = "api.jup.ag/price/v3";
  try {
    const res = await fetch(`https://api.jup.ag/price/v3?ids=${encodeURIComponent(mint)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
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
    return okResult("mainnet-read", source, {
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
  } catch (e) {
    return errResult(source, "jupiter_price_fetch_failed", String(e));
  }
}