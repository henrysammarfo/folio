/** Curated Solana xStock catalog for Buy / Swap picker (logos from Backed CDN). */

export type XStockCatalogItem = {
  symbol: string;
  name: string;
  underlying: string;
};

/** Popular tokenized equities — logos at xstocks-metadata.backed.fi */
export const XSTOCK_CATALOG: readonly XStockCatalogItem[] = [
  { symbol: "AAPLx", name: "Apple xStock", underlying: "AAPL" },
  { symbol: "NVDAx", name: "NVIDIA xStock", underlying: "NVDA" },
  { symbol: "TSLAx", name: "Tesla xStock", underlying: "TSLA" },
  { symbol: "GOOGLx", name: "Alphabet xStock", underlying: "GOOGL" },
  { symbol: "METAx", name: "Meta xStock", underlying: "META" },
  { symbol: "AMZNx", name: "Amazon xStock", underlying: "AMZN" },
  { symbol: "MSFTx", name: "Microsoft xStock", underlying: "MSFT" },
  { symbol: "COINx", name: "Coinbase xStock", underlying: "COIN" },
  { symbol: "HOODx", name: "Robinhood xStock", underlying: "HOOD" },
  { symbol: "CRWDx", name: "CrowdStrike xStock", underlying: "CRWD" },
  { symbol: "PLTRx", name: "Palantir xStock", underlying: "PLTR" },
  { symbol: "AVGOx", name: "Broadcom xStock", underlying: "AVGO" },
] as const;

export function xStockLogoUrl(symbol: string): string {
  return `https://xstocks-metadata.backed.fi/logos/tokens/${encodeURIComponent(symbol)}.png`;
}

export function findCatalogItem(symbol: string): XStockCatalogItem | undefined {
  const key = symbol.trim().toLowerCase();
  return XSTOCK_CATALOG.find((s) => s.symbol.toLowerCase() === key);
}

export function isBuyableXStock(symbol: string): boolean {
  return Boolean(findCatalogItem(symbol));
}
