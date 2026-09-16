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
import { fetchScaledUiOnchain, compareApiOnchainMultiplier } from "./adapters/scaled-ui";
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
  readiness: {
    bitqueryKeyPresent: boolean;
    privyConfigured: boolean;
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
  };
};

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
      if (onchain.ok) labels.push("onchain-scaled-ui");
      if (!displayWallet) labels.push("wallet-unbound");
      if (walletSource === "membership") labels.push("membership-wallet");
      if (walletSource === "inspect") labels.push("inspect-ephemeral");
      if (displayWallet && walletBalances && !walletBalances.ok) {
        labels.push("wallet-read-unavailable");
      }

      let health: PositionRow["health"] = "Unavailable";
      // "Verified" = wallet-read qty + live multiplier/asset/price — never paper theater.
      if (
        qtySource === "wallet-read" &&
        multiplier.ok &&
        asset.ok &&
        price.ok
      ) {
        health = "Verified";
      } else if (multiplier.ok && (asset.ok || price.ok)) {
        health = "Review"; // live marks · paper qty (or partial feeds)
      } else if (multiplier.ok) {
        health = "Review";
      }

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
        "Quantities are paper labels until membership wallet, Privy session wallet, watch-wallet bind, or ephemeral inspect. Multipliers/prices are live mainnet reads.";
    } else if (walletBalances?.ok) {
      note = `Qty from mainnet wallet read (${displayWallet.slice(0, 4)}…${displayWallet.slice(-4)}). Multipliers/prices live. ${walletSourceHonestyTag(walletSource)}.`;
    } else {
      note = `Wallet selected for read but balances unavailable (${walletBalances && !walletBalances.ok ? walletBalances.reason : "unknown"}) — showing paper qty. Multipliers/prices live.`;
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
    const sessionSecretPresent =
      (process.env["FOLIO_SESSION_SECRET"]?.trim().length ?? 0) >= 16;
    const bitqueryKeyPresent = Boolean(
      process.env["BITQUERY_API_KEY"]?.trim(),
    );
    const privyConfigured = Boolean(
      process.env["PRIVY_APP_ID"]?.trim() &&
        process.env["PRIVY_APP_SECRET"]?.trim(),
    );
    const supabaseConfigured = Boolean(
      process.env["SUPABASE_URL"]?.trim() &&
        process.env["SUPABASE_ANON_KEY"]?.trim() &&
        process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim(),
    );
    const pythApiKeyPresent = Boolean(process.env["PYTH_API_KEY"]?.trim());
    const agentRouterKeyPresent = Boolean(
      process.env["AGENTROUTER_API_KEY"]?.trim(),
    );
    const twentyFirstKeyPresent = Boolean(process.env["API_KEY_21ST"]?.trim());
    const shadersKeyPresent = Boolean(process.env["SHADERS_API_KEY"]?.trim());
    const approvedLabUi = readApprovedLabUi();
    const approvedLabShader = readApprovedLabShader();
    const jupiterKeyPresent = Boolean(process.env["JUPITER_API_KEY"]?.trim());
    const solanaRpcDedicated = Boolean(process.env["SOLANA_RPC_URL"]?.trim());
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
      sessionSecretPresent,
      agentRouterKeyPresent,
      rlsNote: deskRlsHonestyNote(),
      readiness: {
        bitqueryKeyPresent,
        privyConfigured,
        supabaseConfigured,
        sessionSecretPresent,
        pythApiKeyPresent,
        agentRouterKeyPresent,
        supabaseJwtConfigured: isSupabaseUserJwtConfigured(),
        broadcastPaused: isBroadcastPaused(),
        twentyFirstKeyPresent,
        shadersKeyPresent,
        approvedLabUi,
        approvedLabShader,
        jupiterKeyPresent,
        solanaRpcDedicated,
      },
    };
  },
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
