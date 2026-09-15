/**
 * Live Empire smoke — probes mainnet-read adapters and fails closed if the
 * honesty matrix paints NestUSD / wash-without-Bitquery / multi-tenant /
 * broadcast as live when keys/funding are missing.
 */
import { fetchXStockAsset, fetchXStockMultiplier } from "../src/lib/adapters/xstocks.ts";
import { fetchKaminoXStocksMarket } from "../src/lib/adapters/kamino.ts";
import { fetchJupiterLendEarn } from "../src/lib/adapters/jupiter-lend.ts";
import { fetchNestUsdStatus } from "../src/lib/adapters/nestusd.ts";
import { fetchRaydiumPoolsForMint } from "../src/lib/adapters/pools.ts";
import { fetchScaledUiOnchain } from "../src/lib/adapters/scaled-ui.ts";
import { fetchPythEquityPrice } from "../src/lib/adapters/pyth.ts";
import { fetchJupiterQuote, fetchJupiterTokenPrice } from "../src/lib/adapters/jupiter.ts";
import { evaluateWashGate } from "../src/lib/adapters/wash.ts";
import { buildNetworkMatrix } from "../src/lib/adapters/network-matrix.ts";
import { resolveSolanaRpcUrl } from "../src/lib/adapters/solana-rpc.ts";
import { getAuthProviderStatus } from "../src/lib/auth/session.ts";
import { parsePaperIntent } from "../src/lib/agent/paper-agent.ts";
import { isBroadcastPaused } from "../src/lib/broadcast.ts";

function must(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`smoke-empire honesty fail: ${msg}`);
}

async function main() {
  const symbol = "AAPLx";
  const [asset, mult] = await Promise.all([
    fetchXStockAsset(symbol),
    fetchXStockMultiplier(symbol),
  ]);
  console.log("multiplier", mult.ok ? mult.data.currentMultiplier : mult);
  console.log("asset", asset.ok ? asset.data.solanaMint : asset);
  must(mult.ok, "xStocks multiplier must be live for Empire smoke");

  const mint = asset.ok ? asset.data.solanaMint : null;
  const underlying = asset.ok ? asset.data.underlyingSymbol : "AAPL";
  const decimals = asset.ok && asset.data.decimals != null ? asset.data.decimals : 8;
  const rpc = resolveSolanaRpcUrl();

  const unavailablePrice = {
    ok: false as const,
    mode: "unavailable" as const,
    asOf: new Date().toISOString(),
    source: "api.jup.ag/price/v3",
    reason: "xstock_mint_missing",
  };

  const [pyth, jupiterPrice, wash, kamino, jupiterLend, nestusd, scaledUi] =
    await Promise.all([
      fetchPythEquityPrice(underlying),
      mint ? fetchJupiterTokenPrice(mint) : Promise.resolve(unavailablePrice),
      evaluateWashGate({ symbol, mint, notionalUsd: 100 }),
      fetchKaminoXStocksMarket(),
      fetchJupiterLendEarn(),
      fetchNestUsdStatus(),
      mint
        ? fetchScaledUiOnchain(mint)
        : Promise.resolve({
            ok: false as const,
            mode: "unavailable" as const,
            asOf: new Date().toISOString(),
            source: "solana-rpc.scaled-ui",
            reason: "xstock_mint_missing",
          }),
    ]);

  const jupiter = mint
    ? await fetchJupiterQuote({
        outputMint: mint,
        amountRaw: 1_000_000,
        outputDecimals: decimals,
      })
    : ({
        ok: false,
        mode: "unavailable" as const,
        asOf: new Date().toISOString(),
        source: "api.jup.ag/swap/v1/quote",
        reason: "xstock_mint_missing",
      } as const);

  console.log("kamino", kamino.ok ? "ok" : kamino);
  console.log("lend", jupiterLend.ok ? "ok" : jupiterLend);
  console.log("nest", nestusd);
  console.log("wash", wash.ok ? wash.data : wash);
  console.log("pyth", pyth.ok ? "ok" : pyth);
  console.log("jupiter quote", jupiter.ok ? "ok" : jupiter);
  if (mint) {
    console.log("pools", await fetchRaydiumPoolsForMint(mint));
    console.log("scaled-ui", scaledUi.ok ? "ok" : scaledUi);
  }

  const bitqueryKeyPresent = Boolean(process.env["BITQUERY_API_KEY"]?.trim());
  const multiTenantKeysPresent = Boolean(
    process.env["PRIVY_APP_ID"]?.trim() &&
      process.env["PRIVY_APP_SECRET"]?.trim() &&
      process.env["SUPABASE_URL"]?.trim() &&
      process.env["SUPABASE_ANON_KEY"]?.trim() &&
      process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim() &&
      (process.env["FOLIO_SESSION_SECRET"]?.trim().length ?? 0) >= 16,
  );
  const sessionSecretPresent =
    (process.env["FOLIO_SESSION_SECRET"]?.trim().length ?? 0) >= 16;

  const rows = buildNetworkMatrix({
    multiplier: mult,
    pyth,
    jupiter,
    jupiterPrice,
    wash,
    kamino,
    jupiterLend,
    nestusd,
    scaledUi,
    bitqueryKeyPresent,
    multiTenantKeysPresent,
    sessionSecretPresent,
    solanaRpcPublicFallback: rpc.publicFallback,
    broadcastFunded: false,
  });
  const byCap = Object.fromEntries(rows.map((r) => [r.capability, r]));

  must(byCap["NestUSD capacity"]?.mode === "unavailable", "NestUSD must stay unavailable");
  must(
    /fail-closed|unverified|risk/i.test(byCap["NestUSD capacity"]?.detail ?? ""),
    "NestUSD detail must be risk/fail-closed",
  );
  must(
    byCap["Broadcast swap / borrow"]?.mode === "unavailable",
    "Broadcast must stay unavailable while unfunded",
  );
  must(isBroadcastPaused(), "isBroadcastPaused() must be true until explicitly unpaused");

  if (!bitqueryKeyPresent) {
    must(
      byCap["Wash / linked-flow gate"]?.mode === "unavailable",
      "Wash without Bitquery must be unavailable",
    );
    must(
      /BITQUERY_API_KEY missing/i.test(byCap["Wash / linked-flow gate"]?.detail ?? ""),
      "Wash detail must cite missing BITQUERY_API_KEY",
    );
  }

  if (!multiTenantKeysPresent) {
    must(
      byCap["Multi-tenant sessions (Privy + Supabase)"]?.mode === "unavailable",
      "Multi-tenant sessions must be unavailable without keys",
    );
  }

  console.log("auth", getAuthProviderStatus());
  console.log("intent", parsePaperIntent("quote 25 USDC AAPLx"));
  console.log(
    "matrix",
    rows.map((r) => `${r.capability}: ${r.mode}`).join(" | "),
  );
  console.log("smoke-empire: honesty ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
