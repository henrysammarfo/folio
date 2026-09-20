import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { fetchXStockAsset, fetchXStockMultiplier } from "./adapters/xstocks";
import { divergeBps, pythBountyFeedSymbols, type PythPrice } from "./adapters/pyth";
import {
  fetchCoinGeckoXStockPrice,
  fetchEquityReferencePrice,
  type EquityRefPrice,
  type XStockRefPrice,
} from "./adapters/equity-ref";
import { fetchJupiterQuote, fetchJupiterTokenPrice, fetchJupiterExecute } from "./adapters/jupiter";
import { evaluateWashGate, washAllowsSize } from "./adapters/wash";
import { buildAcquireGateMessages } from "./acquire-gates";
import { buildNetworkMatrix, type MatrixRow } from "./adapters/network-matrix";
import { fetchKaminoXStocksMarket } from "./adapters/kamino";
import { fetchJupiterLendEarn } from "./adapters/jupiter-lend";
import { fetchNestUsdStatus } from "./adapters/nestusd";
import { fetchNestCreditVaults } from "./adapters/nest-credit";
import {
  compareApiOnchainMultiplier,
  fetchScaledUiOnchain,
  type ScaledUiApiCompare,
  type ScaledUiOnchain,
} from "./adapters/scaled-ui";
import { fetchRaydiumPoolsForMint } from "./adapters/pools";
import { resolveSolanaRpcUrl } from "./adapters/solana-rpc";
import { errResult, type AdapterResult } from "./adapters/types";
import type { XStockAsset, XStockMultiplier } from "./adapters/xstocks";
import type { JupiterQuote, JupiterTokenPrice } from "./adapters/jupiter";
import type { WashVerdict } from "./adapters/wash";
import type { PoolAwareness } from "./adapters/pools";
import { paperRawFor } from "./market";
import { isBroadcastPaused } from "./broadcast";
import {
  readApprovedLabShader,
  readApprovedLabUi,
  type LabShaderId,
  type LabUiId,
} from "./lab-pick";
import {
  FOLIO_SESSION_COOKIE,
  loadDeskPreferences,
  resolveActiveTenantId,
  verifyFolioSessionCookieValue,
} from "./auth/session";
export { isBroadcastPaused } from "./broadcast";

/** Load strictFailClosed from active-tenant prefs when a session exists; else false. */
async function loadStrictFailClosedPref(): Promise<{
  strictFailClosed: boolean;
  prefsFromSession: boolean;
}> {
  try {
    const value = getCookie(FOLIO_SESSION_COOKIE);
    const session = verifyFolioSessionCookieValue(value);
    if (!session.ok) return { strictFailClosed: false, prefsFromSession: false };
    const tenantId = resolveActiveTenantId(session.data);
    const prefs = await loadDeskPreferences(tenantId, session.data.userId);
    if (!prefs.ok) return { strictFailClosed: false, prefsFromSession: false };
    return {
      strictFailClosed: prefs.data.strictFailClosed,
      prefsFromSession: true,
    };
  } catch {
    return { strictFailClosed: false, prefsFromSession: false };
  }
}

const SymbolInput = z.object({
  symbol: z.string().min(2).max(16).default("AAPLx"),
});

const QuoteInput = z.object({
  symbol: z.string().min(2).max(16).default("AAPLx"),
  /** USDC spend when paySymbol is omitted / USDC. */
  spendUsdc: z.number().positive().max(25).optional(),
  /** Pay-side xStock for true stock↔stock Jupiter quotes. */
  paySymbol: z.string().min(2).max(16).optional(),
  /** Pay qty (USDC dollars or xStock units). Cap keeps inspection cheap. */
  amount: z.number().positive().max(25).optional(),
});

