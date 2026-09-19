/** Curated Solana xStock catalog — mega / IPO / meme lanes + compare pairs. */

export type XStockLane = "mega" | "ipo" | "meme";

export type XStockCatalogItem = {
  symbol: string;
  name: string;
  underlying: string;
  lane: XStockLane;
  /** False = listed for awareness only — quotes may fail until mint is live. */
  buyable: boolean;
  blurb?: string;
};

/** Popular + labeled IPO / meme lanes — logos at xstocks-metadata.backed.fi when present. */
export const XSTOCK_CATALOG: readonly XStockCatalogItem[] = [
  { symbol: "AAPLx", name: "Apple xStock", underlying: "AAPL", lane: "mega", buyable: true },
  { symbol: "NVDAx", name: "NVIDIA xStock", underlying: "NVDA", lane: "mega", buyable: true },
  { symbol: "TSLAx", name: "Tesla xStock", underlying: "TSLA", lane: "mega", buyable: true },
  { symbol: "GOOGLx", name: "Alphabet xStock", underlying: "GOOGL", lane: "mega", buyable: true },
  { symbol: "METAx", name: "Meta xStock", underlying: "META", lane: "mega", buyable: true },
  { symbol: "AMZNx", name: "Amazon xStock", underlying: "AMZN", lane: "mega", buyable: true },
  { symbol: "MSFTx", name: "Microsoft xStock", underlying: "MSFT", lane: "mega", buyable: true },
  { symbol: "COINx", name: "Coinbase xStock", underlying: "COIN", lane: "mega", buyable: true },
  { symbol: "HOODx", name: "Robinhood xStock", underlying: "HOOD", lane: "mega", buyable: true },
  { symbol: "CRWDx", name: "CrowdStrike xStock", underlying: "CRWD", lane: "mega", buyable: true },
  { symbol: "PLTRx", name: "Palantir xStock", underlying: "PLTR", lane: "mega", buyable: true },
  { symbol: "AVGOx", name: "Broadcom xStock", underlying: "AVGO", lane: "mega", buyable: true },
  // IPO / recent-list lane — buyable when Backed mint exists; still honesty-labeled
  {
    symbol: "ARMXx",
    name: "Arm xStock",
    underlying: "ARM",
    lane: "ipo",
    buyable: true,
    blurb: "Recent large IPO · verify mint before size",
  },
  {
    symbol: "RDDTx",
    name: "Reddit xStock",
    underlying: "RDDT",
    lane: "ipo",
    buyable: true,
    blurb: "IPO-era name · quote-only until fill gate opens",
  },
  {
    symbol: "CMBGx",
    name: "Compass xStock",
    underlying: "COMP",
    lane: "ipo",
    buyable: false,
    blurb: "Watchlist · mint not confirmed on desk",
  },
  // Meme / high-beta lane — honest labels, not hype fills
  {
    symbol: "GMEXx",
    name: "GameStop xStock",
    underlying: "GME",
    lane: "meme",
    buyable: true,
    blurb: "High-beta meme · wash gate still fail-closed",
  },
  {
    symbol: "AMCXx",
    name: "AMC xStock",
    underlying: "AMC",
    lane: "meme",
    buyable: false,
    blurb: "Watchlist · no confirmed Backed mint on desk",
  },
  {
    symbol: "DJTXx",
    name: "Trump Media xStock",
    underlying: "DJT",
    lane: "meme",
    buyable: false,
    blurb: "Watchlist · not buyable until mint verified",
  },
] as const;

/** Suggested compare pairs for the Buy desk (USDC→A vs USDC→B quotes). */
export const XSTOCK_COMPARE_PAIRS: readonly {
  left: string;
  right: string;
  label: string;
}[] = [
  { left: "AAPLx", right: "MSFTx", label: "Mega tech" },
  { left: "NVDAx", right: "AVGOx", label: "AI semis" },
  { left: "TSLAx", right: "HOODx", label: "Retail beta" },
  { left: "COINx", right: "HOODx", label: "Brokerage" },
  { left: "ARMXx", right: "NVDAx", label: "IPO vs mega" },
  { left: "GMEXx", right: "AAPLx", label: "Meme vs mega" },
] as const;

export function xStockLogoUrl(symbol: string): string {
  return `https://xstocks-metadata.backed.fi/logos/tokens/${encodeURIComponent(symbol)}.png`;
}

export function findCatalogItem(symbol: string): XStockCatalogItem | undefined {
  const key = symbol.trim().toLowerCase();
  return XSTOCK_CATALOG.find((s) => s.symbol.toLowerCase() === key);
}

export function isBuyableXStock(symbol: string): boolean {
  const item = findCatalogItem(symbol);
  return Boolean(item?.buyable);
}

export function catalogByLane(lane: XStockLane | "all"): readonly XStockCatalogItem[] {
  if (lane === "all") return XSTOCK_CATALOG;
  return XSTOCK_CATALOG.filter((s) => s.lane === lane);
}
