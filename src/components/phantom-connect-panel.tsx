import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { usePhantomShellReady } from "@/components/phantom-connect-shell";
import { isPlausibleSolanaAddress } from "@/components/wallet-lookup-panel";
import { bindWatchWallet } from "@/lib/desk.functions";

/**
 * Phantom Connect dual-path controls on Settings.
 * FOLIO session mint stays Privy — this only connects + optional watch-wallet bind.
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
        Phantom Connect
      </p>
      <p className="fx-sub" style={{ marginBottom: ".75rem" }}>
        Dual-path beside Privy. Injected extension works now
        {appIdConfigured
          ? "; embedded Google/Apple armed via PHANTOM_APP_ID."
          : "; embedded social needs PHANTOM_APP_ID (Portal new apps paused)."}{" "}
        Session mint stays Privy httpOnly.
      </p>
      {!shellReady ? (
        <p className="fx-sub">Phantom shell loading…</p>
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
    return <p className="fx-sub">{loadErr}</p>;
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
            Disconnect Phantom
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
          {busy ? " · binding watch-wallet…" : " · watch-wallet bind attempted"}
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