export type TruthBundle = {
  symbol: string;
  asset: AdapterResult<XStockAsset>;
  multiplier: AdapterResult<XStockMultiplier>;
  /**
   * Pyth Hermes — intentionally off ship path (Pro paywall).
   * Diverge uses live free equityRef (Yahoo/Finnhub) instead.
   */
  pyth: AdapterResult<PythPrice>;
  /** Live free equity reference for diverge — Finnhub → Yahoo. Never invents prices. */
  equityRef: AdapterResult<EquityRefPrice>;
  /** Pyth Crypto.xStock — off ship path; see xStockRef. */
  pythXStock: AdapterResult<PythPrice>;
  /** Live CoinGecko xStock secondary. */
  xStockRef: AdapterResult<XStockRefPrice>;
  /** Pyth Ondo — off ship path. */
  pythOndo: AdapterResult<PythPrice>;
  /** Mapped bounty feed symbols (catalog only — prices not fetched on ship path). */
  pythBountyFeeds: {
    equityUs: string | null;
    cryptoXStock: string | null;
    cryptoOndo: string | null;
  };
  jupiterPrice: AdapterResult<JupiterTokenPrice>;
  /** On-chain Token-2022 Scaled UI — Solana mainnet-read when RPC works. */
  scaledUi: AdapterResult<ScaledUiOnchain>;
  /** API currentMultiplier ↔ on-chain effective — never invents a match. */
  scaledUiCompare: ScaledUiApiCompare;
  diverge: {
    pass: boolean | null;
    divergeBps: number | null;
    bandBps: number;
    note: string;
  };
  /** Illustrative paper qty — not wallet truth until Privy binding. */
  paperRaw: number;
  economicShares: number | null;
};

export type AcquireBundle = {
  symbol: string;
  /** "USDC" or pay-side xStock symbol. */
  paySymbol: string;
  spendUsdc: number;
  payAmount: number;
  mode: "usdc" | "stock-pair";
  payAsset: AdapterResult<XStockAsset> | null;
  asset: AdapterResult<XStockAsset>;
  multiplier: AdapterResult<XStockMultiplier>;
  pyth: AdapterResult<PythPrice>;
  equityRef: AdapterResult<EquityRefPrice>;
  jupiterPrice: AdapterResult<JupiterTokenPrice>;
  wash: AdapterResult<WashVerdict>;
  jupiter: AdapterResult<JupiterQuote>;
  /** Raydium pool awareness — not a route guarantee. */
  pools: AdapterResult<PoolAwareness>;
  /** On-chain Token-2022 Scaled UI — Solana mainnet-read when RPC works. */
  scaledUi: AdapterResult<ScaledUiOnchain>;
  /** API currentMultiplier ↔ on-chain effective — never invents a match. */
  scaledUiCompare: ScaledUiApiCompare;
  /**
   * From active-tenant desk prefs when a verified session exists.
   * Without session: false (public demo stays honesty-labeled for missing Pyth).
   */
  strictFailClosed: boolean;
  /** True when prefs were loaded from an authenticated active tenant. */
  prefsFromSession: boolean;
  gates: {
    truthOk: boolean;
    washOk: boolean;
    quoteOk: boolean;
    divergeOk: boolean;
    /** On-chain Scaled UI match when both sides live; else false (honesty-labeled). */
    scaledUiOk: boolean;
    canReview: boolean;
    blockedReasons: string[];
    /** Labeled gaps that do not alone block review (e.g. missing Pyth) unless strict. */
    honestyNotes: string[];
  };
};

export type NetworkBundle = {
  rows: MatrixRow[];
  broadcastPaused: boolean;
};

function unavailablePrice(reason: string): AdapterResult<JupiterTokenPrice> {
  return {
    ok: false,
    mode: "unavailable",
    asOf: new Date().toISOString(),
    source: "api.jup.ag/price/v3",
    reason,
  };
}

function pythOffShipPath(): AdapterResult<PythPrice> {
  return errResult(
    "hermes.pyth.network",
    "pyth_not_on_ship_path",
    "Ship diverge uses live Yahoo/Finnhub (+ CoinGecko xStock) — Pyth Pro not required.",
  );
}

