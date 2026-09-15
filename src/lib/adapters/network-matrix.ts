import type { AdapterResult, IntegrationMode } from "./types";

export type MatrixRow = {
  capability: string;
  mode: IntegrationMode;
  detail: string;
};

export function buildNetworkMatrix(input: {
  multiplier: AdapterResult<unknown>;
  pyth: AdapterResult<unknown>;
  jupiter: AdapterResult<unknown>;
  jupiterPrice: AdapterResult<unknown>;
  wash: AdapterResult<unknown>;
  bitqueryKeyPresent: boolean;
  broadcastFunded: boolean;
}): MatrixRow[] {
  const modeOf = (r: AdapterResult<unknown>): IntegrationMode =>
    r.ok ? r.mode : "unavailable";

  return [
    {
      capability: "xStocks multiplier + asset metadata",
      mode: modeOf(input.multiplier),
      detail: input.multiplier.ok ? input.multiplier.source : input.multiplier.reason,
    },
    {
      capability: "Pyth Hermes equity reference",
      mode: modeOf(input.pyth),
      detail: input.pyth.ok
        ? input.pyth.source
        : `${input.pyth.reason} (Hermes price updates 401 on this egress 2026-09-15 — fail-closed)`,
    },
    {
      capability: "Jupiter Price v3 (venue + stockData)",
      mode: modeOf(input.jupiterPrice),
      detail: input.jupiterPrice.ok
        ? input.jupiterPrice.source
        : input.jupiterPrice.reason,
    },
    {
      capability: "Jupiter swap quote",
      mode: modeOf(input.jupiter),
      detail: input.jupiter.ok ? "quote-only · no broadcast" : input.jupiter.reason,
    },
    {
      capability: "Wash / linked-flow gate",
      mode: modeOf(input.wash),
      detail: input.bitqueryKeyPresent
        ? input.wash.ok
          ? "Bitquery live"
          : input.wash.reason
        : "BITQUERY_API_KEY missing · fail-closed",
    },
    {
      capability: "Kamino / Jupiter Lend / NestUSD",
      mode: "mainnet-read",
      detail: "Reads labeled · borrow CPI = local fork until funded",
    },
    {
      capability: "Broadcast swap / borrow",
      mode: input.broadcastFunded ? "mainnet-read" : "unavailable",
      detail: input.broadcastFunded
        ? "Funded wallet path (still requires explicit user confirm)"
        : "Not funded · ≤~$1 budget · quote-only",
    },
    {
      capability: "Custom FOLIO program deploy",
      mode: "unavailable",
      detail: "Skipped — mainnet rent exceeds ≤~$1 test budget",
    },
  ];
}