/** Pure desk math — no network. */

export function economicShares(raw: number, multiplier: number): number {
  return raw * multiplier;
}

export function divergeBps(left: number, right: number, bandBps = 50): {
  left: number;
  right: number;
  divergeBps: number;
  bandBps: number;
  pass: boolean;
} {
  const mid = (left + right) / 2;
  const bps = mid > 0 ? (Math.abs(left - right) / mid) * 10_000 : Number.POSITIVE_INFINITY;
  return {
    left,
    right,
    divergeBps: bps,
    bandBps,
    pass: Number.isFinite(bps) && bps <= bandBps,
  };
}

export function illustrativeBorrow(collateralUsd: number, maxLtv: number): number {
  return collateralUsd * maxLtv;
}
