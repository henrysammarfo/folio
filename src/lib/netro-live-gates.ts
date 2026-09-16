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
}): NetroLiveGateLabels {
  const wash = findMode(input.rows, "Wash");
  const quote = findMode(input.rows, "Jupiter swap quote");
  const nestUsd = findMode(input.rows, "NestUSD");
  const pyth = findMode(input.rows, "Pyth Hermes");
  const scaledUi = findMode(input.rows, "On-chain Scaled UI");
  const kamino = findMode(input.rows, "Kamino");
  const multiTenant = findMode(input.rows, "Multi-tenant");

  return {
    wash: washLabel(wash),
    quote:
      quote === "quote-only" || quote === "mainnet-read"
        ? "≤$1 inspect"
        : modeLabel(quote, "≤$1 inspect"),
    broadcast: input.broadcastPaused ? "Paused" : "Armed",
    nestUsd: modeLabel(nestUsd, "Unavailable"),
    pyth: modeLabel(pyth, "Unavailable"),
    scaledUi: modeLabel(scaledUi, "Unavailable"),
    kamino: modeLabel(kamino, "Unavailable"),
    multiTenant: modeLabel(multiTenant, "Unavailable"),
  };
}

export const NETRO_LIVE_GATE_DEFAULTS: NetroLiveGateLabels = {
  wash: "Fail-closed",
  quote: "≤$1 inspect",
  broadcast: "Paused",
  nestUsd: "Unavailable",
  pyth: "Unavailable",
  scaledUi: "Unavailable",
  kamino: "Unavailable",
  multiTenant: "Unavailable",
};
