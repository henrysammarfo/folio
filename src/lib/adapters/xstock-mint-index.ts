/**
 * Mint → xStock meta index from live Solana universe.
 * Used by wallet-scan holdings so qty is not stuck on a 3-symbol watchlist.
 * Fail-closed: empty map when universe unavailable (never invents mints).
 */

import { fetchXStockUniverse } from "./xstocks-universe";

export type XStockMintMeta = {
  symbol: string;
  name: string;
  logo: string | null;
  underlying: string;
};

/**
 * Build mint → meta for every Solana xStock with a known mint.
 * Shared process cache lives inside fetchXStockUniverse (DESK_SYNC.universeTtlMs).
 */
export async function loadXStockMintIndex(): Promise<Map<string, XStockMintMeta>> {
  const map = new Map<string, XStockMintMeta>();
  const universe = await fetchXStockUniverse();
  if (!universe.ok) return map;
  for (const row of universe.data.rows) {
    if (!row.mint) continue;
    map.set(row.mint, {
      symbol: row.symbol,
      name: row.name,
      logo: row.logo,
      underlying: row.underlying,
    });
  }
  return map;
}

/** Symbols with wallet UI amount &gt; dust — order by notional later. */
export function heldXStockSymbolsFromBalances(
  byMint: Record<string, { uiAmount: number }>,
  mintIndex: Map<string, XStockMintMeta>,
  dust = 1e-9,
): Array<{ symbol: string; mint: string; uiAmount: number; meta: XStockMintMeta }> {
  const out: Array<{
    symbol: string;
    mint: string;
    uiAmount: number;
    meta: XStockMintMeta;
  }> = [];
  for (const [mint, bal] of Object.entries(byMint)) {
    if (!Number.isFinite(bal.uiAmount) || bal.uiAmount <= dust) continue;
    const meta = mintIndex.get(mint);
    if (!meta) continue;
    out.push({ symbol: meta.symbol, mint, uiAmount: bal.uiAmount, meta });
  }
  out.sort((a, b) => a.symbol.localeCompare(b.symbol));
  return out;
}
