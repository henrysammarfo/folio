import { errResult, okResult, type AdapterResult } from "./types";

const HERMES = "https://hermes.pyth.network";

/** Known Pyth equity price-feed IDs (Hermes search 2026-09-15). */
const EQUITY_FEED_IDS: Record<string, string> = {
  AAPL: "49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688",
};

export type PythPrice = {
  underlying: string;
  feedId: string;
  price: number;
  conf: number;
  expo: number;
  publishTime: number;
};

export type DivergeCheck = {
  left: number;
  right: number;
  divergeBps: number;
  bandBps: number;
  pass: boolean;
};

async function resolveFeedId(underlying: string): Promise<string | null> {
  if (EQUITY_FEED_IDS[underlying]) return EQUITY_FEED_IDS[underlying];
  try {
    const url = `${HERMES}/v2/price_feeds?query=${encodeURIComponent(underlying)}&asset_type=equity`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;
    const feeds = (await res.json()) as Array<{
      id?: string;
      attributes?: { display_symbol?: string; base?: string };
    }>;
    const hit =
      feeds.find((f) => f.attributes?.display_symbol === underlying) ||
      feeds.find((f) => f.attributes?.base === underlying) ||
      feeds[0];
    return hit?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Hermes `/v2/updates/price/latest` returned HTTP 401 from this egress on 2026-09-15
 * while `/v2/price_feeds` still worked. We fail-closed (no fake price).
 */
export async function fetchPythEquityPrice(
  underlying: string,
): Promise<AdapterResult<PythPrice>> {
  const source = "hermes.pyth.network";
  try {
    const feedId = await resolveFeedId(underlying);
    if (!feedId) return errResult(source, "pyth_feed_not_found", underlying);

    const url = `${HERMES}/v2/updates/price/latest?ids[]=${feedId}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return errResult(
        source,
        res.status === 401 ? "pyth_hermes_unauthorized" : "pyth_http_error",
        `HTTP ${res.status} ${body.slice(0, 120)}`,
      );
    }

    const json = (await res.json()) as {
      parsed?: Array<{
        price?: { price?: string; conf?: string; expo?: number; publish_time?: number };
      }>;
    };
    const p = json.parsed?.[0]?.price;
    if (!p?.price || typeof p.expo !== "number") {
      return errResult(source, "pyth_malformed");
    }
    const price = Number(p.price) * 10 ** p.expo;
    const conf = Number(p.conf ?? "0") * 10 ** p.expo;
    if (!Number.isFinite(price) || price <= 0) {
      return errResult(source, "pyth_invalid_price");
    }
    return okResult("mainnet-read", source, {
      underlying,
      feedId,
      price,
      conf,
      expo: p.expo,
      publishTime: p.publish_time ?? 0,
    });
  } catch (e) {
    return errResult(source, "pyth_fetch_failed", String(e));
  }
}

export function divergeBps(left: number, right: number, bandBps = 50): DivergeCheck {
  const mid = (left + right) / 2;
  const bps = mid > 0 ? (Math.abs(left - right) / mid) * 10_000 : Number.POSITIVE_INFINITY;
  return {
    left,
    right,
    divergeBps: bps,
    bandBps,
    pass: Number.isFinite(bps) && bps <= bandBps,
  };
}