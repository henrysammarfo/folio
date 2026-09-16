import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { errResult, type AdapterResult } from "./adapters/types";
import { fetchXStockAsset, fetchXStockMultiplier } from "./adapters/xstocks";
import {
  fetchJupiterQuote,
  fetchJupiterTokenPrice,
  type JupiterQuote,
  type JupiterTokenPrice,
} from "./adapters/jupiter";
import { evaluateWashGate } from "./adapters/wash";
import {
  fetchScaledUiOnchain,
  compareApiOnchainMultiplier,
  type ScaledUiApiCompare,
} from "./adapters/scaled-ui";
import { positionHealth } from "./position-health";
import { fetchKaminoXStocksMarket } from "./adapters/kamino";
import { fetchJupiterLendEarn } from "./adapters/jupiter-lend";
import { fetchNestUsdStatus } from "./adapters/nestusd";
import { fetchNestCreditVaults } from "./adapters/nest-credit";
import { fetchRaydiumPoolsForMint } from "./adapters/pools";
import {
  FOLIO_SESSION_COOKIE,
  getAuthProviderStatus,
  loadDeskPreferences,
  mintFolioSession,
  parseFolioSessionCookie,
  resolveActiveTenantId,
  saveDeskPreferences,
  deskRlsHonestyNote,
  verifyFolioSessionCookieValue,
  type FolioSession,
} from "./auth/session";
import { isSupabaseUserJwtConfigured } from "./auth/supabase-user-jwt";
import { buildSessionFromPrivyToken } from "./auth/session-from-privy";
import { attachUserToDemoTenant } from "./auth/demo-tenant";
import { resolveTenantMemberships } from "./auth/tenants";
import {
  FOLIO_WATCH_WALLET_COOKIE,
  mintWatchWalletCookie,
  verifyWatchWalletCookieValue,
} from "./auth/watch-wallet";
import {
  fetchWalletTokenBalances,
  isLikelySolanaPubkey,
} from "./adapters/wallet-balances";
import {
  resolveWalletBinding,
  type WalletBindingSource,
} from "./wallet-binding";
export type { WalletBindingSource } from "./wallet-binding";
import {
  activeMembership,
  prefsWriteBlockedReason,
} from "./auth/role-gates";
import { runPaperAgent } from "./agent/paper-agent";
import { paperRawFor } from "./market";
import { isBroadcastPaused } from "./broadcast";
import { readApprovedLabShader, readApprovedLabUi } from "./lab-pick";

const WATCHLIST = ["AAPLx", "NVDAx", "TSLAx"] as const;

function unavailablePrice(reason: string): AdapterResult<JupiterTokenPrice> {
  return errResult("api.jup.ag/price/v3", reason);
}

function unavailableQuote(reason: string): AdapterResult<JupiterQuote> {
  return errResult("api.jup.ag/swap/v1/quote", reason);
}

function readVerifiedSession(): AdapterResult<FolioSession> {
  try {
    const value = getCookie(FOLIO_SESSION_COOKIE);
    return verifyFolioSessionCookieValue(value);
  } catch {
    const g = globalThis as { __FOLIO_COOKIE_HEADER__?: string };
    return parseFolioSessionCookie(g.__FOLIO_COOKIE_HEADER__ ?? null);
  }
}

function readWatchWallet(): AdapterResult<{ wallet: string }> {
  try {
    const value = getCookie(FOLIO_WATCH_WALLET_COOKIE);
    return verifyWatchWalletCookieValue(value);
  } catch {
    const g = globalThis as { __FOLIO_WATCH_WALLET_COOKIE__?: string };
    return verifyWatchWalletCookieValue(g.__FOLIO_WATCH_WALLET_COOKIE__ ?? null);
  }
}

function resolveDisplayWallet(
  session: AdapterResult<FolioSession>,
  inspectWallet?: string | null,
): { wallet: string | null; source: WalletBindingSource } {
  const watch = readWatchWallet();
  const membership = session.ok ? activeMembership(session.data) : null;
  return resolveWalletBinding({
    membershipWallet: membership?.walletAddress ?? null,
    sessionWallet: session.ok ? session.data.walletAddress : null,
    watchWallet: watch.ok ? watch.data.wallet : null,
    inspectWallet: inspectWallet ?? null,
  });
}

function walletSourceHonestyTag(source: WalletBindingSource): string {
  switch (source) {
    case "membership":
      return "Active-tenant membership wallet (tenant-scoped)";
    case "session":
      return "Privy session wallet";
    case "watch-wallet":
      return "Watch-wallet ≠ Privy multi-tenant auth";
    case "inspect":
      return "Ephemeral inspect (not auth / not multi-tenant)";
    default:
      return "No wallet bound";
  }
}

