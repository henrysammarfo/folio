import { describe, expect, it } from "vitest";
import { fetchPreStocksCatalog } from "../adapters/prestocks";
import { fetchTesseraCatalog } from "../adapters/tessera";

describe("PreStocks catalog", () => {
  it("returns live PreStocks-only rows with mints", async () => {
    const res = await fetchPreStocksCatalog();
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.rows.length).toBeGreaterThan(3);
    expect(res.data.note).toMatch(/PreStocks-only/i);
    for (const row of res.data.rows) {
      expect(row.mint.length).toBeGreaterThan(30);
      expect(row.symbol.length).toBeGreaterThan(2);
    }
  }, 20_000);
});

describe("Tessera catalog", () => {
  it("returns live T-token rows with mints", async () => {
    const res = await fetchTesseraCatalog();
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.rows.length).toBeGreaterThanOrEqual(3);
    expect(res.data.note).toMatch(/Tessera/i);
    const symbols = res.data.rows.map((r) => r.symbol);
    expect(symbols.some((s) => /openai/i.test(s))).toBe(true);
  }, 20_000);
});
