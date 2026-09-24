/**
 * Live markets board — Jupiter venue prices + free-tape fallback when Jupiter cools.
 * Not a Finviz clone; desk-native board for the catalog we actually trade.
 *
 * Price fetches are staggered (not Promise.all) to avoid Jupiter 429 storms.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchGeckoTerminalTokenPrice } from "./adapters/gecko-price";
import { fetchXStockAsset } from "./adapters/xstocks";
import { fetchJupiterTokenPrice } from "./adapters/jupiter";
import {
  XSTOCK_CATALOG,
  type XStockCatalogItem,
  type XStockLane,
} from "./xstock-catalog";

export type MarketsBoardRow = {
  symbol: string;
  name: string;
  underlying: string;
  lane: XStockLane;
  buyable: boolean;
  blurb?: string;
  logo: string | null;
  mint: string | null;
  usdPrice: number | null;
  stockRefPrice: number | null;
  liquidity: number | null;
  priceNote: string;
  /** From xStocks trading.openNow when asset loads. */
  openNow: boolean | null;
  tradingPeriod: string | null;
};

export type MarketsBoardBundle = {
  rows: MarketsBoardRow[];
  asOf: string;
  note: string;
};

/** @deprecated alias while exports settle */
export type ScreenerRow = MarketsBoardRow;
export type ScreenerBundle = MarketsBoardBundle;

const BoardInput = z.object({
  lane: z.enum(["all", "mega", "ipo", "meme"]).default("all"),
});

function catalogSlice(lane: "all" | XStockLane): readonly XStockCatalogItem[] {
  if (lane === "all") return XSTOCK_CATALOG;
  return XSTOCK_CATALOG.filter((s) => s.lane === lane);
}

const PRICE_STAGGER_MS = 70;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function mapStaggered<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
  gapMs: number,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0 && gapMs > 0) await sleep(gapMs);
    out.push(await fn(items[i]!, i));
  }
  return out;
}

async function resolveVenuePrice(mint: string): Promise<{
  usdPrice: number;
  stockRefPrice: number | null;
  liquidity: number | null;
  priceNote: string;
} | null> {
  const jup = await fetchJupiterTokenPrice(mint);
  if (jup.ok) {
    return {
      usdPrice: jup.data.usdPrice,
      stockRefPrice: jup.data.stockRefPrice,
      liquidity: jup.data.liquidity,
      priceNote: jup.source.includes("stale")
        ? "stale · Jupiter"
        : jup.source.includes("cached")
          ? "cached · Jupiter"
          : "live · Jupiter",
    };
  }
  // Free-tape fallback when Jupiter cools / misses — labeled, never invented
  const gecko = await fetchGeckoTerminalTokenPrice(mint);
  if (gecko.ok) {
    return {
      usdPrice: gecko.data.usdPrice,
      stockRefPrice: null,
      liquidity: gecko.data.liquidity,
      priceNote: "live · free tape",
    };
  }
  return null;
}

export const getMarketsBoard = createServerFn({ method: "GET" })
  .validator(BoardInput)
  .handler(async ({ data }): Promise<MarketsBoardBundle> => {
    const slice = catalogSlice(data.lane);
    const rows: MarketsBoardRow[] = await mapStaggered(
      slice,
      async (item) => {
        const asset = await fetchXStockAsset(item.symbol);
        const mint = asset.ok ? asset.data.solanaMint : null;
        const logo = asset.ok ? asset.data.logo : null;
        const openNow = asset.ok ? asset.data.openNow : null;
        const tradingPeriod = asset.ok ? asset.data.tradingPeriod : null;

        const base = {
          symbol: item.symbol,
          name: item.name,
          underlying: item.underlying,
          lane: item.lane,
          buyable: item.buyable,
          logo,
          mint,
          openNow,
          tradingPeriod,
          ...(item.blurb ? { blurb: item.blurb } : {}),
        };

        if (!mint || !item.buyable) {
          return {
            ...base,
            usdPrice: null,
            stockRefPrice: null,
            liquidity: null,
            priceNote: !item.buyable
              ? "Watchlist"
              : asset.ok
                ? "Mint missing"
                : asset.reason,
          };
        }

        const venue = await resolveVenuePrice(mint);
        if (!venue) {
          return {
            ...base,
            usdPrice: null,
            stockRefPrice: null,
            liquidity: null,
            priceNote: "Venue cooling — refresh soon",
          };
        }

        return {
          ...base,
          usdPrice: venue.usdPrice,
          stockRefPrice: venue.stockRefPrice,
          liquidity: venue.liquidity,
          priceNote: venue.priceNote,
        };
      },
      PRICE_STAGGER_MS,
    );

    const priced = rows.filter((r) => r.usdPrice != null).length;
    const freeTape = rows.filter((r) => /free tape/i.test(r.priceNote)).length;
    const anyOpen = rows.some((r) => r.openNow === true);
    const paceNote =
      freeTape > 0
        ? ` · ${freeTape} via free tape (Jupiter cool)`
        : priced < rows.filter((r) => r.buyable).length
          ? " · some venues still loading"
          : "";
    return {
      rows,
      asOf: new Date().toISOString(),
      note: anyOpen
        ? `Session open · Jupiter + free-tape venues (24/7 on Solana)${paceNote}`
        : `Session closed · Solana venues still quote 24/7${paceNote}`,
    };
  });

/** Keep old export name for any mid-WIP imports. */
export const getScreenerBundle = getMarketsBoard;
