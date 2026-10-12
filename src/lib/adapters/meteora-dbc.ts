import { errResult, okResult, type AdapterResult } from "./types";

/**
 * Meteora DBC awareness — separate Stocklana / World's Fair lane.
 * HTTP pool index (dbc.datapi.meteora.ag) — no Anchor SDK on the SSR path
 * (avoids `exports is not defined` from DBC TS SDK). Not xStock economic truth;
 * wash + Jupiter quote still required for FOLIO buy spine.
 */
export type MeteoraDbcPool = {
  address: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseMint: string;
  quoteMint: string;
  creator: string | null;
  config: string | null;
};

export type MeteoraDbcSnapshot = {
  protocol: "Meteora DBC";
  totalPools: number;
  sample: MeteoraDbcPool[];
  docsUrl: string;
  pageSize: number;
  note: string;
};

const DBC_POOLS = "https://dbc.datapi.meteora.ag/pools";
export const METEORA_DBC_DOCS_URL =
  "https://docs.meteora.ag/developer-guides/dbc";

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
        token_x?: { address?: string; symbol?: string };
        token_y?: { address?: string; symbol?: string };
      }>;
    };
    const total = Number(json.total);
    if (!Number.isFinite(total) || total <= 0) {
      return errResult(source, "meteora_dbc_empty", "No DBC pools indexed");
    }
    const sample: MeteoraDbcPool[] = [];
    for (const row of json.data ?? []) {
      const address = row.address?.trim();
      const baseMint = row.token_x?.address?.trim();
      const quoteMint = row.token_y?.address?.trim();
      const baseSymbol = row.token_x?.symbol?.trim() || "?";
      const quoteSymbol = row.token_y?.symbol?.trim() || "?";
      if (!address || !baseMint || !quoteMint) continue;
      sample.push({
        address,
        baseSymbol,
        quoteSymbol,
        baseMint,
        quoteMint,
        creator: row.creator?.trim() || null,
        config: row.pool_config_address?.trim() || null,
      });
    }
    if (sample.length === 0) {
      return errResult(source, "meteora_dbc_parse_failed", "Pool rows missing mints");
    }
    return okResult("mainnet-read", source, {
      protocol: "Meteora DBC",
      totalPools: total,
      sample,
      docsUrl: METEORA_DBC_DOCS_URL,
      pageSize,
      note: "Separate DBC lane · not xStock economic truth · no FOLIO CPI",
    });
  } catch (e) {
    return errResult(source, "meteora_dbc_fetch_failed", String(e));
  }
}
