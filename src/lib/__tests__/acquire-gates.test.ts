import { describe, expect, it } from "vitest";
import { buildAcquireGateMessages } from "../acquire-gates";

describe("buildAcquireGateMessages", () => {
  it("blocks wash when market tape key is missing — consumer wording", () => {
    const g = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: false,
      wash: { kind: "adapter", reason: "bitquery_key_missing" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "unavailable" },
    });
    expect(g.canReview).toBe(false);
    expect(g.blockedReasons.join(" ")).toMatch(/Market tape unavailable/i);
    expect(g.blockedReasons.join(" ")).not.toMatch(/BITQUERY/i);
    expect(g.honestyNotes).toEqual([]);
  });

  it("labels missing equity ref without blocking review alone", () => {
    const g = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: true,
      wash: { kind: "pressure" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "pyth_missing" },
    });
    expect(g.divergeOk).toBe(true);
    expect(g.canReview).toBe(true);
    expect(g.blockedReasons).toEqual([]);
    expect(g.honestyNotes.join(" ")).toMatch(/equity ref|Yahoo|Finnhub/i);
  });

  it("blocks review on missing equity ref when strictFailClosed is on", () => {
    const g = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: true,
      wash: { kind: "pressure" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "pyth_missing" },
      strictFailClosed: true,
    });
    expect(g.divergeOk).toBe(false);
    expect(g.canReview).toBe(false);
    expect(g.blockedReasons.join(" ")).toMatch(/equity reference required/i);
    expect(g.honestyNotes.join(" ")).toMatch(/equity ref|Yahoo|Finnhub/i);
  });

  it("blocks unresolved diverge when strictFailClosed is on", () => {
    const g = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: true,
      wash: { kind: "pressure" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "unavailable" },
      strictFailClosed: true,
    });
    expect(g.divergeOk).toBe(false);
    expect(g.canReview).toBe(false);
    expect(g.blockedReasons.join(" ")).toMatch(/Price check unresolved/i);
  });

  it("blocks review on live diverge outside band", () => {
    const g = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: true,
      wash: { kind: "pressure" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "blocked" },
    });
    expect(g.divergeOk).toBe(false);
    expect(g.canReview).toBe(false);
    expect(g.blockedReasons.join(" ")).toMatch(/diverge/);
  });

  it("requires truth + wash + quote + diverge for canReview", () => {
    const g = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: true,
      wash: { kind: "pressure" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "ok" },
    });
    expect(g.canReview).toBe(true);
  });

  it("labels Raydium pool awareness without blocking review", () => {
    const g = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: true,
      wash: { kind: "pressure" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "ok" },
      pools: { kind: "ok", poolCount: 5 },
    });
    expect(g.canReview).toBe(true);
    expect(g.honestyNotes.join(" ")).toMatch(/Pool awareness|not a route guarantee/i);
  });

  it("labels empty/unavailable Raydium without inventing a hard block", () => {
    const empty = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: true,
      wash: { kind: "pressure" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "ok" },
      pools: { kind: "empty" },
    });
    expect(empty.canReview).toBe(true);
    expect(empty.honestyNotes.join(" ")).toMatch(/No pools observed|quote path/i);

    const down = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: true,
      wash: { kind: "pressure" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "ok" },
      pools: { kind: "unavailable", reason: "raydium_http_error" },
    });
    expect(down.canReview).toBe(true);
    expect(down.blockedReasons).toEqual([]);
    expect(down.honestyNotes.join(" ")).toMatch(/Pool awareness unavailable/i);
  });

  it("labels Scaled UI match/mismatch without inventing a hard block", () => {
    const match = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: true,
      wash: { kind: "pressure" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "ok" },
      scaledUi: { kind: "match", note: "API ↔ on-chain within 1 bps" },
    });
    expect(match.canReview).toBe(true);
    expect(match.honestyNotes.join(" ")).toMatch(/Share count on-chain matches/i);

    const mismatch = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: true,
      wash: { kind: "pressure" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "ok" },
      scaledUi: { kind: "mismatch", note: "diverge 50 bps" },
    });
    expect(mismatch.canReview).toBe(true);
    expect(mismatch.blockedReasons).toEqual([]);
    expect(mismatch.honestyNotes.join(" ")).toMatch(/differs|mismatch/i);
  });

  it("blocks Scaled UI mismatch when strictFailClosed is on", () => {
    const g = buildAcquireGateMessages({
      truthOk: true,
      tradingHalted: false,
      washOk: true,
      wash: { kind: "pressure" },
      quoteOk: true,
      quoteReason: null,
      diverge: { kind: "ok" },
      strictFailClosed: true,
      scaledUi: { kind: "mismatch", note: "diverge 50 bps" },
    });
    expect(g.canReview).toBe(false);
    expect(g.blockedReasons.join(" ")).toMatch(/Share-count mismatch/i);
  });
});
