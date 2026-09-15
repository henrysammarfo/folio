import { errResult, okResult, type AdapterResult } from "../adapters/types";

export type AgentIntent =
  | { kind: "quote"; symbol: string; spendUsdc: number }
  | { kind: "truth"; symbol: string }
  | { kind: "unknown"; raw: string };

export type AgentTurn = {
  mode: "paper";
  intent: AgentIntent;
  meteredCostUsd: number;
  model: string | null;
  reply: string;
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

/** Paper-default agent. AgentRouter only when keyed; never broadcasts. */
export async function runPaperAgent(raw: string): Promise<AdapterResult<AgentTurn>> {
  const source = "folio.agent.paper";
  const intent = parsePaperIntent(raw);
  const key = process.env["AGENTROUTER_API_KEY"]?.trim();
  const base = process.env["AGENTROUTER_BASE_URL"]?.trim() || "https://agentrouter.org/v1";
  const model = process.env["AGENTROUTER_MODEL"]?.trim() || "gpt-4o-mini";

  const baseTurn = {
    mode: "paper" as const,
    intent,
    meteredCostUsd: 0,
    model: key ? model : null,
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
      reply: `Parsed ${intent.kind} for ${"symbol" in intent ? intent.symbol : "?"} — AgentRouter key missing, so no NL expansion. Caps: ≤$${MAX_SPEND}, broadcast=false.`,
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
              "You are FOLIO paper agent. Never claim fills, broadcasts, or unhackable security. Reply in ≤2 short sentences. Intent is already parsed.",
          },
          {
            role: "user",
            content: `User said: ${raw}\nParsed intent: ${JSON.stringify(intent)}\nRemind: paper mode, broadcast disabled, wash fail-closed without Bitquery.`,
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
      reply,
    });
  } catch (e) {
    return errResult(source, "agentrouter_failed", String(e));
  }
}
