/**
 * Pre-IPO market bundles — PreStocks + Tessera kept on separate desks
 * so Stocklana bounty eligibility stays clean.
 * Buy UX mirrors desk Buy: stable ↔ partner mint (vice versa). Never cross issuers.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { errResult, type AdapterResult } from "./adapters/types";
import {
  fetchJupiterQuote,
  fetchJupiterTokenPrice,
  type JupiterQuote,
  type JupiterTokenPrice,
  stableMintForSymbol,
} from "./adapters/jupiter";
import {
  fetchPreStocksCatalog,
  type PreStockRow,
  type PreStocksCatalog,
} from "./adapters/prestocks";
import {
  fetchTesseraCatalog,
  type TesseraCatalog,
  type TesseraTokenRow,
} from "./adapters/tessera";
import { evaluateWashGate, washAllowsSize } from "./adapters/wash";
import { isBroadcastPaused } from "./broadcast";

function unavailablePrice(reason: string): AdapterResult<JupiterTokenPrice> {
  return {
    ok: false,
    mode: "unavailable",
    asOf: new Date().toISOString(),
    source: "api.jup.ag/price/v3",
    reason,
  };
}

const PreipoQuoteInput = z.object({
  symbol: z.string().min(2).max(32).optional(),
  spendUsdc: z.number().positive().max(25).default(1),
  /** Stable pay rail — USDC (default) or USDT. Partner desks do not mix issuers. */
  paySymbol: z.enum(["USDC", "USDT"]).default("USDC"),
  /**
   * buy = stable → partner mint · sell = partner mint → stable (vice versa).
   * Docs keep PreStocks ≠ Tessera; never cross issuers here.
   */
  side: z.enum(["buy", "sell"]).default("buy"),
});

export type PreipoBundle = {
  catalog: AdapterResult<PreStocksCatalog>;
  selected: PreStockRow | null;
  spendUsdc: number;
  paySymbol: "USDC" | "USDT";
  side: "buy" | "sell";
  jupiterPrice: AdapterResult<JupiterTokenPrice>;
  jupiter: AdapterResult<JupiterQuote>;
  washOk: boolean;
  washNote: string;
  assumedDecimals: number;
  note: string;
  broadcastPaused: boolean;
};

export type TesseraBundle = {
  catalog: AdapterResult<TesseraCatalog>;
  selected: TesseraTokenRow | null;
  spendUsdc: number;
  paySymbol: "USDC" | "USDT";
  side: "buy" | "sell";
  jupiterPrice: AdapterResult<JupiterTokenPrice>;
  jupiter: AdapterResult<JupiterQuote>;
  washOk: boolean;
  washNote: string;
  assumedDecimals: number;
  note: string;
  broadcastPaused: boolean;
};

type QuoteLegs = {
  inputMint: string;
  outputMint: string;
  amountRaw: number;
  inputDecimals: number;
  outputDecimals: number;
  notionalUsd: number;
};

function partnerLegs(opts: {
  side: "buy" | "sell";
  paySymbol: "USDC" | "USDT";
  partnerMint: string;
  amount: number;
  assumedDecimals: number;
}): QuoteLegs | null {
  const stable = stableMintForSymbol(opts.paySymbol);
  if (!stable) return null;
  if (opts.side === "buy") {
    return {
      inputMint: stable,
      outputMint: opts.partnerMint,
      amountRaw: Math.round(opts.amount * 1_000_000),
      inputDecimals: 6,
      outputDecimals: opts.assumedDecimals,
      notionalUsd: opts.amount,
    };
  }
  // sell: amount is partner token units (assumed decimals)
  return {
    inputMint: opts.partnerMint,
    outputMint: stable,
    amountRaw: Math.round(opts.amount * 10 ** opts.assumedDecimals),
    inputDecimals: opts.assumedDecimals,
    outputDecimals: 6,
    notionalUsd: opts.amount, // wash uses size hint; mark USD refined client-side when price live
  };
}

