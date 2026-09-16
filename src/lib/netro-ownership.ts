/**
 * Compact ownership honesty for Netro overview — paper vs wallet-read,
 * inspect/watch binding. Never invents Verified greens.
 */
export type NetroOwnershipSummary = {
  walletSourceLabel: string;
  qtyLabel: string;
  economicValueLabel: string;
  verifiedLabel: string;
  note: string;
  rows: Array<{
    symbol: string;
    qtyLabel: string;
    valueLabel: string;
    health: string;
  }>;
};

export type NetroOwnershipInput = {
  walletSource: string | null | undefined;
  note?: string | null;
  rows: ReadonlyArray<{
    symbol: string;
    qty: number;
    qtySource: "wallet-read" | "paper";
    paperValueUsd: number | null;
    health: string;
  }>;
};

function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function buildNetroOwnershipSummary(
  input: NetroOwnershipInput,
): NetroOwnershipSummary {
  const source = input.walletSource ?? null;
  const walletRead = input.rows.some((r) => r.qtySource === "wallet-read");
  const paperValue = input.rows.reduce(
    (s, r) => s + (r.paperValueUsd ?? 0),
    0,
  );
  const verified = input.rows.filter((r) => r.health === "Verified").length;
  const total = input.rows.length;

  let walletSourceLabel = "No wallet";
  if (source === "inspect") walletSourceLabel = "Inspect · ephemeral";
  else if (source === "watch-wallet") walletSourceLabel = "Watch-wallet";
  else if (source === "membership") walletSourceLabel = "Membership";
  else if (source === "session") walletSourceLabel = "Session";

  return {
    walletSourceLabel,
    qtyLabel: walletRead ? "Wallet-read qty" : "Paper qty",
    economicValueLabel: money(paperValue),
    verifiedLabel: `${verified} / ${total} verified`,
    note:
      input.note?.trim() ||
      (walletRead
        ? "Mainnet wallet-read qty · Scaled UI labeled per row"
        : "Paper qty until bind / inspect · mainnet marks"),
    rows: input.rows.slice(0, 3).map((r) => ({
      symbol: r.symbol,
      qtyLabel: `${r.qty.toFixed(4)} ${r.qtySource}`,
      valueLabel: money(r.paperValueUsd ?? 0),
      health: r.health,
    })),
  };
}
