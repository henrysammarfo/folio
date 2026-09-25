/**
 * Live markets board — multi-venue for curated desk + Jupiter batch for full universe.
 * Never invents prices. Board TTL + singleflight so 1k concurrent users share one build.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchXStockAsset } from "./adapters/xstocks";
import { fetchXStockUniverse } from "./adapters/xstocks-universe";
import { fetchPreStocksCatalog } from "./adapters/prestocks";
import { fetchTesseraCatalog } from "./adapters/tessera";
import {
  fetchJupiterTokenPricesBatch,
  type JupiterTokenPrice,
} from "./adapters/jupiter";
import {
  resolveMultiVenuePrice,
  type VenueQuote,
} from "./adapters/multi-venue";
import { cacheGet, cacheSet, cacheSingleflight } from "./adapters/ttl-cache";
import type { AdapterResult } from "./adapters/types";
import { DESK_SYNC } from "./desk-query-keys";
import {
  XSTOCK_CATALOG,
  type XStockCatalogItem,
  type XStockLane,
} from "./xstock-catalog";

export type MarketsLane = XStockLane | "preipo" | "tessera" | "universe";

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
  deskPath?: "/desk/preipo" | "/desk/tessera";
  /** venue = Jupiter usdPrice · stock-ref = stockData only */
  priceKind?: "venue" | "stock-ref" | "multi";
};

export type MarketsBoardBundle = {
  rows: MarketsBoardRow[];
  asOf: string;
  note: string;
  universeCount: number | null;
  pricedCount: number;
  partnerCounts: { preipo: number; tessera: number };
};

export type ScreenerRow = MarketsBoardRow;
export type ScreenerBundle = MarketsBoardBundle;

const BoardInput = z.object({
  lane: z
    .enum(["all", "mega", "ipo", "meme", "preipo", "tessera", "universe"])
    .default("all"),
  /** Case-insensitive filter against symbol/name/underlying (universe + all). */
  q: z.string().max(48).optional(),
});

function catalogSlice(lane: "all" | XStockLane): readonly XStockCatalogItem[] {
  if (lane === "all") return XSTOCK_CATALOG;
  return XSTOCK_CATALOG.filter((s) => s.lane === lane);
}

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

