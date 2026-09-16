import { describe, expect, it } from "vitest";
import {
  buildNetroLiveGateLabels,
  NETRO_LIVE_GATE_DEFAULTS,
} from "../netro-live-gates";

describe("buildNetroLiveGateLabels", () => {
  it("defaults stay fail-closed when matrix empty", () => {
    expect(
      buildNetroLiveGateLabels({ rows: [], broadcastPaused: true }),
    ).toEqual(NETRO_LIVE_GATE_DEFAULTS);
  });

  it("maps live matrix modes without inventing greens", () => {
    const labels = buildNetroLiveGateLabels({
      rows: [
        {
          capability: "Wash / linked-flow gate",
          mode: "unavailable",
          detail: "BITQUERY_API_KEY missing",
        },
        {
          capability: "Jupiter swap quote",
          mode: "quote-only",
          detail: "quote-only",
        },
        {
          capability: "NestUSD capacity",
          mode: "unavailable",
          detail: "unverified",
        },
        {
          capability: "Pyth Hermes equity reference",
          mode: "unavailable",
          detail: "pyth_api_key_missing",
        },
        {
          capability: "On-chain Scaled UI (Token-2022)",
          mode: "mainnet-read",
          detail: "solana-rpc",
        },
        {
          capability: "Kamino xStocks market (read)",
          mode: "mainnet-read",
          detail: "kamino",
        },
        {
          capability: "Multi-tenant sessions (Privy + Supabase)",
          mode: "unavailable",
          detail: "keys missing",
        },
      ],
      broadcastPaused: true,
      kaminoMaxLtv: 0.4,
      illustrativeBorrowUsd: 2381.8,
      creditQtyLabel: "paper",
    });
    expect(labels.wash).toBe("Fail-closed");
    expect(labels.quote).toBe("≤$1 inspect");
    expect(labels.broadcast).toBe("Paused");
    expect(labels.nestUsd).toBe("Unavailable");
    expect(labels.pyth).toBe("Unavailable");
    expect(labels.scaledUi).toBe("Mainnet-read");
    expect(labels.kamino).toBe("Mainnet-read");
    expect(labels.multiTenant).toBe("Unavailable");
    expect(labels.kaminoLtv).toBe("0.40");
    expect(labels.creditCapacity).toMatch(/\$2,382/);
    expect(labels.creditCapacity).toMatch(/paper/);
    expect(labels.creditCapacity).toMatch(/no broadcast/);
    expect(labels.quoteOut).toBe("Quote pending");
  });

  it("surfaces live Jupiter out amount without inventing a fill", () => {
    const labels = buildNetroLiveGateLabels({
      rows: [
        {
          capability: "Jupiter swap quote",
          mode: "quote-only",
          detail: "quote-only",
        },
      ],
      broadcastPaused: true,
      jupiterOutUi: 0.002994,
      jupiterSource: "api.jup.ag/swap/v1/quote · cached 12s",
    });
    expect(labels.quoteOut).toBe("0.002994 AAPLx");
    expect(labels.quoteMeta).toMatch(/cached/);
    expect(labels.quoteMeta).toMatch(/no broadcast/);
  });

  it("labels wash Live only when mainnet-read", () => {
    const labels = buildNetroLiveGateLabels({
      rows: [
        {
          capability: "Wash / linked-flow gate",
          mode: "mainnet-read",
          detail: "Bitquery live",
        },
      ],
      broadcastPaused: false,
    });
    expect(labels.wash).toBe("Live");
    expect(labels.broadcast).toBe("Armed");
  });
});
