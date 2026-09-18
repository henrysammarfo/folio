import { errResult, okResult, type AdapterResult } from "./types";

export type RaydiumPoolHit = {
  poolId: string;
  type: string;
  mintA: string;
  mintB: string;
  symbolA: string | null;
  symbolB: string | null;
  tvl: number | null;
  volume24h: number | null;
};

export type PoolAwareness = {
  mint: string;
  raydium: RaydiumPoolHit[];
  note: string;
};

/** Raydium v3 pool awareness for an xStock mint — mainnet READ, not a route guarantee. */
export async function fetchRaydiumPoolsForMint(
  mint: string,
): Promise<AdapterResult<PoolAwareness>> {
  const source = "api-v3.raydium.io/pools/info/mint";
  try {
    const qs = new URLSearchParams({
      mint1: mint,
      poolType: "all",
      poolSortField: "default",
      sortType: "desc",
      pageSize: "5",
      page: "1",
    });
    const res = await fetch(`https://api-v3.raydium.io/pools/info/mint?${qs}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return errResult(source, "raydium_http_error", `HTTP ${res.status}`);
    const json = (await res.json()) as {
      success?: boolean;
      data?: {
        data?: Array<{
          id?: string;
          type?: string;
          mintA?: { address?: string; symbol?: string };
          mintB?: { address?: string; symbol?: string };
          tvl?: number;
          day?: { volume?: number };
        }>;
      };
    };
    if (!json.success || !Array.isArray(json.data?.data)) {
      return errResult(source, "raydium_malformed");
    }
    const raydium: RaydiumPoolHit[] = json.data.data
      .map((p) => {
        if (!p.id || !p.mintA?.address || !p.mintB?.address) return null;
        return {
          poolId: p.id,
          type: p.type ?? "unknown",
          mintA: p.mintA.address,
          mintB: p.mintB.address,
          symbolA: p.mintA.symbol ?? null,
          symbolB: p.mintB.symbol ?? null,
          tvl: typeof p.tvl === "number" ? p.tvl : null,
          volume24h: typeof p.day?.volume === "number" ? p.day.volume : null,
        } satisfies RaydiumPoolHit;
      })
      .filter((p): p is RaydiumPoolHit => p != null);

    return okResult("mainnet-read", source, {
      mint,
      raydium,
      note: "Pool awareness only — Jupiter quote remains the acquire path; wash gate still required.",
    });
  } catch (e) {
    return errResult(source, "raydium_fetch_failed", String(e));
  }
}
