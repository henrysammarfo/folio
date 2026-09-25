/**
 * Live markets board — multi-venue (Jupiter · free tape · Raydium · Solami when keyed).
 * Primary mark prefers Jupiter → Solami → free tape. Never invents prices.
 * Bounded concurrency + board TTL cache so 1k concurrent users share one build.
 * Partner lanes (PreStocks · Tessera) listed honestly — separate from xStock truth.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchXStockAsset } from "./adapters/xstocks";
import { fetchXStockUniverse } from "./adapters/xstocks-universe";
import { fetchPreStocksCatalog } from "./adapters/prestocks";
import { fetchTesseraCatalog } from "./adapters/tessera";
import {
  resolveMultiVenuePrice,
  type VenueQuote,
} from "./adapters/multi-venue";
import { cacheGet, cacheSet, cacheSingleflight } from "./adapters/ttl-cache";
import { DESK_SYNC } from "./desk-query-keys";
import {
  XSTOCK_CATALOG,
  type XStockCatalogItem,
  type XStockLane,
} from "./xstock-catalog";

export type MarketsLane = XStockLane | "preipo" | "tessera";

export type MarketsBoardRow = {
  symbol: string;
  name: string;
  underlying: string;
  lane: MarketsLane;
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
  /** Partner desks — buy path is /desk/preipo or /desk/tessera */
  deskPath?: "/desk/preipo" | "/desk/tessera";
};

export type MarketsBoardBundle = {
  rows: MarketsBoardRow[];
  asOf: string;
  note: string;
  /** Live Solana xStocks universe size (not just curated desk). */
  universeCount: number | null;
  partnerCounts: { preipo: number; tessera: number };
};

export type ScreenerRow = MarketsBoardRow;
export type ScreenerBundle = MarketsBoardBundle;

const BoardInput = z.object({
  lane: z
    .enum(["all", "mega", "ipo", "meme", "preipo", "tessera"])
    .default("all"),
});

function catalogSlice(lane: "all" | XStockLane): readonly XStockCatalogItem[] {
  if (lane === "all") return XSTOCK_CATALOG;
  return XSTOCK_CATALOG.filter((s) => s.lane === lane);
}

/** Cap parallel mint probes — avoids Jupiter 429 storms and Vercel timeouts. */
const MINT_CONCURRENCY = 4;

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