export const getTruthBundle = createServerFn({ method: "GET" })
  .validator(SymbolInput)
  .handler(async ({ data }): Promise<TruthBundle> => {
    const symbol = data.symbol;
    const [asset, multiplier] = await Promise.all([
      fetchXStockAsset(symbol),
      fetchXStockMultiplier(symbol),
    ]);
    const underlying =
      (asset.ok ? asset.data.underlyingSymbol : symbol.replace(/x$/i, "").toUpperCase()) ||
      "AAPL";
    const mint = asset.ok ? asset.data.solanaMint : null;
    const bountyFeeds = pythBountyFeedSymbols(symbol);
    const pyth = pythOffShipPath();
    const pythXStock = pythOffShipPath();
    const pythOndo = pythOffShipPath();
    const [equityRef, xStockRef, jupiterPrice, scaledUi] = await Promise.all([
      fetchEquityReferencePrice(underlying),
      fetchCoinGeckoXStockPrice(symbol),
      mint ? fetchJupiterTokenPrice(mint) : Promise.resolve(unavailablePrice("xstock_mint_missing")),
      mint
        ? fetchScaledUiOnchain(mint)
        : Promise.resolve(
            errResult(
              "solana-rpc.scaled-ui",
              "xstock_mint_missing",
              "No Solana mint — cannot read Scaled UI",
            ),
          ),
    ]);

    let diverge: TruthBundle["diverge"] = {
      pass: null,
      divergeBps: null,
      bandBps: 75,
      note: "Need live free equity ref (Yahoo/Finnhub) + Jupiter venue to score pass/fail",
    };

    const secondaryNotes = xStockRef.ok
      ? `${xStockRef.data.feedSymbol} live (CoinGecko)`
      : null;
    const xStockNote = secondaryNotes ? ` · ${secondaryNotes}` : "";

    // Pass/fail only on live free equity ref + Jupiter venue — no invented prices.
    if (equityRef.ok && jupiterPrice.ok) {
      const d = divergeBps(equityRef.data.price, jupiterPrice.data.usdPrice, 75);
      diverge = {
        pass: d.pass,
        divergeBps: d.divergeBps,
        bandBps: d.bandBps,
        note: `${equityRef.data.feedSymbol} (${equityRef.data.provider}) vs Jupiter venue${xStockNote}`,
      };
    } else if (!equityRef.ok) {
      diverge = {
        pass: null,
        divergeBps: null,
        bandBps: 75,
        note: `Equity ref unavailable: ${equityRef.reason}${equityRef.detail ? ` — ${equityRef.detail}` : ""}${xStockNote}`,
      };
    } else if (!jupiterPrice.ok) {
      diverge = {
        pass: null,
        divergeBps: null,
        bandBps: 75,
        note: `Jupiter venue unavailable: ${jupiterPrice.reason}${xStockNote}`,
      };
    }

    const scaledUiCompare = compareApiOnchainMultiplier(
      multiplier.ok ? multiplier.data.currentMultiplier : null,
      scaledUi.ok ? scaledUi.data.effectiveMultiplier : null,
    );

    const paperRaw = paperRawFor(symbol);
    const economicShares = multiplier.ok
      ? paperRaw * multiplier.data.currentMultiplier
      : null;

    return {
      symbol,
      asset,
      multiplier,
      pyth,
      equityRef,
      pythXStock,
      xStockRef,
      pythOndo,
      pythBountyFeeds: bountyFeeds,
      jupiterPrice,
      scaledUi,
      scaledUiCompare,
      diverge,
      paperRaw,
      economicShares,
    };
  });

