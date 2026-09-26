/**
 * FOLIO GTM draft bot — Grok / AgentRouter drafts for X distribution.
 * Default: write queue only. Never auto-posts unless FOLIO_GTM_AUTO_POST=true
 * and X API keys are present (still fail-closed on missing secrets).
 *
 * Usage:
 *   npx tsx scripts/gtm-draft.mts              # draft next batch into memory/gtm-queue.json
 *   npx tsx scripts/gtm-draft.mts --count 5
 *   npx tsx scripts/gtm-draft.mts --theme wash
 *
 * Secrets (gitignored .env only):
 *   XAI_API_KEY + optional XAI_BASE_URL / XAI_MODEL=grok-2-latest
 *   or AGENTROUTER_API_KEY (+ BASE_URL / MODEL)
 *   Optional publish: X_API_KEY X_API_SECRET X_ACCESS_TOKEN X_ACCESS_SECRET
 *   FOLIO_GTM_AUTO_POST=false (default)
 */
import { applyDotEnv } from "./load-dotenv.ts";
applyDotEnv();

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUEUE_PATH = join(ROOT, "memory", "gtm-queue.json");

const SOFT_PITCH =
  "FOLIO buys the US stocks you want on Solana. It keeps share counts honest, will not buy in shady pools, and lets you borrow cash without selling.";

const DEMO = "https://folio-tawny-one.vercel.app";
const PITCH = "https://folio-tawny-one.vercel.app/pitch";

type QueueItem = {
  id: string;
  createdAt: string;
  theme: string;
  status: "draft" | "approved" | "posted" | "rejected";
  text: string;
  chars: number;
  notes?: string;
};

type QueueFile = {
  updatedAt: string;
  items: QueueItem[];
};

const THEMES: Record<string, string> = {
  launch: "Launch / live desk announcement",
  truth: "Share counts / Scaled UI honesty after dividends",
  wash: "Refuse dirty pools — fail-closed",
  buy: "Jupiter buy in desk — user signs",
  borrow: "Borrow without selling — Kamino",
  prestocks: "PreStocks desk separate from Tessera",
  tessera: "Tessera T-tokens separate desk",
  colosseum: "World's Fair / Colosseum — ask for brutal feedback",
  beta: "Closed beta / quote-only honesty",
  founder: "Accra founder note — grit not pity",
};

function loadQueue(): QueueFile {
  if (!existsSync(QUEUE_PATH)) {
    return { updatedAt: new Date().toISOString(), items: [] };
  }
  return JSON.parse(readFileSync(QUEUE_PATH, "utf8")) as QueueFile;
}

function saveQueue(q: QueueFile) {
  mkdirSync(dirname(QUEUE_PATH), { recursive: true });
  q.updatedAt = new Date().toISOString();
  writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2) + "\n");
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let count = 3;
  let theme = "launch";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--count" && argv[i + 1]) count = Math.min(10, Number(argv[++i]) || 3);
    if (argv[i] === "--theme" && argv[i + 1]) theme = String(argv[++i]);
  }
  if (!(theme in THEMES)) theme = "launch";
  return { count, theme };
}

function resolveLlm(): {
  key: string;
  base: string;
  model: string;
  label: string;
} | null {
  const xai = process.env["XAI_API_KEY"]?.trim();
  if (xai) {
    return {
      key: xai,
      base: (process.env["XAI_BASE_URL"]?.trim() || "https://api.x.ai/v1").replace(/\/$/, ""),
      model: process.env["XAI_MODEL"]?.trim() || "grok-2-latest",
      label: "xai-grok",
    };
  }
  const ar = process.env["AGENTROUTER_API_KEY"]?.trim();
  if (ar) {
    return {
      key: ar,
      base: (process.env["AGENTROUTER_BASE_URL"]?.trim() || "https://agentrouter.org/v1").replace(
        /\/$/,
        "",
      ),
      model: process.env["AGENTROUTER_MODEL"]?.trim() || "gpt-4o-mini",
      label: "agentrouter",
    };
  }
  return null;
}

