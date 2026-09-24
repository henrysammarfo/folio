import { errResult, okResult, type AdapterResult } from "./types";

export type NestUsdCollateral = {
  symbol: string;
  mint: string | null;
  /** Borrow LTV as 0–1 fraction (from bps). */
  borrowLtv: number;
  liquidationThreshold: number;
  depositsPaused: boolean;
  borrowsPaused: boolean;
  withdrawsPaused: boolean;
  totalDebtRaw: string;
  totalDepositsRaw: string;
};

export type NestUsdSnapshot = {
  protocol: "NestUSD";
  status: "live" | "paused" | "risk-review";
  cluster: string;
  nusdMint: string | null;
  nusdSupplyRaw: string | null;
  totalDebtRaw: string | null;
  protocolPaused: boolean;
  appUrl: string;
  collaterals: NestUsdCollateral[];
  asOf: string;
  source: string;
};

const NEST_RISK = "https://api.nestusd.com/v1/risk";
const NEST_CONFIG = "https://api.nestusd.com/v1/config";
export const NESTUSD_APP_URL = "https://app.nestusd.com/";

/**
 * NestUSD Solana xStock CDP — live mainnet-read via api.nestusd.com.
 * Distinct from Nest.credit vault TVL (EVM hub / OFT).
 * FOLIO does not assemble Nest CPI yet — CTA deep-links to NestUSD app.
 */
export async function fetchNestUsdStatus(): Promise<AdapterResult<NestUsdSnapshot>> {
  const source = "api.nestusd.com/v1/risk+config";
  try {
    const [riskRes, cfgRes] = await Promise.all([
      fetch(NEST_RISK, {
        headers: { Accept: "application/json", "User-Agent": "folio-desk/0.1" },
        signal: AbortSignal.timeout(15_000),
      }),
      fetch(NEST_CONFIG, {
        headers: { Accept: "application/json", "User-Agent": "folio-desk/0.1" },
        signal: AbortSignal.timeout(15_000),
      }),
    ]);
    if (!riskRes.ok) {
      return errResult(source, "nestusd_http_error", `risk HTTP ${riskRes.status}`);
    }
    const risk = (await riskRes.json()) as {
      generatedAt?: string;
      stats?: {
        paused?: boolean;
        nusdSupply?: string;
        totalDebt?: string;
      };
      collateralRows?: Array<{
        symbol?: string;
        borrowLtvBps?: number;
        liquidationThresholdBps?: number;
        depositsPaused?: boolean;
        borrowsPaused?: boolean;
        withdrawsPaused?: boolean;
        totalDebt?: string;
        totalDepositsRaw?: string;
      }>;
    };
    const cfg = cfgRes.ok
      ? ((await cfgRes.json()) as {
          cluster?: string;
          mints?: { nUSD?: string };
          collateral?: Array<{ symbol?: string; mint?: string }>;
        })
      : null;

    const mintBySymbol = new Map<string, string>();
    for (const c of cfg?.collateral ?? []) {
      if (c.symbol && c.mint) mintBySymbol.set(c.symbol, c.mint);
    }

    const rows = Array.isArray(risk.collateralRows) ? risk.collateralRows : [];
    const collaterals: NestUsdCollateral[] = [];
    for (const r of rows) {
      const symbol = r.symbol?.trim();
      if (!symbol) continue;
      const borrowLtvBps = Number(r.borrowLtvBps);
      const liqBps = Number(r.liquidationThresholdBps);
      if (!Number.isFinite(borrowLtvBps) || borrowLtvBps <= 0) continue;
      collaterals.push({
        symbol,
        mint: mintBySymbol.get(symbol) ?? null,
        borrowLtv: borrowLtvBps / 10_000,
        liquidationThreshold: Number.isFinite(liqBps) ? liqBps / 10_000 : 0,
        depositsPaused: Boolean(r.depositsPaused),
        borrowsPaused: Boolean(r.borrowsPaused),
        withdrawsPaused: Boolean(r.withdrawsPaused),
        totalDebtRaw: String(r.totalDebt ?? "0"),
        totalDepositsRaw: String(r.totalDepositsRaw ?? "0"),
      });
    }

    if (collaterals.length === 0) {
      return errResult(source, "nestusd_empty_collaterals", "No collateral rows in /v1/risk");
    }

    const protocolPaused = Boolean(risk.stats?.paused);
    const anyBorrowOpen = collaterals.some((c) => !c.borrowsPaused);
    const status: NestUsdSnapshot["status"] = protocolPaused
      ? "paused"
      : anyBorrowOpen
        ? "live"
        : "paused";

    return okResult("mainnet-read", source, {
      protocol: "NestUSD",
      status,
      cluster: cfg?.cluster ?? "mainnet-beta",
      nusdMint: cfg?.mints?.nUSD ?? null,
      nusdSupplyRaw: risk.stats?.nusdSupply ?? null,
      totalDebtRaw: risk.stats?.totalDebt ?? null,
      protocolPaused,
      appUrl: NESTUSD_APP_URL,
      collaterals,
      asOf: risk.generatedAt ?? new Date().toISOString(),
      source,
    });
  } catch (e) {
    return errResult(source, "nestusd_fetch_failed", String(e));
  }
}
