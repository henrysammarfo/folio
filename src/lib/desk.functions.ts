import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchXStockAsset, fetchXStockMultiplier } from "./adapters/xstocks";
import { divergeBps, fetchPythEquityPrice } from "./adapters/pyth";
import { fetchJupiterQuote, fetchJupiterTokenPrice } from "./adapters/jupiter";
import { evaluateWashGate, washAllowsSize } from "./adapters/wash";
import { buildNetworkMatrix, type MatrixRow } from "./adapters/network-matrix";
import type { AdapterResult } from "./adapters/types";
import type { XStockAsset, XStockMultiplier } from "./adapters/xstocks";
import type { PythPrice } from "./adapters/pyth";
import type { JupiterQuote, JupiterTokenPrice } from "./adapters/jupiter";
import type { WashVerdict } from "./adapters/wash";
import { paperRawFor } from "./market";

const SymbolInput = z.object({
  symbol: z.string().min(2).max(16).default("AAPLx"),
});

const QuoteInput = z.object({
  symbol: z.string().min(2).max(16).default("AAPLx"),
  spendUsdc: z.number().positive().max(1_000_000),
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
    canReview: boolean;
    blockedReasons: string[];
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

    const blockedReasons: string[] = [];
    const truthOk = multiplier.ok && asset.ok;
    const washOk = washAllowsSize(wash);
    if (!truthOk) blockedReasons.push("Corporate-action / asset truth unavailable");
    if (asset.ok && asset.data.isTradingHalted) {
      blockedReasons.push("Trading halted per xStocks API");
    }
    if (!washOk) {
      blockedReasons.push(wash.ok ? "Wash pressure blocked" : `Wash gate: ${wash.reason}`);
    }
    if (!jupiter.ok) blockedReasons.push(`Jupiter quote: ${jupiter.reason}`);

    if (pyth.ok && jupiterPrice.ok) {
      const d = divergeBps(pyth.data.price, jupiterPrice.data.usdPrice, 75);
      if (!d.pass) blockedReasons.push("Pyth vs Jupiter venue diverge outside band");
    }

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
        canReview: truthOk && washOk && jupiter.ok,
        blockedReasons,
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

    const [pyth, jupiterPrice, wash] = await Promise.all([
      fetchPythEquityPrice(underlying),
      mint ? fetchJupiterTokenPrice(mint) : Promise.resolve(unavailablePrice("xstock_mint_missing")),
      evaluateWashGate({ symbol, mint, notionalUsd: 100 }),
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

    return {
      rows: buildNetworkMatrix({
        multiplier,
        pyth,
        jupiter,
        jupiterPrice,
        wash,
        bitqueryKeyPresent: Boolean(process.env["BITQUERY_API_KEY"]),
        broadcastFunded: false,
      }),
      broadcastPaused: process.env["BROADCAST_PAUSED"] !== "false",
    };
  },
);
export {
  getPositionsBundle,
  getCreditBundle,
  getActivityBundle,
  getSessionBundle,
  runDeskAgent,
} from "./desk.empire";
export type {
  PositionsBundle,
  CreditBundle,
  ActivityBundle,
  SessionBundle,
  PositionRow,
  ActivityEvent,
} from "./desk.empire";
