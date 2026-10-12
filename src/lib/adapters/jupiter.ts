import { errResult, okResult, type AdapterResult } from "./types";
import { cacheGet, cacheGetStale, cacheSet } from "./ttl-cache";

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
/** Tether USD on Solana mainnet — FOLIO stable pay rail alongside USDC. */
export const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

export function isStablePaySymbol(symbol: string): boolean {
  return /^(USDC|USDT)$/i.test(symbol.trim());
}

export function stableMintForSymbol(symbol: string): string | null {
  const s = symbol.trim().toUpperCase();
  if (s === "USDC") return USDC_MINT;
  if (s === "USDT") return USDT_MINT;
  return null;
}

const QUOTE_TTL_MS = 20_000;
const PRICE_TTL_MS = 30_000;
/** On HTTP 429, serve last good quote/price only within this window (honest · cached). */
const STALE_MAX_MS = 120_000;

const SWAP_V2_BASE = "https://api.jup.ag/swap/v2";

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
  /** Swap V2 router winner when present. */
  router: string | null;
  /** True when signature/priority fees paid by non-taker (gasless path). */
  gasless: boolean | null;
  signatureFeePayer: string | null;
  feeBps: number | null;
  requestId: string | null;
  /** base64 tx when taker supplied; null/empty means quote-only. */
  transaction: string | null;
  errorCode: number | null;
  errorMessage: string | null;
};

export type JupiterExecuteResult = {
  status: "Success" | "Failed";
  signature: string | null;
  code: number | null;
  inputAmountResult: string | null;
  outputAmountResult: string | null;
  error: string | null;
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
  /**
   * venue = Jupiter usdPrice · stock-ref = stockData.price only (no venue mark).
   * Never invents — both come from Jupiter Price v3.
   */
  priceKind: "venue" | "stock-ref";
};

function quoteCacheKey(params: {
  inputMint: string;
  outputMint: string;
  amountRaw: number;
  slippageBps: number;
  taker?: string;
}): string {
  const taker = params.taker?.trim() || "_";
  return `jup.v2.order:${params.inputMint}:${params.outputMint}:${Math.floor(params.amountRaw)}:${params.slippageBps}:${taker}`;
}

function jupiterHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = process.env["JUPITER_API_KEY"]?.trim();
  if (apiKey) headers["x-api-key"] = apiKey;
  return headers;
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
    reason: "jupiter_http_error",
    detail: `HTTP ${status} ${body.slice(0, 200)}`,
  };
}

/**
 * Jupiter Swap V2 `/order` — quote (+ assembled tx when `taker` set).
 * Never broadcasts; caller must `/execute` after user sign when fills are armed.
 */
