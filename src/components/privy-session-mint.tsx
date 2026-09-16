import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createSessionFromPrivyToken } from "@/lib/desk.functions";

type Props = {
  appId: string;
  mintReady: boolean;
  onMinted: () => Promise<void>;
};

/**
 * Client-only Privy login → getAccessToken → server mint httpOnly folio_session.
 * Never mounts App Secret; paste-token path remains as fallback.
 */
export function PrivySessionMint({ appId, mintReady, onMinted }: Props) {
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
      <PrivyMintInner mintReady={mintReady} onMinted={onMinted} />
    </PrivyProvider>
  );
}

function PrivyMintInner({
  mintReady,
  onMinted,
}: {
  mintReady: boolean;
  onMinted: () => Promise<void>;
}) {
  const { ready, authenticated, login, logout, getAccessToken, user } = usePrivy();
  const createSession = useServerFn(createSessionFromPrivyToken);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  return (
    <div className="mb-4 rounded-lg border border-ledger/30 bg-ink/40 p-3 text-sm">
      <b>Login with Privy (no paste)</b>
      <p className="mt-1 opacity-80">
        Uses public <code>PRIVY_APP_ID</code> only. After login, FOLIO verifies the access
        token server-side and sets httpOnly <code>folio_session</code>. Add this demo origin
        under Privy Dashboard → Settings → Allowed origins.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!authenticated ? (
          <button
            type="button"
            className="wallet-pill"
            disabled={!ready || !mintReady || busy}
            onClick={() => login()}
          >
            {!ready ? "Privy loading…" : !mintReady ? "Mint blocked · keys" : "Log in with Privy"}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="wallet-pill"
              disabled={!mintReady || busy}
              onClick={async () => {
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
                      `Session bound for ${res.data.session.userId.slice(0, 16)}… — httpOnly cookie set.`,
                    );
                    await onMinted();
                  } else {
                    setMsg(`${res.reason}${res.detail ? ` — ${res.detail}` : ""}`);
                  }
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Minting…" : "Mint httpOnly session from Privy login"}
            </button>
            <button
              type="button"
              className="wallet-pill"
              disabled={busy}
              onClick={() => void logout()}
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
