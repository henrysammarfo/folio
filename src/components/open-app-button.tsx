import { usePrivy } from "@privy-io/react-auth";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { usePrivyShellReady } from "@/components/privy-app-provider";
import { createSessionFromPrivyToken, getSessionBundle } from "@/lib/desk.functions";
import { activeMembership } from "@/lib/auth/role-gates";
import { resolveWalletBinding } from "@/lib/wallet-binding";

function shortPubkey(pk: string): string {
  if (pk.length < 8) return pk;
  return `${pk.slice(0, 4)}…${pk.slice(-4)}`;
}

/**
 * Header Open App / Connect — Privy modal (email smart wallet or external wallet).
 * Auto-mints httpOnly folio_session after Privy auth.
 */
export function OpenAppButton({
  className = "fx-btn fx-btn-dark fx-btn-sm",
}: {
  className?: string;
}) {
  const shellReady = usePrivyShellReady();
  const fetchSession = useServerFn(getSessionBundle);
  const { data, refetch } = useQuery({
    queryKey: ["session-bundle", "open-app"],
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

  const appId = data?.readiness.privyAppId?.trim() ?? "";
  const mintReady = Boolean(data?.auth.ok);

  if (wallet) {
    return (
      <Link to="/desk/settings" className={className} title="Account">
        {shortPubkey(wallet)}
      </Link>
    );
  }

  if (!appId || !shellReady) {
    return (
      <Link to="/desk/settings" className={className} title="Account">
        Open App
      </Link>
    );
  }

  return (
    <OpenAppPrivyControls
      className={className}
      mintReady={mintReady}
      onMinted={() => void refetch()}
    />
  );
}

function OpenAppPrivyControls({
  className,
  mintReady,
  onMinted,
}: {
  className: string;
  mintReady: boolean;
  onMinted: () => void;
}) {
  const { ready, authenticated, login, getAccessToken, user } = usePrivy();
  const createSession = useServerFn(createSessionFromPrivyToken);
  const [busy, setBusy] = useState(false);
  const autoMintedFor = useRef<string | null>(null);

  async function mintFromPrivy() {
    setBusy(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await createSession({ data: { accessToken: token } });
      if (res.ok) onMinted();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!ready || !authenticated || !mintReady || busy) return;
    const uid = user?.id ?? "authed";
    if (autoMintedFor.current === uid) return;
    autoMintedFor.current = uid;
    void mintFromPrivy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, mintReady, user?.id]);

  return (
    <button
      type="button"
      className={className}
      disabled={!ready || !mintReady || busy}
      onClick={() => {
        if (authenticated) void mintFromPrivy();
        else login();
      }}
      title="Open App — email wallet or connect Phantom"
    >
      {!ready
        ? "…"
        : !mintReady
          ? "Open App"
          : busy
            ? "Opening…"
            : authenticated
              ? "Sync session"
              : "Open App"}
    </button>
  );
}
