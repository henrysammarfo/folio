import { okResult, type AdapterResult } from "../adapters/types";
import { fetchXStockAsset, fetchXStockMultiplier } from "../adapters/xstocks";
import { fetchJupiterQuote } from "../adapters/jupiter";
import { evaluateWashGate, washAllowsSize } from "../adapters/wash";
import {
  compareApiOnchainMultiplier,
  fetchScaledUiOnchain,
} from "../adapters/scaled-ui";
import { fetchKaminoXStocksMarket } from "../adapters/kamino";
import { buildAcquireGateMessages } from "../acquire-gates";
import { isBroadcastPaused } from "../broadcast";
import {
  XSTOCK_COMPARE_PAIRS,
  findCatalogItem,
  isBuyableXStock,
} from "../xstock-catalog";

export type AgentIntent =
  | { kind: "quote"; symbol: string; spendUsdc: number }
  | { kind: "truth"; symbol: string }
  | { kind: "credit" }
  | { kind: "network" }
  | { kind: "positions" }
  | { kind: "compare"; left: string; right: string; spendUsdc: number }
  | { kind: "unknown"; raw: string };

export type AgentSpineEvidence = {
  truth?: {
    symbol: string;
    multiplier: number | null;
    /** Live xStocks pending newMultiplier — null means none on feed. */
    pendingMultiplier: number | null;
    /** On-chain Token-2022 effective × when RPC works. */
    onchainEffective: number | null;
    /** API ↔ on-chain compare — never invents a match. */
    scaledUiStatus: "match" | "mismatch" | "unavailable";
    scaledUiNote: string;
    mode: string;
    note: string;
  };
  quote?: {
    symbol: string;
    spendUsdc: number;
    outUiAmount: number | null;
    mode: string;
    /** Jupiter source honesty: live | cached | stale-cache | fail reason. */
    cacheLabel: "live" | "cached" | "stale-cache" | "unavailable";
    note: string;
  };
  credit?: {
    aaplMaxLtv: number | null;
    reserveCount: number | null;
    mode: string;
    note: string;
  };
  network?: {
    broadcastPaused: boolean;
    washMode: string;
    note: string;
  };
  positions?: {
    note: string;
  };
  compare?: {
    left: string;
    right: string;
    spendUsdc: number;
    leftOut: number | null;
    rightOut: number | null;
    note: string;
  };
  /** Same acquire-desk discipline — quote path never soft-sells a blocked wash. */
  gates?: {
    canReview: boolean;
    washOk: boolean;
    blockedReasons: string[];
    honestyNotes: string[];
  };
};

export type AgentTurn = {
  mode: "paper";
  intent: AgentIntent;
  meteredCostUsd: number;
  model: string | null;
  reply: string;
  spine: AgentSpineEvidence;
  caps: { maxSpendUsdc: number; broadcast: false };
  /** AgentRouter NL expansion status — spine stays authoritative either way. */
  nlExpansion: "off" | "ok" | "failed";
  nlExpansionNote: string | null;
};

const MAX_SPEND = 25;

function normalizeXSymbol(raw: string): string {
  const s = raw.trim();
  if (/x$/i.test(s)) {
    return `${s.slice(0, -1).toUpperCase()}x`;
  }
  return `${s.toUpperCase()}x`;
}

