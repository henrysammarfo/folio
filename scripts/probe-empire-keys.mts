/**
 * Live Empire key probes — statuses/reasons only. Never prints secret values.
 * Usage: npx tsx scripts/probe-empire-keys.mts
 */
import { applyDotEnv } from "./load-dotenv.ts";
applyDotEnv();

import { evaluateWashGate } from "../src/lib/adapters/wash.ts";
import {
  fetchPythEquityPrice,
  fetchPythXStockUsdPrice,
} from "../src/lib/adapters/pyth.ts";
import { fetchJupiterQuote } from "../src/lib/adapters/jupiter.ts";
import { fetchXStockAsset } from "../src/lib/adapters/xstocks.ts";
import { getAuthProviderStatus } from "../src/lib/auth/session.ts";

async function main() {
  const asset = await fetchXStockAsset("AAPLx");
  const mint = asset.ok ? asset.data.solanaMint : null;
  console.log("xstocks", asset.ok ? "ok" : asset.reason, mint ? "mint-ok" : "no-mint");

  const wash = await evaluateWashGate({ symbol: "AAPLx", mint, notionalUsd: 25 });
  if (wash.ok) {
    console.log(
      "wash ok",
      `pass=${wash.data.pass}`,
      `pressure=${wash.data.pressure}`,
      `n=${wash.data.sampleSize}`,
    );
  } else {
    console.log("wash fail", wash.reason, (wash.detail ?? "").slice(0, 180));
  }

  const pythEq = await fetchPythEquityPrice("AAPL");
  if (pythEq.ok) {
    console.log(
      "pyth-equity ok",
      `price=${pythEq.data.price}`,
      `feed=${pythEq.data.feedSymbol}`,
    );
  } else {
    console.log(
      "pyth-equity fail",
      pythEq.reason,
      (pythEq.detail ?? "").slice(0, 180),
    );
  }

  const pythX = await fetchPythXStockUsdPrice("AAPLx");
  if (pythX.ok) {
    console.log(
      "pyth-xstock ok",
      `price=${pythX.data.price}`,
      `feed=${pythX.data.feedSymbol}`,
    );
  } else {
    console.log(
      "pyth-xstock fail",
      pythX.reason,
      (pythX.detail ?? "").slice(0, 180),
    );
  }

  if (mint) {
    const jup = await fetchJupiterQuote({
      outputMint: mint,
      amountRaw: 1_000_000,
      outputDecimals: 8,
    });
    if (jup.ok) console.log("jupiter ok quote");
    else console.log("jupiter fail", jup.reason, (jup.detail ?? "").slice(0, 120));
  }

  const auth = getAuthProviderStatus();
  console.log(
    "auth",
    auth.ok ? "keys-present" : auth.reason,
    (auth.detail ?? "").slice(0, 140),
  );
  console.log(
    "jwt_secret",
    (process.env["SUPABASE_JWT_SECRET"]?.trim().length ?? 0) >= 16
      ? "set"
      : "MISSING — user-JWT RLS path stays service-role fallback",
  );
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
