/**
 * FOLIO stock-curve for Meteora DBC.
 * Production path: locked config + live program-executable RPC probe (no heavy SDK in SSR).
 * SDK math (`buildCurveWithMarketCap`) is exercised in unit tests + optional FOLIO_DBC_SDK=1.
 *
 * Pool address: `FOLIO_DBC_POOL` (preferred) or legacy `FOLIO_DBC_DEVNET_POOL`.
 * Network label: `FOLIO_DBC_NETWORK=mainnet|devnet` (default mainnet when FOLIO_DBC_POOL set).
 * Never invents a pool address or mainnet volume. Creating a funded mainnet pool needs a payer
 * (rent ≫ ≤~$1 Stocklana budget) — see `scripts/dbc-pool-status.mts`.
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
  /** Target network for the optional demo/live pool address. */
  poolNetwork: "mainnet" | "devnet";
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
  poolNetwork: "mainnet" as const,
  priceTape: "mainnet_read" as const,
};

/** @deprecated use FOLIO_STOCK_CURVE.poolNetwork — kept for older tests */
export const FOLIO_STOCK_CURVE_LEGACY_DEMO = {
  ...FOLIO_STOCK_CURVE,
  demoNetwork: "devnet" as const,
};

export type StockCurveStatus = {
  config: FolioStockCurveConfig;
  /** Pool pubkey when set — never invented. */
  pool: string | null;
  poolNetwork: "mainnet" | "devnet";
  /** True when account exists on the configured RPC. */
  poolAccountExists: boolean | null;
  programExecutable: boolean | null;
  note: string;
};

function resolvePoolEnv(): {
  pool: string | null;
  network: "mainnet" | "devnet";
} {
  const main = process.env["FOLIO_DBC_POOL"]?.trim() || null;
  const legacy = process.env["FOLIO_DBC_DEVNET_POOL"]?.trim() || null;
  const pool = main || legacy;
  const raw = (process.env["FOLIO_DBC_NETWORK"] || "").trim().toLowerCase();
  if (raw === "devnet" || raw === "mainnet") {
    return { pool, network: raw };
  }
  // Prefer mainnet label when using FOLIO_DBC_POOL; legacy env name implies devnet.
  if (main) return { pool, network: "mainnet" };
  if (legacy) return { pool, network: "devnet" };
  return { pool: null, network: "mainnet" };
}

async function rpcGetAccountExists(pubkey: string): Promise<boolean | null> {
  try {
    const rpc = resolveSolanaRpcUrl();
    const res = await fetch(rpc.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [pubkey, { encoding: "base64", commitment: "confirmed" }],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      result?: { value?: unknown };
    };
    return json.result?.value != null;
  } catch {
    return null;
  }
}

async function probeProgramExecutable(): Promise<boolean | null> {
  return rpcGetAccountExists(METEORA_DBC_PROGRAM).then((exists) => {
    // Program accounts are executable; existence of program id account ≈ deployed.
    // getAccountInfo on program returns executable:true — re-fetch for that bit.
    return exists;
  });
}

async function probeProgramExecutableStrict(): Promise<boolean | null> {
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
    const { pool, network } = resolvePoolEnv();
    const [programExecutable, poolAccountExists] = await Promise.all([
      probeProgramExecutableStrict(),
      pool ? rpcGetAccountExists(pool) : Promise.resolve(null),
    ]);

    let sdkSqrt: string | null = null;
    let sdkPoints: number | null = null;
    if (sdkEnabled()) {
      try {
        const built = await buildFolioStockCurveWithSdk();
        sdkSqrt = built.sqrt;
        sdkPoints = built.curvePoints;
      } catch {
        sdkSqrt = null;
        sdkPoints = null;
      }
    }

    const config: FolioStockCurveConfig = {
      ...FOLIO_STOCK_CURVE,
      poolNetwork: network,
      sdkSqrtPriceExample: sdkSqrt,
      sdkCurvePoints: sdkPoints,
    };

    const prog =
      programExecutable === true
        ? "executable on RPC"
        : programExecutable === false
          ? "missing on RPC"
          : "probe pending";

    let note: string;
    if (pool) {
      const exists =
        poolAccountExists === true
          ? "account live"
          : poolAccountExists === false
            ? "address set · account missing on RPC"
            : "account probe pending";
      note = `Stock curve locked · DBC ${prog} · ${network} pool ${pool.slice(0, 8)}… (${exists}) · no fake volume`;
    } else if (sdkPoints != null) {
      note = `SDK stock curve live (${sdkPoints} segments · fixed 100bps) · DBC program ${prog} · ${network} pool pending (needs funded create) · no fake volume`;
    } else {
      note = `Stock curve config live (USDC · gentle · fixed 100bps · cash-close start) · DBC program ${prog} · ${network} pool pending · SDK math in tests · no fake volume`;
    }

    return okResult(
      "mainnet-read",
      sdkPoints != null
        ? "@meteora-ag/dynamic-bonding-curve-sdk"
        : "folio.stock-curve+rpc",
      {
        config,
        pool,
        poolNetwork: network,
        poolAccountExists,
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
    "mainnet_pool_needs_payer",
    "Mainnet DBC pool create needs a funded payer (rent + config accounts). Set FOLIO_DBC_POOL after create — never invent an address. ≤~$1 budget blocks FOLIO-sponsored deploy.",
  );
}

/** Back-compat alias used by older callers expecting demoPool. */
export type StockCurveStatusLegacy = StockCurveStatus & {
  demoPool: string | null;
};
