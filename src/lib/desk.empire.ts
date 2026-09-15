import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { errResult, okResult, type AdapterResult } from "./adapters/types";
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
  getAuthProviderStatus,
  loadDeskPreferences,
  mintFolioSession,
  parseFolioSessionCookie,
  type FolioSession,
} from "./auth/session";
import { verifyPrivyAccessToken } from "./auth/privy";
import { runPaperAgent } from "./agent/paper-agent";
import { paperRawFor } from "./market";

const WATCHLIST = ["AAPLx", "NVDAx", "TSLAx"] as const;

function unavailablePrice(reason: string): AdapterResult<JupiterTokenPrice> {
  return errResult("api.jup.ag/price/v3", reason);
}

function unavailableQuote(reason: string): AdapterResult<JupiterQuote> {
  return errResult("api.jup.ag/swap/v1/quote", reason);
}

function readCookieHeader(): string | null {
  try {
    // Optional harness for tests / future request binding.
    const g = globalThis as { __FOLIO_COOKIE_HEADER__?: string };
    return g.__FOLIO_COOKIE_HEADER__ ?? null;
  } catch {
    return null;
  }
}

export type PositionRow = {
  symbol: string;
  name: string;
  mint: string | null;
  paperRaw: number;
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
    broadcast: false;
    customProgramDeploy: false;
  };
};

export const getPositionsBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<PositionsBundle> => {
    const auth = getAuthProviderStatus();
    const rows: PositionRow[] = [];

    for (const symbol of WATCHLIST) {
      const paperRaw = paperRawFor(symbol);
      const [asset, multiplier] = await Promise.all([
        fetchXStockAsset(symbol),
        fetchXStockMultiplier(symbol),
      ]);
      const mint = asset.ok ? asset.data.solanaMint : null;
      const [price, onchain] = await Promise.all([
        mint ? fetchJupiterTokenPrice(mint) : Promise.resolve(unavailablePrice("xstock_mint_missing")),
        mint
          ? fetchScaledUiOnchain(mint)
          : Promise.resolve(errResult("solana-rpc.scaled-ui", "mint_missing")),
      ]);

      const mult = multiplier.ok ? multiplier.data.currentMultiplier : null;
      const onchainEff = onchain.ok ? onchain.data.effectiveMultiplier : null;
      const economicShares = mult != null ? paperRaw * mult : null;
      const usdPrice = price.ok ? price.data.usdPrice : null;
      const paperValueUsd =
        economicShares != null && usdPrice != null ? economicShares * usdPrice : null;

      const labels = ["paper-qty", "mainnet-read-multiplier"];
      if (onchain.ok) labels.push("onchain-scaled-ui");
      if (!auth.ok) labels.push("wallet-unbound");

      let health: PositionRow["health"] = "Unavailable";
      if (multiplier.ok && asset.ok && price.ok) health = "Verified";
      else if (multiplier.ok) health = "Review";

      rows.push({
        symbol,
        name: asset.ok ? asset.data.name : symbol,
        mint,
        paperRaw,
        multiplier: mult,
        onchainEffectiveMultiplier: onchainEff,
        economicShares,
        usdPrice,
        paperValueUsd,
        health,
        labels,
      });
    }

    return {
      rows,
      note: "Quantities are paper labels until Privy wallet binding. Multipliers/prices are live mainnet reads.",
      auth,
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
          (collateral ?? 0) + raw * multiplier.data.currentMultiplier * price.data.usdPrice;
        priced += 1;
      }
    }
    if (priced === 0) collateral = null;

    const aaplReserve = kamino.ok
      ? kamino.data.reserves.find((r) => r.symbol === "AAPLx")
      : undefined;
    const maxLtvUsed = aaplReserve?.maxLtv ?? null;
    const illustrativeBorrowUsd =
      collateral != null && maxLtvUsed != null ? collateral * maxLtvUsed : null;

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
    const decimals = asset.ok && asset.data.decimals != null ? asset.data.decimals : 8;

    const [wash, jupiterQuote, pools, kamino] = await Promise.all([
      evaluateWashGate({ symbol, mint, notionalUsd: 100 }),
      mint
        ? fetchJupiterQuote({
            outputMint: mint,
            amountRaw: 100_000_000,
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
        title: jupiterQuote.ok ? "Jupiter route inspected" : "Jupiter quote unavailable",
        detail: jupiterQuote.ok
          ? `out ${jupiterQuote.data.outUiAmount.toFixed(6)} · quote-only`
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
        title: kamino.ok ? "Kamino xStocks market read" : "Kamino read unavailable",
        detail: kamino.ok
          ? `${kamino.data.reserves.length} reserves · borrow CPI not broadcast`
          : kamino.reason,
        tone: kamino.ok ? "blue" : "amber",
        mode: kamino.ok ? kamino.mode : "unavailable",
      },
      {
        at: now,
        title: pools.ok ? `Raydium pools for ${symbol}` : "Pool awareness unavailable",
        detail: pools.ok ? `${pools.data.raydium.length} pools observed` : pools.reason,
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
    const session = parseFolioSessionCookie(readCookieHeader());
    const auth = getAuthProviderStatus(session.ok ? session : null);
    const tenantId = session.ok ? (session.data.tenants[0]?.tenantId ?? null) : null;
    const preferences = await loadDeskPreferences(tenantId);
    return {
      auth,
      session,
      preferences,
      networkPolicy: {
        mainnetRead: true,
        quoteOnly: true,
        broadcast: false,
        customProgramDeploy: false,
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
 * Exchange a Privy access token for an httpOnly folio_session cookie value.
 * Fail-closed when keys missing or Privy rejects the token.
 * Caller must Set-Cookie from setCookie; this does not touch localStorage.
 */
export const createSessionFromPrivyToken = createServerFn({ method: "POST" })
  .validator(PrivySessionInput)
  .handler(async ({ data }) => {
    const identity = await verifyPrivyAccessToken(data.accessToken);
    if (!identity.ok) {
      return errResult("folio.session.privy", identity.reason, identity.detail);
    }
    const minted = mintFolioSession({
      userId: identity.data.userId,
      walletAddress: data.walletAddress ?? identity.data.walletAddress,
      tenants: [],
    });
    if (!minted.ok) {
      return errResult("folio.session.privy", minted.reason, minted.detail);
    }
    return okResult("mainnet-read", "folio.session.privy", {
      session: minted.data.session,
      setCookie: minted.data.setCookie,
      note: "httpOnly folio_session minted after Privy verify — resolve Supabase tenants next.",
    });
  });
