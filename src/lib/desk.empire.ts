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
import { fetchScaledUiOnchain } from "./adapters/scaled-ui";
import { fetchKaminoXStocksMarket } from "./adapters/kamino";
import { fetchJupiterLendEarn } from "./adapters/jupiter-lend";
import { fetchNestUsdStatus } from "./adapters/nestusd";
import { fetchRaydiumPoolsForMint } from "./adapters/pools";
import {
  FOLIO_SESSION_COOKIE,
  getAuthProviderStatus,
  loadDeskPreferences,
  parseFolioSessionCookie,
  verifyFolioSessionCookieValue,
  type FolioSession,
} from "./auth/session";
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
import { runPaperAgent } from "./agent/paper-agent";
import { paperRawFor } from "./market";
import { isBroadcastPaused } from "./broadcast";

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
  return resolveWalletBinding({
    sessionWallet: session.ok ? session.data.walletAddress : null,
    watchWallet: watch.ok ? watch.data.wallet : null,
    inspectWallet: inspectWallet ?? null,
  });
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
  borrowExecution: "local-fork-or-unavailable";
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
};

export type SessionBundle = {
  auth: ReturnType<typeof getAuthProviderStatus>;
  session: AdapterResult<FolioSession>;
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
  /** Production readiness flags — fail-closed honesty for Henry / Stocklana ops. */
  readiness: {
    bitqueryKeyPresent: boolean;
    privyConfigured: boolean;
    supabaseConfigured: boolean;
    sessionSecretPresent: boolean;
    pythApiKeyPresent: boolean;
    broadcastPaused: boolean;
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
      if (walletSource === "inspect") labels.push("inspect-ephemeral");
      if (displayWallet && walletBalances && !walletBalances.ok) {
        labels.push("wallet-read-unavailable");
      }

      let health: PositionRow["health"] = "Unavailable";
      if (multiplier.ok && asset.ok && price.ok) health = "Verified";
      else if (multiplier.ok) health = "Review";

      rows.push({
        symbol,
        name: asset.ok ? asset.data.name : symbol,
        mint,
        qty,
        paperRaw,
        qtySource,
        multiplier: mult,
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
        "Quantities are paper labels until Privy session wallet, watch-wallet bind, or ephemeral inspect. Multipliers/prices are live mainnet reads.";
    } else if (walletBalances?.ok) {
      const tag =
        walletSource === "inspect"
          ? "Ephemeral inspect (not auth / not multi-tenant)"
          : walletSource === "watch-wallet"
            ? "Watch-wallet ≠ Privy multi-tenant auth"
            : "Privy session wallet";
      note = `Qty from mainnet wallet read (${displayWallet.slice(0, 4)}…${displayWallet.slice(-4)}). Multipliers/prices live. ${tag}.`;
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

    const [kamino, jupiterLend, nestusd] = await Promise.all([
      fetchKaminoXStocksMarket(),
      fetchJupiterLendEarn(),
      fetchNestUsdStatus(),
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
      note =
        walletSource === "inspect"
          ? "Illustrative — ephemeral inspect wallet-read qty × live Kamino maxLtv. No borrow broadcast. Inspect ≠ Privy multi-tenant auth."
          : "Illustrative — wallet-read qty × live Kamino maxLtv. No borrow broadcast. Watch-wallet ≠ Privy multi-tenant auth.";
    } else if (displayWallet && walletBalances && !walletBalances.ok) {
      note = `Wallet selected but balances unavailable (${walletBalances.reason}) — paper qty × live Kamino maxLtv. No borrow broadcast.`;
    } else {
      note = "Illustrative only — paper qty × live Kamino maxLtv. No borrow broadcast.";
    }

    return {
      kamino,
      jupiterLend,
      nestusd,
      paper: {
        label,
        collateralUsd: collateral,
        maxLtvUsed,
        illustrativeBorrowUsd,
        note,
      },
      borrowExecution: "local-fork-or-unavailable",
      watchWallet: watch.ok ? watch.data.wallet : null,
      inspectWallet: inspectActive,
      walletSource,
    };
  },
);

export const getActivityBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<ActivityBundle> => {
    const symbol = "AAPLx";
    const [multiplier, asset] = await Promise.all([
      fetchXStockMultiplier(symbol),
      fetchXStockAsset(symbol),
    ]);
    const mint = asset.ok ? asset.data.solanaMint : null;
    const decimals =
      asset.ok && asset.data.decimals != null ? asset.data.decimals : 8;

    const [wash, jupiterQuote, pools, kamino] = await Promise.all([
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
    ]);

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
      {
        at: now,
        title: jupiterQuote.ok
          ? "Jupiter route inspected"
          : "Jupiter quote unavailable",
        detail: jupiterQuote.ok
          ? `out ${jupiterQuote.data.outUiAmount.toFixed(6)} · quote-only · $1 USDC`
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
          ? `${kamino.data.reserves.length} reserves · borrow CPI not broadcast`
          : kamino.reason,
        tone: kamino.ok ? "blue" : "amber",
        mode: kamino.ok ? kamino.mode : "unavailable",
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
    };
  },
);

export const getSessionBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionBundle> => {
    const session = readVerifiedSession();
    const auth = getAuthProviderStatus(session.ok ? session : null);
    const tenantId = session.ok
      ? (session.data.tenants[0]?.tenantId ?? null)
      : null;
    const userId = session.ok ? session.data.userId : null;
    const preferences = await loadDeskPreferences(tenantId, userId);
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
    return {
      auth,
      session,
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
      readiness: {
        bitqueryKeyPresent,
        privyConfigured,
        supabaseConfigured,
        sessionSecretPresent,
        pythApiKeyPresent,
        broadcastPaused: isBroadcastPaused(),
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
