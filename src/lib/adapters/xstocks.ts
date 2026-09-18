import { errResult, okResult, type AdapterResult } from "./types";

const XSTOCKS_BASE = "https://api.xstocks.fi/api/v2/public";

export type XStockMultiplier = {
  symbol: string;
  network: "Solana";
  currentMultiplier: number;
  pendingMultiplier: number | null;
  activationDateTime: number | null;
  reason: string | null;
};

export type XStockAsset = {
  symbol: string;
  name: string;
  underlyingSymbol: string;
  solanaMint: string | null;
  /** Token decimals on Solana (xStocks AAPLx observed = 8). */
  decimals: number | null;
  isTradingHalted: boolean;
  openNow: boolean | null;
  logo: string | null;
};

/**
 * Live shape verified 2026-09-15:
 * { currentMultiplier, newMultiplier, activationDateTime, reason }
 */
export async function fetchXStockMultiplier(
  symbol: string,
): Promise<AdapterResult<XStockMultiplier>> {
  const source = "api.xstocks.fi/multiplier";
  try {
    const url = `${XSTOCKS_BASE}/assets/${encodeURIComponent(symbol)}/multiplier?network=Solana`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      return errResult(source, "xstocks_multiplier_http_error", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      currentMultiplier?: number;
      newMultiplier?: number;
      activationDateTime?: number;
      reason?: string | null;
    };
    if (typeof json.currentMultiplier !== "number" || !Number.isFinite(json.currentMultiplier)) {
      return errResult(source, "xstocks_multiplier_malformed", JSON.stringify(json).slice(0, 200));
    }
    return okResult("mainnet-read", source, {
      symbol,
      network: "Solana",
      currentMultiplier: json.currentMultiplier,
      pendingMultiplier:
        typeof json.newMultiplier === "number" && json.newMultiplier > 0
          ? json.newMultiplier
          : null,
      activationDateTime: json.activationDateTime || null,
      reason: json.reason ?? null,
    });
  } catch (e) {
    return errResult(source, "xstocks_multiplier_fetch_failed", String(e));
  }
}

export async function fetchXStockAsset(
  symbol: string,
): Promise<AdapterResult<XStockAsset>> {
  const source = "api.xstocks.fi/assets";
  try {
    const url = `${XSTOCKS_BASE}/assets/${encodeURIComponent(symbol)}?network=Solana`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      return errResult(source, "xstocks_asset_http_error", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      symbol?: string;
      name?: string;
      underlyingSymbol?: string;
      isTradingHalted?: boolean;
      logo?: string | null;
      trading?: { openNow?: boolean };
      deployments?: Array<{
        network?: string;
        address?: string;
        decimals?: number;
        solanaTokenProgram?: string;
      }>;
    };
    if (!json.symbol || !json.name || !json.underlyingSymbol) {
      return errResult(source, "xstocks_asset_malformed");
    }
    const solana = (json.deployments ?? []).find((d) => d.network === "Solana");
    return okResult("mainnet-read", source, {
      symbol: json.symbol,
      name: json.name,
      underlyingSymbol: json.underlyingSymbol,
      solanaMint: solana?.address ?? null,
      decimals: typeof solana?.decimals === "number" ? solana.decimals : null,
      isTradingHalted: Boolean(json.isTradingHalted),
      openNow: json.trading?.openNow ?? null,
      logo: json.logo ?? null,
    });
  } catch (e) {
    return errResult(source, "xstocks_asset_fetch_failed", String(e));
  }
}