async function draftWithLlm(
  llm: { key: string; base: string; model: string },
  theme: string,
  n: number,
): Promise<string[]> {
  const themeLabel = THEMES[theme] ?? theme;
  const system = `You write short X/Twitter posts for FOLIO, a Solana stock desk.
Hard rules:
- Soft pitch only. Never say unhackable, guaranteed, or invent user counts / fills / TVL.
- Max 280 characters per post (no-tick account). Prefer ≤240.
- No emojis. No engagement bait ("like if"). No hashtag spam (at most one of #Stocklana or #Solana).
- Include demo URL only when natural: ${DEMO}
- Pitch deck when useful: ${PITCH}
- Soft pitch lock: ${SOFT_PITCH}
Return ONLY a JSON array of ${n} strings. No markdown.`;

  const user = `Theme: ${themeLabel}. Write ${n} distinct posts in that lane for Colosseum World's Fair visibility.`;

  const res = await fetch(`${llm.base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${llm.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: llm.model,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content?.trim() ?? "[]";
  const jsonText = content.replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(jsonText) as unknown;
  if (!Array.isArray(parsed)) throw new Error("LLM did not return a JSON array");
  return parsed.map((x) => String(x)).filter(Boolean);
}

/** Fail-closed local templates when no LLM key — still useful for Henry. */
function localTemplates(theme: string, n: number): string[] {
  const bank: Record<string, string[]> = {
    launch: [
      `Token balances can lie after dividends.\n\nFOLIO — honest stock desk on Solana.\nTruth → wash → buy → borrow without selling.\n\n${DEMO}`,
      `Built for #Stocklana. Shipping for Colosseum.\n\nHonest shares. Refuse dirty pools. Borrow without selling.\n\n${DEMO}`,
    ],
    truth: [
      `Share counts drift after corporate actions.\n\nFOLIO shows live economic shares on Solana — fail-closed if feeds die.\n\n${DEMO}/truth?symbol=AAPLx`,
    ],
    wash: [
      `If the tape looks dirty, we refuse size.\n\nFail-closed beats fake green.\n\n${DEMO}/desk/acquire`,
    ],
    buy: [
      `USDC → AAPLx inside FOLIO.\nLive Jupiter quote. You sign.\n\n${DEMO}/desk/acquire`,
    ],
    borrow: [
      `Keep the shares. Unlock USDC.\nKamino rails in-desk — no forced selling.\n\n${DEMO}/desk/credit`,
    ],
    prestocks: [
      `PreStocks desk ≠ Tessera.\nLive catalog. Buys stay in FOLIO. No cross-issuer soup.\n\n${DEMO}/desk/preipo`,
    ],
    tessera: [
      `Tessera T-tokens get their own room.\nOpenAI · SpaceX · Kalshi — labeled loan participation.\n\n${DEMO}/desk/tessera`,
    ],
    colosseum: [
      `Colosseum builders — brutal take welcome.\nIs FOLIO desk-worthy or still demo theater?\n\nDemo ${DEMO}\nPitch ${PITCH}`,
    ],
    beta: [
      `Closed beta: browse, quote, inspect.\nFills stay labeled until policy arms them.\n\n${DEMO}/beta`,
    ],
    founder: [
      `Shipping FOLIO from Accra.\nPedigree won’t carry this — the desk must.\n\n${DEMO}`,
    ],
  };
  const list = bank[theme] ?? bank.launch;
  const out: string[] = [];
  while (out.length < n) out.push(...list);
  return out.slice(0, n);
}

async function main() {
  const { count, theme } = parseArgs();
  const llm = resolveLlm();
  let drafts: string[] = [];
  let source = "local-templates";

  if (llm) {
    try {
      drafts = await draftWithLlm(llm, theme, count);
      source = llm.label;
    } catch (e) {
      console.error("LLM draft failed — falling back to local templates:", String(e));
      drafts = localTemplates(theme, count);
    }
  } else {
    console.error(
      "No XAI_API_KEY or AGENTROUTER_API_KEY — using local soft-pitch templates (fail-closed).",
    );
    drafts = localTemplates(theme, count);
  }

  const q = loadQueue();
  const now = Date.now();
  for (let i = 0; i < drafts.length; i++) {
    const text = drafts[i]!.slice(0, 280);
    q.items.unshift({
      id: `gtm_${now}_${i}`,
      createdAt: new Date().toISOString(),
      theme,
      status: "draft",
      text,
      chars: text.length,
      notes: `source=${source}`,
    });
  }
  saveQueue(q);

  const auto = process.env["FOLIO_GTM_AUTO_POST"]?.trim() === "true";
  console.log(
    JSON.stringify(
      {
        ok: true,
        source,
        theme,
        drafted: drafts.length,
        queuePath: "memory/gtm-queue.json",
        autoPost: auto,
        note: auto
          ? "FOLIO_GTM_AUTO_POST=true but publish path is not wired yet — approve drafts manually on X."
          : "Approve drafts manually. Ship stays with Cursor; distribution drafts are queued.",
        preview: drafts.map((t) => ({ chars: t.length, text: t.slice(0, 120) })),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
