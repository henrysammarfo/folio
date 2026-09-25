/**
 * Live markets board — multi-venue (Jupiter · free tape · Raydium · Solami when keyed).
 * Primary mark prefers Jupiter → Solami → free tape. Never invents prices.
 * Bounded concurrency (not full serial) so Vercel loaders stay under timeout.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchXStockAsset } from "./adapters/xstocks";
import {
  resolveMultiVenuePrice,
  type VenueQuote,
} from "./adapters/multi-venue";
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
  venues: VenueQuote[];
  openNow: boolean | null;
  tradingPeriod: string | null;
};

export type MarketsBoardBundle = {
  rows: MarketsBoardRow[];
  asOf: string;
  note: string;
};

export type ScreenerRow = MarketsBoardRow;
export type ScreenerBundle = MarketsBoardBundle;

const BoardInput = z.object({
  lane: z.enum(["all", "mega", "ipo", "meme"]).default("all"),
});

function catalogSlice(lane: "all" | XStockLane): readonly XStockCatalogItem[] {
  if (lane === "all") return XSTOCK_CATALOG;
  return XSTOCK_CATALOG.filter((s) => s.lane === lane);
}

/** Cap parallel mint probes — avoids Jupiter 429 storms and Vercel timeouts. */
const MINT_CONCURRENCY = 3;

async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]!, i);
    }
  }
  const n = Math.min(concurrency, Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

async function buildRow(item: XStockCatalogItem): Promise<MarketsBoardRow> {
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
      venues: [],
    };
  }

  const multi = await resolveMultiVenuePrice(mint);
  if (!multi.primary) {
    return {
      ...base,
      usdPrice: null,
      stockRefPrice: null,
      liquidity: null,
      priceNote: "Venues cooling — refresh soon",
      venues: multi.venues,
    };
  }

  return {
    ...base,
    usdPrice: multi.primary.usdPrice,
    stockRefPrice: multi.primary.stockRefPrice,
    liquidity: multi.primary.liquidity,
    priceNote: multi.primary.priceNote,
    venues: multi.venues,
  };
}

export const getMarketsBoard = createServerFn({ method: "GET" })
  .validator(BoardInput)
  .handler(async ({ data }): Promise<MarketsBoardBundle> => {
    const slice = catalogSlice(data.lane);
    const rows = await mapPool(slice, MINT_CONCURRENCY, (item) => buildRow(item));

    const priced = rows.filter((r) => r.usdPrice != null).length;
    const liveVenues = rows.reduce(
      (n, r) =>
        n +
        r.venues.filter((v) => v.status === "live" || v.status === "cached")
          .length,
      0,
    );
    const freeTape = rows.filter((r) =>
      r.venues.some((v) => v.id === "free-tape" && v.usdPrice != null),
    ).length;
    const solami = rows.filter((r) =>
      r.venues.some((v) => v.id === "solami" && v.usdPrice != null),
    ).length;
    const anyOpen = rows.some((r) => r.openNow === true);
    const paceNote = [
      freeTape > 0 ? `${freeTape} free-tape` : null,
      solami > 0 ? `${solami} Solami` : null,
      priced < rows.filter((r) => r.buyable).length
        ? "some marks still loading"
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      rows,
      asOf: new Date().toISOString(),
      note: anyOpen
        ? `Session open · multi-venue marks (${liveVenues} live reads)${paceNote ? ` · ${paceNote}` : ""}`
        : `Session closed · Solana venues still quote 24/7 (${liveVenues} live reads)${paceNote ? ` · ${paceNote}` : ""}`,
    };
  });

export const getScreenerBundle = getMarketsBoard;
