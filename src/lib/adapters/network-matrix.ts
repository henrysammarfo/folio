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
  /** Nest.credit vault awareness — must not be conflated with NestUSD borrow. */
  nestCredit: AdapterResult<unknown>;
  scaledUi: AdapterResult<unknown>;
  /** Raydium pool awareness — mainnet-read, not a route guarantee. */
  pools: AdapterResult<unknown>;
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
        : `${detailOf(input.pyth)} (PYTH_API_KEY required since Hermes Aug 2026 auth — fail-closed)`,
    },
    {
      capability: "Jupiter Price v3 (venue + stockData)",
      mode: modeOf(input.jupiterPrice),
      detail: input.jupiterPrice.ok
        ? `${input.jupiterPrice.source} · TTL 30s · stale≤120s on 429`
        : detailOf(input.jupiterPrice),
    },
    {
      capability: "Jupiter swap quote",
      mode: modeOf(input.jupiter),
      detail: input.jupiter.ok
        ? [
            input.jupiter.source.includes("cached") ||
            input.jupiter.source.includes("stale")
              ? input.jupiter.source
              : null,
            "quote-only · no broadcast · TTL 20s · stale≤120s on 429",
          ]
            .filter(Boolean)
            .join(" · ")
        : detailOf(input.jupiter),
    },
    {
      capability: "Raydium pool awareness",
      mode: modeOf(input.pools),
      detail: input.pools.ok
        ? `${input.pools.source} · awareness only · not a route guarantee · wash still required`
        : detailOf(input.pools),
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
        ? `${input.kamino.source} · borrow CPI unavailable until funded (no fork harness)`
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
      capability: "Nest.credit vault awareness (read)",
      mode: modeOf(input.nestCredit),
      detail: input.nestCredit.ok
        ? `${input.nestCredit.source} · indexed vault TVL/OFT — not NestUSD borrow`
        : detailOf(input.nestCredit),
    },
    {
      capability: "NestUSD capacity",
      mode: modeOf(input.nestusd),
      detail: input.nestusd.ok
        ? detailOf(input.nestusd)
        : input.nestusd.detail
          ? `${input.nestusd.reason} — ${input.nestusd.detail}`
          : "Unverified NestUSD borrow metrics · risk-labeled · fail-closed",
    },
    {
      capability: "Multi-tenant sessions (Privy + Supabase)",
      mode: input.multiTenantKeysPresent ? "mainnet-read" : "unavailable",
      detail: input.multiTenantKeysPresent
        ? "Keys present · httpOnly folio_session path armed"
        : "PRIVY_* / SUPABASE_* missing · fail-closed (desk prefs non-authoritative)",
    },
    {
      capability: "Membership wallet qty binding",
      mode: "mainnet-read",
      detail:
        "Priority: active-tenant membership wallet → session → watch-wallet → ?inspect= · never invent a foreign pubkey",
    },
    {
      capability: "Role-gated desk prefs",
      mode: "mainnet-read",
      detail:
        "owner/trader may write · viewer fail-closed (prefs_role_denied) · settings switches disabled",
    },
    {
      capability: "Watch-wallet mainnet-read qty",
      mode: input.sessionSecretPresent ? "mainnet-read" : "unavailable",
      detail: input.sessionSecretPresent
        ? "FOLIO_SESSION_SECRET set · bind on /desk/settings (not Privy auth)"
        : "FOLIO_SESSION_SECRET missing · watch-wallet bind disabled",
    },
    {
      capability: "Ephemeral wallet inspect",
      mode: "mainnet-read",
      detail:
        "Always on · ?inspect=<pubkey> on /desk · /desk/positions · /desk/positions/$symbol · /desk/credit · not auth · no FOLIO_SESSION_SECRET required",
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
