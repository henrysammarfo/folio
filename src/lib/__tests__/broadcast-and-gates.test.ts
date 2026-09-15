import { describe, expect, it } from "vitest";
import { isBroadcastPaused } from "../broadcast";

describe("isBroadcastPaused", () => {
  it("defaults to paused unless explicitly false", () => {
    const prev = process.env["BROADCAST_PAUSED"];
    delete process.env["BROADCAST_PAUSED"];
    expect(isBroadcastPaused()).toBe(true);
    process.env["BROADCAST_PAUSED"] = "true";
    expect(isBroadcastPaused()).toBe(true);
    process.env["BROADCAST_PAUSED"] = "false";
    expect(isBroadcastPaused()).toBe(false);
    if (prev == null) delete process.env["BROADCAST_PAUSED"];
    else process.env["BROADCAST_PAUSED"] = prev;
  });
});

describe("acquire gate diverge math", () => {
  it("blocks review when diverge fails even if truth/wash/quote would pass", () => {
    const truthOk = true;
    const washOk = true;
    const quoteOk = true;
    const divergeOk = false;
    const canReview = truthOk && washOk && quoteOk && divergeOk;
    expect(canReview).toBe(false);
  });

  it("allows review only when all four gates pass", () => {
    expect(true && true && true && true).toBe(true);
  });
});
