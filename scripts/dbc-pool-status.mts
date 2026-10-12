/**
 * Print FOLIO DBC stock-curve status (no secrets).
 * Usage: npx tsx scripts/dbc-pool-status.mts
 *
 * To create a real mainnet pool you need a funded payer + Meteora config tx
 * (rent ≫ ≤~$1). After create: set FOLIO_DBC_POOL=<pubkey> and FOLIO_DBC_NETWORK=mainnet
 * on Vercel + .env — never invent an address.
 */
import {
  FOLIO_STOCK_CURVE,
  folioStockCurveMainnetDeploy,
  folioStockCurveStatus,
} from "../src/lib/adapters/stock-curve";

async function main() {
  console.log("FOLIO stock curve preset:", {
    quote: FOLIO_STOCK_CURVE.quoteMint,
    graduationUsdc: FOLIO_STOCK_CURVE.graduationUsdc,
    curve: FOLIO_STOCK_CURVE.curve,
    fee: FOLIO_STOCK_CURVE.fee,
    program: FOLIO_STOCK_CURVE.programId,
    poolNetwork: FOLIO_STOCK_CURVE.poolNetwork,
  });

  const st = await folioStockCurveStatus();
  if (!st.ok) {
    console.log("status FAIL", st.reason, st.detail);
    process.exit(1);
  }
  console.log("status OK", {
    pool: st.data.pool,
    poolNetwork: st.data.poolNetwork,
    poolAccountExists: st.data.poolAccountExists,
    programExecutable: st.data.programExecutable,
    note: st.data.note,
  });

  const deploy = folioStockCurveMainnetDeploy();
  console.log("create path:", deploy.reason, deploy.detail);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
