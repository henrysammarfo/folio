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

/** Paper watchlist quantities only — multipliers filled by live adapters. */
export const paperWatchlist: Omit<Holding, "multiplier" | "health">[] = [
  { symbol: "AAPLx", name: "Apple xStock", underlying: "AAPL", raw: 12.5, haircut: 0.25 },
  { symbol: "NVDAx", name: "NVIDIA xStock", underlying: "NVDA", raw: 8.24, haircut: 0.3 },
  { symbol: "TSLAx", name: "Tesla xStock", underlying: "TSLA", raw: 5.1, haircut: 0.4 },
];

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

export const FEE_BPS = 20;
export const SLIPPAGE_BPS = 15;

export function buildQuote(spend: number, price: number | undefined) {
  if (!price || !Number.isFinite(spend) || spend <= 0) return null;
  const fee = (spend * FEE_BPS) / 10_000;
  const net = spend - fee;
  const effectivePrice = price * (1 + SLIPPAGE_BPS / 10_000);
  const shares = net / effectivePrice;
  return {
    fee,
    net,
    effectivePrice,
    shares,
    minReceived: shares * (1 - SLIPPAGE_BPS / 10_000),
  };
}

export function creditModel(collateral: number, ltv: number) {
  const capacity = collateral * (ltv / 100);
  const liquidationLtv = 0.75;
  const liquidationBuffer =
    collateral > 0 ? (1 - ltv / 100 / liquidationLtv) * 100 : 0;
  return { capacity, liquidationBuffer };
}

export const usd = (n: number | null, digits = 2) =>
  n === null
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
