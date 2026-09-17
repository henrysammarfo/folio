import { describe, expect, it } from "vitest";
import {
  PINNED_PLASMA,
  PINNED_PLASMA_ID,
  PINNED_TRADE_JOURNAL,
  PINNED_TRADE_JOURNAL_ID,
} from "../lab/twentyfirst-pins";

describe("twentyfirst pins", () => {
  it("pins Plasma 24346 and Trade Journal 27124 for lab adaptation", () => {
    expect(PINNED_PLASMA_ID).toBe(24346);
    expect(PINNED_TRADE_JOURNAL_ID).toBe(27124);
    expect(PINNED_PLASMA.id).toBe(24346);
    expect(PINNED_TRADE_JOURNAL.id).toBe(27124);
    expect(PINNED_TRADE_JOURNAL.name).toMatch(/trade journal/i);
  });
});
