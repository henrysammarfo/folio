import { describe, expect, it } from "vitest";
import {
  initialsForSymbol,
  logoCandidates,
  underlyingKey,
  xStockLogoUrl,
} from "../logo-resolve";

describe("logo-resolve", () => {
  it("uses Backed single-x CDN paths (not ARMXx)", () => {
    expect(xStockLogoUrl("ARMx")).toContain("/ARMx.png");
    expect(xStockLogoUrl("GMEx")).toContain("/GMEx.png");
    const c = logoCandidates({ symbol: "ARMXx", underlying: "ARM" });
    expect(c.some((u) => u.includes("/ARMx.png"))).toBe(true);
  });

  it("maps Tessera T-symbols to company domains", () => {
    expect(underlyingKey("T-OpenAI")).toBe("OPENAI");
    const c = logoCandidates({ symbol: "T-OpenAI" });
    expect(c.some((u) => u.includes("openai.com"))).toBe(true);
    expect(initialsForSymbol("T-SpaceX")).toBe("SP");
  });

  it("prefers provided logo then CDN then favicon", () => {
    const c = logoCandidates({
      symbol: "AAPLx",
      underlying: "AAPL",
      logo: "https://example.com/a.png",
    });
    expect(c[0]).toBe("https://example.com/a.png");
    expect(c[1]).toContain("/AAPLx.png");
    expect(c.some((u) => u.includes("apple.com"))).toBe(true);
  });
});
