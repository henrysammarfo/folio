import { errResult, type AdapterResult, type IntegrationMode } from "./types";

export type MatrixRow = {
  capability: string;
  mode: IntegrationMode;
  detail: string;
};

function modeOf(r: AdapterResult<unknown>): IntegrationMode {
  return r.ok ? r.mode : "unavailable";
}

function detailOf(r: AdapterResult<unknown>, okDetail?: string): string {
  if (r.ok) {
    if (okDetail) return okDetail;
    const data = r.data as { label?: string; note?: string } | null;
    if (data && typeof data === "object") {
      if (typeof data.label === "string" && data.label) return `${r.source} · ${data.label}`;
      if (typeof data.note === "string" && data.note) return data.note;
    }
    return r.source;
  }
  return r.detail ? `${r.reason} — ${r.detail}` : r.reason;
}

function errUnavailable(source: string): AdapterResult<unknown> {
  return errResult(source, "unwired");
}

/**
 * Honest capability matrix for Stocklana / World's Fair judges.
 * Never paint NestUSD, multi-tenant auth, or broadcast as live when they aren't.
 */
export function buildNetworkMatrix(input: {
  multiplier: AdapterResult<unknown>;
  pyth: AdapterResult<unknown>;
  /** Free cascade (Pyth → Finnhub → Yahoo) used for diverge scoring. */
  equityRef?: AdapterResult<{
    provider?: string;
    feedSymbol?: string;
    price?: number;
  }>;
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
  /** Phantom Connect dual-path (alongside Privy) — sign / bind, not session mint. */
  phantomConnect?: AdapterResult<unknown>;
  /** Reflect USDC+/USDT+ stable rail — not NestUSD / Nest.credit. */
  reflect?: AdapterResult<unknown>;
  /** Meteora DBC awareness — separate bounty lane, not xStock truth. */
  meteoraDbc?: AdapterResult<unknown>;
  /** Squads / Altitude treasury vault read. */
  squadsTreasury?: AdapterResult<{
    broadcastTreasuryReady?: boolean;
    sol?: number;
    note?: string;
  }>;
  bitqueryKeyPresent: boolean;
  /** Privy + Supabase + session secret all configured. */
  multiTenantKeysPresent: boolean;
  /** FOLIO_SESSION_SECRET ≥16 (watch-wallet + cookie signing). */
  sessionSecretPresent: boolean;
  /** Public RPC fallback in use (still mainnet-read, rate-limited). */
  solanaRpcPublicFallback: boolean;
  /** FOLIO-sponsored treasury / CPI budget — still false at ≤~$1. */
  broadcastFunded: boolean;
  /** Env arm: BROADCAST_PAUSED=false enables user-signed Jupiter /execute. */
  broadcastPaused?: boolean;
  /** Cash session (NYSE hours) — weekend refuse lives in FOLIO. */
  cashSession?: AdapterResult<unknown>;
  /** FOLIO Meteora DBC stock-curve config (+ optional devnet pool). */
  stockCurve?: AdapterResult<unknown>;
  /** Solami / RPC mainnet tape probe. */
  solamiTape?: AdapterResult<unknown>;
}): MatrixRow[] {
  const phantom =
    input.phantomConnect ??
    ({
      ok: false,
      mode: "unavailable" as const,
      asOf: new Date().toISOString(),
      source: "phantom-connect",
      reason: "phantom_connect_not_probed",
    } as const);
  const reflect =
    input.reflect ??
    ({
      ok: false,
      mode: "unavailable" as const,
      asOf: new Date().toISOString(),
      source: "reflect",
      reason: "reflect_not_probed",
    } as const);
  const meteoraDbc =
    input.meteoraDbc ??
    ({
      ok: false,
      mode: "unavailable" as const,
      asOf: new Date().toISOString(),
      source: "meteora-dbc",
      reason: "meteora_dbc_not_probed",
    } as const);
  const squads =
    input.squadsTreasury ??
    ({
      ok: false,
      mode: "unavailable" as const,
      asOf: new Date().toISOString(),
      source: "squads-treasury",
      reason: "squads_vault_unconfigured",
      detail: "Set FOLIO_SQUADS_VAULT",
    } as const);
  const treasuryReady =
    input.broadcastFunded ||
    (squads.ok && Boolean(squads.data.broadcastTreasuryReady));
  return [
    {
      capability: "xStocks multiplier + asset metadata",
      mode: modeOf(input.multiplier),
      detail: detailOf(input.multiplier),
    },
    {
      capability: "Cash session (weekend refuse)",
      mode: modeOf(input.cashSession ?? errUnavailable("folio.cash-session")),
      detail: input.cashSession
        ? detailOf(input.cashSession)
        : "Unwired · Bible spine requires FOLIO session gate",
    },
    {
      capability: "Meteora DBC stock curve",
      mode: modeOf(input.stockCurve ?? errUnavailable("folio.stock-curve")),
      detail: input.stockCurve
        ? detailOf(
            input.stockCurve,
            "USDC · gentle · fixed/short linear · start=cash close · mainnet pool when FOLIO_DBC_POOL set",
          )
        : "Config unwired · World’s Fair primary track",
    },
    {
      capability: "Solami / mainnet tape",
      mode: modeOf(input.solamiTape ?? errUnavailable("folio.solami-tape")),
      detail: input.solamiTape
        ? detailOf(input.solamiTape)
        : "Unwired · Blur/Yellowstone or labeled RPC probe",
    },
    {
      capability: "On-chain Scaled UI (Token-2022)",
      mode: modeOf(input.scaledUi),
      detail: input.scaledUi.ok
        ? `${input.scaledUi.source}${input.solanaRpcPublicFallback ? " · public RPC fallback" : ""}`
        : detailOf(input.scaledUi),
    },
    {
      capability: "Pyth Hermes (optional bounty)",
      mode: modeOf(input.pyth),
      detail: input.pyth.ok
        ? `${input.pyth.source} · Equity.US.* entitled`
        : `${detailOf(input.pyth)} · ship path uses live Yahoo/Finnhub instead`,
    },
    {
      capability: "Equity reference (diverge)",
      mode: modeOf(input.equityRef ?? input.pyth),
      detail: input.equityRef?.ok
        ? `${input.equityRef.source} · ${input.equityRef.data.feedSymbol ?? "ref"} · ${input.equityRef.data.provider ?? "unknown"}`
        : input.equityRef
          ? detailOf(input.equityRef)
          : detailOf(input.pyth),
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
      capability: "Meteora DBC awareness (separate lane)",
      mode: modeOf(meteoraDbc),
      detail: meteoraDbc.ok
        ? `${meteoraDbc.source} · live launches · trade on Meteora with your wallet`
        : detailOf(meteoraDbc),
    },
    {
      capability: "Wash / linked-flow gate",
      mode: modeOf(input.wash),
      detail: input.wash.ok
        ? input.wash.source.includes("gecko")
          ? "GeckoTerminal free tape · signer/thin-tape heuristic"
          : input.bitqueryKeyPresent
            ? "Bitquery live · self-trade / thin-tape heuristic"
            : `${input.wash.source} · live`
        : input.bitqueryKeyPresent
          ? detailOf(input.wash)
          : `${detailOf(input.wash)} · Bitquery optional (quota) · free Gecko fallback`,
    },
    {
      capability: "Kamino xStocks market (read)",
      mode: modeOf(input.kamino),
      detail: input.kamino.ok
        ? `${input.kamino.source} · in-desk ktx deposit/borrow · user-signed (no FOLIO CPI)`
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
        ? `${input.nestusd.source} · live collateral LTV · execute on NestUSD app (no FOLIO CPI)`
        : input.nestusd.detail
          ? `${input.nestusd.reason} — ${input.nestusd.detail}`
          : "NestUSD metrics unavailable · fail-closed",
    },
    {
      capability: "Reflect stable credit (read)",
      mode: modeOf(reflect),
      detail: reflect.ok
        ? `${reflect.source} · USDC+/USDT+ earn/mint on Reflect · not NestUSD · not Nest.credit`
        : detailOf(reflect),
    },
    {
      capability: "Phantom Connect (wallet dual-path)",
      mode: modeOf(phantom),
      detail: phantom.ok
        ? `${phantom.source} · connect + sign · FOLIO session still Privy httpOnly`
        : detailOf(phantom),
    },
    {
      capability: "FOLIO treasury (Squads / Altitude)",
      mode: modeOf(squads),
      detail: squads.ok
        ? `${squads.source} · ${squads.data.note ?? "vault live"}`
        : detailOf(squads),
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
      mode: input.multiTenantKeysPresent ? "mainnet-read" : "unavailable",
      detail: input.multiTenantKeysPresent
        ? "Priority: active-tenant membership wallet → session → watch-wallet → ?inspect= · never invent a foreign pubkey"
        : "Requires Privy + Supabase memberships · until then watch-wallet / ?inspect= only",
    },
    {
      capability: "Role-gated desk prefs",
      mode: input.multiTenantKeysPresent ? "mainnet-read" : "unavailable",
      detail: input.multiTenantKeysPresent
        ? "owner/trader may write · viewer fail-closed (prefs_role_denied) · settings switches disabled"
        : "Tenant roles inactive until multi-tenant keys land · prefs non-authoritative",
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
      mode:
        treasuryReady || input.broadcastPaused === false
          ? "mainnet-read"
          : "unavailable",
      detail: treasuryReady
        ? "Squads/Altitude treasury armed (still requires explicit user confirm)"
        : input.broadcastPaused === false
          ? "User-signed Jupiter fills + Kamino ktx borrow armed · no FOLIO payer/CPI"
          : "Not funded · ≤~$1 budget · quote-only · BROADCAST_PAUSED",
    },
    {
      capability: "Custom FOLIO program deploy",
      mode: "unavailable",
      detail: "Skipped — mainnet rent exceeds ≤~$1 test budget",
    },
  ];
}
