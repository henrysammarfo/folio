import { solLogoUrl, WSOL_MINT } from "../logo-resolve";
import { errResult, okResult, type AdapterResult } from "./types";

/**
 * Meteora launch pools — desk list + trade deep-links.
 * HTTP pool index (dbc.datapi.meteora.ag) — no Anchor SDK on SSR.
 * User signs trades on Meteora; FOLIO does not sponsor CPI.
 */
export type MeteoraDbcPool = {
  address: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseMint: string;
  quoteMint: string;
  baseName: string | null;
  baseLogo: string | null;
  quoteLogo: string | null;
  tradeUrl: string;
  creator: string | null;
  config: string | null;
};

export type MeteoraDbcSnapshot = {
  protocol: "Meteora DBC";
  totalPools: number;
  sample: MeteoraDbcPool[];
  docsUrl: string;
  appUrl: string;
  pageSize: number;
  note: string;
};

const DBC_POOLS = "https://dbc.datapi.meteora.ag/pools";
const JUP_TOKEN_SEARCH = "https://lite-api.jup.ag/tokens/v2/search";
export const METEORA_DBC_DOCS_URL =
  "https://docs.meteora.ag/developer-guides/dbc";
export const METEORA_APP_URL = "https://app.meteora.ag/";

export function meteoraPoolTradeUrl(poolAddress: string): string {
  return `https://app.meteora.ag/pools/${poolAddress}`;
}

async function fetchMintIcon(mint: string): Promise<string | null> {
  if (mint === WSOL_MINT) return solLogoUrl();
  try {
    const res = await fetch(
      `${JUP_TOKEN_SEARCH}?query=${encodeURIComponent(mint)}`,
      {
        headers: { Accept: "application/json", "User-Agent": "folio-desk/0.1" },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ id?: string; icon?: string }>;
    const hit = json.find((t) => t.id === mint) ?? json[0];
    const icon = hit?.icon?.trim();
    if (!icon) return null;
    // Prefer Pinata gateway — ipfs.io / dweb often 429.
    return icon
      .replace("https://ipfs.io/ipfs/", "https://gateway.pinata.cloud/ipfs/")
      .replace("https://gateway.ipfs.io/ipfs/", "https://gateway.pinata.cloud/ipfs/")
      .replace("https://dweb.link/ipfs/", "https://gateway.pinata.cloud/ipfs/")
      .replace("https://cloudflare-ipfs.com/ipfs/", "https://gateway.pinata.cloud/ipfs/");
  } catch {
    return null;
  }
}

export async function fetchMeteoraDbcAwareness(opts?: {
  pageSize?: number;
}): Promise<AdapterResult<MeteoraDbcSnapshot>> {
  const pageSize = Math.min(Math.max(opts?.pageSize ?? 5, 1), 25);
  const source = "dbc.datapi.meteora.ag/pools";
  try {
    const url = `${DBC_POOLS}?page=1&page_size=${pageSize}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "folio-desk/0.1" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return errResult(source, "meteora_dbc_http", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      total?: number;
      page_size?: number;
      data?: Array<{
        address?: string;
        creator?: string;
        pool_config_address?: string;
        token_x?: { address?: string; symbol?: string; name?: string };
        token_y?: { address?: string; symbol?: string; name?: string };
      }>;
    };
    const total = Number(json.total);
    if (!Number.isFinite(total) || total <= 0) {
      return errResult(source, "meteora_dbc_empty", "No DBC pools indexed");
    }
    const raw: Array<{
      address: string;
      baseSymbol: string;
      quoteSymbol: string;
      baseMint: string;
      quoteMint: string;
      baseName: string | null;
      creator: string | null;
      config: string | null;
    }> = [];
    for (const row of json.data ?? []) {
      const address = row.address?.trim();
      const baseMint = row.token_x?.address?.trim();
      const quoteMint = row.token_y?.address?.trim();
      const baseSymbol = row.token_x?.symbol?.trim() || "?";
      const quoteSymbol = row.token_y?.symbol?.trim() || "?";
      if (!address || !baseMint || !quoteMint) continue;
      raw.push({
        address,
        baseSymbol,
        quoteSymbol,
        baseMint,
        quoteMint,
        baseName: row.token_x?.name?.trim() || null,
        creator: row.creator?.trim() || null,
        config: row.pool_config_address?.trim() || null,
      });
    }
    if (raw.length === 0) {
      return errResult(source, "meteora_dbc_parse_failed", "Pool rows missing mints");
    }

    const mints = [...new Set(raw.flatMap((p) => [p.baseMint, p.quoteMint]))];
    const iconEntries = await Promise.all(
      mints.map(async (mint) => [mint, await fetchMintIcon(mint)] as const),
    );
    const icons = new Map(iconEntries);

    const sample: MeteoraDbcPool[] = raw.map((p) => ({
      ...p,
      baseLogo: icons.get(p.baseMint) ?? null,
      quoteLogo:
        icons.get(p.quoteMint) ??
        (p.quoteMint === WSOL_MINT ? solLogoUrl() : null),
      tradeUrl: meteoraPoolTradeUrl(p.address),
    }));

    return okResult("mainnet-read", source, {
      protocol: "Meteora DBC",
      totalPools: total,
      sample,
      docsUrl: METEORA_DBC_DOCS_URL,
      appUrl: METEORA_APP_URL,
      pageSize,
      note: "Live launches · open Meteora to trade with your wallet",
    });
  } catch (e) {
    return errResult(source, "meteora_dbc_fetch_failed", String(e));
  }
}
