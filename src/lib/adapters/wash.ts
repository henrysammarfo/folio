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

/**
 * Bitquery Streaming GraphQL (docs 2026):
 * Primary V2: https://streaming.bitquery.io/graphql
 * Legacy EAP: https://streaming.bitquery.io/eap (existing customers only)
 * Auth: Authorization: Bearer …
 *
 * Free fallback when Bitquery is missing/quota'd: GeckoTerminal pool trades
 * (signer concentration + thin-tape — weaker than buy/sell self-trade pairs).
 */
const BITQUERY_URLS = [
  "https://streaming.bitquery.io/graphql",
  "https://streaming.bitquery.io/eap",
] as const;

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

/** Free-path scorer — GeckoTerminal exposes signer, not full buy/sell pairs. */
export function scoreSignerTape(
  rows: Array<{ signer: string | null; amountUsd: number | null }>,
  opts?: { notionalUsd?: number },
): Omit<WashVerdict, "symbol" | "mint"> {
  const notes: string[] = [
    "GeckoTerminal free tape · signer concentration + thin-tape (not Bitquery buy/sell pairs).",
  ];
  const sampleSize = rows.length;
  if (sampleSize === 0) {
    return {
      pass: false,
      pressure: "unknown",
      notes: [
        "No recent GeckoTerminal trades for mint — fail-closed.",
      ],
      sampleSize: 0,
    };
  }

  const counts = new Map<string, number>();
  let sampleUsd = 0;
  for (const row of rows) {
    const s = row.signer?.trim();
    if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
    if (row.amountUsd != null && Number.isFinite(row.amountUsd)) sampleUsd += row.amountUsd;
  }
  const top = [...counts.values()].sort((a, b) => b - a)[0] ?? 0;
  const topShare = top / sampleSize;
  const unique = counts.size;

  if (topShare >= 0.25) {
    notes.push(
      `Top signer in ${(topShare * 100).toFixed(0)}% of ${sampleSize} trades (${unique} unique)`,
    );
  } else {
    notes.push(`${unique} unique signers across ${sampleSize} trades`);
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
  if (topShare >= 0.4 || (unique <= 2 && sampleSize >= 10)) pressure = "high";
  else if (topShare >= 0.25 || thinTape || (unique < 3 && sampleSize >= 8)) {
    pressure = "elevated";
  }

  const pass = pressure === "low";
  if (pass) {
    notes.push("Signer tape clear on free path (heuristic — not a guarantee).");
  } else {
    notes.push("Wash / concentration pressure blocked size (free-path heuristic).");
  }
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

async function fetchBitqueryWash(params: {
  symbol: string;
  mint: string;
  notionalUsd: number;
  apiKey: string;
}): Promise<AdapterResult<WashVerdict>> {
  const source = "bitquery.wash-gate";
  const payload = JSON.stringify({
    query: WASH_QUERY,
    variables: { mint: params.mint, limit: 50 },
  });
  let lastDetail = "";

  for (const url of BITQUERY_URLS) {
    const hostLabel = url.includes("/eap") ? "eap" : "graphql";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      signal: AbortSignal.timeout(20_000),
      body: payload,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      lastDetail = `HTTP ${res.status} ${body.slice(0, 120)} @ ${hostLabel}`;
      if (res.status === 401 || res.status === 403) {
        return errResult(
          source,
          "bitquery_unauthorized",
          `${lastDetail} — size blocked.`,
        );
      }
      continue;
    }

    const json = (await res.json()) as BitqueryResponse;
    if (json.errors?.length) {
      lastDetail = `${(json.errors[0]?.message ?? "GraphQL error").slice(0, 160)} @ ${hostLabel}`;
      continue;
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
      protocol:
        t.Trade?.Dex?.ProtocolName ?? t.Trade?.Dex?.ProtocolFamily ?? null,
    }));

    const scored = scoreWashTrades(rows, { notionalUsd: params.notionalUsd });
    return okResult("mainnet-read", source, {
      symbol: params.symbol,
      mint: params.mint,
      ...scored,
    });
  }

  return errResult(
    source,
    "bitquery_http_error",
    `${lastDetail || "Bitquery V2+EAP exhausted"} — size blocked.`,
  );
}

type GeckoPoolList = {
  data?: Array<{
    attributes?: {
      address?: string;
      name?: string;
      reserve_in_usd?: string;
    };
  }>;
};