export const getAcquireBundle = createServerFn({ method: "GET" })
  .validator(QuoteInput)
  .handler(async ({ data }): Promise<AcquireBundle> => {
    const symbol = data.symbol;
    const payRaw = data.paySymbol?.trim();
    const isPair = Boolean(payRaw && payRaw.toUpperCase() !== "USDC");
    const paySymbol = isPair ? payRaw! : "USDC";
    const payAmount = data.amount ?? data.spendUsdc ?? (isPair ? 0.01 : 1);
    const spendUsdc = payAmount;

    const [asset, multiplier, payAssetRes] = await Promise.all([
      fetchXStockAsset(symbol),
      fetchXStockMultiplier(symbol),
      isPair ? fetchXStockAsset(paySymbol) : Promise.resolve(null),
    ]);
    const payAsset =
      payAssetRes && typeof payAssetRes === "object" && "ok" in payAssetRes
        ? payAssetRes
        : null;
    const underlying = asset.ok
      ? asset.data.underlyingSymbol
      : symbol.replace(/x$/i, "").toUpperCase();
    const mint = asset.ok ? asset.data.solanaMint : null;
    const decimals =
      asset.ok && asset.data.decimals != null ? asset.data.decimals : 8;
    const payMint =
      isPair && payAsset?.ok ? payAsset.data.solanaMint : null;
    const payDecimals =
      isPair && payAsset?.ok && payAsset.data.decimals != null
        ? payAsset.data.decimals
        : 8;
    const notionalUsd = isPair
      ? Math.min(25, Math.max(0.5, payAmount * 50))
      : spendUsdc;

    const [equityRef, jupiterPrice, wash, pools, scaledUi] = await Promise.all([
      fetchEquityReferencePrice(underlying),
      mint
        ? fetchJupiterTokenPrice(mint)
        : Promise.resolve(unavailablePrice("xstock_mint_missing")),
      evaluateWashGate({ symbol, mint, notionalUsd }),
      mint
        ? fetchRaydiumPoolsForMint(mint)
        : Promise.resolve(errResult("api-v3.raydium.io", "xstock_mint_missing")),
      mint
        ? fetchScaledUiOnchain(mint)
        : Promise.resolve(
            errResult(
              "solana-rpc.scaled-ui",
              "xstock_mint_missing",
              "No Solana mint — cannot read Scaled UI",
            ),
          ),
    ]);
    const pyth = pythOffShipPath();

    let jupiter: AdapterResult<JupiterQuote>;
    if (!mint) {
      jupiter = {
        ok: false,
        mode: "unavailable",
        asOf: new Date().toISOString(),
        source: "api.jup.ag/swap/v2/order",
        reason: "xstock_mint_missing",
        detail: "Cannot quote without Solana mint from xStocks deployments",
      };
    } else if (isPair && !payMint) {
      jupiter = {
        ok: false,
        mode: "unavailable",
        asOf: new Date().toISOString(),
        source: "api.jup.ag/swap/v2/order",
        reason: "pay_mint_missing",
        detail: `Cannot stock-pair quote without pay mint for ${paySymbol}`,
      };
    } else if (isPair && payMint === mint) {
      jupiter = {
        ok: false,
        mode: "unavailable",
        asOf: new Date().toISOString(),
        source: "api.jup.ag/swap/v2/order",
        reason: "same_mint_pair",
        detail: "Pay and receive must be different stocks",
      };
    } else {
      jupiter = await fetchJupiterQuote({
        inputMint: isPair && payMint ? payMint : undefined,
        outputMint: mint,
        amountRaw: Math.round(payAmount * 10 ** (isPair ? payDecimals : 6)),
        slippageBps: 50,
        outputDecimals: decimals,
        inputDecimals: isPair ? payDecimals : 6,
      });
    }

    const truthOk =
      multiplier.ok && asset.ok && (!isPair || Boolean(payAsset?.ok));
    const washOk = washAllowsSize(wash);
    const scaledUiCompare = compareApiOnchainMultiplier(
      multiplier.ok ? multiplier.data.currentMultiplier : null,
      scaledUi.ok ? scaledUi.data.effectiveMultiplier : null,
    );
    const scaledUiOk = scaledUiCompare.status === "match";
    const scaledUiGate =
      scaledUiCompare.status === "match"
        ? ({ kind: "match", note: scaledUiCompare.note } as const)
        : scaledUiCompare.status === "mismatch"
          ? ({ kind: "mismatch", note: scaledUiCompare.note } as const)
          : ({ kind: "unavailable", note: scaledUiCompare.note } as const);

    let diverge:
      | { kind: "ok" }
      | { kind: "blocked" }
      | { kind: "pyth_missing" }
      | { kind: "unavailable" } = { kind: "unavailable" };
    if (equityRef.ok && jupiterPrice.ok) {
      const d = divergeBps(equityRef.data.price, jupiterPrice.data.usdPrice, 75);
      diverge = d.pass ? { kind: "ok" } : { kind: "blocked" };
    } else if (!equityRef.ok) {
      diverge = { kind: "pyth_missing" };
    }

    const poolsGate = !pools.ok
      ? ({ kind: "unavailable", reason: pools.reason } as const)
      : pools.data.raydium.length === 0
        ? ({ kind: "empty" } as const)
        : ({ kind: "ok", poolCount: pools.data.raydium.length } as const);

    const prefs = await loadStrictFailClosedPref();
    const gateMsgs = buildAcquireGateMessages({
      truthOk,
      tradingHalted: Boolean(asset.ok && asset.data.isTradingHalted),
      washOk,
      wash: wash.ok
        ? { kind: "pressure" }
        : { kind: "adapter", reason: wash.reason },
      quoteOk: jupiter.ok,
      quoteReason: jupiter.ok ? null : jupiter.reason,
      diverge,
      strictFailClosed: prefs.strictFailClosed,
      pools: poolsGate,
      scaledUi: scaledUiGate,
    });

    const honestyNotes = [
      ...gateMsgs.honestyNotes,
      isPair
        ? `Stock↔stock · ${paySymbol} → ${symbol} · Jupiter Swap V2 /order (quote-only until fills arm)`
        : null,
      jupiter.ok && jupiter.data.router
        ? `Router ${jupiter.data.router}${jupiter.data.gasless ? " · gasless path" : ""}`
        : null,
      isBroadcastPaused()
        ? "Broadcast paused — /execute refused until BROADCAST_PAUSED=false"
        : "Broadcast armed — /execute available after wallet sign",
    ].filter(Boolean) as string[];

    return {
      symbol,
      paySymbol,
      spendUsdc,
      payAmount,
      mode: isPair ? "stock-pair" : "usdc",
      payAsset,
      asset,
      multiplier,
      pyth,
      equityRef,
      jupiterPrice,
      wash,
      jupiter,
      pools,
      scaledUi,
      scaledUiCompare,
      strictFailClosed: prefs.strictFailClosed,
      prefsFromSession: prefs.prefsFromSession,
      broadcastPaused: isBroadcastPaused(),
      gates: {
        truthOk,
        washOk,
        quoteOk: jupiter.ok,
        divergeOk: gateMsgs.divergeOk,
        scaledUiOk,
        canReview: gateMsgs.canReview,
        blockedReasons: gateMsgs.blockedReasons,
        honestyNotes,
      },
    };
  });

