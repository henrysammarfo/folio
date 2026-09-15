import { errResult, okResult, type AdapterResult } from "./types";

/** Legacy public host — price updates require auth after Pyth Core upgrade (2026-08-26). */
const HERMES_LEGACY = "https://hermes.pyth.network";
/** Upgraded Hermes base (docs: pyth.dourolabs.app/hermes). */
const HERMES_UPGRADED = "https://pyth.dourolabs.app/hermes";

/**
 * Equity.US.* feed IDs (Hermes catalog 2026-09-15).
 * Stocklana Pyth bounty calls out Equity.US.AAPL/USD explicitly.
 */
const EQUITY_US_FEED_IDS: Record<string, string> = {
  AAPL: "49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688",
  NVDA: "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593",
  TSLA: "16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1",
};

/**
 * Crypto.{SYM}X/USD xStock feeds (Hermes catalog 2026-09-15).
 * Used as a labeled secondary reference alongside Equity.US — not a solo gate.
 */
const XSTOCK_USD_FEED_IDS: Record<string, string> = {
  AAPLX: "978e6cc68a119ce066aa830017318563a9ed04ec3a0a6439010fc11296a58675",
  NVDAX: "4244d07890e4610f46bbde67de8f43a4bf8b569eebe904f136b469f148503b7f",
  TSLAX: "47a156470288850a440df3a6ce85a55917b813a19bb5b31128a33a986566a362",
};

export type PythPrice = {
  underlying: string;
  feedId: string;
  /** Hermes symbol when known (e.g. Equity.US.AAPL/USD, Crypto.AAPLX/USD). */
  feedSymbol: string | null;
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

export function pythApiKeyPresent(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (env["PYTH_API_KEY"]?.trim().length ?? 0) > 0;
}

/** Known Equity.US feed id for an underlying ticker — null if unmapped. */
export function equityUsFeedId(underlying: string): string | null {
  return EQUITY_US_FEED_IDS[underlying.toUpperCase()] ?? null;
}

/** Known Crypto.{SYM}X/USD feed id for an xStock symbol (AAPLx → AAPLX). */
export function xStockUsdFeedId(xSymbol: string): string | null {
  const key = xSymbol.replace(/x$/i, "X").toUpperCase();
  const normalized = key.endsWith("X") ? key : `${key}X`;
  return XSTOCK_USD_FEED_IDS[normalized] ?? null;
}

function hermesAuthHeaders(apiKey: string): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-API-Key": apiKey,
  };
}

