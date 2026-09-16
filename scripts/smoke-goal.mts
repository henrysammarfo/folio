/**
 * Stocklana goal readiness smoke — requirement matrix from live adapters.
 * Usage: npm run smoke:goal
 * Loads local `.env` (overrides empty shell placeholders) so FOLIO_APPROVED_LAB_UI
 * and Empire keys are visible. Exit 0 always (honesty report). Never invents greens.
 */
import { applyDotEnv } from "./load-dotenv.ts";
applyDotEnv();

import { fetchXStockAsset, fetchXStockMultiplier } from "../src/lib/adapters/xstocks.ts";
import { fetchKaminoXStocksMarket } from "../src/lib/adapters/kamino.ts";
import { fetchNestUsdStatus } from "../src/lib/adapters/nestusd.ts";
import { fetchScaledUiOnchain } from "../src/lib/adapters/scaled-ui.ts";
import {
  fetchPythEquityPrice,
  fetchPythXStockUsdPrice,
} from "../src/lib/adapters/pyth.ts";
import { fetchJupiterQuote } from "../src/lib/adapters/jupiter.ts";
import { evaluateWashGate } from "../src/lib/adapters/wash.ts";
import { resolveSolanaRpcUrl } from "../src/lib/adapters/solana-rpc.ts";
import { isBroadcastPaused } from "../src/lib/broadcast.ts";
import { readApprovedLabUi } from "../src/lib/lab-pick.ts";
import { getAuthProviderStatus } from "../src/lib/auth/session.ts";
import {
  classifyGoalRequirements,
  summarizeGoalSmoke,
} from "../src/lib/goal-smoke.ts";

async function main() {
  const symbol = "AAPLx";
  const [asset, mult, kamino, nestusd, pythEquity, pythX] = await Promise.all([
    fetchXStockAsset(symbol),
    fetchXStockMultiplier(symbol),
    fetchKaminoXStocksMarket(),
    fetchNestUsdStatus(),
    fetchPythEquityPrice("AAPL"),
    fetchPythXStockUsdPrice(symbol),
  ]);

  const mint = asset.ok ? asset.data.solanaMint : null;
  const decimals =
    asset.ok && asset.data.decimals != null ? asset.data.decimals : 8;

  const [wash, jupiter, scaledUi] = await Promise.all([
    evaluateWashGate({ symbol, mint, notionalUsd: 25 }),
    mint
      ? fetchJupiterQuote({
          outputMint: mint,
          amountRaw: 1_000_000,
          outputDecimals: decimals,
        })
      : Promise.resolve({ ok: false as const }),
    mint
      ? fetchScaledUiOnchain(mint)
      : Promise.resolve({ ok: false as const }),
  ]);

  const bitqueryKey = Boolean(process.env["BITQUERY_API_KEY"]?.trim());
  const pythKey = Boolean(process.env["PYTH_API_KEY"]?.trim());
  const privyKey = Boolean(
    process.env["PRIVY_APP_ID"]?.trim() && process.env["PRIVY_APP_SECRET"]?.trim(),
  );
  const supabaseKey = Boolean(
    process.env["SUPABASE_URL"]?.trim() &&
      process.env["SUPABASE_ANON_KEY"]?.trim() &&
      process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim(),
  );
  const sessionSecret =
    (process.env["FOLIO_SESSION_SECRET"]?.trim().length ?? 0) >= 16;

  /** Equity.US preferred; Crypto.xStock counts as live when equity plan lacks entitlement. */
  const pythLive = pythEquity.ok || pythX.ok;
  const pythFailClosed = !pythLive;
  const auth = getAuthProviderStatus();

  const rows = classifyGoalRequirements({
    approvedLabUi: readApprovedLabUi(),
    broadcastPaused: isBroadcastPaused(),
    broadcastFunded: false,
    multiplierOk: mult.ok,
    multiplierLabel: mult.ok
      ? `${mult.data.currentMultiplier.toFixed(6)}×`
      : "unavailable",
    jupiterQuoteOk: jupiter.ok,
    kaminoOk: kamino.ok,
    scaledUiOk: scaledUi.ok,
    nestUsdUnavailable: !nestusd.ok,
    washLive: wash.ok,
    washFailClosed: !wash.ok,
    pythLive,
    pythFailClosed,
    bitqueryKey,
    pythKey,
    privyKey,
    supabaseKey,
    sessionSecret,
    /** Keys alone ≠ multi-tenant ready — mint + memberships still required. */
    multiTenantSessionReady: false,
  });

  const summary = summarizeGoalSmoke(rows);
  const rpc = resolveSolanaRpcUrl();

  console.log("FOLIO Stocklana goal readiness");
  console.log(
    `RPC ${rpc.publicFallback ? "public-fallback" : "dedicated"} · tip smoke`,
  );
  if (pythKey && !pythEquity.ok && pythX.ok) {
    console.log(
      "note  Pyth Equity.US not entitled on this key — Crypto.xStock live (labeled secondary)",
    );
  } else if (pythKey && !pythLive) {
    console.log(
      `note  Pyth keyed but Hermes not live — ${(pythEquity.detail ?? pythX.detail ?? "").slice(0, 100)}`,
    );
  }
  if (auth.ok) {
    console.log(`note  Auth keys present · ${(auth.detail ?? "").slice(0, 120)}`);
  }
  if ((process.env["SUPABASE_JWT_SECRET"]?.trim().length ?? 0) < 16) {
    console.log(
      "note  SUPABASE_JWT_SECRET missing — prefs/tenants stay service-role fallback until JWT secret pasted",
    );
  }
  console.log("");
  for (const row of rows) {
    const mark =
      row.status === "done"
        ? "DONE   "
        : row.status === "partial"
          ? "PARTIAL"
          : "BLOCKED";
    console.log(`${mark}  ${row.title}`);
    console.log(`         ${row.detail}`);
  }
  console.log("");
  console.log(
    `summary done=${summary.done} partial=${summary.partial} blocked=${summary.blocked} shipReady=${summary.shipReady}`,
  );
  if (!summary.shipReady) {
    console.log(
      "remaining: SUPABASE_JWT_SECRET (optional elite) · mint folio_session + tenant_members · rotate chat-pasted keys — docs/HENRY_STEPS.md",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