export async function fetchJupiterQuote(params: {
  inputMint?: string;
  outputMint: string;
  amountRaw: number;
  slippageBps?: number;
  /** xStocks AAPLx verified at 8 decimals (2026-09-15). */
  outputDecimals?: number;
  /** Input token decimals — USDC=6; xStocks often 8; PreStocks/Tessera often 9. */
  inputDecimals?: number;
  /** When set, Jupiter may return a signable transaction. */
  taker?: string;
}): Promise<AdapterResult<JupiterQuote>> {
  const source = "api.jup.ag/swap/v2/order";
  const inputMint = params.inputMint ?? USDC_MINT;
  const slippageBps = params.slippageBps ?? 50;
  const outputDecimals = params.outputDecimals ?? 8;
  const inputDecimals = params.inputDecimals ?? 6;
  const taker = params.taker?.trim() || undefined;
  const cacheKey = quoteCacheKey({
    inputMint,
    outputMint: params.outputMint,
    amountRaw: params.amountRaw,
    slippageBps,
    ...(taker ? { taker } : {}),
  });

  if (!Number.isFinite(params.amountRaw) || params.amountRaw <= 0) {
    return errResult(source, "jupiter_invalid_amount");
  }

  // Do not cache orders that include a fresh transaction (signing window is short).
  if (!taker) {
    const fresh = cacheGet<AdapterResult<JupiterQuote>>(cacheKey);
    if (fresh?.value.ok) {
      return {
        ...fresh.value,
        source: `${source} · cached ${Math.round(fresh.ageMs / 1000)}s`,
      };
    }
  }

  try {
    const qs = new URLSearchParams({
      inputMint,
      outputMint: params.outputMint,
      amount: String(Math.floor(params.amountRaw)),
      slippageBps: String(slippageBps),
    });
    if (taker) qs.set("taker", taker);

    const res = await fetch(`${SWAP_V2_BASE}/order?${qs}`, {
      headers: jupiterHeaders(),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429 && !taker) {
        const stale = cacheGetStale<AdapterResult<JupiterQuote>>(
          cacheKey,
          STALE_MAX_MS,
        );
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
      priceImpactPct?: string | number;
      routePlan?: unknown[];
      router?: string;
      gasless?: boolean;
      signatureFeePayer?: string;
      feeBps?: number;
      requestId?: string;
      transaction?: string | null;
      errorCode?: number;
      errorMessage?: string;
      error?: string;
    };

    const outAmount = json.outAmount;
    const inAmount = json.inAmount;
    if (!outAmount || !inAmount) {
      return errResult(
        source,
        "jupiter_no_route",
        json.errorMessage ?? json.error ?? "missing outAmount",
      );
    }

    const impact =
      json.priceImpactPct == null
        ? null
        : String(json.priceImpactPct);

    const txRaw = json.transaction;
    const transaction =
      typeof txRaw === "string" && txRaw.length > 0 ? txRaw : null;

    const ok = okResult("quote-only", source, {
      inputMint: json.inputMint ?? inputMint,
      outputMint: json.outputMint ?? params.outputMint,
      inAmount,
      outAmount,
      otherAmountThreshold: json.otherAmountThreshold ?? outAmount,
      slippageBps: json.slippageBps ?? slippageBps,
      priceImpactPct: impact,
      routePlanLength: Array.isArray(json.routePlan) ? json.routePlan.length : 0,
      outUiAmount: Number(outAmount) / 10 ** outputDecimals,
      inUiAmount: Number(inAmount) / 10 ** inputDecimals,
      router: typeof json.router === "string" ? json.router : null,
      gasless: typeof json.gasless === "boolean" ? json.gasless : null,
      signatureFeePayer:
        typeof json.signatureFeePayer === "string"
          ? json.signatureFeePayer
          : null,
      feeBps: typeof json.feeBps === "number" ? json.feeBps : null,
      requestId: typeof json.requestId === "string" ? json.requestId : null,
      transaction,
      errorCode: typeof json.errorCode === "number" ? json.errorCode : null,
      errorMessage:
        typeof json.errorMessage === "string" ? json.errorMessage : null,
    });

    if (!taker) cacheSet(cacheKey, ok, QUOTE_TTL_MS);
    return ok;
  } catch (e) {
    return errResult(source, "jupiter_fetch_failed", String(e));
  }
}

/**
 * Jupiter Swap V2 `/execute` — lands a user-signed tx from `/order`.
 * Caller must enforce broadcast arming before invoking.
 */
export async function fetchJupiterExecute(params: {
  signedTransaction: string;
  requestId: string;
}): Promise<AdapterResult<JupiterExecuteResult>> {
  const source = "api.jup.ag/swap/v2/execute";
  const signedTransaction = params.signedTransaction.trim();
  const requestId = params.requestId.trim();
  if (!signedTransaction || !requestId) {
    return errResult(source, "jupiter_execute_invalid", "signedTransaction + requestId required");
  }

  try {
    const res = await fetch(`${SWAP_V2_BASE}/execute`, {
      method: "POST",
      headers: {
        ...jupiterHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ signedTransaction, requestId }),
      signal: AbortSignal.timeout(45_000),
    });
    const bodyText = await res.text().catch(() => "");
    if (!res.ok) {
      const { reason, detail } = rateLimitedDetail(res.status, bodyText);
      return errResult(source, reason, detail);
    }
    let json: {
      status?: string;
      signature?: string;
      code?: number;
      inputAmountResult?: string;
      outputAmountResult?: string;
      error?: string;
    };
    try {
      json = JSON.parse(bodyText) as typeof json;
    } catch {
      return errResult(source, "jupiter_execute_bad_json", bodyText.slice(0, 200));
    }
    const status =
      json.status === "Success" || json.status === "Failed"
        ? json.status
        : "Failed";
    return okResult(
      status === "Success" ? "mainnet-write" : "unavailable",
      source,
      {
        status,
        signature: typeof json.signature === "string" ? json.signature : null,
        code: typeof json.code === "number" ? json.code : null,
        inputAmountResult:
          typeof json.inputAmountResult === "string"
            ? json.inputAmountResult
            : null,
        outputAmountResult:
          typeof json.outputAmountResult === "string"
            ? json.outputAmountResult
            : null,
        error: typeof json.error === "string" ? json.error : null,
      },
    );
  } catch (e) {
    return errResult(source, "jupiter_execute_failed", String(e));
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
    const res = await fetch(
      `https://api.jup.ag/price/v3?ids=${encodeURIComponent(mint)}`,
      {
        headers: jupiterHeaders(),
        signal: AbortSignal.timeout(12_000),
      },
    );
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
    if (!row) {
      return errResult(source, "jupiter_price_missing", mint);
    }
    const stockRef =
      typeof row.stockData?.price === "number" && Number.isFinite(row.stockData.price)
        ? row.stockData.price
        : null;
    const venue =
      typeof row.usdPrice === "number" && Number.isFinite(row.usdPrice)
        ? row.usdPrice
        : null;
    if (venue == null && stockRef == null) {
      return errResult(source, "jupiter_price_missing", mint);
    }
    const ok = okResult("mainnet-read", source, {
      mint,
      usdPrice: venue ?? (stockRef as number),
      liquidity: typeof row.liquidity === "number" ? row.liquidity : null,
      decimals: typeof row.decimals === "number" ? row.decimals : null,
      stockRefPrice: stockRef,
      scaledUiMultiplier:
        typeof row.scaledUiConfig?.multiplier === "number"
          ? row.scaledUiConfig.multiplier
          : typeof row.scaledUiConfig?.newMultiplier === "number"
            ? row.scaledUiConfig.newMultiplier
            : null,
      blockId: typeof row.blockId === "number" ? row.blockId : null,
      priceKind: venue != null ? ("venue" as const) : ("stock-ref" as const),
    });
    cacheSet(cacheKey, ok, PRICE_TTL_MS);
    return ok;
  } catch (e) {
    return errResult(source, "jupiter_price_fetch_failed", String(e));
  }
}

