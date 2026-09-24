import { describe, expect, it } from "vitest";
import {
  evaluateCashSession,
  sessionAllowsSize,
} from "../adapters/session-gate";
import {
  FOLIO_STOCK_CURVE,
  folioStockCurveStatus,
  METEORA_DBC_PROGRAM,
} from "../adapters/stock-curve";

describe("cash session gate", () => {
  it("returns a labeled mainnet-read session", () => {
    const s = evaluateCashSession(new Date("2026-09-24T15:00:00Z")); // Wed afternoon UTC
    expect(s.ok).toBe(true);
    if (!s.ok) return;
    expect(s.mode).toBe("mainnet-read");
    expect(s.data.label.length).toBeGreaterThan(3);
    expect(s.data.nyWeekday).toBeTruthy();
  });

  it("refuses size when session closed", () => {
    const closed = evaluateCashSession(new Date("2026-09-26T18:00:00Z")); // Sat
    expect(closed.ok).toBe(true);
    if (!closed.ok) return;
    expect(closed.data.open).toBe(false);
    const gate = sessionAllowsSize(closed);
    expect(gate.ok).toBe(false);
  });
});

describe("FOLIO stock curve (Meteora DBC)", () => {
  it("locks USDC gentle fixed/short-linear cash-close preset", () => {
    expect(FOLIO_STOCK_CURVE.quoteMint).toBe("USDC");
    expect(FOLIO_STOCK_CURVE.curve).toBe("gentle_high_liquidity");
    expect(FOLIO_STOCK_CURVE.fee).toBe("fixed_or_short_linear");
    expect(FOLIO_STOCK_CURVE.startPricePolicy).toBe("last_cash_close");
    expect(FOLIO_STOCK_CURVE.programId).toBe(METEORA_DBC_PROGRAM);
    expect(FOLIO_STOCK_CURVE.graduationUsdc).toBe(750);
  });

  it("reports config live with demo pool pending by default", () => {
    const prev = process.env["FOLIO_DBC_DEVNET_POOL"];
    delete process.env["FOLIO_DBC_DEVNET_POOL"];
    const st = folioStockCurveStatus();
    expect(st.ok).toBe(true);
    if (!st.ok) return;
    expect(st.data.demoPool).toBeNull();
    expect(st.data.note).toMatch(/demo pool pending/i);
    if (prev !== undefined) process.env["FOLIO_DBC_DEVNET_POOL"] = prev;
  });
});
