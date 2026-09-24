/**
 * FOLIO stock-curve for Meteora DBC — official SDK (`buildCurveWithMarketCap`).
 * Config is live math + on-chain program probe. Demo pool labeled until funded.
 * Never invents mainnet volume or fills.
 */
import {
  ActivationType,
  BaseFeeMode,
  CollectFeeMode,
  DYNAMIC_BONDING_CURVE_PROGRAM_ID,
  MigrationFeeOption,
  MigrationOption,
  TokenAuthorityOption,
  TokenDecimal,
  TokenType,
  buildCurveWithMarketCap,
  getSqrtPriceFromPrice,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { errResult, okResult, type AdapterResult } from "./types";
import { resolveSolanaRpcUrl } from "./solana-rpc";

export const METEORA_DBC_PROGRAM = DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58();
export const DBC_GRADUATION_USDC = 750;

export type FolioStockCurveConfig = {
  quoteMint: "USDC";
  graduationUsdc: number;
  startPricePolicy: "last_cash_close";
  curve: "gentle_high_liquidity";
  fee: "fixed_or_short_linear";
  weekendRefuse: "folio_session_gate";
  programId: string;
  demoNetwork: "devnet";
  priceTape: "mainnet_read";
  sdkSqrtPriceExample: string;
  sdkCurvePoints: number;
};

export const FOLIO_STOCK_CURVE = {
  quoteMint: "USDC" as const,
  graduationUsdc: DBC_GRADUATION_USDC,
  startPricePolicy: "last_cash_close" as const,
  curve: "gentle_high_liquidity" as const,
  fee: "fixed_or_short_linear" as const,
  weekendRefuse: "folio_session_gate" as const,
  programId: METEORA_DBC_PROGRAM,
  demoNetwork: "devnet" as const,
  priceTape: "mainnet_read" as const,
};

export type StockCurveStatus = {
  config: FolioStockCurveConfig;
  demoPool: string | null;
  programExecutable: boolean | null;
  note: string;
};

/** Build gentle stock curve via official Meteora SDK (fixed-ish fee · DAMM v2 migrate). */
function buildFolioStockCurveSdk() {
  return buildCurveWithMarketCap({
    initialMarketCap: 100_000,
    migrationMarketCap: 750_000,
    activationType: ActivationType.Timestamp,
    token: {
      tokenType: TokenType.SPLToken,
      tokenBaseDecimal: TokenDecimal.SIX,
      tokenQuoteDecimal: 6,
      tokenAuthorityOption: TokenAuthorityOption.Immutable,
      totalTokenSupply: 1_000_000_000,
      leftover: 0,
    },
    fee: {
      // Fixed-style stock fee (starting == ending) — not meme exponential moon.
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        feeSchedulerParam: {
          startingFeeBps: 100,
          endingFeeBps: 100,
          numberOfPeriod: 0,
          totalDuration: 0,
        },
      },
      dynamicFeeEnabled: false,
      collectFeeMode: CollectFeeMode.QuoteToken,
      creatorTradingFeePercentage: 0,
      poolCreationFee: 0,
      enableFirstSwapWithMinFee: false,
    },
    migration: {
      migrationOption: MigrationOption.MET_DAMM_V2,
      migrationFeeOption: MigrationFeeOption.FixedBps100,
      migrationFee: { feePercentage: 0, creatorFeePercentage: 0 },
    },
    liquidityDistribution: {
      partnerPermanentLockedLiquidityPercentage: 0,
      partnerLiquidityPercentage: 0,
      creatorPermanentLockedLiquidityPercentage: 100,
      creatorLiquidityPercentage: 0,
    },
    lockedVesting: {
      totalLockedVestingAmount: 0,
      numberOfVestingPeriod: 0,
      cliffUnlockAmount: 0,
      totalVestingDuration: 0,
      cliffDurationFromMigrationTime: 0,
    },
  });
}

export async function folioStockCurveStatus(): Promise<
  AdapterResult<StockCurveStatus>
> {
  try {
    const sqrt = getSqrtPriceFromPrice("100", 6, 6);
    const built = buildFolioStockCurveSdk();
    const curvePoints = Array.isArray(built.curve) ? built.curve.length : 0;

    let programExecutable: boolean | null = null;
    try {
      const rpc = resolveSolanaRpcUrl();
      const conn = new Connection(rpc.url, "confirmed");
      const info = await conn.getAccountInfo(
        new PublicKey(METEORA_DBC_PROGRAM),
        "confirmed",
      );
      programExecutable = Boolean(info?.executable);
    } catch {
      programExecutable = null;
    }

    const demoPool = process.env["FOLIO_DBC_DEVNET_POOL"]?.trim() || null;
    const config: FolioStockCurveConfig = {
      ...FOLIO_STOCK_CURVE,
      sdkSqrtPriceExample: BN.isBN(sqrt) ? sqrt.toString(10) : String(sqrt),
      sdkCurvePoints: curvePoints,
    };

    const note = demoPool
      ? `SDK curve · ${curvePoints} segments · program ${programExecutable === true ? "executable" : "unchecked"} · demo ${demoPool.slice(0, 8)}… · no fake mainnet volume`
      : `SDK stock curve live (${curvePoints} segments · fixed 100bps) · DBC program ${programExecutable === true ? "executable on RPC" : "probe pending"} · demo pool pending · no fake mainnet volume`;

    return okResult("mainnet-read", "@meteora-ag/dynamic-bonding-curve-sdk", {
      config,
      demoPool,
      programExecutable,
      note,
    });
  } catch (e) {
    return errResult(
      "@meteora-ag/dynamic-bonding-curve-sdk",
      "stock_curve_sdk_failed",
      String(e),
    );
  }
}

export function folioStockCurveMainnetDeploy(): AdapterResult<never> {
  return errResult(
    "folio.stock-curve",
    "mainnet_deploy_out_of_budget",
    "Custom / funded DBC mainnet deploy exceeds ≤~$1 Stocklana budget",
  );
}
