/**
 * Map /network matrix rows into Netro overview metric labels.
 * Never invents greens — modes come from live adapters only.
 */
import type { IntegrationMode } from "@/lib/adapters/types";

export type NetroLiveGateLabels = {
  wash: string;
  quote: string;
  broadcast: string;
  nestUsd: string;
  pyth: string;
  scaledUi: string;
  kamino: string;
  multiTenant: string;
  /** Raydium pool awareness — mainnet-read when live, never a route guarantee. */
  raydium: string;
  /** Nest.credit vault awareness — not NestUSD borrow. */
  nestCredit: string;
  /** Live AAPLx maxLtv from Kamino when mainnet-read — e.g. "0.40". */
  kaminoLtv: string | null;
  /** Paper/wallet illustrative borrow capacity label. */
  creditCapacity: string;
  /** Live Jupiter quote-only out amount for ≤$1 USDC inspect. */
  quoteOut: string;
  /** Jupiter cache/TTL honesty — cached · stale · live · unavailable. */
  quoteMeta: string;
};

export type MatrixLikeRow = {
  capability: string;
  mode: IntegrationMode;
  detail: string;
};

function findMode(
  rows: readonly MatrixLikeRow[],
  capabilityPrefix: string,
): IntegrationMode | null {
  const row = rows.find((r) => r.capability.startsWith(capabilityPrefix));
  return row?.mode ?? null;
}

function modeLabel(mode: IntegrationMode | null, fallback: string): string {
  if (!mode) return fallback;
  if (mode === "unavailable") return "Unavailable";
  if (mode === "quote-only") return "Quote-only";
  if (mode === "mainnet-read") return "Mainnet-read";
  if (mode === "paper") return "Paper";
  if (mode === "fork") return "Fork";
  return mode;
}

/** Short wash label for Netro flow strip — fail-closed language when unavailable. */
function washLabel(mode: IntegrationMode | null): string {
  if (mode === "mainnet-read") return "Live";
  if (mode === "unavailable" || !mode) return "Fail-closed";
  return modeLabel(mode, "Fail-closed");
}

export function buildNetroLiveGateLabels(input: {
  rows: readonly MatrixLikeRow[];
  broadcastPaused: boolean;
  /** Live AAPLx Kamino maxLtv when credit bundle is mainnet-read. */
  kaminoMaxLtv?: number | null;
  /** Illustrative borrow USD from credit bundle (paper or wallet-read × LTV). */
  illustrativeBorrowUsd?: number | null;
  /** paper | wallet-read */
  creditQtyLabel?: string | null;
  /** Live Jupiter out UI amount for $1 USDC inspect (quote-only). */
  jupiterOutUi?: number | null;
  /** Jupiter adapter source string when ok (may include cached/stale). */
  jupiterSource?: string | null;
  /** Jupiter fail reason when quote unavailable. */
  jupiterReason?: string | null;
}): NetroLiveGateLabels {
  const wash = findMode(input.rows, "Wash");
  const quote = findMode(input.rows, "Jupiter swap quote");
  const nestUsd = findMode(input.rows, "NestUSD");
  const pyth = findMode(input.rows, "Pyth Hermes");
  const equityRef = findMode(input.rows, "Equity reference");
  const equityRow = input.rows.find((r) =>
    r.capability.startsWith("Equity reference"),
  );
  const scaledUi = findMode(input.rows, "On-chain Scaled UI");
  const kamino = findMode(input.rows, "Kamino");
  const multiTenant = findMode(input.rows, "Multi-tenant");
  const raydium = findMode(input.rows, "Raydium");
  const nestCredit = findMode(input.rows, "Nest.credit");

  /** Prefer live free diverge label over Pyth-unavailable theater. */
  let pythLabel = modeLabel(pyth, "Off ship path");
  if (equityRef === "mainnet-read" && equityRow?.detail) {
    const provider =
      /yahoo/i.test(equityRow.detail)
        ? "Yahoo"
        : /finnhub/i.test(equityRow.detail)
          ? "Finnhub"
          : /coingecko/i.test(equityRow.detail)
            ? "CoinGecko"
            : "Live ref";
    pythLabel = `${provider} live`;
  } else if (pyth === "unavailable" || !pyth) {
    pythLabel = "Off ship path";
  }

  const ltv =
    typeof input.kaminoMaxLtv === "number" && Number.isFinite(input.kaminoMaxLtv)
      ? input.kaminoMaxLtv.toFixed(2)
      : null;

  let creditCapacity = "Illustrative · borrow off";
  if (
    typeof input.illustrativeBorrowUsd === "number" &&
    Number.isFinite(input.illustrativeBorrowUsd)
  ) {
    const qty = input.creditQtyLabel === "wallet-read" ? "wallet-read" : "paper";
    creditCapacity = `$${Math.round(input.illustrativeBorrowUsd).toLocaleString("en-US")} · ${qty} × LTV · no broadcast`;
  }

  let quoteOut = "Quote pending";
  let quoteMeta = "quote-only · no broadcast";
  if (
    typeof input.jupiterOutUi === "number" &&
    Number.isFinite(input.jupiterOutUi) &&
    input.jupiterOutUi > 0
  ) {
    quoteOut = `${input.jupiterOutUi.toFixed(6)} AAPLx`;
    const src = (input.jupiterSource ?? "").toLowerCase();
    if (src.includes("stale")) quoteMeta = "stale-cache · TTL · no broadcast";
    else if (src.includes("cached")) quoteMeta = "cached · TTL · no broadcast";
    else quoteMeta = "live quote · TTL · no broadcast";
  } else if (input.jupiterReason) {
    quoteOut = "Unavailable";
    quoteMeta = `${input.jupiterReason} · no broadcast`;
  }

  return {
    wash: washLabel(wash),
    quote:
      quote === "quote-only" || quote === "mainnet-read"
        ? "≤$1 inspect"
        : modeLabel(quote, "≤$1 inspect"),
    broadcast: input.broadcastPaused ? "Paused" : "Armed",
    nestUsd: modeLabel(nestUsd, "Unavailable"),
    pyth: pythLabel,
    scaledUi: modeLabel(scaledUi, "Unavailable"),
    kamino: modeLabel(kamino, "Unavailable"),
    multiTenant: modeLabel(multiTenant, "Unavailable"),
    raydium: modeLabel(raydium, "Unavailable"),
    nestCredit: modeLabel(nestCredit, "Unavailable"),
    kaminoLtv: ltv,
    creditCapacity,
    quoteOut,
    quoteMeta,
  };
}

export const NETRO_LIVE_GATE_DEFAULTS: NetroLiveGateLabels = {
  wash: "Fail-closed",
  quote: "≤$1 inspect",
  broadcast: "Paused",
  nestUsd: "Unavailable",
  pyth: "Off ship path",
  scaledUi: "Unavailable",
  kamino: "Unavailable",
  multiTenant: "Unavailable",
  raydium: "Unavailable",
  nestCredit: "Unavailable",
  kaminoLtv: null,
  creditCapacity: "Illustrative · borrow off",
  quoteOut: "Quote pending",
  quoteMeta: "quote-only · no broadcast",
};
