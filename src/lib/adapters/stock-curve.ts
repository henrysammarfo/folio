/**
 * FOLIO stock-curve for Meteora DBC.
 * Production path: locked config + live program-executable RPC probe (no heavy SDK in SSR).
 * SDK math (`buildCurveWithMarketCap`) is exercised in unit tests + optional FOLIO_DBC_SDK=1.
 * Never invents mainnet volume or fills.
 */
import { errResult, okResult, type AdapterResult } from "./types";
import { resolveSolanaRpcUrl } from "./solana-rpc";

/** Locked program id (mainnet DBC) — constant so we don't need SDK at module load. */
export const METEORA_DBC_PROGRAM = "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN";
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
  sdkSqrtPriceExample: string | null;
  sdkCurvePoints: number | null;
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

async function probeProgramExecutable(): Promise<boolean | null> {
  try {
    const rpc = resolveSolanaRpcUrl();
    const res = await fetch(rpc.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [
          METEORA_DBC_PROGRAM,
          { encoding: "base64", commitment: "confirmed" },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      result?: { value?: { executable?: boolean } | null };
    };
    const v = json.result?.value;
    if (!v) return false;
    return Boolean(v.executable);
  } catch {
    return null;
  }
}

/**
 * Optional heavy SDK build — only when FOLIO_DBC_SDK=1 (or vitest).
 * Avoids pulling @coral-xyz/anchor into every Vercel SSR request (CJS/ESM crash).
 */
export async function buildFolioStockCurveWithSdk(): Promise<{
  sqrt: string;
  curvePoints: number;
}> {
  const sdk = await import("@meteora-ag/dynamic-bonding-curve-sdk");
  const {
    ActivationType,
    BaseFeeMode,
    CollectFeeMode,
    MigrationFeeOption,
    MigrationOption,
    TokenAuthorityOption,
    TokenDecimal,
    TokenType,
    buildCurveWithMarketCap,
    getSqrtPriceFromPrice,
  } = sdk;

  const sqrt = getSqrtPriceFromPrice("100", 6, 6);
  const built = buildCurveWithMarketCap({
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

  const curvePoints = Array.isArray(built.curve) ? built.curve.length : 0;
  return {
    sqrt: typeof sqrt?.toString === "function" ? sqrt.toString(10) : String(sqrt),
    curvePoints,
  };
}

function sdkEnabled(): boolean {
  return (
    process.env["FOLIO_DBC_SDK"] === "1" ||
    process.env["VITEST"] === "true" ||
    process.env["NODE_ENV"] === "test"
  );
}

export async function folioStockCurveStatus(): Promise<
  AdapterResult<StockCurveStatus>
> {
  try {
    const programExecutable = await probeProgramExecutable();
    const demoPool = process.env["FOLIO_DBC_DEVNET_POOL"]?.trim() || null;

    let sdkSqrt: string | null = null;
    let sdkPoints: number | null = null;
    if (sdkEnabled()) {
      try {
        const built = await buildFolioStockCurveWithSdk();
        sdkSqrt = built.sqrt;
        sdkPoints = built.curvePoints;
      } catch (e) {
        // Fail soft — config + program probe still honest
        sdkSqrt = null;
        sdkPoints = null;
        void e;
      }
    }

    const config: FolioStockCurveConfig = {
      ...FOLIO_STOCK_CURVE,
      sdkSqrtPriceExample: sdkSqrt,
      sdkCurvePoints: sdkPoints,
    };

    const prog =
      programExecutable === true
        ? "executable on RPC"
        : programExecutable === false
          ? "missing on RPC"
          : "probe pending";

    const note = demoPool
      ? `Stock curve locked · DBC ${prog} · demo ${demoPool.slice(0, 8)}… · no fake mainnet volume`
      : sdkPoints != null
        ? `SDK stock curve live (${sdkPoints} segments · fixed 100bps) · DBC program ${prog} · demo pool pending · no fake mainnet volume`
        : `Stock curve config live (USDC · gentle · fixed 100bps · cash-close start) · DBC program ${prog} · SDK math in tests · demo pool pending · no fake mainnet volume`;

    return okResult(
      "mainnet-read",
      sdkPoints != null
        ? "@meteora-ag/dynamic-bonding-curve-sdk"
        : "folio.stock-curve+rpc",
      {
        config,
        demoPool,
        programExecutable,
        note,
      },
    );
  } catch (e) {
    return errResult("folio.stock-curve", "stock_curve_failed", String(e));
  }
}

export function folioStockCurveMainnetDeploy(): AdapterResult<never> {
  return errResult(
    "folio.stock-curve",
    "mainnet_deploy_out_of_budget",
    "Custom / funded DBC mainnet deploy exceeds ≤~$1 Stocklana budget",
  );
}
