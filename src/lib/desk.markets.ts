/**
 * Pre-IPO market bundles — PreStocks + Tessera kept on separate desks
 * so Stocklana bounty eligibility stays clean.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { errResult, type AdapterResult } from "./adapters/types";
import {
  fetchJupiterQuote,
  fetchJupiterTokenPrice,
  type JupiterQuote,
  type JupiterTokenPrice,
  USDC_MINT,
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
});

export type PreipoBundle = {
  catalog: AdapterResult<PreStocksCatalog>;
  selected: PreStockRow | null;
  spendUsdc: number;
  jupiterPrice: AdapterResult<JupiterTokenPrice>;
  jupiter: AdapterResult<JupiterQuote>;
  washOk: boolean;
  washNote: string;
  /** Assumed decimals when mint metadata is unknown — labeled. */
  assumedDecimals: number;
  note: string;
};

export type TesseraBundle = {
  catalog: AdapterResult<TesseraCatalog>;
  selected: TesseraTokenRow | null;
  spendUsdc: number;
  jupiterPrice: AdapterResult<JupiterTokenPrice>;
  jupiter: AdapterResult<JupiterQuote>;
  washOk: boolean;
  washNote: string;
  assumedDecimals: number;
  note: string;
};

/** PreStocks desk — PreStocks API only (Stocklana PreStocks bounty). */
export const getPreipoBundle = createServerFn({ method: "GET" })
  .validator(PreipoQuoteInput)
  .handler(async ({ data }): Promise<PreipoBundle> => {
    const catalog = await fetchPreStocksCatalog();
    const assumedDecimals = 9;
    if (!catalog.ok) {
      return {
        catalog,
        selected: null,
        spendUsdc: data.spendUsdc,
        jupiterPrice: unavailablePrice("prestocks_catalog_unavailable"),
        jupiter: errResult(
          "api.jup.ag/swap/v2/order",
          "prestocks_catalog_unavailable",
        ),
        washOk: false,
        washNote: "Catalog unavailable",
        assumedDecimals,
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
        catalog,
        selected: null,
        spendUsdc: data.spendUsdc,
        jupiterPrice: unavailablePrice("prestocks_empty"),
        jupiter: errResult("api.jup.ag/swap/v2/order", "prestocks_empty"),
        washOk: false,
        washNote: "No rows",
        assumedDecimals,
        note: catalog.data.note,
      };
    }

    const [jupiterPrice, jupiter, wash] = await Promise.all([
      fetchJupiterTokenPrice(selected.mint),
      fetchJupiterQuote({
        inputMint: USDC_MINT,
        outputMint: selected.mint,
        amountRaw: Math.round(data.spendUsdc * 1_000_000),
        slippageBps: 100,
        outputDecimals: assumedDecimals,
        inputDecimals: 6,
      }),
      evaluateWashGate({
        symbol: selected.symbol,
        mint: selected.mint,
        notionalUsd: data.spendUsdc,
      }),
    ]);
    const washOk = washAllowsSize(wash);
    return {
      catalog,
      selected,
      spendUsdc: data.spendUsdc,
      jupiterPrice,
      jupiter,
      washOk,
      washNote: wash.ok
        ? wash.data.notes.join("; ") || wash.mode
        : wash.reason,
      assumedDecimals,
      note: `${catalog.data.note} · decimals assumed ${assumedDecimals} until mint meta lands.`,
    };
  });

/** Tessera T-token desk — separate from PreStocks. */
export const getTesseraBundle = createServerFn({ method: "GET" })
  .validator(PreipoQuoteInput)
  .handler(async ({ data }): Promise<TesseraBundle> => {
    const catalog = await fetchTesseraCatalog();
    const assumedDecimals = 9;
    if (!catalog.ok) {
      return {
        catalog,
        selected: null,
        spendUsdc: data.spendUsdc,
        jupiterPrice: unavailablePrice("tessera_catalog_unavailable"),
        jupiter: errResult(
          "api.jup.ag/swap/v2/order",
          "tessera_catalog_unavailable",
        ),
        washOk: false,
        washNote: "Catalog unavailable",
        assumedDecimals,
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
        catalog,
        selected: null,
        spendUsdc: data.spendUsdc,
        jupiterPrice: unavailablePrice("tessera_empty"),
        jupiter: errResult("api.jup.ag/swap/v2/order", "tessera_empty"),
        washOk: false,
        washNote: "No rows",
        assumedDecimals,
        note: catalog.data.note,
      };
    }

    const [jupiterPrice, jupiter, wash] = await Promise.all([
      fetchJupiterTokenPrice(selected.mint),
      fetchJupiterQuote({
        inputMint: USDC_MINT,
        outputMint: selected.mint,
        amountRaw: Math.round(data.spendUsdc * 1_000_000),
        slippageBps: 100,
        outputDecimals: assumedDecimals,
        inputDecimals: 6,
      }),
      evaluateWashGate({
        symbol: selected.symbol,
        mint: selected.mint,
        notionalUsd: data.spendUsdc,
      }),
    ]);
    const washOk = washAllowsSize(wash);
    return {
      catalog,
      selected,
      spendUsdc: data.spendUsdc,
      jupiterPrice,
      jupiter,
      washOk,
      washNote: wash.ok
        ? wash.data.notes.join("; ") || wash.mode
        : wash.reason,
      assumedDecimals,
      note: `${catalog.data.note} · decimals assumed ${assumedDecimals}.`,
    };
  });
