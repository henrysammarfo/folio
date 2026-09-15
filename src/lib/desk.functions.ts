import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchXStockAsset, fetchXStockMultiplier } from "./adapters/xstocks";
import { divergeBps, fetchPythEquityPrice } from "./adapters/pyth";
import { fetchJupiterQuote, fetchJupiterTokenPrice } from "./adapters/jupiter";
import { evaluateWashGate, washAllowsSize } from "./adapters/wash";
import { buildAcquireGateMessages } from "./acquire-gates";
import { buildNetworkMatrix, type MatrixRow } from "./adapters/network-matrix";
import { fetchKaminoXStocksMarket } from "./adapters/kamino";
import { fetchJupiterLendEarn } from "./adapters/jupiter-lend";
import { fetchNestUsdStatus } from "./adapters/nestusd";
import { fetchScaledUiOnchain } from "./adapters/scaled-ui";
import { resolveSolanaRpcUrl } from "./adapters/solana-rpc";
import type { AdapterResult } from "./adapters/types";
import type { XStockAsset, XStockMultiplier } from "./adapters/xstocks";
import type { PythPrice } from "./adapters/pyth";
import type { JupiterQuote, JupiterTokenPrice } from "./adapters/jupiter";
import type { WashVerdict } from "./adapters/wash";
import { paperRawFor } from "./market";
import { isBroadcastPaused } from "./broadcast";
export { isBroadcastPaused } from "./broadcast";

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
  pyth: AdapterResult<PythPrice>;
  jupiterPrice: AdapterResult<JupiterTokenPrice>;
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
  gates: {
    truthOk: boolean;
    washOk: boolean;
    quoteOk: boolean;
    divergeOk: boolean;
    canReview: boolean;
    blockedReasons: string[];
    /** Labeled gaps that do not alone block review (e.g. missing Pyth). */
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
    const [pyth, jupiterPrice] = await Promise.all([
      fetchPythEquityPrice(underlying),
      mint ? fetchJupiterTokenPrice(mint) : Promise.resolve(unavailablePrice("xstock_mint_missing")),
    ]);

    let diverge: TruthBundle["diverge"] = {
      pass: null,
      divergeBps: null,
      bandBps: 75,
      note: "Need two live references to score diverge",
    };

    if (pyth.ok && jupiterPrice.ok) {
      const d = divergeBps(pyth.data.price, jupiterPrice.data.usdPrice, 75);
      diverge = {
        pass: d.pass,
        divergeBps: d.divergeBps,
        bandBps: d.bandBps,
        note: `Pyth ${underlying} vs Jupiter venue`,
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
        pass: d.pass,
        divergeBps: d.divergeBps,
        bandBps: d.bandBps,
        note: "Jupiter stockData vs Jupiter venue (Pyth Hermes price updates unavailable on this egress)",
      };
    } else if (!pyth.ok) {
      diverge = {
        pass: null,
        divergeBps: null,
        bandBps: 75,
        note: `Pyth unavailable: ${pyth.reason}`,
      };
    }

    const paperRaw = paperRawFor(symbol);
    const economicShares = multiplier.ok
      ? paperRaw * multiplier.data.currentMultiplier
      : null;

    return {
      symbol,
      asset,
      multiplier,
      pyth,
      jupiterPrice,
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

    const [pyth, jupiterPrice, wash] = await Promise.all([
      fetchPythEquityPrice(underlying),
      mint ? fetchJupiterTokenPrice(mint) : Promise.resolve(unavailablePrice("xstock_mint_missing")),
      evaluateWashGate({ symbol, mint, notionalUsd: spendUsdc }),
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

    const [pyth, jupiterPrice, wash, kamino, jupiterLend, nestusd, scaledUi] =
      await Promise.all([
        fetchPythEquityPrice(underlying),
        mint
          ? fetchJupiterTokenPrice(mint)
          : Promise.resolve(unavailablePrice("xstock_mint_missing")),
        evaluateWashGate({ symbol, mint, notionalUsd: 100 }),
        fetchKaminoXStocksMarket(),
        fetchJupiterLendEarn(),
        fetchNestUsdStatus(),
        mint
          ? fetchScaledUiOnchain(mint)
          : Promise.resolve({
              ok: false as const,
              mode: "unavailable" as const,
              asOf: new Date().toISOString(),
              source: "solana-rpc.scaled-ui",
              reason: "xstock_mint_missing",
            }),
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
        scaledUi,
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
export {
  getPositionsBundle,
  getCreditBundle,
  getActivityBundle,
  getSessionBundle,
  runDeskAgent,
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
