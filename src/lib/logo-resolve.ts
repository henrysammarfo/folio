/**
 * Logo resolution — xStocks CDN first, then underlying favicon, then initials.
 * Catalog symbols must match Backed mint names (ARMx not ARMXx).
 */

const UNDERLYING_DOMAIN: Record<string, string> = {
  AAPL: "apple.com",
  NVDA: "nvidia.com",
  TSLA: "tesla.com",
  GOOGL: "abc.xyz",
  META: "meta.com",
  AMZN: "amazon.com",
  MSFT: "microsoft.com",
  COIN: "coinbase.com",
  HOOD: "robinhood.com",
  CRWD: "crowdstrike.com",
  PLTR: "palantir.com",
  AVGO: "broadcom.com",
  ARM: "arm.com",
  RDDT: "reddit.com",
  GME: "gamestop.com",
  AMC: "amctheatres.com",
  DJT: "tmtgcorp.com",
  NFLX: "netflix.com",
  AMD: "amd.com",
  SPY: "ssga.com",
  QQQ: "invesco.com",
  CRCL: "circle.com",
  MSTR: "microstrategy.com",
  COST: "costco.com",
  CPCL: "costco.com",
  // PreStocks / Tessera name hints (API rarely ships logos for Tessera)
  OPENAI: "openai.com",
  SPACEX: "spacex.com",
  KALSHI: "kalshi.com",
  ANDURIL: "anduril.com",
  ANTHROPIC: "anthropic.com",
};

/** Strip T- / trailing x so Tessera + xStock symbols map to company domains. */
export function underlyingKey(symbol: string, underlying?: string): string {
  if (underlying?.trim()) return underlying.trim().toUpperCase();
  return symbol
    .trim()
    .replace(/^T-?/i, "")
    .replace(/x+$/i, "")
    .toUpperCase();
}

export function xStockLogoUrl(symbol: string): string {
  return `https://xstocks-metadata.backed.fi/logos/tokens/${encodeURIComponent(symbol)}.png`;
}

/** Normalize catalog typos like ARMXx → ARMx when the CDN uses single trailing x. */
export function logoCandidates(opts: {
  symbol: string;
  underlying?: string;
  logo?: string | null;
}): string[] {
  const symbol = opts.symbol.trim();
  const und = underlyingKey(symbol, opts.underlying);
  const out: string[] = [];
  const push = (u: string | null | undefined) => {
    const t = u?.trim();
    if (t && !out.includes(t)) out.push(t);
  };
  push(opts.logo);
  push(xStockLogoUrl(symbol));
  // Double-x typo fallback (ARMXx → ARMx) — CDN returns 403 for *Xx
  if (/xx+$/i.test(symbol)) {
    push(xStockLogoUrl(symbol.replace(/x+$/i, "x")));
  }
  const domain = UNDERLYING_DOMAIN[und];
  if (domain) {
    push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
  }
  return out;
}

export function initialsForSymbol(symbol: string): string {
  const base = symbol.replace(/x+$/i, "").replace(/^T-?/i, "");
  return (base.slice(0, 2) || "?").toUpperCase();
}