type GeckoTrades = {
  data?: Array<{
    attributes?: {
      tx_hash?: string;
      tx_from_address?: string;
      volume_in_usd?: string;
      kind?: string;
    };
  }>;
};

async function fetchGeckoWash(params: {
  symbol: string;
  mint: string;
  notionalUsd: number;
}): Promise<AdapterResult<WashVerdict>> {
  const source = "geckoterminal.wash-gate";
  try {
    const poolsRes = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${encodeURIComponent(params.mint)}/pools?page=1`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!poolsRes.ok) {
      return errResult(
        source,
        "gecko_pools_http_error",
        `HTTP ${poolsRes.status} — size blocked.`,
      );
    }
    const poolsJson = (await poolsRes.json()) as GeckoPoolList;
    const pools = [...(poolsJson.data ?? [])].sort((a, b) => {
      const ra = Number(a.attributes?.reserve_in_usd ?? 0);
      const rb = Number(b.attributes?.reserve_in_usd ?? 0);
      return rb - ra;
    });
    const poolAddr = pools[0]?.attributes?.address?.trim();
    if (!poolAddr) {
      return errResult(
        source,
        "gecko_pools_empty",
        "No GeckoTerminal pools for mint — size blocked.",
      );
    }

    const tradesRes = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/solana/pools/${encodeURIComponent(poolAddr)}/trades`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!tradesRes.ok) {
      return errResult(
        source,
        "gecko_trades_http_error",
        `HTTP ${tradesRes.status} — size blocked.`,
      );
    }
    const tradesJson = (await tradesRes.json()) as GeckoTrades;
    const rows = (tradesJson.data ?? []).slice(0, 50).map((t) => ({
      signer: t.attributes?.tx_from_address ?? null,
      amountUsd:
        t.attributes?.volume_in_usd != null
          ? Number(t.attributes.volume_in_usd)
          : null,
    }));
    const scored = scoreSignerTape(rows, { notionalUsd: params.notionalUsd });
    const poolNote = pools[0]?.attributes?.name
      ? ` · pool ${pools[0].attributes.name}`
      : "";
    return okResult("mainnet-read", source, {
      symbol: params.symbol,
      mint: params.mint,
      ...scored,
      notes: [...scored.notes, `Free path via GeckoTerminal${poolNote}`],
    });
  } catch (e) {
    return errResult(source, "gecko_wash_failed", `${String(e)} — size blocked.`);
  }
}

/**
 * Wash / linked-flow gate.
 * Prefer Bitquery when keyed+healthy; else free GeckoTerminal signer tape.
 * Fail-closed when both paths miss.
 */
export async function evaluateWashGate(params: {
  symbol: string;
  mint: string | null;
  notionalUsd: number;
}): Promise<AdapterResult<WashVerdict>> {
  if (!params.mint) {
    return errResult(
      "wash-gate",
      "wash_mint_missing",
      "Cannot score wash without Solana mint — size blocked.",
    );
  }

  const apiKey = process.env["BITQUERY_API_KEY"]?.trim();
  if (apiKey) {
    const bitquery = await fetchBitqueryWash({
      symbol: params.symbol,
      mint: params.mint,
      notionalUsd: params.notionalUsd,
      apiKey,
    });
    if (bitquery.ok) return bitquery;
    // Quota / HTTP / schema miss → free fallback (still fail-closed if gecko fails)
  }

  const gecko = await fetchGeckoWash({
    symbol: params.symbol,
    mint: params.mint,
    notionalUsd: params.notionalUsd,
  });
  if (gecko.ok) return gecko;

  if (!apiKey) {
    return errResult(
      "wash-gate",
      "wash_feeds_unavailable",
      "Bitquery unset and GeckoTerminal free tape failed — size blocked (fail-closed). Heuristics: self-trade / fee-payer-self / signer concentration / thin-tape.",
    );
  }

  return errResult(
    "wash-gate",
    "wash_feeds_unavailable",
    `Bitquery failed and GeckoTerminal fallback failed — size blocked. ${!gecko.ok ? gecko.detail : ""}`.trim(),
  );
}

export function washAllowsSize(wash: AdapterResult<WashVerdict>): boolean {
  return wash.ok && wash.data.pass;
}
