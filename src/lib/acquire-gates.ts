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
  /**
   * On-chain Token-2022 Scaled UI vs API — honesty-only unless strict + mismatch/off.
   */
  scaledUi?:
    | { kind: "match"; note: string }
    | { kind: "mismatch"; note: string }
    | { kind: "unavailable"; note: string };
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
        "Market tape unavailable — buy paused until wash checks are live",
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
    blockedReasons.push("Equity ref vs Jupiter venue diverge outside band");
  } else if (input.diverge.kind === "pyth_missing") {
      honestyNotes.push(
      "Live equity ref unavailable (Yahoo/Finnhub) · labeled; does not invent a pass",
    );
    if (input.strictFailClosed) {
      divergeOk = false;
      blockedReasons.push(
        "Live equity reference required before review",
      );
    }
  } else if (input.diverge.kind === "unavailable" && input.strictFailClosed) {
    divergeOk = false;
    blockedReasons.push(
      "Price check unresolved — review paused",
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

  if (input.scaledUi?.kind === "match") {
    honestyNotes.push(`Scaled UI: ${input.scaledUi.note}`);
  } else if (input.scaledUi?.kind === "mismatch") {
    honestyNotes.push(
      `Scaled UI mismatch: ${input.scaledUi.note} · labeled (does not alone block review unless Strict)`,
    );
    if (input.strictFailClosed) {
      blockedReasons.push(
        "Share-count mismatch on-chain — review paused",
      );
    }
  } else if (input.scaledUi?.kind === "unavailable") {
    honestyNotes.push(
      `Scaled UI: ${input.scaledUi.note} · labeled (does not invent an on-chain pass)`,
    );
    if (input.strictFailClosed) {
      blockedReasons.push(
        "On-chain share count unavailable — review paused",
      );
    }
  }

  const canReview =
    input.truthOk &&
    input.washOk &&
    input.quoteOk &&
    divergeOk &&
    !(
      input.strictFailClosed &&
      input.scaledUi != null &&
      input.scaledUi.kind !== "match"
    );

  return { divergeOk, canReview, blockedReasons, honestyNotes };
}