export type PositionRow = {
  symbol: string;
  name: string;
  mint: string | null;
  /** Display qty: wallet UI amount when bound, else paper. */
  qty: number;
  paperRaw: number;
  qtySource: "wallet-read" | "paper";
  multiplier: number | null;
  /** Live xStocks newMultiplier when a CA is pending — null means none on feed. */
  pendingMultiplier: number | null;
  onchainEffectiveMultiplier: number | null;
  /** API ↔ on-chain Scaled UI — never invents a match when either side is off. */
  scaledUiCompare: ScaledUiApiCompare;
  economicShares: number | null;
  usdPrice: number | null;
  paperValueUsd: number | null;
  health: "Verified" | "Review" | "Unavailable";
  labels: string[];
};

export type PositionsBundle = {
  rows: PositionRow[];
  note: string;
  auth: ReturnType<typeof getAuthProviderStatus>;
  watchWallet: string | null;
  /** Ephemeral ?inspect= pubkey — mainnet-read only, not a session. */
  inspectWallet: string | null;
  walletSource: WalletBindingSource;
  walletBalances: Awaited<ReturnType<typeof fetchWalletTokenBalances>> | null;
};

export type CreditBundle = {
  kamino: Awaited<ReturnType<typeof fetchKaminoXStocksMarket>>;
  jupiterLend: Awaited<ReturnType<typeof fetchJupiterLendEarn>>;
  nestusd: Awaited<ReturnType<typeof fetchNestUsdStatus>>;
  /** Nest.credit vault awareness — not NestUSD borrow capacity. */
  nestCredit: Awaited<ReturnType<typeof fetchNestCreditVaults>>;
  paper: {
    /** Qty basis for collateral math — wallet-read when bound, else paper. */
    label: "paper" | "wallet-read";
    collateralUsd: number | null;
    maxLtvUsed: number | null;
    illustrativeBorrowUsd: number | null;
    note: string;
  };
  watchWallet: string | null;
  /** Ephemeral inspect pubkey when no session/watch-wallet bound. */
  inspectWallet: string | null;
  walletSource: WalletBindingSource;
  /** Honest label — no local fork harness shipped; borrow stays off until funded. */
  borrowExecution: "unavailable-until-funded";
};

export type ActivityEvent = {
  at: string;
  title: string;
  detail: string;
  tone: "green" | "blue" | "amber" | "neutral";
  mode: string;
};

export type ActivityBundle = {
  events: ActivityEvent[];
  note: string;
  /**
   * Corporate-action alert preference from active-tenant prefs when session exists.
   * Live CA signal today = xStocks multiplier — no separate calendar feed yet.
   */
  corporateActionAlerts: boolean | null;
  prefsFromSession: boolean;
};

export type SessionBundle = {
  auth: ReturnType<typeof getAuthProviderStatus>;
  session: AdapterResult<FolioSession>;
  /** Membership-validated active tenant — null when session missing/empty. */
  activeTenantId: string | null;
  preferences: Awaited<ReturnType<typeof loadDeskPreferences>>;
  networkPolicy: {
    mainnetRead: true;
    quoteOnly: true;
    broadcast: boolean;
    customProgramDeploy: false;
  };
  watchWallet: string | null;
  /** FOLIO_SESSION_SECRET ≥16 — watch-wallet bind + cookie signing (not Privy). */
  sessionSecretPresent: boolean;
  /** AGENTROUTER_API_KEY present — NL expansion optional; live spine always runs. */
  agentRouterKeyPresent: boolean;
  /**
   * RLS honesty: user-JWT (sub=Privy DID) when SUPABASE_JWT_SECRET set;
   * otherwise labeled service-role fallback (anon policies not live authz).
   */
  rlsNote: string;
  /** Production readiness flags — fail-closed honesty for Henry / Stocklana ops. */
  readiness: EmpireReadiness;
};

/** Env presence flags only — no invented greens. Shared by Settings + Netro. */
export type EmpireReadiness = {
  bitqueryKeyPresent: boolean;
  privyConfigured: boolean;
  /** Public Privy app id for client PrivyProvider (never the secret). */
  privyAppId: string | null;
  supabaseConfigured: boolean;
  sessionSecretPresent: boolean;
  pythApiKeyPresent: boolean;
  agentRouterKeyPresent: boolean;
  /** SUPABASE_JWT_SECRET + anon + URL — user-JWT RLS path armed. */
  supabaseJwtConfigured: boolean;
  broadcastPaused: boolean;
  /** Lab only — 21st.dev MCP catalog (approve gate). */
  twentyFirstKeyPresent: boolean;
  /** Lab only — shaders.com probe (often Clerk-gated). */
  shadersKeyPresent: boolean;
  /** Production desk chrome after Henry chat approve (FOLIO_APPROVED_LAB_UI). */
  approvedLabUi: string | null;
  /** Production desk shader after Henry chat approve (FOLIO_APPROVED_LAB_SHADER). */
  approvedLabShader: string | null;
  /** Optional Jupiter auth header — public path works without it. */
  jupiterKeyPresent: boolean;
  /** Dedicated SOLANA_RPC_URL (false = labeled public RPC fallback · B004). */
  solanaRpcDedicated: boolean;
  /**
   * tenants / tenant_members / desk_preferences reachable via service-role.
   * False when keys missing, migration not applied (PGRST205), or GRANTs missing (42501).
   */
  supabaseSchemaReady: boolean;
  /** Honest probe detail for Settings (never invents ready). */
  supabaseSchemaDetail: string;
};