async function buildCuratedRow(
  item: XStockCatalogItem,
): Promise<MarketsBoardRow> {
  const asset = await fetchXStockAsset(item.symbol);
  const mint = asset.ok ? asset.data.solanaMint : null;
  const logo = asset.ok ? asset.data.logo : null;
  const openNow = asset.ok ? asset.data.openNow : null;
  const tradingPeriod = asset.ok ? asset.data.tradingPeriod : null;

  const base: MarketsBoardRow = {
    symbol: item.symbol,
    name: item.name,
    underlying: item.underlying,
    lane: item.lane,
    buyable: item.buyable,
    logo,
    mint,
    openNow,
    tradingPeriod,
    usdPrice: null,
    stockRefPrice: null,
    liquidity: null,
    priceNote: !item.buyable
      ? "Watchlist"
      : asset.ok
        ? "Mint missing"
        : asset.reason,
    venues: [],
    ...(item.blurb ? { blurb: item.blurb } : {}),
  };

  if (!mint || !item.buyable) return base;

  const multi = await resolveMultiVenuePrice(mint);
  if (!multi.primary) {
    return {
      ...base,
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
    priceKind: "multi",
  };
}

function priceFromJup(
  hit: AdapterResult<JupiterTokenPrice> | undefined,
): Pick<
  MarketsBoardRow,
  "usdPrice" | "stockRefPrice" | "liquidity" | "priceNote" | "priceKind" | "venues"
> {
  if (!hit?.ok) {
    return {
      usdPrice: null,
      stockRefPrice: null,
      liquidity: null,
      priceNote: hit && !hit.ok ? hit.reason : "Mark pending",
      venues: [],
    };
  }
  const kind = hit.data.priceKind ?? "venue";
  return {
    usdPrice: hit.data.usdPrice,
    stockRefPrice: hit.data.stockRefPrice,
    liquidity: hit.data.liquidity,
    priceKind: kind,
    priceNote:
      kind === "venue"
        ? "Jupiter venue mark"
        : "xStocks stockData mark · no venue usdPrice",
    venues: [
      {
        id: "jupiter",
        label: "Jupiter",
        status: hit.source.includes("cached") ? "cached" : "live",
        usdPrice: hit.data.usdPrice,
        liquidity: hit.data.liquidity,
        note: kind === "venue" ? "Batch venue" : "Batch stock-ref",
      },
    ],
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

function matchesQuery(
  row: { symbol: string; name: string; underlying: string },
  q: string | undefined,
): boolean {
  if (!q?.trim()) return true;
  const needle = q.trim().toLowerCase();
  return (
    row.symbol.toLowerCase().includes(needle) ||
    row.name.toLowerCase().includes(needle) ||
    row.underlying.toLowerCase().includes(needle)
  );
}

async function buildUniverseRows(opts: {
  q?: string;
  /** When true, skip symbols already in curated catalog. */
  excludeCurated: boolean;
}): Promise<{ rows: MarketsBoardRow[]; universeCount: number | null }> {
  const universe = await fetchXStockUniverse();
  if (!universe.ok) {
    return { rows: [], universeCount: null };
  }
  const curated = new Set(XSTOCK_CATALOG.map((c) => c.symbol.toUpperCase()));
  let slice = universe.data.rows.filter((r) => {
    if (opts.excludeCurated && curated.has(r.symbol.toUpperCase())) return false;
    return matchesQuery(r, opts.q);
  });

  // Full universe when no search; search can still be large — hard cap display paid rows.
  const CAP = opts.q?.trim() ? 400 : 1124;
  slice = slice.slice(0, CAP);

  const mints = slice.map((r) => r.mint).filter((m): m is string => Boolean(m));
  // Chunk work via batch helper (internal 50) — call once for all mints.
  const prices = await fetchJupiterTokenPricesBatch(mints);

  const rows: MarketsBoardRow[] = slice.map((r) => {
    const priced = r.mint ? prices.get(r.mint) : undefined;
    const mark = priceFromJup(priced);
    return {
      symbol: r.symbol,
      name: r.name,
      underlying: r.underlying,
      lane: "universe" as const,
      buyable: Boolean(r.mint),
      logo: r.logo,
      mint: r.mint,
      openNow: null,
      tradingPeriod: null,
      ...mark,
    };
  });

  return { rows, universeCount: universe.data.count };
}

async function buildBoard(
  lane: z.infer<typeof BoardInput>["lane"],
  q?: string,
): Promise<MarketsBoardBundle> {
  const cacheKey = `markets-board:v2:${lane}:${(q ?? "").trim().toLowerCase()}`;
  const hit = cacheGet<MarketsBoardBundle>(cacheKey);
  if (hit) return hit.value;

  return cacheSingleflight(cacheKey, async () => {
    const again = cacheGet<MarketsBoardBundle>(cacheKey);
    if (again) return again.value;

    const partnersP = buildPartnerRows(
      lane === "preipo" || lane === "tessera" || lane === "all"
        ? lane
        : "all",
    );

    let rows: MarketsBoardRow[] = [];
    let universeCount: number | null = null;

    if (lane === "universe") {
      const u = await buildUniverseRows({
        ...(q ? { q } : {}),
        excludeCurated: false,
      });
      rows = u.rows;
      universeCount = u.universeCount;
    } else if (
      lane === "all" ||
      lane === "mega" ||
      lane === "ipo" ||
      lane === "meme"
    ) {
      const slice = catalogSlice(lane === "all" ? "all" : lane).filter((r) =>
        matchesQuery(r, q),
      );
      const curated = await mapPool(slice, MINT_CONCURRENCY, (item) =>
        buildCuratedRow(item),
      );
      rows = [...curated];

      if (lane === "all") {
        // Full Solana universe marks (batch) excluding curated duplicates.
        const u = await buildUniverseRows({
          ...(q ? { q } : {}),
          excludeCurated: true,
        });
        universeCount = u.universeCount;
        rows = [...rows, ...u.rows];
      } else {
        const uni = await fetchXStockUniverse();
        universeCount = uni.ok ? uni.data.count : null;
      }
    }

    const partners = await partnersP;
    const partnerRows =
      lane === "mega" ||
      lane === "ipo" ||
      lane === "meme" ||
      lane === "universe"
        ? []
        : partners.rows.filter(
            (r) =>
              (lane === "all" ? true : r.lane === lane) &&
              matchesQuery(r, q),
          );

    rows = [...rows, ...partnerRows];
    const pricedCount = rows.filter((r) => r.usdPrice != null).length;
    const liveVenues = rows.reduce(
      (n, r) =>
        n +
        r.venues.filter((v) => v.status === "live" || v.status === "cached")
          .length,
      0,
    );
    const anyOpen = rows.some((r) => r.openNow === true);
    const paceNote = [
      universeCount != null
        ? `${universeCount.toLocaleString()} Solana xStocks live`
        : null,
      `${pricedCount} priced`,
      partners.counts.preipo
        ? `${partners.counts.preipo} PreStocks`
        : null,
      partners.counts.tessera
        ? `${partners.counts.tessera} Tessera`
        : null,
      liveVenues > 0 ? `${liveVenues} venue reads` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const bundle: MarketsBoardBundle = {
      rows,
      asOf: new Date().toISOString(),
      universeCount,
      pricedCount,
      partnerCounts: partners.counts,
      note: anyOpen
        ? `Session open · ${paceNote}`
        : `Session closed · Solana marks still quote 24/7 · ${paceNote}`,
    };
    cacheSet(cacheKey, bundle, DESK_SYNC.boardTtlMs);
    return bundle;
  });
}

export const getMarketsBoard = createServerFn({ method: "GET" })
  .validator(BoardInput)
  .handler(async ({ data }): Promise<MarketsBoardBundle> => {
    return buildBoard(data.lane, data.q);
  });

export const getScreenerBundle = getMarketsBoard;
