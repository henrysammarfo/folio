import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSessionBundle } from "@/lib/desk.functions";

function shortPubkey(pk: string): string {
  if (pk.length < 8) return pk;
  return `${pk.slice(0, 4)}…${pk.slice(-4)}`;
}

/**
 * Honest desk wallet chip — never invents a demo pubkey.
 * Prefers session wallet → watch-wallet → Settings bind CTA.
 */
export function DeskWalletPill() {
  const fetchSession = useServerFn(getSessionBundle);
  const { data } = useQuery({
    queryKey: ["session-bundle", "desk-wallet-pill"],
    queryFn: () => fetchSession(),
    staleTime: 30_000,
  });

  const sessionWallet =
    data?.session.ok && data.session.data.walletAddress
      ? data.session.data.walletAddress
      : null;
  const watchWallet = data?.watchWallet ?? null;
  const wallet = sessionWallet ?? watchWallet;
  const label = sessionWallet
    ? `Session ${shortPubkey(sessionWallet)}`
    : watchWallet
      ? `Watch ${shortPubkey(watchWallet)}`
      : null;

  if (wallet && label) {
    return (
      <Link
        to="/desk/settings"
        className="wallet-pill"
        title={
          sessionWallet
            ? "Privy session wallet (httpOnly)"
            : "Watch-wallet bind — not Privy multi-tenant auth"
        }
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      to="/desk/settings"
      className="wallet-pill"
      title="Bind watch-wallet or mint httpOnly session — no invented demo pubkey"
    >
      Bind wallet
    </Link>
  );
}
