import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { fetchXStockAsset, fetchXStockMultiplier } from "./adapters/xstocks";
import { divergeBps, fetchPythEquityPrice, fetchPythOndoUsdPrice, fetchPythXStockUsdPrice, pythBountyFeedSymbols } from "./adapters/pyth";
import { fetchJupiterQuote, fetchJupiterTokenPrice } from "./adapters/jupiter";
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
import type { PythPrice } from "./adapters/pyth";
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
  spendUsdc: z.number().positive().max(25), // quote inspection cap; broadcast still off (≤~$1 budget)
});

export type TruthBundle = {
  symbol: string;
  asset: AdapterResult<XStockAsset>;
  multiplier: AdapterResult<XStockMultiplier>;
  /** Equity.US.* Hermes reference (Stocklana Pyth bounty primary). */
  pyth: AdapterResult<PythPrice>;
  /** Crypto.{SYM}X/USD Hermes reference — labeled secondary; not a solo gate. */
  pythXStock: AdapterResult<PythPrice>;
  /** Crypto.{SYM}ON/USD Ondo — labeled tertiary (Stocklana Pyth bounty). */
  pythOndo: AdapterResult<PythPrice>;
  /** Mapped bounty feed symbols (honest even when PYTH_API_KEY missing). */
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
  spendUsdc: number;
  asset: AdapterResult<XStockAsset>;
  multiplier: AdapterResult<XStockMultiplier>;
  pyth: AdapterResult<PythPrice>;
  jupiterPrice: AdapterResult<JupiterTokenPrice>;
  wash: AdapterResult<WashVerdict>;
  jupiter: AdapterResult<JupiterQuote>;
  /** Raydium pool awareness — not a route guarantee. */
  pools: AdapterResult<PoolAwareness>;
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
    const [pyth, pythXStock, pythOndo, jupiterPrice, scaledUi] = await Promise.all([
      fetchPythEquityPrice(underlying),
      fetchPythXStockUsdPrice(symbol),
      fetchPythOndoUsdPrice(underlying),
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
      note: "Need Pyth Equity.US + Jupiter venue to score pass/fail",
    };

    const secondaryNotes = [
      pythXStock.ok
        ? `${pythXStock.data.feedSymbol ?? "Crypto.xStock/USD"} live (secondary)`
        : null,
      pythOndo.ok
        ? `${pythOndo.data.feedSymbol ?? "Crypto.ONDO/USD"} live (tertiary)`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const xStockNote = secondaryNotes ? ` · ${secondaryNotes}` : "";

    // Pass/fail only when Pyth Equity.US + Jupiter venue are both live.
    // Jupiter stockData vs venue is informational only — never invent-a-pass.
    if (pyth.ok && jupiterPrice.ok) {
      const d = divergeBps(pyth.data.price, jupiterPrice.data.usdPrice, 75);
      diverge = {
        pass: d.pass,
        divergeBps: d.divergeBps,
        bandBps: d.bandBps,
        note: `${pyth.data.feedSymbol ?? `Pyth ${underlying}`} vs Jupiter venue${xStockNote}`,
      };
    } else if (
      jupiterPrice.ok &&
      jupiterPrice.data.stockRefPrice != null &&
      jupiterPrice.data.stockRefPrice > 0
    ) {
      const d = divergeBps(
        jupiterPrice.data.stockRefPrice,
        jupiterPrice.data.usdPrice,
        75,
      );
      diverge = {
        pass: null,
        divergeBps: d.divergeBps,
        bandBps: d.bandBps,
        note: `Jupiter stockData vs venue ${d.divergeBps.toFixed(1)} bps · informational only · Pyth required for pass/fail${xStockNote}`,
      };
    } else if (!pyth.ok) {
      diverge = {
        pass: null,
        divergeBps: null,
        bandBps: 75,
        note: `Pyth unavailable: ${pyth.reason}${xStockNote}`,
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
      pythXStock,
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
    const { symbol, spendUsdc } = data;
    const [asset, multiplier] = await Promise.all([
      fetchXStockAsset(symbol),
      fetchXStockMultiplier(symbol),
    ]);
    const underlying = asset.ok
      ? asset.data.underlyingSymbol
      : symbol.replace(/x$/i, "").toUpperCase();
    const mint = asset.ok ? asset.data.solanaMint : null;
    const decimals = asset.ok && asset.data.decimals != null ? asset.data.decimals : 8;

    const [pyth, jupiterPrice, wash, pools] = await Promise.all([
      fetchPythEquityPrice(underlying),
      mint ? fetchJupiterTokenPrice(mint) : Promise.resolve(unavailablePrice("xstock_mint_missing")),
      evaluateWashGate({ symbol, mint, notionalUsd: spendUsdc }),
      mint
        ? fetchRaydiumPoolsForMint(mint)
        : Promise.resolve(errResult("api-v3.raydium.io", "xstock_mint_missing")),
    ]);

    const jupiter: AdapterResult<JupiterQuote> = !mint
      ? {
          ok: false,
          mode: "unavailable",
          asOf: new Date().toISOString(),
          source: "api.jup.ag/swap/v1/quote",
          reason: "xstock_mint_missing",
          detail: "Cannot quote without Solana mint from xStocks deployments",
        }
      : await fetchJupiterQuote({
          outputMint: mint,
          amountRaw: Math.round(spendUsdc * 1_000_000),
          slippageBps: 50,
          outputDecimals: decimals,
        });

    const truthOk = multiplier.ok && asset.ok;
    const washOk = washAllowsSize(wash);

    let diverge:
      | { kind: "ok" }
      | { kind: "blocked" }
      | { kind: "pyth_missing" }
      | { kind: "unavailable" } = { kind: "unavailable" };
    if (pyth.ok && jupiterPrice.ok) {
      const d = divergeBps(pyth.data.price, jupiterPrice.data.usdPrice, 75);
      diverge = d.pass ? { kind: "ok" } : { kind: "blocked" };
    } else if (!pyth.ok && pyth.reason === "pyth_api_key_missing") {
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
    });

    return {
      symbol,
      spendUsdc,
      asset,
      multiplier,
      pyth,
      jupiterPrice,
      wash,
      jupiter,
      pools,
      strictFailClosed: prefs.strictFailClosed,
      prefsFromSession: prefs.prefsFromSession,
      gates: {
        truthOk,
        washOk,
        quoteOk: jupiter.ok,
        divergeOk: gateMsgs.divergeOk,
        canReview: gateMsgs.canReview,
        blockedReasons: gateMsgs.blockedReasons,
        honestyNotes: gateMsgs.honestyNotes,
      },
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

    const [pyth, jupiterPrice, wash, kamino, jupiterLend, nestusd, nestCredit, scaledUi, pools] =
      await Promise.all([
        fetchPythEquityPrice(underlying),
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
          source: "api.jup.ag/swap/v1/quote",
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
  runDeskAgent,
  updateDeskPreferences,
  setActiveTenant,
  createSessionFromPrivyToken,
  clearFolioSession,
  bindWatchWallet,
  clearWatchWallet,
} from "./desk.empire";
export type {
  PositionsBundle,
  CreditBundle,
  ActivityBundle,
  SessionBundle,
  PositionRow,
  ActivityEvent,
} from "./desk.empire";