async function resolveEquityFeedId(
  underlying: string,
  apiKey: string | null,
): Promise<{ feedId: string; feedSymbol: string | null } | null> {
  const mapped = equityUsFeedId(underlying);
  if (mapped) {
    return { feedId: mapped, feedSymbol: `Equity.US.${underlying.toUpperCase()}/USD` };
  }
  try {
    // Catalog search still works unauthenticated on the legacy host.
    const url = `${HERMES_LEGACY}/v2/price_feeds?query=${encodeURIComponent(underlying)}&asset_type=equity`;
    const res = await fetch(url, {
      headers: apiKey ? hermesAuthHeaders(apiKey) : { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const feeds = (await res.json()) as Array<{
      id?: string;
      attributes?: {
        display_symbol?: string;
        base?: string;
        symbol?: string;
      };
    }>;
    const equityUs = feeds.find((f) =>
      (f.attributes?.symbol ?? "").startsWith("Equity.US."),
    );
    const hit =
      equityUs ||
      feeds.find((f) => f.attributes?.display_symbol === underlying) ||
      feeds.find((f) => f.attributes?.base === underlying) ||
      feeds[0];
    if (!hit?.id) return null;
    return {
      feedId: hit.id,
      feedSymbol: hit.attributes?.symbol ?? null,
    };
  } catch {
    return null;
  }
}

async function fetchHermesLatest(
  feedId: string,
  apiKey: string,
  meta: { underlying: string; feedSymbol: string | null },
): Promise<AdapterResult<PythPrice>> {
  const path = `/v2/updates/price/latest?ids[]=${feedId}`;
  const bases = [HERMES_UPGRADED, HERMES_LEGACY];
  let lastDetail = "";

  for (const base of bases) {
    const source = base.replace(/^https:\/\//, "");
    const res = await fetch(`${base}${path}`, {
      headers: hermesAuthHeaders(apiKey),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      lastDetail = `HTTP ${res.status} ${body.slice(0, 120)}`;
      if (res.status === 401 || res.status === 403) {
        return errResult(source, "pyth_hermes_unauthorized", lastDetail);
      }
      continue;
    }

    const json = (await res.json()) as {
      parsed?: Array<{
        price?: {
          price?: string;
          conf?: string;
          expo?: number;
          publish_time?: number;
        };
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
      underlying: meta.underlying,
      feedId,
      feedSymbol: meta.feedSymbol,
      price,
      conf,
      expo: p.expo,
      publishTime: p.publish_time ?? 0,
    });
  }

  return errResult(
    "hermes.pyth.network",
    "pyth_http_error",
    lastDetail || "All Hermes hosts failed",
  );
}

/**
 * Hermes Equity.US price — Stocklana Pyth bounty primary reference.
 * Fail-closed without `PYTH_API_KEY` (Aug 2026 Core upgrade).
 */
export async function fetchPythEquityPrice(
  underlying: string,
): Promise<AdapterResult<PythPrice>> {
  const apiKey = process.env["PYTH_API_KEY"]?.trim() || null;
  if (!apiKey) {
    return errResult(
      "hermes.pyth.network",
      "pyth_api_key_missing",
      "PYTH_API_KEY required for Hermes price updates (fail-closed). Catalog search alone is not a price.",
    );
  }

  try {
    const resolved = await resolveEquityFeedId(underlying, apiKey);
    if (!resolved) {
      return errResult("hermes.pyth.network", "pyth_feed_not_found", underlying);
    }
    return fetchHermesLatest(resolved.feedId, apiKey, {
      underlying,
      feedSymbol: resolved.feedSymbol,
    });
  } catch (e) {
    return errResult("hermes.pyth.network", "pyth_fetch_failed", String(e));
  }
}

/**
 * Hermes Crypto.{SYM}X/USD — labeled secondary xStock reference.
 * Does not alone score acquire diverge; pairs with Equity.US for bounty honesty.
 */
export async function fetchPythXStockUsdPrice(
  xSymbol: string,
): Promise<AdapterResult<PythPrice>> {
  const apiKey = process.env["PYTH_API_KEY"]?.trim() || null;
  if (!apiKey) {
    return errResult(
      "hermes.pyth.network",
      "pyth_api_key_missing",
      "PYTH_API_KEY required for Hermes Crypto.xStock USD updates (fail-closed).",
    );
  }

  const feedId = xStockUsdFeedId(xSymbol);
  if (!feedId) {
    return errResult(
      "hermes.pyth.network",
      "pyth_xstock_feed_unmapped",
      `No Crypto.*X/USD map for ${xSymbol}`,
    );
  }

  const key = xSymbol.replace(/x$/i, "X").toUpperCase();
  const normalized = key.endsWith("X") ? key : `${key}X`;
  try {
    return await fetchHermesLatest(feedId, apiKey, {
      underlying: normalized,
      feedSymbol: `Crypto.${normalized}/USD`,
    });
  } catch (e) {
    return errResult("hermes.pyth.network", "pyth_fetch_failed", String(e));
  }
}

export function divergeBps(
  left: number,
  right: number,
  bandBps = 50,
): DivergeCheck {
  const mid = (left + right) / 2;
  const bps =
    mid > 0 ? (Math.abs(left - right) / mid) * 10_000 : Number.POSITIVE_INFINITY;
  return {
    left,
    right,
    divergeBps: bps,
    bandBps,
    pass: Number.isFinite(bps) && bps <= bandBps,
  };
}
