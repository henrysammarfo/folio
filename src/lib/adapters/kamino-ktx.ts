/**
 * Kamino Klend ktx API — assemble unsigned deposit/borrow txs for FOLIO to sign in-desk.
 * No FOLIO program; Kamino builds the CPI, Privy wallet signs + sends.
 */
import { errResult, okResult, type AdapterResult } from "./types";
import {
  KAMINO_XSTOCKS_MARKET,
  type KaminoReserve,
} from "./kamino";

const KTX_BASE = "https://api.kamino.finance/ktx/klend";

export const KAMINO_USDC_RESERVE = "97zoywd8mPZsGTg8q1wdD2Wgkdrs2tqusp1Qqcxbyj7E";

export type KaminoKtxTx = {
  action: "deposit" | "borrow";
  market: string;
  reserve: string;
  amount: string;
  /** base64 versioned transaction from Kamino. */
  transaction: string;
  source: string;
};

async function postKtx(
  action: "deposit" | "borrow",
  body: {
    wallet: string;
    market: string;
    reserve: string;
    amount: string;
  },
): Promise<AdapterResult<KaminoKtxTx>> {
  const source = `${KTX_BASE}/${action}`;
  try {
    const res = await fetch(source, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "folio-desk/0.1",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    });
    const json = (await res.json().catch(() => ({}))) as {
      transaction?: string;
      message?: string;
      error?: string;
      statusCode?: number;
    };
    if (!res.ok || !json.transaction) {
      const detail =
        json.message ??
        json.error ??
        `HTTP ${res.status}`;
      return errResult(
        source,
        action === "borrow" ? "kamino_borrow_failed" : "kamino_deposit_failed",
        detail,
      );
    }
    return okResult("mainnet-read", source, {
      action,
      market: body.market,
      reserve: body.reserve,
      amount: body.amount,
      transaction: json.transaction,
      source,
    });
  } catch (e) {
    return errResult(source, "kamino_ktx_fetch_failed", String(e));
  }
}

/** Deposit xStock collateral into Kamino xStocks market (creates obligation if needed). */
export function fetchKaminoDepositTx(params: {
  wallet: string;
  reserve: string;
  amount: string;
  market?: string;
}): Promise<AdapterResult<KaminoKtxTx>> {
  return postKtx("deposit", {
    wallet: params.wallet.trim(),
    market: params.market ?? KAMINO_XSTOCKS_MARKET,
    reserve: params.reserve.trim(),
    amount: params.amount.trim(),
  });
}

/** Borrow USDC (or other liquidity) against an existing Kamino obligation. */
export function fetchKaminoBorrowTx(params: {
  wallet: string;
  /** Usually USDC reserve on xStocks market. */
  reserve?: string;
  amount: string;
  market?: string;
}): Promise<AdapterResult<KaminoKtxTx>> {
  return postKtx("borrow", {
    wallet: params.wallet.trim(),
    market: params.market ?? KAMINO_XSTOCKS_MARKET,
    reserve: (params.reserve ?? KAMINO_USDC_RESERVE).trim(),
    amount: params.amount.trim(),
  });
}

export function findReserveBySymbol(
  reserves: KaminoReserve[],
  symbol: string,
): KaminoReserve | undefined {
  const s = symbol.trim().toUpperCase();
  return reserves.find((r) => r.symbol.toUpperCase() === s);
}
