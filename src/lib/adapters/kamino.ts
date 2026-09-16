import { errResult, okResult, type AdapterResult } from "./types";

/** Live mainnet xStocks market (api.kamino.finance /v2/kamino-market, 2026-09-15). */
export const KAMINO_XSTOCKS_MARKET = "5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua";

export type KaminoReserve = {
  symbol: string;
  mint: string;
  maxLtv: number;
  borrowApy: number;
  supplyApy: number;
  totalSupply: number;
  totalBorrow: number;
  totalSupplyUsd: number | null;
  totalBorrowUsd: number | null;
};

export type KaminoMarketSnapshot = {
  market: string;
  marketName: string;
  reserves: KaminoReserve[];
};

/**
 * Mainnet-read Kamino xStocks market reserves (LTV / APY / TVL).
 * Borrow CPI remains unavailable until funded — this is READ only (no fork harness shipped).
 */
export async function fetchKaminoXStocksMarket(): Promise<AdapterResult<KaminoMarketSnapshot>> {
  const source = "api.kamino.finance/kamino-market/reserves/metrics";
  try {
    const url = `https://api.kamino.finance/kamino-market/${KAMINO_XSTOCKS_MARKET}/reserves/metrics`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "folio-desk/0.1" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return errResult(source, "kamino_http_error", `HTTP ${res.status}`);
    const json = (await res.json()) as Array<{
      liquidityToken?: string;
      liquidityTokenMint?: string;
      maxLtv?: string | number;
      borrowApy?: string | number;
      supplyApy?: string | number;
      totalSupply?: string | number;
      totalBorrow?: string | number;
      totalSupplyUsd?: string | number;
      totalBorrowUsd?: string | number;
    }>;
    if (!Array.isArray(json) || json.length === 0) {
      return errResult(source, "kamino_empty_reserves");
    }
    const reserves: KaminoReserve[] = json
      .map((r) => {
        const symbol = r.liquidityToken ?? "";
        const mint = r.liquidityTokenMint ?? "";
        const maxLtv = Number(r.maxLtv);
        const borrowApy = Number(r.borrowApy);
        const supplyApy = Number(r.supplyApy);
        const totalSupply = Number(r.totalSupply);
        const totalBorrow = Number(r.totalBorrow);
        if (!symbol || !mint || !Number.isFinite(maxLtv)) return null;
        return {
          symbol,
          mint,
          maxLtv,
          borrowApy: Number.isFinite(borrowApy) ? borrowApy : 0,
          supplyApy: Number.isFinite(supplyApy) ? supplyApy : 0,
          totalSupply: Number.isFinite(totalSupply) ? totalSupply : 0,
          totalBorrow: Number.isFinite(totalBorrow) ? totalBorrow : 0,
          totalSupplyUsd:
            r.totalSupplyUsd != null && Number.isFinite(Number(r.totalSupplyUsd))
              ? Number(r.totalSupplyUsd)
              : null,
          totalBorrowUsd:
            r.totalBorrowUsd != null && Number.isFinite(Number(r.totalBorrowUsd))
              ? Number(r.totalBorrowUsd)
              : null,
        } satisfies KaminoReserve;
      })
      .filter((r): r is KaminoReserve => r != null);

    if (reserves.length === 0) return errResult(source, "kamino_parse_failed");
    return okResult("mainnet-read", source, {
      market: KAMINO_XSTOCKS_MARKET,
      marketName: "xStocks Market",
      reserves,
    });
  } catch (e) {
    return errResult(source, "kamino_fetch_failed", String(e));
  }
}
