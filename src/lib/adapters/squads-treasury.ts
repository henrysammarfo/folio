import { resolveSolanaRpcUrl } from "./solana-rpc";
import { errResult, okResult, type AdapterResult } from "./types";

/**
 * Squads / Altitude treasury awareness — mainnet-read vault balance when
 * FOLIO_SQUADS_VAULT is set. Never paints broadcast funded on ≤~$1 budget
 * unless FOLIO_TREASURY_FUNDED=true AND vault has SOL above threshold.
 */
export type SquadsTreasurySnapshot = {
  protocol: "Squads";
  vault: string;
  lamports: number;
  sol: number;
  /** Explicit env arm — never inferred from small balances. */
  treasuryFundedFlag: boolean;
  /** True only when funded flag + SOL ≥ threshold. */
  broadcastTreasuryReady: boolean;
  solThreshold: number;
  altitudeUrl: string;
  squadsMultisigUrl: string;
  publicRpcFallback: boolean;
  note: string;
};

export const ALTITUDE_URL = "https://altitude.xyz";
export const SQUADS_MULTISIG_URL = "https://squads.xyz/multisig";

/** Default: 0.05 SOL — ops must set FOLIO_TREASURY_FUNDED=true explicitly too. */
const DEFAULT_SOL_THRESHOLD = 0.05;

function isPlausiblePubkey(s: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}

export function readSquadsVault(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const v = env["FOLIO_SQUADS_VAULT"]?.trim();
  return v && isPlausiblePubkey(v) ? v : null;
}

export function readTreasuryFundedFlag(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (env["FOLIO_TREASURY_FUNDED"] ?? "").trim().toLowerCase() === "true";
}

export async function fetchSquadsTreasuryStatus(
  env: NodeJS.ProcessEnv = process.env,
): Promise<AdapterResult<SquadsTreasurySnapshot>> {
  const source = "solana-rpc.getBalance+squads-vault";
  const vault = readSquadsVault(env);
  if (!vault) {
    return errResult(
      source,
      "squads_vault_unconfigured",
      "Set FOLIO_SQUADS_VAULT to a Squads vault/multisig pubkey · Altitude ops later",
    );
  }

  const rpc = resolveSolanaRpcUrl(env);
  const threshold = Number(env["FOLIO_TREASURY_SOL_THRESHOLD"] ?? DEFAULT_SOL_THRESHOLD);
  const solThreshold = Number.isFinite(threshold) && threshold > 0 ? threshold : DEFAULT_SOL_THRESHOLD;
  const treasuryFundedFlag = readTreasuryFundedFlag(env);

  try {
    const res = await fetch(rpc.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "folio-desk/0.1",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [vault, { commitment: "confirmed" }],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      return errResult(source, "squads_rpc_http", `HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      result?: { value?: number };
      error?: { message?: string };
    };
    if (json.error?.message) {
      return errResult(source, "squads_rpc_error", json.error.message);
    }
    const lamports = Number(json.result?.value);
    if (!Number.isFinite(lamports) || lamports < 0) {
      return errResult(source, "squads_balance_parse", "Missing lamports");
    }
    const sol = lamports / 1_000_000_000;
    const broadcastTreasuryReady = treasuryFundedFlag && sol >= solThreshold;

    return okResult("mainnet-read", source, {
      protocol: "Squads",
      vault,
      lamports,
      sol,
      treasuryFundedFlag,
      broadcastTreasuryReady,
      solThreshold,
      altitudeUrl: ALTITUDE_URL,
      squadsMultisigUrl: SQUADS_MULTISIG_URL,
      publicRpcFallback: rpc.publicFallback,
      note: broadcastTreasuryReady
        ? "Treasury flag + SOL threshold met · still requires user confirm / BROADCAST_PAUSED policy"
        : treasuryFundedFlag
          ? `FOLIO_TREASURY_FUNDED set but vault ${sol.toFixed(4)} SOL < ${solThreshold} threshold`
          : "Vault read live · FOLIO_TREASURY_FUNDED≠true · ≤~$1 broadcast stays off",
    });
  } catch (e) {
    return errResult(source, "squads_fetch_failed", String(e));
  }
}
