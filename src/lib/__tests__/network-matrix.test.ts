import { describe, expect, it } from "vitest";
import { buildNetworkMatrix } from "../adapters/network-matrix";
import { errResult, okResult } from "../adapters/types";

const live = okResult("mainnet-read", "test.source", { ok: true });
const down = errResult("test.source", "missing", "not wired");

describe("buildNetworkMatrix honesty", () => {
  it("does not paint NestUSD or broadcast as live when unavailable/unfunded", () => {
    const nestusdDown = errResult(
      "nestusd",
      "nestusd_endpoint_unverified",
      "NestUSD xStock borrow capacity unverified — fail-closed.",
    );
    const rows = buildNetworkMatrix({
      multiplier: live,
      pyth: down,
      jupiter: live,
      jupiterPrice: live,
      wash: down,
      kamino: live,
      jupiterLend: live,
      nestusd: nestusdDown,
      nestCredit: live,
      scaledUi: live,
      bitqueryKeyPresent: false,
      multiTenantKeysPresent: false,
      sessionSecretPresent: true,
      solanaRpcPublicFallback: true,
      broadcastFunded: false,
    });

    const byCap = Object.fromEntries(rows.map((r) => [r.capability, r]));

    expect(byCap["NestUSD capacity"]?.mode).toBe("unavailable");
    expect(byCap["NestUSD capacity"]?.detail).toMatch(/fail-closed|NestUSD/i);
    expect(byCap["Nest.credit vault awareness (read)"]?.mode).toBe("mainnet-read");
    expect(byCap["Nest.credit vault awareness (read)"]?.detail).toMatch(
      /not NestUSD borrow/i,
    );

    expect(byCap["Broadcast swap / borrow"]?.mode).toBe("unavailable");
    expect(byCap["Broadcast swap / borrow"]?.detail).toMatch(/BROADCAST_PAUSED|quote-only/i);

    expect(byCap["Wash / linked-flow gate"]?.mode).toBe("unavailable");
    expect(byCap["Wash / linked-flow gate"]?.detail).toMatch(/BITQUERY_API_KEY missing/);

    expect(byCap["Multi-tenant sessions (Privy + Supabase)"]?.mode).toBe("unavailable");

    expect(byCap["Kamino xStocks market (read)"]?.mode).toBe("mainnet-read");
    expect(byCap["Kamino xStocks market (read)"]?.detail).toMatch(
      /no fork harness|unavailable until funded/i,
    );
    expect(byCap["Watch-wallet mainnet-read qty"]?.mode).toBe("mainnet-read");
    expect(byCap["Ephemeral wallet inspect"]?.mode).toBe("mainnet-read");
    expect(byCap["Ephemeral wallet inspect"]?.detail).toMatch(/not auth|\?inspect=/i);
    expect(byCap["On-chain Scaled UI (Token-2022)"]?.detail).toMatch(/public RPC fallback/);

    expect(byCap["Jupiter Price v3 (venue + stockData)"]?.detail).toMatch(
      /TTL 30s|stale≤120s on 429/,
    );
    expect(byCap["Jupiter swap quote"]?.detail).toMatch(
      /quote-only|TTL 20s|stale≤120s on 429/,
    );
  });

  it("labels wash live only when Bitquery key present and gate ok", () => {
    const rows = buildNetworkMatrix({
      multiplier: live,
      pyth: live,
      jupiter: live,
      jupiterPrice: live,
      wash: live,
      kamino: live,
      jupiterLend: live,
      nestusd: down,
      nestCredit: live,
      scaledUi: live,
      bitqueryKeyPresent: true,
      multiTenantKeysPresent: true,
      sessionSecretPresent: true,
      solanaRpcPublicFallback: false,
      broadcastFunded: false,
    });
    const wash = rows.find((r) => r.capability.startsWith("Wash"));
    expect(wash?.mode).toBe("mainnet-read");
    expect(wash?.detail).toMatch(/Bitquery live/);
  });
});
