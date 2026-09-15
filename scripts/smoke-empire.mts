import { fetchXStockAsset, fetchXStockMultiplier } from "../src/lib/adapters/xstocks.ts";
import { fetchKaminoXStocksMarket } from "../src/lib/adapters/kamino.ts";
import { fetchJupiterLendEarn } from "../src/lib/adapters/jupiter-lend.ts";
import { fetchNestUsdStatus } from "../src/lib/adapters/nestusd.ts";
import { fetchRaydiumPoolsForMint } from "../src/lib/adapters/pools.ts";
import { fetchScaledUiOnchain } from "../src/lib/adapters/scaled-ui.ts";
import { evaluateWashGate } from "../src/lib/adapters/wash.ts";
import { getAuthProviderStatus } from "../src/lib/auth/session.ts";
import { parsePaperIntent } from "../src/lib/agent/paper-agent.ts";

async function main() {
  const [asset, mult] = await Promise.all([
    fetchXStockAsset("AAPLx"),
    fetchXStockMultiplier("AAPLx"),
  ]);
  console.log("multiplier", mult.ok ? mult.data.currentMultiplier : mult);
  console.log("asset", asset.ok ? asset.data.solanaMint : asset);
  const mint = asset.ok ? asset.data.solanaMint : null;
  console.log("kamino AAPLx", (await fetchKaminoXStocksMarket()));
  console.log("lend", await fetchJupiterLendEarn());
  console.log("nest", await fetchNestUsdStatus());
  console.log("wash", await evaluateWashGate({ symbol: "AAPLx", mint, notionalUsd: 100 }));
  if (mint) {
    console.log("pools", await fetchRaydiumPoolsForMint(mint));
    console.log("scaled-ui", await fetchScaledUiOnchain(mint));
  }
  console.log("auth", getAuthProviderStatus());
  console.log("intent", parsePaperIntent("quote 25 USDC AAPLx"));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