const ExecuteSwapInput = z.object({
  signedTransaction: z.string().min(32).max(20_000),
  requestId: z.string().min(8).max(200),
});

/**
 * Land a user-signed Jupiter Swap V2 order.
 * Fail-closed while BROADCAST_PAUSED≠false. Does not sign — client must sign first.
 */
export const executeJupiterSwap = createServerFn({ method: "POST" })
  .inputValidator(ExecuteSwapInput)
  .handler(async ({ data }) => {
    if (isBroadcastPaused()) {
      return {
        ok: false as const,
        reason: "broadcast_paused",
        detail:
          "Fills paused · set BROADCAST_PAUSED=false to arm /execute (preview first).",
      };
    }
    const res = await fetchJupiterExecute({
      signedTransaction: data.signedTransaction,
      requestId: data.requestId,
    });
    if (!res.ok) {
      return {
        ok: false as const,
        reason: res.reason,
        detail: res.detail ?? null,
        source: res.source,
      };
    }
    return {
      ok: true as const,
      source: res.source,
      mode: res.mode,
      data: res.data,
    };
  });

export const getNetworkBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<NetworkBundle> => {
    const symbol = "AAPLx";
    const [multiplier, asset] = await Promise.all([
      fetchXStockMultiplier(symbol),
      fetchXStockAsset(symbol),
    ]);
    const underlying = asset.ok ? asset.data.underlyingSymbol : "AAPL";
    const mint = asset.ok ? asset.data.solanaMint : null;
    const decimals = asset.ok && asset.data.decimals != null ? asset.data.decimals : 8;
    const rpc = resolveSolanaRpcUrl();

    const [equityRef, jupiterPrice, wash, kamino, jupiterLend, nestusd, nestCredit, scaledUi, pools] =
      await Promise.all([
        fetchEquityReferencePrice(underlying),
        mint
          ? fetchJupiterTokenPrice(mint)
          : Promise.resolve(unavailablePrice("xstock_mint_missing")),
        evaluateWashGate({ symbol, mint, notionalUsd: 100 }),
        fetchKaminoXStocksMarket(),
        fetchJupiterLendEarn(),
        fetchNestUsdStatus(),
        fetchNestCreditVaults(),
        mint
          ? fetchScaledUiOnchain(mint)
          : Promise.resolve({
              ok: false as const,
              mode: "unavailable" as const,
              asOf: new Date().toISOString(),
              source: "solana-rpc.scaled-ui",
              reason: "xstock_mint_missing",
            }),
        mint
          ? fetchRaydiumPoolsForMint(mint)
          : Promise.resolve(errResult("api-v3.raydium.io", "xstock_mint_missing")),
      ]);
    const pyth = pythOffShipPath();

    const jupiter = mint
      ? await fetchJupiterQuote({
          outputMint: mint,
          amountRaw: 100_000_000,
          outputDecimals: decimals,
        })
      : ({
          ok: false,
          mode: "unavailable",
          asOf: new Date().toISOString(),
          source: "api.jup.ag/swap/v2/order",
          reason: "xstock_mint_missing",
        } as const);

    const multiTenantKeysPresent = Boolean(
      process.env["PRIVY_APP_ID"]?.trim() &&
        process.env["PRIVY_APP_SECRET"]?.trim() &&
        process.env["SUPABASE_URL"]?.trim() &&
        process.env["SUPABASE_ANON_KEY"]?.trim() &&
        process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim() &&
        (process.env["FOLIO_SESSION_SECRET"]?.trim().length ?? 0) >= 16,
    );
    const sessionSecretPresent =
      (process.env["FOLIO_SESSION_SECRET"]?.trim().length ?? 0) >= 16;

    return {
      rows: buildNetworkMatrix({
        multiplier,
        pyth,
        equityRef,
        jupiter,
        jupiterPrice,
        wash,
        kamino,
        jupiterLend,
        nestusd,
        nestCredit,
        scaledUi,
        pools,
        bitqueryKeyPresent: Boolean(process.env["BITQUERY_API_KEY"]?.trim()),
        multiTenantKeysPresent,
        sessionSecretPresent,
        solanaRpcPublicFallback: rpc.publicFallback,
        broadcastFunded: false,
      }),
      broadcastPaused: isBroadcastPaused(),
    };
  },
);

