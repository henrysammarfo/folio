import { errResult, okResult, type AdapterResult } from "./types";

export type JupiterLendEarnToken = {
  id: number;
  address: string;
  name: string;
  symbol: string;
  assetAddress: string;
  decimals: number | null;
  supplyRate: number | null;
  totalRate: number | null;
  totalAssetsRaw: string | null;
};

export type JupiterLendSnapshot = {
  earnTokens: JupiterLendEarnToken[];
  note: string;
};

/**
 * Jupiter Lend earn vaults — mainnet READ of published earn tokens.
 * This is NOT an xStocks borrow market; label accordingly in UI.
 */
export async function fetchJupiterLendEarn(): Promise<AdapterResult<JupiterLendSnapshot>> {
  const source = "lite-api.jup.ag/lend/v1/earn/tokens";
  try {
    const res = await fetch("https://lite-api.jup.ag/lend/v1/earn/tokens", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return errResult(source, "jupiter_lend_http_error", `HTTP ${res.status}`);
    const json = (await res.json()) as Array<{
      id?: number;
      address?: string;
      name?: string;
      symbol?: string;
      assetAddress?: string;
      decimals?: number;
      supplyRate?: string | number;
      totalRate?: string | number;
      totalAssets?: string | number;
    }>;
    if (!Array.isArray(json) || json.length === 0) {
      return errResult(source, "jupiter_lend_empty");
    }
    const earnTokens: JupiterLendEarnToken[] = json
      .map((t) => {
        if (typeof t.id !== "number" || !t.address || !t.symbol || !t.assetAddress) return null;
        return {
          id: t.id,
          address: t.address,
          name: t.name ?? t.symbol,
          symbol: t.symbol,
          assetAddress: t.assetAddress,
          decimals: typeof t.decimals === "number" ? t.decimals : null,
          supplyRate: t.supplyRate != null && Number.isFinite(Number(t.supplyRate)) ? Number(t.supplyRate) : null,
          totalRate: t.totalRate != null && Number.isFinite(Number(t.totalRate)) ? Number(t.totalRate) : null,
          totalAssetsRaw: t.totalAssets != null ? String(t.totalAssets) : null,
        } satisfies JupiterLendEarnToken;
      })
      .filter((t): t is JupiterLendEarnToken => t != null);

    if (earnTokens.length === 0) return errResult(source, "jupiter_lend_parse_failed");
    return okResult("mainnet-read", source, {
      earnTokens,
      note: "Jupiter Lend earn vaults (stable/SOL) — not an xStock collateral borrow path.",
    });
  } catch (e) {
    return errResult(source, "jupiter_lend_fetch_failed", String(e));
  }
}