export function parsePaperIntent(raw: string): AgentIntent {
  const text = raw.trim();

  const compare =
    text.match(
      /(?:compare|swap|pair)\s+([A-Za-z]{1,6}x?)\s+(?:vs|versus|and|\/|for|to|→|->)\s+([A-Za-z]{1,6}x?)(?:\s+(\d+(?:\.\d+)?))?/i,
    ) ??
    text.match(
      /([A-Za-z]{1,6}x)\s*(?:→|->|to)\s*([A-Za-z]{1,6}x)(?:\s+(\d+(?:\.\d+)?))?/i,
    );
  if (compare?.[1] && compare[2]) {
    const spend = compare[3] ? Math.min(Number(compare[3]), MAX_SPEND) : 0.01;
    return {
      kind: "compare",
      left: normalizeXSymbol(compare[1]),
      right: normalizeXSymbol(compare[2]),
      spendUsdc: Number.isFinite(spend) && spend > 0 ? spend : 0.01,
    };
  }

  const quote = text.match(
    /quote\s+(\d+(?:\.\d+)?)\s*(?:usdc)?\s*(?:of|for)?\s*([A-Za-z]{1,6}x)/i,
  );
  const quoteAmt = quote?.[1];
  const quoteSym = quote?.[2];
  if (quoteAmt && quoteSym) {
    return {
      kind: "quote",
      spendUsdc: Math.min(Number(quoteAmt), MAX_SPEND),
      symbol: normalizeXSymbol(quoteSym),
    };
  }

  const truth = text.match(/(?:truth|multiplier)\s+([A-Za-z]{1,6}x)/i);
  const truthSym = truth?.[1];
  if (truthSym) {
    return {
      kind: "truth",
      symbol: normalizeXSymbol(truthSym),
    };
  }

  if (/\b(credit|borrow|ltv|kamino)\b/i.test(text)) {
    return { kind: "credit" };
  }
  if (/\b(network|broadcast|wash|matrix)\b/i.test(text)) {
    return { kind: "network" };
  }
  if (/\b(positions?|holdings?|wallet)\b/i.test(text)) {
    return { kind: "positions" };
  }

  // Suggested pair shorthand: "mega tech" / "ai semis"
  const pairHint = XSTOCK_COMPARE_PAIRS.find((p) =>
    text.toLowerCase().includes(p.label.toLowerCase()),
  );
  if (pairHint) {
    return {
      kind: "compare",
      left: pairHint.left,
      right: pairHint.right,
      spendUsdc: 1,
    };
  }

  return { kind: "unknown", raw: text };
}

async function quoteStockPair(
  paySymbol: string,
  receiveSymbol: string,
  payAmount: number,
): Promise<{ out: number | null; note: string }> {
  if (!isBuyableXStock(paySymbol) && findCatalogItem(paySymbol)) {
    return {
      out: null,
      note: `${paySymbol} watchlist-only (cannot pay)`,
    };
  }
  if (!isBuyableXStock(receiveSymbol) && findCatalogItem(receiveSymbol)) {
    return {
      out: null,
      note: `${receiveSymbol} watchlist-only (cannot receive)`,
    };
  }
  const [payAsset, recvAsset] = await Promise.all([
    fetchXStockAsset(paySymbol),
    fetchXStockAsset(receiveSymbol),
  ]);
  if (!payAsset.ok || !payAsset.data.solanaMint) {
    return {
      out: null,
      note: `pay mint missing for ${paySymbol}`,
    };
  }
  if (!recvAsset.ok || !recvAsset.data.solanaMint) {
    return {
      out: null,
      note: `receive mint missing for ${receiveSymbol}`,
    };
  }
  const payDecimals = payAsset.data.decimals ?? 8;
  const recvDecimals = recvAsset.data.decimals ?? 8;
  const quote = await fetchJupiterQuote({
    inputMint: payAsset.data.solanaMint,
    outputMint: recvAsset.data.solanaMint,
    amountRaw: Math.round(payAmount * 10 ** payDecimals),
    outputDecimals: recvDecimals,
    inputDecimals: payDecimals,
  });
  if (!quote.ok) {
    return {
      out: null,
      note: `${quote.reason}${quote.detail ? ` — ${quote.detail}` : ""}`,
    };
  }
  const cacheLabel = quote.source.includes("stale")
    ? "stale-cache"
    : quote.source.includes("cached")
      ? "cached"
      : "live";
  return {
    out: quote.data.outUiAmount,
    note: `${payAmount} ${paySymbol} → ≈${quote.data.outUiAmount.toFixed(6)} ${receiveSymbol} · ${cacheLabel} · never a fill`,
  };
}