/** PreStocks desk — PreStocks API only (Stocklana PreStocks bounty). */
export const getPreipoBundle = createServerFn({ method: "GET" })
  .validator(PreipoQuoteInput)
  .handler(async ({ data }): Promise<PreipoBundle> => {
    const catalog = await fetchPreStocksCatalog();
    const assumedDecimals = 9;
    const paySymbol = data.paySymbol;
    const side = data.side;
    const baseMeta = {
      spendUsdc: data.spendUsdc,
      paySymbol,
      side,
      assumedDecimals,
      broadcastPaused: isBroadcastPaused(),
    };
    if (!catalog.ok) {
      return {
        ...baseMeta,
        catalog,
        selected: null,
        jupiterPrice: unavailablePrice("prestocks_catalog_unavailable"),
        jupiter: errResult(
          "api.jup.ag/swap/v2/order",
          "prestocks_catalog_unavailable",
        ),
        washOk: false,
        washNote: "Catalog unavailable",
        note: "PreStocks catalog fail-closed — no invented private-company tokens.",
      };
    }
    const want = data.symbol?.trim().toUpperCase();
    const selected =
      catalog.data.rows.find((r) => r.symbol === want) ??
      catalog.data.rows[0] ??
      null;
    if (!selected) {
      return {
        ...baseMeta,
        catalog,
        selected: null,
        jupiterPrice: unavailablePrice("prestocks_empty"),
        jupiter: errResult("api.jup.ag/swap/v2/order", "prestocks_empty"),
        washOk: false,
        washNote: "No rows",
        note: catalog.data.note,
      };
    }

    const legs = partnerLegs({
      side,
      paySymbol,
      partnerMint: selected.mint,
      amount: data.spendUsdc,
      assumedDecimals,
    });
    if (!legs) {
      return {
        ...baseMeta,
        catalog,
        selected,
        jupiterPrice: unavailablePrice("stable_pay_unknown"),
        jupiter: errResult("api.jup.ag/swap/v2/order", "stable_pay_unknown"),
        washOk: false,
        washNote: "Stable pay rail unknown",
        note: catalog.data.note,
      };
    }

    const [jupiterPrice, jupiter, wash] = await Promise.all([
      fetchJupiterTokenPrice(selected.mint),
      fetchJupiterQuote({
        inputMint: legs.inputMint,
        outputMint: legs.outputMint,
        amountRaw: legs.amountRaw,
        slippageBps: 100,
        outputDecimals: legs.outputDecimals,
        inputDecimals: legs.inputDecimals,
      }),
      evaluateWashGate({
        symbol: selected.symbol,
        mint: selected.mint,
        notionalUsd: legs.notionalUsd,
      }),
    ]);
    const washOk = washAllowsSize(wash);
    return {
      ...baseMeta,
      catalog,
      selected,
      jupiterPrice,
      jupiter,
      washOk,
      washNote: wash.ok
        ? wash.data.notes.join("; ") || wash.mode
        : wash.reason,
      note: `${catalog.data.note} · ${side} ${paySymbol} · decimals assumed ${assumedDecimals}.`,
    };
  });

/** Tessera T-token desk — separate from PreStocks. */
export const getTesseraBundle = createServerFn({ method: "GET" })
  .validator(PreipoQuoteInput)
  .handler(async ({ data }): Promise<TesseraBundle> => {
    const catalog = await fetchTesseraCatalog();
    const assumedDecimals = 9;
    const paySymbol = data.paySymbol;
    const side = data.side;
    const baseMeta = {
      spendUsdc: data.spendUsdc,
      paySymbol,
      side,
      assumedDecimals,
      broadcastPaused: isBroadcastPaused(),
    };
    if (!catalog.ok) {
      return {
        ...baseMeta,
        catalog,
        selected: null,
        jupiterPrice: unavailablePrice("tessera_catalog_unavailable"),
        jupiter: errResult(
          "api.jup.ag/swap/v2/order",
          "tessera_catalog_unavailable",
        ),
        washOk: false,
        washNote: "Catalog unavailable",
        note: "Tessera catalog fail-closed.",
      };
    }
    const want = data.symbol?.trim();
    const selected =
      catalog.data.rows.find(
        (r) =>
          r.symbol === want ||
          r.id === want ||
          r.code === want ||
          r.symbol.toLowerCase() === want?.toLowerCase(),
      ) ??
      catalog.data.rows[0] ??
      null;
    if (!selected) {
      return {
        ...baseMeta,
        catalog,
        selected: null,
        jupiterPrice: unavailablePrice("tessera_empty"),
        jupiter: errResult("api.jup.ag/swap/v2/order", "tessera_empty"),
        washOk: false,
        washNote: "No rows",
        note: catalog.data.note,
      };
    }

    const legs = partnerLegs({
      side,
      paySymbol,
      partnerMint: selected.mint,
      amount: data.spendUsdc,
      assumedDecimals,
    });
    if (!legs) {
      return {
        ...baseMeta,
        catalog,
        selected,
        jupiterPrice: unavailablePrice("stable_pay_unknown"),
        jupiter: errResult("api.jup.ag/swap/v2/order", "stable_pay_unknown"),
        washOk: false,
        washNote: "Stable pay rail unknown",
        note: catalog.data.note,
      };
    }

    const [jupiterPrice, jupiter, wash] = await Promise.all([
      fetchJupiterTokenPrice(selected.mint),
      fetchJupiterQuote({
        inputMint: legs.inputMint,
        outputMint: legs.outputMint,
        amountRaw: legs.amountRaw,
        slippageBps: 100,
        outputDecimals: legs.outputDecimals,
        inputDecimals: legs.inputDecimals,
      }),
      evaluateWashGate({
        symbol: selected.symbol,
        mint: selected.mint,
        notionalUsd: legs.notionalUsd,
      }),
    ]);
    const washOk = washAllowsSize(wash);
    return {
      ...baseMeta,
      catalog,
      selected,
      jupiterPrice,
      jupiter,
      washOk,
      washNote: wash.ok
        ? wash.data.notes.join("; ") || wash.mode
        : wash.reason,
      note: `${catalog.data.note} · ${side} ${paySymbol} · decimals assumed ${assumedDecimals}.`,
    };
  });
