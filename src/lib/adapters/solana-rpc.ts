/**
 * Resolve Solana JSON-RPC for mainnet-read adapters.
 * Prefers SOLANA_RPC_URL; falls back to public mainnet (rate-limited) so
 * Vercel demos can read Scaled UI / balances without a private RPC key.
 * Still fail-closed on RPC errors — never invent chain data.
 */
export const PUBLIC_SOLANA_MAINNET_RPC = "https://api.mainnet-beta.solana.com";

export type SolanaRpcEndpoint = {
  url: string;
  /** true when using the public fallback (no SOLANA_RPC_URL). */
  publicFallback: boolean;
};

export function resolveSolanaRpcUrl(
  env: NodeJS.ProcessEnv = process.env,
): SolanaRpcEndpoint {
  const configured = env["SOLANA_RPC_URL"]?.trim();
  if (configured) {
    return { url: configured, publicFallback: false };
  }
  return { url: PUBLIC_SOLANA_MAINNET_RPC, publicFallback: true };
}