async function quoteLeg(
  symbol: string,
  spendUsdc: number,
): Promise<{ out: number | null; note: string; cacheLabel: string }> {
  const catalog = findCatalogItem(symbol);
  if (catalog && !catalog.buyable) {
    return {
      out: null,
      note: `${symbol} watchlist-only (mint not confirmed)`,
      cacheLabel: "unavailable",
    };
  }
  const asset = await fetchXStockAsset(symbol);
  if (!asset.ok || !asset.data.solanaMint) {
    const note = !asset.ok
      ? `${asset.reason}${asset.detail ? ` — ${asset.detail}` : ""}`
      : "xstock_mint_missing";
    return { out: null, note, cacheLabel: "unavailable" };
  }
  const quote = await fetchJupiterQuote({
    outputMint: asset.data.solanaMint,
    amountRaw: Math.round(spendUsdc * 1_000_000),
    outputDecimals: asset.data.decimals ?? 8,
  });
  if (!quote.ok) {
    return {
      out: null,
      note: `${quote.reason}${quote.detail ? ` — ${quote.detail}` : ""}`,
      cacheLabel: "unavailable",
    };
  }
  const cacheLabel = quote.source.includes("stale")
    ? "stale-cache"
    : quote.source.includes("cached")
      ? "cached"
      : "live";
  return {
    out: quote.data.outUiAmount,
    note: `${cacheLabel} out≈${quote.data.outUiAmount.toFixed(6)}`,
    cacheLabel,
  };
}