/** Henry-approved production lab chrome (FOLIO_APPROVED_LAB_* env after chat reply). */
export const getLabApprovals = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    approvedUi: LabUiId | null;
    approvedShader: LabShaderId | null;
  }> => ({
    approvedUi: readApprovedLabUi(),
    approvedShader: readApprovedLabShader(),
  }),
);

export {
  getPositionsBundle,
  getCreditBundle,
  getActivityBundle,
  getSessionBundle,
  getEmpireReadiness,
  getDeskAccess,
  runDeskAgent,
  updateDeskPreferences,
  setActiveTenant,
  createSessionFromPrivyToken,
  clearFolioSession,
  attachDemoTenantMembership,
  bootstrapDemoDeskSession,
  bindWatchWallet,
  clearWatchWallet,
} from "./desk.empire";
export { getPreipoBundle, getTesseraBundle } from "./desk.markets";
export { getMarketsBoard, getScreenerBundle } from "./desk.screener";
export type {
  PositionsBundle,
  CreditBundle,
  ActivityBundle,
  SessionBundle,
  EmpireReadiness,
  PositionRow,
  ActivityEvent,
} from "./desk.empire";
export type { DeskAccess } from "./auth/desk-access";
export type { PreipoBundle, TesseraBundle } from "./desk.markets";
export type {
  MarketsBoardBundle,
  MarketsBoardRow,
  ScreenerBundle,
  ScreenerRow,
} from "./desk.screener";
