import { fetchXStockMultiplier, fetchXStockAsset } from "../src/lib/adapters/xstocks.ts";
import { fetchJupiterQuote, fetchJupiterTokenPrice } from "../src/lib/adapters/jupiter.ts";
import { fetchPythEquityPrice, divergeBps } from "../src/lib/adapters/pyth.ts";
import { evaluateWashGate } from "../src/lib/adapters/wash.ts";

async function main() {
  const m = await fetchXStockMultiplier("AAPLx");
  const a = await fetchXStockAsset("AAPLx");
  console.log("mult", m);
  console.log("asset", a);
  if (!a.ok) return;
  const mint = a.data.solanaMint;
  const decimals = a.data.decimals ?? 8;
  console.log("mint", mint, "decimals", decimals);
  if (!mint) return;
  const jp = await fetchJupiterTokenPrice(mint);
  const jq = await fetchJupiterQuote({ outputMint: mint, amountRaw: 100_000_000, outputDecimals: decimals });
  const py = await fetchPythEquityPrice("AAPL");
  const wash = await evaluateWashGate({ symbol: "AAPLx", mint, notionalUsd: 100 });
  console.log("jupPrice", jp);
  console.log("jupQuote", jq);
  console.log("pyth", py);
  if (py.ok && jp.ok) console.log("diverge", divergeBps(py.data.price, jp.data.usdPrice, 75));
  console.log("wash", wash);
}
main().catch((e) => { console.error(e); process.exit(1); });