/** Live Block 0 reads for paper agent — never broadcasts; quote path shares acquire wash gates. */
export async function fetchPaperAgentSpine(
  intent: AgentIntent,
): Promise<{ spine: AgentSpineEvidence; facts: string }> {
  const broadcastNote = isBroadcastPaused()
    ? "broadcast=paused"
    : "broadcast=policy-false";

  if (intent.kind === "unknown") {
    return {
      spine: {},
      facts: `No live spine for free text. Caps: ≤$${MAX_SPEND}, ${broadcastNote}. Try: truth AAPLx · quote 1 USDC NVDAx · compare AAPLx vs MSFTx · credit · network · positions.`,
    };
  }

  if (intent.kind === "credit") {
    const kamino = await fetchKaminoXStocksMarket();
    if (!kamino.ok) {
      const note = `${kamino.reason}${kamino.detail ? ` — ${kamino.detail}` : ""}`;
      return {
        spine: {
          credit: {
            aaplMaxLtv: null,
            reserveCount: null,
            mode: "unavailable",
            note,
          },
        },
        facts: `Credit fail-closed (${note}). Borrow broadcast off. ${broadcastNote}.`,
      };
    }
    const aapl = kamino.data.reserves.find((r) => r.symbol === "AAPLx");
    const note = `${kamino.data.reserves.length} reserves · AAPLx maxLtv ${
      aapl?.maxLtv != null ? `${(aapl.maxLtv * 100).toFixed(0)}%` : "—"
    } · borrow execution unavailable`;
    return {
      spine: {
        credit: {
          aaplMaxLtv: aapl?.maxLtv ?? null,
          reserveCount: kamino.data.reserves.length,
          mode: kamino.mode,
          note,
        },
      },
      facts: `Credit: ${note}. NestUSD capacity stays hidden until verified. ${broadcastNote}.`,
    };
  }

  if (intent.kind === "network") {
    const wash = await evaluateWashGate({
      symbol: "AAPLx",
      mint: null,
      notionalUsd: 1,
    });
    const note = `wash ${wash.ok ? wash.mode : wash.reason} · ${broadcastNote} · quote-only swaps · custom deploy out of ≤~$1 budget`;
    return {
      spine: {
        network: {
          broadcastPaused: isBroadcastPaused(),
          washMode: wash.ok ? wash.mode : wash.reason,
          note,
        },
      },
      facts: `Network: ${note}.`,
    };
  }

  if (intent.kind === "positions") {
    const note =
      "Holdings use watch-wallet mainnet-read when bound on Account; otherwise labeled estimates. Connect wallet for verified qty.";
    return {
      spine: { positions: { note } },
      facts: `Positions: ${note} ${broadcastNote}.`,
    };
  }

  if (intent.kind === "compare") {
    const leg = await quoteStockPair(
      intent.left,
      intent.right,
      intent.spendUsdc,
    );
    return {
      spine: {
        compare: {
          left: intent.left,
          right: intent.right,
          spendUsdc: intent.spendUsdc,
          leftOut: null,
          rightOut: leg.out,
          note: leg.note,
        },
      },
      facts: `Stock↔stock ${intent.left} → ${intent.right}: ${leg.note}. ${broadcastNote}.`,
    };
  }

  if (intent.kind === "truth") {
    const [mult, asset] = await Promise.all([
      fetchXStockMultiplier(intent.symbol),
      fetchXStockAsset(intent.symbol),
    ]);
    if (!mult.ok) {
      const note = `${mult.reason}${mult.detail ? ` — ${mult.detail}` : ""}`;
      return {
        spine: {
          truth: {
            symbol: intent.symbol,
            multiplier: null,
            pendingMultiplier: null,
            onchainEffective: null,
            scaledUiStatus: "unavailable",
            scaledUiNote: "API multiplier unavailable — cannot score on-chain match",
            mode: "unavailable",
            note,
          },
        },
        facts: `Truth ${intent.symbol} fail-closed (${note}). ${broadcastNote}.`,
      };
    }
    const mint = asset.ok ? asset.data.solanaMint : null;
    const scaledUi = mint ? await fetchScaledUiOnchain(mint) : null;
    const compare = compareApiOnchainMultiplier(
      mult.data.currentMultiplier,
      scaledUi?.ok ? scaledUi.data.effectiveMultiplier : null,
    );
    const pending = mult.data.pendingMultiplier;
    const caNote =
      pending != null
        ? `pending CA ${pending.toFixed(6)}×`
        : "no pending newMultiplier on live feed";
    const lane = findCatalogItem(intent.symbol)?.lane;
    const laneNote = lane ? ` · lane=${lane}` : "";
    const note = `live ×${mult.data.currentMultiplier.toFixed(6)} · ${caNote} · on-chain ${compare.status} · ${mult.source}${laneNote}`;
    return {
      spine: {
        truth: {
          symbol: intent.symbol,
          multiplier: mult.data.currentMultiplier,
          pendingMultiplier: pending,
          onchainEffective: compare.onchainEffective,
          scaledUiStatus: compare.status,
          scaledUiNote: compare.note,
          mode: mult.mode,
          note,
        },
      },
      facts: `Truth ${intent.symbol}: ${note}. Scaled UI: ${compare.note}. ${broadcastNote}.`,
    };
  }

  // quote
  if (!isBuyableXStock(intent.symbol) && findCatalogItem(intent.symbol)) {
    const item = findCatalogItem(intent.symbol)!;
    return {
      spine: {
        quote: {
          symbol: intent.symbol,
          spendUsdc: intent.spendUsdc,
          outUiAmount: null,
          mode: "unavailable",
          cacheLabel: "unavailable",
          note: item.blurb ?? "watchlist-only",
        },
        gates: {
          canReview: false,
          washOk: false,
          blockedReasons: [`${intent.symbol} is watchlist-only until mint is confirmed`],
          honestyNotes: item.blurb ? [item.blurb] : [],
        },
      },
      facts: `Quote ${intent.symbol} refuse — watchlist-only (buyable=false). ${broadcastNote}.`,
    };
  }

  const asset = await fetchXStockAsset(intent.symbol);
  if (!asset.ok || !asset.data.solanaMint) {
    const note = !asset.ok
      ? `${asset.reason}${asset.detail ? ` — ${asset.detail}` : ""}`
      : "xstock_mint_missing";
    return {
      spine: {
        quote: {
          symbol: intent.symbol,
          spendUsdc: intent.spendUsdc,
          outUiAmount: null,
          mode: "unavailable",
          cacheLabel: "unavailable",
          note,
        },
        gates: {
          canReview: false,
          washOk: false,
          blockedReasons: [`Asset/mint unavailable: ${note}`],
          honestyNotes: [],
        },
      },
      facts: `Quote ${intent.symbol} fail-closed (${note}). ${broadcastNote}.`,
    };
  }

  const mint = asset.data.solanaMint;
  const [quote, wash, scaledUi, multiplier] = await Promise.all([
    fetchJupiterQuote({
      outputMint: mint,
      amountRaw: Math.round(intent.spendUsdc * 1_000_000),
      outputDecimals: asset.data.decimals ?? 8,
    }),
    evaluateWashGate({
      symbol: intent.symbol,
      mint,
      notionalUsd: intent.spendUsdc,
    }),
    fetchScaledUiOnchain(mint),
    fetchXStockMultiplier(intent.symbol),
  ]);

  const scaledUiCompare = compareApiOnchainMultiplier(
    multiplier.ok ? multiplier.data.currentMultiplier : null,
    scaledUi.ok ? scaledUi.data.effectiveMultiplier : null,
  );
  const scaledUiGate =
    scaledUiCompare.status === "match"
      ? ({ kind: "match", note: scaledUiCompare.note } as const)
      : scaledUiCompare.status === "mismatch"
        ? ({ kind: "mismatch", note: scaledUiCompare.note } as const)
        : ({ kind: "unavailable", note: scaledUiCompare.note } as const);

  const washOk = washAllowsSize(wash);
  const gateMsgs = buildAcquireGateMessages({
    truthOk: multiplier.ok && asset.ok,
    tradingHalted: Boolean(asset.data.isTradingHalted),
    washOk,
    wash: wash.ok
      ? { kind: "pressure" }
      : { kind: "adapter", reason: wash.reason },
    quoteOk: quote.ok,
    quoteReason: quote.ok ? null : quote.reason,
    diverge: { kind: "unavailable" },
    scaledUi: scaledUiGate,
  });

  const gates = {
    canReview: gateMsgs.canReview,
    washOk,
    blockedReasons: gateMsgs.blockedReasons,
    honestyNotes: gateMsgs.honestyNotes,
  };

  if (!quote.ok) {
    const note = `${quote.reason}${quote.detail ? ` — ${quote.detail}` : ""}`;
    return {
      spine: {
        quote: {
          symbol: intent.symbol,
          spendUsdc: intent.spendUsdc,
          outUiAmount: null,
          mode: "unavailable",
          cacheLabel: "unavailable",
          note,
        },
        gates,
      },
      facts: `Quote ${intent.spendUsdc} USDC → ${intent.symbol} fail-closed (${note}). Wash/review canReview=${gates.canReview}. ${broadcastNote}. Never a fill.`,
    };
  }

  const cacheLabel: "live" | "cached" | "stale-cache" = quote.source.includes("stale")
    ? "stale-cache"
    : quote.source.includes("cached")
      ? "cached"
      : "live";
  const note = `quote-only out≈${quote.data.outUiAmount.toFixed(6)} ${intent.symbol} · ${cacheLabel} · impact ${quote.data.priceImpactPct ?? "n/a"} · routes=${quote.data.routePlanLength}`;
  const gateLine = gates.canReview
    ? "acquire gates clear (still never a fill)"
    : `acquire gates blocked: ${gates.blockedReasons.join("; ") || "fail-closed"}`;
  return {
    spine: {
      quote: {
        symbol: intent.symbol,
        spendUsdc: intent.spendUsdc,
        outUiAmount: quote.data.outUiAmount,
        mode: quote.mode,
        cacheLabel,
        note,
      },
      gates,
    },
    facts: `Quote ${intent.spendUsdc} USDC → ${intent.symbol}: ${note}. ${gateLine}. ${broadcastNote}. Never a fill.`,
  };
}

