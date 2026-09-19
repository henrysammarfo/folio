/** Curated Solana stock catalog — mega / IPO / meme lanes + true stock↔stock pairs. */

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

export type LaneMeta = {
  id: XStockLane | "all" | "pairs";
  label: string;
  title: string;
  body: string;
};

/** Lane copy — keeps Buy organized and honest about what each bucket is. */
export const LANE_META: readonly LaneMeta[] = [
  {
    id: "all",
    label: "All",
    title: "Full desk catalog",
    body: "Mega names, recent IPO-era listings, and high-beta meme stocks — each with a buyable or watchlist label.",
  },
  {
    id: "mega",
    label: "Mega",
    title: "Mega-cap xStocks",
    body: "Large liquid names (AAPL, NVDA, MSFT…). Best for USDC buys and stock↔stock pairs when you want deep Jupiter routes.",
  },
  {
    id: "ipo",
    label: "IPO",
    title: "IPO & recent listings",
    body: "Newer public names (Arm, Reddit…). Not private pre-IPO — those live on Pre-IPO (PreStocks) and Tessera desks. Verify mint before size.",
  },
  {
    id: "meme",
    label: "Meme",
    title: "Meme & high-beta",
    body: "Retail-driven names (GME, DJT…). Same wash + Scaled UI gates as mega — never a soft-sold fill. Watchlist rows stay non-buyable until mint is confirmed.",
  },
  {
    id: "pairs",
    label: "Pairs",
    title: "Stock ↔ stock swaps",
    body: "Pay one xStock, receive another (e.g. AAPLx → MSFTx). Quote-only on Jupiter — not two separate USDC buys glued together.",
  },
] as const;

/**
 * Symbols must match Backed / xStocks mint names (ARMx not ARMXx) so logos resolve.
 */
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
  { symbol: "NFLXx", name: "Netflix xStock", underlying: "NFLX", lane: "mega", buyable: true },
  { symbol: "AMDx", name: "AMD xStock", underlying: "AMD", lane: "mega", buyable: true },
  { symbol: "SPYx", name: "SPDR S&P 500 xStock", underlying: "SPY", lane: "mega", buyable: true },
  { symbol: "QQQx", name: "Invesco QQQ xStock", underlying: "QQQ", lane: "mega", buyable: true },
  {
    symbol: "ARMx",
    name: "Arm xStock",
    underlying: "ARM",
    lane: "ipo",
    buyable: true,
    blurb: "Recent large IPO · public listing · not PreStocks private",
  },
  {
    symbol: "RDDTx",
    name: "Reddit xStock",
    underlying: "RDDT",
    lane: "ipo",
    buyable: true,
    blurb: "IPO-era public name · quote-only until fill gate opens",
  },
  {
    symbol: "GMEx",
    name: "GameStop xStock",
    underlying: "GME",
    lane: "meme",
    buyable: true,
    blurb: "High-beta meme · wash gate still fail-closed",
  },
  {
    symbol: "DJTx",
    name: "Trump Media xStock",
    underlying: "DJT",
    lane: "meme",
    buyable: true,
    blurb: "High-beta media · verify size against wash gate",
  },
] as const;

/**
 * True stock↔stock swap presets — Jupiter inputMint = pay, outputMint = receive.
 */
export const XSTOCK_SWAP_PAIRS: readonly {
  pay: string;
  receive: string;
  label: string;
  group: "mega" | "ipo" | "meme" | "cross";
  blurb: string;
}[] = [
  {
    pay: "AAPLx",
    receive: "MSFTx",
    label: "AAPL → MSFT",
    group: "mega",
    blurb: "Mega tech rotation without selling to cash first",
  },
  {
    pay: "NVDAx",
    receive: "AVGOx",
    label: "NVDA → AVGO",
    group: "mega",
    blurb: "AI semis pair — pay NVIDIA, receive Broadcom",
  },
  {
    pay: "TSLAx",
    receive: "HOODx",
    label: "TSLA → HOOD",
    group: "mega",
    blurb: "Retail beta: Tesla into Robinhood exposure",
  },
  {
    pay: "COINx",
    receive: "HOODx",
    label: "COIN → HOOD",
    group: "mega",
    blurb: "Brokerage lane: Coinbase into Robinhood",
  },
  {
    pay: "SPYx",
    receive: "QQQx",
    label: "SPY → QQQ",
    group: "mega",
    blurb: "Broad market into Nasdaq-100 basket",
  },
  {
    pay: "ARMx",
    receive: "NVDAx",
    label: "ARM → NVDA",
    group: "ipo",
    blurb: "IPO-era Arm into mega NVIDIA — still public xStocks",
  },
  {
    pay: "RDDTx",
    receive: "METAx",
    label: "RDDT → META",
    group: "ipo",
    blurb: "Social IPO into Meta mega-cap",
  },
  {
    pay: "GMEx",
    receive: "AAPLx",
    label: "GME → AAPL",
    group: "meme",
    blurb: "Meme high-beta into mega Apple — gates still apply",
  },
  {
    pay: "GMEx",
    receive: "TSLAx",
    label: "GME → TSLA",
    group: "meme",
    blurb: "Meme into Tesla retail beta",
  },
  {
    pay: "DJTx",
    receive: "METAx",
    label: "DJT → META",
    group: "meme",
    blurb: "Media beta into Meta",
  },
  {
    pay: "AAPLx",
    receive: "GMEx",
    label: "AAPL → GME",
    group: "cross",
    blurb: "Mega into meme — labeled high-beta receive side",
  },
  {
    pay: "NVDAx",
    receive: "ARMx",
    label: "NVDA → ARM",
    group: "cross",
    blurb: "Mega into IPO-era Arm",
  },
] as const;

/** @deprecated Prefer XSTOCK_SWAP_PAIRS — agent pair-hint shorthand. */
export const XSTOCK_COMPARE_PAIRS = XSTOCK_SWAP_PAIRS.map((p) => ({
  left: p.pay,
  right: p.receive,
  label: p.label,
}));

export { xStockLogoUrl } from "./logo-resolve";

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

export function laneMeta(id: LaneMeta["id"]): LaneMeta {
  return LANE_META.find((l) => l.id === id) ?? LANE_META[0]!;
}

export function swapPairsByGroup(
  group: "all" | "mega" | "ipo" | "meme" | "cross",
): typeof XSTOCK_SWAP_PAIRS {
  if (group === "all") return XSTOCK_SWAP_PAIRS;
  return XSTOCK_SWAP_PAIRS.filter((p) => p.group === group);
}
