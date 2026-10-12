import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { usePrivyShellReady } from "@/components/privy-app-provider";
import { createSessionFromPrivyToken } from "@/lib/desk.functions";

type Props = {
  appId: string;
  mintReady: boolean;
  /** Exact origin Henry must allowlist (no *.vercel.app wildcards). */
  allowedOrigin: string;
  onMinted: () => Promise<void>;
  /** Consumer Account hides ops jargon; ops wall keeps setup copy. */
  variant?: "consumer" | "ops";
};

/**
 * Client-only Privy login → getAccessToken → server mint httpOnly folio_session.
 * Expects desk-wide PrivyAppProvider (no nested PrivyProvider).
 * Never mounts App Secret; paste-token path remains as fallback on ops wall.
 */
export function PrivySessionMint({
  appId,
  mintReady,
  allowedOrigin,
  onMinted,
  variant = "ops",
}: Props) {
  const shellReady = usePrivyShellReady();
  if (!appId.trim() || !shellReady) return null;
  return (
    <PrivyMintInner
      mintReady={mintReady}
      allowedOrigin={allowedOrigin}
      onMinted={onMinted}
      variant={variant}
    />
  );
}

function PrivyMintInner({
  mintReady,
  allowedOrigin,
  onMinted,
  variant,
}: {
  mintReady: boolean;
  allowedOrigin: string;
  onMinted: () => Promise<void>;
  variant: "consumer" | "ops";
}) {
  const { ready, authenticated, login, logout, getAccessToken, user } = usePrivy();
  const { wallets } = useWallets();
  const createSession = useServerFn(createSessionFromPrivyToken);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  /** Track last mint key so we remint once when Solana wallet appears after email login. */
  const autoMintedFor = useRef<string | null>(null);

  async function mintFromPrivy() {
    setBusy(true);
    setMsg("");
    try {
      const token = await getAccessToken();
      if (!token) {
        setMsg(
          variant === "consumer"
            ? "Sign-in didn’t return a token. Try again."
            : "privy_token_missing — getAccessToken returned empty",
        );
        return;
      }
      // Bind Solana embedded / linked wallet so Account + gas gates resolve.
      const walletAddress = wallets[0]?.address;
      const res = await createSession({
        data: {
          accessToken: token,
          ...(walletAddress ? { walletAddress } : {}),
        },
      });
      if (res.ok) {
        setMsg(
          variant === "consumer"
            ? walletAddress
              ? "Signed in · wallet linked."
              : "Signed in."
            : `Session bound for ${res.data.session.userId.slice(0, 16)}… — httpOnly cookie set. If tenants empty → Join folio-demo.`,
        );
        await onMinted();
      } else {
        setMsg(
          variant === "consumer"
            ? "Couldn’t sign in. Try again."
            : `${res.reason}${res.detail ? ` — ${res.detail}` : ""}`,
        );
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!ready || !authenticated || !mintReady || busy) return;
    const uid = user?.id ?? "authed";
    const walletAddress = wallets[0]?.address ?? "";
    const key = `${uid}:${walletAddress}`;
    if (autoMintedFor.current === key) return;
    // Allow one remint when wallet address arrives after email create-on-login.
    if (
      autoMintedFor.current?.startsWith(`${uid}:`) &&
      !walletAddress
    ) {
      return;
    }
    autoMintedFor.current = key;
    void mintFromPrivy();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remint when Solana wallet binds
  }, [ready, authenticated, mintReady, user?.id, wallets[0]?.address]);

  if (variant === "consumer") {
    return (
      <div className="fx-signin">
        {!authenticated ? (
          <button
            type="button"
            className="fx-btn fx-btn-primary"
            disabled={!ready || !mintReady || busy}
            onClick={() => login()}
          >
            {!ready
              ? "Loading…"
              : !mintReady
                ? "Sign-in unavailable"
                : busy
                  ? "Signing in…"
                  : "Open App"}
          </button>
        ) : (
          <button
            type="button"
            className="fx-text-btn"
            disabled={busy}
            onClick={() => {
              autoMintedFor.current = null;
              void logout();
            }}
          >
            Disconnect sign-in
          </button>
        )}
        {msg ? <p className="fx-sub">{msg}</p> : null}
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-ledger/30 bg-ink/40 p-3 text-sm">
      <b>Login with Privy → auto-mint session</b>
      <p className="mt-1 opacity-80">
        Public <code>PRIVY_APP_ID</code> only. After login, FOLIO verifies the token
        server-side and sets httpOnly <code>folio_session</code>.
      </p>
      <p className="mt-2 opacity-90">
        <b>DO NOW · Allowed origins</b> — Privy Dashboard → Configuration → App settings →
        Domains → paste exactly:
      </p>
      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs opacity-90">
        {allowedOrigin}
      </pre>
      <p className="mt-1 text-xs opacity-70">
        Privy rejects <code>*.vercel.app</code> wildcards. Use this git alias origin (or{" "}
        <code>https://*.teamtitanlink.vercel.app</code> if your team owns that suffix).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!authenticated ? (
          <button
            type="button"
            className="wallet-pill"
            disabled={!ready || !mintReady || busy}
            onClick={() => login()}
          >
            {!ready
              ? "Privy loading…"
              : !mintReady
                ? "Mint blocked · keys"
                : "Log in with Privy (auto-mints)"}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="wallet-pill"
              disabled={!mintReady || busy}
              onClick={() => void mintFromPrivy()}
            >
              {busy ? "Minting…" : "Re-mint httpOnly session"}
            </button>
            <button
              type="button"
              className="wallet-pill"
              disabled={busy}
              onClick={() => {
                autoMintedFor.current = null;
                void logout();
              }}
            >
              Log out Privy
            </button>
          </>
        )}
      </div>
      {authenticated && user?.id ? (
        <p className="mt-2 opacity-70">
          Privy DID <code>{user.id.slice(0, 24)}…</code>
        </p>
      ) : null}
      {msg ? <p className="mt-2">{msg}</p> : null}
    </div>
  );
}
