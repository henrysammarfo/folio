import { isLikelySolanaPubkey } from "./adapters/wallet-balances";

export type WalletBindingSource = "session" | "watch-wallet" | "inspect" | null;

/**
 * Pure wallet-binding priority: session → watch-wallet → ephemeral inspect.
 * Inspect is mainnet-read only — not auth, not multi-tenant, not persisted.
 */
export function resolveWalletBinding(input: {
  sessionWallet?: string | null;
  watchWallet?: string | null;
  inspectWallet?: string | null;
}): { wallet: string | null; source: WalletBindingSource } {
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
