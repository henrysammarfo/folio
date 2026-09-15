import { isLikelySolanaPubkey } from "./adapters/wallet-balances";

export type WalletBindingSource =
  | "membership"
  | "session"
  | "watch-wallet"
  | "inspect"
  | null;

/**
 * Pure wallet-binding priority:
 * active-tenant membership wallet → session Privy wallet → watch-wallet → ephemeral inspect.
 * Membership wallet is tenant-scoped truth when present — never invent a foreign pubkey.
 * Inspect is mainnet-read only — not auth, not multi-tenant, not persisted.
 */
export function resolveWalletBinding(input: {
  membershipWallet?: string | null;
  sessionWallet?: string | null;
  watchWallet?: string | null;
  inspectWallet?: string | null;
}): { wallet: string | null; source: WalletBindingSource } {
  const membershipWallet = input.membershipWallet?.trim() ?? "";
  if (membershipWallet && isLikelySolanaPubkey(membershipWallet)) {
    return { wallet: membershipWallet, source: "membership" };
  }
  const sessionWallet = input.sessionWallet?.trim() ?? "";
  if (sessionWallet && isLikelySolanaPubkey(sessionWallet)) {
    return { wallet: sessionWallet, source: "session" };
  }
  const watchWallet = input.watchWallet?.trim() ?? "";
  if (watchWallet && isLikelySolanaPubkey(watchWallet)) {
    return { wallet: watchWallet, source: "watch-wallet" };
  }
  const inspectWallet = input.inspectWallet?.trim() ?? "";
  if (inspectWallet && isLikelySolanaPubkey(inspectWallet)) {
    return { wallet: inspectWallet, source: "inspect" };
  }
  return { wallet: null, source: null };
}