export function readEmpireReadiness(
  env: NodeJS.ProcessEnv = process.env,
): EmpireReadiness {
  const sessionSecretPresent = (env["FOLIO_SESSION_SECRET"]?.trim().length ?? 0) >= 16;
  const privyAppId = env["PRIVY_APP_ID"]?.trim() || null;
  return {
    bitqueryKeyPresent: Boolean(env["BITQUERY_API_KEY"]?.trim()),
    privyConfigured: Boolean(privyAppId && env["PRIVY_APP_SECRET"]?.trim()),
    privyAppId,
    supabaseConfigured: Boolean(
      env["SUPABASE_URL"]?.trim() &&
        env["SUPABASE_ANON_KEY"]?.trim() &&
        env["SUPABASE_SERVICE_ROLE_KEY"]?.trim(),
    ),
    sessionSecretPresent,
    pythApiKeyPresent: Boolean(env["PYTH_API_KEY"]?.trim()),
    agentRouterKeyPresent: Boolean(env["AGENTROUTER_API_KEY"]?.trim()),
    supabaseJwtConfigured: isSupabaseUserJwtConfigured(env),
    broadcastPaused: isBroadcastPaused(env),
    twentyFirstKeyPresent: Boolean(env["API_KEY_21ST"]?.trim()),
    shadersKeyPresent: Boolean(env["SHADERS_API_KEY"]?.trim()),
    approvedLabUi: readApprovedLabUi(env),
    approvedLabShader: readApprovedLabShader(env),
    jupiterKeyPresent: Boolean(env["JUPITER_API_KEY"]?.trim()),
    solanaRpcDedicated: Boolean(env["SOLANA_RPC_URL"]?.trim()),
    /** Sync path defaults false — enrich via loadEmpireReadiness. */
    supabaseSchemaReady: false,
    supabaseSchemaDetail: "Not probed",
  };
}

