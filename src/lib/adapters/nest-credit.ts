import { errResult, okResult, type AdapterResult } from "./types";

export type NestCreditVaultSummary = {
  vaultCount: number;
  solanaOftCount: number;
  /** Sum of reported TVL across vaults (USD, as indexed by Nest.credit). */
  totalTvlUsd: number;
  /** Top vaults by TVL for desk labeling — not NestUSD borrow capacity. */
  top: Array<{ name: string; slug: string; tvlUsd: number; solanaMint: string | null }>;
  note: string;
};

type NestVaultRow = {
  name?: string;
  slug?: string;
  tvl?: number | string;
  solana?: { mintAddress?: string } | null;
};

/**
 * Nest.credit indexed vault awareness (EVM hub + optional Solana OFT mints).
 * This is NOT NestUSD xStocks borrow capacity — keep those labels separate.
 */
export async function fetchNestCreditVaults(): Promise<
  AdapterResult<NestCreditVaultSummary>
> {
  const source = "api.nest.credit/v1/vaults";
  try {
    const res = await fetch("https://api.nest.credit/v1/vaults", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return errResult(
        source,
        "nest_credit_http_error",
        `HTTP ${res.status} — Nest.credit vault list unavailable.`,
      );
    }
    const json = (await res.json()) as { data?: NestVaultRow[] };
    const rows = Array.isArray(json.data) ? json.data : [];
    if (rows.length === 0) {
      return errResult(
        source,
        "nest_credit_empty",
        "Nest.credit returned zero vaults — not inventing TVL.",
      );
    }

    let totalTvlUsd = 0;
    let solanaOftCount = 0;
    const ranked: NestCreditVaultSummary["top"] = [];
    for (const row of rows) {
      const tvl = typeof row.tvl === "number" ? row.tvl : Number(row.tvl);
      const tvlUsd = Number.isFinite(tvl) ? tvl : 0;
      totalTvlUsd += tvlUsd;
      const solanaMint = row.solana?.mintAddress?.trim() || null;
      if (solanaMint) solanaOftCount += 1;
      ranked.push({
        name: row.name?.trim() || row.slug?.trim() || "unnamed",
        slug: row.slug?.trim() || "unknown",
        tvlUsd,
        solanaMint,
      });
    }
    ranked.sort((a, b) => b.tvlUsd - a.tvlUsd);

    return okResult("mainnet-read", source, {
      vaultCount: rows.length,
      solanaOftCount,
      totalTvlUsd,
      top: ranked.slice(0, 5),
      note: "Nest.credit indexed vault TVL (EVM hub + Solana OFT mints where present). Not NestUSD xStock borrow capacity.",
    });
  } catch (e) {
    return errResult(
      source,
      "nest_credit_fetch_failed",
      `${String(e)} — Nest.credit vault awareness unavailable.`,
    );
  }
}
