import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { createSessionFromPrivyToken } from "@/lib/desk.functions";

type Props = {
  appId: string;
  mintReady: boolean;
  /** Exact origin Henry must allowlist (no *.vercel.app wildcards). */
  allowedOrigin: string;
  onMinted: () => Promise<void>;
};

/**
 * Client-only Privy login → getAccessToken → server mint httpOnly folio_session.
 * Never mounts App Secret; paste-token path remains as fallback.
 */
export function PrivySessionMint({
  appId,
  mintReady,
  allowedOrigin,
  onMinted,
}: Props) {
  if (!appId.trim()) return null;
  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: { theme: "dark", accentColor: "#c4b59a" },
        loginMethods: ["email", "wallet", "google"],
        embeddedWallets: { createOnLogin: "users-without-wallets" },
      }}
    >
      <PrivyMintInner
        mintReady={mintReady}
        allowedOrigin={allowedOrigin}
        onMinted={onMinted}
      />
    </PrivyProvider>
  );
}

function PrivyMintInner({
  mintReady,
  allowedOrigin,
  onMinted,
}: {
  mintReady: boolean;
  allowedOrigin: string;
  onMinted: () => Promise<void>;
}) {
  const { ready, authenticated, login, logout, getAccessToken, user } = usePrivy();
  const createSession = useServerFn(createSessionFromPrivyToken);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const autoMintedFor = useRef<string | null>(null);

  async function mintFromPrivy() {
    setBusy(true);
    setMsg("");
    try {
      const token = await getAccessToken();
      if (!token) {
        setMsg("privy_token_missing — getAccessToken returned empty");
        return;
      }
      const res = await createSession({ data: { accessToken: token } });
      if (res.ok) {
        setMsg(
          `Session bound for ${res.data.session.userId.slice(0, 16)}… — httpOnly cookie set. If tenants empty → Join folio-demo.`,
        );
        await onMinted();
      } else {
        setMsg(`${res.reason}${res.detail ? ` — ${res.detail}` : ""}`);
      }
    } finally {
      setBusy(false);
    }
  }

  // One-click path: after Privy login, auto-mint httpOnly folio_session once.
  useEffect(() => {
    if (!ready || !authenticated || !mintReady || busy) return;
    const uid = user?.id ?? "authed";
    if (autoMintedFor.current === uid) return;
    autoMintedFor.current = uid;
    void mintFromPrivy();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot on auth
  }, [ready, authenticated, mintReady, user?.id]);

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
