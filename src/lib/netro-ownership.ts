/**
 * Compact ownership for Netro overview — wallet vs estimated.
 * Never invents Verified greens.
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
  if (source === "inspect") walletSourceLabel = "Lookup";
  else if (source === "watch-wallet") walletSourceLabel = "Watch wallet";
  else if (source === "membership") walletSourceLabel = "Connected";
  else if (source === "session") walletSourceLabel = "Connected";

  let qtyLabel = walletRead ? "Wallet" : "Estimated";
  if (source === "inspect" && !walletRead) qtyLabel = "Lookup · estimated";
  else if (
    (source === "watch-wallet" ||
      source === "membership" ||
      source === "session") &&
    !walletRead
  ) {
    qtyLabel = "Bound · estimated";
  }

  return {
    walletSourceLabel,
    qtyLabel,
    economicValueLabel: money(paperValue),
    verifiedLabel: `${verified} / ${total} verified`,
    note: walletRead
      ? "Live wallet balances"
      : "Estimated until you connect a wallet",
    rows: input.rows.slice(0, 3).map((r) => ({
      symbol: r.symbol,
      qtyLabel: `${r.qty.toFixed(4)}${r.qtySource === "paper" ? " est." : ""}`,
      valueLabel: money(r.paperValueUsd ?? 0),
      health: r.health === "Verified" ? "Verified" : "Review",
    })),
  };
}
