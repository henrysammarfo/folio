import { resolveSolanaRpcUrl } from "./solana-rpc";
import { errResult, okResult, type AdapterResult } from "./types";

/** SPL Token + Token-2022 program ids (Solana mainnet). */
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export type WalletTokenBalance = {
  mint: string;
  /** UI amount (human units) from jsonParsed token amount. */
  uiAmount: number;
  amountRaw: string;
  decimals: number;
  program: "spl-token" | "token-2022";
};

export type WalletBalances = {
  wallet: string;
  byMint: Record<string, WalletTokenBalance>;
};

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Pure Solana pubkey shape check — not cryptographic verification. */
export function isLikelySolanaPubkey(value: string): boolean {
  return BASE58_RE.test(value.trim());
}

type ParsedTokenAccount = {
  pubkey?: string;
  account?: {
    data?: {
      parsed?: {
        info?: {
          mint?: string;
          tokenAmount?: {
            amount?: string;
            decimals?: number;
            uiAmount?: number | null;
            uiAmountString?: string;
          };
        };
      };
      program?: string;
    };
  };
};

type RpcAccountsResponse = {
  result?: { value?: ParsedTokenAccount[] };
  error?: { message?: string };
};

function parseUiAmount(
  info: NonNullable<
    NonNullable<NonNullable<ParsedTokenAccount["account"]>["data"]>["parsed"]
  >["info"],
): number | null {
  const ta = info?.tokenAmount;
  if (!ta) return null;
  if (typeof ta.uiAmount === "number" && Number.isFinite(ta.uiAmount)) return ta.uiAmount;
  if (ta.uiAmountString != null) {
    const n = Number(ta.uiAmountString);
    if (Number.isFinite(n)) return n;
  }
  if (ta.amount != null && typeof ta.decimals === "number") {
    const raw = Number(ta.amount);
    if (Number.isFinite(raw)) return raw / 10 ** ta.decimals;
  }
  return null;
}

/**
 * Merge parsed token accounts into mint → balance map.
 * Multiple ATAs for the same mint are summed (rare; honest for desk display).
 */
export function mergeTokenAccountRows(
  rows: ParsedTokenAccount[],
  program: WalletTokenBalance["program"],
  mintFilter?: Set<string>,
): Record<string, WalletTokenBalance> {
  const byMint: Record<string, WalletTokenBalance> = {};
  for (const row of rows) {
    const info = row.account?.data?.parsed?.info;
    const mint = info?.mint;
    if (!mint) continue;
    if (mintFilter && !mintFilter.has(mint)) continue;
    const uiAmount = parseUiAmount(info);
    if (uiAmount == null) continue;
    const decimals = info?.tokenAmount?.decimals ?? 0;
    const amountRaw = info?.tokenAmount?.amount ?? "0";
    const prev = byMint[mint];
    if (prev) {
      byMint[mint] = {
        ...prev,
        uiAmount: prev.uiAmount + uiAmount,
        amountRaw: String(BigInt(prev.amountRaw || "0") + BigInt(amountRaw || "0")),
      };
    } else {
      byMint[mint] = { mint, uiAmount, amountRaw, decimals, program };
    }
  }
  return byMint;
}

async function rpcGetTokenAccountsByOwner(
  rpc: string,
  wallet: string,
  programId: string,
): Promise<AdapterResult<ParsedTokenAccount[]>> {
  const source = "solana-rpc.token-accounts";
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          wallet,
          { programId },
          { encoding: "jsonParsed", commitment: "confirmed" },
        ],
      }),
    });
    if (!res.ok) {
      return errResult(source, "solana_rpc_http_error", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as RpcAccountsResponse;
    if (json.error) {
      return errResult(source, "solana_rpc_error", json.error.message ?? "rpc error");
    }
    return okResult("mainnet-read", source, json.result?.value ?? []);
  } catch (e) {
    return errResult(source, "solana_rpc_failed", String(e));
  }
}

/**
 * Read SPL + Token-2022 balances for a wallet on mainnet.
 * Optional `mints` filters to watchlist assets. Fail-closed without RPC / bad pubkey.
 */
export async function fetchWalletTokenBalances(params: {
  wallet: string;
  mints?: string[];
}): Promise<AdapterResult<WalletBalances>> {
  const source = "solana-rpc.wallet-balances";
  const wallet = params.wallet.trim();
  if (!isLikelySolanaPubkey(wallet)) {
    return errResult(source, "wallet_pubkey_invalid", "Expected a base58 Solana pubkey.");
  }
  const { url: rpc } = resolveSolanaRpcUrl();

  const mintFilter = params.mints?.length ? new Set(params.mints) : undefined;
  const [spl, t22] = await Promise.all([
    rpcGetTokenAccountsByOwner(rpc, wallet, TOKEN_PROGRAM_ID),
    rpcGetTokenAccountsByOwner(rpc, wallet, TOKEN_2022_PROGRAM_ID),
  ]);

  if (!spl.ok && !t22.ok) {
    return errResult(
      source,
      "wallet_balances_unavailable",
      `${spl.reason}; ${t22.reason}`,
    );
  }

  const byMint: Record<string, WalletTokenBalance> = {
    ...(spl.ok ? mergeTokenAccountRows(spl.data, "spl-token", mintFilter) : {}),
    ...(t22.ok ? mergeTokenAccountRows(t22.data, "token-2022", mintFilter) : {}),
  };

  return okResult("mainnet-read", source, { wallet, byMint });
}