const BATCH_CHUNK = 50;
/** Parallel Price v3 chunk workers — stay under Vercel + Jupiter RPM. */
const BATCH_CHUNK_WORKERS = 3;
/**
 * Cache tiers (shared `jup.price:${mint}` key):
 * - single fetch: PRICE_TTL_MS (30s) — desk tickets
 * - batch board: BATCH_PRICE_TTL_MS (120s) — 1k+ universe marks
 * - 429 path: STALE_MAX_MS (120s) labeled stale — never invent
 */
const BATCH_PRICE_TTL_MS = 120_000;

type RawPriceRow = {
  usdPrice?: number;
  liquidity?: number;
  decimals?: number;
  blockId?: number;
  stockData?: { price?: number };
  scaledUiConfig?: { multiplier?: number; newMultiplier?: number };
};

function parsePriceRow(
  mint: string,
  row: RawPriceRow,
  source: string,
): AdapterResult<JupiterTokenPrice> {
  const stockRef =
    typeof row.stockData?.price === "number" && Number.isFinite(row.stockData.price)
      ? row.stockData.price
      : null;
  const venue =
    typeof row.usdPrice === "number" && Number.isFinite(row.usdPrice)
      ? row.usdPrice
      : null;
  if (venue == null && stockRef == null) {
    return errResult(source, "jupiter_price_missing", mint);
  }
  return okResult("mainnet-read", source, {
    mint,
    usdPrice: venue ?? (stockRef as number),
    liquidity: typeof row.liquidity === "number" ? row.liquidity : null,
    decimals: typeof row.decimals === "number" ? row.decimals : null,
    stockRefPrice: stockRef,
    scaledUiMultiplier:
      typeof row.scaledUiConfig?.multiplier === "number"
        ? row.scaledUiConfig.multiplier
        : typeof row.scaledUiConfig?.newMultiplier === "number"
          ? row.scaledUiConfig.newMultiplier
          : null,
    blockId: typeof row.blockId === "number" ? row.blockId : null,
    priceKind: venue != null ? ("venue" as const) : ("stock-ref" as const),
  });
}

