/**
 * Shared React Query keys — holdings / credit / markets stay identical
 * across Home · Holdings · Credit · Netro surface so balances never drift.
 */

export function positionsQueryKey(inspectWallet?: string | null) {
  return ["positions-bundle", inspectWallet?.trim() || ""] as const;
}

export function creditQueryKey(inspectWallet?: string | null) {
  return ["credit-bundle", inspectWallet?.trim() || ""] as const;
}

export function marketsQueryKey(lane: string) {
  return ["markets-board", lane] as const;
}

export function acquireQueryKey(parts: {
  symbol: string;
  pay: string;
  amount: number;
}) {
  return [
    "acquire-bundle",
    parts.symbol,
    parts.pay,
    parts.amount,
  ] as const;
}

/** Desk-wide sync tick — pages refetch on the same cadence when focused. */
export const DESK_SYNC = {
  positionsStaleMs: 8_000,
  positionsRefetchMs: 12_000,
  creditStaleMs: 12_000,
  marketsStaleMs: 25_000,
  marketsRefetchMs: 45_000,
  washTtlMs: 60_000,
  washStaleMs: 240_000,
  universeTtlMs: 600_000,
  boardTtlMs: 60_000,
} as const;
