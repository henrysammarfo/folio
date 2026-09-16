import { errResult, okResult, type AdapterResult } from "./types";

export type WashVerdict = {
  symbol: string;
  mint: string | null;
  pass: boolean;
  pressure: "low" | "elevated" | "high" | "unknown";
  notes: string[];
  sampleSize: number;
};

export type DexTradeRow = {
  buyer: string | null;
  seller: string | null;
  feePayer: string | null;
  amountUsd: number | null;
  signature: string | null;
  protocol: string | null;
};

const BITQUERY_URL = "https://streaming.bitquery.io/eap";

/**
 * Labeling rules adapted from Bitquery Solana wash-trading detector docs:
 * - same account on both sides
 * - fee payer equals both sides (self-trade)
 * Never invent a green tape when the sample is empty or the API fails.
 * Optional notionalUsd: large size vs thin sampled USD volume raises pressure.
 */
export function scoreWashTrades(
  rows: DexTradeRow[],
  opts?: { notionalUsd?: number },
): Omit<WashVerdict, "symbol" | "mint"> {
  const notes: string[] = [];
  let selfTrades = 0;
  let feePayerSelf = 0;
  let sampleUsd = 0;

  for (const row of rows) {
    if (row.buyer && row.seller && row.buyer === row.seller) selfTrades += 1;
    if (
      row.feePayer &&
      row.buyer &&
      row.seller &&
      row.feePayer === row.buyer &&
      row.feePayer === row.seller
    ) {
      feePayerSelf += 1;
    }
    if (row.amountUsd != null && Number.isFinite(row.amountUsd)) sampleUsd += row.amountUsd;
  }

  const sampleSize = rows.length;
  if (sampleSize === 0) {
    return {
      pass: false,
      pressure: "unknown",
      notes: ["No recent successful DEX trades returned for mint — fail-closed."],
      sampleSize: 0,
    };
  }

  const selfRatio = selfTrades / sampleSize;
  if (selfTrades > 0) {
    notes.push(`${selfTrades}/${sampleSize} trades have identical buy/sell accounts`);
  }
  if (feePayerSelf > 0) {
    notes.push(`${feePayerSelf}/${sampleSize} trades look like fee-payer self-trades`);
  }

  const notional = opts?.notionalUsd;
  let thinTape = false;
  if (notional != null && notional > 0 && sampleUsd > 0 && notional > sampleUsd * 0.5) {
    thinTape = true;
    notes.push(
      `Order notional $${notional.toFixed(0)} vs sampled tape ~$${sampleUsd.toFixed(0)} — size vs thin tape`,
    );
  }

  let pressure: WashVerdict["pressure"] = "low";
  if (selfRatio >= 0.15 || feePayerSelf >= 3) pressure = "high";
  else if (selfRatio >= 0.05 || feePayerSelf >= 1 || thinTape) pressure = "elevated";

  const pass = pressure === "low";
  if (pass) notes.push(`Clean sample of ${sampleSize} recent trades (heuristic — not a guarantee).`);
  else notes.push("Wash / linked-flow pressure blocked size (heuristic).");

  return { pass, pressure, notes, sampleSize };
}

const WASH_QUERY = `
query FolioWash($mint: String!, $limit: Int!) {
  Solana {
    DEXTrades(
      limit: { count: $limit }
      orderBy: { descending: Block_Time }
      where: {
        Transaction: { Result: { Success: true } }
        any: [
          { Trade: { Buy: { Currency: { MintAddress: { is: $mint } } } } }
          { Trade: { Sell: { Currency: { MintAddress: { is: $mint } } } } }
        ]
      }
    ) {
      Trade {
        Dex { ProtocolName ProtocolFamily }
        Buy {
          Account { Address }
          AmountInUSD
          Currency { MintAddress }
        }
        Sell {
          Account { Address }
          AmountInUSD
          Currency { MintAddress }
        }
      }
      Transaction { Signature FeePayer }
    }
  }
}
`;

type BitqueryResponse = {
  data?: {
    Solana?: {
      DEXTrades?: Array<{
        Trade?: {
          Dex?: { ProtocolName?: string; ProtocolFamily?: string };
          Buy?: { Account?: { Address?: string }; AmountInUSD?: string | number };
          Sell?: { Account?: { Address?: string }; AmountInUSD?: string | number };
        };
        Transaction?: { Signature?: string; FeePayer?: string };
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

/**
 * Wash / linked-flow gate.
 * Fail-closed when Bitquery is missing, the query errors, or heuristics trip.
 */
export async function evaluateWashGate(params: {
  symbol: string;
  mint: string | null;
  notionalUsd: number;
}): Promise<AdapterResult<WashVerdict>> {
  const source = "bitquery.wash-gate";
  const apiKey = process.env["BITQUERY_API_KEY"]?.trim();

  if (!apiKey) {
    return errResult(
      source,
      "bitquery_key_missing",
      "Wash tape unavailable — size blocked until BITQUERY_API_KEY is set (fail-closed). When keyed: Bitquery DEXTrades → self-trade / fee-payer-self / thin-tape heuristics (never invent a green tape).",
    );
  }

  if (!params.mint) {
    return errResult(
      source,
      "wash_mint_missing",
      "Cannot score wash without Solana mint — size blocked.",
    );
  }

  try {
    const res = await fetch(BITQUERY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        query: WASH_QUERY,
        variables: { mint: params.mint, limit: 50 },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return errResult(
        source,
        "bitquery_http_error",
        `HTTP ${res.status} ${body.slice(0, 180)} — size blocked.`,
      );
    }

    const json = (await res.json()) as BitqueryResponse;
    if (json.errors?.length) {
      return errResult(
        source,
        "bitquery_graphql_error",
        `${json.errors[0]?.message ?? "GraphQL error"} — size blocked.`,
      );
    }

    const trades = json.data?.Solana?.DEXTrades ?? [];
    const rows: DexTradeRow[] = trades.map((t) => ({
      buyer: t.Trade?.Buy?.Account?.Address ?? null,
      seller: t.Trade?.Sell?.Account?.Address ?? null,
      feePayer: t.Transaction?.FeePayer ?? null,
      amountUsd:
        t.Trade?.Buy?.AmountInUSD != null
          ? Number(t.Trade.Buy.AmountInUSD)
          : t.Trade?.Sell?.AmountInUSD != null
            ? Number(t.Trade.Sell.AmountInUSD)
            : null,
      signature: t.Transaction?.Signature ?? null,
      protocol: t.Trade?.Dex?.ProtocolName ?? t.Trade?.Dex?.ProtocolFamily ?? null,
    }));

    const scored = scoreWashTrades(rows, { notionalUsd: params.notionalUsd });

    return okResult("mainnet-read", source, {
      symbol: params.symbol,
      mint: params.mint,
      ...scored,
    });
  } catch (e) {
    return errResult(source, "bitquery_wash_failed", `${String(e)} — size blocked.`);
  }
}

export function washAllowsSize(wash: AdapterResult<WashVerdict>): boolean {
  return wash.ok && wash.data.pass;
}
