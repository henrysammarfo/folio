import { describe, expect, it } from "vitest";
import { parsePaperIntent } from "../agent/paper-agent";

describe("parsePaperIntent", () => {
  it("parses quote intents with spend cap semantics left to runner", () => {
    const intent = parsePaperIntent("quote 25 USDC AAPLx");
    expect(intent).toEqual({ kind: "quote", spendUsdc: 25, symbol: "AAPLx" });
  });
  it("parses truth intents", () => {
    expect(parsePaperIntent("truth NVDAx")).toEqual({ kind: "truth", symbol: "NVDAx" });
  });
  it("returns unknown for free text", () => {
    expect(parsePaperIntent("buy everything")).toMatchObject({ kind: "unknown" });
  });
});
