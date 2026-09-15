/**
 * Pure acquire-gate messaging — keep Bitquery/Pyth honesty labels out of
 * invent-a-pass theater. Missing Pyth is labeled only; it does not alone block review.
 * Raydium pool awareness is honesty-only (not a route guarantee / not a hard gate).
 */

export type AcquireGateInputs = {
  truthOk: boolean;
  tradingHalted: boolean;
  washOk: boolean;
  /** When wash fails: pressure block vs adapter reason code */
  wash:
    | { kind: "pressure" }
    | { kind: "adapter"; reason: string };
  quoteOk: boolean;
  quoteReason: string | null;
  /** Live diverge only when both venues available */
  diverge:
    | { kind: "ok" }
    | { kind: "blocked" }
    | { kind: "pyth_missing" }
    | { kind: "unavailable" };
  /**
   * When true (desk preference), unresolved required signals — including
   * missing Pyth — also block review instead of honesty-only labeling.
   */
  strictFailClosed?: boolean;
  /**
   * Raydium pool awareness — never alone blocks review.
   * Jupiter quote remains the acquire path; wash still required.
   */
  pools?:
    | { kind: "ok"; poolCount: number }
    | { kind: "empty" }
    | { kind: "unavailable"; reason: string };
};

export type AcquireGateMessages = {
  divergeOk: boolean;
  canReview: boolean;
  /** Reasons that keep Continue / review blocked */
  blockedReasons: string[];
  /** Unavailable references that do not invent a pass or alone block review */
  honestyNotes: string[];
};

export function buildAcquireGateMessages(input: AcquireGateInputs): AcquireGateMessages {
  const blockedReasons: string[] = [];
  const honestyNotes: string[] = [];

  if (!input.truthOk) {
    blockedReasons.push("Corporate-action / asset truth unavailable");
  }
  if (input.tradingHalted) {
    blockedReasons.push("Trading halted per xStocks API");
  }
  if (!input.washOk) {
    if (input.wash.kind === "pressure") {
      blockedReasons.push("Wash pressure blocked");
    } else if (input.wash.reason === "bitquery_key_missing") {
      blockedReasons.push(
        "Wash gate: BITQUERY_API_KEY missing · fail-closed (set on Vercel + .env)",
      );
    } else {
      blockedReasons.push(`Wash gate: ${input.wash.reason}`);
    }
  }
  if (!input.quoteOk) {
    blockedReasons.push(
      `Jupiter quote: ${input.quoteReason ?? "unavailable"}`,
    );
  }

  let divergeOk = true;
  if (input.diverge.kind === "blocked") {
    divergeOk = false;
    blockedReasons.push("Pyth vs Jupiter venue diverge outside band");
  } else if (input.diverge.kind === "pyth_missing") {
    honestyNotes.push(
      "Pyth: PYTH_API_KEY missing · Hermes equity reference unavailable (labeled; does not invent a pass)",
    );
    if (input.strictFailClosed) {
      divergeOk = false;
      blockedReasons.push(
        "Strict fail-closed: PYTH_API_KEY missing · Hermes reference required before review",
      );
    }
  } else if (input.diverge.kind === "unavailable" && input.strictFailClosed) {
    divergeOk = false;
    blockedReasons.push(
      "Strict fail-closed: venue diverge unresolved · review blocked",
    );
  }

  if (input.pools?.kind === "ok") {
    honestyNotes.push(
      `Raydium: ${input.pools.poolCount} pool(s) observed · awareness only · not a route guarantee · wash still required`,
    );
  } else if (input.pools?.kind === "empty") {
    honestyNotes.push(
      "Raydium: zero pools observed for mint · awareness only · Jupiter quote remains the path; wash still required",
    );
  } else if (input.pools?.kind === "unavailable") {
    honestyNotes.push(
      `Raydium pool awareness unavailable (${input.pools.reason}) · Jupiter quote remains the path; wash still required`,
    );
  }

  const canReview =
    input.truthOk && input.washOk && input.quoteOk && divergeOk;

  return { divergeOk, canReview, blockedReasons, honestyNotes };
}
