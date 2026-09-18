import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSessionBundle } from "@/lib/desk.functions";
import { activeMembership } from "@/lib/auth/role-gates";
import { resolveWalletBinding } from "@/lib/wallet-binding";

function shortPubkey(pk: string): string {
  if (pk.length < 8) return pk;
  return `${pk.slice(0, 4)}…${pk.slice(-4)}`;
}

/**
 * Honest desk wallet chip — never invents a demo pubkey.
 * Priority: membership → session → watch-wallet → Settings bind CTA.
 */
export function DeskWalletPill() {
  const fetchSession = useServerFn(getSessionBundle);
  const { data } = useQuery({
    queryKey: ["session-bundle", "desk-wallet-pill"],
    queryFn: () => fetchSession(),
    staleTime: 30_000,
  });

  const membership =
    data?.session.ok ? activeMembership(data.session.data) : null;
  const { wallet, source } = resolveWalletBinding({
    membershipWallet: membership?.walletAddress ?? null,
    sessionWallet:
      data?.session.ok ? data.session.data.walletAddress : null,
    watchWallet: data?.watchWallet ?? null,
  });

  if (wallet && source) {
    const prefix =
      source === "membership"
        ? "Wallet"
        : source === "session"
          ? "Wallet"
          : "Wallet";
    const title =
      source === "membership"
        ? "Connected wallet"
        : source === "session"
          ? "Connected wallet"
          : "Connected wallet";
    return (
      <Link to="/desk/settings" className="wallet-pill" title={title}>
        {prefix} {shortPubkey(wallet)}
      </Link>
    );
  }

  return (
    <Link
      to="/desk/settings"
      className="wallet-pill"
      title="Connect your wallet in Settings"
    >
      Connect wallet
    </Link>
  );
}