/**
 * Batch Jupiter Price v3 — chunks of 50, parallel workers, per-mint cache.
 * Prefer venue usdPrice; fall back to stockData.price labeled stock-ref (never invent).
 */
export async function fetchJupiterTokenPricesBatch(
  mints: readonly string[],
): Promise<Map<string, AdapterResult<JupiterTokenPrice>>> {
  const source = "api.jup.ag/price/v3 · batch";
  const out = new Map<string, AdapterResult<JupiterTokenPrice>>();
  const unique = [...new Set(mints.map((m) => m.trim()).filter(Boolean))];
  const need: string[] = [];

  for (const mint of unique) {
    const hit = cacheGet<AdapterResult<JupiterTokenPrice>>(`jup.price:${mint}`);
    if (hit?.value.ok) {
      out.set(mint, {
        ...hit.value,
        source: `${source} · cached ${Math.round(hit.ageMs / 1000)}s`,
        data: {
          ...hit.value.data,
          priceKind: hit.value.data.priceKind ?? "venue",
        },
      });
    } else {
      need.push(mint);
    }
  }

  const chunks: string[][] = [];
  for (let i = 0; i < need.length; i += BATCH_CHUNK) {
    chunks.push(need.slice(i, i + BATCH_CHUNK));
  }

  async function fetchChunk(chunk: string[]) {
    try {
      const res = await fetch(
        `https://api.jup.ag/price/v3?ids=${encodeURIComponent(chunk.join(","))}`,
        {
          headers: jupiterHeaders(),
          signal: AbortSignal.timeout(20_000),
        },
      );
      if (!res.ok) {
        for (const mint of chunk) {
          if (res.status === 429) {
            const stale = cacheGetStale<AdapterResult<JupiterTokenPrice>>(
              `jup.price:${mint}`,
              STALE_MAX_MS,
            );
            if (stale?.value.ok) {
              out.set(mint, {
                ...stale.value,
                source: `${source} · stale after 429`,
                data: {
                  ...stale.value.data,
                  priceKind: stale.value.data.priceKind ?? "venue",
                },
              });
              continue;
            }
          }
          out.set(
            mint,
            errResult(
              source,
              res.status === 429
                ? "jupiter_rate_limited"
                : "jupiter_price_http_error",
              `HTTP ${res.status}`,
            ),
          );
        }
        return;
      }
      const json = (await res.json()) as Record<string, RawPriceRow>;
      for (const mint of chunk) {
        const row = json[mint];
        if (!row) {
          out.set(mint, errResult(source, "jupiter_price_missing", mint));
          continue;
        }
        const parsed = parsePriceRow(mint, row, source);
        if (parsed.ok) {
          cacheSet(`jup.price:${mint}`, parsed, BATCH_PRICE_TTL_MS);
        }
        out.set(mint, parsed);
      }
    } catch (e) {
      for (const mint of chunk) {
        out.set(
          mint,
          errResult(source, "jupiter_price_fetch_failed", String(e)),
        );
      }
    }
  }

  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= chunks.length) return;
      await fetchChunk(chunks[i]!);
    }
  }
  const workers = Math.min(BATCH_CHUNK_WORKERS, Math.max(1, chunks.length));
  if (chunks.length > 0) {
    await Promise.all(Array.from({ length: workers }, () => worker()));
  }

  return out;
}
