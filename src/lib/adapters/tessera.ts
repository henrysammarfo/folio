/**
 * Tessera T-tokens — private equity / pre-IPO style (Stocklana Tessera bounty).
 * Live: https://rest-api.tessera.pe/v1/public/token-details
 * Kept separate from PreStocks so each bounty path stays eligible.
 */

import { errResult, okResult, type AdapterResult } from "./types";

export type TesseraTokenRow = {
  id: string;
  symbol: string;
  name: string;
  code: string | null;
  sector: string | null;
  mint: string;
  markPrice: number | null;
  holders: number | null;
  markValuation: number | null;
};

export type TesseraCatalog = {
  rows: TesseraTokenRow[];
  source: string;
  note: string;
};

type RawTessera = {
  id?: string;
  name?: string;
  symbol?: string;
  code?: string;
  sector?: string;
  mint?: string;
  markPrice?: number;
  holders?: number;
  markValuation?: number;
};

export async function fetchTesseraCatalog(): Promise<
  AdapterResult<TesseraCatalog>
> {
  const source = "rest-api.tessera.pe/v1/public/token-details";
  try {
    const res = await fetch(
      "https://rest-api.tessera.pe/v1/public/token-details",
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!res.ok) {
      return errResult(source, "tessera_http_error", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as RawTessera[];
    if (!Array.isArray(json) || json.length === 0) {
      return errResult(source, "tessera_empty", "No Tessera rows returned");
    }
    const rows: TesseraTokenRow[] = [];
    for (const raw of json) {
      const mint = raw.mint?.trim();
      const symbol = (raw.symbol ?? raw.code ?? raw.id)?.trim();
      if (!mint || !symbol) continue;
      rows.push({
        id: raw.id?.trim() || symbol,
        symbol,
        name: raw.name?.trim() || symbol,
        code: raw.code?.trim() || null,
        sector: raw.sector?.trim() || null,
        mint,
        markPrice: typeof raw.markPrice === "number" ? raw.markPrice : null,
        holders: typeof raw.holders === "number" ? raw.holders : null,
        markValuation:
          typeof raw.markValuation === "number" ? raw.markValuation : null,
      });
    }
    if (rows.length === 0) {
      return errResult(source, "tessera_unparseable", "No usable mint rows");
    }
    return okResult("mainnet-read", source, {
      rows,
      source,
      note: "Tessera T-tokens only · separate from PreStocks bounty eligibility.",
    });
  } catch (e) {
    return errResult(source, "tessera_fetch_failed", String(e));
  }
}
