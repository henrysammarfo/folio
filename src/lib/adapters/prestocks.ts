/**
 * PreStocks — tokenized pre-IPO equities (Stocklana bounty · PreStocks-only).
 * Live catalog: https://prestocks.com/api/prestocks
 * Never invent mints; never mix Tessera / other pre-IPO issuers on this path.
 */

import { errResult, okResult, type AdapterResult } from "./types";

export type PreStockRow = {
  symbol: string;
  name: string;
  description: string;
  image: string | null;
  externalUrl: string | null;
  mint: string;
  markPrice: number | null;
  tokenPrice: number | null;
  markValuation: number | null;
  impliedValuation: number | null;
  supply: number | null;
};

export type PreStocksCatalog = {
  rows: PreStockRow[];
  source: string;
  note: string;
};

type RawPreStock = {
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  external_url?: string;
  contract_address?: string;
  markPrice?: number;
  tokenPrice?: number;
  markValuation?: number;
  impliedValuation?: number;
  supply?: number;
};

export async function fetchPreStocksCatalog(): Promise<
  AdapterResult<PreStocksCatalog>
> {
  const source = "prestocks.com/api/prestocks";
  try {
    const res = await fetch("https://prestocks.com/api/prestocks", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return errResult(source, "prestocks_http_error", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as RawPreStock[];
    if (!Array.isArray(json) || json.length === 0) {
      return errResult(source, "prestocks_empty", "No PreStocks rows returned");
    }
    const rows: PreStockRow[] = [];
    for (const raw of json) {
      const mint = raw.contract_address?.trim();
      const symbol = raw.symbol?.trim().toUpperCase();
      if (!mint || !symbol) continue;
      rows.push({
        symbol,
        name: raw.name?.trim() || `${symbol} PreStocks`,
        description: raw.description?.trim() || "",
        image: raw.image?.trim() || null,
        externalUrl: raw.external_url?.trim() || null,
        mint,
        markPrice: typeof raw.markPrice === "number" ? raw.markPrice : null,
        tokenPrice: typeof raw.tokenPrice === "number" ? raw.tokenPrice : null,
        markValuation:
          typeof raw.markValuation === "number" ? raw.markValuation : null,
        impliedValuation:
          typeof raw.impliedValuation === "number" ? raw.impliedValuation : null,
        supply: typeof raw.supply === "number" ? raw.supply : null,
      });
    }
    if (rows.length === 0) {
      return errResult(source, "prestocks_unparseable", "No usable mint rows");
    }
    return okResult("mainnet-read", source, {
      rows,
      source,
      note: "PreStocks-only catalog · Stocklana bounty — no Tessera / other pre-IPO issuers mixed here.",
    });
  } catch (e) {
    return errResult(source, "prestocks_fetch_failed", String(e));
  }
}
