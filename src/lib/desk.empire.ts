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
  mintFolioSession,
  parseFolioSessionCookie,
  verifyFolioSessionCookieValue,
  type FolioSession,
} from "./auth/session";
import { verifyPrivyAccessToken } from "./auth/privy";
import { resolveTenantMemberships } from "./auth/tenants";
import {
  FOLIO_WATCH_WALLET_COOKIE,
  mintWatchWalletCookie,
  verifyWatchWalletCookieValue,
} from "./auth/watch-wallet";
import { fetchWalletTokenBalances } from "./adapters/wallet-balances";
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

/** Prefer Privy-bound session wallet, else optional watch-wallet cookie. */
function resolveDisplayWallet(session: AdapterResult<FolioSession>): string | null {
  if (session.ok && session.data.walletAddress) return session.data.walletAddress;
  const watch = readWatchWallet();
  return watch.ok ? watch.data.wallet : null;
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
  walletBalances: Awaited<ReturnType<typeof fetchWalletTokenBalances>> | null;
};

export type CreditBundle = {
  kamino: Awaited<ReturnType<typeof fetchKaminoXStocksMarket>>;
  jupiterLend: Awaited<ReturnType<typeof fetchJupiterLendEarn>>;
  nestusd: Awaited<ReturnType<typeof fetchNestUsdStatus>>;
  paper: {
    label: "paper";
    collateralUsd: number | null;
    maxLtvUsed: number | null;
    illustrativeBorrowUsd: number | null;
    note: string;
  };
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
};

export const getPositionsBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<PositionsBundle> => {
    const session = readVerifiedSession();
    const auth = getAuthProviderStatus(session.ok ? session : null);
    const displayWallet = resolveDisplayWallet(session);

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
    const note = displayWallet
      ? walletBalances?.ok
        ? `Qty from mainnet wallet read (${displayWallet.slice(0, 4)}…${displayWallet.slice(-4)}). Multipliers/prices live. Watch-wallet ≠ Privy multi-tenant auth.`
        : `Wallet bound for read but balances unavailable (${walletBalances && !walletBalances.ok ? walletBalances.reason : "unknown"}) — showing paper qty. Multipliers/prices live.`
      : "Quantities are paper labels until Privy session wallet or watch-wallet bind. Multipliers/prices are live mainnet reads.";

    return {
      rows,
      note,
      auth,
      watchWallet: watch.ok ? watch.data.wallet : null,
      walletBalances,
    };
  },
);

export const getCreditBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<CreditBundle> => {
    const [kamino, jupiterLend, nestusd] = await Promise.all([
      fetchKaminoXStocksMarket(),
      fetchJupiterLendEarn(),
      fetchNestUsdStatus(),
    ]);

    let collateral: number | null = null;
    let priced = 0;
    for (const symbol of ["AAPLx", "NVDAx"] as const) {
      const [asset, multiplier] = await Promise.all([
        fetchXStockAsset(symbol),
        fetchXStockMultiplier(symbol),
      ]);
      const mint = asset.ok ? asset.data.solanaMint : null;
      const price = mint
        ? await fetchJupiterTokenPrice(mint)
        : unavailablePrice("xstock_mint_missing");
      if (multiplier.ok && price.ok) {
        const raw = paperRawFor(symbol, 0);
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

    return {
      kamino,
      jupiterLend,
      nestusd,
      paper: {
        label: "paper",
        collateralUsd: collateral,
        maxLtvUsed,
        illustrativeBorrowUsd,
        note: "Illustrative only — paper qty × live Kamino maxLtv. No borrow broadcast.",
      },
      borrowExecution: "local-fork-or-unavailable",
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
    return {
      auth,
      session,
      preferences,
      networkPolicy: {
        mainnetRead: true,
        quoteOnly: true,
        broadcast: !isBroadcastPaused(),
        customProgramDeploy: false,
      },
      watchWallet: watch.ok ? watch.data.wallet : null,
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
 * Fail-closed when keys missing or Privy rejects the token.
 */
export const createSessionFromPrivyToken = createServerFn({ method: "POST" })
  .validator(PrivySessionInput)
  .handler(async ({ data }) => {
    const identity = await verifyPrivyAccessToken(data.accessToken);
    if (!identity.ok) {
      return errResult(
        "folio.session.privy",
        identity.reason,
        identity.detail,
      );
    }
    const tenantsRes = await resolveTenantMemberships({
      userId: identity.data.userId,
    });
    const tenants = tenantsRes.ok ? tenantsRes.data : [];
    const minted = mintFolioSession({
      userId: identity.data.userId,
      walletAddress: data.walletAddress ?? identity.data.walletAddress,
      tenants,
    });
    if (!minted.ok) {
      return errResult("folio.session.privy", minted.reason, minted.detail);
    }
    setCookie(FOLIO_SESSION_COOKIE, minted.data.cookieValue, {
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
        session: minted.data.session,
        note: tenants.length
          ? `httpOnly folio_session set · ${tenants.length} tenant membership(s) resolved`
          : "httpOnly folio_session set · no tenant memberships resolved (fail-closed empty)",
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
