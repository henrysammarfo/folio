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

export function DeskWalletPill() {
  const fetchSession = useServerFn(getSessionBundle);
  const { data } = useQuery({
    queryKey: ["session-bundle", "desk-wallet-pill"],
    queryFn: () => fetchSession(),
    staleTime: 30_000,
  });

  const membership =
    data?.session.ok ? activeMembership(data.session.data) : null;
  const { wallet } = resolveWalletBinding({
    membershipWallet: membership?.walletAddress ?? null,
    sessionWallet: data?.session.ok ? data.session.data.walletAddress : null,
    watchWallet: data?.watchWallet ?? null,
  });

  if (wallet) {
    return (
      <Link to="/desk/settings" className="fx-btn fx-btn-ghost fx-btn-sm" title="Account">
        {shortPubkey(wallet)}
      </Link>
    );
  }

  return (
    <Link to="/desk/settings" className="fx-btn fx-btn-ghost fx-btn-sm" title="Connect wallet">
      Connect
    </Link>
  );
}
