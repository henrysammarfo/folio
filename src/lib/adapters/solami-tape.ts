/**
 * Solami tape — Bible World’s Fair “the tape.”
 *
 * Docs (2026-09-25):
 * - which-product: “read state with RPC, react to change with a stream”
 * - Free plan includes RPC (5 rps). Blur REST meters prepaid streaming bandwidth.
 * - Stocklana signup trial: 7 days Pro (RPC/gRPC) — not free Blur GB.
 * - Blur $ prepaid bandwidth is OPTIONAL — never required for “live Solami” honesty.
 *
 * Path:
 * 1) Solami RPC recent sigs when SOLAMI_API_KEY set (free / plan included)
 * 2) Blur last-trade USD only when bandwidth > 0 (optional)
 * 3) Else public/configured SOLANA_RPC_URL labeled (not Solami-branded)
 *
 * Never invent prices. Never tell operators to burn $25 Blur bandwidth for the demo.
 */
import { errResult, okResult, type AdapterResult } from "./types";
import { resolveSolanaRpcUrl } from "./solana-rpc";

const SOLAMI_PRICE = "https://api.solami.dev/data/token/price";
const SOLAMI_BANDWIDTH = "https://api.solami.dev/bandwidth";
const SOLAMI_RPC = "https://rpc.solami.dev/sol";

export type SolamiTokenPrice = {
  mint: string;
  usdPrice: number;
  liquidityUsd: number | null;
  pool: string | null;
  blockTime: number | null;
  provider: "solami-blur";
};

export type SolamiTape = {
  kind: "solami_blur" | "solami_rpc" | "rpc_recent_sigs" | "unavailable";
  label: string;
  recentSigs?: number;
  mint?: string;
  usdPrice?: number;
  liquidityUsd?: number | null;
};

function solamiKey(): string | null {
  const key = process.env["SOLAMI_API_KEY"]?.trim();
  return key || null;
}

function solamiHeaders(key: string): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${key}`,
    "X-API-Key": key,
  };
}

/** Solami JSON-RPC URL when keyed — Free/Pro included path (docs). */
export function resolveSolamiRpcUrl(): { url: string; keyed: boolean } {
  const key = solamiKey();
  if (!key) return { url: "", keyed: false };
  return {
    url: `${SOLAMI_RPC}?api_key=${encodeURIComponent(key)}`,
    keyed: true,
  };
}

/**
 * Optional Blur last-trade USD. Fail-closed on 402 bandwidth — do not treat as hard requirement.
 */
export async function fetchSolamiTokenPrice(
  mint: string,
): Promise<AdapterResult<SolamiTokenPrice>> {
  const key = solamiKey();
  if (!key) {
    return errResult(
      "api.solami.dev",
      "solami_api_key_missing",
      "Set SOLAMI_API_KEY — https://solami.dev/dashboard/keys",
    );
  }
  try {
    const qs = new URLSearchParams({
      chain: "solana",
      address: mint,
      liquidity: "true",
    });
    const res = await fetch(`${SOLAMI_PRICE}?${qs}`, {
      headers: solamiHeaders(key),
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
      return errResult(
        "api.solami.dev",
        "solami_blur_bandwidth_empty",
        "Blur REST optional · prepaid streaming bandwidth empty · Solami RPC tape still live (Free/Pro)",
      );
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

/** Bandwidth remaining (0 = Blur off; RPC still ok). */
export async function fetchSolamiBandwidth(): Promise<
  AdapterResult<{ remainingBytes: number }>
> {
  const key = solamiKey();
  if (!key) {
    return errResult("api.solami.dev", "solami_api_key_missing", "no key");
  }
  try {
    const res = await fetch(SOLAMI_BANDWIDTH, {
      headers: solamiHeaders(key),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      return errResult("api.solami.dev", "solami_bandwidth_http", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as { remaining_bytes?: number };
    const remainingBytes =
      typeof json.remaining_bytes === "number" ? json.remaining_bytes : 0;
    return okResult("mainnet-read", "api.solami.dev/bandwidth", { remainingBytes });
  } catch (e) {
    return errResult("api.solami.dev", "solami_bandwidth_failed", String(e));
  }
}

/**
 * Network-matrix / desk tape probe.
 * Prefer Solami RPC (included). Blur price is optional when bandwidth exists.
 */
export async function fetchSolamiTape(input: {
  mint: string | null;
}): Promise<AdapterResult<SolamiTape>> {
  if (!input.mint) {
    return errResult("folio.solami-tape", "mint_missing", "Need xStock mint for tape probe");
  }

  const key = solamiKey();
  if (key) {
    // Optional Blur mark — never block tape on 402
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

    const solamiRpc = await fetchRecentSigsViaUrl(
      resolveSolamiRpcUrl().url,
      input.mint,
      "rpc.solami.dev",
      blur.reason === "solami_blur_bandwidth_empty"
        ? "Solami RPC · mainnet tape (Blur bandwidth optional / empty)"
        : `Solami RPC · mainnet tape (Blur: ${blur.reason})`,
    );
    if (solamiRpc.ok) return solamiRpc;
  }

  // No Solami key → labeled generic RPC
  return fetchRecentSigsViaUrl(
    resolveSolanaRpcUrl().url,
    input.mint,
    "solana-rpc.getSignaturesForAddress",
    key
      ? "Mainnet tape · generic RPC"
      : "Mainnet tape · generic RPC (set SOLAMI_API_KEY for Solami RPC path)",
  );
}

async function fetchRecentSigsViaUrl(
  url: string,
  mint: string,
  source: string,
  labelPrefix: string,
): Promise<AdapterResult<SolamiTape>> {
  if (!url) {
    return errResult(source, "rpc_url_missing", "No RPC URL");
  }
  try {
    const res = await fetch(url, {
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
      return errResult(source, "rpc_http_error", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      result?: Array<{ signature?: string }>;
      error?: { message?: string };
    };
    if (json.error) {
      return errResult(source, "rpc_error", json.error.message ?? "unknown");
    }
    const n = Array.isArray(json.result) ? json.result.length : 0;
    const kind = source.includes("solami") ? "solami_rpc" : "rpc_recent_sigs";
    return okResult("mainnet-read", source, {
      kind,
      label:
        n > 0
          ? `${labelPrefix} · ${n} recent sigs`
          : `${labelPrefix} · quiet`,
      recentSigs: n,
      mint,
    });
  } catch (e) {
    return errResult(source, "rpc_fetch_failed", String(e));
  }
}
