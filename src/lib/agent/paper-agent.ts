import { errResult, okResult, type AdapterResult } from "../adapters/types";
import { fetchXStockAsset, fetchXStockMultiplier } from "../adapters/xstocks";
import { fetchJupiterQuote } from "../adapters/jupiter";
import { isBroadcastPaused } from "../broadcast";

export type AgentIntent =
  | { kind: "quote"; symbol: string; spendUsdc: number }
  | { kind: "truth"; symbol: string }
  | { kind: "unknown"; raw: string };

export type AgentSpineEvidence = {
  truth?: {
    symbol: string;
    multiplier: number | null;
    mode: string;
    note: string;
  };
  quote?: {
    symbol: string;
    spendUsdc: number;
    outUiAmount: number | null;
    mode: string;
    note: string;
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
  const quote = text.match(/quote\s+(\d+(?:\.\d+)?)\s*(?:usdc)?\s*(?:of|for)?\s*([A-Z]{1,6}x)/i);
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

/** Live Block 0 reads for paper agent — never broadcasts. */
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
            mode: "unavailable",
            note,
          },
        },
        facts: `Truth ${intent.symbol} fail-closed (${note}). ${broadcastNote}.`,
      };
    }
    const note = `live ×${mult.data.currentMultiplier.toFixed(6)} · ${mult.source}`;
    return {
      spine: {
        truth: {
          symbol: intent.symbol,
          multiplier: mult.data.currentMultiplier,
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
          note,
        },
      },
      facts: `Quote ${intent.symbol} fail-closed (${note}). ${broadcastNote}.`,
    };
  }

  const amountRaw = Math.round(intent.spendUsdc * 1_000_000);
  const quote = await fetchJupiterQuote({
    outputMint: asset.data.solanaMint,
    amountRaw,
    outputDecimals: asset.data.decimals ?? 8,
  });

  if (!quote.ok) {
    const note = `${quote.reason}${quote.detail ? ` — ${quote.detail}` : ""}`;
    return {
      spine: {
        quote: {
          symbol: intent.symbol,
          spendUsdc: intent.spendUsdc,
          outUiAmount: null,
          mode: "unavailable",
          note,
        },
      },
      facts: `Quote ${intent.spendUsdc} USDC → ${intent.symbol} fail-closed (${note}). ${broadcastNote}.`,
    };
  }

  const note = `quote-only out≈${quote.data.outUiAmount.toFixed(6)} ${intent.symbol} · impact ${quote.data.priceImpactPct ?? "n/a"} · routes=${quote.data.routePlanLength}`;
  return {
    spine: {
      quote: {
        symbol: intent.symbol,
        spendUsdc: intent.spendUsdc,
        outUiAmount: quote.data.outUiAmount,
        mode: quote.mode,
        note,
      },
    },
    facts: `Quote ${intent.spendUsdc} USDC → ${intent.symbol}: ${note}. ${broadcastNote}. Never a fill.`,
  };
}

/** Paper-default agent. Live Block 0 spine always; AgentRouter only when keyed; never broadcasts. */
export async function runPaperAgent(raw: string): Promise<AdapterResult<AgentTurn>> {
  const source = "folio.agent.paper";
  const intent = parsePaperIntent(raw);
  const key = process.env["AGENTROUTER_API_KEY"]?.trim();
  const base = process.env["AGENTROUTER_BASE_URL"]?.trim() || "https://agentrouter.org/v1";
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
              "You are FOLIO paper agent. Never claim fills, broadcasts, or unhackable security. Reply in ≤2 short sentences. Live spine facts are authoritative.",
          },
          {
            role: "user",
            content: `User said: ${raw}\nParsed intent: ${JSON.stringify(intent)}\nLive spine: ${facts}\nRemind: paper mode, broadcast disabled, wash fail-closed without Bitquery.`,
          },
        ],
      }),
    });
    if (!res.ok) return errResult(source, "agentrouter_http_error", `HTTP ${res.status}`);
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