/** Paper-default agent. Live Block 0 spine always; AgentRouter only when keyed; never broadcasts. */
export async function runPaperAgent(
  raw: string,
): Promise<AdapterResult<AgentTurn>> {
  const source = "folio.agent.paper";
  const intent = parsePaperIntent(raw);
  const key = process.env["AGENTROUTER_API_KEY"]?.trim();
  const base =
    process.env["AGENTROUTER_BASE_URL"]?.trim() || "https://agentrouter.org/v1";
  const model = process.env["AGENTROUTER_MODEL"]?.trim() || "gpt-4o-mini";
  const { spine, facts } = await fetchPaperAgentSpine(intent);

  const baseTurn = {
    mode: "paper" as const,
    intent,
    meteredCostUsd: 0,
    model: key ? model : null,
    spine,
    caps: { maxSpendUsdc: MAX_SPEND, broadcast: false as const },
  };

  if (intent.kind === "unknown") {
    return okResult("paper", source, {
      ...baseTurn,
      nlExpansion: "off",
      nlExpansionNote: null,
      reply:
        "Paper agent only. Try: `truth AAPLx` · `quote 25 USDC AAPLx` · `swap AAPLx to MSFTx` · `credit` · `network` · `positions`. Broadcast is disabled.",
    });
  }

  if (!key) {
    return okResult("paper", source, {
      ...baseTurn,
      nlExpansion: "off",
      nlExpansionNote: "AGENTROUTER_API_KEY missing",
      reply: `${facts} AgentRouter key missing — live spine only, no NL expansion.`,
    });
  }

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You are FOLIO paper agent. Never claim fills, broadcasts, or unhackable security. If acquire gates are blocked, say so plainly. Mention pending corporate-action multiplier only when the live spine includes one; otherwise say none. Reply in ≤2 short sentences. Live spine facts are authoritative.",
          },
          {
            role: "user",
            content: `User said: ${raw}\nParsed intent: ${JSON.stringify(intent)}\nLive spine: ${facts}\nRemind: paper mode, broadcast disabled, wash fail-closed without Bitquery, Jupiter may be live/cached/stale-labeled.`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const waf =
        body.trimStart().startsWith("<!doctype") ||
        body.trimStart().startsWith("<html") ||
        /waf|aliyun|access denied/i.test(body);
      return okResult("paper", source, {
        ...baseTurn,
        nlExpansion: "failed",
        nlExpansionNote: waf
          ? `AgentRouter HTTP ${res.status} returned HTML/WAF — live spine kept (NL skipped)`
          : `AgentRouter HTTP ${res.status} — live spine kept (NL skipped)`,
        reply: `${facts} AgentRouter NL failed (HTTP ${res.status}${waf ? " · WAF/HTML" : ""}) — live spine only. Never a fill.`,
      });
    }
    const contentType = res.headers.get("content-type") ?? "";
    const rawBody = await res.text();
    if (
      !contentType.includes("json") ||
      rawBody.trimStart().startsWith("<!") ||
      rawBody.trimStart().startsWith("<html")
    ) {
      return okResult("paper", source, {
        ...baseTurn,
        nlExpansion: "failed",
        nlExpansionNote:
          "AgentRouter returned non-JSON (WAF/HTML) — live spine kept (NL skipped)",
        reply: `${facts} AgentRouter NL failed (WAF/HTML) — live spine only. Never a fill.`,
      });
    }
    let json: {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };
    try {
      json = JSON.parse(rawBody) as typeof json;
    } catch {
      return okResult("paper", source, {
        ...baseTurn,
        nlExpansion: "failed",
        nlExpansionNote: "AgentRouter JSON parse failed — live spine kept (NL skipped)",
        reply: `${facts} AgentRouter NL failed (bad JSON) — live spine only. Never a fill.`,
      });
    }
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return okResult("paper", source, {
        ...baseTurn,
        nlExpansion: "failed",
        nlExpansionNote: "AgentRouter empty completion — live spine kept (NL skipped)",
        reply: `${facts} AgentRouter NL empty — live spine only. Never a fill.`,
      });
    }
    const tokens = json.usage?.total_tokens ?? 0;
    return okResult("paper", source, {
      ...baseTurn,
      meteredCostUsd: (tokens / 1_000_000) * 0.15,
      nlExpansion: "ok",
      nlExpansionNote: null,
      reply: `${reply} · ${facts}`,
    });
  } catch (e) {
    return okResult("paper", source, {
      ...baseTurn,
      nlExpansion: "failed",
      nlExpansionNote: `AgentRouter error — live spine kept: ${String(e).slice(0, 160)}`,
      reply: `${facts} AgentRouter NL failed — live spine only. Never a fill.`,
    });
  }
}
