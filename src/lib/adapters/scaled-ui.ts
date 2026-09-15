import { resolveSolanaRpcUrl } from "./solana-rpc";
import { errResult, okResult, type AdapterResult } from "./types";

export type ScaledUiOnchain = {
  mint: string;
  decimals: number;
  multiplier: number;
  newMultiplier: number;
  newMultiplierEffectiveTimestamp: number;
  /** Effective UI multiplier at `asOfUnix` (Token-2022 ScaledUiAmount rules). */
  effectiveMultiplier: number;
  authority: string | null;
};

function effectiveMultiplier(
  multiplier: number,
  newMultiplier: number,
  effectiveTs: number,
  nowUnix: number,
): number {
  return nowUnix >= effectiveTs ? newMultiplier : multiplier;
}

/**
 * Read Token-2022 ScaledUiAmountConfig for an xStock mint via Solana JSON-RPC.
 * Fail-closed if RPC missing/errors — never invent a multiplier.
 */
export async function fetchScaledUiOnchain(
  mint: string,
): Promise<AdapterResult<ScaledUiOnchain>> {
  const { url: rpc, publicFallback } = resolveSolanaRpcUrl();
  const source = publicFallback
    ? "solana-rpc.scaled-ui.public-fallback"
    : "solana-rpc.scaled-ui";
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [mint, { encoding: "jsonParsed", commitment: "confirmed" }],
      }),
    });
    if (!res.ok) return errResult(source, "solana_rpc_http_error", `HTTP ${res.status}`);
    const json = (await res.json()) as {
      result?: {
        value?: {
          data?: {
            parsed?: {
              info?: {
                decimals?: number;
                extensions?: Array<{
                  extension?: string;
                  state?: {
                    authority?: string;
                    multiplier?: string | number;
                    newMultiplier?: string | number;
                    newMultiplierEffectiveTimestamp?: string | number;
                  };
                }>;
              };
            };
          };
        };
      };
      error?: { message?: string };
    };
    if (json.error) return errResult(source, "solana_rpc_error", json.error.message ?? "rpc error");
    const info = json.result?.value?.data?.parsed?.info;
    if (!info) return errResult(source, "solana_account_missing", mint);
    const ext = (info.extensions ?? []).find((e) => e.extension === "scaledUiAmountConfig");
    if (!ext?.state) return errResult(source, "scaled_ui_extension_missing", mint);
    const multiplier = Number(ext.state.multiplier);
    const newMultiplier = Number(ext.state.newMultiplier);
    const effectiveTs = Number(ext.state.newMultiplierEffectiveTimestamp);
    if (![multiplier, newMultiplier, effectiveTs].every((n) => Number.isFinite(n))) {
      return errResult(source, "scaled_ui_malformed", JSON.stringify(ext.state).slice(0, 200));
    }
    const nowUnix = Math.floor(Date.now() / 1000);
    return okResult("mainnet-read", source, {
      mint,
      decimals: typeof info.decimals === "number" ? info.decimals : 8,
      multiplier,
      newMultiplier,
      newMultiplierEffectiveTimestamp: effectiveTs,
      effectiveMultiplier: effectiveMultiplier(multiplier, newMultiplier, effectiveTs, nowUnix),
      authority: ext.state.authority ?? null,
    });
  } catch (e) {
    return errResult(source, "scaled_ui_fetch_failed", String(e));
  }
}
