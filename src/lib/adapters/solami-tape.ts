/**
 * Solami tape posture — Bible World’s Fair “the tape.”
 * Prefer Solami Blur / Yellowstone when keyed; otherwise labeled RPC recent-sig probe.
 * Never invent pool prints or mainnet volume.
 */
import { errResult, okResult, type AdapterResult } from "./types";
import { resolveSolanaRpcUrl } from "./solana-rpc";

export type SolamiTape = {
  kind: "solami_blur" | "rpc_recent_sigs" | "unavailable";
  /** Soft desk label. */
  label: string;
  /** Optional recent signature count from public RPC (awareness only). */
  recentSigs?: number;
  mint?: string;
};

/**
 * Probe tape honesty for a mint.
 * SOLAMI_API_KEY path reserved — fail-closed with clear reason until wired.
 * Fallback: public RPC getSignaturesForAddress (labeled, not Solami Blur).
 */
export async function fetchSolamiTape(input: {
  mint: string | null;
}): Promise<AdapterResult<SolamiTape>> {
  const solamiKey = process.env["SOLAMI_API_KEY"]?.trim();
  if (solamiKey) {
    // Key present but Blur client not wired yet — never fake a green Blur stream.
    return errResult(
      "solami.dev",
      "solami_client_unwired",
      "SOLAMI_API_KEY set · Blur/Yellowstone client not shipped yet — fail-closed",
    );
  }

  if (!input.mint) {
    return errResult("folio.solami-tape", "mint_missing", "Need xStock mint for tape probe");
  }

  const rpc = resolveSolanaRpcUrl();
  try {
    const res = await fetch(rpc.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [input.mint, { limit: 5 }],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      return errResult(
        "solana-rpc.tape",
        "rpc_http_error",
        `HTTP ${res.status}${rpc.publicFallback ? " · public fallback" : ""}`,
      );
    }
    const json = (await res.json()) as {
      result?: Array<{ signature?: string }>;
      error?: { message?: string };
    };
    if (json.error) {
      return errResult(
        "solana-rpc.tape",
        "rpc_error",
        json.error.message ?? "unknown",
      );
    }
    const n = Array.isArray(json.result) ? json.result.length : 0;
    return okResult("mainnet-read", "solana-rpc.getSignaturesForAddress", {
      kind: "rpc_recent_sigs",
      label:
        n > 0
          ? `Mainnet tape · ${n} recent sigs (RPC · not Solami Blur)`
          : "Mainnet tape quiet · RPC (not Solami Blur)",
      recentSigs: n,
      mint: input.mint,
    });
  } catch (e) {
    return errResult("solana-rpc.tape", "rpc_fetch_failed", String(e));
  }
}
