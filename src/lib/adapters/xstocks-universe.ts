/**
 * Live xStocks universe (paginated api.xstocks.fi) — long TTL so 1k concurrent
 * desk users share one process cache instead of re-walking every page.
 * Fail-closed: empty/unavailable never invents symbols.
 */

import { errResult, okResult, type AdapterResult } from "./types";
import { cacheGet, cacheSet, cacheSingleflight } from "./ttl-cache";
import { DESK_SYNC } from "../desk-query-keys";

const XSTOCKS_BASE = "https://api.xstocks.fi/api/v2/public";
const CACHE_KEY = "xstocks:universe:solana";

export type XStockUniverseRow = {
  symbol: string;
  name: string;
  underlying: string;
  mint: string | null;
  logo: string | null;
};

export type XStockUniverse = {
  rows: XStockUniverseRow[];
  count: number;
  source: string;
  asOf: string;
};

function solanaMint(raw: Record<string, unknown>): string | null {
  const deps = raw["deployments"];
  if (Array.isArray(deps)) {
    for (const d of deps) {
      if (!d || typeof d !== "object") continue;
      const row = d as Record<string, unknown>;
      const net = String(row["network"] ?? "").toLowerCase();
      if (net !== "solana") continue;
      const addr = row["address"] ?? row["mint"];
      if (typeof addr === "string" && addr.length >= 32) return addr;
    }
  }
  const direct = raw["solanaMint"] ?? raw["mint"];
  return typeof direct === "string" && direct.length >= 32 ? direct : null;
}

function parseNode(raw: Record<string, unknown>): XStockUniverseRow | null {
  const symbol = typeof raw["symbol"] === "string" ? raw["symbol"].trim() : "";
  if (!symbol) return null;
  const name =
    typeof raw["name"] === "string" && raw["name"].trim()
      ? raw["name"].trim()
      : symbol;
  const underlying =
    typeof raw["underlyingSymbol"] === "string" && raw["underlyingSymbol"]
      ? raw["underlyingSymbol"]
      : symbol.replace(/x$/i, "");
  const logo = typeof raw["logo"] === "string" ? raw["logo"] : null;
  return {
    symbol,
    name,
    underlying,
    mint: solanaMint(raw),
    logo,
  };
}

async function fetchAllPages(): Promise<XStockUniverseRow[]> {
  const out: XStockUniverseRow[] = [];
  let page = 0;
  for (let i = 0; i < 40; i += 1) {
    const url = `${XSTOCKS_BASE}/assets?network=Solana&page=${page}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "FOLIO/1.0" },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      throw new Error(`xstocks_universe_http_${res.status}`);
    }
    const body = (await res.json()) as {
      nodes?: Record<string, unknown>[];
      page?: { currentPage?: number; hasNextPage?: boolean };
    };
    const nodes = body.nodes ?? [];
    for (const n of nodes) {
      const row = parseNode(n);
      if (row) out.push(row);
    }
    if (!body.page?.hasNextPage) break;
    page = (body.page.currentPage ?? page) + 1;
  }
  return out;
}

export async function fetchXStockUniverse(): Promise<
  AdapterResult<XStockUniverse>
> {
  const source = "api.xstocks.fi/assets?network=Solana";
  const hit = cacheGet<AdapterResult<XStockUniverse>>(CACHE_KEY);
  if (hit) return hit.value;

  return cacheSingleflight(CACHE_KEY, async () => {
    const again = cacheGet<AdapterResult<XStockUniverse>>(CACHE_KEY);
    if (again) return again.value;
    try {
      const rows = await fetchAllPages();
      if (rows.length === 0) {
        return errResult(source, "xstocks_universe_empty", "No Solana assets");
      }
      const result = okResult("mainnet-read", source, {
        rows,
        count: rows.length,
        source,
        asOf: new Date().toISOString(),
      } satisfies XStockUniverse);
      cacheSet(CACHE_KEY, result, DESK_SYNC.universeTtlMs);
      return result;
    } catch (e) {
      return errResult(
        source,
        "xstocks_universe_fetch_failed",
        String(e instanceof Error ? e.message : e),
      );
    }
  });
}
