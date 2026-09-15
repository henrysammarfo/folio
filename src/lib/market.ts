// Browser-safe market model: holdings, corporate-action multipliers and pure math.

export type Holding = {
  symbol: string;
  name: string;
  underlying: string;
  raw: number;
  multiplier: number;
  health: "Verified" | "Review";
  haircut: number; // collateral haircut applied to market value
};

export const holdings: Holding[] = [
  { symbol: "AAPLx", name: "Apple xStock", underlying: "AAPL", raw: 12.5, multiplier: 4, health: "Verified", haircut: 0.25 },
  { symbol: "NVDAx", name: "NVIDIA xStock", underlying: "NVDA", raw: 8.24, multiplier: 1, health: "Verified", haircut: 0.3 },
  { symbol: "TSLAx", name: "Tesla xStock", underlying: "TSLA", raw: 5.1, multiplier: 1, health: "Review", haircut: 0.4 },
];

export type Quote = {
  symbol: string;
  price: number;
  changePercent: number;
  currency: string;
  asOf: string;
};

export type PriceMap = Record<string, Quote>;

export const economicShares = (h: Holding) => h.raw * h.multiplier;

export const positionValue = (h: Holding, prices: PriceMap) => {
  const q = prices[h.underlying];
  return q ? economicShares(h) * q.price : null;
};

export const portfolioValue = (prices: PriceMap) =>
  holdings.reduce((sum, h) => sum + (positionValue(h, prices) ?? 0), 0);

/** Value eligible as collateral: verified positions only, after haircut. */
export const collateralValue = (prices: PriceMap) =>
  holdings.reduce((sum, h) => {
    if (h.health !== "Verified") return sum;
    const v = positionValue(h, prices) ?? 0;
    return sum + v * (1 - h.haircut);
  }, 0);

export const FEE_BPS = 20; // desk fee
export const SLIPPAGE_BPS = 15; // routed slippage allowance

export function buildQuote(spend: number, price: number | undefined) {
  if (!price || !Number.isFinite(spend) || spend <= 0) return null;
  const fee = (spend * FEE_BPS) / 10_000;
  const net = spend - fee;
  const effectivePrice = price * (1 + SLIPPAGE_BPS / 10_000);
  const shares = net / effectivePrice;
  return { fee, net, effectivePrice, shares, minReceived: shares * (1 - SLIPPAGE_BPS / 10_000) };
}

export function creditModel(collateral: number, ltv: number) {
  const capacity = collateral * (ltv / 100);
  const liquidationLtv = 0.75;
  const liquidationBuffer = collateral > 0 ? (1 - ltv / 100 / liquidationLtv) * 100 : 0;
  return { capacity, liquidationBuffer };
}

export const usd = (n: number | null, digits = 2) =>
  n === null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
