/**
 * Logo resolution — xStocks CDN first, then underlying favicon, then initials.
 * Catalog symbols must match Backed mint names (ARMx not ARMXx).
 */

const UNDERLYING_DOMAIN: Record<string, string> = {
  AAPL: "apple.com",
  NVDA: "nvidia.com",
  TSLA: "tesla.com",
  GOOGL: "google.com",
  GOOG: "google.com",
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
  CBBTC: "coinbase.com",
  BTC: "bitcoin.org",
  // PreStocks / Tessera name hints (API rarely ships logos for Tessera)
  OPENAI: "openai.com",
  SPACEX: "spacex.com",
  KALSHI: "kalshi.com",
  ANDURIL: "anduril.com",
  ANTHROPIC: "anthropic.com",
  FIGUREAI: "figure.ai",
  NEURALINK: "neuralink.com",
  POLYMARKET: "polymarket.com",
};

/** Extra direct logo URLs when CDN / favicon are flaky (credit board faces). */
const DIRECT_LOGO: Record<string, string> = {
  CBBTC:
    "https://assets.coingecko.com/coins/images/40143/small/cbbtc.webp",
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  SPY: "https://logo.clearbit.com/ssga.com",
  QQQ: "https://logo.clearbit.com/invesco.com",
  GOOGL: "https://www.google.com/s2/favicons?domain=google.com&sz=128",
  GOOG: "https://www.google.com/s2/favicons?domain=google.com&sz=128",
  SPACEX: "https://www.google.com/s2/favicons?domain=spacex.com&sz=128",
  OPENAI: "https://logo.clearbit.com/openai.com",
  KALSHI: "https://logo.clearbit.com/kalshi.com",
  ANDURIL: "https://logo.clearbit.com/anduril.com",
  ANTHROPIC: "https://logo.clearbit.com/anthropic.com",
  FIGUREAI: "https://logo.clearbit.com/figure.ai",
  NEURALINK: "https://logo.clearbit.com/neuralink.com",
  POLYMARKET: "https://logo.clearbit.com/polymarket.com",
};

/** Strip T- / trailing x so Tessera + xStock symbols map to company domains. */
export function underlyingKey(symbol: string, underlying?: string): string {
  if (underlying?.trim()) return underlying.trim().toUpperCase();
  const raw = symbol.trim().replace(/\s+/g, "");
  // Tessera T-tokens: T-SpaceX → SPACEX (do NOT strip trailing X from SpaceX)
  if (/^T-/i.test(raw)) {
    return raw.replace(/^T-/i, "").toUpperCase();
  }
  // xStocks: AAPLx → AAPL (only strip trailing xStock suffix)
  return raw.replace(/x$/i, "").toUpperCase();
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
  // Known flaky faces (cbBTC, SPY, QQQ, SpaceX) — prefer direct before favicon
  push(DIRECT_LOGO[und]);
  const domain = UNDERLYING_DOMAIN[und];
  if (domain) {
    push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  }
  return out;
}

export function initialsForSymbol(symbol: string): string {
  const raw = symbol.trim().replace(/\s+/g, "");
  if (/^T-/i.test(raw)) {
    const base = raw.replace(/^T-/i, "");
    return (base.slice(0, 2) || "?").toUpperCase();
  }
  const base = raw.replace(/x$/i, "");
  return (base.slice(0, 2) || "?").toUpperCase();
}
