import { errResult, okResult, type AdapterResult } from "./types";

/** Legacy public host — price updates require auth after Pyth Core upgrade (2026-08-26). */
const HERMES_LEGACY = "https://hermes.pyth.network";
/** Upgraded Hermes base (docs: pyth.dourolabs.app/hermes). */
const HERMES_UPGRADED = "https://pyth.dourolabs.app/hermes";

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

export function pythApiKeyPresent(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (env["PYTH_API_KEY"]?.trim().length ?? 0) > 0;
}

function hermesAuthHeaders(apiKey: string): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

async function resolveFeedId(
  underlying: string,
  apiKey: string | null,
): Promise<string | null> {
  if (EQUITY_FEED_IDS[underlying]) return EQUITY_FEED_IDS[underlying];
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
 * Hermes price updates require `PYTH_API_KEY` after the Aug 2026 Core upgrade.
 * Without the key we fail-closed immediately — never invent an equity reference.
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
    const feedId = await resolveFeedId(underlying, apiKey);
    if (!feedId) {
      return errResult("hermes.pyth.network", "pyth_feed_not_found", underlying);
    }

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
        underlying,
        feedId,
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
