import { describe, expect, it } from "vitest";
import { buildAcquireGateMessages } from "../acquire-gates";

describe("buildAcquireGateMessages", () => {
  it("names BITQUERY_API_KEY when wash adapter is missing the key", () => {
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
    expect(g.blockedReasons.join(" ")).toMatch(/BITQUERY_API_KEY/);
    expect(g.honestyNotes).toEqual([]);
  });

  it("labels missing PYTH_API_KEY without blocking review alone", () => {
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
    expect(g.honestyNotes.join(" ")).toMatch(/PYTH_API_KEY/);
  });

  it("blocks review on missing Pyth when strictFailClosed is on", () => {
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
    expect(g.blockedReasons.join(" ")).toMatch(/Strict fail-closed.*PYTH_API_KEY/i);
    expect(g.honestyNotes.join(" ")).toMatch(/PYTH_API_KEY/);
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
    expect(g.blockedReasons.join(" ")).toMatch(/Strict fail-closed/i);
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
});