async function buildXStockRow(
  item: XStockCatalogItem,
): Promise<MarketsBoardRow> {
  const asset = await fetchXStockAsset(item.symbol);
  const mint = asset.ok ? asset.data.solanaMint : null;
  const logo = asset.ok ? asset.data.logo : null;
  const openNow = asset.ok ? asset.data.openNow : null;
  const tradingPeriod = asset.ok ? asset.data.tradingPeriod : null;

  const base = {
    symbol: item.symbol,
    name: item.name,
    underlying: item.underlying,
    lane: item.lane as MarketsLane,
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

async function buildPartnerRows(
  lane: "preipo" | "tessera" | "all",
): Promise<{
  rows: MarketsBoardRow[];
  counts: { preipo: number; tessera: number };
}> {
  const wantPre = lane === "all" || lane === "preipo";
  const wantTes = lane === "all" || lane === "tessera";
  const [pre, tes] = await Promise.all([
    wantPre ? fetchPreStocksCatalog() : Promise.resolve(null),
    wantTes ? fetchTesseraCatalog() : Promise.resolve(null),
  ]);
  const rows: MarketsBoardRow[] = [];
  const counts = { preipo: 0, tessera: 0 };

  if (pre?.ok) {
    counts.preipo = pre.data.rows.length;
    for (const r of pre.data.rows) {
      rows.push({
        symbol: r.symbol,
        name: r.name || r.symbol,
        underlying: r.symbol,
        lane: "preipo",
        buyable: Boolean(r.mint),
        logo: r.image ?? null,
        mint: r.mint,
        usdPrice: r.tokenPrice ?? r.markPrice ?? null,
        stockRefPrice: r.markPrice ?? null,
        liquidity: null,
        priceNote: "PreStocks mark · buy on Pre-IPO desk",
        venues: [],
        openNow: null,
        tradingPeriod: null,
        deskPath: "/desk/preipo",
        blurb: "SPV-backed private exposure — not Scaled UI equity",
      });
    }
  }

  if (tes?.ok) {
    counts.tessera = tes.data.rows.length;
    for (const r of tes.data.rows) {
      rows.push({
        symbol: r.symbol,
        name: r.name || r.symbol,
        underlying: r.code || r.symbol,
        lane: "tessera",
        buyable: Boolean(r.mint),
        logo: null,
        mint: r.mint,
        usdPrice: r.markPrice ?? null,
        stockRefPrice: r.markPrice ?? null,
        liquidity: null,
        priceNote: "Tessera mark · buy on T-tokens desk",
        venues: [],
        openNow: null,
        tradingPeriod: null,
        deskPath: "/desk/tessera",
        blurb: "Loan-participation T-token — not share equity",
      });
    }
  }

  return { rows, counts };
}

async function buildBoard(
  lane: z.infer<typeof BoardInput>["lane"],
): Promise<MarketsBoardBundle> {
  const cacheKey = `markets-board:${lane}`;
  const hit = cacheGet<MarketsBoardBundle>(cacheKey);
  if (hit) return hit.value;

  return cacheSingleflight(cacheKey, async () => {
    const again = cacheGet<MarketsBoardBundle>(cacheKey);
    if (again) return again.value;

    const universeP = fetchXStockUniverse();
    const partnersP = buildPartnerRows(
      lane === "preipo" || lane === "tessera" || lane === "all"
        ? lane
        : "all",
    );

    let xRows: MarketsBoardRow[] = [];
    if (lane === "all" || lane === "mega" || lane === "ipo" || lane === "meme") {
      const slice = catalogSlice(lane === "all" ? "all" : lane);
      xRows = await mapPool(slice, MINT_CONCURRENCY, (item) =>
        buildXStockRow(item),
      );
    }

    const [universe, partners] = await Promise.all([universeP, partnersP]);
    const partnerRows =
      lane === "mega" || lane === "ipo" || lane === "meme"
        ? []
        : partners.rows.filter((r) =>
            lane === "all" ? true : r.lane === lane,
          );

    const rows = [...xRows, ...partnerRows];
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
    const universeCount = universe.ok ? universe.data.count : null;
    const paceNote = [
      universeCount != null ? `${universeCount} Solana xStocks live` : null,
      partners.counts.preipo
        ? `${partners.counts.preipo} PreStocks`
        : null,
      partners.counts.tessera
        ? `${partners.counts.tessera} Tessera`
        : null,
      freeTape > 0 ? `${freeTape} free-tape` : null,
      solami > 0 ? `${solami} Solami` : null,
      priced < rows.filter((r) => r.buyable && r.lane !== "preipo" && r.lane !== "tessera").length
        ? "some marks still loading"
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const bundle: MarketsBoardBundle = {
      rows,
      asOf: new Date().toISOString(),
      universeCount,
      partnerCounts: partners.counts,
      note: anyOpen
        ? `Session open · multi-venue marks (${liveVenues} live reads)${paceNote ? ` · ${paceNote}` : ""}`
        : `Session closed · Solana venues still quote 24/7 (${liveVenues} live reads)${paceNote ? ` · ${paceNote}` : ""}`,
    };
    cacheSet(cacheKey, bundle, DESK_SYNC.boardTtlMs);
    return bundle;
  });
}

export const getMarketsBoard = createServerFn({ method: "GET" })
  .validator(BoardInput)
  .handler(async ({ data }): Promise<MarketsBoardBundle> => {
    return buildBoard(data.lane);
  });

export const getScreenerBundle = getMarketsBoard;
