/**
 * Free Dex price fallback when Jupiter Price is rate-limited.
 * GeckoTerminal token endpoint — labeled · never invents prices.
 */
import { errResult, okResult, type AdapterResult } from "./types";

export type GeckoTokenPrice = {
  mint: string;
  usdPrice: number;
  liquidity: number | null;
  provider: "geckoterminal";
};

export async function fetchGeckoTerminalTokenPrice(
  mint: string,
): Promise<AdapterResult<GeckoTokenPrice>> {
  const source = "api.geckoterminal.com/api/v2/networks/solana/tokens";
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${encodeURIComponent(mint)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "folio-desk/0.1",
        },
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) {
      return errResult(source, "gecko_price_http_error", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      data?: {
        attributes?: {
          price_usd?: string | number;
          total_reserve_in_usd?: string | number;
        };
      };
    };
    const attrs = json.data?.attributes;
    const raw = attrs?.price_usd;
    const price =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number(raw)
          : NaN;
    if (!Number.isFinite(price) || !(price > 0)) {
      return errResult(source, "gecko_price_missing", mint);
    }
    const liqRaw = attrs?.total_reserve_in_usd;
    const liquidity =
      typeof liqRaw === "number"
        ? liqRaw
        : typeof liqRaw === "string"
          ? Number(liqRaw)
          : null;
    return okResult("mainnet-read", source, {
      mint,
      usdPrice: price,
      liquidity:
        liquidity != null && Number.isFinite(liquidity) ? liquidity : null,
      provider: "geckoterminal",
    });
  } catch (e) {
    return errResult(source, "gecko_price_failed", String(e));
  }
}
