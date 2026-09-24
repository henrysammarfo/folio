/**
 * FOLIO stock-curve config for Meteora DBC (Bible World’s Fair primary).
 * Config is the product — not a meme launchpad preset.
 * Demo pool stays labeled until a real devnet deploy is funded; never invent mainnet volume.
 */
import { errResult, okResult, type AdapterResult } from "./types";

/** Meteora DBC program (mainnet + devnet) — verified docs 2026-09-24. */
export const METEORA_DBC_PROGRAM =
  "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN";

/** Keeper graduation quote path (USDC) per Meteora docs. */
export const DBC_GRADUATION_USDC = 750;

export type FolioStockCurveConfig = {
  quoteMint: "USDC";
  graduationUsdc: number;
  /** Start price = last cash close — never a vanity number. */
  startPricePolicy: "last_cash_close";
  /** Gentle = high virtual liquidity so thin names do not jump. */
  curve: "gentle_high_liquidity";
  /** Meme exponential anti-sniper is out for stocks. */
  fee: "fixed_or_short_linear";
  weekendRefuse: "folio_session_gate";
  programId: string;
  /** Where a demo pool may live. */
  demoNetwork: "devnet";
  /** Mainnet xStock prices are reads only. */
  priceTape: "mainnet_read";
};

/** Locked FOLIO stock preset — Bible § Meteora. */
export const FOLIO_STOCK_CURVE: FolioStockCurveConfig = {
  quoteMint: "USDC",
  graduationUsdc: DBC_GRADUATION_USDC,
  startPricePolicy: "last_cash_close",
  curve: "gentle_high_liquidity",
  fee: "fixed_or_short_linear",
  weekendRefuse: "folio_session_gate",
  programId: METEORA_DBC_PROGRAM,
  demoNetwork: "devnet",
  priceTape: "mainnet_read",
};

export type StockCurveStatus = {
  config: FolioStockCurveConfig;
  /** Devnet pool pubkey when created — null until funded deploy. */
  demoPool: string | null;
  note: string;
};

/**
 * Live status of FOLIO’s DBC stock curve.
 * Returns mainnet-read for the *config truth*; demo pool stays null until deploy.
 */
export function folioStockCurveStatus(): AdapterResult<StockCurveStatus> {
  const demoPool = process.env["FOLIO_DBC_DEVNET_POOL"]?.trim() || null;
  if (!demoPool) {
    return okResult("mainnet-read", "folio.stock-curve.config", {
      config: FOLIO_STOCK_CURVE,
      demoPool: null,
      note:
        "Stock curve config live · demo pool pending (devnet) · no fake mainnet volume",
    });
  }
  return okResult("mainnet-read", "folio.stock-curve.devnet-pool", {
    config: FOLIO_STOCK_CURVE,
    demoPool,
    note: `Devnet demo pool ${demoPool.slice(0, 8)}… · prices still mainnet-read`,
  });
}

/** Explicit unavailable when someone asks for a mainnet DBC fill theater. */
export function folioStockCurveMainnetDeploy(): AdapterResult<never> {
  return errResult(
    "folio.stock-curve",
    "mainnet_deploy_out_of_budget",
    "Custom / funded DBC mainnet deploy exceeds ≤~$1 Stocklana budget",
  );
}