/** Live PostgREST probe — never invents schema greens. */
export async function probeSupabaseSchemaReady(
  env: NodeJS.ProcessEnv = process.env,
): Promise<boolean> {
  const url = env["SUPABASE_URL"]?.trim()?.replace(/\/$/, "");
  const key = env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/rest/v1/tenants?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Honest detail for Settings — distinguishes missing tables vs missing GRANTs. */
export async function probeSupabaseSchemaDetail(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ ready: boolean; detail: string }> {
  const url = env["SUPABASE_URL"]?.trim()?.replace(/\/$/, "");
  const key = env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !key) {
    return { ready: false, detail: "Blocked · Supabase keys first" };
  }
  try {
    const res = await fetch(`${url}/rest/v1/tenants?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      return { ready: true, detail: "Ready · tenants / tenant_members reachable" };
    }
    const body = await res.text().catch(() => "");
    if (res.status === 404 || /PGRST205/i.test(body)) {
      return {
        ready: false,
        detail: "Missing · run 20260915_folio_tenants.sql (PGRST205)",
      };
    }
    if (res.status === 403 || /42501|permission denied|GRANT SELECT/i.test(body)) {
      return {
        ready: false,
        detail:
          "Tables exist · run 20260916_folio_tenants_grants.sql (service_role 42501)",
      };
    }
    return {
      ready: false,
      detail: `Probe HTTP ${res.status} · fail-closed`,
    };
  } catch (e) {
    return { ready: false, detail: `Probe failed · ${String(e).slice(0, 80)}` };
  }
}

export async function loadEmpireReadiness(
  env: NodeJS.ProcessEnv = process.env,
): Promise<EmpireReadiness> {
  const base = readEmpireReadiness(env);
  if (!base.supabaseConfigured) {
    return {
      ...base,
      supabaseSchemaDetail: "Blocked · Supabase keys first",
    };
  }
  const probe = await probeSupabaseSchemaDetail(env);
  return {
    ...base,
    supabaseSchemaReady: probe.ready,
    supabaseSchemaDetail: probe.detail,
  };
}

const InspectWalletInput = z
  .object({
    /** Optional ephemeral mainnet-read inspect pubkey (no cookie / not auth). */
    inspectWallet: z.string().max(64).optional(),
  })
  .default({});

export const getPositionsBundle = createServerFn({ method: "GET" })
  .validator(InspectWalletInput)
  .handler(async ({ data }): Promise<PositionsBundle> => {
    const session = readVerifiedSession();
    const auth = getAuthProviderStatus(session.ok ? session : null);
    const { wallet: displayWallet, source: walletSource } = resolveDisplayWallet(
      session,
      data.inspectWallet,
    );

    const assets = await Promise.all(
      WATCHLIST.map(async (symbol) => {
        const [asset, multiplier] = await Promise.all([
          fetchXStockAsset(symbol),
          fetchXStockMultiplier(symbol),
        ]);
        return { symbol, asset, multiplier };
      }),
    );
    const mints = assets
      .map((a) => (a.asset.ok ? a.asset.data.solanaMint : null))
      .filter((m): m is string => Boolean(m));

    const walletBalances = displayWallet
      ? await fetchWalletTokenBalances({ wallet: displayWallet, mints })
      : null;

    const rows: PositionRow[] = [];
    for (const { symbol, asset, multiplier } of assets) {
      const paperRaw = paperRawFor(symbol);
      const mint = asset.ok ? asset.data.solanaMint : null;
      const [price, onchain] = await Promise.all([
        mint
          ? fetchJupiterTokenPrice(mint)
          : Promise.resolve(unavailablePrice("xstock_mint_missing")),
        mint
          ? fetchScaledUiOnchain(mint)
          : Promise.resolve(errResult("solana-rpc.scaled-ui", "mint_missing")),
      ]);

      const walletUi =
        mint && walletBalances?.ok
          ? walletBalances.data.byMint[mint]?.uiAmount
          : undefined;
      const qtySource: PositionRow["qtySource"] =
        walletUi != null && Number.isFinite(walletUi) ? "wallet-read" : "paper";
      const qty = qtySource === "wallet-read" ? (walletUi as number) : paperRaw;

      const mult = multiplier.ok ? multiplier.data.currentMultiplier : null;
      const onchainEff = onchain.ok ? onchain.data.effectiveMultiplier : null;
      const scaledUiCompare = compareApiOnchainMultiplier(mult, onchainEff);
      const economicShares = mult != null ? qty * mult : null;
      const usdPrice = price.ok ? price.data.usdPrice : null;
      const paperValueUsd =
        economicShares != null && usdPrice != null
          ? economicShares * usdPrice
          : null;

      const labels = [
        qtySource === "wallet-read" ? "wallet-read-qty" : "paper-qty",
        "mainnet-read-multiplier",
      ];
      if (scaledUiCompare.status === "match") labels.push("onchain-scaled-ui-match");
      else if (scaledUiCompare.status === "mismatch")
        labels.push("onchain-scaled-ui-mismatch");
      else labels.push("onchain-scaled-ui-off");
      if (!displayWallet) labels.push("wallet-unbound");
      if (walletSource === "membership") labels.push("membership-wallet");
      if (walletSource === "inspect") labels.push("inspect-ephemeral");
      if (displayWallet && walletBalances && !walletBalances.ok) {
        labels.push("wallet-read-unavailable");
      }

      // Verified = wallet-read + live feeds + API↔on-chain Scaled UI match.
      const health = positionHealth({
        qtySource,
        multiplierOk: multiplier.ok,
        assetOk: asset.ok,
        priceOk: price.ok,
        scaledUiStatus: scaledUiCompare.status,
      });

      rows.push({
        symbol,
        name: asset.ok ? asset.data.name : symbol,
        mint,
        qty,
        paperRaw,
        qtySource,
        multiplier: mult,
        pendingMultiplier: multiplier.ok
          ? multiplier.data.pendingMultiplier
          : null,
        onchainEffectiveMultiplier: onchainEff,
        scaledUiCompare,
        economicShares,
        usdPrice,
        paperValueUsd,
        health,
        labels,
      });
    }

    const watch = readWatchWallet();
    const inspectActive = walletSource === "inspect" ? displayWallet : null;
    let note: string;
    if (!displayWallet) {
      note =
        "Quantities are paper labels until membership wallet, Privy session wallet, watch-wallet bind, or ephemeral inspect. Multipliers are live API reads compared to on-chain Scaled UI — Wallet-verified requires a match.";
    } else if (walletBalances?.ok) {
      note = `Qty from mainnet wallet read (${displayWallet.slice(0, 4)}…${displayWallet.slice(-4)}). API ↔ on-chain Scaled UI labeled per row. ${walletSourceHonestyTag(walletSource)}.`;
    } else {
      note = `Wallet selected for read but balances unavailable (${walletBalances && !walletBalances.ok ? walletBalances.reason : "unknown"}) — showing paper qty. API ↔ on-chain Scaled UI still labeled.`;
    }

    return {
      rows,
      note,
      auth,
      watchWallet: watch.ok ? watch.data.wallet : null,
      inspectWallet: inspectActive,
      walletSource,
      walletBalances,
    };
  },
);

export const getCreditBundle = createServerFn({ method: "GET" })
  .validator(InspectWalletInput)
  .handler(async ({ data }): Promise<CreditBundle> => {
    const session = readVerifiedSession();
    const { wallet: displayWallet, source: walletSource } = resolveDisplayWallet(
      session,
      data.inspectWallet,
    );
    const watch = readWatchWallet();

    const [kamino, jupiterLend, nestusd, nestCredit] = await Promise.all([
      fetchKaminoXStocksMarket(),
      fetchJupiterLendEarn(),
      fetchNestUsdStatus(),
      fetchNestCreditVaults(),
    ]);

    const creditSymbols = ["AAPLx", "NVDAx"] as const;
    const assets = await Promise.all(
      creditSymbols.map(async (symbol) => {
        const [asset, multiplier] = await Promise.all([
          fetchXStockAsset(symbol),
          fetchXStockMultiplier(symbol),
        ]);
        return { symbol, asset, multiplier };
      }),
    );
    const mints = assets
      .map((a) => (a.asset.ok ? a.asset.data.solanaMint : null))
      .filter((m): m is string => Boolean(m));

    const walletBalances = displayWallet
      ? await fetchWalletTokenBalances({ wallet: displayWallet, mints })
      : null;

    let collateral: number | null = null;
    let priced = 0;
    let usedWalletQty = false;
    for (const { symbol, asset, multiplier } of assets) {
      const mint = asset.ok ? asset.data.solanaMint : null;
      const price = mint
        ? await fetchJupiterTokenPrice(mint)
        : unavailablePrice("xstock_mint_missing");
      if (multiplier.ok && price.ok) {
        const paperRaw = paperRawFor(symbol, 0);
        const walletUi =
          mint && walletBalances?.ok
            ? walletBalances.data.byMint[mint]?.uiAmount
            : undefined;
        const useWallet =
          walletUi != null && Number.isFinite(walletUi) && walletUi > 0;
        const raw = useWallet ? (walletUi as number) : paperRaw;
        if (useWallet) usedWalletQty = true;
        collateral =
          (collateral ?? 0) +
          raw * multiplier.data.currentMultiplier * price.data.usdPrice;
        priced += 1;
      }
    }
    if (priced === 0) collateral = null;

    const aaplReserve = kamino.ok
      ? kamino.data.reserves.find((r) => r.symbol === "AAPLx")
      : undefined;
    const maxLtvUsed = aaplReserve?.maxLtv ?? null;
    const illustrativeBorrowUsd =
      collateral != null && maxLtvUsed != null
        ? collateral * maxLtvUsed
        : null;

    const label = usedWalletQty ? ("wallet-read" as const) : ("paper" as const);
    const inspectActive = walletSource === "inspect" ? displayWallet : null;
    let note: string;
    if (usedWalletQty) {
      note = `Illustrative — wallet-read qty × live Kamino maxLtv. No borrow broadcast. ${walletSourceHonestyTag(walletSource)}.`;
    } else if (displayWallet && walletBalances && !walletBalances.ok) {
      note = `Wallet selected but balances unavailable (${walletBalances.reason}) — paper qty × live Kamino maxLtv. No borrow broadcast.`;
    } else {
      note = "Illustrative only — paper qty × live Kamino maxLtv. No borrow broadcast.";
    }

    return {
      kamino,
      jupiterLend,
      nestusd,
      nestCredit,
      paper: {
        label,
        collateralUsd: collateral,
        maxLtvUsed,
        illustrativeBorrowUsd,
        note,
      },
      borrowExecution: "unavailable-until-funded",
      watchWallet: watch.ok ? watch.data.wallet : null,
      inspectWallet: inspectActive,
      walletSource,
    };
  },
);

export const getActivityBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<ActivityBundle> => {
    const symbol = "AAPLx";
    const session = readVerifiedSession();
    const activeTenantId = session.ok
      ? resolveActiveTenantId(session.data)
      : null;
    const prefs = session.ok
      ? await loadDeskPreferences(activeTenantId, session.data.userId)
      : null;
    const prefsFromSession = Boolean(prefs?.ok);
    const corporateActionAlerts = prefs?.ok
      ? prefs.data.corporateActionAlerts
      : null;

    const [multiplier, asset] = await Promise.all([
      fetchXStockMultiplier(symbol),
      fetchXStockAsset(symbol),
    ]);
    const mint = asset.ok ? asset.data.solanaMint : null;
    const decimals =
      asset.ok && asset.data.decimals != null ? asset.data.decimals : 8;

    const [wash, jupiterQuote, pools, kamino, nestCredit, nestusd, scaledUi] = await Promise.all([
      evaluateWashGate({ symbol, mint, notionalUsd: 1 }),
      mint
        ? fetchJupiterQuote({
            outputMint: mint,
            amountRaw: 1_000_000,
            outputDecimals: decimals,
          })
        : Promise.resolve(unavailableQuote("mint_missing")),
      mint
        ? fetchRaydiumPoolsForMint(mint)
        : Promise.resolve(errResult("api-v3.raydium.io", "mint_missing")),
      fetchKaminoXStocksMarket(),
      fetchNestCreditVaults(),
      fetchNestUsdStatus(),
      mint
        ? fetchScaledUiOnchain(mint)
        : Promise.resolve(errResult("solana-rpc.scaled-ui", "mint_missing")),
    ]);

    const jupiterCacheLabel = jupiterQuote.ok
      ? jupiterQuote.source.includes("stale")
        ? "stale-cache"
        : jupiterQuote.source.includes("cached")
          ? "cached"
          : "live"
      : null;

    const now = new Date().toISOString();
    const events: ActivityEvent[] = [
      {
        at: now,
        title: multiplier.ok
          ? `${symbol} multiplier ${multiplier.data.currentMultiplier.toFixed(6)}×`
          : `${symbol} multiplier unavailable`,
        detail: multiplier.ok ? multiplier.source : multiplier.reason,
        tone: multiplier.ok ? "green" : "amber",
        mode: multiplier.ok ? multiplier.mode : "unavailable",
      },
      (() => {
        const compare = compareApiOnchainMultiplier(
          multiplier.ok ? multiplier.data.currentMultiplier : null,
          scaledUi.ok ? scaledUi.data.effectiveMultiplier : null,
        );
        return {
          at: now,
          title:
            compare.status === "match"
              ? `On-chain Scaled UI match · ${compare.onchainEffective?.toFixed(6)}×`
              : compare.status === "mismatch"
                ? `On-chain Scaled UI mismatch · ${compare.deltaBps?.toFixed(1)} bps`
                : "On-chain Scaled UI unavailable",
          detail: compare.note,
          tone:
            compare.status === "match"
              ? ("green" as const)
              : compare.status === "mismatch"
                ? ("amber" as const)
                : ("neutral" as const),
          mode: scaledUi.ok ? scaledUi.mode : ("unavailable" as const),
        };
      })(),
      {
        at: now,
        title:
          multiplier.ok && multiplier.data.pendingMultiplier != null
            ? `Corporate action pending · ${multiplier.data.pendingMultiplier.toFixed(6)}×`
            : multiplier.ok
              ? "Corporate action · no pending multiplier"
              : "Corporate action · multiplier unavailable",
        detail: multiplier.ok
          ? multiplier.data.pendingMultiplier != null
            ? `Live xStocks pending · activation ${
                multiplier.data.activationDateTime
                  ? new Date(multiplier.data.activationDateTime * 1000).toISOString()
                  : "n/a"
              } · reason ${multiplier.data.reason ?? "none"}`
            : `Current ${multiplier.data.currentMultiplier.toFixed(6)}× · reason ${multiplier.data.reason ?? "none"} · no separate CA calendar feed`
          : "Cannot label CA pending without live multiplier",
        tone:
          multiplier.ok && multiplier.data.pendingMultiplier != null ? "amber" : "neutral",
        mode: multiplier.ok ? multiplier.mode : "unavailable",
      },
      {
        at: now,
        title: prefsFromSession
          ? corporateActionAlerts
            ? "Corporate-action alerts · on"
            : "Corporate-action alerts · off"
          : "Corporate-action alerts · no session prefs",
        detail: prefsFromSession
          ? "Preference only — live CA signal = xStocks multiplier pending/current (above)."
          : "Mint httpOnly session (Privy + Supabase) to persist CA alert preference per active tenant.",
        tone: prefsFromSession && corporateActionAlerts ? "blue" : "neutral",
        /** Pref ≠ mainnet feed — paper until session prefs backed by live CA calendar (none). */
        mode: prefsFromSession ? "paper" : "unavailable",
      },
      {
        at: now,
        title: jupiterQuote.ok
          ? `Jupiter route inspected · ${jupiterCacheLabel}`
          : "Jupiter quote unavailable",
        detail: jupiterQuote.ok
          ? `out ${jupiterQuote.data.outUiAmount.toFixed(6)} · quote-only · $1 USDC · ${jupiterCacheLabel}`
          : jupiterQuote.reason,
        tone: jupiterQuote.ok ? "blue" : "amber",
        mode: jupiterQuote.ok ? jupiterQuote.mode : "unavailable",
      },
      {
        at: now,
        title: wash.ok && wash.data.pass ? "Wash clear" : "Wash fail-closed",
        detail: wash.ok
          ? `${wash.data.pressure} · n=${wash.data.sampleSize} · ${wash.data.notes.join("; ") || "pass"}`
          : wash.reason,
        tone: wash.ok && wash.data.pass ? "green" : "amber",
        mode: wash.ok ? wash.mode : "unavailable",
      },
      {
        at: now,
        title: kamino.ok
          ? "Kamino xStocks market read"
          : "Kamino read unavailable",
        detail: kamino.ok
          ? `${kamino.data.reserves.length} reserves · borrow CPI unavailable (no broadcast)`
          : kamino.reason,
        tone: kamino.ok ? "blue" : "amber",
        mode: kamino.ok ? kamino.mode : "unavailable",
      },
      {
        at: now,
        title: nestCredit.ok
          ? "Nest.credit vault awareness"
          : "Nest.credit unavailable",
        detail: nestCredit.ok
          ? `${nestCredit.data.vaultCount} vaults · ${nestCredit.data.solanaOftCount} Solana OFT · not NestUSD borrow`
          : nestCredit.reason,
        tone: nestCredit.ok ? "blue" : "amber",
        mode: nestCredit.ok ? nestCredit.mode : "unavailable",
      },
      {
        at: now,
        title: "NestUSD borrow capacity",
        detail: nestusd.ok
          ? "Unexpected NestUSD ok — still risk-labeled"
          : `${nestusd.reason} — fail-closed (≠ Nest.credit)`,
        tone: "amber",
        mode: "unavailable",
      },
      {
        at: now,
        title: pools.ok
          ? `Raydium pools for ${symbol}`
          : "Pool awareness unavailable",
        detail: pools.ok
          ? `${pools.data.raydium.length} pools observed`
          : pools.reason,
        tone: pools.ok ? "neutral" : "amber",
        mode: pools.ok ? pools.mode : "unavailable",
      },
    ];

    return {
      events,
      note: "Live-derived activity — not a fabricated ledger. Broadcast remains disabled.",
      corporateActionAlerts,
      prefsFromSession,
    };
  },
);

export const getSessionBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionBundle> => {
    const session = readVerifiedSession();
    const auth = getAuthProviderStatus(session.ok ? session : null);
    const activeTenantId = session.ok
      ? resolveActiveTenantId(session.data)
      : null;
    const userId = session.ok ? session.data.userId : null;
    const preferences = await loadDeskPreferences(activeTenantId, userId);
    const watch = readWatchWallet();
    const readiness = await loadEmpireReadiness();
    return {
      auth,
      session,
      activeTenantId,
      preferences,
      networkPolicy: {
        mainnetRead: true,
        quoteOnly: true,
        // Unfunded · ≤~$1 — never report Enabled just because BROADCAST_PAUSED=false.
        broadcast: false,
        customProgramDeploy: false,
      },
      watchWallet: watch.ok ? watch.data.wallet : null,
      sessionSecretPresent: readiness.sessionSecretPresent,
      agentRouterKeyPresent: readiness.agentRouterKeyPresent,
      rlsNote: deskRlsHonestyNote(),
      readiness,
    };
  },
);

/** Empire key flags + optional Supabase schema probe — never invents greens. */
export const getEmpireReadiness = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmpireReadiness> => loadEmpireReadiness(),
);

const AgentInput = z.object({
  prompt: z.string().min(1).max(500),
});

export const runDeskAgent = createServerFn({ method: "POST" })
  .validator(AgentInput)
  .handler(async ({ data }) => runPaperAgent(data.prompt));

const PrefsInput = z.object({
  corporateActionAlerts: z.boolean(),
  strictFailClosed: z.boolean(),
});

/** Persist desk prefs for the active tenant — owner/trader only; viewers fail-closed. */
export const updateDeskPreferences = createServerFn({ method: "POST" })
  .validator(PrefsInput)
  .handler(async ({ data }) => {
    const session = readVerifiedSession();
    if (!session.ok) {
      return errResult(
        "folio.prefs.save",
        "prefs_require_session",
        session.detail ?? session.reason,
      );
    }
    const membership = activeMembership(session.data);
    const roleBlock = prefsWriteBlockedReason(membership);
    if (roleBlock) {
      return errResult("folio.prefs.save", "prefs_role_denied", roleBlock);
    }
    const tenantId = resolveActiveTenantId(session.data);
    return saveDeskPreferences(tenantId, session.data.userId, {
      corporateActionAlerts: data.corporateActionAlerts,
      strictFailClosed: data.strictFailClosed,
    });
  });

const ActiveTenantInput = z.object({
  tenantId: z.string().uuid(),
});

/**
 * Switch active tenant on the httpOnly folio_session — membership-validated.
 * Remints the signed cookie; never invents a tenant outside session.tenants.
 */
export const setActiveTenant = createServerFn({ method: "POST" })
  .validator(ActiveTenantInput)
  .handler(async ({ data }) => {
    const session = readVerifiedSession();
    if (!session.ok) {
      return errResult(
        "folio.session.active_tenant",
        "active_tenant_requires_session",
        session.detail ?? session.reason,
      );
    }
    const membership = session.data.tenants.find(
      (t) => t.tenantId === data.tenantId,
    );
    if (!membership) {
      return errResult(
        "folio.session.active_tenant",
        "active_tenant_not_member",
        "Tenant id is not on this session — refusing invent-a-membership switch.",
      );
    }
    const remainingMs = Date.parse(session.data.expiresAt) - Date.now();
    const ttlSec = Math.max(60, Math.floor(remainingMs / 1000));
    const minted = mintFolioSession({
      userId: session.data.userId,
      walletAddress: session.data.walletAddress,
      tenants: session.data.tenants,
      activeTenantId: data.tenantId,
      ttlSec,
    });
    if (!minted.ok) {
      return errResult(
        "folio.session.active_tenant",
        minted.reason,
        minted.detail,
      );
    }
    setCookie(FOLIO_SESSION_COOKIE, minted.data.cookieValue, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: ttlSec,
      secure: process.env["NODE_ENV"] === "production",
    });
    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      asOf: new Date().toISOString(),
      source: "folio.session.active_tenant",
      data: {
        activeTenantId: data.tenantId,
        session: minted.data.session,
        note: `Active tenant set to ${membership.slug ?? membership.displayName ?? data.tenantId.slice(0, 8)}…`,
      },
    };
  });

const PrivySessionInput = z.object({
  accessToken: z.string().min(1).max(8_192),
  walletAddress: z.string().max(128).optional(),
});

/**
 * Exchange a Privy access token for an httpOnly folio_session cookie.
 * Fail-closed when keys missing, Privy rejects, or tenant lookup fails
 * (never mint with invented empty tenants on lookup error).
 */
export const createSessionFromPrivyToken = createServerFn({ method: "POST" })
  .validator(PrivySessionInput)
  .handler(async ({ data }) => {
    const built = await buildSessionFromPrivyToken({
      accessToken: data.accessToken,
      walletAddress: data.walletAddress ?? null,
    });
    if (!built.ok) {
      return errResult("folio.session.privy", built.reason, built.detail);
    }
    setCookie(FOLIO_SESSION_COOKIE, built.data.cookieValue, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
      secure: process.env["NODE_ENV"] === "production",
    });
    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      asOf: new Date().toISOString(),
      source: "folio.session.privy",
      data: {
        session: built.data.session,
        note: built.data.note,
      },
    };
  });

export const clearFolioSession = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      deleteCookie(FOLIO_SESSION_COOKIE, { path: "/" });
      return {
        ok: true as const,
        mode: "mainnet-read" as const,
        asOf: new Date().toISOString(),
        source: "folio.session.clear",
        data: {
          cleared: true as const,
          note: "httpOnly folio_session cleared — no localStorage residue.",
        },
      };
    } catch (e) {
      return errResult("folio.session.clear", "clear_failed", String(e));
    }
  },
);

/**
 * Attach current httpOnly session user to folio-demo as owner (service-role).
 * Then remint cookie so tenant memberships appear on the session.
 */
export const attachDemoTenantMembership = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = readVerifiedSession();
    if (!session.ok) {
      return errResult(
        "folio.demo-tenant.attach",
        "attach_requires_session",
        "Mint httpOnly folio_session with a Privy access token first.",
      );
    }
    const attached = await attachUserToDemoTenant({
      userId: session.data.userId,
      walletAddress: session.data.walletAddress,
    });
    if (!attached.ok) {
      return errResult(
        "folio.demo-tenant.attach",
        attached.reason,
        attached.detail,
      );
    }

    const memberships = await resolveTenantMemberships({
      userId: session.data.userId,
    });
    const tenants = memberships.ok ? memberships.data : session.data.tenants;
    const remainingMs = Date.parse(session.data.expiresAt) - Date.now();
    const ttlSec = Math.max(60, Math.floor(remainingMs / 1000));
    const minted = mintFolioSession({
      userId: session.data.userId,
      walletAddress: session.data.walletAddress,
      tenants,
      activeTenantId: attached.data.tenantId,
      ttlSec,
    });
    if (!minted.ok) {
      return errResult(
        "folio.demo-tenant.attach",
        minted.reason,
        `${attached.data.note} · remint failed: ${minted.detail ?? minted.reason}`,
      );
    }
    setCookie(FOLIO_SESSION_COOKIE, minted.data.cookieValue, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: ttlSec,
      secure: process.env["NODE_ENV"] === "production",
    });
    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      asOf: new Date().toISOString(),
      source: "folio.demo-tenant.attach",
      data: {
        ...attached.data,
        session: minted.data.session,
        note: `${attached.data.note} · cookie reminted with ${tenants.length} membership(s)`,
      },
    };
  },
);

const WatchWalletInput = z.object({
  wallet: z.string().min(32).max(64),
});

/**
 * Bind an optional httpOnly watch-wallet for mainnet-read position qty.
 * Requires FOLIO_SESSION_SECRET only — NOT Privy multi-tenant auth.
 */
export const bindWatchWallet = createServerFn({ method: "POST" })
  .validator(WatchWalletInput)
  .handler(async ({ data }) => {
    const minted = mintWatchWalletCookie(data.wallet);
    if (!minted.ok) {
      return errResult(
        "folio.watch-wallet.bind",
        minted.reason,
        minted.detail,
      );
    }
    setCookie(FOLIO_WATCH_WALLET_COOKIE, minted.data.cookieValue, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env["NODE_ENV"] === "production",
    });
    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      asOf: new Date().toISOString(),
      source: "folio.watch-wallet.bind",
      data: {
        wallet: minted.data.wallet,
        note: "Watch-wallet bound for mainnet-read qty. Not a Privy session.",
      },
    };
  });

export const clearWatchWallet = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      deleteCookie(FOLIO_WATCH_WALLET_COOKIE, { path: "/" });
      return {
        ok: true as const,
        mode: "mainnet-read" as const,
        asOf: new Date().toISOString(),
        source: "folio.watch-wallet.clear",
        data: {
          cleared: true as const,
          note: "Watch-wallet cookie cleared.",
        },
      };
    } catch (e) {
      return errResult("folio.watch-wallet.clear", "clear_failed", String(e));
    }
  },
);
