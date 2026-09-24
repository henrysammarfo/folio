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

  it("resolves credit-board faces for SPY / QQQ / GOOGL / cbBTC", () => {
    expect(underlyingKey("cbBTC")).toBe("CBBTC");
    expect(underlyingKey("SPYx")).toBe("SPY");
    const spy = logoCandidates({ symbol: "SPYx", underlying: "SPY" });
    expect(spy.some((u) => /ssga|clearbit/i.test(u))).toBe(true);
    const btc = logoCandidates({ symbol: "cbBTC" });
    expect(btc.some((u) => /cbbtc|coinbase|coingecko/i.test(u))).toBe(true);
    const goog = logoCandidates({ symbol: "GOOGLx", underlying: "GOOGL" });
    expect(goog.some((u) => u.includes("google.com"))).toBe(true);
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
