/**
 * Solami Blur tape — Bible World’s Fair “the tape.”
 * Live REST: GET https://api.solami.dev/data/token/price (DataApi key).
 * Without SOLAMI_API_KEY → labeled RPC recent-sig probe (never invents prices).
 * Docs: https://solami.dev/docs/api/get_data-token-price · https://solami.dev/docs/blur
 */
import { errResult, okResult, type AdapterResult } from "./types";
import { resolveSolanaRpcUrl } from "./solana-rpc";

const SOLAMI_PRICE = "https://api.solami.dev/data/token/price";

export type SolamiTokenPrice = {
  mint: string;
  usdPrice: number;
  liquidityUsd: number | null;
  pool: string | null;
  blockTime: number | null;
  provider: "solami-blur";
};

export type SolamiTape = {
  kind: "solami_blur" | "rpc_recent_sigs" | "unavailable";
  label: string;
  recentSigs?: number;
  mint?: string;
  usdPrice?: number;
  liquidityUsd?: number | null;
};

function solamiHeaders(): HeadersInit | null {
  const key = process.env["SOLAMI_API_KEY"]?.trim();
  if (!key) return null;
  // Solami accepts Bearer; some dashboards also issue raw keys — send both styles safely.
  return {
    Accept: "application/json",
    Authorization: `Bearer ${key}`,
    "X-API-Key": key,
  };
}

/**
 * Live Blur last-trade USD price for a mint.
 * Fail-closed without DataApi key or when mint has no USD-priceable trade.
 */
export async function fetchSolamiTokenPrice(
  mint: string,
): Promise<AdapterResult<SolamiTokenPrice>> {
  const headers = solamiHeaders();
  if (!headers) {
    return errResult(
      "api.solami.dev",
      "solami_api_key_missing",
      "Set SOLAMI_API_KEY with DataApi permission — https://solami.dev/dashboard/keys",
    );
  }
  try {
    const qs = new URLSearchParams({
      chain: "solana",
      address: mint,
      liquidity: "true",
    });
    const res = await fetch(`${SOLAMI_PRICE}?${qs}`, {
      headers,
      signal: AbortSignal.timeout(12_000),
    });
    if (res.status === 401 || res.status === 403) {
      return errResult(
        "api.solami.dev",
        "solami_unauthorized",
        `HTTP ${res.status} · need DataApi permission`,
      );
    }
    if (res.status === 402) {
      let detail =
        "Blur needs prepaid bandwidth — top up at https://solami.dev/dashboard";
      try {
        const body = (await res.json()) as { message?: string };
        if (body?.message) detail = body.message;
      } catch {
        /* keep default */
      }
      return errResult("api.solami.dev", "solami_bandwidth_empty", detail);
    }
    if (!res.ok) {
      return errResult(
        "api.solami.dev",
        "solami_http_error",
        `HTTP ${res.status}`,
      );
    }
    const json = (await res.json()) as Array<{
      mint?: string;
      price_usd?: string;
      liquidity_usd?: string;
      pool?: string;
      block_time?: number;
    }>;
    if (!Array.isArray(json)) {
      return errResult("api.solami.dev", "solami_malformed", "expected array");
    }
    const row = json.find((r) => r.mint === mint) ?? json[0];
    if (!row?.price_usd) {
      return errResult(
        "api.solami.dev",
        "solami_price_missing",
        "No USD-priceable trade for mint",
      );
    }
    const usdPrice = Number(row.price_usd);
    if (!Number.isFinite(usdPrice) || !(usdPrice > 0)) {
      return errResult("api.solami.dev", "solami_price_invalid", row.price_usd);
    }
    const liq =
      row.liquidity_usd != null ? Number(row.liquidity_usd) : null;
    return okResult("mainnet-read", "api.solami.dev/data/token/price", {
      mint,
      usdPrice,
      liquidityUsd: liq != null && Number.isFinite(liq) ? liq : null,
      pool: row.pool || null,
      blockTime: typeof row.block_time === "number" ? row.block_time : null,
      provider: "solami-blur",
    });
  } catch (e) {
    return errResult("api.solami.dev", "solami_fetch_failed", String(e));
  }
}

/**
 * Network-matrix / desk tape probe.
 * Prefer live Blur price when keyed; else RPC recent signatures (labeled).
 */
export async function fetchSolamiTape(input: {
  mint: string | null;
}): Promise<AdapterResult<SolamiTape>> {
  if (!input.mint) {
    return errResult("folio.solami-tape", "mint_missing", "Need xStock mint for tape probe");
  }

  const blur = await fetchSolamiTokenPrice(input.mint);
  if (blur.ok) {
    return okResult("mainnet-read", blur.source, {
      kind: "solami_blur",
      label: `Solami Blur · $${blur.data.usdPrice.toPrecision(4)} · last trade`,
      mint: input.mint,
      usdPrice: blur.data.usdPrice,
      liquidityUsd: blur.data.liquidityUsd,
    });
  }

  // Key missing or Blur miss → labeled RPC tape (not fake Blur)
  if (blur.reason === "solami_api_key_missing") {
    return fetchRpcRecentSigTape(input.mint, blur.reason);
  }

  // Keyed but no price — still try RPC for activity honesty
  const rpc = await fetchRpcRecentSigTape(input.mint, blur.reason);
  if (rpc.ok) return rpc;
  return errResult("api.solami.dev", blur.reason, blur.detail);
}

async function fetchRpcRecentSigTape(
  mint: string,
  priorReason: string,
): Promise<AdapterResult<SolamiTape>> {
  const rpc = resolveSolanaRpcUrl();
  try {
    const res = await fetch(rpc.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [mint, { limit: 5 }],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      return errResult(
        "solana-rpc.tape",
        "rpc_http_error",
        `HTTP ${res.status} · prior ${priorReason}`,
      );
    }
    const json = (await res.json()) as {
      result?: Array<{ signature?: string }>;
      error?: { message?: string };
    };
    if (json.error) {
      return errResult("solana-rpc.tape", "rpc_error", json.error.message ?? "unknown");
    }
    const n = Array.isArray(json.result) ? json.result.length : 0;
    return okResult("mainnet-read", "solana-rpc.getSignaturesForAddress", {
      kind: "rpc_recent_sigs",
      label:
        priorReason === "solami_api_key_missing"
          ? n > 0
            ? `Mainnet tape · ${n} recent sigs (RPC · Solami Blur needs DataApi key)`
            : "Mainnet tape quiet · RPC (Solami Blur needs DataApi key)"
          : n > 0
            ? `Mainnet tape · ${n} recent sigs (RPC · Blur: ${priorReason})`
            : `Mainnet tape quiet · RPC · Blur: ${priorReason}`,
      recentSigs: n,
      mint,
    });
  } catch (e) {
    return errResult("solana-rpc.tape", "rpc_fetch_failed", String(e));
  }
}
