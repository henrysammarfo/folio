// Browser-safe market types + pure math. No fantasy multipliers.

export type Holding = {
  symbol: string;
  name: string;
  underlying: string;
  raw: number;
  /** Must come from live xStocks / on-chain Scaled UI — never hardcode corporate-action multiples. */
  multiplier: number | null;
  health: "Verified" | "Review" | "Unavailable";
  haircut: number;
};

/** Paper watchlist quantities only — multipliers filled by live adapters. Not wallet truth. */
export const paperWatchlist: Omit<Holding, "multiplier" | "health">[] = [
  { symbol: "AAPLx", name: "Apple xStock", underlying: "AAPL", raw: 12.5, haircut: 0.25 },
  { symbol: "NVDAx", name: "NVIDIA xStock", underlying: "NVDA", raw: 8.24, haircut: 0.3 },
  { symbol: "TSLAx", name: "Tesla xStock", underlying: "TSLA", raw: 5.1, haircut: 0.4 },
];

const PAPER_RAW_BY_SYMBOL: Record<string, number> = Object.fromEntries(
  paperWatchlist.map((h) => [h.symbol, h.raw]),
);

/** Single source of truth for illustrative paper qty until Privy wallet binding. */
export function paperRawFor(symbol: string, fallback = 1): number {
  return PAPER_RAW_BY_SYMBOL[symbol] ?? fallback;
}

export const UNDERLYING_SYMBOLS = [
  ...new Set(paperWatchlist.map((h) => h.underlying)),
] as string[];

export type Quote = {
  symbol: string;
  price: number;
  changePercent: number;
  currency: string;
  asOf: string;
};

export type PriceMap = Record<string, Quote>;

export const economicShares = (raw: number, multiplier: number) => raw * multiplier;

export const positionValue = (
  raw: number,
  multiplier: number | null,
  prices: PriceMap,
  underlying: string,
) => {
  if (multiplier == null) return null;
  const q = prices[underlying];
  return q ? economicShares(raw, multiplier) * q.price : null;
};

export const usd = (n: number | null, digits = 2) =>
  n === null
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
