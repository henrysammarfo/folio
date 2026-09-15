import { createServerFn } from "@tanstack/react-start";
import type { PriceMap, Quote } from "./market";
import { UNDERLYING_SYMBOLS } from "./market";

type YahooChart = {
  chart?: {
    result?: Array<{ meta?: { symbol?: string; regularMarketPrice?: number; regularMarketChangePercent?: number; currency?: string; regularMarketTime?: number } }>;
  };
};

async function fetchQuote(symbol: string): Promise<Quote | null> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } },
  );
  if (!res.ok) {
    console.error(`Price fetch failed for ${symbol} [${res.status}]: ${await res.text()}`);
    return null;
  }
  const json = (await res.json()) as YahooChart;
  const meta = json.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") return null;
  return {
    symbol,
    price: meta.regularMarketPrice,
    changePercent: meta.regularMarketChangePercent ?? 0,
    currency: meta.currency ?? "USD",
    asOf: new Date((meta.regularMarketTime ?? Date.now() / 1000) * 1000).toISOString(),
  };
}

export const getPrices = createServerFn({ method: "GET" }).handler(async (): Promise<PriceMap> => {
  const symbols = UNDERLYING_SYMBOLS;
  const results = await Promise.all(symbols.map((s) => fetchQuote(s).catch(() => null)));
  const map: PriceMap = {};
  for (const q of results) if (q) map[q.symbol] = q;
  return map;
});
