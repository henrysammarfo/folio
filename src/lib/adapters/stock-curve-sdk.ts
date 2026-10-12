/**
 * Optional Meteora DBC SDK math — unit tests / FOLIO_DBC_SDK=1 only.
 * Never import this module from desk SSR paths (Anchor CJS breaks ESM on Vercel).
 */
import {
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
} from "@meteora-ag/dynamic-bonding-curve-sdk";

export async function buildFolioStockCurveWithSdk(): Promise<{
  sqrt: string;
  curvePoints: number;
}> {
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
