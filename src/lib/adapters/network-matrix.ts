import type { AdapterResult, IntegrationMode } from "./types";

export type MatrixRow = {
  capability: string;
  mode: IntegrationMode;
  detail: string;
};

function modeOf(r: AdapterResult<unknown>): IntegrationMode {
  return r.ok ? r.mode : "unavailable";
}

function detailOf(r: AdapterResult<unknown>, okDetail?: string): string {
  if (r.ok) return okDetail ?? r.source;
  return r.detail ? `${r.reason} — ${r.detail}` : r.reason;
}

/**
 * Honest capability matrix for Stocklana / World's Fair judges.
 * Never paint NestUSD, multi-tenant auth, or broadcast as live when they aren't.
 */
export function buildNetworkMatrix(input: {
  multiplier: AdapterResult<unknown>;
  pyth: AdapterResult<unknown>;
  jupiter: AdapterResult<unknown>;
  jupiterPrice: AdapterResult<unknown>;
  wash: AdapterResult<unknown>;
  kamino: AdapterResult<unknown>;
  jupiterLend: AdapterResult<unknown>;
  nestusd: AdapterResult<unknown>;
  scaledUi: AdapterResult<unknown>;
  bitqueryKeyPresent: boolean;
  /** Privy + Supabase + session secret all configured. */
  multiTenantKeysPresent: boolean;
  /** FOLIO_SESSION_SECRET ≥16 (watch-wallet + cookie signing). */
  sessionSecretPresent: boolean;
  /** Public RPC fallback in use (still mainnet-read, rate-limited). */
  solanaRpcPublicFallback: boolean;
  broadcastFunded: boolean;
}): MatrixRow[] {
  return [
    {
      capability: "xStocks multiplier + asset metadata",
      mode: modeOf(input.multiplier),
      detail: detailOf(input.multiplier),
    },
    {
      capability: "On-chain Scaled UI (Token-2022)",
      mode: modeOf(input.scaledUi),
      detail: input.scaledUi.ok
        ? `${input.scaledUi.source}${input.solanaRpcPublicFallback ? " · public RPC fallback" : ""}`
        : detailOf(input.scaledUi),
    },
    {
      capability: "Pyth Hermes equity reference",
      mode: modeOf(input.pyth),
      detail: input.pyth.ok
        ? input.pyth.source
        : `${detailOf(input.pyth)} (Hermes may 401 on this egress — fail-closed)`,
    },
    {
      capability: "Jupiter Price v3 (venue + stockData)",
      mode: modeOf(input.jupiterPrice),
      detail: detailOf(input.jupiterPrice),
    },
    {
      capability: "Jupiter swap quote",
      mode: modeOf(input.jupiter),
      detail: input.jupiter.ok ? "quote-only · no broadcast" : detailOf(input.jupiter),
    },
    {
      capability: "Wash / linked-flow gate",
      mode: input.bitqueryKeyPresent ? modeOf(input.wash) : "unavailable",
      detail: input.bitqueryKeyPresent
        ? input.wash.ok
          ? "Bitquery live"
          : detailOf(input.wash)
        : "BITQUERY_API_KEY missing · fail-closed",
    },
    {
      capability: "Kamino xStocks market (read)",
      mode: modeOf(input.kamino),
      detail: input.kamino.ok
        ? `${input.kamino.source} · borrow CPI = local fork until funded`
        : detailOf(input.kamino),
    },
    {
      capability: "Jupiter Lend earn vaults (read)",
      mode: modeOf(input.jupiterLend),
      detail: input.jupiterLend.ok
        ? `${input.jupiterLend.source} · earn vaults, not xStock borrow`
        : detailOf(input.jupiterLend),
    },
    {
      capability: "NestUSD capacity",
      mode: modeOf(input.nestusd),
      detail: input.nestusd.ok
        ? detailOf(input.nestusd)
        : "Unverified public metrics endpoint · risk-labeled · fail-closed",
    },
    {
      capability: "Multi-tenant sessions (Privy + Supabase)",
      mode: input.multiTenantKeysPresent ? "mainnet-read" : "unavailable",
      detail: input.multiTenantKeysPresent
        ? "Keys present · httpOnly folio_session path armed"
        : "PRIVY_* / SUPABASE_* missing · fail-closed (desk prefs non-authoritative)",
    },
    {
      capability: "Watch-wallet mainnet-read qty",
      mode: input.sessionSecretPresent ? "mainnet-read" : "unavailable",
      detail: input.sessionSecretPresent
        ? "FOLIO_SESSION_SECRET set · bind on /desk/settings (not Privy auth)"
        : "FOLIO_SESSION_SECRET missing · watch-wallet bind disabled",
    },
    {
      capability: "Broadcast swap / borrow",
      mode: input.broadcastFunded ? "mainnet-read" : "unavailable",
      detail: input.broadcastFunded
        ? "Funded wallet path (still requires explicit user confirm)"
        : "Not funded · ≤~$1 budget · quote-only · BROADCAST_PAUSED",
    },
    {
      capability: "Custom FOLIO program deploy",
      mode: "unavailable",
      detail: "Skipped — mainnet rent exceeds ≤~$1 test budget",
    },
  ];
}
