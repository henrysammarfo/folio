import { errResult, okResult, type AdapterResult } from "./types";
import { fetchPythEquityPrice, type PythPrice } from "./pyth";

/**
 * Free / OSS equity reference cascade for Stocklana diverge when Pyth Pro
 * Equity.US is not entitled (Starter / unpaid trial).
 *
 * Priority:
 * 1. Pyth Hermes Equity.US (bounty primary — when entitled)
 * 2. Finnhub quote (free API key — https://finnhub.io/register)
 * 3. Yahoo chart v8 (keyless · unofficial · labeled — OSS-friendly demo path)
 *
 * Never claims Pyth when using a fallback. Fail-closed if all miss.
 */

export type EquityRefProvider = "pyth-hermes" | "finnhub" | "yahoo-chart";

export type EquityRefPrice = {
  underlying: string;
  price: number;
  /** Honest symbol label — never invent Equity.US.* unless Pyth. */
  feedSymbol: string;
  provider: EquityRefProvider;
  publishTime: number;
  conf: number | null;
};

const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";
const FINNHUB_QUOTE = "https://finnhub.io/api/v1/quote";

/** CoinGecko simple ids for Backed xStocks — free secondary when Hermes Crypto.*X 403. */
const COINGECKO_XSTOCK_IDS: Record<string, string> = {
  AAPLX: "apple-xstock",
  NVDAX: "nvidia-xstock",
  TSLAX: "tesla-xstock",
};

export type XStockRefPrice = {
  xSymbol: string;
  price: number;
  feedSymbol: string;
  provider: "pyth-hermes" | "coingecko";
  publishTime: number;
};

function asEquityRefFromPyth(p: PythPrice): EquityRefPrice {
  return {
    underlying: p.underlying,
    price: p.price,
    feedSymbol: p.feedSymbol ?? `Equity.US.${p.underlying}/USD`,
    provider: "pyth-hermes",
    publishTime: p.publishTime,
    conf: p.conf,
  };
}

async function fetchYahooChartEquity(
  underlying: string,
): Promise<AdapterResult<EquityRefPrice>> {
  const symbol = underlying.toUpperCase();
  const url = `${YAHOO_CHART}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FOLIO-desk/1.0 (Stocklana demo; equity-ref fallback)",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return errResult(
        "query1.finance.yahoo.com",
        "yahoo_http_error",
        `HTTP ${res.status}`,
      );
    }
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            regularMarketTime?: number;
            currency?: string;
            symbol?: string;
          };
        }>;
        error?: unknown;
      };
    };
    const meta = json.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    if (typeof price !== "number" || !(price > 0)) {
      return errResult(
        "query1.finance.yahoo.com",
        "yahoo_price_missing",
        symbol,
      );
    }
    return okResult("mainnet-read", "query1.finance.yahoo.com/v8/finance/chart", {
      underlying: symbol,
      price,
      feedSymbol: `YAHOO:${symbol}`,
      provider: "yahoo-chart",
      publishTime: meta?.regularMarketTime ?? Math.floor(Date.now() / 1000),
      conf: null,
    });
  } catch (e) {
    return errResult(
      "query1.finance.yahoo.com",
      "yahoo_fetch_failed",
      String(e),
    );
  }
}

async function fetchFinnhubEquity(
  underlying: string,
  apiKey: string,
): Promise<AdapterResult<EquityRefPrice>> {
  const symbol = underlying.toUpperCase();
  const url = `${FINNHUB_QUOTE}?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return errResult("finnhub.io", "finnhub_http_error", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as { c?: number; t?: number };
    const price = json.c;
    if (typeof price !== "number" || !(price > 0)) {
      return errResult("finnhub.io", "finnhub_price_missing", symbol);
    }
    return okResult("mainnet-read", "finnhub.io/api/v1/quote", {
      underlying: symbol,
      price,
      feedSymbol: `FINNHUB:${symbol}`,
      provider: "finnhub",
      publishTime: json.t ?? Math.floor(Date.now() / 1000),
      conf: null,
    });
  } catch (e) {
    return errResult("finnhub.io", "finnhub_fetch_failed", String(e));
  }
}

/**
 * Equity reference for diverge scoring.
 * Prefer Pyth when entitled; else free Finnhub / Yahoo — never invent a green.
 */
export async function fetchEquityReferencePrice(
  underlying: string,
): Promise<AdapterResult<EquityRefPrice>> {
  const pyth = await fetchPythEquityPrice(underlying);
  if (pyth.ok) {
    return okResult(pyth.mode, pyth.source, asEquityRefFromPyth(pyth.data));
  }

  const finnhubKey = process.env["FINNHUB_API_KEY"]?.trim();
  if (finnhubKey) {
    const fh = await fetchFinnhubEquity(underlying, finnhubKey);
    if (fh.ok) return fh;
  }

  const yahoo = await fetchYahooChartEquity(underlying);
  if (yahoo.ok) return yahoo;

  return errResult(
    "equity-ref",
    "equity_ref_unavailable",
    `Pyth: ${pyth.reason}${pyth.detail ? ` (${pyth.detail})` : ""}; Yahoo/Finnhub also failed`,
  );
}

/** Free CoinGecko xStock USD when Hermes Crypto.*X is not entitled. */
export async function fetchCoinGeckoXStockPrice(
  xSymbol: string,
): Promise<AdapterResult<XStockRefPrice>> {
  const key = xSymbol.replace(/x$/i, "X").toUpperCase();
  const normalized = key.endsWith("X") ? key : `${key}X`;
  const id = COINGECKO_XSTOCK_IDS[normalized];
  if (!id) {
    return errResult(
      "api.coingecko.com",
      "coingecko_xstock_unmapped",
      normalized,
    );
  }
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return errResult(
        "api.coingecko.com",
        "coingecko_http_error",
        `HTTP ${res.status}`,
      );
    }
    const json = (await res.json()) as Record<string, { usd?: number }>;
    const price = json[id]?.usd;
    if (typeof price !== "number" || !(price > 0)) {
      return errResult("api.coingecko.com", "coingecko_price_missing", id);
    }
    return okResult("mainnet-read", "api.coingecko.com/api/v3/simple/price", {
      xSymbol: normalized,
      price,
      feedSymbol: `CG:${id}`,
      provider: "coingecko",
      publishTime: Math.floor(Date.now() / 1000),
    });
  } catch (e) {
    return errResult("api.coingecko.com", "coingecko_fetch_failed", String(e));
  }
}
