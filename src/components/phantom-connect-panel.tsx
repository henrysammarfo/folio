import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { usePhantomShellReady } from "@/components/phantom-connect-shell";
import { isPlausibleSolanaAddress } from "@/components/wallet-lookup-panel";
import { bindWatchWallet } from "@/lib/desk.functions";

/**
 * Phantom wallet connect on Account — consumer copy.
 * FOLIO session still uses Privy when you Open App / sign in.
 */
export function PhantomConnectPanel({
  appIdConfigured,
}: {
  appIdConfigured: boolean;
}) {
  const shellReady = usePhantomShellReady();

  return (
    <div className="fx-card fx-card-pad" data-testid="phantom-connect-panel">
      <p className="fx-section-title" style={{ marginBottom: ".35rem" }}>
        Phantom wallet
      </p>
      <p className="fx-sub" style={{ marginBottom: ".75rem" }}>
        Connect Phantom to trade and save a watch wallet.
        {appIdConfigured
          ? " Google and Apple sign-in are ready too."
          : " Extension works now. Email style sign-in needs a Phantom App ID when Portal lets you create one."}
      </p>
      {!shellReady ? (
        <p className="fx-sub">Getting Phantom ready…</p>
      ) : (
        <PhantomConnectActions preferInjected={!appIdConfigured} />
      )}
    </div>
  );
}

function PhantomConnectActions({ preferInjected }: { preferInjected: boolean }) {
  const [mod, setMod] = useState<typeof import("@phantom/react-sdk") | null>(
    null,
  );
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    void import("@phantom/react-sdk")
      .then(setMod)
      .catch((e: unknown) => setLoadErr(String(e)));
  }, []);

  if (loadErr) {
    return <p className="fx-sub">Phantom could not load. Refresh and try again.</p>;
  }
  if (!mod) {
    return (
      <button type="button" className="fx-btn fx-btn-ghost" disabled>
        Loading Phantom…
      </button>
    );
  }
  return <PhantomConnectActionsInner mod={mod} preferInjected={preferInjected} />;
}

function PhantomConnectActionsInner({
  mod,
  preferInjected,
}: {
  mod: typeof import("@phantom/react-sdk");
  preferInjected: boolean;
}) {
  const bind = useServerFn(bindWatchWallet);
  const { connect, isConnecting } = mod.useConnect();
  const { disconnect } = mod.useDisconnect();
  const { isConnected, addresses } = mod.usePhantom();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pubkey, setPubkey] = useState<string | null>(null);

  useEffect(() => {
    const sol = addresses?.find(
      (a) =>
        String(a.addressType ?? "").toLowerCase().includes("sol") ||
        isPlausibleSolanaAddress(a.address ?? ""),
    );
    if (sol?.address) setPubkey(sol.address);
  }, [addresses]);

  async function bindIfNeeded(address: string) {
    setPubkey(address);
    if (!isPlausibleSolanaAddress(address)) return;
    setBusy(true);
    try {
      await bind({ data: { wallet: address } });
      setErr(null);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="fx-actions" style={{ marginTop: 0 }}>
        {!isConnected ? (
          <button
            type="button"
            className="fx-btn fx-btn-primary"
            data-testid="phantom-connect-btn"
            disabled={isConnecting}
            onClick={() => {
              setErr(null);
              void connect({
                provider: preferInjected ? "injected" : "google",
              })
                .then((res) => {
                  const sol = res.addresses?.find((a) =>
                    String(a.addressType ?? "")
                      .toLowerCase()
                      .includes("sol"),
                  );
                  const addr = sol?.address ?? res.addresses?.[0]?.address;
                  if (addr) void bindIfNeeded(addr);
                })
                .catch((e: unknown) => setErr(String(e)));
            }}
          >
            {isConnecting ? "Connecting…" : "Connect Phantom"}
          </button>
        ) : (
          <button
            type="button"
            className="fx-btn fx-btn-ghost"
            onClick={() => {
              void disconnect().catch((e: unknown) => setErr(String(e)));
              setPubkey(null);
            }}
          >
            Disconnect
          </button>
        )}
        {!preferInjected ? (
          <button
            type="button"
            className="fx-btn fx-btn-ghost"
            onClick={() => {
              setErr(null);
              void connect({ provider: "injected" })
                .then((res) => {
                  const addr = res.addresses?.[0]?.address;
                  if (addr) void bindIfNeeded(addr);
                })
                .catch((e: unknown) => setErr(String(e)));
            }}
          >
            Use extension
          </button>
        ) : null}
      </div>
      {pubkey ? (
        <p className="fx-sub" style={{ marginTop: ".5rem" }} data-testid="phantom-pubkey">
          Connected {pubkey.slice(0, 4)}…{pubkey.slice(-4)}
          {busy ? " · saving…" : " · ready to trade"}
        </p>
      ) : null}
      {err ? (
        <p className="fx-sub" style={{ marginTop: ".35rem", color: "#b45309" }}>
          {err}
        </p>
      ) : null}
    </>
  );
}
