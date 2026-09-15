import { errResult, okResult, type AdapterResult } from "../adapters/types";
import { fetchXStockAsset, fetchXStockMultiplier } from "../adapters/xstocks";
import { fetchJupiterQuote } from "../adapters/jupiter";
import { evaluateWashGate, washAllowsSize } from "../adapters/wash";
import { buildAcquireGateMessages } from "../acquire-gates";
import { isBroadcastPaused } from "../broadcast";

export type AgentIntent =
  | { kind: "quote"; symbol: string; spendUsdc: number }
  | { kind: "truth"; symbol: string }
  | { kind: "unknown"; raw: string };

export type AgentSpineEvidence = {
  truth?: {
    symbol: string;
    multiplier: number | null;
    /** Live xStocks pending newMultiplier — null means none on feed. */
    pendingMultiplier: number | null;
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
};

const MAX_SPEND = 25;

export function parsePaperIntent(raw: string): AgentIntent {
  const text = raw.trim();
  const quote = text.match(
    /quote\s+(\d+(?:\.\d+)?)\s*(?:usdc)?\s*(?:of|for)?\s*([A-Z]{1,6}x)/i,
  );
  const quoteAmt = quote?.[1];
  const quoteSym = quote?.[2];
  if (quoteAmt && quoteSym) {
    return {
      kind: "quote",
      spendUsdc: Math.min(Number(quoteAmt), MAX_SPEND),
      symbol: quoteSym.toUpperCase().endsWith("X")
        ? `${quoteSym.slice(0, -1).toUpperCase()}x`
        : `${quoteSym.toUpperCase()}x`,
    };
  }
  const truth = text.match(/(?:truth|multiplier)\s+([A-Z]{1,6}x)/i);
  const truthSym = truth?.[1];
  if (truthSym) {
    return {
      kind: "truth",
      symbol: truthSym.toUpperCase().endsWith("X")
        ? `${truthSym.slice(0, -1).toUpperCase()}x`
        : `${truthSym.toUpperCase()}x`,
    };
  }
  return { kind: "unknown", raw: text };
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
      facts: `No live spine for free text. Caps: ≤$${MAX_SPEND}, ${broadcastNote}.`,
    };
  }

  if (intent.kind === "truth") {
    const mult = await fetchXStockMultiplier(intent.symbol);
    if (!mult.ok) {
      const note = `${mult.reason}${mult.detail ? ` — ${mult.detail}` : ""}`;
      return {
        spine: {
          truth: {
            symbol: intent.symbol,
            multiplier: null,
            pendingMultiplier: null,
            mode: "unavailable",
            note,
          },
        },
        facts: `Truth ${intent.symbol} fail-closed (${note}). ${broadcastNote}.`,
      };
    }
    const pending = mult.data.pendingMultiplier;
    const caNote =
      pending != null
        ? `pending CA ${pending.toFixed(6)}×`
        : "no pending newMultiplier on live feed";
    const note = `live ×${mult.data.currentMultiplier.toFixed(6)} · ${caNote} · ${mult.source}`;
    return {
      spine: {
        truth: {
          symbol: intent.symbol,
          multiplier: mult.data.currentMultiplier,
          pendingMultiplier: pending,
          mode: mult.mode,
          note,
        },
      },
      facts: `Truth ${intent.symbol}: ${note}. ${broadcastNote}.`,
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
  const [quote, wash] = await Promise.all([
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
  ]);

  const washOk = washAllowsSize(wash);
  const gateMsgs = buildAcquireGateMessages({
    truthOk: true,
    tradingHalted: Boolean(asset.data.isTradingHalted),
    washOk,
    wash: wash.ok
      ? { kind: "pressure" }
      : { kind: "adapter", reason: wash.reason },
    quoteOk: quote.ok,
    quoteReason: quote.ok ? null : quote.reason,
    // Paper agent does not invent a Pyth pass on this path.
    diverge: { kind: "unavailable" },
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
      reply:
        "Paper agent only. Try: `truth AAPLx` or `quote 25 USDC AAPLx`. Broadcast is disabled.",
    });
  }

  if (!key) {
    return okResult("paper", source, {
      ...baseTurn,
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
      return errResult(source, "agentrouter_http_error", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) return errResult(source, "agentrouter_empty");
    const tokens = json.usage?.total_tokens ?? 0;
    return okResult("paper", source, {
      ...baseTurn,
      meteredCostUsd: (tokens / 1_000_000) * 0.15,
      reply: `${reply} · ${facts}`,
    });
  } catch (e) {
    return errResult(source, "agentrouter_failed", String(e));
  }
}
